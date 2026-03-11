import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.error("VITE_FIREBASE_API_KEY is missing! App will fail to load data.");
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIza_MISSING_KEY",
  authDomain: "newsroom-dashbored-26.firebaseapp.com",
  projectId: "newsroom-dashbored-26",
  storageBucket: "newsroom-dashbored-26.firebasestorage.app",
  messagingSenderId: "505228786350",
  appId: "1:505228786350:web:039d4b05eddbfd2938cb3f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
