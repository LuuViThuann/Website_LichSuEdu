import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getQuizzes, getGrades } from '../services/api';
import { FiClipboard, FiClock, FiTarget, FiFilter, FiSearch } from 'react-icons/fi';

const DIFFICULTY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const DIFFICULTY_COLORS = { easy: 'badge-green', medium: 'badge-orange', hard: 'badge-red' };

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [grade, setGrade] = useState(searchParams.get('grade') || '');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (grade) params.grade = grade;
    if (difficulty) params.difficulty = difficulty;
    getQuizzes(params)
      .then(res => { setQuizzes(res.data.data); setTotalPages(res.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grade, difficulty, page]);

  // Load danh sách lớp từ API
  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => setGrades([{id:7,name:'10'},{id:8,name:'11'},{id:9,name:'12'}]));
  }, []);

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 className="section-title">📝 Bài kiểm tra</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Luyện đề trắc nghiệm Lịch sử THPT bám sát chương trình</p>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white', borderRadius: 12, border: '1px solid var(--border)',
          padding: '16px 20px', marginBottom: 28,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" placeholder="Tìm bài kiểm tra..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <FiFilter color="var(--text-muted)" />
            {['', 'mixed', ...grades.map(g => g.name)].map(g => (
              <button key={g} onClick={() => { setGrade(g); setPage(1); }} className="btn"
                style={{
                  padding: '7px 14px', fontSize: '0.85rem',
                  background: grade === g ? 'var(--primary)' : 'var(--bg)',
                  color: grade === g ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}>
                {g === '' ? 'Tất cả' : g === 'mixed' ? 'Tổng hợp' : `Lớp ${g}`}
              </button>
            ))}
            <select className="form-select" value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }}
              style={{ width: 'auto', padding: '7px 14px', fontSize: '0.85rem' }}>
              <option value="">Độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>

        {/* Quiz grid */}
        {loading ? (
          <div className="page-loading"><div className="spinner" /><span>Đang tải bài kiểm tra...</span></div>
        ) : filtered.length === 0 ? (
          <div className="page-loading" style={{ flexDirection: 'column' }}>
            <FiClipboard size={48} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-muted)' }}>Chưa có bài kiểm tra nào</p>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {filtered.map(quiz => (
                <div key={quiz.id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FiClipboard size={20} color="var(--primary)" />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span className={`badge ${DIFFICULTY_COLORS[quiz.difficulty]}`}>
                        {DIFFICULTY_LABELS[quiz.difficulty]}
                      </span>
                      <span className="badge badge-blue">
                        {quiz.grade === 'mixed' ? 'Tổng hợp' : `Lớp ${quiz.grade}`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 6, color: 'var(--text-primary)' }}>
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {quiz.description.length > 80 ? quiz.description.slice(0, 80) + '...' : quiz.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiTarget size={12} /> {quiz.totalQuestions} câu hỏi
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={12} /> {quiz.duration} phút
                    </span>
                  </div>

                  <Link to={`/quiz/${quiz.id}`} className="btn btn-primary"
                    style={{ justifyContent: 'center', fontSize: '0.9rem', marginTop: 'auto' }}>
                    Làm bài ngay
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 36 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className="btn"
                    style={{
                      padding: '8px 14px', minWidth: 40,
                      background: page === p ? 'var(--primary)' : 'white',
                      color: page === p ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)'
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}