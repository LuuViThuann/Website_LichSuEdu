import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiBook, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      login(data.token, data.user);
      toast.success(`Chào mừng, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
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
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Card */}
          <div style={{
            background: 'white', borderRadius: 20, padding: '44px 40px',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
          }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiBook color="white" size={24} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                Đăng nhập
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chào mừng trở lại HistoryEdu</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    style={{ paddingLeft: 40, paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', color: 'var(--text-muted)', padding: 0
                  }}>
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Mật khẩu phải có ít nhất 8 ký tự, trong đó có ít nhất một ký tự đặc biệt
                </p>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', marginTop: 8 }}>
                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Đang đăng nhập...</> : 'Đăng nhập'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}