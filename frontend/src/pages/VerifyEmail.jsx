import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error | already_verified
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (res.ok) {
          if (data.message && data.message.toLowerCase().includes('already')) {
            setStatus('already_verified');
          } else {
            setStatus('success');
          }
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Could not connect to the server. Please try again.');
      }
    };

    verify();
  }, [token]);

  const icons = {
    loading: '⏳',
    success: '✅',
    already_verified: '✔️',
    error: '❌',
  };

  const colors = {
    loading: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
    success: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    already_verified: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    error: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  };

  const color = colors[status];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎓</div>
          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>AI Teaching Assistant</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>

        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icons[status]}</div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          {status === 'loading' && 'Verifying your email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'already_verified' && 'Already Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {status !== 'loading' && (
          <div style={{ background: color.bg, color: color.text, padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.95rem', border: `1px solid ${color.border}` }}>
            {message}
          </div>
        )}

        {status === 'loading' && (
          <p style={{ color: '#64748b' }}>Please wait a moment...</p>
        )}

        {(status === 'success' || status === 'already_verified') && (
          <Link to="/login" style={{ display: 'inline-block', width: '100%', padding: '12px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s', fontFamily: 'inherit' }}>
            Go to Login
          </Link>
        )}

        {status === 'error' && (
          <div>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
              The link may have expired or already been used.
            </p>
            <Link to="/signup" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
              Sign up again
            </Link>
            {' · '}
            <Link to="/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
              Log in
            </Link>
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
