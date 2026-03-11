import os
import json
import datetime
import uuid
import feedparser
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from google import genai
from google.genai import types

# Initialize Firebase Admin SDK using Service Account from Environment
firebase_key_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
if firebase_key_json:
    cred_dict = json.loads(firebase_key_json)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
else:
    # Fallback for local testing if ADC is configured
    firebase_admin.initialize_app()

db = firestore.client()

# Environment variables (to be set in Firebase Secret Manager or .env)
NEWSDATA_API_KEY = os.environ.get("NEWSDATA_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not NEWSDATA_API_KEY or not GEMINI_API_KEY:
    raise EnvironmentError("Missing required environment variables: NEWSDATA_API_KEY and/or GEMINI_API_KEY")

# Initialize Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

INDIAN_RSS_FEEDS = {
    "The Hindu": "https://www.thehindu.com/business/feed/",
    "Indian Express": "https://indianexpress.com/section/business/feed/",
    "Mint": "https://www.livemint.com/rss/news"
}

def fetch_rss_headlines():
    headlines = []
    for source, url in INDIAN_RSS_FEEDS.items():
        feed = feedparser.parse(url)
        for entry in feed.entries[:10]: # Get top 10 from each
            headlines.append({
                "source": source,
                "headline": entry.title,
                "url": entry.link,
                "publishedAt": getattr(entry, 'published', datetime.datetime.now().isoformat())
            })
    return headlines

def fetch_newsdata_headlines():
    # Fetch global/India news using NewsData.io
    url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&country=in,us&language=en&category=politics,technology,business,world"
    try:
        response = requests.get(url)
        data = response.json()
        headlines = []
        if data.get("status") == "success":
            for article in data.get("results", [])[:20]:
                headlines.append({
                    "source": article.get("source_id", "NewsData"),
                    "headline": article.get("title"),
                    "url": article.get("link"),
                    "publishedAt": article.get("pubDate")
                })
        return headlines
    except Exception as e:
        print(f"Error fetching newsdata: {e}")
        return []

def stage_1_filter(headlines):
    """Filter headlines using Gemini 1.5 Flash (titles only)"""
    if not headlines:
        return []
    
    prompt = "Filter the following news headlines. Return only the array indices (0-based) of stories that are highly relevant to: Indian Economy, Govt Capex, Fiscal Policy, RBI, Geopolitics, US-China relations, Global Macroeconomics, Climate Change, or AI Research.\n\nHeadlines:\n"
    for i, h in enumerate(headlines):
        prompt += f"[{i}] {h['source']}: {h['headline']}\n"
    
    prompt += "\nRespond strictly with a JSON list of integers."
    
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    
    try:
        import json
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        indices = json.loads(text)
        return [headlines[i] for i in indices if i < len(headlines)]
    except Exception as e:
        print(f"Error parsing filter response: {e}")
        return []

def stage_2_summary(article):
    """Generate the structured summary for an article"""
    # In a real app we'd scrape the full text of `article['url']`.
    # For cost/speed we'll just ask Gemini to summarize based on the title if full text unavailable.
    prompt = f"""
    You are an editorial analyst writing for a single informed reader.
    Your job is to produce a structured summary of this news article based on its headline:
    Headline: {article['headline']}
    Source: {article['source']}
    
    WRITING STYLE RULES — follow exactly:
    - One paragraph only. 3-4 sentences maximum.
    - Neutral and objective. No advocacy, no alarm, no cheerleading.
    - Analytical: state what happened, why it matters, what to watch.
    - No filler phrases: avoid 'it is worth noting', 'importantly'.
    - Write as if briefing a financially literate adult who reads The Economist and follows Indian markets.
    - End with one forward-looking observation: what the next development to watch for is.
    
    Respond in valid JSON with exactly this format:
    {{
        "section": "INDIA or INTERNATIONAL",
        "topic_tag": "CAPEX/FISCAL/MARKETS/MONETARY/EARNINGS/GEOPOLITICS/INDIA-FOREIGN/GLOBAL-ECON/CLIMATE/AI-RESEARCH",
        "display_label": "Human readable label",
        "summary": "1 paragraph summary",
        "watch_for": "The forward looking watch point"
    }}
    """
    
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    
    try:
        import json
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        result = json.loads(text)
        return result
    except Exception as e:
        print(f"Error generating summary: {e}")
        return None

def run_pipeline():
    # 1. Fetch Headlines
    rss_headlines = fetch_rss_headlines()
    api_headlines = fetch_newsdata_headlines()
    all_headlines = rss_headlines + api_headlines
    
    # 2. Stage 1: Filter
    filtered = stage_1_filter(all_headlines)
    
    now = datetime.datetime.now(datetime.timezone.utc)
    expires_at = now + datetime.timedelta(hours=72)
    
    # 3. Stage 2: Summarize and Write
    for item in filtered:
        summary_data = stage_2_summary(item)
        if summary_data:
            doc_id = str(uuid.uuid4())
            doc_ref = db.collection("stories").document(doc_id)
            
            doc_data = {
                "id": doc_id,
                "section": summary_data.get("section", "INDIA"),
                "topic_tag": summary_data.get("topic_tag", "UNKNOWN"),
                "display_label": summary_data.get("display_label", item["source"]),
                "headline": item["headline"],
                "source": item["source"],
                "url": item["url"],
                "summary": summary_data.get("summary", ""),
                "watch_for": summary_data.get("watch_for", ""),
                "fetched_at": now,
                "expires_at": expires_at
            }
            doc_ref.set(doc_data)
    
    # Cleanup expired stories
    stories_ref = db.collection("stories")
    expired_query = stories_ref.where(filter=firestore.FieldFilter("expires_at", "<", now))
    expired_docs = expired_query.stream()
    for doc in expired_docs:
        doc.reference.delete()
        
    print(f"Processed and stored {len(filtered)} stories.")
    # MCP Push happens locally or via a separate script for now, as Cloud Functions can't reach the local IDE MCP.

if __name__ == "__main__":
    run_pipeline()
