import { useState, useEffect, useRef } from 'react';
import { getDocuments, uploadDocument, updateDocument, deleteDocument, getGrades } from '../../services/api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiFileText, FiX, FiCheck, FiEdit2, FiImage } from 'react-icons/fi';

const EMPTY_FORM = { title: '', description: '', grade: '', type: 'textbook' };

/* ── helpers ── */
const fmtSize = (bytes) => bytes > 0 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '—';

export default function ManageDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);

  /* Upload modal */
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [dragOverPdf, setDragOverPdf] = useState(false);
  const [dragOverThumb, setDragOverThumb] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pdfInputRef = useRef();
  const thumbInputRef = useRef();

  /* Edit modal */
  const [editDoc, setEditDoc] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editThumbFile, setEditThumbFile] = useState(null);
  const [editThumbPreview, setEditThumbPreview] = useState('');
  const [editRemoveThumb, setEditRemoveThumb] = useState(false);
  const [saving, setSaving] = useState(false);
  const editThumbRef = useRef();

  /* Load data */
  const load = () => {
    setLoading(true);
    getDocuments()
      .then(res => setDocs(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    getGrades()
      .then(res => {
        const gs = res.data.data || [];
        setGrades(gs);
        if (gs.length > 0) setForm(f => ({ ...f, grade: gs[0].name }));
      })
      .catch(() => setGrades([{ id: 7, name: '10' }, { id: 8, name: '11' }, { id: 9, name: '12' }]));
  }, []);

  /* ─── Thumbnail preview helper ─── */
  const handleThumbChange = (file, setter, previewSetter) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Chỉ chấp nhận file ảnh'); return; }
    setter(file);
    const reader = new FileReader();
    reader.onload = e => previewSetter(e.target.result);
    reader.readAsDataURL(file);
  };

  /* ─── UPLOAD ─── */
  const handleUpload = async () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (!pdfFile) { toast.error('Vui lòng chọn file PDF'); return; }
    if (pdfFile.type !== 'application/pdf') { toast.error('Chỉ chấp nhận file PDF'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', pdfFile);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('grade', form.grade);
      fd.append('type', form.type);
      await uploadDocument(fd);
      toast.success('Upload tài liệu thành công!');
      closeUploadModal();
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      toast.error(`Upload thất bại: ${msg}`);
      console.error('[Upload Error]', err?.response?.data || err);
    }
    finally { setUploading(false); }
  };

  const closeUploadModal = () => {
    setShowUpload(false);
    setForm(EMPTY_FORM);
    setPdfFile(null);
    setThumbFile(null);
    setThumbPreview('');
  };

  /* ─── DELETE ─── */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa tài liệu "${title}"?`)) return;
    try { await deleteDocument(id); toast.success('Đã xóa tài liệu'); load(); }
    catch { toast.error('Xóa thất bại'); }
  };

  /* ─── EDIT — open ─── */
  const openEdit = (doc) => {
    setEditDoc(doc);
    setEditForm({ title: doc.title, description: doc.description || '', grade: doc.grade, type: doc.type });
    setEditThumbFile(null);
    setEditThumbPreview(doc.thumbnail || '');
    setEditRemoveThumb(false);
  };

  /* ─── EDIT — save ─── */
  const handleSave = async () => {
    if (!editForm.title.trim()) { toast.error('Tiêu đề không được trống'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', editForm.title);
      fd.append('description', editForm.description);
      fd.append('grade', editForm.grade);
      fd.append('type', editForm.type);
      if (editThumbFile) fd.append('thumbnail', editThumbFile);
      if (editRemoveThumb) fd.append('removeThumb', 'true');
      await updateDocument(editDoc.id, fd);
      toast.success('Đã cập nhật tài liệu!');
      setEditDoc(null);
      load();
    } catch { toast.error('Cập nhật thất bại'); }
    finally { setSaving(false); }
  };

  const TYPE_LABELS = { textbook: 'Sách giáo khoa', reference: 'Tham khảo', exam: 'Đề thi' };

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <AdminLayout title="Quản lý tài liệu PDF">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{docs.length} tài liệu</span>
        <button onClick={() => setShowUpload(true)} className="btn btn-primary">
          <FiUpload /> Upload tài liệu mới
        </button>
      </div>

      {/* Table */}
      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Tên tài liệu', 'Lớp', 'Loại', 'Kích thước', 'Lượt xem', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FiFileText size={32} style={{ display: 'block', margin: '0 auto 10px' }} />
                  Chưa có tài liệu nào. Upload PDF để bắt đầu.
                </td></tr>
              ) : docs.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  {/* Tên + thumbnail */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {d.thumbnail ? (
                        <img src={d.thumbnail} alt={d.title}
                          style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }} />
                      ) : (
                        <div style={{ width: 44, height: 60, borderRadius: 6, background: '#FFEBEE', color: '#C62828', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiFileText size={18} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.title}</div>
                        {d.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.description.slice(0, 50)}{d.description.length > 50 ? '...' : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-blue">Lớp {d.grade}</span></td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-orange">{TYPE_LABELS[d.type] || d.type}</span></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{fmtSize(d.filesize)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{d.views}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(d)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FiEdit2 /> Sửa
                      </button>
                      <button onClick={() => handleDelete(d.id, d.title)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FiTrash2 /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════ UPLOAD MODAL ══════════════ */}
      {showUpload && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontWeight: 700 }}>Upload tài liệu PDF</h2>
              <button onClick={closeUploadModal} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* PDF drop zone */}
              <div>
                <label className="form-label">File PDF *</label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverPdf(true); }}
                  onDragLeave={() => setDragOverPdf(false)}
                  onDrop={e => { e.preventDefault(); setDragOverPdf(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setPdfFile(f); else toast.error('Chỉ chấp nhận file PDF'); }}
                  onClick={() => pdfInputRef.current?.click()}
                  style={dropStyle(dragOverPdf, !!pdfFile)}>
                  {pdfFile ? (
                    <>
                      <FiCheck size={28} color="var(--success)" style={{ display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700, color: 'var(--success)' }}>{pdfFile.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{fmtSize(pdfFile.size)}</div>
                      <button onClick={e => { e.stopPropagation(); setPdfFile(null); }} style={{ background: 'none', color: 'var(--error)', fontSize: '0.82rem', marginTop: 8, cursor: 'pointer' }}>Xóa file</button>
                    </>
                  ) : (
                    <>
                      <FiUpload size={28} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 600 }}>Kéo thả PDF vào đây hoặc click để chọn</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>Tối đa 50MB</div>
                    </>
                  )}
                  <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPdfFile(e.target.files[0])} />
                </div>
              </div>

              {/* Thumbnail image zone */}
              <div>
                <label className="form-label">Ảnh bìa (tuỳ chọn)</label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverThumb(true); }}
                  onDragLeave={() => setDragOverThumb(false)}
                  onDrop={e => { e.preventDefault(); setDragOverThumb(false); handleThumbChange(e.dataTransfer.files[0], setThumbFile, setThumbPreview); }}
                  onClick={() => thumbInputRef.current?.click()}
                  style={{ ...dropStyle(dragOverThumb, !!thumbFile), padding: '16px', display: 'flex', alignItems: 'center', gap: 16, justifyContent: thumbPreview ? 'flex-start' : 'center' }}>
                  {thumbPreview ? (
                    <>
                      <img src={thumbPreview} alt="preview"
                        style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--success)' }}>{thumbFile?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{thumbFile ? fmtSize(thumbFile.size) : ''}</div>
                        <button onClick={e => { e.stopPropagation(); setThumbFile(null); setThumbPreview(''); }}
                          style={{ background: 'none', color: 'var(--error)', fontSize: '0.8rem', marginTop: 6, cursor: 'pointer' }}>Xóa ảnh</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <FiImage size={28} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Kéo thả hoặc click để chọn ảnh bìa</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, WEBP — tối đa 5MB</div>
                    </div>
                  )}
                  <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleThumbChange(e.target.files[0], setThumbFile, setThumbPreview)} />
                </div>
              </div>

              {/* Form fields */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tiêu đề *</label>
                <input type="text" className="form-input" placeholder="VD: Sách giáo khoa Lịch sử 11"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mô tả</label>
                <textarea className="form-input" rows={2} placeholder="Mô tả ngắn..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Khối lớp *</label>
                  <select className="form-select" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                    {grades.map(g => <option key={g.id} value={g.name}>Lớp {g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Loại tài liệu</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="textbook">Sách giáo khoa</option>
                    <option value="reference">Tài liệu tham khảo</option>
                    <option value="exam">Đề thi</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button onClick={closeUploadModal} className="btn btn-outline">Hủy</button>
              <button onClick={handleUpload} disabled={uploading} className="btn btn-primary">
                {uploading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Đang upload...</> : <><FiUpload /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ EDIT MODAL ══════════════ */}
      {editDoc && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontWeight: 700 }}>Chỉnh sửa tài liệu</h2>
              <button onClick={() => setEditDoc(null)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Thumbnail editor */}
              <div>
                <label className="form-label">Ảnh bìa</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Preview */}
                  {editThumbPreview && !editRemoveThumb ? (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={editThumbPreview} alt="thumb"
                        style={{ width: 80, height: 108, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      <button onClick={() => { setEditRemoveThumb(true); setEditThumbPreview(''); setEditThumbFile(null); }}
                        style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--error)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', fontSize: 12 }}>
                        <FiX size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 80, height: 108, borderRadius: 8, background: 'var(--bg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiImage size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  {/* Actions */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => editThumbRef.current?.click()} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                      <FiImage /> {editThumbPreview && !editRemoveThumb ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}
                    </button>
                    {editThumbFile && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Ảnh mới: <strong>{editThumbFile.name}</strong> ({fmtSize(editThumbFile.size)})
                      </div>
                    )}
                    <input ref={editThumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { setEditRemoveThumb(false); handleThumbChange(e.target.files[0], setEditThumbFile, setEditThumbPreview); }} />
                  </div>
                </div>
              </div>

              {/* Text fields */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tiêu đề *</label>
                <input type="text" className="form-input"
                  value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mô tả</label>
                <textarea className="form-input" rows={2}
                  value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Khối lớp *</label>
                  <select className="form-select" value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })}>
                    {grades.map(g => <option key={g.id} value={g.name}>Lớp {g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Loại tài liệu</label>
                  <select className="form-select" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                    <option value="textbook">Sách giáo khoa</option>
                    <option value="reference">Tài liệu tham khảo</option>
                    <option value="exam">Đề thi</option>
                  </select>
                </div>
              </div>

              {/* Info readonly */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                <div>📄 File PDF: <strong style={{ color: 'var(--text)' }}>{editDoc.filename || 'N/A'}</strong></div>
                <div style={{ marginTop: 4 }}>💾 Kích thước: <strong style={{ color: 'var(--text)' }}>{fmtSize(editDoc.filesize)}</strong> · 👁 Lượt xem: <strong style={{ color: 'var(--text)' }}>{editDoc.views}</strong></div>
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button onClick={() => setEditDoc(null)} className="btn btn-outline">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Đang lưu...</> : <><FiCheck /> Lưu thay đổi</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/* ── Shared styles ── */
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
};
const modalStyle = {
  background: 'white', borderRadius: 20, width: '100%', maxWidth: 580,
  boxShadow: 'var(--shadow-lg)', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto'
};
const modalHeaderStyle = {
  padding: '20px 26px', borderBottom: '1px solid var(--border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  position: 'sticky', top: 0, background: 'white', zIndex: 1
};
const modalFooterStyle = {
  padding: '16px 26px', borderTop: '1px solid var(--border)',
  display: 'flex', gap: 12, justifyContent: 'flex-end',
  position: 'sticky', bottom: 0, background: 'white'
};
const dropStyle = (dragOver, hasFile) => ({
  border: `2px dashed ${dragOver ? 'var(--primary)' : hasFile ? 'var(--success)' : 'var(--border)'}`,
  borderRadius: 12, padding: '28px', textAlign: 'center', cursor: 'pointer',
  background: dragOver ? 'var(--primary-50)' : hasFile ? '#E8F5E9' : 'var(--bg)',
  transition: 'all 0.2s'
});