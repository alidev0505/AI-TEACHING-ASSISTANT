import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { updateProfile, getProfileStats, changePassword } from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_META = {
  student: { label: 'Student', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🎓' },
  teacher: { label: 'Teacher', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '👨‍🏫' },
  admin: { label: 'Admin', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🛡️' },
};

const DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Information Technology',
  'Artificial Intelligence', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Business Administration', 'Accounting & Finance',
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English Literature', 'Economics', 'Psychology', 'Other',
];

const GEN_TYPES = [
  { key: 'lecture', label: 'Lecture Notes', icon: '📖', color: '#2563eb', bg: '#eff6ff' },
  { key: 'slides', label: 'Slides', icon: '🖼️', color: '#0891b2', bg: '#ecfeff' },
  { key: 'assignment', label: 'Assignments', icon: '📝', color: '#059669', bg: '#f0fdf4' },
  { key: 'quiz', label: 'Quizzes', icon: '🧩', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'midterm', label: 'Mid-Terms', icon: '📋', color: '#d97706', bg: '#fffbeb' },
  { key: 'final', label: 'Final Exams', icon: '🎓', color: '#dc2626', bg: '#fef2f2' },
];

// ─── Reusable subcomponents ───────────────────────────────────────────────────
const Label = ({ children }) => (
  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
    {children}
  </label>
);

const inputSx = {
  width: '100%', padding: '11px 14px', borderRadius: '9px',
  border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a',
  fontSize: '0.93rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.2s',
};

const Alert = ({ type, text }) => (
  <div style={{
    padding: '13px 16px', borderRadius: '9px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '20px',
    background: type === 'success' ? '#f0fdf4' : '#fef2f2',
    color: type === 'success' ? '#166534' : '#991b1b',
    border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
  }}>
    {type === 'success' ? '✅' : '⚠️'} {text}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileRef = useRef();
  const meta = ROLE_META[user?.role] || ROLE_META.student;

  // Form state
  const [form, setForm] = useState({
    username: '', email: '', university_id: '',
    department: '', bio: '', profile_picture: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Password state
  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // Stats
  const [stats, setStats] = useState(null);

  // Active tab
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        university_id: user.university_id || '',
        department: user.department || '',
        bio: user.bio || '',
        profile_picture: user.profile_picture || '',
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try { const r = await getProfileStats(); setStats(r.data.stats); }
    catch { /* silent */ }
  };

  // ── Picture upload ─────────────────────────────────────────────────────────
  const handlePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Image must be under 2 MB.');
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, profile_picture: ev.target.result }));
    reader.readAsDataURL(file);
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      const res = await updateProfile(form);
      setSaveMsg({ type: 'success', text: 'Profile saved successfully!' });
      if (res.data.user && setUser) setUser(prev => ({ ...prev, ...res.data.user }));
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save profile.' });
    } finally { setSaving(false); }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handlePw = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm)
      return setPwMsg({ type: 'error', text: 'New passwords do not match.' });
    if (pw.new_password.length < 6)
      return setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    setPwSaving(true); setPwMsg(null);
    try {
      await changePassword({ old_password: pw.old_password, new_password: pw.new_password });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPw({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally { setPwSaving(false); }
  };

  const dashLink = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';
  const hasPic = !!form.profile_picture;

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'info', label: '👤 Profile' },
    { key: 'password', label: '🔒 Security' },
    { key: 'courses', label: user?.role === 'teacher' ? '📚 My Courses' : '📖 Courses' },
    ...(user?.role === 'teacher' ? [{ key: 'generated', label: '🤖 AI Stats' }] : []),
  ];

  // ──────────────────────────────────────────────────── render ────────────────
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%)', padding: '36px 0 100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <button onClick={() => navigate(dashLink)} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '22px', fontFamily: 'inherit' }}>
            ← Back to Dashboard
          </button>

          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Profile picture */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: hasPic ? 'transparent' : 'rgba(255,255,255,0.12)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                {hasPic
                  ? <img src={form.profile_picture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontSize: '2rem', fontWeight: '900' }}>{initials}</span>
                }
              </div>

              {/* Camera overlay — triggers on tab 'info' only */}
              <button onClick={() => { setTab('info'); setTimeout(() => fileRef.current?.click(), 100); }} style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'white', border: '2px solid #e2e8f0', color: '#2563eb', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} title="Change photo">
                📷
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{user?.username}</h1>
                <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: '0 0 4px', fontSize: '0.88rem' }}>{user?.email}</p>
              {form.department && <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.82rem' }}>🏛 {form.department}</p>}
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: '0.78rem' }}>Member since {user?.created_at || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '-56px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 10 }}>

        {/* Quick stat bar */}
        {stats && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {user?.role === 'teacher' && (
              <>
                {[
                  { icon: '📚', label: 'Courses', value: stats.courses_taught, color: '#2563eb', bg: '#eff6ff' },
                  { icon: '👥', label: 'Students', value: stats.total_students, color: '#059669', bg: '#f0fdf4' },
                  { icon: '🤖', label: 'AI Generations', value: stats.generated ? Object.values(stats.generated).reduce((a, b) => a + b, 0) : 0, color: '#7c3aed', bg: '#f5f3ff' },
                ].map(s => (
                  <div key={s.label} style={{ flex: '1 1 120px', background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                  </div>
                ))}
              </>
            )}
            {user?.role === 'student' && (
              <>
                {[
                  { icon: '📖', label: 'Enrolled', value: stats.courses_enrolled, color: '#2563eb', bg: '#eff6ff' },
                  { icon: '🪪', label: 'Univ. ID', value: form.university_id || '—', color: '#7c3aed', bg: '#f5f3ff' },
                  { icon: '✅', label: 'Verified', value: user?.is_verified ? 'Yes' : 'No', color: '#059669', bg: '#f0fdf4' },
                ].map(s => (
                  <div key={s.label} style={{ flex: '1 1 120px', background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                  </div>
                ))}
              </>
            )}
            {user?.role === 'admin' && (
              <>
                {[
                  { icon: '👥', label: 'Total Users', value: stats.total_users, color: '#2563eb', bg: '#eff6ff' },
                  { icon: '👨‍🏫', label: 'Teachers', value: stats.total_teachers, color: '#7c3aed', bg: '#f5f3ff' },
                  { icon: '🎓', label: 'Students', value: stats.total_students, color: '#059669', bg: '#f0fdf4' },
                  { icon: '📚', label: 'Courses', value: stats.total_courses, color: '#d97706', bg: '#fffbeb' },
                ].map(s => (
                  <div key={s.label} style={{ flex: '1 1 120px', background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '5px', borderRadius: '11px', border: '1px solid #e2e8f0', marginBottom: '18px', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', fontFamily: 'inherit', background: tab === t.key ? 'linear-gradient(135deg, #1d4ed8, #0284c7)' : 'transparent', color: tab === t.key ? 'white' : '#64748b', transition: 'all 0.15s', boxShadow: tab === t.key ? '0 2px 8px rgba(29,78,216,0.25)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFILE INFO ── */}
        {tab === 'info' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 22px', color: '#0f172a', fontWeight: '800', fontSize: '1.1rem', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              Personal Information
            </h3>

            {saveMsg && <Alert type={saveMsg.type} text={saveMsg.text} />}

            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicture} />

            {/* Profile picture section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', flexShrink: 0, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasPic
                  ? <img src={form.profile_picture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#94a3b8' }}>{initials}</span>
                }
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>Profile Picture</p>
                <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '0.8rem' }}>JPG, PNG up to 2 MB. Stored securely.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                    Upload Photo
                  </button>
                  {hasPic && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, profile_picture: '' }))} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Row 1: Name + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <Label>Full Name</Label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputSx}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputSx}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              </div>

              {/* Row 2: Department + University ID (student) OR Department alone (teacher) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <Label>Department</Label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ ...inputSx, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
                    <option value="">— Select Department —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {user?.role === 'student' && (
                  <div>
                    <Label>University ID / Roll No.</Label>
                    <input value={form.university_id} onChange={e => setForm({ ...form, university_id: e.target.value })} placeholder="e.g. 2021-CS-123" style={inputSx}
                      onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <Label>Bio / About</Label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
                  placeholder={user?.role === 'teacher' ? 'Tell students a bit about yourself…' : 'A short introduction about yourself…'}
                  style={{ ...inputSx, resize: 'vertical', minHeight: '80px' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Read-only metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                {[
                  { label: 'Account Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
                  { label: 'Member Since', value: user?.created_at || '—' },
                  { label: 'Email Verified', value: user?.is_verified ? '✅ Verified' : '❌ Not verified' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button type="submit" disabled={saving} style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg, #1d4ed8, #0284c7)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(29,78,216,0.3)' }}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB: SECURITY ── */}
        {tab === 'password' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: '800', fontSize: '1.1rem' }}>Change Password</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>Use a strong password to keep your account secure.</p>
            {pwMsg && <Alert type={pwMsg.type} text={pwMsg.text} />}
            <form onSubmit={handlePw} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <Label>Current Password</Label>
                <input type="password" placeholder="Enter current password" value={pw.old_password} onChange={e => setPw({ ...pw, old_password: e.target.value })} style={inputSx}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <Label>New Password</Label>
                  <input type="password" placeholder="Min. 6 characters" value={pw.new_password} onChange={e => setPw({ ...pw, new_password: e.target.value })} style={inputSx}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <input type="password" placeholder="Repeat new password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })}
                    style={{ ...inputSx, borderColor: pw.confirm && pw.new_password !== pw.confirm ? '#dc2626' : '#e2e8f0' }}
                    onFocus={e => e.target.style.borderColor = pw.confirm && pw.new_password !== pw.confirm ? '#dc2626' : '#2563eb'}
                    onBlur={e => e.target.style.borderColor = pw.confirm && pw.new_password !== pw.confirm ? '#dc2626' : '#e2e8f0'} />
                  {pw.confirm && pw.new_password !== pw.confirm && (
                    <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: '600' }}>⚠ Passwords don't match</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={pwSaving} style={{ background: pwSaving ? '#94a3b8' : 'linear-gradient(135deg, #1d4ed8, #0284c7)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', cursor: pwSaving ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: pwSaving ? 'none' : '0 4px 14px rgba(29,78,216,0.3)' }}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB: COURSES ── */}
        {tab === 'courses' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', color: '#0f172a', fontWeight: '800', fontSize: '1.1rem', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              {user?.role === 'teacher' ? '📚 Courses I Teach' : '📖 My Enrolled Courses'}
            </h3>
            {(!stats?.courses || stats.courses.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.4 }}>📭</div>
                <p>{user?.role === 'teacher' ? 'No courses created yet.' : 'Not enrolled in any courses yet.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.courses.map((c, i) => {
                  const accent = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'][i % 6];
                  return (
                    <Link key={c.id} to={`/course/${c.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', transition: 'all 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.background = '#fafbff'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📚</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>{c.name}</div>
                        {user?.role === 'student' && c.teacher && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>👤 {c.teacher}</div>}
                      </div>
                      <span style={{ background: `${accent}18`, color: accent, padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', flexShrink: 0 }}>{c.code}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>→</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: AI GENERATION STATS (teacher only) ── */}
        {tab === 'generated' && user?.role === 'teacher' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: '800', fontSize: '1.1rem' }}>🤖 AI Content Generated</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              Breakdown of AI-generated content across all your courses.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {GEN_TYPES.map(gt => {
                const count = stats?.generated?.[gt.key] ?? 0;
                return (
                  <div key={gt.key} style={{ background: gt.bg, border: `1px solid ${gt.color}22`, borderRadius: '14px', padding: '22px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{gt.icon}</span>
                      <span style={{ background: 'white', color: gt.color, fontWeight: '900', fontSize: '1.4rem', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${gt.color}22` }}>{count}</span>
                    </div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>{gt.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{count === 1 ? '1 document' : `${count} documents`} generated</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;