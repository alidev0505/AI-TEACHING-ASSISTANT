import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CreateQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [title, setTitle] = useState(location.state?.title || '');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [deadline, setDeadline] = useState(''); 
  
  const [questions, setQuestions] = useState([
    { text: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }
  ]);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.aiGeneratedContent) {
      try {
        const aiText = location.state.aiGeneratedContent;
        const questionBlocks = aiText
          .split(/(?:Question\s*\d+[:\.]?|(?:\n|^)\d+[\.\)])/gi)
          .map(block => block.trim())
          .filter(block => block.length > 15);

        const parsedQuestions = questionBlocks.map(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
          const questionText = lines.find(l => !l.match(/^[A-D][\.\)\-:]/i)) || "Untitled Question";
          const options = { A: '', B: '', C: '', D: '' };
          let correct = 'A';

          lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            if (line.match(/^[aA][\.\)\-:]/)) options.A = line.replace(/^[aA][\.\)\-:]\s*/, '').trim();
            if (line.match(/^[bB][\.\)\-:]/)) options.B = line.replace(/^[bB][\.\)\-:]\s*/, '').trim();
            if (line.match(/^[cC][\.\)\-:]/)) options.C = line.replace(/^[cC][\.\)\-:]\s*/, '').trim();
            if (line.match(/^[dD][\.\)\-:]/)) options.D = line.replace(/^[dD][\.\)\-:]\s*/, '').trim();
            
            if (lowerLine.includes('correct') || lowerLine.includes('answer:')) {
                if (lowerLine.match(/[:\s]a(?!\w)/)) correct = 'A';
                else if (lowerLine.match(/[:\s]b(?!\w)/)) correct = 'B';
                else if (lowerLine.match(/[:\s]c(?!\w)/)) correct = 'C';
                else if (lowerLine.match(/[:\s]d(?!\w)/)) correct = 'D';
            }
          });
          return { text: questionText, options, correct };
        });

        if (parsedQuestions.length > 0) setQuestions(parsedQuestions);
      } catch (err) {
        console.error("Error parsing AI content:", err);
      }
    }
  }, [location.state]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { text: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeQuestion = (index) => {
    setQuestions(prev => {
        const list = [...prev];
        list.splice(index, 1);
        return list;
    });
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => {
        const list = [...prev];
        if (field.startsWith('option_')) {
            const key = field.split('_')[1]; 
            list[index].options[key] = value;
        } else {
            list[index][field] = value;
        }
        return list;
    });
  };

  const handleSubmit = async () => {
    if (!title) return alert("Please enter a quiz title");
    if (questions.some(q => !q.text || !q.options.A || !q.options.B)) return alert("Please fill in all question fields");

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
        const res = await fetch('https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/quiz/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                course_id: courseId, title: title, time_limit: timeLimit,
                questions: questions, is_published: true, deadline: deadline || null 
            })
        });

        if (res.ok) {
            alert("🚀 Quiz Assigned to Students Successfully!");
            navigate(`/course/${courseId}`); 
        } else {
            const d = await res.json();
            alert(d.error || "Failed to create quiz");
        }
    } catch (err) {
        alert("Error submitting quiz");
    } finally { setSubmitting(false); }
};

  return (
    <div className="create-quiz-wrapper">
      <Navbar />

      {/* HERO SECTION */}
      <div className="quiz-hero">
        <div className="hero-container">
          <button onClick={() => navigate(-1)} className="back-btn-trans"> ← Back </button>
          <div className="hero-flex-header">
            <div className="hero-text">
                <h1>{location.state?.aiGeneratedContent ? "Review AI Quiz" : "Create New Quiz"}</h1>
                <p>{location.state?.aiGeneratedContent ? "Confirm the AI generated questions below." : "Manually build your quiz."}</p>
            </div>
            <button onClick={addQuestion} className="btn-white-action"> + Add Question </button>
          </div>
        </div>
      </div>

      <div className="quiz-form-content">
        {/* CONFIG CARD */}
        <div className="config-card">
            <h3>⚙️ Configuration</h3>
            <div className="config-grid">
                <div className="form-group">
                    <label>Quiz Title</label>
                    <input placeholder="e.g. Mid-Term Exam" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Time Limit (Mins)</label>
                    <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
                </div>
                <div className="form-group full-width-tablet">
                    <label>Deadline</label>
                    <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
            </div>
        </div>

        {/* QUESTIONS LIST */}
        {questions.map((q, index) => (
            <div key={index} className="question-entry-card">
                <div className="card-header-flex">
                    <h4 className="q-label"> Question {index + 1} </h4>
                    <button onClick={() => removeQuestion(index)} className="btn-remove-soft"> Remove </button>
                </div>
                <textarea 
                    placeholder="Type your question here..." 
                    value={q.text} 
                    onChange={(e) => handleQuestionChange(index, 'text', e.target.value)} 
                    className="q-textarea"
                />
                
                <div className="options-input-grid">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className="option-row">
                            <span className="opt-marker">{opt}:</span>
                            <input placeholder={`Option ${opt}`} value={q.options[opt]} onChange={(e) => handleQuestionChange(index, `option_${opt}`, e.target.value)} />
                        </div>
                    ))}
                </div>

                <div className="correct-answer-row">
                    <label>Correct Answer:</label>
                    <select value={q.correct} onChange={(e) => handleQuestionChange(index, 'correct', e.target.value)}>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                    </select>
                </div>
            </div>
        ))}

        {/* FOOTER ACTIONS */}
        <div className="quiz-actions-footer">
            <button onClick={addQuestion} className="btn-add-dashed"> + Add Another Question </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-submit-main">
                {submitting ? 'Creating Quiz...' : 'Publish & Assign Quiz 🚀'}
            </button>
        </div>
      </div>

      <style>{`
        .create-quiz-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .quiz-hero { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; }
        .hero-container { maxWidth: 900px; margin: 0 auto; padding: 0 20px; }
        .hero-flex-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; margin-top: 15px; }
        .hero-text h1 { margin: 0; color: white; font-size: clamp(1.8rem, 4vw, 2.2rem); font-weight: 900; }
        .hero-text p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
        
        .back-btn-trans { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-white-action { background: white; color: #1d4ed8; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }

        .quiz-form-content { maxWidth: 900px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }

        .config-card { padding: 30px; background: white; border-radius: 16px; border-left: 6px solid #2563eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .config-card h3 { margin: 0 0 20px; font-weight: 800; color: #0f172a; }
        .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        
        .form-group label { display: block; margin-bottom: 8px; font-weight: 700; color: #475569; font-size: 0.85rem; }
        .form-group input { width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; outline: none; transition: 0.2s; }
        .form-group input:focus { border-color: #2563eb; }

        .question-entry-card { padding: 30px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 6px solid #2563eb; margin-bottom: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
        .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .q-label { background: #eff6ff; color: #1d4ed8; padding: 6px 15px; border-radius: 20px; font-weight: 800; margin: 0; }
        .btn-remove-soft { background: #fee2e2; color: #ef4444; border: none; padding: 6px 15px; border-radius: 8px; font-weight: 700; cursor: pointer; }

        .q-textarea { width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 20px; min-height: 100px; font-family: inherit; resize: vertical; }
        .options-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .option-row { display: flex; align-items: center; gap: 10px; }
        .opt-marker { font-weight: 800; color: #94a3b8; }
        .option-row input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0; outline: none; }

        .correct-answer-row { background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
        .correct-answer-row label { font-weight: 800; color: #166534; }
        .correct-answer-row select { padding: 10px 15px; border-radius: 8px; border: 1.5px solid #22c55e; font-weight: 800; color: #166534; cursor: pointer; }

        .quiz-actions-footer { display: flex; flex-direction: column; gap: 15px; margin-top: 40px; }
        .btn-add-dashed { width: 100%; padding: 15px; border: 2px dashed #93c5fd; background: #eff6ff; color: #1d4ed8; border-radius: 12px; font-weight: 800; cursor: pointer; }
        .btn-submit-main { width: 100%; padding: 18px; background: linear-gradient(135deg, #1d4ed8, #0284c7); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 1.1rem; cursor: pointer; box-shadow: 0 10px 20px rgba(29, 78, 216, 0.2); }
        .btn-submit-main:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 768px) {
            .hero-flex-header { flex-direction: column; align-items: flex-start; }
            .btn-white-action { width: 100%; }
            .options-input-grid { grid-template-columns: 1fr; }
            .full-width-tablet { grid-column: 1 / -1; }
            .quiz-hero { padding-bottom: 80px; }
        }

        @media (max-width: 480px) {
            .question-entry-card { padding: 20px; }
            .correct-answer-row select { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CreateQuiz;