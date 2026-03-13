import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import TopicFilter from './components/TopicFilter';
import NewsFeed from './components/NewsFeed';
import LearnTab from './components/LearnTab';

import LoginScreen from './components/LoginScreen';
import { useStories } from './hooks/useStories';
import { useLesson } from './hooks/useLesson';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, authorized, loading: authLoading, signIn, logOut } = useAuth();
  const [theme, setTheme] = useState('light');

  const [lastRefresh, setLastRefresh] = useState('Just now');
  
  const { stories, loading: storiesLoading } = useStories();
  const { todayLesson, pastLessons, loading: lessonLoading } = useLesson();

  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = isDark ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    if (stories.length > 0 && stories[0].fetched_at) {
      const fetchedTime = stories[0].fetched_at.toDate();
      const diffMs = Date.now() - fetchedTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs / (1000 * 60)) % 60);
      if (hours > 0) setLastRefresh(`${hours}h ago`);
      else setLastRefresh(`${mins}m ago`);
    }
  }, [stories]);

  const [activeTab, setActiveTab] = useState('INDIA');
  const [activeTopic, setActiveTopic] = useState('All');

  if (authLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ color: 'var(--muted-text)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    );
  }

  if (!user || !authorized) {
    return (
      <LoginScreen
        onSignIn={signIn}
        deniedUser={user && !authorized ? user : null}
        onSignOut={logOut}
      />
    );
  }

  return (
    <div className="container">
      <div className="top-nav">
        <Header theme={theme} toggleTheme={toggleTheme} lastRefresh={lastRefresh} />
        {activeTab !== 'LEARN' && (
          <TopicFilter 
            section={activeTab} 
            activeTopic={activeTopic} 
            onTopicChange={setActiveTopic} 
          />
        )}
      </div>
      
      <main className={`feed ${activeTab !== 'LEARN' ? 'with-filters' : ''}`}>
        {activeTab === 'LEARN' ? (
          lessonLoading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>Loading...</div>
          ) : (
            <LearnTab todayLesson={todayLesson} pastLessons={pastLessons} />
          )
        ) : (
          storiesLoading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>Loading...</div>
          ) : (
            <NewsFeed 
              section={activeTab} 
              topicFilter={activeTopic} 
              stories={stories.filter(s => {
                if (s.section !== activeTab) return false;
                if (activeTopic === 'All') return true;
                if (s.topic_tag === activeTopic) return true;
                
                // Flexible matching for broader categories
                if (activeTopic === 'ECONOMY') {
                  return ['CAPEX', 'FISCAL', 'MARKETS', 'MONETARY', 'EARNINGS'].includes(s.topic_tag);
                }
                if (activeTopic === 'GEOPOLITICS') {
                  return ['INDIA-FOREIGN'].includes(s.topic_tag);
                }
                if (activeTopic === 'GLOBAL-ECON') {
                  return ['WORLD-ECON'].includes(s.topic_tag);
                }
                
                return false;
              })} 
            />
          )
        )}
      </main>


      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
