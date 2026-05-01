import React, { useState, useEffect } from 'react';
import { getReports } from '../../services/api';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const AdminReports = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getReports();
      // Ensure data is sorted by date
      const sorted = (res.data.reports || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      setData(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (data.length === 0) return alert("No data to export");
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,AI Generations,Active Users\n"
      + data.map(e => `${e.date},${e.generations},${e.users}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "system_usage_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // --- KPI CALCULATIONS ---
  const totalGenerations = data.reduce((acc, curr) => acc + (curr.generations || 0), 0);
  const avgUsers = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (curr.users || 0), 0) / data.length) : 0;
  const peakDay = data.reduce((max, curr) => (curr.generations > max.generations ? curr : max), { generations: 0, date: 'N/A' });

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'white' }}>System Analytics</h1>
              <p style={{ opacity: 0.8, marginTop: '10px' }}>Monitor AI usage and platform engagement.</p>
            </div>
            
            <button 
              onClick={downloadCSV} 
              className="btn-success" 
              style={{ 
                background: '#10b981', color: 'white', padding: '12px 24px', 
                borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.4)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '-50px auto 0', padding: '0 20px' }}>
        
        {/* 2. KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
          
          <div className="card" style={{ padding: '25px', borderLeft: '5px solid #8b5cf6', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', lineHeight: '1', color: '#1e293b' }}>{totalGenerations}</h3>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total AI Generations</p>
            </div>
          </div>

          <div className="card" style={{ padding: '25px', borderLeft: '5px solid #3b82f6', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', lineHeight: '1', color: '#1e293b' }}>{avgUsers}</h3>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Avg. Daily Users</p>
            </div>
          </div>

          <div className="card" style={{ padding: '25px', borderLeft: '5px solid #f59e0b', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', lineHeight: '1', color: '#1e293b' }}>{peakDay.generations}</h3>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Peak Usage ({peakDay.date})</p>
            </div>
          </div>

        </div>

        {/* 3. CHARTS SECTION */}
        {/* minWidth: 0 prevents flex/grid collapse bug */}
        <div className="card" style={{ padding: '30px', marginBottom: '40px', background: 'white', borderRadius: '12px', minWidth: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '30px', color: '#334155' }}>Usage Trends</h3>
          
          {/* Fixed Height Wrapper */}
          <div style={{ width: '100%', height: 350 }}>
            {data.length > 0 ? (
                // FIX: Use numeric height={350} instead of "100%"
                <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Tooltip 
                    contentStyle={{ background: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="generations" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorGen)" strokeWidth={3} />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    No data available for chart
                </div>
            )}
          </div>
        </div>

        {/* 4. DETAILED DATA TABLE */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>Detailed Logs</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>AI Generations</th>
                  <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Users</th>
                  <th style={{ padding: '15px 25px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center' }}>Loading data...</td></tr>
                ) : data.length === 0 ? (
                   <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center' }}>No reports found.</td></tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 25px', fontWeight: '600', color: '#1e293b' }}>{row.date}</td>
                      <td style={{ padding: '15px 25px', color: '#8b5cf6', fontWeight: 'bold' }}>{row.generations}</td>
                      <td style={{ padding: '15px 25px', color: '#334155' }}>{row.users}</td>
                      <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                        <span style={{ 
                          background: '#dcfce7', color: '#166534', padding: '4px 10px', 
                          borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' 
                        }}>
                          Logged
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;