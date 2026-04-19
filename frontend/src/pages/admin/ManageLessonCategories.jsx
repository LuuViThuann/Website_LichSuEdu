// ============================================================
// Trang Admin: ManageLessonCategories.jsx
// Quản lý danh mục bài học (CRUD)
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave,
  FiList, FiBookOpen, FiExternalLink, FiTag,
  FiInbox, FiToggleLeft, FiToggleRight, FiAlignLeft
} from 'react-icons/fi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

// ─────────────────────────────────────────────────────
// Modal: Thêm/Sửa danh mục
// ─────────────────────────────────────────────────────
function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive !== undefined ? !!category.isActive : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên danh mục');
    setLoading(true);
    try {
      const url = category
        ? `${API}/admin/lesson-categories/${category.id}`
        : `${API}/admin/lesson-categories`;
      const method = category ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(category ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới');
      onSave(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: 480 }}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiTag size={18} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              {category ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
          </div>
          <button onClick={onClose} style={iconBtn}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={formRow}>
            <label style={labelStyle}>Tên danh mục *</label>
            <input style={inputStyle} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Tóm tắt bài học, Chuyên đề, Dòng thời gian..." />
          </div>

          <div style={formRow}>
            <label style={labelStyle}>Mô tả</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về danh mục này..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Thứ tự hiển thị</label>
              <input style={inputStyle} type="number" min={0}
                value={form.displayOrder}
                onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Kích hoạt (hiển thị)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={btnOutline}>Hủy</button>
            <button type="submit" disabled={loading} style={btnPrimary}>
              <FiSave /> {loading ? 'Đang lưu...' : 'Lưu danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
export default function ManageLessonCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/lesson-categories`, { headers: authHeaders() });
      const data = await res.json();
      setCategories(data.data || []);
    } catch { toast.error('Lỗi tải danh mục'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa danh mục "${name}"?\nCác phần bài học thuộc danh mục này sẽ không bị xóa.`)) return;
    try {
      const res = await fetch(`${API}/admin/lesson-categories/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Đã xóa danh mục');
      loadCategories();
    } catch (err) { toast.error(err.message); }
  };

  const closeModal = () => setModal(null);
  const afterSave = () => { closeModal(); loadCategories(); };

  return (
    <AdminLayout title="Danh mục bài học">
      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Quản lý danh mục: Tóm tắt bài học, Chuyên đề, Dòng thời gian,...
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/lessons" style={{ ...btnOutline, textDecoration: 'none' }}>
            <FiBookOpen size={15} /> Quản lý bài học
          </Link>
          <button onClick={() => setModal({ data: null })} style={btnPrimary}>
            <FiPlus /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'linear-gradient(135deg, #1565C0, #283593)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiList size={26} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{categories.length}</div>
          <div style={{ opacity: 0.85, fontSize: '0.95rem', marginTop: 4 }}>Danh mục bài học</div>
        </div>
        <div style={{ marginLeft: 'auto', opacity: 0.75, fontSize: '0.85rem', maxWidth: 280, lineHeight: 1.5 }}>
          Mỗi danh mục chứa nhiều "Phần bài học". Quản lý phần bài học trong trang "Quản lý bài học".
        </div>
      </div>

      {/* Category grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Đang tải...</div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
          <FiInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Chưa có danh mục nào</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
            Thêm danh mục để phân loại bài học của bạn.
          </div>
          <button onClick={() => setModal({ data: null })} style={btnPrimary}>
            <FiPlus /> Thêm danh mục đầu tiên
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {categories.map((cat, index) => (
            <div key={cat.id} style={{
              background: 'white', borderRadius: 14, border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
              opacity: cat.isActive ? 1 : 0.6, transition: 'box-shadow 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
            >
              {/* Card header */}
              <div style={{
                background: `linear-gradient(135deg, ${PALETTE[index % PALETTE.length][0]}, ${PALETTE[index % PALETTE.length][1]})`,
                padding: '20px 20px 16px', display: 'flex', alignItems: 'flex-start', gap: 14
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiTag size={22} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white', marginBottom: 6 }}>
                    {cat.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.25)', color: 'white' }}>
                      {cat.isActive ? 'Kích hoạt' : 'Ẩn'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiList size={12} /> {cat.sectionCount || 0} phần bài học
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 44 }}>
                  <FiAlignLeft size={14} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {cat.description || <em>Chưa có mô tả</em>}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {cat.isActive
                    ? <FiToggleRight size={14} color="#2E7D32" />
                    : <FiToggleLeft size={14} color="#9E9E9E" />
                  }
                  Thứ tự: {cat.displayOrder}
                </span>
                <Link to={`/admin/lessons?category=${cat.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, background: 'var(--primary-50)', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                  <FiExternalLink size={13} /> Xem phần
                </Link>
                <button onClick={() => setModal({ data: cat })} style={iconBtn} title="Sửa">
                  <FiEdit2 size={15} />
                </button>
                <button onClick={() => handleDelete(cat.id, cat.name)} style={{ ...iconBtn, color: 'var(--error)' }} title="Xóa">
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CategoryModal category={modal.data} onClose={closeModal} onSave={afterSave} />
      )}
    </AdminLayout>
  );
}

// ─── Color palette cho cards ─────────────────────────
const PALETTE = [
  ['#1565C0', '#283593'],
  ['#2E7D32', '#1B5E20'],
  ['#6A1B9A', '#4A148C'],
  ['#E65100', '#BF360C'],
  ['#00695C', '#004D40'],
  ['#4527A0', '#311B92'],
];

// ─── Styles ──────────────────────────────────────────
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
