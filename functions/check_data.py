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
    stories_count = len(list(stories_ref.limit(10).stream()))
    print(f"Stories (first 10): {stories_count} documents found.")
    
    # Check Learn
    learn_ref = db.collection("learn")
    learn_count = len(list(learn_ref.limit(10).stream()))
    print(f"Learn (first 10): {learn_count} documents found.")
    
    if learn_count == 0:
        print("WARNING: 'learn' collection is empty!")
    else:
        print("Success: 'learn' collection has data.")

if __name__ == "__main__":
    check_data()
