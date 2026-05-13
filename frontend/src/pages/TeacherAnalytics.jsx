import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const TeacherAnalytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [courseId]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/content/analytics/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding:'100px 20px', textAlign:'center', color: '#64748b'}}>Loading Insights...</div>;
  if (!data) return <div style={{padding:'100px 20px', textAlign:'center', color: '#ef4444'}}>Error loading analytical data.</div>;

  const safeStudents = (data.kpi?.students || 0) - (data.kpi?.at_risk_count || 0);
  const riskData = [
    { name: 'Safe', value: safeStudents },
    { name: 'At Risk', value: data.kpi?.at_risk_count || 0 }
  ];
  const RISK_COLORS = ['#10b981', '#ef4444']; 
  const assignmentData = data.assignment_charts || [];

  return (
    <div className="analytics-wrapper">
      
      {/* 1. HERO HEADER */}
      <div className="analytics-hero">
        <div className="hero-overlay" />
        <div className="hero-container">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back to Course
          </button>
          <h1>Course Insights</h1>
          <p>Institutional performance metrics and student health overview.</p>
        </div>
      </div>

      <div className="analytics-content">
        
        {/* 2. KPI CARDS */}
        <div className="kpi-grid">
          <KPICard title="Total Students" value={data.kpi?.students} color="#3b82f6" />
          <KPICard title="Sessions Held" value={data.kpi?.sessions_held} color="#8b5cf6" />
          <KPICard 
            title="Avg. Attendance" 
            value={`${data.kpi?.students > 0 ? Math.round(((data.kpi.students - data.kpi.at_risk_count)/data.kpi.students)*100) : 0}%`} 
            color="#10b981" 
          />
          <KPICard 
            title="At Risk Alert" value={data.kpi?.at_risk_count} color="#ef4444" 
            isAlert={data.kpi?.at_risk_count > 0}
          />
        </div>

        {/* 3. CHARTS GRID */}
        <div className="charts-main-grid">
          
          {/* Bar Chart Card */}
          <div className="chart-card">
            <h3>📊 Assignment Completion</h3>
            <div className="chart-holder">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar dataKey="submitted" fill="#2563eb" name="Submitted" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="pending" fill="#e2e8f0" name="Missing" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart Card */}
          <div className="chart-card">
            <h3>❤️ Health Overview</h3>
            <div className="chart-holder">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. AT RISK TABLE */}
        <div className="table-card">
          <h3 className="table-title">⚠️ Attendance Intervention List</h3>
          <p className="table-subtitle">Students currently below the 75% attendance threshold.</p>

          {(!data.at_risk_list || data.at_risk_list.length === 0) ? (
            <div className="empty-success">
              🎉 <strong>Excellent!</strong> No students are currently at risk.
            </div>
          ) : (
            <div className="responsive-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Attendance %</th>
                    <th>Missed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.at_risk_list.map((s, idx) => (
                    <tr key={idx}>
                      <td className="font-bold">{s.name}</td>
                      <td>
                        <span className="risk-badge">{s.percentage}%</span>
                      </td>
                      <td className="text-muted">{s.missed} Classes</td>
                      <td className="status-critical">CRITICAL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .analytics-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .analytics-hero { 
          background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); 
          padding: 40px 0 100px; position: relative; overflow: hidden; 
        }
        .hero-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        .hero-container h1 { color: white; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 900; margin: 0; letter-spacing: -1px; }
        .hero-container p { color: rgba(255,255,255,0.7); margin-top: 8px; font-size: 1rem; }
        
        .back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; }

        .analytics-content { max-width: 1280px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }

        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        
        .charts-main-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 30px; }
        .chart-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .chart-card h3 { margin: 0 0 20px; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .chart-holder { height: 300px; width: 100%; }

        .table-card { background: white; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .table-title { color: #dc2626; margin: 0; font-weight: 800; font-size: 1.2rem; }
        .table-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 5px; margin-bottom: 25px; }

        .responsive-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; min-width: 600px; }
        th { text-align: left; padding: 15px; background: #fef2f2; color: #991b1b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
        
        .font-bold { font-weight: 700; color: #1e293b; }
        .risk-badge { background: #ef4444; color: white; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
        .text-muted { color: #64748b; }
        .status-critical { color: #dc2626; font-weight: 800; font-size: 0.8rem; }
        .empty-success { padding: 40px; background: #ecfdf5; color: #065f46; border-radius: 12px; text-align: center; border: 1px solid #a7f3d0; }

        @media (max-width: 600px) {
          .analytics-hero { padding-bottom: 80px; text-align: center; }
          .analytics-content { margin-top: -40px; }
          .chart-card { padding: 15px; }
          .table-card { padding: 20px; }
        }
      `}</style>
    </div>
  );
};

const KPICard = ({ title, value, color, isAlert }) => (
  <div style={{ 
    padding: '24px', 
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    borderLeft: isAlert ? `6px solid ${color}` : '1px solid #e2e8f0'
  }}>
    <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
    <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: isAlert ? color : '#0f172a' }}>{value}</h2>
  </div>
);

export default TeacherAnalytics;