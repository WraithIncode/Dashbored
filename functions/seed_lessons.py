import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone, timedelta
import uuid
import os
import json

def seed_lessons():
    # Auth Logic
    key_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if key_json:
        try:
            cred_dict = json.loads(key_json)
            cred = credentials.Certificate(cred_dict)
        except Exception:
            cred = credentials.Certificate("serviceAccountKey.json")
    else:
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
        else:
            print("Error: serviceAccountKey.json not found. Run this where your key is located.")
            return

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()

    starter_lessons = [
        {
            "track": "MACRO",
            "concept_title": "Quantitative Easing (QE)",
            "definition": "A form of unconventional monetary policy in which a central bank purchases longer-term securities from the open market in order to increase the money supply and encourage lending and investment.",
            "how_it_works": "The central bank buys assets (usually gov bonds) using newly created electronic money. This injections liquidity into the banking system, lowering long-term interest rates and increasing asset prices.",
            "practitioner_use": "Traders monitor 'central bank balance sheets' to gauge liquidity. QE typically weakens the currency but boosts equity markets as investors seek higher returns.",
            "example": "The US Federal Reserve's massive bond-buying program during the 2008 financial crisis and the COVID-19 pandemic.",
            "india_angle": "The RBI rarely does pure QE but uses 'G-SAP' (G-sec Acquisition Programme) to manage yields and ensure smooth government borrowing.",
            "key_metrics": "Central Bank Balance Sheet size, 10-year Treasury Yields, Inflation expectations.",
            "misconception": "Many think QE is 'printing physical money' and causes immediate hyperinflation. In reality, it increases commercial bank reserves, and inflation only spikes if that money enters the real economy as loans.",
            "week_number": 1,
            "generated_at": datetime.now(timezone.utc) - timedelta(hours=2)
        },
        {
            "track": "POLICY",
            "concept_title": "Fiscal Deficit",
            "definition": "The difference between a government's total expenditure and its total receipts (excluding borrowing). It indicates the amount of money the government needs to borrow to fund its operations.",
            "how_it_works": "When tax revenues fall short of spending on infrastructure, subsidies, and defense, the government issues bonds to bridge the gap, increasing the national debt.",
            "practitioner_use": "Rating agencies (Moody's, S&P) use this to determine sovereign credit ratings. High deficits can lead to higher inflation and 'crowding out' of private investment.",
            "example": "The Indian Government's goal to bring the fiscal deficit down to below 4.5% of GDP by FY26.",
            "india_angle": "India's FRBM Act (Fiscal Responsibility and Budget Management) sets targets to keep this in check to maintain macroeconomic stability.",
            "key_metrics": "Deficit-to-GDP ratio, Tax-to-GDP ratio, Interest coverage on debt.",
            "misconception": "A common belief is that all government debt is bad. However, if borrowed money is spent on productive infrastructure (Capex), it can generate higher GDP growth than the cost of the debt.",
            "week_number": 1,
            "generated_at": datetime.now(timezone.utc) - timedelta(hours=15)
        }
    ]

    print("Seeding starter lessons...")
    for lesson in starter_lessons:
        doc_id = str(uuid.uuid4())
        db.collection("learn").document(doc_id).set(lesson)
        print(f"Added lesson: {lesson['concept_title']}")

    print("Done! Refresh your dashboard.")

if __name__ == "__main__":
    seed_lessons()
