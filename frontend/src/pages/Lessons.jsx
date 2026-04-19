// ============================================================
// Trang công khai: Lessons.jsx
// Hiển thị: Danh mục → Phần bài học → Chủ đề → Bài học
// ============================================================
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiBook, FiEye, FiChevronDown, FiChevronRight, FiSearch,
  FiBookOpen, FiList, FiLayers, FiArchive, FiChevronLeft,
  FiInbox, FiTag, FiClock
} from 'react-icons/fi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GRADES = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function Lessons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const grade = searchParams.get('grade') || '12';
  const selectedCategoryId = searchParams.get('category') ? Number(searchParams.get('category')) : null;
  const selectedSectionId = searchParams.get('section') ? Number(searchParams.get('section')) : null;

  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionDetail, setSectionDetail] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load categories
  useEffect(() => {
    fetch(`${API}/lessons/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
      .catch(() => {});
  }, []);

  // Load sections
  useEffect(() => {
    if (selectedSectionId) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
    if (grade) params.set('grade', grade);
    fetch(`${API}/lessons/sections?${params}`)
      .then(r => r.json())
      .then(d => setSections(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategoryId, grade, selectedSectionId]);

  // Load section detail
  useEffect(() => {
    if (!selectedSectionId) { setSectionDetail(null); return; }
    setLoading(true);
    fetch(`${API}/lessons/sections/${selectedSectionId}`)
      .then(r => r.json())
      .then(d => {
        setSectionDetail(d.data || null);
        if (d.data?.topics) setExpandedTopics(new Set(d.data.topics.map(t => t.id)));
      })
      .catch(() => setSectionDetail(null))
      .finally(() => setLoading(false));
  }, [selectedSectionId]);

  const toggleTopic = (id) => {
    const s = new Set(expandedTopics);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedTopics(s);
  };

  const setCategory = (id) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set('category', id); else p.delete('category');
    p.delete('section');
    setSearchParams(p);
    setSearch('');
  };

  const setSection = (id) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set('section', id); else p.delete('section');
    setSearchParams(p);
    setSearch('');
  };

  const setGrade = (g) => {
    const p = new URLSearchParams(searchParams);
    p.set('grade', g);
    p.delete('section');
    setSearchParams(p);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const filteredSections = sections.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTopics = sectionDetail?.topics?.map(topic => ({
    ...topic,
    lessons: (topic.lessons || []).filter(l =>
      !search || l.title.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(topic =>
    !search || topic.lessons.length > 0 || topic.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalTopics = sectionDetail?.topics?.length || 0;
  const totalLessons = sectionDetail
    ? sectionDetail.topics?.reduce((s, t) => s + (t.lessons?.length || 0), 0) || 0
    : 0;

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--bg)' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #283593 50%, #1B5E20 100%)',
        padding: '48px 24px 40px', marginBottom: 32
      }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <FiBookOpen size={28} color="white" />
            <h1 style={{ margin: 0, color: 'white', fontSize: '2rem', fontWeight: 800 }}>
              {sectionDetail ? sectionDetail.name : 'Bài học Lịch Sử'}
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', fontSize: '1rem' }}>
            {sectionDetail
              ? `${sectionDetail.categoryName ? sectionDetail.categoryName + ' · ' : ''}${sectionDetail.grade ? 'Lớp ' + sectionDetail.grade : 'Tất cả lớp'}`
              : `Tóm tắt lý thuyết, chuyên đề và dòng thời gian trọng tâm cho học sinh lớp ${grade}`
            }
          </p>

          {/* Grade selector (chỉ khi không xem section) */}
          {!selectedSectionId && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {GRADES.map(g => (
                <button key={g} onClick={() => setGrade(g)} style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: grade === g ? 'white' : 'rgba(255,255,255,0.15)',
                  color: grade === g ? '#1565C0' : 'white',
                  border: grade === g ? '2px solid white' : '2px solid transparent',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                }}>Lớp {g}</button>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <FiSearch size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={selectedSectionId ? 'Tìm kiếm bài học...' : 'Tìm kiếm phần bài học...'}
              style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backdropFilter: 'blur(8px)' }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1200, paddingBottom: 60 }}>
        {/* Layout 2 cột */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Sidebar danh mục */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'sticky', top: 16 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '0.83rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiList size={14} /> DANH MỤC
            </div>
            <nav style={{ padding: '8px 0' }}>
              <button onClick={() => setCategory(null)} style={navItem(!selectedCategoryId)}>
                <FiBookOpen size={14} /> Tất cả
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={navItem(selectedCategoryId === cat.id)}>
                  <FiTag size={13} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{cat.name}</span>
                  {cat.sectionCount > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      background: selectedCategoryId === cat.id ? 'var(--primary)' : '#E0E0E0',
                      color: selectedCategoryId === cat.id ? 'white' : '#757575',
                      borderRadius: 10, padding: '1px 7px', fontWeight: 700
                    }}>
                      {cat.sectionCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <button onClick={() => { setSection(null); setCategory(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                <FiBookOpen size={13} /> Tất cả
              </button>
              {selectedCategory && (<>
                <FiChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                <button onClick={() => setCategory(selectedCategoryId)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedSectionId ? 'var(--primary)' : 'var(--text-primary)', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiTag size={13} /> {selectedCategory.name}
                </button>
              </>)}
              {sectionDetail && (<>
                <FiChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiArchive size={13} /> {sectionDetail.name}
                </span>
              </>)}
            </div>

            {/* Back button */}
            {selectedSectionId && (
              <button onClick={() => setSection(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem' }}>
                <FiChevronLeft size={15} /> Quay lại danh sách phần
              </button>
            )}

            {/* Stats */}
            {selectedSectionId ? (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { icon: <FiLayers size={15} />, label: 'Chủ đề', value: totalTopics },
                  { icon: <FiBook size={15} />, label: 'Bài học', value: totalLessons },
                  { icon: <FiEye size={15} />, label: 'Lượt xem', value: sectionDetail?.topics?.reduce((s, t) => s + (t.lessons || []).reduce((ss, l) => ss + (l.views || 0), 0), 0) || 0 },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--primary)' }}>{s.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{s.value}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: <FiArchive size={15} />, label: 'Phần bài học', value: sections.length },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--primary)' }}>{s.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{s.value}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" /></div>
            ) : selectedSectionId ? (

              /* ── Section Detail: Topics → Lessons ── */
              <div>
                {filteredTopics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 70, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
                    <FiInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {search ? 'Không tìm thấy bài học phù hợp' : 'Chưa có bài học trong phần này'}
                    </div>
                  </div>
                ) : filteredTopics.map(topic => {
                  const expanded = expandedTopics.has(topic.id);
                  return (
                    <div key={topic.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
                      {/* Topic header */}
                      <div onClick={() => toggleTopic(topic.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', cursor: 'pointer',
                        background: expanded ? 'linear-gradient(90deg, #E3F2FD, #EDE7F6)' : 'white', transition: 'background 0.2s'
                      }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), #5C6BC0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiBook color="white" size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{topic.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiBook size={11} /> {(topic.lessons || []).length} bài học
                          </div>
                        </div>
                        <span style={{ color: 'var(--primary)' }}>
                          {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                        </span>
                      </div>

                      {/* Lessons */}
                      {expanded && (
                        <div style={{ borderTop: '1px solid #EEE' }}>
                          {(topic.lessons || []).length === 0 ? (
                            <div style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center' }}>
                              Chưa có bài học trong chủ đề này.
                            </div>
                          ) : (topic.lessons || []).map((lesson, idx) => (
                            <Link key={lesson.id} to={`/lessons/${lesson.id}`} style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '14px 20px 14px 28px',
                              borderBottom: idx < topic.lessons.length - 1 ? '1px solid #F5F5F5' : 'none',
                              color: 'inherit', textDecoration: 'none', transition: 'background 0.15s'
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F8F9FF'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {lesson.lessonOrder || idx + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                                  {lesson.title}
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <FiEye size={11} /> {lesson.views || 0} lượt xem
                                  </span>
                                  {lesson.sourceUrl && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <FiBook size={11} /> Xem nguồn
                                    </span>
                                  )}
                                </div>
                              </div>
                              <FiChevronRight size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            ) : (

              /* ── Danh sách Sections ── */
              <div>
                {filteredSections.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
                    <FiInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      {search ? 'Không tìm thấy phần bài học phù hợp' : `Chưa có bài học cho lớp ${grade}`}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {search ? 'Thử tìm từ khóa khác.' : 'Nội dung đang được cập nhật. Vui lòng quay lại sau.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredSections.map((sec, idx) => (
                      <button key={sec.id} onClick={() => setSection(sec.id)} style={{
                        textAlign: 'left', background: 'white', borderRadius: 14,
                        border: '1px solid var(--border)', padding: 0, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden',
                        transition: 'all 0.2s', width: '100%'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 22px' }}>
                          {/* Icon block */}
                          <div style={{
                            width: 54, height: 54, borderRadius: 14, flexShrink: 0,
                            background: `linear-gradient(135deg, ${PALETTE[idx % PALETTE.length][0]}, ${PALETTE[idx % PALETTE.length][1]})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <FiArchive size={24} color="white" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.35 }}>
                              {sec.name}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {sec.grade && (
                                <span style={{ padding: '2px 10px', borderRadius: 20, background: '#E3F2FD', color: '#1565C0', fontSize: '0.75rem', fontWeight: 700 }}>
                                  Lớp {sec.grade}
                                </span>
                              )}
                              <span style={{ padding: '2px 10px', borderRadius: 20, background: '#F3E5F5', color: '#7B1FA2', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <FiLayers size={10} /> {sec.topicCount || 0} chủ đề
                              </span>
                              {sec.categoryName && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <FiTag size={11} /> {sec.categoryName}
                                </span>
                              )}
                            </div>
                            {sec.description && (
                              <div style={{ marginTop: 6, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                {sec.description}
                              </div>
                            )}
                          </div>
                          <FiChevronRight size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Color palette ──────────────────────────────────
const PALETTE = [
  ['#1565C0', '#283593'],
  ['#2E7D32', '#1B5E20'],
  ['#6A1B9A', '#4A148C'],
  ['#E65100', '#BF360C'],
  ['#00695C', '#004D40'],
  ['#4527A0', '#311B92'],
  ['#AD1457', '#880E4F'],
  ['#0277BD', '#01579B'],
];

// ─── Nav item style ─────────────────────────────────
const navItem = (active) => ({
  width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', cursor: 'pointer',
  background: active ? 'var(--primary-50)' : 'none',
  color: active ? 'var(--primary)' : 'var(--text-secondary)',
  fontWeight: active ? 700 : 500, fontSize: '0.88rem',
  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
});
