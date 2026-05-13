import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [timeLeft, setTimeLeft] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            setQuiz(data.quiz);
            setTimeLeft(data.quiz.time_limit * 60);
        } else {
            setErrorMsg(data.error || "Failed to load quiz");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0 && !submitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to exit the exam?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, submitting]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timerId = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                clearInterval(timerId);
                handleAutoSubmit(); 
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelect = (qId, optionKey) => {
    setAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmit = async (isAuto = false) => {
    if (submitting) return; 
    if (isAuto) alert("Time is up! Submitting automatically...");
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ quiz_id: quizId, answers: answers })
        });
        const result = await res.json();
        if (res.ok) {
            alert(`🎉 Quiz Submitted!\nScore: ${result.correct}/${result.total} (${result.score}%)`);
            const redirectId = quiz?.course_id || localStorage.getItem('last_course_id');
            navigate(redirectId ? `/course/${redirectId}` : '/student');
        } else {
            alert(result.error || "Submission failed.");
            setSubmitting(false);
        }
    } catch (err) {
        alert("Network error. Please try again.");
        setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => handleSubmit(true);

  if (loading) return <div className="quiz-loading">Loading Exam Environment...</div>;

  if (errorMsg) {
      return (
          <div className="quiz-error-page">
              <div className="error-card">
                  <div className="error-icon">🛑</div>
                  <h2>Access Denied</h2>
                  <p>{errorMsg}</p>
                  <button onClick={() => navigate(-1)} className="back-btn">← Go Back</button>
              </div>
          </div>
      );
  }

  if (!quiz) return null;

  return (
    <div className="take-quiz-wrapper">
      
        {/* STICKY HEADER */}
        <header className="quiz-header">
            <div className="header-container">
                <div className="quiz-info-meta">
                    <h3>{quiz.title}</h3>
                    <span className="hide-mobile">{quiz.deadline ? `Due: ${new Date(quiz.deadline).toLocaleDateString()}` : 'Institutional Exam'}</span>
                </div>
                
                <div className={`timer-box ${timeLeft < 60 ? 'urgent' : ''}`}>
                    <span className="hide-mobile">TIME REMAINING:</span>
                    <span className="timer-val">{formatTime(timeLeft)}</span>
                </div>
            </div>
        </header>

      {/* QUESTIONS CONTENT */}
      <main className="quiz-main">
          {quiz.questions.map((q, index) => (
              <div key={q.id} className="question-card">
                  <div className="question-text">
                      <span className="q-number">Q{index + 1}</span> 
                      <p>{q.text}</p>
                  </div>

                  <div className="options-grid">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                          const isSelected = answers[q.id] === opt;
                          return (
                            <div key={opt} onClick={() => handleSelect(q.id, opt)} className={`option-item ${isSelected ? 'selected' : ''}`}>
                                <div className="radio-circle"></div>
                                <span className="option-label">{q.options[opt]}</span>
                            </div>
                          );
                      })}
                  </div>
              </div>
          ))}

          {/* STICKY BOTTOM ACTIONS */}
          <footer className="quiz-footer">
            <div className="footer-container">
                <div className="progress-info">
                    <div className="prog-label">PROGRESS</div>
                    <div className="prog-stats">{Object.keys(answers).length} / {quiz.questions.length} Answered</div>
                </div>
                <button onClick={() => handleSubmit(false)} disabled={submitting} className="submit-exam-btn">
                    {submitting ? 'Submitting...' : 'Finish Exam 🚀'}
                </button>
            </div>
          </footer>
      </main>

      <style>{`
        .take-quiz-wrapper { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        
        .quiz-loading { padding: 100px; text-align: center; font-size: 1.2rem; color: #64748b; }

        .quiz-header { 
            position: sticky; top: 0; 
            background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); 
            color: white; padding: 12px 20px; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header-container { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .quiz-info-meta h3 { margin: 0; font-size: 1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .quiz-info-meta span { font-size: 0.75rem; opacity: 0.8; }

        .timer-box { 
            background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 50px; 
            border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700;
        }
        .timer-box.urgent { background: #ef4444; border-color: #ef4444; animation: pulse 1s infinite; }
        .timer-val { font-size: 1.2rem; font-family: 'Monaco', monospace; }

        .quiz-main { max-width: 800px; margin: 30px auto 100px; padding: 0 15px; }

        .question-card { 
            padding: 24px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; 
            border-left: 6px solid #2563eb; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .question-text { display: flex; gap: 15px; margin-bottom: 20px; }
        .q-number { background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; height: fit-content; }
        .question-text p { margin: 0; font-size: 1.1rem; font-weight: 600; color: #0f172a; line-height: 1.5; }

        .options-grid { display: grid; gap: 10px; }
        .option-item { 
            padding: 14px 18px; border: 1.5px solid #e2e8f0; border-radius: 12px; 
            cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 12px;
        }
        .option-item:hover { background: #f8fafc; border-color: #cbd5e1; }
        .option-item.selected { background: #eff6ff; border-color: #2563eb; }
        
        .radio-circle { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 50%; background: white; }
        .selected .radio-circle { border: 6px solid #2563eb; }
        .option-label { font-size: 0.95rem; font-weight: 500; color: #334155; }
        .selected .option-label { font-weight: 700; color: #1d4ed8; }

        .quiz-footer { 
            position: fixed; bottom: 0; left: 0; right: 0; background: white; 
            padding: 15px 20px; border-top: 1px solid #e2e8f0; box-shadow: 0 -4px 15px rgba(0,0,0,0.05); z-index: 1000;
        }
        .footer-container { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .prog-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px; }
        .prog-stats { font-weight: 800; font-size: 1rem; color: #0f172a; }

        .submit-exam-btn { 
            padding: 12px 24px; background: linear-gradient(135deg, #059669, #10b981); 
            color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; 
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: 0.2s;
        }
        .submit-exam-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }

        @media (max-width: 600px) {
            .hide-mobile { display: none; }
            .quiz-main { margin-top: 20px; margin-bottom: 90px; }
            .question-card { padding: 16px; }
            .question-text p { font-size: 1rem; }
            .option-item { padding: 12px; }
            .submit-exam-btn { padding: 10px 16px; font-size: 0.85rem; }
        }

        .quiz-error-page { min-height: 100vh; background: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .error-card { background: white; padding: 30px; border-radius: 16px; text-align: center; max-width: 400px; border: 1px solid #e2e8f0; }
        .error-icon { font-size: 3rem; margin-bottom: 15px; }
      `}</style>
    </div>
  );
};

export default TakeQuiz;