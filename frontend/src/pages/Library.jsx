import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, getGrades } from '../services/api';
import { FiBook, FiEye, FiFilter, FiSearch, FiFileText, FiGrid, FiTag } from 'react-icons/fi';

const TYPE_LABELS = { textbook: 'Sách giáo khoa', reference: 'Tài liệu tham khảo', exam: 'Đề thi' };
const TYPE_COLORS = { textbook: 'badge-blue', reference: 'badge-green', exam: 'badge-orange' };

export default function Library() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (grade) params.grade = grade;
    if (type) params.type = type;
    getDocuments(params)
      .then(res => setDocs(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grade, type]);

  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => setGrades([{id:7,name:'10'},{id:8,name:'11'},{id:9,name:'12'}]));
  }, []);

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="section-title">Thư viện tài liệu</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sách giáo khoa, tài liệu tham khảo Lịch sử THPT</p>
        </div>

        {/* Search bar full width */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm tài liệu..."
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
                {['', ...grades.map(g => g.name)].map(g => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
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
                    {g ? `Lớp ${g}` : 'Tất cả lớp'}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 22 }} />

            {/* Lọc theo loại */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FiTag size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Loại tài liệu
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { value: '', label: 'Tất cả loại' },
                  { value: 'textbook', label: 'Sách giáo khoa' },
                  { value: 'reference', label: 'Tài liệu tham khảo' },
                  { value: 'exam', label: 'Đề thi' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.875rem',
                      fontWeight: type === opt.value ? 700 : 500,
                      borderRadius: 8,
                      border: `1.5px solid ${type === opt.value ? '#7c3aed' : 'var(--border)'}`,
                      background: type === opt.value ? '#7c3aed' : 'transparent',
                      color: type === opt.value ? 'white' : 'var(--text-secondary)',
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
                  Hiển thị <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> tài liệu
                  {grade && <> · Lớp <strong style={{ color: 'var(--primary)' }}>{grade}</strong></>}
                  {type && <> · <strong style={{ color: '#7c3aed' }}>{TYPE_LABELS[type]}</strong></>}
                </span>
              </div>
            )}

            {loading ? (
              <div className="page-loading"><div className="spinner" /><span>Đang tải tài liệu...</span></div>
            ) : filtered.length === 0 ? (
              <div className="page-loading" style={{ flexDirection: 'column' }}>
                <FiFileText size={48} color="var(--text-muted)" />
                <p style={{ color: 'var(--text-muted)' }}>Chưa có tài liệu nào</p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(doc => (
                  <div key={doc.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{
                      height: 240, position: 'relative', overflow: 'hidden',
                      background: doc.thumbnail ? '#f0f4fa' : 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {doc.thumbnail ? (
                        <img
                          src={doc.thumbnail}
                          alt={doc.title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block', padding: '8px' }}
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.style.background = 'linear-gradient(135deg, var(--primary-dark), var(--primary))';
                            const icon = e.currentTarget.parentElement.querySelector('.thumb-fallback');
                            if (icon) icon.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="thumb-fallback" style={{
                        display: doc.thumbnail ? 'none' : 'flex',
                        alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0
                      }}>
                        <FiBook size={44} color="rgba(255,255,255,0.9)" />
                      </div>
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'rgba(0,0,0,0.45)', color: 'white',
                        padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                        backdropFilter: 'blur(4px)'
                      }}>
                        Lớp {doc.grade}
                      </div>
                    </div>

                    <div style={{ padding: '16px 18px 20px' }}>
                      <span className={`badge ${TYPE_COLORS[doc.type] || 'badge-blue'}`} style={{ marginBottom: 10 }}>
                        {TYPE_LABELS[doc.type] || doc.type}
                      </span>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                          {doc.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <FiEye size={12} style={{ marginRight: 4 }} />{doc.views} lượt xem
                        </span>
                       
                      </div>
                      <Link to={`/library/read/${doc.id}`} className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '9px' }}>
                        <FiEye /> Đọc tài liệu
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}