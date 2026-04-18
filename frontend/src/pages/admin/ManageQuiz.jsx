import { useState, useEffect, useRef } from 'react';
import { getQuizzes, createQuiz, deleteQuiz, getGrades, getAdminQuizCategories } from '../../services/api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUpload, FiClipboard, FiX, FiCheck, FiImage, FiTag } from 'react-icons/fi';

const EMPTY_QUIZ = {
  title: '', description: '', grade: 'mixed', difficulty: 'medium',
  duration: 45, sourceUrl: '', categoryId: ''
};

export default function ManageQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_QUIZ);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('json'); // json | manual
  const [grades, setGrades] = useState([]);
  const [categories, setCategories] = useState([]);

  // Thumbnail image state
  const [thumbFile, setThumbFile] = useState(null);   // File object
  const [thumbPreview, setThumbPreview] = useState(''); // base64 preview
  const thumbInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    getQuizzes({ limit: 100 }).then(res => setQuizzes(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Load danh sách lớp từ API
  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => setGrades([{ id: 7, name: '10' }, { id: 8, name: '11' }, { id: 9, name: '12' }]));
  }, []);

  // Load danh mục loại đề
  useEffect(() => {
    getAdminQuizCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  const handleThumbChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5MB'); return; }
    setThumbFile(file);
    const reader = new FileReader();
    reader.onload = e => setThumbPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeThumb = () => {
    setThumbFile(null);
    setThumbPreview('');
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const handleParseJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);
      const data = parsed.data || parsed;
      if (!Array.isArray(data)) throw new Error('Dữ liệu phải là mảng câu hỏi');
      const questions = data.map(q => ({
        id: q.id,
        uuid: q.uuid || '',
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation || ''
      }));
      setParsedQuestions(questions);
      toast.success(`Đã phân tích ${questions.length} câu hỏi thành công!`);
    } catch (e) {
      setJsonError(e.message || 'JSON không hợp lệ');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (tab === 'json' && parsedQuestions.length === 0) { toast.error('Vui lòng nhập và phân tích JSON câu hỏi'); return; }
    setSaving(true);
    try {
      // Dùng FormData để gửi kèm ảnh thumbnail (multipart/form-data)
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description || '');
      fd.append('grade', form.grade);
      fd.append('difficulty', form.difficulty);
      fd.append('duration', form.duration);
      fd.append('sourceUrl', form.sourceUrl || '');
      if (form.categoryId) fd.append('categoryId', form.categoryId);
      fd.append('questions', JSON.stringify(parsedQuestions));
      if (thumbFile) fd.append('thumbnail', thumbFile);

      await createQuiz(fd);
      toast.success('Đã tạo bộ đề thành công!');
      setShowModal(false);
      setForm(EMPTY_QUIZ);
      setJsonInput('');
      setParsedQuestions([]);
      removeThumb();
      load();
    } catch {
      toast.error('Tạo bộ đề thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa bộ đề "${title}"?`)) return;
    try {
      await deleteQuiz(id);
      toast.success('Đã xóa bộ đề');
      load();
    } catch { toast.error('Xóa thất bại'); }
  };

  const SAMPLE_JSON = `{
  "status": "success",
  "data": [
    {
      "id": 1,
      "uuid": "abc123",
      "question": "Câu hỏi mẫu về lịch sử?",
      "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" },
      "answer": "A"
    }
  ]
}`;

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : null;
  };

  return (
    <AdminLayout title="Quản lý đề thi">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{quizzes.length} bộ đề</span>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <FiPlus /> Thêm bộ đề mới
        </button>
      </div>

      {/* Table */}
      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Ảnh', 'Tiêu đề', 'Lớp', 'Loại đề', 'Độ khó', 'Số câu', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quizzes.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FiClipboard size={32} style={{ display: 'block', margin: '0 auto 10px' }} />
                  Chưa có bộ đề nào
                </td></tr>
              ) : quizzes.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  {/* Thumbnail */}
                  <td style={{ padding: '10px 14px' }}>
                    {q.thumbnail ? (
                      <img src={q.thumbnail} alt={q.title}
                        style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{
                        width: 48, height: 32, borderRadius: 6, background: 'var(--bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px dashed var(--border)'
                      }}>
                        <FiImage size={14} color="var(--text-muted)" />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                    {q.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{q.description.slice(0, 50)}...</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}><span className="badge badge-blue">{q.grade === 'mixed' ? 'Tổng hợp' : `Lớp ${q.grade}`}</span></td>
                  <td style={{ padding: '10px 14px' }}>
                    {q.categoryName
                      ? <span className="badge" style={{ background: '#ede9fe', color: '#7c3aed' }}><FiTag size={10} style={{ marginRight: 4 }} />{q.categoryName}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-orange'}`}>
                      {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'hard' ? 'Khó' : 'TB'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{q.totalQuestions}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge ${q.isPublished ? 'badge-green' : 'badge-red'}`}>
                      {q.isPublished ? 'Đã đăng' : 'Ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => handleDelete(q.id, q.title)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                      <FiTrash2 /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm bộ đề */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 720,
            maxHeight: '92vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Modal header */}
            <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>📋 Thêm bộ đề mới</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}><FiX size={20} /></button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Tiêu đề + Mô tả */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tiêu đề bộ đề *</label>
                <input type="text" className="form-input" placeholder="VD: Đề thi thử THPTQG 2026 - Lịch sử"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mô tả</label>
                <textarea className="form-input" rows={2} placeholder="Mô tả ngắn về bộ đề..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Ảnh thumbnail */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiImage size={14} /> Ảnh bìa (lưu trên Cloudinary)
                </label>
                {thumbPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={thumbPreview} alt="preview"
                      style={{ height: 120, width: 'auto', maxWidth: '100%', borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <button onClick={removeThumb} style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#ef4444', color: 'white', border: 'none',
                      borderRadius: '50%', width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 12
                    }}>
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border)', borderRadius: 10,
                      padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '0.88rem',
                      transition: 'border-color 0.2s, background 0.2s',
                      background: 'var(--bg)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-50)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
                  >
                    <FiImage size={28} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                    Click để chọn ảnh bìa<br />
                    <span style={{ fontSize: '0.78rem' }}>JPG, PNG, WEBP — tối đa 5MB</span>
                  </div>
                )}
                <input ref={thumbInputRef} type="file" accept="image/*"
                  onChange={handleThumbChange} style={{ display: 'none' }} />
              </div>

              {/* Grid: Lớp, Loại đề, Độ khó, Thời gian */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label className="form-label">Khối lớp</label>
                  <select className="form-select" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                    <option value="mixed">Tổng hợp</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.name}>Lớp {g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiTag size={12} /> Loại đề
                  </label>
                  <select className="form-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">— Không phân loại —</option>
                    {categories.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Độ khó</label>
                  <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Thời gian (phút)</label>
                  <input type="number" className="form-input" min={5} max={180}
                    value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
              </div>

              {/* URL source */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nguồn URL (tùy chọn)</label>
                <input type="text" className="form-input" placeholder="https://vietjack.com/..."
                  value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} />
              </div>

              {/* Tabs câu hỏi */}
              <div>
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                  {[{ key: 'json', label: '📋 Import JSON (Swagger)' }, { key: 'manual', label: '✏️ Nhập thủ công' }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                      padding: '10px 20px', fontWeight: 600, fontSize: '0.88rem', background: 'none',
                      borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                      color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer'
                    }}>{t.label}</button>
                  ))}
                </div>

                {tab === 'json' && (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Dán JSON lấy từ Swagger API vào ô bên dưới. Hỗ trợ định dạng{' '}
                      <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>{'{ data: [...] }'}</code> hoặc mảng trực tiếp.
                    </div>
                    <textarea className="form-input" rows={10} placeholder={SAMPLE_JSON}
                      value={jsonInput}
                      onChange={e => { setJsonInput(e.target.value); setJsonError(''); setParsedQuestions([]); }}
                      style={{ fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }}
                    />
                    {jsonError && (
                      <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: 6 }}>⚠️ {jsonError}</div>
                    )}
                    {parsedQuestions.length > 0 && (
                      <div style={{
                        background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8,
                        padding: '10px 14px', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                        color: 'var(--success)', fontSize: '0.88rem', fontWeight: 600
                      }}>
                        <FiCheck /> Đã phân tích {parsedQuestions.length} câu hỏi thành công
                      </div>
                    )}
                    <button onClick={handleParseJson} className="btn btn-outline" style={{ marginTop: 10 }}>
                      <FiUpload /> Phân tích JSON
                    </button>
                  </div>
                )}

                {tab === 'manual' && (
                  <div style={{
                    background: 'var(--bg)', borderRadius: 10, padding: '20px',
                    textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem'
                  }}>
                    🚧 Tính năng nhập thủ công đang phát triển.<br />
                    Hiện tại hãy sử dụng Import JSON để thêm câu hỏi.
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <FiCheck />}
                Lưu bộ đề
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}