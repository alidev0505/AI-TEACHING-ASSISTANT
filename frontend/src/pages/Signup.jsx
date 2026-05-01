import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'student', university_id: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email.trim()) return setError('Email address is required.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return setError('Please enter a valid email address.');

    setLoading(true);
    try {
      await signup(formData);
      setSignedUpEmail(formData.email);
      setSignedUp(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-stack">
        
        {/* Header */}
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Join AI Teaching Assistant and start learning smarter</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {signedUp ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>Verify your email</h2>
              <div className="auth-alert warning" style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                A verification link has been sent to <strong>{signedUpEmail}</strong>.<br />
                Click the link in your inbox to activate your account.
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Didn't receive it? Check your spam folder.</p>
              <Link to="/login" className="btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              {error && <div className="auth-alert error">⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Responsive Row: Name + University ID */}
                <div className="auth-row-grid">
                  <div className="auth-form-group">
                    <label>Full Name</label>
                    <input type="text" name="username" placeholder="John Doe" required onChange={handleChange} />
                  </div>
                  <div className="auth-form-group">
                    <label>University ID</label>
                    <input type="text" name="university_id" placeholder="BAI-22F-001" onChange={handleChange} />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" placeholder="student@university.edu" required onChange={handleChange} />
                </div>

                <div className="auth-form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      placeholder="Create a strong password" 
                      required 
                      onChange={handleChange} 
                    />
                    <button 
                      type="button" 
                      className="password-toggle-icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "" : ""}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '1.25rem' }}>
                By signing up, you agree to our{' '}
                <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Terms</span> and{' '}
                <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Privacy Policy</span>.
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;