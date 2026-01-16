import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import './Profile.css';
import './DarkModeProfile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Profile = () => {
  const { user: contextUser, setUser } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    sellerInfo: {
      shopName: '',
      description: ''
    }
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!contextUser) {
      navigate('/login');
      return;
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextUser, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/profile`);
      const user = res.data.user;
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        hasPassword: !!user.hasPassword,
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        },
        sellerInfo: {
          shopName: user.sellerInfo?.shopName || '',
          description: user.sellerInfo?.description || ''
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (name.startsWith('sellerInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        sellerInfo: { ...prev.sellerInfo, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.put(`${API_URL}/users/profile`, formData);
      
      // Update context with new user data
      if (setUser) {
        setUser(res.data.user);
      }
      
      success('Profile updated successfully!');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile';
      showError(errorMsg);
      setMessage({ 
        type: 'error', 
        text: errorMsg
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account information and preferences</p>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{formData.name}</h2>
                <p className="profile-email">{formData.email}</p>
                <span className="role-badge">{contextUser?.role}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
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
                    value={formData.email}
                    disabled
                    className="disabled"
                  />
                  <small>Email cannot be changed</small>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Address</h3>
              
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    placeholder="400001"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="India"
                  />
                </div>
              </div>
            </div>

            {(contextUser?.role === 'seller' || contextUser?.role === 'admin') && (
              <div className="form-section">
                <h3>Seller Information</h3>
                
                <div className="form-group">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    name="sellerInfo.shopName"
                    value={formData.sellerInfo.shopName}
                    onChange={handleChange}
                    placeholder="My Pokemon Shop"
                  />
                </div>

                <div className="form-group">
                  <label>Shop Description</label>
                  <textarea
                    name="sellerInfo.description"
                    value={formData.sellerInfo.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tell customers about your shop..."
                  />
                </div>
              </div>
            )}

            <div className="form-section">
              <h3>Change Password</h3>
              
              {!showPasswordChange ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(true)}
                    className="btn btn-primary"
                    style={{ 
                      marginBottom: '20px',
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: '600',
                      display: 'block',
                      width: 'auto'
                    }}
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="password-change-form">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Update your account password</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      Cancel
                    </button>
                  </div>

                  {contextUser?.googleId && !formData.hasPassword && (
                    <div style={{ padding: '10px', background: '#e3f2fd', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', color: '#1976d2' }}>
                      You're logged in with Google. Set a password to enable email/password login.
                    </div>
                  )}

                  {formData.hasPassword && (
                    <div className="form-group">
                      <label>Current Password *</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required={formData.hasPassword}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>New Password *</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password *</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (!passwordData.newPassword || !passwordData.confirmPassword) {
                        showError('New password and confirmation are required');
                        return;
                      }

                      if (passwordData.newPassword.length < 6) {
                        showError('New password must be at least 6 characters');
                        return;
                      }

                      if (passwordData.newPassword !== passwordData.confirmPassword) {
                        showError('New passwords do not match');
                        return;
                      }

                      // Validate before sending
                      if (formData.hasPassword && !passwordData.currentPassword) {
                        showError('Current password is required');
                        return;
                      }

                      if (!passwordData.newPassword || !passwordData.confirmPassword) {
                        showError('New password and confirmation are required');
                        return;
                      }

                      setChangingPassword(true);
                      try {
                        const requestData = {
                          newPassword: passwordData.newPassword
                        };
                        
                        // Only include currentPassword if user has a password
                        if (formData.hasPassword) {
                          requestData.currentPassword = passwordData.currentPassword;
                        }

                        const response = await axios.put(`${API_URL}/users/change-password`, requestData);
                        
                        success(response.data.message || 'Password updated successfully!');
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setShowPasswordChange(false);
                      } catch (error) {
                        showError(error.response?.data?.message || error.message || 'Failed to update password');
                      } finally {
                        setChangingPassword(false);
                      }
                    }}
                    disabled={changingPassword}
                    className="btn btn-primary"
                    style={{ marginTop: '10px' }}
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
