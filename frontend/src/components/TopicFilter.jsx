import React from 'react';

const TOPIC_MAP = {
  'Politics': 'POLITICS',
  'Tech': 'TECH',
  'Economy': 'ECONOMY',
  'Capital Markets': 'CAPITAL-MARKETS',
  'Equities': 'EQUITIES',
  'Crypto': 'CRYPTO',
  'Geopolitics': 'GEOPOLITICS',
  'Global Economy': 'GLOBAL-ECON',
  'Climate': 'CLIMATE',
  'AI Research': 'AI-RESEARCH'
};

const INDIA_TOPICS = ['All', 'Politics', 'Tech', 'Economy', 'Capital Markets', 'Equities', 'Crypto'];
const INTL_TOPICS = ['All', 'Geopolitics', 'Global Economy', 'Climate', 'AI Research', 'Capital Markets', 'Equities', 'Crypto'];

function TopicFilter({ section, activeTopic, onTopicChange }) {
  const topics = section === 'INDIA' ? INDIA_TOPICS : INTL_TOPICS;

  const handleTopicChange = (topic) => {
    if (topic === 'All') {
      onTopicChange('All');
    } else {
      const code = TOPIC_MAP[topic] || topic.toUpperCase().replace(/\s+/g, '-');
      onTopicChange(code);
    }
  };

  return (
    <div className="topic-filters">
      {topics.map(topic => {
        const code = topic === 'All' ? 'All' : (TOPIC_MAP[topic] || topic.toUpperCase().replace(/\s+/g, '-'));
        return (
          <button
            key={topic}
            className={`pill ${activeTopic === code ? 'active' : ''}`}
            onClick={() => handleTopicChange(topic)}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}

export default TopicFilter;
