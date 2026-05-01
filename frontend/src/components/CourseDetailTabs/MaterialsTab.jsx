import React from 'react';
import { Link } from 'react-router-dom';

const MaterialsTab = ({ user, materials, uploading, handleMaterialUpload, handleDeleteMaterial, handleDownload }) => (
  <div>
    {user.role === 'teacher' && (
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: '5px solid #2563eb' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontWeight: '800' }}>📤 Upload Lecture</h3>
        <form onSubmit={handleMaterialUpload} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input name="title" placeholder="Lecture Title" required style={{ flex: '1 1 200px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
          <input type="file" name="file" accept=".pdf" required style={{ flex: '1 1 200px' }} />
          <button style={{ background: 'linear-gradient(135deg,#1d4ed8,#0284c7)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '700' }} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload PDF'}</button>
        </form>
      </div>
    )}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
      {materials.map(m => (
        <div key={m.id} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>📄 {m.title}</h4>
            {user.role === 'teacher' && <button onClick={() => handleDeleteMaterial(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button onClick={() => handleDownload(m.file_path, m.title)} style={{ flex: 1, padding: '9px', borderRadius: '8px', cursor: 'pointer' }}>⬇ Download</button>
            {user.role === 'teacher' && m.is_processed && <Link to={`/generate/${m.id}`} style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: '8px', background: '#2563eb', color: 'white', textDecoration: 'none' }}>🤖 Generate</Link>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MaterialsTab;