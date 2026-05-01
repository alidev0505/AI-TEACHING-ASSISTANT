import React, { useState, useContext, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateContent, downloadContent } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OPTIONS = [
  { id: 'quiz', detailed: 'mcq', label: 'Quiz (MCQs)', icon: '🧩', color: '#2563eb', bg: '#eff6ff' },
  { id: 'quiz', detailed: 'qa', label: 'Quiz (Q&A)', icon: '💬', color: '#0891b2', bg: '#ecfeff' },
  { id: 'assignment', label: 'Assignment', icon: '📝', color: '#059669', bg: '#f0fdf4' },
  { id: 'midterm', label: 'Mid-Term', icon: '📋', color: '#d97706', bg: '#fffbeb' },
  { id: 'final', label: 'Final Exam', icon: '🎓', color: '#dc2626', bg: '#fef2f2' },
  { id: 'lecture', label: 'Lecture Script', icon: '📖', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'slides', label: 'Slides', icon: '🖼️', color: '#0284c7', bg: '#e0f2fe' },
];

const SUGGESTIONS = [
  'Make questions more challenging',
  'Focus on chapter definitions',
  'Add true/false questions',
  'Include case study questions',
];

const GenerateContent = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const chatBoxRef = useRef(null);

  const [contentType, setContentType] = useState('quiz');
  const [detailedType, setDetailedType] = useState('mcq');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (chatBoxRef.current)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatHistory, loading]);

  const handleGenerate = async () => {
    let history = [...chatHistory];
    if (customPrompt.trim()) {
      history.push({ role: 'user', content: customPrompt });
      setCustomPrompt('');
    } else if (history.length === 0) {
      const label = OPTIONS.find(o => o.id === contentType && (o.detailed ? o.detailed === detailedType : true))?.label || contentType;
      history.push({ role: 'user', content: `Generate ${label} content from this lecture.` });
    }
    setChatHistory(history);
    setLoading(true);
    setSidebarOpen(false); 
    try {
      const res = await generateContent({ material_id: materialId, type: contentType, detailed_type: detailedType, chat_history: history });
      setGeneratedData(res.data);
      setChatHistory([...history, { role: 'ai', content: res.data.content || res.data.preview }]);
    } catch (err) {
      console.error(err);
      alert('Error generating content. Please try again.');
    } finally { setLoading(false); }
  };

  const handlePushToInteractiveQuiz = () => {
    if (!generatedData) return;
    const targetCourseId = generatedData.course_id || materialId; 
    navigate(`/course/${targetCourseId}/create-quiz`, { 
        state: { 
            aiGeneratedContent: generatedData.content,
            title: `Quiz for Lecture Material #${materialId}`
        } 
    });
  };

  const handleDownload = async (format, includeSolutions) => {
    if (!generatedData) return;
    try {
      const res = await downloadContent(generatedData.content_id, format, includeSolutions);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contentType}_${includeSolutions ? 'SolutionKey' : 'StudentCopy'}.${format}`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) { console.error(err); alert('Download failed.'); }
  };

  const selectedOption = OPTIONS.find(o => o.id === contentType && (o.detailed ? o.detailed === detailedType : true));
  const accent = selectedOption?.color || '#2563eb';
  const accentBg = selectedOption?.bg || '#eff6ff';

  return (
    <div className="gen-page-wrapper">
      
      {/* ── TOP BAR (Matching Dashboard Gradient) ── */}
      <nav className="gen-top-bar">
        <div className="hero-overlay-pattern" />
        <div className="top-bar-container">
            <div className="top-bar-left">
                <button onClick={() => navigate(-1)} className="gen-back-btn">←</button>
                <div className="gen-logo-area">
                    <div className="gen-logo-icon">🎓</div>
                    <div className="gen-logo-text">
                        <div className="main-title">AI Teaching Assistant</div>
                        <div className="sub-title">Lecture Engine • Material #{materialId}</div>
                    </div>
                </div>
            </div>

            <div className="top-bar-right">
                <div className="ai-status-pill hide-mobile">
                    <span className="dot-blink" />
                    <span className="status-text">Intelligence Ready</span>
                </div>
                <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? '✕' : '☰'}
                </button>
            </div>
        </div>
      </nav>

      {/* ── MAIN LAYOUT ── */}
      <div className="gen-main-layout">
        
        {/* Mobile Backdrop */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`gen-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-inner">
            <div className="sidebar-header">Generation Mode</div>
            <div className="sidebar-scrollable">
                {OPTIONS.map((opt, i) => {
                const isActive = contentType === opt.id && (opt.detailed ? detailedType === opt.detailed : true);
                return (
                    <button key={i} className={`opt-btn ${isActive ? 'active' : ''}`} 
                    onClick={() => { setContentType(opt.id); setDetailedType(opt.detailed || null); if(window.innerWidth < 900) setSidebarOpen(false); }}
                    style={{ '--accent': opt.color, '--accent-bg': opt.bg }}
                    >
                    <div className="opt-icon">{opt.icon}</div>
                    <span className="opt-label">{opt.label}</span>
                    {isActive && <div className="active-dot" />}
                    </button>
                );
                })}
            </div>

            {generatedData && (
              <div className="sidebar-footer">
                <div className="sidebar-header">Post-Generation</div>
                {contentType === 'quiz' && (
                  <button onClick={handlePushToInteractiveQuiz} className="interactive-btn">
                    🚀 Make Interactive Quiz
                  </button>
                )}
                <div className="export-group">
                  <button onClick={() => handleDownload('pdf', false)} className="export-btn">PDF Student Copy</button>
                  <button onClick={() => handleDownload('docx', true)} className="export-btn">Word Solution Key</button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT CHAT PANEL ── */}
        <div className="gen-chat-panel">
          <header className="chat-header">
            <div className="chat-header-info">
                <div className="chat-header-icon" style={{ background: accentBg, border: `1px solid ${accent}33` }}>{selectedOption?.icon || '🤖'}</div>
                <div className="chat-header-text">
                    <div className="chat-title">{selectedOption?.label} Generator</div>
                    <div className="chat-subtitle">Analyzing lecture content for automation...</div>
                </div>
            </div>
            {chatHistory.length > 0 && (
              <button onClick={() => { setChatHistory([]); setGeneratedData(null); }} className="clear-chat-btn">Clear</button>
            )}
          </header>
          
          <div ref={chatBoxRef} className="chat-messages-area">
            {chatHistory.length === 0 ? (
              <div className="empty-chat-state">
                <div className="empty-icon-box">🧠</div>
                <h2>System Ready</h2>
                <p>Choose a content format from the left sidebar and click send to begin.</p>
                <div className="suggestion-chips">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setCustomPrompt(s)} className="chip-btn" style={{ '--accent': accent, '--accent-bg': accentBg }}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div className="msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                  <div className="msg-content-wrapper">
                    <div className="msg-bubble" style={msg.role === 'user' ? {background: 'linear-gradient(135deg, #1d4ed8, #0284c7)'} : {}}>{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="msg-row ai">
                <div className="msg-avatar">🤖</div>
                <div className="loading-bubble">
                  <span className="dot-bounce" style={{'--delay': '0s', '--accent': '#1d4ed8'}} />
                  <span className="dot-bounce" style={{'--delay': '0.2s', '--accent': '#1d4ed8'}} />
                  <span className="dot-bounce" style={{'--delay': '0.4s', '--accent': '#1d4ed8'}} />
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <div className="chat-input-bar">
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder={`Type instructions for ${selectedOption?.label}...`}
                rows={1}
              />
              <button onClick={handleGenerate} disabled={loading} className="send-msg-btn">
                {loading ? '...' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .gen-page-wrapper { background: #f8fafc; height: 100vh; display: flex; flex-direction: column; font-family: 'Inter', sans-serif; overflow: hidden; }
        
        .gen-top-bar { 
          background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%);
          height: 68px; display: flex; align-items: center; position: relative; z-index: 1100;
        }
        .hero-overlay-pattern { position: absolute; inset: 0; opacity: 0.1; background-image: radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
        .top-bar-container { width: 100%; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; position: relative; }
        
        .top-bar-left { display: flex; align-items: center; gap: 18px; }
        .gen-back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); width: 34px; height: 34px; border-radius: 8px; cursor: pointer; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .gen-logo-area { display: flex; align-items: center; gap: 12px; }
        .gen-logo-icon { font-size: 1.3rem; }
        .main-title { font-weight: 800; font-size: 0.95rem; color: white; letter-spacing: -0.2px; }
        .sub-title { font-size: 0.7rem; color: rgba(255,255,255,0.6); font-weight: 500; }

        .ai-status-pill { display: flex; align-items: center; gap: 8px; background: rgba(52, 211, 153, 0.1); padding: 6px 14px; border-radius: 50px; border: 1px solid rgba(52, 211, 153, 0.2); }
        .dot-blink { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        .status-text { font-size: 0.7rem; color: #10b981; font-weight: 800; text-transform: uppercase; }

        .mobile-sidebar-toggle { display: none; background: white; color: #0f172a; border: none; width: 40px; height: 40px; border-radius: 8px; font-size: 1.2rem; cursor: pointer; }

        .gen-main-layout { display: flex; flex: 1; overflow: hidden; position: relative; }

        .gen-sidebar { width: 280px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: transform 0.3s ease; z-index: 1060; }
        .sidebar-inner { display: flex; flex-direction: column; height: 100%; padding: 24px 20px; }
        .sidebar-header { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin: 20px 0 12px 5px; }
        .sidebar-scrollable { flex: 1; overflow-y: auto; }
        
        .opt-btn { background: transparent; border: 1.5px solid transparent; border-radius: 12px; padding: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; width: 100%; transition: 0.2s; margin-bottom: 6px; }
        .opt-btn.active { background: var(--accent-bg); border-color: rgba(0,0,0,0.02); }
        .opt-icon { width: 38px; height: 38px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .active .opt-icon { background: white; color: var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .opt-label { color: #475569; font-weight: 600; font-size: 0.85rem; }
        .active .opt-label { color: var(--accent); font-weight: 700; }
        .active-dot { margin-left: auto; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

        .sidebar-footer { padding-top: 20px; border-top: 1px solid #f1f5f9; margin-top: 20px; }
        .interactive-btn { width: 100%; padding: 12px; border-radius: 10px; background: #0f172a; color: white; border: none; font-weight: 800; cursor: pointer; font-size: 0.8rem; margin-bottom: 12px; }
        .export-group { display: flex; flex-direction: column; gap: 8px; }
        .export-btn { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; cursor: pointer; font-size: 0.75rem; text-align: center; }

        .gen-chat-panel { flex: 1; display: flex; flex-direction: column; background: #fcfcfc; }
        .chat-header { background: white; border-bottom: 1px solid #e2e8f0; padding: 15px 24px; display: flex; align-items: center; justify-content: space-between; }
        .chat-header-info { display: flex; align-items: center; gap: 12px; }
        .chat-header-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .chat-title { font-weight: 800; font-size: 0.95rem; color: #0f172a; }
        .chat-subtitle { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
        .clear-chat-btn { background: #f1f5f9; color: #475569; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 700; }

        .chat-messages-area { flex: 1; overflow-y: auto; padding: 30px 24px; display: flex; flex-direction: column; gap: 24px; }
        .msg-row { display: flex; gap: 15px; max-width: 85%; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-avatar { width: 34px; height: 34px; border-radius: 8px; background: white; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
        .user .msg-avatar { background: #0f172a; border: none; color: white; }
        .msg-bubble { padding: 14px 18px; border-radius: 16px; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; background: white; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .user .msg-bubble { color: white; border: none; border-bottom-right-radius: 2px; box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15); }
        .ai .msg-bubble { border-bottom-left-radius: 2px; }

        .chat-input-container { background: white; border-top: 1px solid #e2e8f0; padding: 20px 24px; }
        .chat-input-bar { max-width: 800px; margin: 0 auto; display: flex; gap: 12px; align-items: flex-end; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 10px 15px; }
        .chat-input-bar textarea { flex: 1; background: transparent; border: none; outline: none; padding: 8px 0; font-family: inherit; font-size: 0.95rem; resize: none; max-height: 120px; color: #0f172a; }
        .send-msg-btn { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #1d4ed8, #0284c7); color: white; border: none; cursor: pointer; font-weight: 800; font-size: 1.2rem; }

        .empty-chat-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; }
        .empty-icon-box { font-size: 3rem; margin-bottom: 15px; opacity: 0.3; }
        .suggestion-chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 30px; }
        .chip-btn { background: white; border: 1px solid #e2e8f0; padding: 8px 18px; border-radius: 50px; color: #475569; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.8rem; }
        .chip-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }

        .dot-bounce { width: 6px; height: 6px; background: #1d4ed8; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; animation-delay: var(--delay); margin: 0 2px; }
        .loading-bubble { background: white; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 12px; display: flex; align-items: center; }

        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        @media (max-width: 900px) {
          .gen-sidebar { position: fixed; left: 0; top: 68px; bottom: 0; z-index: 1100; transform: translateX(-100%); width: 280px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
          .gen-sidebar.open { transform: translateX(0); }
          .sidebar-overlay { position: fixed; inset: 0; top: 68px; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; }
          .mobile-sidebar-toggle { display: block; }
          .hide-mobile { display: none; }
          .msg-row { max-width: 95%; }
        }
      `}</style>
    </div>
  );
};

export default GenerateContent;