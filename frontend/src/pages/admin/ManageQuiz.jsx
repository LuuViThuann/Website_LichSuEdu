import { useState, useEffect } from 'react';
import { getQuizzes, createQuiz, deleteQuiz, getGrades } from '../../services/api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUpload, FiClipboard, FiX, FiCheck } from 'react-icons/fi';

const EMPTY_QUIZ = {
  title: '', description: '', grade: 'mixed', difficulty: 'medium', duration: 45, sourceUrl: ''
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

  const load = () => {
    setLoading(true);
    getQuizzes({ limit: 100 }).then(res => setQuizzes(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Load danh sách lớp từ API
  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => setGrades([{id:7,name:'10'},{id:8,name:'11'},{id:9,name:'12'}]));
  }, []);

  const handleParseJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);
      // Support both raw array and the Swagger response format
      const data = parsed.data || parsed;
      if (!Array.isArray(data)) throw new Error('Dữ liệu phải là mảng câu hỏi');
      // Validate questions
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
      await createQuiz({ ...form, questions: parsedQuestions });
      toast.success('Đã tạo bộ đề thành công!');
      setShowModal(false);
      setForm(EMPTY_QUIZ);
      setJsonInput('');
      setParsedQuestions([]);
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
                {['Tiêu đề', 'Lớp', 'Độ khó', 'Số câu', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quizzes.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FiClipboard size={32} style={{ display: 'block', margin: '0 auto 10px' }} />
                  Chưa có bộ đề nào
                </td></tr>
              ) : quizzes.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                    {q.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{q.description.slice(0, 50)}...</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-blue">{q.grade === 'mixed' ? 'Tổng hợp' : `Lớp ${q.grade}`}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-orange'}`}>
                      {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'hard' ? 'Khó' : 'TB'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{q.totalQuestions}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${q.isPublished ? 'badge-green' : 'badge-red'}`}>
                      {q.isPublished ? 'Đã đăng' : 'Ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
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

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 700,
            maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Modal header */}
            <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Thêm bộ đề mới</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}><FiX size={20} /></button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Basic info */}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
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

              {/* Tabs */}
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
                      <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>{"{ data: [...] }"}</code> hoặc mảng trực tiếp.
                    </div>
                    <textarea
                      className="form-input"
                      rows={10}
                      placeholder={SAMPLE_JSON}
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