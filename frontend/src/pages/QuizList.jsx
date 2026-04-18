import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getQuizzes, getGrades, getQuizCategories } from '../services/api';
import { FiClipboard, FiClock, FiTarget, FiFilter, FiSearch, FiTag, FiGrid } from 'react-icons/fi';

const DIFFICULTY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const DIFFICULTY_COLORS = { easy: 'badge-green', medium: 'badge-orange', hard: 'badge-red' };

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [grade, setGrade] = useState(searchParams.get('grade') || '');
  const [difficulty, setDifficulty] = useState('');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [grades, setGrades] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (grade) params.grade = grade;
    if (difficulty) params.difficulty = difficulty;
    if (categoryId) params.categoryId = categoryId;
    getQuizzes(params)
      .then(res => { setQuizzes(res.data.data); setTotalPages(res.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grade, difficulty, categoryId, page]);

  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => setGrades([{ id: 7, name: '10' }, { id: 8, name: '11' }, { id: 9, name: '12' }]));
  }, []);

  useEffect(() => {
    getQuizCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="section-title">Bài kiểm tra</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Luyện đề trắc nghiệm Lịch sử THPT bám sát chương trình</p>
        </div>

        {/* Search bar full width */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm bài kiểm tra..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40, marginBottom: 0, boxShadow: 'var(--shadow-sm)' }}
          />
        </div>

        {/* 3:9 layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 9fr', gap: 28, alignItems: 'start' }}>

          {/* ── SIDEBAR (col 3) ── */}
          <aside style={{
            background: 'white',
            borderRadius: 14,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '20px 18px',
            position: 'sticky',
            top: 90,
          }}>

            {/* Lọc theo lớp */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FiFilter size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lọc theo lớp
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['', 'mixed', ...grades.map(g => g.name)].map(g => (
                  <button
                    key={g}
                    onClick={() => { setGrade(g); setPage(1); }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.875rem',
                      fontWeight: grade === g ? 700 : 500,
                      borderRadius: 8,
                      border: `1.5px solid ${grade === g ? 'var(--primary)' : 'var(--border)'}`,
                      background: grade === g ? 'var(--primary)' : 'transparent',
                      color: grade === g ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {g === '' ? 'Tất cả lớp' : g === 'mixed' ? 'Tổng hợp' : `Lớp ${g}`}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 22 }} />

            {/* Lọc theo loại đề */}
            {categories.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FiTag size={14} color="#7c3aed" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Loại đề
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => { setCategoryId(''); setPage(1); }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.875rem',
                      fontWeight: categoryId === '' ? 700 : 500,
                      borderRadius: 8,
                      border: `1.5px solid ${categoryId === '' ? '#7c3aed' : 'var(--border)'}`,
                      background: categoryId === '' ? '#7c3aed' : 'transparent',
                      color: categoryId === '' ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    Tất cả loại
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCategoryId(String(c.id)); setPage(1); }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.875rem',
                        fontWeight: categoryId === String(c.id) ? 700 : 500,
                        borderRadius: 8,
                        border: `1.5px solid ${categoryId === String(c.id) ? '#7c3aed' : 'var(--border)'}`,
                        background: categoryId === String(c.id) ? '#7c3aed' : 'transparent',
                        color: categoryId === String(c.id) ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 22 }} />
            )}

            {/* Lọc theo độ khó */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FiTarget size={14} color="var(--accent)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Độ khó
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { value: '', label: 'Tất cả' },
                  { value: 'easy', label: 'Dễ' },
                  { value: 'medium', label: 'Trung bình' },
                  { value: 'hard', label: 'Khó' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setDifficulty(opt.value); setPage(1); }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.875rem',
                      fontWeight: difficulty === opt.value ? 700 : 500,
                      borderRadius: 8,
                      border: `1.5px solid ${difficulty === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: difficulty === opt.value ? 'var(--accent)' : 'transparent',
                      color: difficulty === opt.value ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT (col 9) ── */}
          <main>
            {/* Result count */}
            {!loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <FiGrid size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Hiển thị <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> bài kiểm tra
                  {grade && grade !== 'mixed' && <> · Lớp <strong style={{ color: 'var(--primary)' }}>{grade}</strong></>}
                  {grade === 'mixed' && <> · <strong style={{ color: 'var(--primary)' }}>Tổng hợp</strong></>}
                  {difficulty && <> · <strong style={{ color: 'var(--accent)' }}>{DIFFICULTY_LABELS[difficulty]}</strong></>}
                </span>
              </div>
            )}

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
                    <div key={quiz.id} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {/* Thumbnail */}
                      {quiz.thumbnail ? (
                        <div style={{
                          width: '100%', background: '#f0f4fa', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <img src={quiz.thumbnail} alt={quiz.title}
                            style={{ width: '90%', height: 'auto', display: 'block' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: '100%', height: 120, flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--primary-50) 0%, #ede9fe 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <FiClipboard size={36} color="var(--primary)" style={{ opacity: 0.45 }} />
                        </div>
                      )}

                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`badge ${DIFFICULTY_COLORS[quiz.difficulty]}`}>
                            {DIFFICULTY_LABELS[quiz.difficulty]}
                          </span>
                          <span className="badge badge-blue">
                            {quiz.grade === 'mixed' ? 'Tổng hợp' : `Lớp ${quiz.grade}`}
                          </span>
                          {quiz.categoryName && (
                            <span className="badge" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                              <FiTag size={9} style={{ marginRight: 3 }} />
                              {quiz.categoryName}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 4, color: 'var(--text-primary)' }}>
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
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
          </main>
        </div>
      </div>
    </div>
  );
}