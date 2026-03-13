import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

def check_data():
    # Attempt to load service account key from env if available, else local
    key_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if key_json:
        try:
            cred_dict = json.loads(key_json)
            cred = credentials.Certificate(cred_dict)
        except Exception:
            cred = credentials.Certificate("serviceAccountKey.json")
    else:
        cred = credentials.Certificate("serviceAccountKey.json")

    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("--- Firestore Diagnostics ---")
    
    # Check Stories
    stories_ref = db.collection("stories")
    stories = list(stories_ref.limit(20).stream())
    print(f"Stories (sampled {len(stories)}):")
    for s in stories:
        data = s.to_dict()
        print(f"- [{data.get('section')}] {data.get('topic_tag')}: {data.get('headline')[:50]}...")
    
    # Check current distribution
    all_stories = stories_ref.stream()
    tags = {}
    for s in all_stories:
        tag = s.to_dict().get('topic_tag', 'MISSING')
        tags[tag] = tags.get(tag, 0) + 1
    print("\nTag distribution:")
    for tag, count in tags.items():
        print(f"  {tag}: {count}")

if __name__ == "__main__":
    check_data()
