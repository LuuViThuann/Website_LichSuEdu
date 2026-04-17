import { Link } from 'react-router-dom';
import { FiBook, FiClipboard, FiAward, FiArrowRight, FiUsers, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: <FiBook size={28} />, title: 'Thư viện SGK', desc: 'Đọc sách giáo khoa Lịch sử lớp 10, 11, 12 trực tuyến với chế độ lật trang trực quan.' },
  { icon: <FiClipboard size={28} />, title: 'Kiểm tra trắc nghiệm', desc: 'Hàng trăm câu hỏi trắc nghiệm bám sát chương trình THPT, có đáp án và giải thích.' },
  { icon: <FiAward size={28} />, title: 'Theo dõi tiến trình', desc: 'Xem lại lịch sử làm bài, điểm số, biết điểm mạnh yếu để ôn luyện hiệu quả.' },
];

const STATS = [
  { value: '500+', label: 'Câu hỏi trắc nghiệm', icon: <FiClipboard /> },
  { value: '3', label: 'Khối lớp (10-11-12)', icon: <FiBook /> },
  { value: '10K+', label: 'Học sinh tin dùng', icon: <FiUsers /> },
  { value: '4.8★', label: 'Đánh giá trung bình', icon: <FiStar /> },
];

const GRADES = [
  { grade: '10', topics: ['Lịch sử thế giới cổ - trung đại', 'Văn minh Đông Nam Á', 'Việt Nam thời nguyên thủy'], color: '#1565C0' },
  { grade: '11', topics: ['Cách mạng công nghiệp', 'Phong trào giải phóng dân tộc', 'Chiến tranh thế giới I'], color: '#0277BD' },
  { grade: '12', topics: ['Chiến tranh thế giới II', 'Kháng chiến chống Pháp - Mỹ', 'Đổi mới & Hội nhập'], color: '#01579B' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #1976D2 100%)',
        padding: '80px 0 100px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 680 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
              padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
              marginBottom: 24, backdropFilter: 'blur(8px)'
            }}>
              🎓 Nền tảng học Lịch sử #1 Việt Nam
            </span>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              color: 'white', lineHeight: 1.2, marginBottom: 24
            }}>
              Chinh phục Lịch sử<br />
              <span style={{ color: '#FFA726' }}>dễ dàng & hiệu quả</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 36, maxWidth: 520 }}>
              Học từ sách giáo khoa số hóa, luyện đề trắc nghiệm bám sát chương trình THPT Quốc gia.
              Hoàn toàn miễn phí cho học sinh.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to={user ? '/quiz' : '/register'} className="btn btn-accent" style={{ fontSize: '1rem', padding: '12px 28px' }}>
                {user ? 'Làm bài ngay' : 'Bắt đầu miễn phí'} <FiArrowRight />
              </Link>
              <Link to="/library" className="btn" style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                backdropFilter: 'blur(8px)', fontSize: '1rem', padding: '12px 28px',
                border: '1px solid rgba(255,255,255,0.25)'
              }}>
                <FiBook /> Xem thư viện
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                padding: '28px 24px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ color: 'var(--primary)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="section-title">Tính năng nổi bật</h2>
            <p className="section-subtitle">Tất cả những gì bạn cần để học Lịch sử hiệu quả</p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ padding: '32px 28px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'var(--primary-50)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grade sections */}
      <section style={{ padding: '0 0 80px', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title">Nội dung theo khối lớp</h2>
            <p className="section-subtitle">Chương trình bám sát SGK Lịch sử THPT mới nhất</p>
          </div>
          <div className="grid-3">
            {GRADES.map((g) => (
              <div key={g.grade} className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  background: `linear-gradient(135deg, ${g.color}, ${g.color}dd)`,
                  padding: '28px 24px', color: 'white'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>LỊCH SỬ</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>Lớp {g.grade}</div>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <ul style={{ listStyle: 'none' }}>
                    {g.topics.map((t, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '8px 0', borderBottom: i < g.topics.length - 1 ? '1px solid var(--border)' : 'none',
                        fontSize: '0.9rem', color: 'var(--text-secondary)'
                      }}>
                        <span style={{ color: 'var(--primary)', marginTop: 3, flexShrink: 0 }}>▸</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <Link to={`/library?grade=${g.grade}`} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}>
                      <FiBook /> Đọc sách
                    </Link>
                    <Link to={`/quiz?grade=${g.grade}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}>
                      <FiClipboard /> Kiểm tra
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          padding: '64px 0', textAlign: 'center'
        }}>
          <div className="container">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'white', marginBottom: 14 }}>
              Bắt đầu học miễn phí ngay hôm nay
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
              Đăng ký tài khoản và truy cập toàn bộ nội dung học tập
            </p>
            <Link to="/register" className="btn btn-accent" style={{ fontSize: '1rem', padding: '13px 36px' }}>
              Đăng ký ngay - Miễn phí <FiArrowRight />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: '#0D1B2A', color: 'rgba(255,255,255,0.6)', padding: '32px 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: '0.9rem' }}>
            © 2026 <span style={{ color: 'white', fontWeight: 600 }}>HistoryEdu</span> — Nền tảng học Lịch sử trực tuyến
          </p>
        </div>
      </footer>
    </div>
  );
}