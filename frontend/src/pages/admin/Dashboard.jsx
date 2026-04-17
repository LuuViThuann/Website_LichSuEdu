import { useState, useEffect } from 'react';
import { getAdminStats } from '../../services/api';
import AdminLayout from './AdminLayout';
import { FiUsers, FiClipboard, FiBook, FiTarget } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(res => setStats(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const CARDS = stats ? [
    { label: 'Học sinh', value: stats.totalUsers, icon: <FiUsers />, color: 'var(--primary)', bg: 'var(--primary-50)' },
    { label: 'Bộ đề thi', value: stats.totalQuizzes, icon: <FiClipboard />, color: 'var(--accent)', bg: '#FFF3E0' },
    { label: 'Tài liệu', value: stats.totalDocuments, icon: <FiBook />, color: 'var(--success)', bg: '#E8F5E9' },
    { label: 'Lượt làm bài', value: stats.totalAttempts, icon: <FiTarget />, color: '#7B1FA2', bg: '#F3E5F5' },
  ] : [];

  return (
    <AdminLayout title="Tổng quan hệ thống">
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid-4" style={{ marginBottom: 32 }}>
            {CARDS.map(c => (
              <div key={c.label} style={{
                background: 'white', borderRadius: 14, border: '1px solid var(--border)',
                padding: '22px 24px', boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', gap: 16
              }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Recent users */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Học sinh mới đăng ký</h3>
              {stats.recentUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có học sinh nào</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.recentUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                      }}>{u.name.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      {u.grade && <span className="badge badge-blue">Lớp {u.grade}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent attempts */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Lượt làm bài gần đây</h3>
              {stats.recentProgress.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có lượt làm bài nào</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.recentProgress.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                        background: p.score >= 50 ? '#E8F5E9' : '#FFEBEE',
                        color: p.score >= 50 ? 'var(--success)' : 'var(--error)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.9rem'
                      }}>{p.score}%</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.user?.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.quiz?.title}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(p.completedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}