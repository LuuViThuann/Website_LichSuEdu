import { useState, useEffect } from 'react';
import { getAdminGrades, createGrade, updateGrade, deleteGrade } from '../../services/api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiList } from 'react-icons/fi';

const EMPTY_FORM = { name: '', gradeNumber: '', description: '', isActive: true };

export default function ManageGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null); // null = tạo mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => toast.error('Không thể tải danh sách lớp'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditingGrade(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (grade) => {
    setEditingGrade(grade);
    setForm({
      name: grade.name,
      gradeNumber: grade.gradeNumber,
      description: grade.description || '',
      isActive: !!grade.isActive
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên lớp (VD: 4, 5, 6,...)'); return; }
    if (!form.gradeNumber) { toast.error('Vui lòng nhập số thứ tự lớp'); return; }
    setSaving(true);
    try {
      if (editingGrade) {
        await updateGrade(editingGrade.id, form);
        toast.success(`Đã cập nhật lớp ${form.name}`);
      } else {
        await createGrade(form);
        toast.success(`Đã thêm lớp ${form.name}`);
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grade) => {
    if (!window.confirm(`Xóa lớp "${grade.name}"?\nHọc sinh thuộc lớp này sẽ không bị ảnh hưởng nhưng lớp sẽ không còn xuất hiện trong form đăng ký.`)) return;
    try {
      await deleteGrade(grade.id);
      toast.success(`Đã xóa lớp ${grade.name}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <AdminLayout title="Quản lý lớp học">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {grades.length} lớp ({grades.filter(g => g.isActive).length} đang hoạt động)
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Lớp được thêm ở đây sẽ hiển thị trong form đăng ký của học sinh.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <FiPlus /> Thêm lớp mới
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Tên lớp', 'Số thứ tự', 'Mô tả', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FiList size={32} style={{ display: 'block', margin: '0 auto 10px' }} />
                  Chưa có lớp nào. Nhấn "Thêm lớp mới" để bắt đầu.
                </td></tr>
              ) : grades.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                      color: 'white', fontWeight: 800, fontSize: '1rem'
                    }}>
                      {g.name}
                    </div>
                    <span style={{ marginLeft: 12, fontWeight: 700, fontSize: '1rem' }}>Lớp {g.name}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    #{g.gradeNumber}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {g.description || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${g.isActive ? 'badge-green' : 'badge-red'}`}>
                      {g.isActive ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(g)} className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FiEdit2 /> Sửa
                      </button>
                      <button onClick={() => handleDelete(g)} className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FiTrash2 /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 460,
            boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {editingGrade ? `Sửa lớp ${editingGrade.name}` : 'Thêm lớp mới'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}>
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tên lớp *</label>
                  <input type="text" className="form-input" placeholder="VD: 4, 5, 6, 10, 11, 12"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Nhập số lớp (4 → 12)</small>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Số thứ tự *</label>
                  <input type="number" className="form-input" placeholder="VD: 4" min={1} max={20}
                    value={form.gradeNumber} onChange={e => setForm({ ...form, gradeNumber: Number(e.target.value) })} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Dùng để sắp xếp</small>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mô tả</label>
                <input type="text" className="form-input" placeholder="VD: Lớp 10 - THPT"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isActiveChk" checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <label htmlFor="isActiveChk" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                  Hiển thị lớp này trong form đăng ký
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <FiCheck />}
                {editingGrade ? 'Cập nhật' : 'Thêm lớp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
