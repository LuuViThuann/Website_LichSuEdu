import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBook, FiClipboard, FiHome, FiLogIn, FiLogOut,
  FiUser, FiMenu, FiX, FiSettings, FiBarChart2
} from 'react-icons/fi';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const navLinks = [
    { to: '/', label: 'Trang chủ', icon: <FiHome /> },
    { to: '/library', label: 'Thư viện', icon: <FiBook /> },
    { to: '/quiz', label: 'Kiểm tra', icon: <FiClipboard /> },
  ];

  const handleLogout = () => { logout(); navigate('/'); setDropdownOpen(false); };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'white',
      borderBottom: '1px solid var(--border)',
      boxShadow: scrolled ? 'var(--shadow)' : 'none',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 68, gap: 32 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FiBook color="white" size={18} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 700 }}>
            History<span style={{ color: 'var(--accent)' }}>Edu</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              fontWeight: 500, fontSize: '0.95rem',
              color: isActive(link.to) ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive(link.to) ? 'var(--primary-50)' : 'transparent',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => { if (!isActive(link.to)) e.currentTarget.style.background = '#F5F5F5'; }}
              onMouseLeave={e => { if (!isActive(link.to)) e.currentTarget.style.background = 'transparent'; }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, fontWeight: 500, fontSize: '0.95rem',
              color: location.pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--text-secondary)',
              background: location.pathname.startsWith('/admin') ? '#FFF3E0' : 'transparent',
              transition: 'all 0.2s'
            }}>
              <FiSettings /> Quản trị
            </Link>
          )}
        </nav>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 8,
                background: 'var(--primary-50)', border: 'none',
                color: 'var(--primary)', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.9rem', transition: 'all 0.2s'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                {user.name?.split(' ').pop()}
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                  minWidth: 200, overflow: 'hidden', zIndex: 100
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                  {[
                    { to: '/progress', icon: <FiBarChart2 />, label: 'Kết quả của tôi' },
                    ...(isAdmin ? [{ to: '/admin', icon: <FiSettings />, label: 'Quản trị hệ thống' }] : [])
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 16px', color: 'var(--text-secondary)',
                      fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', width: '100%', background: 'none',
                    color: 'var(--error)', fontSize: '0.9rem', fontWeight: 500,
                    borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFEBEE'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <FiLogOut /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 18px' }}>
                <FiLogIn /> Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 18px' }}>
                Đăng ký
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn" style={{
            display: 'none', background: 'none', color: 'var(--text-primary)', padding: 6
          }}>
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: 'white', borderTop: '1px solid var(--border)',
          padding: '12px 24px 20px'
        }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 0', color: isActive(link.to) ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 500, borderBottom: '1px solid var(--border)'
            }}>
              {link.icon} {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}