// ============================================================
// [CẢI TIẾN] Trang chi tiết bài học: LessonDetail.jsx
// Hiển thị đầy đủ nội dung: Lý thuyết, Chuyên đề, Dòng thời gian
// Có rich text rendering cho nội dung markdown-style
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiClock, FiEye, FiExternalLink,
  FiBookOpen, FiAlignLeft, FiList, FiChevronRight
} from 'react-icons/fi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────────────
// Rich Content Renderer: chuyển text thuần / markdown-style → JSX
// ─────────────────────────────────────────────────────────────────
function RichText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading H2: ## heading
    if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{
          margin: '24px 0 10px',
          paddingBottom: 8,
          borderBottom: '2px solid #E3F2FD',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 4, height: 22, background: 'linear-gradient(to bottom, #1565C0, #42A5F5)',
            borderRadius: 2, flexShrink: 0
          }} />
          <h3 style={{
            margin: 0, fontSize: '1.05rem', fontWeight: 800,
            color: '#1565C0', lineHeight: 1.4
          }}>
            {line.slice(3).trim()}
          </h3>
        </div>
      );
    }
    // Heading H3: ### heading
    else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{
          margin: '18px 0 8px', fontSize: '0.97rem', fontWeight: 700,
          color: '#283593', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ color: '#42A5F5', fontSize: '0.8rem' }}>◆</span>
          {line.slice(4).trim()}
        </h4>
      );
    }
    // Bullet list: - item
    else if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{
          margin: '6px 0 10px', paddingLeft: 20, listStyle: 'none'
        }}>
          {items.map((item, j) => (
            <li key={j} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              marginBottom: 5, fontSize: '0.93rem', lineHeight: 1.7,
              color: 'var(--text-primary)'
            }}>
              <span style={{
                color: '#1565C0', fontWeight: 700, marginTop: 2,
                flexShrink: 0, fontSize: '0.75rem'
              }}>►</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      continue; // i already incremented
    }
    // Plus-prefix: + item
    else if (line.startsWith('+ ')) {
      elements.push(
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          marginBottom: 5, paddingLeft: 16, fontSize: '0.93rem',
          lineHeight: 1.7, color: 'var(--text-primary)'
        }}>
          <span style={{ color: '#42A5F5', fontWeight: 700, flexShrink: 0 }}>+</span>
          <span>{line.slice(2).trim()}</span>
        </div>
      );
    }
    // Special bullet ♦
    else if (line.startsWith('♦')) {
      elements.push(
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          marginBottom: 6, fontSize: '0.93rem', lineHeight: 1.7,
          color: 'var(--text-primary)', fontWeight: 600
        }}>
          <span style={{ color: '#E65100', flexShrink: 0 }}>♦</span>
          <span>{line.slice(1).trim()}</span>
        </div>
      );
    }
    // Lettered items: a), b), c)...
    else if (/^[a-z]\)/.test(line)) {
      elements.push(
        <div key={i} style={{
          margin: '14px 0 6px', fontSize: '0.95rem', fontWeight: 700,
          color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#E8F5E9', color: '#2E7D32',
            fontSize: '0.75rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {line[0]}
          </span>
          {line.slice(2).trim()}
        </div>
      );
    }
    // Empty line → spacer
    else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    }
    // Normal text paragraph
    else {
      elements.push(
        <p key={i} style={{
          margin: '4px 0 6px', fontSize: '0.93rem',
          lineHeight: 1.8, color: 'var(--text-primary)'
        }}>
          {line.trim()}
        </p>
      );
    }

    i++;
  }

  return <div>{elements}</div>;
}

