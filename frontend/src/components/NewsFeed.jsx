import React from 'react';
import StoryCard from './StoryCard';

function DateDivider({ dateGroup }) {
  return (
    <div className="date-divider">
      {dateGroup}
    </div>
  );
}

function NewsFeed({ section, topicFilter, stories }) {
  // Group stories by dateGroup field
  const grouped = stories.reduce((acc, story) => {
    const group = story.dateGroup || 'Today';
    acc[group] = acc[group] || [];
    acc[group].push(story);
    return acc;
  }, {});

  const order = ['Today', 'Yesterday', '2 Days Ago'];

  return (
    <div className="news-feed">
      {order.map(group => {
        if (!grouped[group] || grouped[group].length === 0) return null;
        return (
          <React.Fragment key={group}>
            <DateDivider dateGroup={group} />
            {grouped[group].map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </React.Fragment>
        );
      })}
      
      {stories.length === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted-text)' }}>
          No stories found for this section.
        </div>
      )}
    </div>
  );
}

export default NewsFeed;
