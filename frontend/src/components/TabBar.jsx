import React from 'react';

function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      <button 
        className={`tab ${activeTab === 'INDIA' ? 'active' : ''}`}
        onClick={() => onTabChange('INDIA')}
      >
        🇮🇳 India
      </button>
      <button 
        className={`tab ${activeTab === 'INTERNATIONAL' ? 'active' : ''}`}
        onClick={() => onTabChange('INTERNATIONAL')}
      >
        🌍 World
      </button>
      <button 
        className={`tab ${activeTab === 'LEARN' ? 'active' : ''}`}
        onClick={() => onTabChange('LEARN')}
      >
        📚 Learn
      </button>
    </div>
  );
}

export default TabBar;