// ─────────────────────────────────────────────────────────────────
// Tab Badge Component
// ─────────────────────────────────────────────────────────────────
function TabBadge({ label, color = '#1565C0', bg = '#E3F2FD' }) {
  return (
    <span style={{
      padding: '1px 7px', borderRadius: 10, fontSize: '0.7rem',
      fontWeight: 700, background: bg, color, marginLeft: 5
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function LessonDetail() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/lessons/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLesson(d.data);
          // Auto-set tab to first available content
          const l = d.data;
          if (l?.summary) setActiveTab('summary');
          else if (l?.specialContent) setActiveTab('special');
          else setActiveTab('timeline');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id]);

  const timeline = (() => {
    try { return JSON.parse(lesson?.timeline || '[]'); } catch { return []; }
  })();

  const TABS = [
    {
      id: 'summary',
      label: 'Tóm tắt lý thuyết',
      icon: <FiAlignLeft />,
      badge: null,
      color: '#1565C0',
      gradient: 'linear-gradient(135deg, #1565C0, #42A5F5)',
      show: !!lesson?.summary
    },
    {
      id: 'special',
      label: 'Chuyên đề',
      icon: <FiBookOpen />,
      badge: null,
      color: '#2E7D32',
      gradient: 'linear-gradient(135deg, #2E7D32, #66BB6A)',
      show: !!lesson?.specialContent
    },
    {
      id: 'timeline',
      label: 'Dòng thời gian',
      icon: <FiClock />,
      badge: timeline.length > 0 ? `${timeline.length} mốc` : null,
      color: '#E65100',
      gradient: 'linear-gradient(135deg, #E65100, #FF8A65)',
      show: timeline.length > 0
    },
  ].filter(t => t.show);

  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!lesson) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Không tìm thấy bài học</div>
      <div style={{ marginTop: 16 }}>
        <Link to="/lessons" style={{ color: 'var(--primary)', fontWeight: 600 }}>← Quay về danh sách</Link>
      </div>
    </div>
  );

  const noContent = !lesson.summary && !lesson.specialContent && timeline.length === 0;

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--bg)' }}>
      {/* Header / Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #283593 100%)', padding: '36px 24px 32px' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Link to="/lessons" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiBookOpen size={13} /> Bài học
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Lớp {lesson.grade}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>{lesson.topicTitle}</span>
          </div>

          <h1 style={{ color: 'white', margin: '0 0 14px', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.3 }}>
            {lesson.title}
          </h1>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiEye size={13} /> {lesson.views || 0} lượt xem
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
              Lớp {lesson.grade}
            </span>
            {/* Content type badges */}
            {lesson.summary && (
              <span style={{ background: 'rgba(66,165,245,0.3)', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                📖 Lý thuyết
              </span>
            )}
            {lesson.specialContent && (
              <span style={{ background: 'rgba(102,187,106,0.3)', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                🎯 Chuyên đề
              </span>
            )}
            {timeline.length > 0 && (
              <span style={{ background: 'rgba(255,138,101,0.3)', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                ⏳ {timeline.length} mốc lịch sử
              </span>
            )}
            {lesson.sourceUrl && (
              <a href={lesson.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiExternalLink size={13} /> Xem nguồn gốc
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 900, paddingBottom: 60, paddingTop: 28 }}>

        {/* No content state */}
        {noContent && (
          <div style={{
            background: 'white', borderRadius: 14, border: '1px solid var(--border)',
            padding: '48px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📝</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
              Nội dung đang được cập nhật
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Bài học này chưa có nội dung. Vui lòng quay lại sau.
            </div>
          </div>
        )}

        {!noContent && (
          <>
            {/* Tab navigation */}
            {TABS.length > 1 && (
              <div style={{
                display: 'flex', gap: 4, marginBottom: 20,
                background: 'white', padding: 6, borderRadius: 14,
                border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
              }}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
                      background: isActive ? tab.gradient : 'transparent',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    }}>
                      {tab.icon}
                      {tab.label}
                      {tab.badge && (
                        <span style={{
                          padding: '1px 7px', borderRadius: 10,
                          fontSize: '0.7rem', fontWeight: 700,
                          background: isActive ? 'rgba(255,255,255,0.25)' : '#F5F5F5',
                          color: isActive ? 'white' : 'var(--text-muted)'
                        }}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content area */}
            <div style={{
              background: 'white', borderRadius: 14, border: '1px solid var(--border)',
              overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>

              {/* Tab: Tóm tắt lý thuyết */}
              {(activeTab === 'summary' || TABS.length <= 1) && lesson.summary && (
                <div>
                  {/* Tab Header */}
                  <div style={{
                    padding: '20px 28px 16px',
                    background: 'linear-gradient(135deg, #E3F2FD 0%, #F8F9FF 100%)',
                    borderBottom: '2px solid #BBDEFB',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(21,101,192,0.3)'
                    }}>
                      <FiAlignLeft color="white" size={18} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1565C0' }}>
                        📖 Tóm tắt lý thuyết
                      </h2>
                      <div style={{ fontSize: '0.78rem', color: '#5C8FC5', marginTop: 2 }}>
                        Nội dung lý thuyết trọng tâm của bài học
                      </div>
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ padding: '24px 28px' }}>
                    <RichText text={lesson.summary} />
                  </div>
                </div>
              )}

              {/* Tab: Chuyên đề */}
              {activeTab === 'special' && lesson.specialContent && (
                <div>
                  {/* Tab Header */}
                  <div style={{
                    padding: '20px 28px 16px',
                    background: 'linear-gradient(135deg, #E8F5E9 0%, #F9FBF9 100%)',
                    borderBottom: '2px solid #C8E6C9',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'linear-gradient(135deg, #2E7D32, #66BB6A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(46,125,50,0.3)'
                    }}>
                      <FiBookOpen color="white" size={18} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2E7D32' }}>
                        🎯 Bài học chuyên đề
                      </h2>
                      <div style={{ fontSize: '0.78rem', color: '#4CAF50', marginTop: 2 }}>
                        Nội dung chuyên sâu và mở rộng
                      </div>
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ padding: '24px 28px' }}>
                    <RichText text={lesson.specialContent} />
                  </div>
                </div>
              )}

              {/* Tab: Dòng thời gian */}
              {activeTab === 'timeline' && timeline.length > 0 && (
                <div>
                  {/* Tab Header */}
                  <div style={{
                    padding: '20px 28px 16px',
                    background: 'linear-gradient(135deg, #FFF3E0 0%, #FFFDF9 100%)',
                    borderBottom: '2px solid #FFCC80',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'linear-gradient(135deg, #E65100, #FF8A65)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(230,81,0,0.3)'
                    }}>
                      <FiClock color="white" size={18} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#E65100' }}>
                        ⏳ Dòng thời gian trọng tâm
                      </h2>
                      <div style={{ fontSize: '0.78rem', color: '#FF8A65', marginTop: 2 }}>
                        {timeline.length} mốc sự kiện lịch sử quan trọng
                      </div>
                    </div>
                  </div>
                  {/* Timeline visual */}
                  <div style={{ padding: '24px 28px' }}>
                    <div style={{ position: 'relative', paddingLeft: 36 }}>
                      {/* Vertical line */}
                      <div style={{
                        position: 'absolute', left: 14, top: 8, bottom: 8,
                        width: 3, background: 'linear-gradient(to bottom, #1565C0 0%, #E65100 100%)',
                        borderRadius: 2
                      }} />

                      {timeline.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative', marginBottom: 20 }}>
                          {/* Dot */}
                          <div style={{
                            position: 'absolute', left: -27, top: 10,
                            width: 16, height: 16, borderRadius: '50%',
                            background: 'white', border: '3px solid #1565C0',
                            boxShadow: '0 0 0 3px rgba(21,101,192,0.15)'
                          }} />

                          {/* Content */}
                          <div style={{
                            background: 'var(--bg)', borderRadius: 10,
                            padding: '12px 16px', border: '1px solid var(--border)',
                            transition: 'box-shadow 0.2s'
                          }}>
                            <div style={{
                              fontWeight: 800, color: '#1565C0',
                              fontSize: '0.95rem', marginBottom: 5,
                              display: 'flex', alignItems: 'center', gap: 8
                            }}>
                              <span style={{
                                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                                color: 'white', padding: '2px 10px', borderRadius: 20,
                                fontSize: '0.82rem'
                              }}>
                                {item.year}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                              {item.event}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Điều hướng Prev/Next */}
        {(lesson.navigation?.prev || lesson.navigation?.next) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 24 }}>
            {lesson.navigation?.prev ? (
              <Link to={`/lessons/${lesson.navigation.prev.id}`}
                style={{
                  background: 'white', borderRadius: 12, padding: '16px 20px',
                  border: '1px solid var(--border)', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>
                <FiArrowLeft color="var(--primary)" size={20} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>Bài trước</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    {lesson.navigation.prev.title}
                  </div>
                </div>
              </Link>
            ) : <div />}

            {lesson.navigation?.next ? (
              <Link to={`/lessons/${lesson.navigation.next.id}`}
                style={{
                  background: 'white', borderRadius: 12, padding: '16px 20px',
                  border: '1px solid var(--border)', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s', textAlign: 'right'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>Bài tiếp theo</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    {lesson.navigation.next.title}
                  </div>
                </div>
                <FiArrowRight color="var(--primary)" size={20} />
              </Link>
            ) : <div />}
          </div>
        )}

        {/* Back to list */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to={`/lessons?grade=${lesson.grade}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
            <FiArrowLeft size={14} /> Về danh sách bài học lớp {lesson.grade}
          </Link>
        </div>
      </div>
    </div>
  );
}
