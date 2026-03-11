import React from 'react';

function StoryCard({ story }) {
  return (
    <article className="story-card">
      <div className="story-topic">{story.display_label || story.topic_tag}</div>
      <h2 className="story-headline">{story.headline}</h2>
      
      <div className="story-summary">
        {story.summary}
      </div>
      
      {story.watch_for && (
        <div className="story-watch-for">
          Watch for: {story.watch_for}
        </div>
      )}
      
      <a href={story.url} target="_blank" rel="noopener noreferrer" className="story-link">
        Read original article →
      </a>
      
      <div className="divider" style={{ marginTop: '24px', marginBottom: '8px' }}></div>
    </article>
  );
}

export default StoryCard;
