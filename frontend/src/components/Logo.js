import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium' }) => {
  return (
    <div className={`logo-container logo-${size}`}>
      <div className="logo-icon-wrapper">
        <div className="logo-circle">
          <span className="logo-bolt">⚡</span>
        </div>
      </div>
      <div className="logo-text-wrapper">
        <span className="logo-text-main">PokeStash</span>
        <span className="logo-text-tagline">COLLECT & TRADE</span>
      </div>
    </div>
  );
};

export default Logo;
