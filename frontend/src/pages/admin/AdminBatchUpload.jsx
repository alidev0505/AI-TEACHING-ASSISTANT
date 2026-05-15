import React, { useState } from 'react';
import { uploadSchedule } from '../../services/api';

const AdminBatchUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState({
        courses_created: 0,
        courses_updated: 0,
        created_teachers: [],
        conflicts: [],
        errors: []
    });
    const [showReport, setShowReport] = useState(false);

    // 1. ✅ FIXED: Generated template columns match your university timetable perfectly
    const downloadTemplate = () => {
        const headers = 'Course Code,Program,Semester,Shift,Course Name,Credit Hours,Instructor,Day,Time In,Time Out,Room';
        const sampleRow = 'MAT 101,BSDS,I-A,M,Calculus & Analytical Geometry,3:00,Ms. Nazia Sultana,Wednesday,2:00 PM,5:00 PM,IT-401';
        
        const csvContent = [headers, sampleRow].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Schedule_Upload_Template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadCredentialsCSV = (teachers) => {
        if (!teachers || teachers.length === 0) {
            alert("No new teachers were created, so there are no credentials to download.");
            return;
        }

        const headers = 'Teacher Name,Email,Temporary Password';
        const rows = teachers.map(t => `"${t.name}","${t.email}","${t.password}"`);
        const csvContent = [headers, ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Teacher_Credentials_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setShowReport(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return alert("Please select a CSV file first.");

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await uploadSchedule(formData);
            const serverReport = res.data.report || {};
            
            setReport({
                courses_created: serverReport.courses_created || 0,
                courses_updated: serverReport.courses_updated || 0,
                created_teachers: serverReport.created_teachers || [],
                conflicts: serverReport.conflicts || [],
                errors: serverReport.errors || []
            });
            setShowReport(true);
            
            if (onUploadSuccess) onUploadSuccess();

            alert("Upload Successful!");

            if (serverReport.created_teachers && serverReport.created_teachers.length > 0) {
                downloadCredentialsCSV(serverReport.created_teachers);
            }

        } catch (err) {
            console.error(err);
            alert(`Upload Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            
            {/* --- LEFT COLUMN: UPLOAD ACTION --- */}
            <div className="card" style={{ padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>Upload Schedule</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>CSV Batch Processing</p>
                </div>

                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', background: '#f8fafc', marginBottom: '20px' }}>
                    <input 
                        type="file" 
                        accept=".csv"
                        id="csv-upload"
                        onChange={handleFileChange}
                        style={{ display: 'none' }} 
                    />
                    
                    <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1rem', display: 'block', marginBottom: '5px' }}>
                            {file ? file.name : "Click here to Select File"}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            Supported format: .csv
                        </span>
                    </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button 
                        onClick={handleUpload} 
                        disabled={loading || !file}
                        style={{ 
                            background: loading ? '#cbd5e1' : '#8b5cf6', 
                            color: 'white', border: 'none', padding: '14px', 
                            borderRadius: '8px', cursor: loading || !file ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold', transition: 'all 0.2s', width: '100%',
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? 'Processing...' : 'Start Upload'}
                    </button>

                    <button 
                        onClick={downloadTemplate}
                        style={{
                            background: 'white', border: '1px solid #e2e8f0', color: '#64748b', 
                            padding: '12px', borderRadius: '8px', cursor: 'pointer', 
                            fontSize: '0.9rem', fontWeight: '500', width: '100%'
                        }}
                    >
                        Download Template CSV
                    </button>
                </div>
            </div>

            {/* --- RIGHT COLUMN: RESULTS REPORT --- */}
            {showReport ? (
                <div className="card" style={{ padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>Upload Results</h3>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Success</span>
                    </div>

                    {/* ✅ FIXED: Clean 3-column stats panel grid layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                        <div style={{ padding: '12px 5px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2563eb' }}>{report.courses_created}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>New Courses</div>
                        </div>
                        <div style={{ padding: '12px 5px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0d9488' }}>{report.courses_updated}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>Updated Rows</div>
                        </div>
                        <div style={{ padding: '12px 5px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4f46e5' }}>{report.created_teachers.length}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>New Teachers</div>
                        </div>
                    </div>

                    {report.created_teachers.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>New Accounts</span>
                                <button
                                    onClick={() => downloadCredentialsCSV(report.created_teachers)}
                                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'underline' }}
                                >
                                    Download CSV
                                </button>
                            </div>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {report.created_teachers.map((t, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px', color: '#334155' }}>{t.name}</td>
                                                <td style={{ padding: '10px', color: '#64748b' }}>{t.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {report.conflicts && report.conflicts.length > 0 && (
                        <div style={{ padding: '15px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', color: '#b45309', marginBottom: '15px' }}>
                            <strong style={{ display: 'block', marginBottom: '5px' }}>Time Conflicts Ignored:</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                                {report.conflicts.map((conf, i) => <li key={i}>{conf}</li>)}
                            </ul>
                        </div>
                    )}

                    {report.errors && report.errors.length > 0 && (
                        <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', color: '#b91c1c' }}>
                            <strong style={{ display: 'block', marginBottom: '5px' }}>Errors Found:</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                                {report.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: '16px', color: '#94a3b8', background: '#f8fafc', minHeight: '300px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0 }}>Upload a file to view processing results</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBatchUpload;