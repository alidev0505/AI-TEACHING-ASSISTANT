import React, { useState, useEffect } from 'react';
import { createSemester, getSemesters, toggleSemester } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ManageSemesters = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [form, setForm] = useState({ name: 'Fall', academic_year: '', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await getSemesters();
      setSemesters(res.data.semesters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSemester(form);
      alert('Semester Created Successfully!');
      setForm({ name: 'Fall', academic_year: '', start_date: '', end_date: '' }); // Reset
      loadData();
    } catch (err) { 
        alert('Error creating semester. Please check your inputs.'); 
    }
  };

  const handleToggle = async (id) => {
    try {
        await toggleSemester(id);
        loadData();
    } catch (err) {
        alert("Failed to update status");
    }
  };

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* 1. ADMIN HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 80px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', 
              padding: '8px 16px', borderRadius: '6px', marginBottom: '15px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'white' }}>Semester Management</h1>
          <p style={{ opacity: 0.8, marginTop: '10px' }}>Configure academic terms and active sessions.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '-50px auto 0', padding: '0 20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            
            {/* 2. CREATE FORM CARD */}
            <div className="card" style={{ padding: '30px', height: 'fit-content', background: 'white', borderTop: '5px solid var(--primary)' }}>
                <div style={{ marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Create New Semester</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Define a new academic term.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Term Name</label>
                            <select 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            >
                                <option>Fall</option>
                                <option>Spring</option>
                                <option>Summer</option>
                                <option>Winter</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Year</label>
                            <input 
                                placeholder="e.g. 2025" 
                                value={form.academic_year} 
                                onChange={e => setForm({...form, academic_year: e.target.value})} 
                                required 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Start Date</label>
                        <input 
                            type="date" 
                            value={form.start_date} 
                            onChange={e => setForm({...form, start_date: e.target.value})} 
                            required 
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>End Date</label>
                        <input 
                            type="date" 
                            value={form.end_date} 
                            onChange={e => setForm({...form, end_date: e.target.value})} 
                            required 
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                        + Add Semester
                    </button>
                </form>
            </div>

            {/* 3. EXISTING SEMESTERS LIST */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderTop: '5px solid var(--secondary)' }}>
                <div style={{ padding: '25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Existing Semesters</h3>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
                ) : semesters.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No semesters found.</div>
                ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {semesters.map(s => (
                            <div key={s.id} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                padding: '20px 25px', borderBottom: '1px solid #f1f5f9',
                                background: s.is_active ? '#f0fdf4' : 'white' 
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: s.is_active ? '#166534' : '#1e293b' }}>
                                        {s.name} {s.academic_year}
                                        {s.is_active && <span style={{ marginLeft: '10px', fontSize: '0.7rem', background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '10px', verticalAlign: 'middle' }}>ACTIVE</span>}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                        {new Date(s.start_date).toLocaleDateString()} — {new Date(s.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={() => handleToggle(s.id)} 
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        border: s.is_active ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                        background: s.is_active ? 'white' : '#f1f5f9',
                                        color: s.is_active ? '#166534' : '#64748b'
                                    }}
                                >
                                    {s.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default ManageSemesters;