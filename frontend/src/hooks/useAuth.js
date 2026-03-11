import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

// Bootstrap: allow by email until UID is known, then switch to UID
const ALLOWED_EMAIL = 'ash74ish47@gmail.com';
const ALLOWED_UID = import.meta.env.VITE_ALLOWED_UID || null;

function isAuthorized(user) {
  if (!user) return false;
  if (ALLOWED_UID) return user.uid === ALLOWED_UID;
  return user.email === ALLOWED_EMAIL;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthorized(isAuthorized(firebaseUser));
      if (firebaseUser) {
        // Log UID to console so it can be set as VITE_ALLOWED_UID in .env
        console.log('%c Your Firebase UID:', 'color: #4ade80; font-weight: bold;', firebaseUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = () => signInWithPopup(auth, googleProvider);
  const logOut = () => signOut(auth);

  return { user, authorized, loading, signIn, logOut };
}
