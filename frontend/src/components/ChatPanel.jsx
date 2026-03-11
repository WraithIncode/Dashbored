import React, { useState, useRef, useEffect } from 'react';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`chat-message ${isUser ? 'user' : 'ai'}`}>
      {message.content}
    </div>
  );
}

function ChatPanel({ isOpen, onClose, contextStories }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi. I can answer questions about the stories in your current feed. What would you like to know?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMessage = inputVal.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputVal('');
    setIsTyping(true);

    // TODO: Implement actual Gemini API call here using contextStories
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', content: 'This is a mocked response. You asked: ' + userMessage }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <div className="chat-title">Intelligence Chat</div>
        <button className="chat-close" onClick={onClose} aria-label="Close chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="chat-history">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
        {isTyping && (
          <div className="chat-message ai" style={{ color: 'var(--muted-text)' }}>
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Ask about your news feed..." 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <button type="submit" className="chat-submit" disabled={!inputVal.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
      
      {/* Padding at bottom for mobile safety */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
    </div>
  );
}

export default ChatPanel;
