import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Logo size="medium" />
          </Link>

          <div className="navbar-links">
            <button 
              onClick={toggleDarkMode} 
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="nav-icon">{darkMode ? '☀️' : '🌙'}</span>
              <span className="nav-text">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <Link to="/products" className="nav-link">
              <span className="nav-icon">🛍️</span>
              <span className="nav-text">Products</span>
            </Link>
            
            {user ? (
              <>
                <Link to="/cart" className="nav-link cart-link">
                  <span className="nav-icon">🛒</span>
                  <span className="nav-text">Cart</span>
                </Link>
                {(user.role === 'seller' || user.role === 'admin') && (
                  <Link to="/dashboard" className="nav-link">
                    <span className="nav-icon">📊</span>
                    <span className="nav-text">Dashboard</span>
                  </Link>
                )}
                <div className="user-menu" ref={profileMenuRef}>
                  <div className="user-avatar-container" onClick={toggleProfileMenu}>
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-role">{user.role}</span>
                    </div>
                    <span className={`dropdown-arrow ${showProfileMenu ? 'open' : ''}`}>▼</span>
                  </div>
                  
                  {showProfileMenu && (
                    <div className="profile-dropdown">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="dropdown-user-info">
                          <div className="dropdown-name">{user.name}</div>
                          <div className="dropdown-email">{user.email}</div>
                          <div className="dropdown-role-badge">{user.role}</div>
                        </div>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <Link 
                        to="/profile" 
                        className="dropdown-item"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="dropdown-icon">👤</span>
                        <span>My Profile</span>
                      </Link>
                      
                      <Link 
                        to="/orders" 
                        className="dropdown-item"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span className="dropdown-icon">📦</span>
                        <span>My Orders</span>
                      </Link>
                      
                      {(user.role === 'seller' || user.role === 'admin') && (
                        <Link 
                          to="/dashboard" 
                          className="dropdown-item"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <span className="dropdown-icon">📊</span>
                          <span>Dashboard</span>
                        </Link>
                      )}
                      
                      <div className="dropdown-divider"></div>
                      
                      <button onClick={handleLogout} className="dropdown-item logout-item">
                        <span className="dropdown-icon">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  <span className="nav-icon">🔐</span>
                  <span className="nav-text">Login</span>
                </Link>
                <Link to="/register" className="btn-signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
