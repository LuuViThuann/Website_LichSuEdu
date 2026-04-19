// ============================================================
// Trang Admin: ManageLessons.jsx
// 2 tab: Phần bài học | Chủ đề & Bài học
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight,
  FiUpload, FiBookOpen, FiClock, FiFileText, FiFolder,
  FiX, FiSave, FiList, FiLayers, FiArchive, FiTag,
  FiCheckCircle, FiEyeOff, FiBook, FiInbox
} from 'react-icons/fi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

const GRADES = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];

// ─────────────────────────────────────────────────────
// MODAL: Phần bài học (LessonSection)
// ─────────────────────────────────────────────────────
function SectionModal({ section, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    categoryId: section?.categoryId || (categories[0]?.id || ''),
    name: section?.name || '',
    description: section?.description || '',
    grade: section?.grade || '12',
    displayOrder: section?.displayOrder || 0,
    isPublished: section?.isPublished !== undefined ? !!section.isPublished : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên phần bài học');
    setLoading(true);
    try {
      const url = section ? `${API}/admin/lesson-sections/${section.id}` : `${API}/admin/lesson-sections`;
      const method = section ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(section ? 'Đã cập nhật phần bài học' : 'Đã tạo phần bài học mới');
      onSave(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: 560 }}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {section ? 'Sửa phần bài học' : 'Tạo phần bài học mới'}
          </h2>
          <button onClick={onClose} style={iconBtn}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={formRow}>
            <label style={labelStyle}>Danh mục</label>
            <select style={inputStyle} value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}>
              <option value="">-- Không thuộc danh mục --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={formRow}>
            <label style={labelStyle}>Tên phần bài học *</label>
            <input style={inputStyle} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Lý thuyết Lịch Sử 12 Cánh diều (hay, ngắn gọn)" />
          </div>
          <div style={formRow}>
            <label style={labelStyle}>Mô tả</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về bộ bài học này..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Lớp áp dụng</label>
              <select style={inputStyle} value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })}>
                <option value="">Tất cả lớp</option>
                {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Thứ tự hiển thị</label>
              <input style={inputStyle} type="number" min={0}
                value={form.displayOrder}
                onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="secPublish" checked={form.isPublished}
              onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
            <label htmlFor="secPublish" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Hiển thị công khai</label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={btnOutline}>Hủy</button>
            <button type="submit" disabled={loading} style={btnPrimary}>
              <FiSave /> {loading ? 'Đang lưu...' : 'Lưu phần bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MODAL: Import JSON vào section
// ─────────────────────────────────────────────────────
function ImportToSectionModal({ section, onClose, onSuccess }) {
  const [grade, setGrade] = useState(section?.grade || '12');
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleJsonChange = (val) => {
    setJsonText(val);
    try {
      const p = JSON.parse(val);
      const topics = p?.data?.topics || p?.topics || (Array.isArray(p) ? p : null);
      if (topics && Array.isArray(topics)) {
        const lessonCount = topics.reduce((s, t) => s + (t.lessons?.length || 0), 0);
        const hasContent = topics.some(t => t.lessons?.some(l => l.content?.sections?.length > 0));
        setPreview({ topicCount: topics.length, lessonCount, hasContent });
      } else setPreview(null);
    } catch { setPreview(null); }
  };

  const handleImport = async () => {
    let parsed;
    try { parsed = JSON.parse(jsonText); }
    catch { return toast.error('JSON không hợp lệ. Vui lòng kiểm tra lại.'); }

    const topics = parsed?.data?.topics || parsed?.topics || (Array.isArray(parsed) ? parsed : null);
    if (!topics || !Array.isArray(topics)) {
      return toast.error('Không tìm thấy mảng topics trong JSON.');
    }
    const detectedGrade = parsed?.data?.grade || parsed?.grade || grade;

    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/lesson-sections/${section.id}/import`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ grade: detectedGrade, topics, book: section.name })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Import thành công: ${data.data?.topics?.length || 0} chủ đề, ${data.data?.lessons?.length || 0} bài học!`);
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: 700 }}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiUpload size={18} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              Import JSON vào "{section.name}"
            </h2>
          </div>
          <button onClick={onClose} style={iconBtn}><FiX /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', lineHeight: 1.6 }}>
            <strong>Hỗ trợ 3 dạng JSON:</strong><br />
            1. <code style={{ background: '#fff', padding: '0 4px', borderRadius: 3 }}>{`{"status":"success","data":{"topics":[...]}}`}</code> — API Python VietJack<br />
            2. <code style={{ background: '#fff', padding: '0 4px', borderRadius: 3 }}>{`{"topics":[{"topic_title":"...","lessons":[...]}]}`}</code><br />
            3. <code style={{ background: '#fff', padding: '0 4px', borderRadius: 3 }}>{`[{"topic_title":"...","lessons":[...]}]`}</code> — Mảng trực tiếp
          </div>

          <div style={formRow}>
            <label style={labelStyle}>Lớp (override nếu JSON không có grade)</label>
            <select style={{ ...inputStyle, width: 120 }} value={grade}
              onChange={e => setGrade(e.target.value)}>
              {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          </div>

          <div style={formRow}>
            <label style={labelStyle}>Dán toàn bộ JSON vào đây</label>
            <textarea
              style={{ ...inputStyle, minHeight: 260, fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }}
              value={jsonText}
              onChange={e => handleJsonChange(e.target.value)}
              placeholder={'Dán JSON từ API Python vào đây...'}
            />
          </div>

          {preview && (
            <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiCheckCircle color="#2E7D32" size={16} />
              <span>
                <strong>Dữ liệu hợp lệ:</strong>{' '}
                <strong style={{ color: '#1565C0' }}>{preview.topicCount}</strong> chủ đề,{' '}
                <strong style={{ color: '#2E7D32' }}>{preview.lessonCount}</strong> bài học
                {preview.hasContent && <span style={{ color: '#558B2F', marginLeft: 8 }}>— Có nội dung chi tiết</span>}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={btnOutline}>Hủy</button>
            <button onClick={handleImport} disabled={loading || !jsonText.trim()} style={btnPrimary}>
              <FiUpload /> {loading ? 'Đang import...' : 'Import vào phần này'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MODAL FORM: Chủ đề (Topic)
// ─────────────────────────────────────────────────────
function TopicModal({ topic, grades, sections, onClose, onSave }) {
  const [form, setForm] = useState({
    grade: topic?.grade || '12',
    book: topic?.book || 'Chung',
    title: topic?.title || '',
    topicOrder: topic?.topicOrder || 0,
    description: topic?.description || '',
    sectionId: topic?.sectionId || '',
    isPublished: topic?.isPublished !== undefined ? !!topic.isPublished : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề chủ đề');
    setLoading(true);
    try {
      const url = topic ? `${API}/admin/lesson-topics/${topic.id}` : `${API}/admin/lesson-topics`;
      const method = topic ? 'PUT' : 'POST';
      const payload = { ...form, sectionId: form.sectionId ? Number(form.sectionId) : null };
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(topic ? 'Đã cập nhật chủ đề' : 'Đã thêm chủ đề mới');
      onSave(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: 540 }}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {topic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}
          </h2>
          <button onClick={onClose} style={iconBtn}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Lớp *</label>
              <select style={inputStyle} value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Thứ tự hiển thị</label>
              <input style={inputStyle} type="number" value={form.topicOrder}
                onChange={e => setForm({ ...form, topicOrder: Number(e.target.value) })} min={0} />
            </div>
          </div>
          <div style={formRow}>
            <label style={labelStyle}>Thuộc phần bài học</label>
            <select style={inputStyle} value={form.sectionId || ''}
              onChange={e => setForm({ ...form, sectionId: e.target.value })}>
              <option value="">-- Không thuộc phần nào --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.categoryName ? `[${s.categoryName}] ` : ''}{s.name}</option>)}
            </select>
          </div>
          <div style={formRow}>
            <label style={labelStyle}>Tên Sách / Phần Bài</label>
            <input style={inputStyle} value={form.book} onChange={e => setForm({ ...form, book: e.target.value })}
              placeholder="VD: Lịch sử 12 Cánh diều" />
          </div>
          <div style={formRow}>
            <label style={labelStyle}>Tiêu đề chủ đề *</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Chủ đề 1: Thế giới trong và sau Chiến tranh lạnh" />
          </div>
          <div style={formRow}>
            <label style={labelStyle}>Mô tả</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về chủ đề..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="topicPublish" checked={form.isPublished}
              onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
            <label htmlFor="topicPublish" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Hiển thị công khai</label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={btnOutline}>Hủy</button>
            <button type="submit" disabled={loading} style={btnPrimary}>
              <FiSave /> {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MODAL FORM: Bài học
// ─────────────────────────────────────────────────────
function LessonModal({ lesson, topics, onClose, onSave }) {
  const [form, setForm] = useState({
    topicId: lesson?.topicId || (topics[0]?.id || ''),
    title: lesson?.title || '',
    lessonOrder: lesson?.lessonOrder || 0,
    summary: lesson?.summary || '',
    specialContent: lesson?.specialContent || '',
    timeline: lesson?.timeline || '[]',
    sourceUrl: lesson?.sourceUrl || '',
    isPublished: lesson?.isPublished !== undefined ? !!lesson.isPublished : true,
  });
  const [timelineItems, setTimelineItems] = useState(() => {
    try { return JSON.parse(lesson?.timeline || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const addTimelineItem = () => setTimelineItems([...timelineItems, { year: '', event: '' }]);
  const updateTimeline = (idx, field, val) =>
    setTimelineItems(timelineItems.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const removeTimeline = (idx) => setTimelineItems(timelineItems.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topicId || !form.title.trim()) return toast.error('Vui lòng chọn chủ đề và nhập tiêu đề');
    setLoading(true);
    const payload = { ...form, timeline: JSON.stringify(timelineItems) };
    try {
      const url = lesson ? `${API}/admin/lessons/${lesson.id}` : `${API}/admin/lessons`;
      const method = lesson ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(lesson ? 'Đã cập nhật bài học' : 'Đã thêm bài học mới');
      onSave(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const TABS = [
    { id: 'summary', label: 'Tóm tắt lý thuyết', icon: <FiFileText size={14} /> },
    { id: 'special', label: 'Chuyên đề', icon: <FiBookOpen size={14} /> },
    { id: 'timeline', label: 'Dòng thời gian', icon: <FiClock size={14} /> },
  ];

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {lesson ? 'Sửa bài học' : 'Thêm bài học mới'}
          </h2>
          <button onClick={onClose} style={iconBtn}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Chủ đề *</label>
              <select style={inputStyle} value={form.topicId}
                onChange={e => setForm({ ...form, topicId: Number(e.target.value) })}>
                <option value="">-- Chọn chủ đề --</option>
                {topics.map(t => <option key={t.id} value={t.id}>[{t.book || 'Chung'}] {t.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Thứ tự bài</label>
              <input style={inputStyle} type="number" value={form.lessonOrder}
                onChange={e => setForm({ ...form, lessonOrder: Number(e.target.value) })} min={0} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Tiêu đề bài học *</label>
            <input style={inputStyle} value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Bài 1: Liên hợp quốc" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>URL nguồn (VietJack,...)</label>
            <input style={inputStyle} value={form.sourceUrl}
              onChange={e => setForm({ ...form, sourceUrl: e.target.value })}
              placeholder="https://vietjack.com/..." />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '2px solid var(--border)' }}>
            {TABS.map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                marginBottom: -2
              }}>{tab.icon} {tab.label}</button>
            ))}
          </div>

          {activeTab === 'summary' && (
            <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })}
              placeholder="Nhập nội dung tóm tắt lý thuyết (Markdown)..." />
          )}
          {activeTab === 'special' && (
            <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }}
              value={form.specialContent} onChange={e => setForm({ ...form, specialContent: e.target.value })}
              placeholder="Nội dung bài học chuyên đề sâu..." />
          )}
          {activeTab === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Dòng thời gian trọng tâm</label>
                <button type="button" onClick={addTimelineItem} style={{ ...btnPrimary, padding: '6px 12px', fontSize: '0.8rem' }}>
                  <FiPlus /> Thêm mốc
                </button>
              </div>
              {timelineItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Chưa có mốc thời gian. Nhấn "Thêm mốc" để bắt đầu.
                </div>
              )}
              {timelineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <input style={{ ...inputStyle, width: 100, flexShrink: 0 }} value={item.year}
                    onChange={e => updateTimeline(idx, 'year', e.target.value)} placeholder="Năm" />
                  <input style={{ ...inputStyle, flex: 1 }} value={item.event}
                    onChange={e => updateTimeline(idx, 'event', e.target.value)} placeholder="Sự kiện..." />
                  <button type="button" onClick={() => removeTimeline(idx)}
                    style={{ ...iconBtn, color: 'var(--error)', marginTop: 2 }}><FiTrash2 /></button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <input type="checkbox" id="lessonPublish" checked={form.isPublished}
              onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
            <label htmlFor="lessonPublish" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Hiển thị công khai</label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={btnOutline}>Hủy</button>
            <button type="submit" disabled={loading} style={btnPrimary}>
              <FiSave /> {loading ? 'Đang lưu...' : 'Lưu bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 1: Phần bài học
// ─────────────────────────────────────────────────────
function SectionsTab({ sections, categories, gradeFilter, onRefresh, setModal }) {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [sectionDetails, setSectionDetails] = useState({});

  const toggleSection = async (sec) => {
    const s = new Set(expandedSections);
    if (s.has(sec.id)) {
      s.delete(sec.id);
    } else {
      s.add(sec.id);
      if (!sectionDetails[sec.id]) {
        setSectionDetails(prev => ({ ...prev, [sec.id]: { loading: true } }));
        try {
          const res = await fetch(`${API}/admin/lesson-sections/${sec.id}`, { headers: authHeaders() });
          const data = await res.json();
          setSectionDetails(prev => ({ ...prev, [sec.id]: { loading: false, data: data.data } }));
        } catch {
          setSectionDetails(prev => ({ ...prev, [sec.id]: { loading: false, error: true } }));
        }
      }
    }
    setExpandedSections(s);
  };

  const handleDeleteSection = async (id, name) => {
    if (!confirm(`Xóa phần bài học "${name}"?\nCác chủ đề và bài học sẽ KHÔNG bị xóa (chỉ gỡ liên kết).`)) return;
    try {
      const res = await fetch(`${API}/admin/lesson-sections/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Đã xóa phần bài học');
      onRefresh();
    } catch (err) { toast.error(err.message); }
  };

  const filteredSections = gradeFilter
    ? sections.filter(s => !s.grade || s.grade === gradeFilter)
    : sections;

  const groupedByCategory = {};
  filteredSections.forEach(s => {
    const key = s.categoryId || 0;
    if (!groupedByCategory[key]) groupedByCategory[key] = { meta: s, sections: [] };
    groupedByCategory[key].sections.push(s);
  });

  if (filteredSections.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
        <FiInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Chưa có phần bài học nào</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          Tạo phần bài học để nhóm các chủ đề và bài học có liên quan.
        </div>
        <button onClick={() => setModal({ type: 'section', data: null })} style={btnPrimary}>
          <FiPlus /> Tạo phần bài học đầu tiên
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {Object.entries(groupedByCategory).map(([, group]) => (
        <div key={group.meta.categoryId || 'no-cat'}>
          {/* Category header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid var(--primary-50)' }}>
            <FiTag size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
              {group.meta.categoryName || 'Không thuộc danh mục'}
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {group.sections.length} phần
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.sections.map(sec => {
              const expanded = expandedSections.has(sec.id);
              const detail = sectionDetails[sec.id];
              return (
                <div key={sec.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer', background: expanded ? 'linear-gradient(90deg, #E3F2FD, #F3E5F5)' : 'white', transition: 'background 0.2s' }}
                    onClick={() => toggleSection(sec)}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), #5C6BC0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiArchive color="white" size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{sec.name}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {sec.grade && <span style={badge('#E3F2FD', '#1565C0')}>Lớp {sec.grade}</span>}
                        <span style={badge('#F3E5F5', '#7B1FA2')}>
                          <FiLayers size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                          {sec.topicCount || 0} chủ đề
                        </span>
                        <span style={badge(sec.isPublished ? '#E8F5E9' : '#FAFAFA', sec.isPublished ? '#2E7D32' : '#9E9E9E')}>
                          {sec.isPublished ? 'Hiển thị' : 'Ẩn'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setModal({ type: 'importToSection', data: sec })}
                        style={{ ...btnOutline, padding: '6px 10px', fontSize: '0.8rem' }}>
                        <FiUpload size={13} /> Import
                      </button>
                      <button onClick={() => setModal({ type: 'section', data: sec })} style={iconBtn}><FiEdit2 size={15} /></button>
                      <button onClick={() => handleDeleteSection(sec.id, sec.name)} style={{ ...iconBtn, color: 'var(--error)' }}><FiTrash2 size={15} /></button>
                    </div>
                    <span style={{ color: 'var(--primary)', marginLeft: 4 }}>
                      {expanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                    </span>
                  </div>

                  {/* Section tree */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid #EEE' }}>
                      {detail?.loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>}
                      {detail?.error && <div style={{ padding: 20, textAlign: 'center', color: 'var(--error)' }}>Lỗi tải dữ liệu</div>}
                      {detail?.data && (
                        <div>
                          {!detail.data.topics?.length ? (
                            <div style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center' }}>
                              Chưa có chủ đề nào.{' '}
                              <button onClick={() => setModal({ type: 'importToSection', data: sec })}
                                style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Import JSON ngay
                              </button>
                            </div>
                          ) : detail.data.topics.map((topic, ti) => (
                            <div key={topic.id} style={{ borderBottom: ti < detail.data.topics.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px 12px 28px', background: '#FAFBFF' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-50)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {topic.topicOrder || ti + 1}
                                </div>
                                <div style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{topic.title}</div>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{topic.lessons?.length || 0} bài học</span>
                              </div>
                              {(topic.lessons || []).map((lesson, li) => (
                                <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px 9px 54px', background: li % 2 === 0 ? 'white' : '#FAFAFA', borderTop: '1px solid #F5F5F5' }}>
                                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#E8F5E9', color: '#2E7D32', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {lesson.lessonOrder || li + 1}
                                  </div>
                                  <div style={{ flex: 1, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{lesson.title}</div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {lesson.hasSummary ? <span style={badge('#E3F2FD', '#1565C0')}>Tóm tắt</span> : null}
                                    {lesson.hasSpecial ? <span style={badge('#E8F5E9', '#2E7D32')}>Chuyên đề</span> : null}
                                    {lesson.hasTimeline ? <span style={badge('#FFF3E0', '#E65100')}>Timeline</span> : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TAB 2: Chủ đề & Bài học (CRUD trực tiếp)
// ─────────────────────────────────────────────────────
function TopicsTab({ topics, lessons, expandedTopics, toggleExpand, setModal, onDeleteTopic, onDeleteLesson }) {
  const getLessonsForTopic = (topicId) =>
    lessons.filter(l => l.topicId === topicId).sort((a, b) => a.lessonOrder - b.lessonOrder);

  if (topics.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
        <FiBook size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Chưa có chủ đề nào</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          Thêm chủ đề hoặc Import JSON từ tab "Phần bài học".
        </div>
        <button onClick={() => setModal({ type: 'topic', data: null })} style={btnPrimary}>
          <FiPlus /> Thêm chủ đề
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {Array.from(new Set(topics.map(t => t.book || 'Chung'))).map(book => (
        <div key={book} style={{ background: '#F8F9FF', padding: 20, borderRadius: 16, border: '1px solid #E4E9F2' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiBookOpen size={18} /> {book}
            {topics.filter(t => (t.book || 'Chung') === book)[0]?.sectionName && (
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                — {topics.filter(t => (t.book || 'Chung') === book)[0].sectionName}
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topics.filter(t => (t.book || 'Chung') === book).map(topic => {
              const expanded = expandedTopics.has(topic.id);
              const topicLessons = getLessonsForTopic(topic.id);
              return (
                <div key={topic.id} style={{ background: 'white', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer', background: expanded ? 'var(--primary-50)' : 'white' }}
                    onClick={() => toggleExpand(topic.id)}>
                    <span style={{ color: 'var(--primary)', display: 'flex' }}>
                      {expanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{topic.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {topicLessons.length} bài học · Thứ tự: {topic.topicOrder}
                        {topic.sectionName && ` · ${topic.sectionName}`}
                      </div>
                    </div>
                    <span style={badge(topic.isPublished ? '#E8F5E9' : '#FAFAFA', topic.isPublished ? '#2E7D32' : '#9E9E9E')}>
                      {topic.isPublished ? 'Hiển thị' : 'Ẩn'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); setModal({ type: 'topic', data: topic }); }} style={iconBtn}><FiEdit2 size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); onDeleteTopic(topic.id); }} style={{ ...iconBtn, color: 'var(--error)' }}><FiTrash2 size={14} /></button>
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {topicLessons.length === 0 ? (
                        <div style={{ padding: '10px 16px 10px 40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Chưa có bài học.{' '}
                          <button onClick={() => setModal({ type: 'lesson', data: { topicId: topic.id } })}
                            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Thêm ngay
                          </button>
                        </div>
                      ) : topicLessons.map((lesson, idx) => {
                        const hasTimeline = (() => { try { return JSON.parse(lesson.timeline || '[]').length > 0; } catch { return false; } })();
                        return (
                          <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px 11px 40px', borderBottom: idx < topicLessons.length - 1 ? '1px solid #F5F5F5' : 'none', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', fontSize: '0.73rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {lesson.lessonOrder || idx + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.87rem', marginBottom: 3 }}>{lesson.title}</div>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {lesson.summary && <span style={badge('#E3F2FD', '#1565C0')}>Tóm tắt</span>}
                                {lesson.specialContent && <span style={badge('#E8F5E9', '#2E7D32')}>Chuyên đề</span>}
                                {hasTimeline && <span style={badge('#FFF3E0', '#E65100')}>Timeline</span>}
                                {lesson.sourceUrl && <span style={badge('#EDE7F6', '#5E35B1')}>Nguồn</span>}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <FiEyeOff size={10} /> {lesson.views || 0}
                                </span>
                              </div>
                            </div>
                            <span style={badge(lesson.isPublished ? '#E8F5E9' : '#FAFAFA', lesson.isPublished ? '#2E7D32' : '#9E9E9E')}>
                              {lesson.isPublished ? 'Hiển thị' : 'Ẩn'}
                            </span>
                            <button onClick={() => setModal({ type: 'lesson', data: lesson })} style={iconBtn}><FiEdit2 size={13} /></button>
                            <button onClick={() => onDeleteLesson(lesson.id)} style={{ ...iconBtn, color: 'var(--error)' }}><FiTrash2 size={13} /></button>
                          </div>
                        );
                      })}
                      <div style={{ padding: '7px 16px 7px 40px' }}>
                        <button onClick={() => setModal({ type: 'lesson', data: { topicId: topic.id } })}
                          style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FiPlus size={13} /> Thêm bài học vào chủ đề này
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
export default function ManageLessons() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'sections');
  const [gradeFilter, setGradeFilter] = useState('12');
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, secRes, topRes, lesRes] = await Promise.all([
        fetch(`${API}/admin/lesson-categories`, { headers: authHeaders() }),
        fetch(`${API}/admin/lesson-sections?grade=${gradeFilter}`, { headers: authHeaders() }),
        fetch(`${API}/admin/lesson-topics?grade=${gradeFilter}`, { headers: authHeaders() }),
        fetch(`${API}/admin/lessons?grade=${gradeFilter}`, { headers: authHeaders() }),
      ]);
      const [catD, secD, topD, lesD] = await Promise.all([catRes.json(), secRes.json(), topRes.json(), lesRes.json()]);
      setCategories(catD.data || []);
      setSections(secD.data || []);
      setTopics(topD.data || []);
      setLessons(lesD.data || []);
      setExpandedTopics(new Set((topD.data || []).map(t => t.id)));
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  }, [gradeFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleExpand = (id) => {
    const s = new Set(expandedTopics);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedTopics(s);
  };

  const handleDeleteTopic = async (id) => {
    if (!confirm('Xóa chủ đề sẽ xóa tất cả bài học bên trong. Bạn chắc chắn?')) return;
    try {
      const res = await fetch(`${API}/admin/lesson-topics/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Đã xóa chủ đề');
      loadAll();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm('Bạn chắc chắn muốn xóa bài học này?')) return;
    try {
      const res = await fetch(`${API}/admin/lessons/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Đã xóa bài học');
      loadAll();
    } catch (err) { toast.error(err.message); }
  };

  const closeModal = () => setModal(null);
  const afterSave = () => { closeModal(); loadAll(); };

  const TABS = [
    { id: 'sections', label: 'Phần bài học', icon: <FiArchive size={15} /> },
    { id: 'topics', label: 'Chủ đề & Bài học', icon: <FiLayers size={15} /> },
  ];

  return (
    <AdminLayout title="Quản lý Bài học">
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Lọc lớp:</label>
          <select style={{ ...inputStyle, width: 'auto', padding: '8px 12px' }}
            value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link to="/admin/lesson-categories" style={{ ...btnOutline, textDecoration: 'none' }}>
            <FiList size={15} /> Danh mục
          </Link>
          {activeTab === 'sections' && (
            <button onClick={() => setModal({ type: 'section', data: null })} style={btnPrimary}>
              <FiPlus /> Tạo phần bài học
            </button>
          )}
          {activeTab === 'topics' && (<>
            <button onClick={() => setModal({ type: 'topic', data: null })} style={btnOutline}>
              <FiPlus /> Thêm chủ đề
            </button>
            <button onClick={() => setModal({ type: 'lesson', data: null })} style={btnPrimary}>
              <FiPlus /> Thêm bài học
            </button>
          </>)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Danh mục', value: categories.length, color: '#7B1FA2', bg: '#F3E5F5', icon: <FiTag size={18} /> },
          { label: 'Phần bài', value: sections.length, color: '#1565C0', bg: '#E3F2FD', icon: <FiArchive size={18} /> },
          { label: 'Chủ đề', value: topics.length, color: '#2E7D32', bg: '#E8F5E9', icon: <FiLayers size={18} /> },
          { label: 'Bài học', value: lessons.length, color: '#E65100', bg: '#FFF3E0', icon: <FiBook size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.82rem', color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.95rem',
            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
            marginBottom: -2, transition: 'all 0.15s'
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Đang tải...</div>
      ) : (
        <>
          {activeTab === 'sections' && (
            <SectionsTab sections={sections} categories={categories}
              gradeFilter={gradeFilter} onRefresh={loadAll} setModal={setModal} />
          )}
          {activeTab === 'topics' && (
            <TopicsTab topics={topics} lessons={lessons}
              expandedTopics={expandedTopics} toggleExpand={toggleExpand}
              setModal={setModal} onDeleteTopic={handleDeleteTopic} onDeleteLesson={handleDeleteLesson} />
          )}
        </>
      )}

      {/* Modals */}
      {modal?.type === 'section' && (
        <SectionModal section={modal.data} categories={categories} onClose={closeModal} onSave={afterSave} />
      )}
      {modal?.type === 'importToSection' && (
        <ImportToSectionModal section={modal.data} onClose={closeModal} onSuccess={afterSave} />
      )}
      {modal?.type === 'topic' && (
        <TopicModal topic={modal.data} grades={GRADES} sections={sections} onClose={closeModal} onSave={afterSave} />
      )}
      {modal?.type === 'lesson' && (
        <LessonModal lesson={modal.data} topics={topics} onClose={closeModal} onSave={afterSave} />
      )}
    </AdminLayout>
  );
}

// ─── Shared Styles ────────────────────────────────────
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
};
const modalBox = {
  background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  width: '100%', overflow: 'hidden'
};
const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)'
};
const formRow = { marginBottom: 14 };
const labelStyle = { display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' };
const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)',
  borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', background: 'white', color: 'var(--text-primary)'
};
const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', background: 'var(--primary)', color: 'white',
  border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
};
const btnOutline = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', background: 'white', color: 'var(--text-secondary)',
  border: '1.5px solid var(--border)', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
};
const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', padding: 6, borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const badge = (bg, color) => ({
  padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
  background: bg, color, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center'
});
