import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiClipboard, FiBook, FiUsers, FiBarChart2,
  FiLogOut, FiChevronRight, FiLayers
} from 'react-icons/fi';

const NAV = [
  { to: '/admin', label: 'Tổng quan', icon: <FiBarChart2 /> },
  { to: '/admin/quiz', label: 'Quản lý đề thi', icon: <FiClipboard /> },
  { to: '/admin/documents', label: 'Quản lý tài liệu', icon: <FiBook /> },
  { to: '/admin/users', label: 'Quản lý người dùng', icon: <FiUsers /> },
  { to: '/admin/grades', label: 'Quản lý lớp học', icon: <FiLayers /> },
];

export default function AdminLayout({ children, title }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 68px)', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'white', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Quản trị hệ thống
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            👋 {user?.name}
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 8, marginBottom: 2, fontWeight: 500, fontSize: '0.9rem',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'var(--primary-50)' : 'transparent',
                transition: 'all 0.15s'
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.icon} {item.label}
                {active && <FiChevronRight style={{ marginLeft: 'auto' }} />}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            color: 'var(--text-secondary)', fontSize: '0.9rem', borderRadius: 8
          }}>
            <FiHome /> Về trang chủ
          </Link>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%',
            color: 'var(--error)', fontSize: '0.9rem', background: 'none', borderRadius: 8, cursor: 'pointer'
          }}>
            <FiLogOut /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 28, color: 'var(--text-primary)' }}>{title}</h1>
        {children}
      </main>
    </div>
  );
}