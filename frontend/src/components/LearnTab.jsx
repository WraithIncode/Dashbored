import React, { useState } from 'react';

function LessonCard({ lesson, initiallyExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  if (!isExpanded) {
    return (
      <div className="lesson-card collapsed" onClick={() => setIsExpanded(true)}>
        <div className="lesson-track">{lesson.track}</div>
        <h3 className="lesson-title">{lesson.concept_title}</h3>
      </div>
    );
  }

  return (
    <div className="lesson-card">
      <div className="lesson-track">{lesson.track} • Week {lesson.week_number}</div>
      <h2 className="lesson-title">{lesson.concept_title}</h2>
      
      <div className="lesson-section">
        <div className="lesson-section-title">Definition</div>
        <div className="lesson-section-content">{lesson.definition}</div>
      </div>
      
      <div className="lesson-section">
        <div className="lesson-section-title">How It Works</div>
        <div className="lesson-section-content">{lesson.how_it_works}</div>
      </div>
      
      <div className="lesson-section">
        <div className="lesson-section-title">Practitioner Use</div>
        <div className="lesson-section-content">{lesson.practitioner_use}</div>
      </div>
      
      <div className="lesson-section">
        <div className="lesson-section-title">Example</div>
        <div className="lesson-section-content">{lesson.example}</div>
      </div>

      {lesson.india_angle && (
        <div className="lesson-section">
          <div className="lesson-section-title">🇮🇳 India Angle</div>
          <div className="lesson-section-content">{lesson.india_angle}</div>
        </div>
      )}

      {lesson.key_metrics && (
        <div className="lesson-section">
          <div className="lesson-section-title">📊 Key Metrics to Watch</div>
          <div className="lesson-section-content">{lesson.key_metrics}</div>
        </div>
      )}

      {lesson.misconception && (
        <div className="lesson-section">
          <div className="lesson-section-title">⚠️ Common Misconception</div>
          <div className="lesson-section-content">{lesson.misconception}</div>
        </div>
      )}
      
      <button 
        style={{ marginTop: '16px', color: 'var(--muted-text)', fontSize: '0.85rem' }} 
        onClick={() => setIsExpanded(false)}
      >
        Collapse lesson ↑
      </button>
    </div>
  );

}

function LearnTab({ todayLesson, pastLessons = [] }) {
  return (
    <div className="learn-tab">
      <div className="date-divider" style={{ marginTop: '16px' }}>Today's Concept</div>
      {todayLesson ? (
        <LessonCard lesson={todayLesson} initiallyExpanded={true} />
      ) : (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted-text)' }}>
          No lesson available for today.
        </div>
      )}

      {pastLessons.length > 0 && (
        <>
          <div className="date-divider">Past Concepts</div>
          {pastLessons.map((lesson, idx) => (
            <LessonCard key={idx} lesson={lesson} initiallyExpanded={false} />
          ))}
        </>
      )}
    </div>
  );
}

export default LearnTab;
