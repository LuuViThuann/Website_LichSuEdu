import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, getGrades } from '../services/api';
import { FiBook, FiEye, FiFilter, FiSearch, FiFileText } from 'react-icons/fi';

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

  // Load danh sách lớp từ API
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
        <div style={{ marginBottom: 36 }}>
          <h1 className="section-title">📚 Thư viện tài liệu</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sách giáo khoa, tài liệu tham khảo Lịch sử THPT</p>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white', borderRadius: 12, border: '1px solid var(--border)',
          padding: '16px 20px', marginBottom: 28,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" placeholder="Tìm tài liệu..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, marginBottom: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FiFilter color="var(--text-muted)" />
            {['', ...grades.map(g => g.name)].map(g => (
              <button key={g} onClick={() => setGrade(g)} className="btn"
                style={{
                  padding: '7px 14px', fontSize: '0.85rem',
                  background: grade === g ? 'var(--primary)' : 'var(--bg)',
                  color: grade === g ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}>
                {g ? `Lớp ${g}` : 'Tất cả'}
              </button>
            ))}
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}
              style={{ width: 'auto', padding: '7px 14px', fontSize: '0.85rem' }}>
              <option value="">Loại tài liệu</option>
              <option value="textbook">Sách giáo khoa</option>
              <option value="reference">Tài liệu tham khảo</option>
              <option value="exam">Đề thi</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="page-loading"><div className="spinner" /><span>Đang tải tài liệu...</span></div>
        ) : filtered.length === 0 ? (
          <div className="page-loading" style={{ flexDirection: 'column' }}>
            <FiFileText size={48} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-muted)' }}>Chưa có tài liệu nào</p>
          </div>
        ) : (
          <div className="grid-4">
            {filtered.map(doc => (
              <div key={doc.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Cover — hiển thị thumbnail nếu có, fallback về gradient */}
                <div style={{
                  height: 170,
                  position: 'relative',
                  overflow: 'hidden',
                  background: doc.thumbnail
                    ? '#f0f0f0'
                    : 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => {
                        // Nếu ảnh load lỗi → fallback về gradient + icon
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.style.background =
                          'linear-gradient(135deg, var(--primary-dark), var(--primary))';
                        const icon = e.currentTarget.parentElement.querySelector('.thumb-fallback');
                        if (icon) icon.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback icon (hiển thị khi không có ảnh hoặc ảnh lỗi) */}
                  <div className="thumb-fallback" style={{
                    display: doc.thumbnail ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'absolute', inset: 0
                  }}>
                    <FiBook size={44} color="rgba(255,255,255,0.9)" />
                  </div>
                  {/* Badge lớp */}
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
                    {doc.filesize > 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {(doc.filesize / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
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
      </div>
    </div>
  );
}