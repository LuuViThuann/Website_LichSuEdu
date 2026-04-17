import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../../services/api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import { FiUsers, FiTrash2, FiSearch } from 'react-icons/fi';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getUsers().then(res => setUsers(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa tài khoản "${name}"?`)) return;
    try { await deleteUser(id); toast.success('Đã xóa người dùng'); load(); }
    catch { toast.error('Xóa thất bại'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const students = filtered.filter(u => u.role === 'student');
  const admins = filtered.filter(u => u.role === 'admin');

  return (
    <AdminLayout title="Quản lý người dùng">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 280 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-input" placeholder="Tìm người dùng..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span className="badge badge-blue">{students.length} học sinh</span>
          <span className="badge badge-orange">{admins.length} admin</span>
        </div>
      </div>

      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Người dùng', 'Email', 'Vai trò', 'Lớp', 'Ngày đăng ký', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FiUsers size={32} style={{ display: 'block', margin: '0 auto 10px' }} />
                  Không tìm thấy người dùng
                </td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: u.role === 'admin' ? 'var(--accent)' : 'var(--primary)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.85rem'
                      }}>{u.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-orange' : 'badge-blue'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Học sinh'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {u.grade ? `Lớp ${u.grade}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u.id, u.name)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FiTrash2 /> Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}