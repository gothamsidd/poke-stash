import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/';
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <p>Completing login...</p>
    </div>
  );
};

export default AuthCallback;
