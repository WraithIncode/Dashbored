import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import TopicFilter from './components/TopicFilter';
import NewsFeed from './components/NewsFeed';
import LearnTab from './components/LearnTab';
import ChatPanel from './components/ChatPanel';
import { useStories } from './hooks/useStories';
import { useLesson } from './hooks/useLesson';

function App() {
  const [activeTab, setActiveTab] = useState('INDIA'); // 'INDIA', 'INTERNATIONAL', 'LEARN'
  const [activeTopic, setActiveTopic] = useState('All');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('Just now');
  
  const { stories, loading: storiesLoading } = useStories();
  const { todayLesson, pastLessons, loading: lessonLoading } = useLesson();

  
  // Basic theme initialization
  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Determine which tab has fresher stories conceptually
    // Here we just update the refresh timestamp
    if (stories.length > 0 && stories[0].fetched_at) {
      const fetchedTime = stories[0].fetched_at.toDate();
      const diffMs = Date.now() - fetchedTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs / (1000 * 60)) % 60);
      if (hours > 0) setLastRefresh(`${hours}h ago`);
      else setLastRefresh(`${mins}m ago`);
    }
  }, [stories]);

  return (
    <div className="container">
      <Header toggleTheme={toggleTheme} lastRefresh={lastRefresh} />
      
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab !== 'LEARN' && (
        <TopicFilter 
          section={activeTab} 
          activeTopic={activeTopic} 
          onTopicChange={setActiveTopic} 
        />
      )}
      
      <main className="feed">
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
              stories={stories.filter(s => s.section === activeTab && (activeTopic === 'All' || s.topic_tag === activeTopic))} 
            />
          )
        )}
      </main>

      {/* Chat Bar (floating trigger at bottom) */}
      {!isChatOpen && (
        <div className="chat-bar" onClick={() => setIsChatOpen(true)}>
          <div className="chat-input-mock">Ask anything...</div>
          <div className="chat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </div>
        </div>
      )}

      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextStories={stories} 
      />
    </div>
  );
}

export default App;
