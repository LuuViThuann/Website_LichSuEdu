import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument } from '../services/api';
import { FiArrowLeft, FiArrowRight, FiChevronLeft, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi';

export default function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    getDocument(id)
      .then(res => { setDoc(res.data.data); setLoading(false); })
      .catch(() => { setLoading(false); setPdfError(true); });
  }, [id]);

  const pdfUrl = doc ? `/uploads/pdfs/${doc.filename}` : '';

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (pdfError || !doc) return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: 16 }}>
      <p>Không tìm thấy tài liệu</p>
      <button className="btn btn-primary" onClick={() => navigate('/library')}>Quay lại thư viện</button>
    </div>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: '#1a1a2e', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        background: '#16213e', borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16
      }}>
        <button onClick={() => navigate('/library')} className="btn" style={{
          background: 'rgba(255,255,255,0.1)', color: 'white', padding: '7px 14px', fontSize: '0.85rem'
        }}>
          <FiChevronLeft /> Thư viện
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{doc.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: 12 }}>Lớp {doc.grade}</span>
        </div>
        {/* Zoom controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="btn"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '7px 10px' }}>
            <FiZoomOut />
          </button>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', minWidth: 40, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="btn"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '7px 10px' }}>
            <FiZoomIn />
          </button>
        </div>
      </div>

      {/* PDF Viewer - Full iframe embed */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px', overflow: 'auto' }}>
        <div style={{
          width: '100%', maxWidth: 1100,
          background: 'white', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          transform: `scale(${zoom})`, transformOrigin: 'top center',
          transition: 'transform 0.2s ease'
        }}>
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#toolbar=1&navpanes=1&view=FitH`}
            width="100%"
            height="800"
            style={{ border: 'none', display: 'block' }}
            title={doc.title}
          />
        </div>
      </div>

      {/* Bottom info bar */}
      <div style={{
        background: '#16213e', borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24
      }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
          📄 {doc.description || 'Tài liệu Lịch sử'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
          📦 {doc.filesize > 0 ? `${(doc.filesize / 1024 / 1024).toFixed(1)} MB` : 'PDF'}
        </span>
        <a href={pdfUrl} download={doc.filename} className="btn" style={{
          background: 'var(--primary)', color: 'white', padding: '6px 16px', fontSize: '0.8rem'
        }}>
          Tải xuống PDF
        </a>
      </div>
    </div>
  );
}