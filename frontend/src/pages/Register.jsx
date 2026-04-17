import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi, getGrades } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiBook } from 'react-icons/fi';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', grade: '' });
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Lấy danh sách lớp từ API (admin có thể thêm/sửa/xóa)
  useEffect(() => {
    getGrades()
      .then(res => setGrades(res.data.data || []))
      .catch(() => {
        // Fallback nếu API chưa sẵn sàng
        setGrades([
          { id: 1, name: '4' }, { id: 2, name: '5' }, { id: 3, name: '6' },
          { id: 4, name: '7' }, { id: 5, name: '8' }, { id: 6, name: '9' },
          { id: 7, name: '10' }, { id: 8, name: '11' }, { id: 9, name: '12' }
        ]);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.token, data.user);
      toast.success('Đăng ký thành công! Chào mừng bạn!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, white 60%)'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '44px 40px',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiBook color="white" size={24} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 6 }}>Tạo tài khoản</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Miễn phí — Học không giới hạn</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="form-input" placeholder="Nguyễn Văn A"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    required style={{ paddingLeft: 40 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="form-input" placeholder="email@example.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    required style={{ paddingLeft: 40 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" className="form-input" placeholder="Tối thiểu 6 ký tự"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    required style={{ paddingLeft: 40 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Khối lớp hiện tại</label>
                <select className="form-select" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                  <option value="">-- Chọn lớp --</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.name}>Lớp {g.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', marginTop: 4 }}>
                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Đang tạo tài khoản...</> : 'Đăng ký miễn phí'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}