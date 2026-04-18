import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument } from '../services/api';
import { FiChevronLeft, FiZoomIn, FiZoomOut, FiDownload, FiList, FiX } from 'react-icons/fi';
import { MdMenuBook, MdNavigateBefore, MdNavigateNext } from 'react-icons/md';

/* ─── helpers ─── */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ─── Page canvas rendered by PDF.js ─── */
function PdfPage({ pdfDoc, pageNum, scale, onLoaded }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !pageNum) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(pageNum);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (!cancelled && onLoaded) onLoaded(pageNum, viewport.width, viewport.height);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, scale]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}

/* ─── A single Book Leaf (front + back face) ─── */
function Leaf({ frontPage, backPage, pdfDoc, scale, flipping, direction, zIndex, onAnimEnd }) {
  const leafRef = useRef(null);

  return (
    <div
      ref={leafRef}
      className={`leaf ${flipping ? (direction === 'next' ? 'flip-next' : 'flip-prev') : ''}`}
      style={{ zIndex }}
      onAnimationEnd={onAnimEnd}
    >
      {/* Front face */}
      <div className="leaf-face leaf-front">
        {frontPage > 0 && (
          <PdfPage pdfDoc={pdfDoc} pageNum={frontPage} scale={scale} />
        )}
        {frontPage === 0 && (
          <div className="leaf-placeholder">
            <MdMenuBook size={48} style={{ opacity: 0.2 }} />
          </div>
        )}
      </div>
      {/* Back face */}
      <div className="leaf-face leaf-back">
        {backPage > 0 && (
          <PdfPage pdfDoc={pdfDoc} pageNum={backPage} scale={scale} />
        )}
        {backPage === 0 && (
          <div className="leaf-placeholder">
            <MdMenuBook size={48} style={{ opacity: 0.2 }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Thumbnail sidebar ─── */
function ThumbnailBar({ pdfDoc, numPages, currentSpread, onJump, onClose }) {
  const scale = 0.3;
  return (
    <div className="thumb-bar">
      <div className="thumb-bar-header">
        <span>Mục lục trang</span>
        <button onClick={onClose} className="icon-btn"><FiX size={18} /></button>
      </div>
      <div className="thumb-list">
        {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            className={`thumb-item ${currentSpread.includes(p) ? 'active' : ''}`}
            onClick={() => onJump(p)}
          >
            <div className="thumb-canvas-wrap">
              <PdfPage pdfDoc={pdfDoc} pageNum={p} scale={scale} />
            </div>
            <span className="thumb-label">Trang {p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Main BookReader
═══════════════════════════════════════ */
export default function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  // currentSpread: which two pages are visible [left, right]
  // spread index 0 → pages [0, 1] (0 = cover placeholder, 1 = page 1)
  const [spreadIndex, setSpreadIndex] = useState(0);  // 0-based spread
  const totalSpreads = numPages > 0 ? Math.ceil((numPages + 1) / 2) : 0;

  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState('next');
  const [zoom, setZoom] = useState(0.7);
  const [showThumb, setShowThumb] = useState(false);
  const [pdfScale] = useState(1.5); // render quality

  // Pages for current spread
  const leftPage = spreadIndex === 0 ? 0 : spreadIndex * 2 - 1;        // 0 = blank cover
  const rightPage = spreadIndex * 2 < numPages ? spreadIndex * 2 + (spreadIndex === 0 ? 1 : 1) : 0;

  // Compute spread pages more clearly
  // spread 0: left=blank(cover), right=page 1
  // spread 1: left=page 2, right=page 3
  // spread n: left=page 2n, right=page 2n+1
  const getSpreadPages = (si) => {
    if (si === 0) return { left: 0, right: 1 };
    const l = si * 2;
    const r = l + 1;
    return { left: l <= numPages ? l : 0, right: r <= numPages ? r : 0 };
  };

  const { left: leftPageNum, right: rightPageNum } = getSpreadPages(spreadIndex);

  /* Load PDF.js */
  useEffect(() => {
    // Load PDF.js from CDN
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script1.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script1);
    return () => document.head.removeChild(script1);
  }, []);

  /* Load document metadata */
  useEffect(() => {
    getDocument(id)
      .then(res => { setDoc(res.data.data); setLoading(false); })
      .catch(() => { setLoading(false); setPdfError(true); });
  }, [id]);

  /* Load PDF binary */
  useEffect(() => {
    if (!doc || !window.pdfjsLib) return;
    const url = `/uploads/pdfs/${doc.filename}`;
    const tryLoad = () => {
      if (!window.pdfjsLib) { setTimeout(tryLoad, 200); return; }
      window.pdfjsLib.getDocument(url).promise
        .then(pdf => { setPdfDoc(pdf); setNumPages(pdf.numPages); })
        .catch(() => setPdfError(true));
    };
    tryLoad();
  }, [doc]);

  /* Navigation */
  const goNext = useCallback(() => {
    if (flipping || spreadIndex >= totalSpreads - 1) return;
    setFlipDir('next');
    setFlipping(true);
    setTimeout(() => {
      setSpreadIndex(i => i + 1);
      setFlipping(false);
    }, 600);
  }, [flipping, spreadIndex, totalSpreads]);

  const goPrev = useCallback(() => {
    if (flipping || spreadIndex <= 0) return;
    setFlipDir('prev');
    setFlipping(true);
    setTimeout(() => {
      setSpreadIndex(i => i - 1);
      setFlipping(false);
    }, 600);
  }, [flipping, spreadIndex]);

  /* Keyboard */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  /* Jump to page from thumbnail */
  const jumpToPage = (page) => {
    const si = page <= 1 ? 0 : Math.ceil(page / 2);
    setSpreadIndex(clamp(si, 0, totalSpreads - 1));
    setShowThumb(false);
  };

  /* ── Render states ── */
  if (loading) return (
    <div className="br-loading">
      <div className="br-spinner" />
      <p>Đang tải sách...</p>
    </div>
  );

  if (pdfError || !doc) return (
    <div className="br-loading">
      <p style={{ marginBottom: 12 }}>Không tìm thấy tài liệu</p>
      <button className="btn btn-primary" onClick={() => navigate('/library')}>Quay lại thư viện</button>
    </div>
  );

  const pdfUrl = `/uploads/pdfs/${doc.filename}`;
  const pageDisplay = leftPageNum > 0
    ? `Trang ${leftPageNum}${rightPageNum > 0 ? ` – ${rightPageNum}` : ''}`
    : `Trang ${rightPageNum}`;

  return (
    <>
      {/* ── Global styles injected ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap');

        .br-root {
          min-height: calc(100vh - 68px);
          background: #f0f4f8;
          display: flex;
          flex-direction: column;
          font-family: 'Be Vietnam Pro', sans-serif;
          color: #1a2540;
        }

        /* ── Top bar ── */
        .br-topbar {
          position: sticky; top: 0; z-index: 100;
          background: #fff;
          box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
          padding: 10px 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .br-title {
          flex: 1; text-align: center;
          font-size: 0.95rem; font-weight: 600;
          color: #1a2540;
          letter-spacing: 0.01em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .br-title small {
          display: inline;
          font-size: 0.78rem; font-weight: 400;
          color: #6b7a99;
          margin-left: 8px;
        }
        .icon-btn {
          background: #f4f6fb;
          border: 1px solid #dde3f0;
          color: #3d5a9a; border-radius: 8px;
          padding: 7px 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; gap: 5px;
          font-size: 0.8rem; font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 500;
          white-space: nowrap;
        }
        .icon-btn:hover {
          background: #e8eef9;
          border-color: #3d5a9a;
          color: #2a4080;
        }
        .zoom-display {
          font-size: 0.78rem; color: #6b7a99;
          min-width: 36px; text-align: center; font-weight: 500;
        }

        /* ── Stage ── */
        .br-stage {
          flex: 1; display: flex; justify-content: center; align-items: center;
          padding: 28px 20px 16px;
          position: relative;
          overflow: hidden;
        }

        /* ── Book wrapper (perspective) ── */
        .book-wrap {
          position: relative;
          perspective: 2400px;
          perspective-origin: 50% 45%;
        }
        .book {
          position: relative;
          display: flex;
          transform-style: preserve-3d;
          transform: rotateX(3deg);
          filter: drop-shadow(0 24px 48px rgba(30,50,120,0.18)) drop-shadow(0 4px 12px rgba(30,50,120,0.1));
          transition: transform 0.3s ease;
          border-radius: 2px;
        }
        .book:hover { transform: rotateX(1.5deg); }

        /* book spine shadow */
        .book::before {
          content: '';
          position: absolute;
          left: 50%; top: 0; bottom: 0;
          width: 10px;
          transform: translateX(-50%);
          background: linear-gradient(to right,
            rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 40%,
            rgba(0,0,0,0.04) 60%, rgba(0,0,0,0.22) 100%);
          z-index: 10;
          pointer-events: none;
        }

        /* ── Page panels ── */
        .page-panel {
          width: var(--page-w);
          height: var(--page-h);
          background: #fff;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: filter 0.2s;
        }
        .page-panel.left  { border-radius: 3px 0 0 3px; }
        .page-panel.right { border-radius: 0 3px 3px 0; }

        /* hover hint on clickable pages */
        .page-panel.clickable-left::after,
        .page-panel.clickable-right::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(to left, transparent 60%, rgba(61,90,154,0.06) 100%);
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 8; pointer-events: none;
        }
        .page-panel.clickable-right::after {
          background: linear-gradient(to right, transparent 60%, rgba(61,90,154,0.06) 100%);
        }
        .page-panel.clickable-left:hover::after,
        .page-panel.clickable-right:hover::after { opacity: 1; }

        /* click arrow hint overlay */
        .page-click-hint {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 9; pointer-events: none;
          opacity: 0; transition: opacity 0.2s;
          color: rgba(61,90,154,0.35); font-size: 2rem;
        }
        .page-panel.clickable-left .page-click-hint  { left: 10px; }
        .page-panel.clickable-right .page-click-hint { right: 10px; }
        .page-panel.clickable-left:hover .page-click-hint,
        .page-panel.clickable-right:hover .page-click-hint { opacity: 1; }

        /* blank cover */
        .page-cover {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: linear-gradient(145deg, var(--primary, #3d5a9a) 0%, #1a2e6b 100%);
          color: #fff; gap: 12px;
          padding: 24px; text-align: center;
        }
        .page-cover h2 {
          font-size: 1.2rem; font-weight: 700;
          line-height: 1.4;
        }
        .page-cover span {
          font-size: 0.75rem; opacity: 0.7;
          font-weight: 400;
        }

        /* page number badge */
        .page-num-badge {
          position: absolute; bottom: 8px;
          font-size: 0.65rem; color: rgba(30,50,120,0.3);
          font-family: 'Be Vietnam Pro', sans-serif;
          z-index: 6; user-select: none;
        }
        .page-panel.left  .page-num-badge { right: 12px; }
        .page-panel.right .page-num-badge { left: 12px; }

        /* ── Flipping Leaf ── */
        .leaf-container {
          position: absolute; top: 0; bottom: 0;
          width: var(--page-w);
          right: 0;
          transform-style: preserve-3d;
          z-index: 20;
        }
        .leaf-container.flip-left { left: 0; right: auto; }

        .leaf {
          width: 100%; height: 100%;
          transform-style: preserve-3d;
          transform-origin: left center;
          backface-visibility: hidden;
          position: relative;
        }
        .leaf-container.flip-left .leaf { transform-origin: right center; }

        @keyframes flipNext {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipPrev {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        .leaf.flipping-next {
          animation: flipNext 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
        }
        .leaf.flipping-prev {
          animation: flipPrev 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
        }

        .leaf-face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          overflow: hidden;
          background: #fff;
        }
        .leaf-back { transform: rotateY(180deg); }

        .leaf.flipping-next::before,
        .leaf.flipping-prev::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(30,50,120,0.0), rgba(30,50,120,0.22));
          z-index: 10;
          pointer-events: none;
          animation: shadowSweep 0.6s ease forwards;
        }
        @keyframes shadowSweep {
          0%   { opacity: 0; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Nav buttons ── */
        .br-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 50;
        }
        .br-nav.prev { left: clamp(4px, 2vw, 24px); }
        .br-nav.next { right: clamp(4px, 2vw, 24px); }
        .nav-btn {
          background: #fff;
          border: 1px solid #dde3f0;
          color: #3d5a9a;
          border-radius: 50%;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(30,50,120,0.12);
          transition: all 0.18s;
          font-size: 1.4rem;
        }
        .nav-btn:hover:not(:disabled) {
          background: #3d5a9a;
          color: #fff;
          border-color: #3d5a9a;
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(61,90,154,0.3);
        }
        .nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        /* ── Bottom bar ── */
        .br-bottom {
          background: #fff;
          border-top: 1px solid #e8eef8;
          box-shadow: 0 -1px 0 rgba(0,0,0,0.04);
          padding: 10px 24px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
        }
        .page-info {
          font-size: 0.78rem;
          color: #6b7a99;
          font-weight: 500;
        }
        .progress-track {
          flex: 1; max-width: 260px;
          height: 4px;
          background: #e8eef8;
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary, #3d5a9a), #6b8de0);
          border-radius: 99px;
          transition: width 0.4s ease;
        }
        .dl-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--primary, #3d5a9a);
          border: none;
          color: #fff;
          padding: 7px 16px; border-radius: 8px;
          font-size: 0.78rem; cursor: pointer;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 500;
          transition: all 0.18s;
          text-decoration: none;
        }
        .dl-btn:hover { background: #2a4080; box-shadow: 0 2px 10px rgba(61,90,154,0.3); }

        /* ── Thumbnail sidebar ── */
        .thumb-bar {
          position: fixed; right: 0; top: 0; bottom: 0; z-index: 200;
          width: 200px;
          background: #fff;
          border-left: 1px solid #dde3f0;
          box-shadow: -4px 0 20px rgba(30,50,120,0.1);
          display: flex; flex-direction: column;
          animation: slideIn 0.22s ease;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .thumb-bar-header {
          padding: 14px 14px 10px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #eef1f8;
          font-size: 0.82rem; color: #1a2540; font-weight: 600;
        }
        .thumb-list {
          flex: 1; overflow-y: auto; padding: 10px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .thumb-list::-webkit-scrollbar { width: 4px; }
        .thumb-list::-webkit-scrollbar-track { background: transparent; }
        .thumb-list::-webkit-scrollbar-thumb { background: #c8d4f0; border-radius: 2px; }
        .thumb-item {
          background: transparent; border: 1px solid #eef1f8;
          border-radius: 6px; padding: 6px; cursor: pointer;
          transition: all 0.15s; display: flex; flex-direction: column; gap: 4px;
          align-items: center;
        }
        .thumb-item:hover { border-color: #3d5a9a; background: #f4f6fb; }
        .thumb-item.active { border-color: #3d5a9a; background: #edf1fb; }
        .thumb-canvas-wrap {
          width: 100%; aspect-ratio: 0.707; background: #f8f9fc;
          border-radius: 3px; overflow: hidden;
        }
        .thumb-canvas-wrap canvas { width: 100% !important; height: 100% !important; }
        .thumb-label { font-size: 0.65rem; color: #6b7a99; }

        /* ── Loading ── */
        .br-loading {
          min-height: calc(100vh - 68px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #f0f4f8; color: #3d5a9a; gap: 16px;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .br-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(61,90,154,0.15);
          border-top-color: #3d5a9a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="br-root">
        {/* ── Top bar ── */}
        <div className="br-topbar">
          <button className="icon-btn" onClick={() => navigate('/library')}>
            <FiChevronLeft size={18} />
          </button>

          <div className="br-title">
            {doc.title}
            <small>Lớp {doc.grade}</small>
          </div>

          <button className="icon-btn" onClick={() => setShowThumb(v => !v)}>
            <FiList size={16} />
          </button>
          <button className="icon-btn" onClick={() => setZoom(z => clamp(+(z - 0.1).toFixed(1), 0.5, 2))}>
            <FiZoomOut size={16} />
          </button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button className="icon-btn" onClick={() => setZoom(z => clamp(+(z + 0.1).toFixed(1), 0.5, 2))}>
            <FiZoomIn size={16} />
          </button>
        </div>

        {/* ── Stage ── */}
        <div className="br-stage">
          {pdfDoc ? (
            <BookSpread
              pdfDoc={pdfDoc}
              numPages={numPages}
              spreadIndex={spreadIndex}
              totalSpreads={totalSpreads}
              getSpreadPages={getSpreadPages}
              flipping={flipping}
              flipDir={flipDir}
              zoom={zoom}
              pdfScale={pdfScale}
              doc={doc}
              onNext={goNext}
              onPrev={goPrev}
            />
          ) : (
            <div className="br-spinner" />
          )}

          {/* Nav buttons */}
          <div className="br-nav prev">
            <button className="nav-btn" onClick={goPrev} disabled={spreadIndex <= 0 || flipping}>
              <MdNavigateBefore />
            </button>
          </div>
          <div className="br-nav next">
            <button className="nav-btn" onClick={goNext} disabled={spreadIndex >= totalSpreads - 1 || flipping}>
              <MdNavigateNext />
            </button>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="br-bottom">
          <span className="page-info">{pageDisplay} / {numPages}</span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${totalSpreads > 1 ? (spreadIndex / (totalSpreads - 1)) * 100 : 100}%` }}
            />
          </div>
          <a href={pdfUrl} download={doc.filename} className="dl-btn">
            <FiDownload size={14} /> Tải PDF
          </a>
        </div>

        {/* ── Thumbnail sidebar ── */}
        {showThumb && pdfDoc && (
          <ThumbnailBar
            pdfDoc={pdfDoc}
            numPages={numPages}
            currentSpread={[leftPageNum, rightPageNum].filter(Boolean)}
            onJump={jumpToPage}
            onClose={() => setShowThumb(false)}
          />
        )}
      </div>
    </>
  );
}

/* ─── BookSpread: the actual two pages + animated flipping leaf ─── */
function BookSpread({ pdfDoc, numPages, spreadIndex, totalSpreads, getSpreadPages, flipping, flipDir, zoom, pdfScale, doc, onNext, onPrev }) {
  // Page dimensions from first rendered page
  const [pageDims, setPageDims] = useState({ w: 420, h: 594 });
  const handleLoaded = useCallback((_, w, h) => {
    setPageDims(d => {
      if (Math.abs(d.w - w) > 2) return { w, h };
      return d;
    });
  }, []);

  const { left: leftPage, right: rightPage } = getSpreadPages(spreadIndex);
  // Pre-render next spread for the flip face
  const nextSpread = flipping && flipDir === 'next' && spreadIndex + 1 < totalSpreads
    ? getSpreadPages(spreadIndex + 1) : null;
  const prevSpread = flipping && flipDir === 'prev' && spreadIndex - 1 >= 0
    ? getSpreadPages(spreadIndex - 1) : null;

  const W = pageDims.w;
  const H = pageDims.h;

  const cssVars = {
    '--page-w': `${W}px`,
    '--page-h': `${H}px`,
  };

  return (
    <div className="book-wrap" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}>
      <div className="book" style={cssVars}>
        {/* LEFT page */}
        <div
          className={`page-panel left ${spreadIndex > 0 && !flipping ? 'clickable-left' : ''}`}
          onClick={() => !flipping && onPrev && onPrev()}
          style={{ cursor: spreadIndex > 0 && !flipping ? 'pointer' : 'default' }}
        >
          {leftPage === 0 ? (
            <div className="page-cover">
              <MdMenuBook size={52} />
              <h2>{doc.title}</h2>
              <span>Lớp {doc.grade}</span>
            </div>
          ) : (
            <>
              <PdfPage pdfDoc={pdfDoc} pageNum={leftPage} scale={pdfScale} onLoaded={handleLoaded} />
              {spreadIndex > 0 && !flipping && (
                <span className="page-click-hint"><MdNavigateBefore /></span>
              )}
              <span className="page-num-badge">{leftPage}</span>
            </>
          )}
        </div>

        {/* RIGHT page */}
        <div
          className={`page-panel right ${spreadIndex < totalSpreads - 1 && !flipping ? 'clickable-right' : ''}`}
          onClick={() => !flipping && onNext && onNext()}
          style={{ cursor: spreadIndex < totalSpreads - 1 && !flipping ? 'pointer' : 'default' }}
        >
          {rightPage === 0 ? (
            <div className="page-cover" style={{ background: 'linear-gradient(145deg,#2a4080,#1a2e6b)' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Hết sách</span>
            </div>
          ) : (
            <>
              <PdfPage pdfDoc={pdfDoc} pageNum={rightPage} scale={pdfScale} onLoaded={handleLoaded} />
              {spreadIndex < totalSpreads - 1 && !flipping && (
                <span className="page-click-hint"><MdNavigateNext /></span>
              )}
              <span className="page-num-badge">{rightPage}</span>
            </>
          )}
        </div>

        {/* ── Animated flipping leaf ── */}
        {flipping && (
          <div
            className={`leaf-container ${flipDir === 'prev' ? 'flip-left' : ''}`}
            style={{ '--page-w': `${W}px`, '--page-h': `${H}px` }}
          >
            <div className={`leaf ${flipDir === 'next' ? 'flipping-next' : 'flipping-prev'}`}>
              {/* Front = current outgoing page */}
              <div className="leaf-face">
                {flipDir === 'next'
                  ? (rightPage > 0 ? <PdfPage pdfDoc={pdfDoc} pageNum={rightPage} scale={pdfScale} /> : <BlankPage />)
                  : (leftPage > 0 ? <PdfPage pdfDoc={pdfDoc} pageNum={leftPage} scale={pdfScale} /> : <BlankPage />)
                }
              </div>
              {/* Back = incoming page */}
              <div className="leaf-face leaf-back">
                {flipDir === 'next' && nextSpread
                  ? (nextSpread.left > 0 ? <PdfPage pdfDoc={pdfDoc} pageNum={nextSpread.left} scale={pdfScale} /> : <BlankPage />)
                  : flipDir === 'prev' && prevSpread
                    ? (prevSpread.right > 0 ? <PdfPage pdfDoc={pdfDoc} pageNum={prevSpread.right} scale={pdfScale} /> : <BlankPage />)
                    : <BlankPage />
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlankPage() {
  return <div style={{ width: '100%', height: '100%', background: '#f5f0e8' }} />;
}