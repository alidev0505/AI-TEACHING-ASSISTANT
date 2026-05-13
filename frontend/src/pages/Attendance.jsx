import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { getAttendanceReport } from '../services/api';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const Attendance = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState('mark');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [session, setSession] = useState(1);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [isLocked, setIsLocked] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => { fetchCourseDetails(); }, [courseId]);

    useEffect(() => {
        if (activeTab === 'report') fetchReport();
    }, [activeTab]);

    const fetchCourseDetails = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/content/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setStudents(data.students || []);
                setIsLocked(data.course?.is_attendance_locked || false);
                const initialMap = {};
                if (data.students) data.students.forEach(s => initialMap[s.id] = null);
                setAttendanceMap(initialMap);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchReport = async () => {
        try {
            const res = await getAttendanceReport(courseId);
            setReportData({
                pie: res.data.pie || [],
                trend: res.data.trend || [],
                at_risk: res.data.at_risk || []
            });
        } catch (err) { console.error("Failed to load report", err); }
    };

    const markAllPresent = () => {
        if (isLocked) return;
        const newMap = {};
        students.forEach(s => newMap[s.id] = 'Present');
        setAttendanceMap(newMap);
    };

    const toggleStatus = (studentId) => {
        if (isLocked) return;
        setAttendanceMap(prev => {
            const current = prev[studentId];
            let nextStatus = 'Present';
            if (current === 'Present') nextStatus = 'Absent';
            else if (current === 'Absent') nextStatus = 'Late';
            else if (current === 'Late') nextStatus = 'Present';
            return { ...prev, [studentId]: nextStatus };
        });
    };

    const saveAttendance = async () => {
        const pending = students.filter(s => !attendanceMap[s.id]);
        if (pending.length > 0) return alert(`Incomplete selection for some students.`);
        setSubmitting(true);
        const token = localStorage.getItem('token');
        const records = Object.entries(attendanceMap).map(([sid, status]) => ({
            student_id: parseInt(sid), status: status
        }));
        try {
            const res = await fetch('https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/content/attendance/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ course_id: courseId, date: date, session_number: session, records: records })
            });
            if (res.ok) alert('Attendance Saved!');
        } catch (err) { alert('Error saving'); } finally { setSubmitting(false); }
    };

    const lockAttendance = async () => {
        if (!window.confirm("FINAL WARNING: Cannot edit after locking.")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/content/attendance/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ course_id: courseId })
        });
            if (res.ok) { setIsLocked(true); alert("🔒 Sheet Locked"); }
        } catch (err) { console.error(err); }
    };

    const getBadgeClass = (status) => {
        if (status === 'Present') return 'status-present';
        if (status === 'Absent') return 'status-absent';
        if (status === 'Late') return 'status-late';
        return 'status-pending';
    };

    const COLORS = { Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b' };

    return (
        <div className="att-page-wrapper">
            <Navbar />

            {/* 1. HERO HEADER */}
            <div className="att-hero">
                <div className="hero-pattern" />
                <div className="hero-container">
                    <button onClick={() => navigate(-1)} className="back-btn-hero">← Back</button>
                    <h1 className="hero-title">Attendance Manager</h1>
                </div>
            </div>

            <div className="att-main-content">
                {/* 2. TABS */}
                <div className="att-tab-bar">
                    <button onClick={() => setActiveTab('mark')} className={`tab-btn ${activeTab === 'mark' ? 'active' : ''}`}>
                        📝 Mark Session
                    </button>
                    <button onClick={() => setActiveTab('report')} className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}>
                        📊 Visual Report
                    </button>
                </div>

                {/* --- MARK ATTENDANCE TAB --- */}
                {activeTab === 'mark' && (
                    <div className="mark-tab-content">
                        <div className="control-panel-card">
                            <div className="panel-header">
                                <h3>Session Settings</h3>
                                {isLocked && <span className="lock-tag">LOCKED</span>}
                            </div>
                            <div className="panel-form">
                                <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLocked} />
                                </div>
                                <div className="input-group">
                                    <label>Session</label>
                                    <select value={session} onChange={(e) => setSession(e.target.value)} disabled={isLocked}>
                                        {[...Array(16)].map((_, i) => <option key={i} value={i + 1}>Session {i + 1}</option>)}
                                    </select>
                                </div>
                                {!isLocked && (
                                    <button onClick={markAllPresent} className="btn-bulk-action">All Present</button>
                                )}
                            </div>
                        </div>

                        <div className="table-card">
                            {loading ? <div className="loader-msg">Loading Class...</div> : (
                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Student Name</th>
                                                <th style={{ textAlign: 'center' }}>Mark Attendance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => (
                                                <tr key={student.id}>
                                                    <td className="id-cell">{student.university_id || 'N/A'}</td>
                                                    <td className="name-cell">{student.username}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button 
                                                            onClick={() => toggleStatus(student.id)} 
                                                            className={`status-pill ${getBadgeClass(attendanceMap[student.id])}`}
                                                            disabled={isLocked}
                                                        >
                                                            {attendanceMap[student.id] || 'Mark'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {!isLocked && (
                            <div className="floating-action-footer">
                                <button onClick={lockAttendance} className="btn-lock">Lock Sheet</button>
                                <button onClick={saveAttendance} disabled={submitting} className="btn-save">
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- REPORTS TAB --- */}
                {activeTab === 'report' && (
                    <div className="report-tab-content">
                        {!reportData ? (
                            <div className="loader-msg">Generating Data...</div>
                        ) : (
                            <>
                                <div className="charts-grid">
                                    <div className="chart-card">
                                        <h3>📈 Attendance Trend</h3>
                                        <div className="chart-wrapper">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={reportData.trend || []}>
                                                    <defs>
                                                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="session" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                                                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                                                    <Area type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} fill="url(#colorPv)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="chart-card">
                                        <h3>📊 Distribution</h3>
                                        <div className="chart-wrapper">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie data={reportData.pie || []} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                                                        {(reportData.pie || []).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend verticalAlign="bottom" iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="risk-table-card">
                                    <h3 className="risk-title">⚠️ Student Risk Analysis</h3>
                                    <p className="risk-subtitle">Individuals falling below 75% attendance criteria.</p>
                                    <div className="table-responsive">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Percentage</th>
                                                    <th>Sessions Missed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.at_risk.map((s, idx) => (
                                                    <tr key={idx}>
                                                        <td className="name-cell">{s.name}</td>
                                                        <td><span className="risk-pill">{s.percentage}%</span></td>
                                                        <td className="missed-cell">{s.missed} Sessions</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {reportData.at_risk.length === 0 && <div className="good-standing-msg">🎉 Everyone is currently in good standing!</div>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .att-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', sans-serif; }
                .att-hero { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
                .hero-pattern { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px; }
                .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
                .hero-title { margin: 0; font-size: clamp(1.6rem, 5vw, 2.4rem); color: white; font-weight: 900; letter-spacing: -1px; }
                .back-btn-hero { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-bottom: 20px; }

                .att-main-content { max-width: 1280px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }
                
                .att-tab-bar { display: flex; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 25px; }
                .tab-btn { flex: 1; padding: 18px 15px; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
                .tab-btn.active { background: #eff6ff; color: #1d4ed8; font-weight: 800; border-bottom: 3px solid #1d4ed8; }

                .control-panel-card { background: white; padding: 25px; border-radius: 16px; border-left: 6px solid #2563eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 25px; }
                .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .lock-tag { background: #fee2e2; color: #dc2626; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; }
                .panel-form { display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end; }
                .input-group { flex: 1; min-width: 180px; }
                .input-group label { display: block; margin-bottom: 8px; font-weight: 700; color: #475569; font-size: 0.8rem; text-transform: uppercase; }
                .input-group input, .input-group select { width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; outline: none; font-family: inherit; }
                .btn-bulk-action { background: #1d4ed8; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }

                .table-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .table-responsive { width: 100%; overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; min-width: 600px; }
                th { text-align: left; padding: 15px 20px; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
                td { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
                .name-cell { font-weight: 700; color: #1e293b; }
                .id-cell { font-family: monospace; color: #64748b; font-size: 0.85rem; }

                .status-pill { border: none; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; min-width: 110px; }
                .status-present { background: #dcfce7; color: #166534; }
                .status-absent { background: #fee2e2; color: #991b1b; }
                .status-late { background: #fef9c3; color: #854d0e; }
                .status-pending { background: #f1f5f9; color: #94a3b8; border: 1px dashed #cbd5e1; }

                .floating-action-footer { position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); padding: 12px 25px; border-radius: 100px; border: 1px solid #e2e8f0; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000; }
                .btn-lock { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 20px; border-radius: 50px; font-weight: 700; cursor: pointer; }
                .btn-save { background: #10b981; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-weight: 700; cursor: pointer; }

                .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr)); gap: 20px; margin-bottom: 25px; }
                .chart-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; }
                .chart-wrapper { width: 100%; height: 300px; }

                .risk-table-card { background: white; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 6px solid #ef4444; }
                .risk-title { color: #dc2626; font-weight: 800; margin: 0; }
                .risk-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 5px; margin-bottom: 25px; }
                .risk-pill { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; }
                .good-standing-msg { padding: 40px; text-align: center; background: #ecfdf5; color: #065f46; border-radius: 12px; font-weight: 600; }

                .loader-msg { padding: 100px; text-align: center; color: #64748b; font-weight: 600; }

                @media (max-width: 768px) {
                    .panel-form { flex-direction: column; align-items: stretch; }
                    .btn-bulk-action { width: 100%; }
                    .att-hero { text-align: center; padding-bottom: 80px; }
                    .att-main-content { margin-top: -40px; }
                    .floating-action-footer { width: 90%; justify-content: center; }
                    .tab-btn { font-size: 0.75rem; padding: 15px 5px; }
                }
            `}</style>
        </div>
    );
};

export default Attendance;