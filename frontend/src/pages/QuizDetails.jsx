import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizStats } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

const QuizDetails = () => {
  const { id, quizId } = useParams(); 
  const actualId = quizId || id;
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [actualId]);

  const fetchData = async () => {
    try {
      const res = await getQuizStats(actualId);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNow = async () => {
    if (!window.confirm("Do you want to assign this quiz to students immediately?")) return;
    
    setAssigning(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/quiz/${actualId}/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ is_published: true })
      });

      if (res.ok) {
        alert("🚀 Quiz assigned to students successfully!");
        fetchData();
      } else {
        alert("Failed to assign quiz.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return (
    <div className="page-layout">
        <Navbar />
        <div className="loading-state">Loading analytics...</div>
    </div>
  );

  if (!stats) return (
    <div className="page-layout">
        <Navbar />
        <div className="loading-state">No data found for this quiz.</div>
    </div>
  );

  return (
    <div className="page-layout">
      <Navbar />
      
      {/* 1. HERO HEADER */}
      <div className="quiz-hero">
        <div className="hero-overlay" />
        <div className="hero-container">
            <div className="hero-flex-wrapper">
                <div className="hero-text-content">
                    <button onClick={() => navigate(-1)} className="back-btn-hero">← Back</button>
                    <h1>{stats.title}</h1>
                    
                    <div className="status-meta-row">
                        <span className={`status-pill ${stats.is_published ? 'published' : 'draft'}`}>
                            {stats.is_published ? '● Published' : '○ Draft'}
                        </span>
                        {stats.deadline && (
                            <span className="deadline-text">
                                📅 Due: {new Date(stats.deadline).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {!stats.is_published && (
                    <button onClick={handleAssignNow} disabled={assigning} className="assign-btn">
                        {assigning ? 'Assigning...' : 'Assign to Students 🚀'}
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="main-content-area">
        
        {/* 2. KPI CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <h2 className="kpi-val">{stats.average_score}%</h2>
            <p className="kpi-label">Average Score</p>
          </div>
          <div className="kpi-card green">
            <h2 className="kpi-val">{stats.highest_score}%</h2>
            <p className="kpi-label">Highest Score</p>
          </div>
          <div className="kpi-card amber">
            <h2 className="kpi-val">{stats.total_students}</h2>
            <p className="kpi-label">Submissions</p>
          </div>
        </div>

        {/* 3. CHARTS & TABLES */}
        <div className="content-split-grid">
          
          {/* CHART SECTION */}
          <div className="visual-card">
            <h3>📈 Grade Distribution</h3>
            {stats.student_scores.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats.student_scores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} hide={window.innerWidth < 600} />
                    <YAxis domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={30}>
                        {stats.student_scores.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#3b82f6' : '#ef4444'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart">📊 Waiting for submissions...</div>
            )}
          </div>

          {/* LEADERBOARD TABLE */}
          <div className="visual-card no-padding">
            <div className="card-header-inner">
              <h3>🏆 Student Leaderboard</h3>
            </div>
            
            <div className="table-responsive">
                <table className="std-table">
                <thead>
                    <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th style={{textAlign:'right'}}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.student_scores.map((s, idx) => (
                    <tr key={idx}>
                        <td className="rank-cell">{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}</td>
                        <td className="name-cell">
                            <div className="std-name">{s.name}</div>
                            <div className="std-time">{s.submitted_at}</div>
                        </td>
                        <td className="score-cell">
                            <span className={`score-badge ${s.score >= 80 ? 'high' : s.score < 50 ? 'low' : 'mid'}`}>
                                {s.score}%
                            </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {stats.student_scores.length === 0 && <p className="no-data-msg">No entries yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .page-layout { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .loading-state { padding: 100px 20px; text-align: center; color: #64748b; font-size: 1.1rem; }

        .quiz-hero { 
          background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); 
          padding: 40px 0 100px; position: relative; overflow: hidden; 
        }
        .hero-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .hero-flex-wrapper { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; }
        .hero-text-content h1 { color: white; font-size: clamp(1.5rem, 5vw, 2.2rem); font-weight: 900; margin: 0; letter-spacing: -1px; }
        
        .back-btn-hero { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 15px; }
        
        .status-meta-row { display: flex; align-items: center; gap: 12px; marginTop: 12px; flex-wrap: wrap; }
        .status-pill { padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .status-pill.published { background: #dcfce7; color: #166534; }
        .status-pill.draft { background: #fee2e2; color: #991b1b; }
        .deadline-text { color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight: 500; }

        .assign-btn { background: #22c55e; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3); }

        .main-content-area { max-width: 1280px; margin: -50px auto 0; padding: 0 20px 60px; position: relative; z-index: 10; }

        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { padding: 24px; background: white; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .kpi-card.blue { border-top: 5px solid #2563eb; }
        .kpi-card.green { border-top: 5px solid #10b981; }
        .kpi-card.amber { border-top: 5px solid #f59e0b; }
        .kpi-val { font-size: 2.2rem; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .kpi-label { color: #64748b; font-weight: 700; font-size: 0.9rem; margin-top: 5px; }

        .content-split-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; }
        .visual-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; }
        .visual-card.no-padding { padding: 0; }
        .visual-card h3 { margin: 0 0 20px; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .card-header-inner { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; background: #fafafa; }
        .card-header-inner h3 { margin: 0; }

        .chart-wrapper { height: 350px; width: 100%; margin-top: 10px; }
        .empty-chart { height: 300px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }

        .table-responsive { width: 100%; overflow-x: auto; }
        .std-table { width: 100%; border-collapse: collapse; min-width: 320px; }
        .std-table th { text-align: left; padding: 12px 20px; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
        .std-table td { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; }
        .rank-cell { font-size: 1.2rem; width: 60px; }
        .std-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
        .std-time { font-size: 0.75rem; color: #94a3b8; margin-top: 3px; }
        .score-cell { text-align: right; }
        
        .score-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 800; }
        .score-badge.high { background: #dcfce7; color: #166534; }
        .score-badge.mid { background: #dbeafe; color: #1e40af; }
        .score-badge.low { background: #fee2e2; color: #991b1b; }
        .no-data-msg { padding: 40px; text-align: center; color: #94a3b8; }

        @media (max-width: 768px) {
            .hero-flex-wrapper { flex-direction: column; text-align: center; align-items: center; }
            .status-meta-row { justify-content: center; }
            .assign-btn { width: 100%; }
            .quiz-hero { padding-bottom: 80px; }
            .main-content-area { margin-top: -40px; }
        }
      `}</style>
    </div>
  );
};

export default QuizDetails;