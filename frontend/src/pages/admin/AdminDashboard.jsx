import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOverview } from '../../services/api';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null); 

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getAdminOverview();
      setData(res.data);
    } catch (err) { 
      console.error("Failed to load analytics:", err); 
    } finally {
      setLoading(false);
    }
  };

  const getCardStyle = (id, baseStyle) => ({
    ...baseStyle,
    transform: hoveredCard === id ? 'translateY(-5px)' : 'translateY(0)',
    boxShadow: hoveredCard === id ? '0 15px 30px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
  });

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
      <h2>Loading Dashboard...</h2>
    </div>
  );

  if (!data) return (
    <div style={{ padding: '50px', textAlign: 'center', color: '#ef4444' }}>
      <h2>Error loading data. Please try again.</h2>
    </div>
  );

  const roleDistribution = [
    { name: 'Students', value: Number(data.kpi?.students) || 0 },
    { name: 'Teachers', value: Number(data.kpi?.teachers) || 0 },
  ];
  
  const chartData = data.chart && data.chart.length > 0 ? data.chart : [];
  const COLORS = ['#6366f1', '#10b981']; 

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* 1. HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 80px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'white' }}>Admin Dashboard</h1>
          <p style={{ opacity: 0.8, marginTop: '10px' }}>Real-time overview of system performance.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '-50px auto 0', padding: '0 20px' }}>
        
        {/* 2. KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <KPICard title="Total Students" value={data.kpi?.students} color="#6366f1" />
          <KPICard title="Total Teachers" value={data.kpi?.teachers} color="#10b981" />
          <KPICard title="Active Courses" value={data.kpi?.courses} color="#f59e0b" />
          <KPICard title="Total Submissions" value={data.kpi?.submissions} color="#ef4444" />
        </div>

        {/* 3. CHARTS SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          <div className="card" onMouseEnter={() => setHoveredCard('chart-trend')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('chart-trend', { padding: '25px', background: 'white', borderRadius: '12px', minWidth: 0 })}>
            <h3 style={{ margin: '0 0 20px 0', color: '#334155' }}>Activity Trends</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="submissions" stroke="#6366f1" fillOpacity={1} fill="url(#colorSub)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" onMouseEnter={() => setHoveredCard('chart-dist')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('chart-dist', { padding: '25px', background: 'white', borderRadius: '12px', minWidth: 0 })}>
            <h3 style={{ margin: '0 0 20px 0', color: '#334155' }}>User Roles</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={roleDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. RECENT ACTIVITY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', marginBottom: '40px' }}>
          <div className="card" onMouseEnter={() => setHoveredCard('feed-users')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('feed-users', { padding: '25px', background: 'white', minWidth: 0, borderRadius: '12px' })}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px', color: '#334155' }}>Newest Users</h3>
            {data.activity?.new_users?.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: i < 4 ? '1px dashed #f1f5f9' : 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', color: '#3b82f6', fontWeight: 'bold' }}>{u.username?.[0]?.toUpperCase() || 'U'}</div>
                <div><div style={{ fontWeight: 'bold', color: '#1e293b' }}>{u.username}</div><div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.role} • {u.date}</div></div>
              </div>
            ))}
          </div>
          <div className="card" onMouseEnter={() => setHoveredCard('feed-subs')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('feed-subs', { padding: '25px', background: 'white', minWidth: 0, borderRadius: '12px' })}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px', color: '#334155' }}>Recent Submissions</h3>
            {(!data.activity?.submissions || data.activity.submissions.length === 0) ? <p style={{color:'#64748b'}}>No recent submissions.</p> : data.activity.submissions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: i < 4 ? '1px dashed #f1f5f9' : 'none' }}>
                <div><div style={{ fontWeight: 'bold', color: '#1e293b' }}>{s.assignment}</div><div style={{ fontSize: '0.85rem', color: '#64748b' }}>by {s.student} • {s.date}</div></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 5. MANAGEMENT ACTIONS */}
        <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '20px', borderLeft: '5px solid #3b82f6', paddingLeft: '15px' }}>
            Management Console
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <Link to="/admin/users" className="card" onMouseEnter={() => setHoveredCard('link-users')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('link-users', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #3b82f6', color: 'inherit' })}>
                <div><h3 style={{ margin: 0, color:'#1e293b' }}>Users</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Roles & Access</p></div>
            </Link>

            {/* ✅ NEW: CLASSES CARD */}
            <Link to="/admin/classes" className="card" onMouseEnter={() => setHoveredCard('link-classes')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('link-classes', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #ec4899', color: 'inherit' })}>
                <div><h3 style={{ margin: 0, color:'#1e293b' }}>Classes</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Schedule & Clashes</p></div>
            </Link>

            <Link to="/admin/courses" className="card" onMouseEnter={() => setHoveredCard('link-courses')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('link-courses', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #f59e0b', color: 'inherit' })}>
                <div><h3 style={{ margin: 0, color:'#1e293b' }}>Attendance</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Academic Data</p></div>
            </Link>

            <Link to="/admin/semesters" className="card" onMouseEnter={() => setHoveredCard('link-sem')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('link-sem', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #f97316', color: 'inherit' })}>
                <div><h3 style={{ margin: 0, color:'#1e293b' }}>Semesters</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Academic Calendar</p></div>
            </Link>
            {/* Add this inside the Management Console grid in AdminDashboard.jsx */}

            <Link 
                to="/admin/announcements" 
                className="card" 
                onMouseEnter={() => setHoveredCard('link-ann')}
                onMouseLeave={() => setHoveredCard(null)}
                style={getCardStyle('link-ann', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #ef4444', color: 'inherit' })}
            >
                <div>
                    <h3 style={{ margin: 0, color:'#1e293b' }}>Announcements</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Post Global Alerts</p>
                </div>
            </Link>
            <Link 
                to="/admin/calendar" 
                className="card" 
                onMouseEnter={() => setHoveredCard('link-cal')}
                onMouseLeave={() => setHoveredCard(null)}
                style={getCardStyle('link-cal', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #8b5cf6', color: 'inherit' })}
            >
                <div>
                    <h3 style={{ margin: 0, color:'#1e293b' }}>Visual Calendar</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Week View & Gaps</p>
                </div>
            </Link>

            <Link to="/admin/departments" className="card" onMouseEnter={() => setHoveredCard('link-depts')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('link-depts', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #10b981', color: 'inherit' })}>
                <div><h3 style={{ margin: 0, color:'#1e293b' }}>Departments</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Programs & Faculty</p></div>
            </Link>
            <Link 
                to="/admin/feedback" 
                className="card" 
                onMouseEnter={() => setHoveredCard('link-feed')}
                onMouseLeave={() => setHoveredCard(null)}
                style={getCardStyle('link-feed', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #fbbf24', color: 'inherit' })}
            >
                <div>
                    <h3 style={{ margin: 0, color:'#1e293b' }}>Course Reviews</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Quality Assurance</p>
                </div>
            </Link>

            <Link to="/admin/reports" className="card" onMouseEnter={() => setHoveredCard('link-reports')} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle('link-reports', { textDecoration: 'none', padding:'25px', borderRadius: '12px', background: 'white', borderLeft: '4px solid #8b5cf6', color: 'inherit' })}>
                <div><h3 style={{ margin: 0, color:'#1e293b' }}>Reports</h3><p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>System Usage</p></div>
            </Link>
        </div>

      </div>
    </div>
  );
};

const KPICard = ({ title, value, color }) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ padding: '25px', borderRadius: '12px', background: 'white', borderLeft: `5px solid ${color}`, transform: hover ? 'translateY(-5px)' : 'translateY(0)', boxShadow: hover ? '0 15px 30px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
        <div><p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{title}</p><h2 style={{ margin: 0, fontSize: '2rem', color: '#1e293b' }}>{value || 0}</h2></div>
    </div>
  );
};

export default AdminDashboard;