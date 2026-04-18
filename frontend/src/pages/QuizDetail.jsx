import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../services/api';
import toast from 'react-hot-toast';
import { FiClock, FiCheck, FiX, FiFlag, FiChevronLeft, FiChevronRight, FiSend, FiTag } from 'react-icons/fi';

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('intro'); // intro | doing | result
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getQuiz(id)
      .then(res => { setQuiz(res.data.data); setTimeLeft(res.data.data.duration * 60); })
      .catch(() => toast.error('Không tải được bài kiểm tra'))
      .finally(() => setLoading(false));
    return () => clearInterval(timerRef.current);
  }, [id]);

  // Timer
  useEffect(() => {
    if (phase !== 'doing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleStart = () => setPhase('doing');

  const handleSelect = (qId, opt) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && Object.keys(answers).length < quiz.questions.length) {
      const unanswered = quiz.questions.length - Object.keys(answers).length;
      if (!window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Nộp bài?`)) return;
    }
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeTaken = quiz.duration * 60 - timeLeft;
      const { data } = await submitQuiz(id, { answers, timeTaken });
      setResult(data.data);
      setPhase('result');
    } catch {
      toast.error('Nộp bài thất bại, thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!quiz) return <div className="page-loading"><p>Không tìm thấy bài kiểm tra</p></div>;

  /* ─── INTRO ─── */
  if (phase === 'intro') return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 640 }}>
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)', overflow: 'hidden'
        }}>
          {/* Thumbnail header */}
          {quiz.thumbnail ? (
            <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
              <img src={quiz.thumbnail} alt={quiz.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(21,101,192,0.85) 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 32px'
              }}>
                <div style={{ fontSize: '0.82rem', opacity: 0.8, color: 'white', marginBottom: 6 }}>BÀI KIỂM TRA LỊCH SỬ</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: 'white', lineHeight: 1.3 }}>{quiz.title}</h1>
                {quiz.categoryName && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
                    background: 'rgba(255,255,255,0.2)', color: 'white',
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600,
                    backdropFilter: 'blur(4px)'
                  }}>
                    <FiTag size={12} /> {quiz.categoryName}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '36px 40px', color: 'white' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 8 }}>BÀI KIỂM TRA LỊCH SỬ</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: 4, lineHeight: 1.3 }}>{quiz.title}</h1>
              {quiz.categoryName && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
                  background: 'rgba(255,255,255,0.15)', color: 'white',
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600
                }}>
                  <FiTag size={12} /> {quiz.categoryName}
                </span>
              )}
              {quiz.description && <p style={{ opacity: 0.8, fontSize: '0.95rem', marginTop: 10 }}>{quiz.description}</p>}
            </div>
          )}

          <div style={{ padding: '32px 40px' }}>
            {quiz.thumbnail && quiz.description && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.95rem' }}>{quiz.description}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Số câu hỏi', value: `${quiz.totalQuestions} câu` },
                { label: 'Thời gian', value: `${quiz.duration} phút` },
                { label: 'Khối lớp', value: quiz.grade === 'mixed' ? 'Tổng hợp' : `Lớp ${quiz.grade}` },
                { label: 'Độ khó', value: { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }[quiz.difficulty] },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--bg)', borderRadius: 10, padding: '14px 18px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{
              background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 28, fontSize: '0.88rem', color: 'var(--primary-dark)'
            }}>
              📌 Lưu ý: Sau khi bắt đầu, đồng hồ sẽ đếm ngược. Bài sẽ tự động nộp khi hết thời gian.
            </div>
            <button onClick={handleStart} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem' }}>
              🚀 Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── DOING ─── */
  if (phase === 'doing') {
    const q = quiz.questions[currentQ];
    const answered = Object.keys(answers).length;
    const progress = (answered / quiz.questions.length) * 100;
    const isLow = timeLeft < 120;

    return (
      <div style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Quiz header */}
        <div style={{
          background: 'white', borderBottom: '1px solid var(--border)',
          padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 68, zIndex: 100
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {quiz.title}
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            borderRadius: 8, background: isLow ? '#FFEBEE' : 'var(--primary-50)',
            color: isLow ? 'var(--error)' : 'var(--primary)', fontWeight: 700, fontSize: '1.05rem'
          }}>
            <FiClock /> {formatTime(timeLeft)}
          </div>
          <button onClick={() => handleSubmit()} disabled={submitting} className="btn btn-accent" style={{ padding: '9px 18px' }}>
            <FiSend /> Nộp bài
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 0, maxHeight: 'calc(100vh - 68px - 70px)' }}>
          {/* Question panel */}
          <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)', padding: '32px'
            }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <span style={{
                  background: 'var(--primary)', color: 'white', borderRadius: 8,
                  padding: '4px 12px', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                }}>
                  Câu {currentQ + 1}/{quiz.questions.length}
                </span>
                {q.question.startsWith('Câu') && (
                  <span className="badge badge-blue">Đọc hiểu</span>
                )}
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 28, color: 'var(--text-primary)' }}>
                {q.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(q.options).map(([key, val]) => {
                  if (!val) return null;
                  const selected = answers[q.id] === key;
                  return (
                    <button key={key} onClick={() => handleSelect(q.id, key)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
                      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                      background: selected ? 'var(--primary-50)' : 'white',
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s', width: '100%'
                    }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: selected ? 'var(--primary)' : 'var(--border)',
                        color: selected ? 'white' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.85rem'
                      }}>{key}</span>
                      <span style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-primary)', paddingTop: 3 }}>{val}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}
                  className="btn btn-outline" style={{ opacity: currentQ === 0 ? 0.4 : 1 }}>
                  <FiChevronLeft /> Câu trước
                </button>
                <button onClick={() => setCurrentQ(c => Math.min(quiz.questions.length - 1, c + 1))}
                  disabled={currentQ === quiz.questions.length - 1}
                  className="btn btn-primary" style={{ opacity: currentQ === quiz.questions.length - 1 ? 0.4 : 1 }}>
                  Câu tiếp <FiChevronRight />
                </button>
              </div>
            </div>
          </div>

          {/* Question grid sidebar */}
          <div style={{
            width: 300, background: 'white', borderLeft: '1px solid var(--border)',
            padding: '20px 16px', overflow: 'auto', flexShrink: 0
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
              Bảng câu hỏi
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, fontSize: '0.78rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                Đã trả lời ({answered})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                Chưa ({quiz.questions.length - answered})
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {quiz.questions.map((q2, i) => (
                <button key={q2.id} onClick={() => setCurrentQ(i)} style={{
                  width: 36, height: 36, borderRadius: 6, fontWeight: 600, fontSize: '0.8rem',
                  border: currentQ === i ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: answers[q2.id] ? 'var(--primary)' : 'white',
                  color: answers[q2.id] ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => handleSubmit()} disabled={submitting} className="btn btn-accent"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20, fontSize: '0.9rem' }}>
              {submitting ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><FiSend /> Nộp bài</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── RESULT ─── */
  if (phase === 'result' && result) {
    const pass = result.score >= 50;
    const scoreColor = result.score >= 80 ? 'var(--success)' : result.score >= 50 ? 'var(--accent)' : 'var(--error)';

    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 760 }}>
          {/* Score card */}
          <div style={{
            background: 'white', borderRadius: 20, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)', overflow: 'hidden', marginBottom: 24
          }}>
            <div style={{
              background: pass ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' : 'linear-gradient(135deg, #B71C1C, #C62828)',
              padding: '36px', textAlign: 'center', color: 'white'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 8 }}>{pass ? '🎉' : '📖'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800 }}>
                {result.score}%
              </div>
              <div style={{ fontSize: '1.1rem', opacity: 0.9, marginTop: 6 }}>
                {pass ? 'Xuất sắc! Bạn đã đạt bài kiểm tra' : 'Cố gắng hơn nhé! Làm lại sẽ tốt hơn'}
              </div>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Đúng', value: result.correctAnswers, color: 'var(--success)', bg: '#E8F5E9' },
                  { label: 'Sai', value: result.totalQuestions - result.correctAnswers, color: 'var(--error)', bg: '#FFEBEE' },
                  { label: 'Tổng', value: result.totalQuestions, color: 'var(--primary)', bg: 'var(--primary-50)' },
                ].map(item => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => { setPhase('intro'); setAnswers({}); setCurrentQ(0); setTimeLeft(quiz.duration * 60); }}
                  className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Làm lại
                </button>
                <button onClick={() => navigate('/quiz')} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Bài khác
                </button>
              </div>
            </div>
          </div>

          {/* Detailed answers */}
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Đáp án chi tiết</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {quiz.questions.map((q, i) => {
              const ans = result.answers.find(a => a.questionId === q.id);
              const correct = ans?.isCorrect;
              return (
                <div key={q.id} style={{
                  background: 'white', border: `1.5px solid ${correct ? '#A5D6A7' : '#FFCDD2'}`,
                  borderRadius: 12, padding: '18px 22px'
                }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: correct ? 'var(--success)' : 'var(--error)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
                    }}>
                      {correct ? <FiCheck size={14} /> : <FiX size={14} />}
                    </span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5 }}>
                      Câu {i + 1}: {q.question}
                    </p>
                  </div>
                  <div style={{ paddingLeft: 38, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(q.options).map(([key, val]) => {
                      if (!val) return null;
                      const isCorrectOpt = key === q.answer;
                      const isUserOpt = key === ans?.selectedAnswer;
                      let bg = 'transparent', border = 'transparent', color = 'var(--text-secondary)';
                      if (isCorrectOpt) { bg = '#E8F5E9'; border = '#A5D6A7'; color = 'var(--success)'; }
                      if (isUserOpt && !correct) { bg = '#FFEBEE'; border = '#FFCDD2'; color = 'var(--error)'; }
                      return (
                        <div key={key} style={{
                          padding: '8px 14px', borderRadius: 8, border: `1px solid ${border}`,
                          background: bg, fontSize: '0.88rem', color, display: 'flex', gap: 8
                        }}>
                          <strong>{key}.</strong> {val}
                          {isCorrectOpt && <span style={{ marginLeft: 'auto', fontWeight: 700 }}>✓ Đúng</span>}
                          {isUserOpt && !correct && <span style={{ marginLeft: 'auto', fontWeight: 700 }}>Bạn chọn</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{
                      marginTop: 12, paddingLeft: 38, paddingTop: 12,
                      borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)'
                    }}>
                      💡 <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}