import os
import json
import time
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

# Initialize Gemini Client (use default v1beta API for gemini-2.5-flash)
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
    """Filter headlines using Gemini 1.5 Flash (titles only) - 1 API call total"""
    if not headlines:
        return []
    
    prompt = "Filter the following news headlines. Return only the array indices (0-based) of stories that are highly relevant to: Indian Economy, Govt Capex, Fiscal Policy, RBI, Geopolitics, US-China relations, Global Macroeconomics, Climate Change, or AI Research.\n\nHeadlines:\n"
    for i, h in enumerate(headlines):
        prompt += f"[{i}] {h['source']}: {h['headline']}\n"
    
    prompt += "\nRespond strictly with a JSON list of integers. Return at most 4 indices, the most impactful ones only."
    
    response = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            break
        except Exception as e:
            if '429' in str(e) and attempt < 2:
                wait = 30 * (attempt + 1)
                print(f"Rate limited. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"Stage 1 filter failed: {e}")
                return []
    
    if response is None:
        print("Stage 1: No response from Gemini.")
        return []

    print(f"Stage 1 raw response: {response.text[:300]}")
    try:
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        if text.startswith("```"):
            text = text[3:-3].strip()
        indices = json.loads(text)
        # Cap at 4 to safely stay under the 5 RPM free tier limit for Stage 2
        result = [headlines[i] for i in indices[:4] if i < len(headlines)]
        print(f"Stage 1 selected {len(result)} articles from {len(headlines)} headlines.")
        return result
    except Exception as e:
        print(f"Error parsing filter response: {e}. Raw text: {response.text[:200]}")
        return []

def stage_2_summary(article):
    """Generate the structured summary for an article - 1 Gemini API call per article"""
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
    
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            break
        except Exception as e:
            if '429' in str(e) and attempt < 2:
                wait = 65 * (attempt + 1)  # Wait >60s to reset the 1-minute window
                print(f"Stage 2 rate limited. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"Stage 2 summary failed: {e}")
                return None
    else:
        return None  # All retries exhausted
    
    try:
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        result = json.loads(text)
        return result
    except Exception as e:
        print(f"Error generating summary: {e}")
        return None

def get_existing_urls():
    """Fetch all story URLs currently in Firestore to avoid re-processing."""
    existing = set()
    docs = db.collection("stories").stream()
    for doc in docs:
        url = doc.to_dict().get("url")
        if url:
            existing.add(url)
    return existing

def run_pipeline():
    # 1. Fetch Headlines (no API cost - free RSS + 1 NewsData call)
    rss_headlines = fetch_rss_headlines()
    print(f"RSS: fetched {len(rss_headlines)} headlines.")
    api_headlines = fetch_newsdata_headlines()
    print(f"NewsData: fetched {len(api_headlines)} headlines.")
    all_headlines = rss_headlines + api_headlines
    
    # 2. Load existing URLs to skip already-processed stories (deduplication)
    existing_urls = get_existing_urls()
    new_headlines = [h for h in all_headlines if h.get("url") not in existing_urls]
    print(f"Total: {len(all_headlines)} headlines. New (not yet stored): {len(new_headlines)}")
    
    if not new_headlines:
        print("No new stories. Skipping Gemini API calls.")
        return

    # 3. Stage 1: 1 Gemini call to pick top 10 of all new headlines
    filtered = stage_1_filter(new_headlines)
    
    now = datetime.datetime.now(datetime.timezone.utc)
    expires_at = now + datetime.timedelta(hours=72)
    
    # 4. Stage 2: 1 Gemini call per filtered article (max 4, with 15s delay between calls)
    saved = 0
    for i, item in enumerate(filtered):
        if i > 0:
            time.sleep(15)  # Stay under 5 RPM free tier limit
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
            saved += 1
    
    # 5. Cleanup expired stories
    stories_ref = db.collection("stories")
    expired_query = stories_ref.where(filter=firestore.FieldFilter("expires_at", "<", now))
    expired_docs = expired_query.stream()
    deleted = 0
    for doc in expired_docs:
        doc.reference.delete()
        deleted += 1
        
    print(f"Done. Saved {saved} new stories, deleted {deleted} expired stories.")
    print(f"Gemini API calls used this run: {len(filtered) + 1} (1 filter + {len(filtered)} summaries)")

# --- Curated 40-concept curriculum (cycling by day of year) ---
CURRICULUM = [
    # MACRO track
    {"track": "MACRO", "concept": "Repo Rate"},
    {"track": "MACRO", "concept": "Reverse Repo Rate"},
    {"track": "MACRO", "concept": "Fiscal Deficit"},
    {"track": "MACRO", "concept": "Current Account Deficit"},
    {"track": "MACRO", "concept": "Inflation Targeting"},
    {"track": "MACRO", "concept": "CPI vs WPI"},
    {"track": "MACRO", "concept": "GDP Growth Accounting"},
    {"track": "MACRO", "concept": "Multiplier Effect"},
    {"track": "MACRO", "concept": "Liquidity Adjustment Facility"},
    {"track": "MACRO", "concept": "Open Market Operations"},
    # MARKETS track
    {"track": "MARKETS", "concept": "P/E Ratio"},
    {"track": "MARKETS", "concept": "Bond Yield and Price Relationship"},
    {"track": "MARKETS", "concept": "FII and DII Flows"},
    {"track": "MARKETS", "concept": "Yield Curve"},
    {"track": "MARKETS", "concept": "Circuit Breakers in Equity Markets"},
    {"track": "MARKETS", "concept": "Rupee Carry Trade"},
    {"track": "MARKETS", "concept": "Mark to Market"},
    {"track": "MARKETS", "concept": "Futures and Options Basics"},
    {"track": "MARKETS", "concept": "VIX — Volatility Index"},
    {"track": "MARKETS", "concept": "Short Selling"},
    # POLICY track
    {"track": "POLICY", "concept": "Capital Gains Tax"},
    {"track": "POLICY", "concept": "GST Structure in India"},
    {"track": "POLICY", "concept": "FDI vs FPI"},
    {"track": "POLICY", "concept": "SEBI's Role in Market Regulation"},
    {"track": "POLICY", "concept": "RBI's Monetary Policy Committee"},
    {"track": "POLICY", "concept": "Government Capital Expenditure"},
    {"track": "POLICY", "concept": "PLI Scheme"},
    {"track": "POLICY", "concept": "India's External Debt"},
    {"track": "POLICY", "concept": "Sovereign Credit Rating"},
    {"track": "POLICY", "concept": "FEMA and Capital Controls"},
    # GLOBAL track
    {"track": "GLOBAL", "concept": "US Federal Reserve and Its Global Impact"},
    {"track": "GLOBAL", "concept": "Dollar Index (DXY)"},
    {"track": "GLOBAL", "concept": "Petrodollar System"},
    {"track": "GLOBAL", "concept": "IMF Special Drawing Rights"},
    {"track": "GLOBAL", "concept": "Trade Deficit and Surplus"},
    {"track": "GLOBAL", "concept": "Purchasing Power Parity"},
    {"track": "GLOBAL", "concept": "Carbon Credits and Carbon Markets"},
    {"track": "GLOBAL", "concept": "Semiconductor Supply Chain"},
    {"track": "GLOBAL", "concept": "De-dollarisation Debate"},
    {"track": "GLOBAL", "concept": "Sovereign Wealth Funds"},
]

def has_lesson_today():
    """Check if a lesson was already generated in the last 11 hours (allows 2 per day)."""
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=11)
    lessons = db.collection("learn").where(
        filter=firestore.FieldFilter("generated_at", ">=", cutoff)
    ).limit(1).stream()
    return any(True for _ in lessons)

def generate_daily_lesson():
    """Generate one concept lesson per day and store in Firestore `learn` collection."""
    if has_lesson_today():
        print("Lesson already generated today. Skipping.")
        return

    # Pick today's concept by cycling through the curriculum
    day_of_year = datetime.datetime.now(datetime.timezone.utc).timetuple().tm_yday
    entry = CURRICULUM[day_of_year % len(CURRICULUM)]
    week_number = (day_of_year // 7) + 1

    print(f"Generating lesson: {entry['track']} — {entry['concept']}")

    prompt = f"""
You are a financial educator writing for a smart Indian reader who understands the news but wants to learn the underlying concepts.

Write a structured lesson on the concept: "{entry['concept']}" (Track: {entry['track']})

Follow these rules:
- Write for someone who reads The Economist and follows Indian markets.
- Be precise, analytical, and concise. No filler.
- Each section should be 2-4 sentences.

Respond in valid JSON with exactly this structure:
{{
    "concept_title": "{entry['concept']}",
    "track": "{entry['track']}",
    "definition": "A precise 2-sentence definition of what this concept is.",
    "how_it_works": "Explain the mechanism — what drives it and how it behaves.",
    "practitioner_use": "How investors, analysts, or policymakers actually use this concept.",
    "example": "A concrete real-world example from India or global markets.",
    "india_angle": "How this concept specifically manifests or matters in the Indian economic context.",
    "key_metrics": "2-3 specific data points or indicators practitioners track for this concept.",
    "misconception": "The single most common misunderstanding about this concept, and why it's wrong."
}}
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        if text.startswith("```"):
            text = text[3:-3].strip()

        data = json.loads(text)
        doc_id = str(uuid.uuid4())
        db.collection("learn").document(doc_id).set({
            "id": doc_id,
            "track": data.get("track", entry["track"]),
            "concept_title": data.get("concept_title", entry["concept"]),
            "definition": data.get("definition", ""),
            "how_it_works": data.get("how_it_works", ""),
            "practitioner_use": data.get("practitioner_use", ""),
            "example": data.get("example", ""),
            "india_angle": data.get("india_angle", ""),
            "key_metrics": data.get("key_metrics", ""),
            "misconception": data.get("misconception", ""),
            "week_number": week_number,
            "generated_at": datetime.datetime.now(datetime.timezone.utc)
        })
        print(f"Success: Lesson created for {entry['concept']}")
    except Exception as e:
        print(f"Error in generate_daily_lesson: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_pipeline()
    time.sleep(15)  # Pause before lesson call to respect rate limits
    generate_daily_lesson()
