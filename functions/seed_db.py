import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone, timedelta
import random

# Initialize Firebase (uses Application Default Credentials if available)
try:
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {'projectId': 'newsroom-dashbored-26'})
except Exception as e:
    print(f"Auth error: {e}")
    # Fallback to no credentials, hoping gcloud is authenticated
    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={'projectId': 'newsroom-dashbored-26'})

db = firestore.client()

# Sample Stories
stories = [
    {
        "headline": "Gemini 1.5 Pro Available Globally",
        "summary": "Google has expanded the availability of Gemini 1.5 Pro to all developers worldwide via the API. This matters because it dramatically lowers the barrier to entry for building complex, multimodal applications. Keep an eye on pricing updates and token limit changes as the rollout continues.",
        "watch_for": "New integration announcements from major enterprise partners.",
        "source": "TechCrunch",
        "link": "https://techcrunch.com",
        "topic": "Technology",
        "section": "International",
        "category": "Technology",
        "urgency": "High",
        "fetched_at": datetime.now(timezone.utc)
    },
    {
        "headline": "RBI Keeps Repo Rate Unchanged at 6.5%",
        "summary": "The Monetary Policy Committee voted to maintain the status quo on interest rates, citing sticky inflation and resilient economic growth. This sustains the current borrowing costs for consumers and businesses. Watch for the next inflation data release which could trigger a shift in stance.",
        "watch_for": "Retail inflation figures for the upcoming quarter.",
        "source": "The Hindu",
        "link": "https://thehindu.com",
        "topic": "Economy",
        "section": "India",
        "category": "Finance",
        "urgency": "Medium",
        "fetched_at": datetime.now(timezone.utc) - timedelta(hours=2)
    },
    {
        "headline": "ISRO Successfully Launches New Weather Satellite",
        "summary": "India's space agency has deployed INSAT-3DS into its intended orbit, aiming to enhance meteorological observations. This launch is crucial for improving weather forecasting and disaster warning capabilities across the subcontinent. Watch for data integration updates from the IMD over the next month.",
        "watch_for": "First images and calibration data from the satellite payloads.",
        "source": "Indian Express",
        "link": "https://indianexpress.com",
        "topic": "Science",
        "section": "India",
        "category": "Science",
        "urgency": "Low",
        "fetched_at": datetime.now(timezone.utc) - timedelta(hours=25) # Yesterday
    }
]

# Sample Lesson
lesson_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
lesson = {
    "topic": "Understanding Bonds",
    "content": "Bonds are fixed-income instruments that represent a loan made by an investor to a borrower (typically corporate or governmental).\n\n**Why it matters:** They offer a predictable income stream and are generally considered safer than stocks, helping to diversify a portfolio.\n\n**Key takeaways:** Understand the relationship between interest rates and bond prices—they move inversely. When rates go up, existing bond prices go down.",
    "created_at": datetime.now(timezone.utc)
}

print("Seeding database...")

# Add Stories
for story in stories:
    doc_ref = db.collection('stories').document()
    doc_ref.set(story)
    print(f"Added story: {story['headline']}")

# Add Lesson
db.collection('learn').document(lesson_date).set(lesson)
print(f"Added lesson for date: {lesson_date}")

print("Seeding complete!")
