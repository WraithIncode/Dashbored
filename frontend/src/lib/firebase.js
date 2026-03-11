import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAxiMlx4bNbltnf_utKCRyY1VvWLw9KPns",
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
