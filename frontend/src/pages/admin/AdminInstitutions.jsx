import React, { useState, useEffect } from 'react';
import { getInstitutions, createInstitution, deleteInstitution } from '../../services/api';

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getInstitutions();
      setInstitutions(res.data.institutions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      await createInstitution({ name });
      alert("✅ Institution Added");
      setName('');
      fetchData();
    } catch (error) {
      alert("Error adding institution");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("⚠️ Are you sure you want to delete this institution?")) {
        try {
            await deleteInstitution(id);
            fetchData();
        } catch (error) {
            alert("Error deleting institution");
        }
    }
  };

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* 1. HEADER - Responsive Text */}
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 60px 0' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Institution Registry</h1>
          <p style={{ opacity: 0.8, marginTop: '10px', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Manage universities and organizations.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1000px', margin: '-40px auto 0', padding: '0 20px' }}>
        
        {/* 2. ADD NEW FORM - Responsive Flexbox */}
        <div className="card" style={{ padding: '25px', marginBottom: '25px', background: 'white', borderTop: '5px solid #10b981', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Add New Institution</h3>
            </div>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Enter Institution Name (e.g. Harvard)" 
                    required 
                    style={{ 
                        flex: '1 1 250px', // Grows, shrinks, but ensures min-width of 250px
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1',
                        fontSize: '1rem'
                    }} 
                />
                <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ 
                        padding: '12px 30px', 
                        flex: '0 1 auto', // Doesn't grow excessively
                        whiteSpace: 'nowrap'
                    }}
                >
                    + Add
                </button>
            </form>
        </div>

        {/* 3. LIST TABLE - Scrollable on Mobile */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 25px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Registered Entities</h3>
                <span style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                    Total: {institutions.length}
                </span>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
            ) : institutions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No institutions found.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', width: '80px' }}>ID</th>
                                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Name</th>
                                <th style={{ padding: '15px 25px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {institutions.map(i => (
                                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px 25px', color: '#64748b', fontFamily: 'monospace' }}>#{i.id}</td>
                                    <td style={{ padding: '15px 25px', fontWeight: '600', color: '#1e293b' }}>{i.name}</td>
                                    <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleDelete(i.id)} 
                                            className="btn-danger"
                                            style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '6px' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminInstitutions;