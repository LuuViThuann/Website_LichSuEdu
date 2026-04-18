import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import {
  getAdminQuizCategories, createQuizCategory,
  updateQuizCategory, deleteQuizCategory
} from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiTag } from 'react-icons/fi';

const EMPTY_FORM = { name: '', description: '', isActive: true };

export default function ManageQuizCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = thêm mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminQuizCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => toast.error('Không tải được danh mục'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description || '', isActive: !!cat.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên danh mục'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await updateQuizCategory(editItem.id, form);
        toast.success('Đã cập nhật danh mục!');
      } else {
        await createQuizCategory(form);
        toast.success('Đã thêm danh mục mới!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?\nCác bộ đề thuộc danh mục này sẽ không bị xóa.`)) return;
    try {
      await deleteQuizCategory(cat.id);
      toast.success('Đã xóa danh mục');
      load();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handleToggle = async (cat) => {
    try {
      await updateQuizCategory(cat.id, { name: cat.name, description: cat.description, isActive: !cat.isActive });
      toast.success(!cat.isActive ? 'Đã bật danh mục' : 'Đã ẩn danh mục');
      load();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const CATEGORY_COLORS = [
    '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6',
    '#f97316','#14b8a6','#64748b','#ef4444'
  ];

  return (
    <AdminLayout title="Danh mục loại đề">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {categories.length} danh mục
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 8 }}>
            (Thi thử, Giữa kì, Cuối kì, Tốt nghiệp,...)
          </span>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <FiPlus /> Thêm danh mục
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)',
        border: '1px solid #c4b5fd',
        borderRadius: 12, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 12
      }}>
        <FiTag size={18} color="#7c3aed" style={{ marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 600, color: '#5b21b6', fontSize: '0.9rem' }}>
            Danh mục loại đề thi
          </div>
          <div style={{ color: '#6d28d9', fontSize: '0.82rem', marginTop: 4 }}>
            Quản lý các loại đề như: <strong>Thi thử</strong>, <strong>Kiểm tra giữa kì</strong>,
            <strong> Kiểm tra cuối kì</strong>, <strong>Thi tốt nghiệp</strong>, <strong>Ôn tập</strong>...
            Danh mục sẽ hiển thị khi tạo bộ đề và cho phép học sinh lọc theo loại trên trang đề thi.
          </div>
        </div>
      </div>

      {/* Grid danh mục */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : categories.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid var(--border)',
          padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)'
        }}>
          <FiTag size={48} style={{ display: 'block', margin: '0 auto 16px', opacity: 0.3 }} />
          <p>Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {categories.map((cat, idx) => (
            <div key={cat.id} style={{
              background: 'white', borderRadius: 14,
              border: `1px solid ${cat.isActive ? 'var(--border)' : '#fed7aa'}`,
              overflow: 'hidden', opacity: cat.isActive ? 1 : 0.7,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
            >
              {/* Color bar */}
              <div style={{
                height: 5,
                background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
              }} />
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FiTag size={16} color={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {cat.name}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        padding: '2px 8px', borderRadius: 20,
                        background: cat.isActive ? '#dcfce7' : '#fee2e2',
                        color: cat.isActive ? '#16a34a' : '#dc2626',
                      }}>
                        {cat.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                      </span>
                    </div>
                  </div>
                </div>

                {cat.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => openEdit(cat)} className="btn btn-outline"
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}>
                    <FiEdit2 size={13} /> Sửa
                  </button>
                  <button onClick={() => handleToggle(cat)} className="btn btn-outline"
                    style={{
                      flex: 1, padding: '7px 10px', fontSize: '0.82rem',
                      color: cat.isActive ? '#f59e0b' : '#10b981',
                      borderColor: cat.isActive ? '#fde68a' : '#a7f3d0',
                    }}>
                    {cat.isActive ? '🙈 Ẩn' : '👁 Hiện'}
                  </button>
                  <button onClick={() => handleDelete(cat)} className="btn btn-danger"
                    style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>
                {editItem ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên danh mục *</label>
                <input
                  type="text" className="form-input"
                  placeholder="VD: Thi thử, Kiểm tra giữa kì, Thi tốt nghiệp..."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mô tả (tùy chọn)</label>
                <textarea className="form-input" rows={3}
                  placeholder="Mô tả ngắn về loại đề này..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {editItem && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    Hiển thị danh mục (học sinh có thể lọc theo loại này)
                  </span>
                </label>
              )}
            </div>

            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10, justifyContent: 'flex-end'
            }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving
                  ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  : <FiCheck />}
                {editItem ? 'Cập nhật' : 'Thêm danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
