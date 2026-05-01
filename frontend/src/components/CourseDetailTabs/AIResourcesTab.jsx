import React from 'react';

const AIResourcesTab = ({ generatedResources, handleDeleteResource }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
    {generatedResources.length === 0 ? (
      <div style={{ gridColumn: '1/-1', padding: '40px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>
        No AI resources generated for this course yet.
      </div>
    ) : (
      generatedResources.map(res => (
        <div key={res.id} style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>{res.type}</span>
            <button onClick={() => handleDeleteResource(res.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>🗑️</button>
          </div>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{res.type === 'quiz' ? '🧩 Generated Quiz Content' : '📝 AI Study Material'}</h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6', height: '100px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{res.content}</p>
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{res.date}</span>
            <button onClick={() => { navigator.clipboard.writeText(res.content); alert("Content copied!"); }} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>📋 Copy Text</button>
          </div>
        </div>
      ))
    )}
  </div>
);

export default AIResourcesTab;