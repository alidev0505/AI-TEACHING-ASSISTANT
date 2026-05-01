import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, postAnnouncement, deleteAnnouncement } from '../../services/api';

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ content: '', type: 'info' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await getAnnouncements();
    setList(res.data.announcements);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await postAnnouncement(form);
    setForm({ content: '', type: 'info' });
    loadData();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    loadData();
  };

  const getTypeStyle = (type) => {
    switch(type) {
        case 'warning': return { borderLeft: '4px solid #f59e0b', bg: '#fffbeb', icon: '⚠️' };
        case 'alert': return { borderLeft: '4px solid #ef4444', bg: '#fef2f2', icon: '🚨' };
        default: return { borderLeft: '4px solid #3b82f6', bg: '#eff6ff', icon: '📢' };
    }
  };

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 60px 0' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginBottom: '15px', cursor: 'pointer' }}>← Back</button>
            <h1 style={{ margin: 0 }}>Global Announcements</h1>
            <p style={{ opacity: 0.8 }}>Broadcast messages to all users.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px', margin: '-40px auto 0', padding: '0 20px' }}>
        
        {/* CREATE CARD */}
        <div className="card" style={{ padding: '25px', background: 'white', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Post New Message</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display:'block', marginBottom:'5px', fontWeight:'600' }}>Message</label>
                    <textarea 
                        value={form.content} 
                        onChange={e => setForm({...form, content: e.target.value})}
                        required
                        placeholder="e.g. Server maintenance scheduled for Friday..."
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display:'block', marginBottom:'5px', fontWeight:'600' }}>Type</label>
                    <select 
                        value={form.type}
                        onChange={e => setForm({...form, type: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="info">ℹ️ Info (Blue)</option>
                        <option value="warning">⚠️ Warning (Yellow)</option>
                        <option value="alert">🚨 Urgent (Red)</option>
                    </select>
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? 'Posting...' : 'Post Announcement'}
                </button>
            </form>
        </div>

        {/* LIST */}
        <div style={{ display: 'grid', gap: '15px' }}>
            {list.map(item => {
                const style = getTypeStyle(item.type);
                return (
                    <div key={item.id} className="card" style={{ 
                        padding: '20px', background: 'white', borderRadius: '8px', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderLeft: style.borderLeft, backgroundColor: style.bg
                    }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>{style.icon}</div>
                            <div>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.content}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.date}</div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(item.id)} style={{ color: '#ef4444', background: 'white', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                    </div>
                )
            })}
        </div>

      </div>
    </div>
  );
};

export default AdminAnnouncements;