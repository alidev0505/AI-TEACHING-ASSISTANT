import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // ── Email validation ──
    if (!email.trim()) {
      setStatus('error');
      setMessage('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatus('error');
      setMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Check your inbox for a password reset link.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Could not connect to the server. Please try again later.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

      {/* Top Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎓</div>
          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>AI Teaching Assistant</span>
        </Link>
        <Link to="/login" style={{ color: '#1d4ed8', fontWeight: '600', fontSize: '0.9rem', textDecoration: 'none' }}>
          Back to Login →
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔑</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Forgot Password?</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>

        {/* Success State */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
            <div style={{ background: '#d1fae5', color: '#065f46', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.95rem', border: '1px solid #a7f3d0' }}>
              {message}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Didn't receive it? Check your spam folder or{' '}
              <button onClick={() => setStatus('idle')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', padding: 0 }}>
                try again
              </button>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {status === 'error' && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
                {message}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '0.85rem' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', background: status === 'loading' ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: status === 'loading' ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', fontFamily: 'inherit' }}
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
