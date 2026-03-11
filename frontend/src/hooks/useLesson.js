import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useLesson() {
  const [todayLesson, setTodayLesson] = useState(null);
  const [pastLessons, setPastLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockLessons = [];

  useEffect(() => {
    const q = query(collection(db, 'learn'), orderBy('generated_at', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLessons = [];
      snapshot.forEach(doc => {
        fetchedLessons.push({ id: doc.id, ...doc.data() });
      });
      
      if (fetchedLessons.length > 0) {
        setTodayLesson(fetchedLessons[0]);
        setPastLessons(fetchedLessons.slice(1));
      } else {
        setTodayLesson(null);
        setPastLessons([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lessons:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { todayLesson, pastLessons, loading };
}
