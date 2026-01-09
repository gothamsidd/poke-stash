import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import './Auth.css';
import './DarkModeAuth.css';
import './DarkModeAuth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    phone: ''
  });
  const [error, setError] = useState('');
  const [oauthRole, setOauthRole] = useState('customer');
  const { register } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      success('Account created successfully!');
      navigate('/');
    } else {
      setError(result.message);
      showError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Sign Up</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Sign Up
          </button>
        </form>
        
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <div style={{ margin: '15px 0', color: '#7f8c8d', fontSize: '14px' }}>or</div>
          
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setOauthRole('customer')}
              style={{
                padding: '6px 12px',
                border: `2px solid ${oauthRole === 'customer' ? '#667eea' : '#e0e0e0'}`,
                background: oauthRole === 'customer' ? '#667eea' : 'white',
                color: oauthRole === 'customer' ? 'white' : '#2c3e50',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setOauthRole('seller')}
              style={{
                padding: '6px 12px',
                border: `2px solid ${oauthRole === 'seller' ? '#667eea' : '#e0e0e0'}`,
                background: oauthRole === 'seller' ? '#667eea' : 'white',
                color: oauthRole === 'seller' ? 'white' : '#2c3e50',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Seller
            </button>
          </div>
          
          <a 
            href={`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/google?role=${oauthRole}`}
            className="btn-google"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#2c3e50',
              fontWeight: '500',
              width: '100%'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </a>
        </div>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
