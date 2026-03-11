import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function buildSystemPrompt(stories) {
  if (!stories || stories.length === 0) return 'You are a financial intelligence assistant. Answer concisely and analytically.';
  const storyContext = stories.slice(0, 10).map(s =>
    `- [${s.topic_tag}] ${s.headline} (${s.source}): ${s.summary}`
  ).join('\n');
  return `You are a financial intelligence assistant for an Indian investor/analyst. 
Answer questions analytically and concisely — like a senior economist or market strategist would.
You have context from today's news feed below. Reference it when relevant.

TODAY'S NEWS:
${storyContext}`;
}

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
    { role: 'ai', content: 'Hi. Ask me anything about the markets, today\'s stories, or any macro/policy concept.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userMessage = inputVal.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputVal('');
    setIsTyping(true);

    if (!GEMINI_KEY) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.' }]);
      setIsTyping(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
      const systemPrompt = buildSystemPrompt(contextStories);
      const fullPrompt = `${systemPrompt}\n\nUSER: ${userMessage}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      const text = response.text || 'No response received.';
      setMessages(prev => [...prev, { role: 'ai', content: text }]);
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Error reaching Gemini. Check your API key or try again.' }]);
    } finally {
      setIsTyping(false);
    }
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
        {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
        {isTyping && (
          <div className="chat-message ai" style={{ color: 'var(--muted-text)' }}>Thinking...</div>
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
            disabled={isTyping}
          />
          <button type="submit" className="chat-submit" disabled={!inputVal.trim() || isTyping}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
    </div>
  );
}

export default ChatPanel;
