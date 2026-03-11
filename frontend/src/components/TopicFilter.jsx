import React from 'react';

const INDIA_TOPICS = ['All', 'Politics', 'Tech', 'Economy'];
const INTL_TOPICS = ['All', 'Geopolitics', 'Global Economy', 'Climate', 'AI Research'];

function TopicFilter({ section, activeTopic, onTopicChange }) {
  const topics = section === 'INDIA' ? INDIA_TOPICS : INTL_TOPICS;

  return (
    <div className="topic-filters">
      {topics.map(topic => (
        <button
          key={topic}
          className={`pill ${activeTopic === (topic === 'All' ? 'All' : topic.toUpperCase()) ? 'active' : ''}`}
          onClick={() => onTopicChange(topic === 'All' ? 'All' : topic.toUpperCase())}
        >
          {topic}
        </button>
      ))}
    </div>
  );
}

export default TopicFilter;
