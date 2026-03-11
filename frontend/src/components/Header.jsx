import React from 'react';

function Header({ toggleTheme, lastRefresh }) {
  return (
    <header>
      <div className="header-title">
        <span>DASHbored</span>
      </div>
      <div className="header-controls">
        <span className="refresh-indicator">
          ⟳ {lastRefresh}
        </span>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;
