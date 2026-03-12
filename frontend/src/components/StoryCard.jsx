import React from 'react';

function StoryCard({ story }) {
  return (
    <article className="story-card">
      <div className="story-meta">
        <div className="story-topic">{story.display_label || story.topic_tag}</div>
        <div className="story-timestamps">
          {story.published_at && (
            <div className="story-time pub">
              P: {new Date(story.published_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          )}
          {story.fetched_at && (
            <div className="story-time up">
              U: {story.fetched_at.toDate().toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          )}
        </div>
      </div>
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
