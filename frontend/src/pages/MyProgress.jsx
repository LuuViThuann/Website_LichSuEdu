import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyProgress } from '../services/api';
import { FiBarChart2, FiClock, FiTarget, FiTrendingUp } from 'react-icons/fi';

export default function MyProgress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProgress().then(res => setProgress(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avg = progress.length ? Math.round(progress.reduce((s, p) => s + p.score, 0) / progress.length) : 0;
  const best = progress.length ? Math.max(...progress.map(p => p.score)) : 0;

  const scoreColor = (s) => s >= 80 ? 'var(--success)' : s >= 50 ? 'var(--accent)' : 'var(--error)';
  const scoreBg = (s) => s >= 80 ? '#E8F5E9' : s >= 50 ? '#FFF3E0' : '#FFEBEE';

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 6 }}>📊 Kết quả của tôi</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>Theo dõi tiến trình học tập của bạn</p>

        {/* Summary stats */}
        {progress.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { icon: <FiBarChart2 size={22} />, label: 'Điểm trung bình', value: `${avg}%`, color: 'var(--primary)' },
              { icon: <FiTrendingUp size={22} />, label: 'Điểm cao nhất', value: `${best}%`, color: 'var(--success)' },
              { icon: <FiTarget size={22} />, label: 'Số bài đã làm', value: progress.length, color: 'var(--accent)' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'white', borderRadius: 14, border: '1px solid var(--border)',
                padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--primary-50)', color: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History list */}
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : progress.length === 0 ? (
          <div className="page-loading" style={{ flexDirection: 'column', gap: 16 }}>
            <FiBarChart2 size={48} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-muted)' }}>Bạn chưa làm bài kiểm tra nào</p>
            <Link to="/quiz" className="btn btn-primary">Làm bài ngay</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Lịch sử làm bài</h2>
            {progress.map((p, i) => (
              <div key={p.id || i} style={{
                background: 'white', borderRadius: 12, border: '1px solid var(--border)',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: scoreBg(p.score), color: scoreColor(p.score),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem'
                }}>
                  {p.score}%
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                    {p.quiz?.title || 'Bài kiểm tra'}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span><FiTarget size={11} style={{ marginRight: 3 }} />{p.correctAnswers}/{p.totalQuestions} câu đúng</span>
                    <span><FiClock size={11} style={{ marginRight: 3 }} />{Math.round(p.timeTaken / 60)} phút</span>
                    <span>📅 {new Date(p.completedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                  background: scoreBg(p.score), color: scoreColor(p.score)
                }}>
                  {p.score >= 80 ? 'Xuất sắc' : p.score >= 65 ? 'Tốt' : p.score >= 50 ? 'Đạt' : 'Chưa đạt'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}