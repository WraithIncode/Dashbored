import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxiMlx4bNbltnf_utKCRyY1VvWLw9KPns",
  authDomain: "newsroom-dashbored-26.firebaseapp.com",
  projectId: "newsroom-dashbored-26",
  storageBucket: "newsroom-dashbored-26.firebasestorage.app",
  messagingSenderId: "505228786350",
  appId: "1:505228786350:web:039d4b05eddbfd2938cb3f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stories = [
    {
        headline: "Gemini 1.5 Pro Available Globally",
        summary: "Google has expanded the availability of Gemini 1.5 Pro to all developers worldwide via the API. This matters because it dramatically lowers the barrier to entry for building complex, multimodal applications. Keep an eye on pricing updates and token limit changes as the rollout continues.",
        watch_for: "New integration announcements from major enterprise partners.",
        source: "TechCrunch",
        link: "https://techcrunch.com",
        topic: "Technology",
        section: "International",
        category: "Technology",
        urgency: "High",
        fetched_at: Timestamp.fromDate(new Date())
    },
    {
        headline: "RBI Keeps Repo Rate Unchanged at 6.5%",
        summary: "The Monetary Policy Committee voted to maintain the status quo on interest rates, citing sticky inflation and resilient economic growth. This sustains the current borrowing costs for consumers and businesses. Watch for the next inflation data release which could trigger a shift in stance.",
        watch_for: "Retail inflation figures for the upcoming quarter.",
        source: "The Hindu",
        link: "https://thehindu.com",
        topic: "Economy",
        section: "India",
        category: "Finance",
        urgency: "Medium",
        fetched_at: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000))
    },
    {
        headline: "ISRO Successfully Launches New Weather Satellite",
        summary: "India's space agency has deployed INSAT-3DS into its intended orbit, aiming to enhance meteorological observations. This launch is crucial for improving weather forecasting and disaster warning capabilities across the subcontinent. Watch for data integration updates from the IMD over the next month.",
        watch_for: "First images and calibration data from the satellite payloads.",
        source: "Indian Express",
        link: "https://indianexpress.com",
        topic: "Science",
        section: "India",
        category: "Science",
        urgency: "Low",
        fetched_at: Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 60 * 1000)) // Yesterday
    }
];

const lessonDate = new Date().toISOString().split('T')[0];
const lesson = {
    topic: "Understanding Bonds",
    content: "Bonds are fixed-income instruments that represent a loan made by an investor to a borrower (typically corporate or governmental).\n\n**Why it matters:** They offer a predictable income stream and are generally considered safer than stocks, helping to diversify a portfolio.\n\n**Key takeaways:** Understand the relationship between interest rates and bond prices—they move inversely. When rates go up, existing bond prices go down.",
    created_at: Timestamp.fromDate(new Date())
};

async function seed() {
    try {
        console.log("Seeding database...");
        for (const story of stories) {
            await addDoc(collection(db, 'stories'), story);
            console.log("Added story:", story.headline);
        }
        await setDoc(doc(db, 'learn', lessonDate), lesson);
        console.log("Added lesson for date:", lessonDate);
        console.log("Seeding complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding:", e);
        process.exit(1);
    }
}

seed();
