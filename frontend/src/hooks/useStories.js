import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockStories = [];

  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('fetched_at', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStories = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        
        let dateGroup = 'Today';
        if (data.fetched_at) {
          const fetchedDate = data.fetched_at.toDate();
          const today = new Date();
          const diffDays = Math.floor((today - fetchedDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) dateGroup = 'Yesterday';
          else if (diffDays >= 2) dateGroup = '2 Days Ago';
        }

        fetchedStories.push({
          id: doc.id,
          dateGroup,
          ...data
        });
      });
      setStories(fetchedStories);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stories, loading };
}
