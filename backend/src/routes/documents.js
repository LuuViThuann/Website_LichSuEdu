const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');
const { uploadBuffer, deleteResource } = require('../config/cloudinary');

// Thư mục lưu PDF trên server
const PDF_UPLOAD_DIR = path.join(__dirname, '../../uploads/pdfs');
if (!fs.existsSync(PDF_UPLOAD_DIR)) fs.mkdirSync(PDF_UPLOAD_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// @GET /api/documents
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { grade, type } = req.query;
    const documents = await Document.findAll({ grade, type });
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @GET /api/documents/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });
    await Document.incrementViews(req.params.id);
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @POST /api/documents/upload
// PDF → lưu vào disk server (uploads/pdfs/)
// Thumbnail ảnh bìa → lên Cloudinary
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('[Upload] req.files keys:', req.files ? Object.keys(req.files) : 'NONE');
    console.log('[Upload] req.body:', req.body);
    console.log('[Upload] user:', req.user?.id, req.user?.role);

    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ success: false, message: 'Vui lòng upload file PDF' });
    }

    const pdfFile = req.files.pdf;
    const thumbFile = req.files.thumbnail || null;
    console.log('[Upload] PDF:', pdfFile.name, pdfFile.size, pdfFile.mimetype);

    // 1. Lưu file PDF vào disk server (uploads/pdfs/)
    const safeFilename = `${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const savePath = path.join(PDF_UPLOAD_DIR, safeFilename);
    try {
      console.log('[Upload] Lưu PDF vào disk:', savePath);
      fs.writeFileSync(savePath, pdfFile.data);
      console.log('[Upload] Lưu PDF thành công');
    } catch (fsErr) {
      console.error('[Upload] Lỗi ghi file PDF:', fsErr);
      return res.status(500).json({ success: false, message: `Lưu file PDF thất bại: ${fsErr.message}` });
    }

    const localFilepath = `/uploads/pdfs/${safeFilename}`;

    // 2. Upload ảnh thumbnail lên Cloudinary (nếu có)
    let thumbUrl = '';
    let thumbPublicId = '';
    if (thumbFile) {
      try {
        const thumbResult = await uploadBuffer(thumbFile.data, {
          folder: 'historyed/thumbs',
          resource_type: 'image',
          transformation: [{ width: 400, height: 560, crop: 'fill', quality: 'auto' }],
        });
        thumbUrl = thumbResult.secure_url;
        thumbPublicId = thumbResult.public_id;
        console.log('[Upload] Thumbnail Cloudinary OK:', thumbUrl);
      } catch (thumbErr) {
        console.warn('[Upload] Thumbnail thất bại (không bắt buộc):', thumbErr.message);
      }
    }

    const { title, description, grade, type } = req.body;
    console.log('[Upload] Lưu vào DB: title=%s grade=%s type=%s', title, grade, type);

    const doc = await Document.create({
      title,
      description,
      grade,
      type: type || 'textbook',
      filename: safeFilename,
      filepath: localFilepath,
      filesize: pdfFile.size,
      thumbnail: thumbUrl,
      cloudinaryPdfId: '',          // PDF không lưu trên Cloudinary
      cloudinaryThumbId: thumbPublicId,
      createdBy: req.user.id,
    });

    console.log('[Upload] Thành công! doc.id=', doc?.id);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('[Upload] Lỗi không mong muốn:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @PUT /api/documents/:id — Cập nhật thông tin + ảnh thumbnail (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });

    const { title, description, grade, type } = req.body;
    let thumbUrl = doc.thumbnail || '';
    let thumbPublicId = doc.cloudinaryThumbId || '';

    // Nếu có ảnh mới được upload → lên Cloudinary
    if (req.files && req.files.thumbnail) {
      const thumbFile = req.files.thumbnail;
      try {
        // Xóa ảnh cũ trên Cloudinary nếu có
        if (thumbPublicId) {
          await deleteResource(thumbPublicId, 'image');
        }
        const thumbResult = await uploadBuffer(thumbFile.data, {
          folder: 'historyed/thumbs',
          resource_type: 'image',
          transformation: [{ width: 400, height: 560, crop: 'fill', quality: 'auto' }],
        });
        thumbUrl = thumbResult.secure_url;
        thumbPublicId = thumbResult.public_id;
      } catch (thumbErr) {
        console.warn('Upload thumbnail thất bại:', thumbErr.message);
      }
    }

    // Nếu user muốn xóa ảnh (body có removeThumb=true)
    if (req.body.removeThumb === 'true' && thumbPublicId) {
      await deleteResource(thumbPublicId, 'image');
      thumbUrl = '';
      thumbPublicId = '';
    }

    const updated = await Document.updateById(req.params.id, {
      title: title || doc.title,
      description: description !== undefined ? description : doc.description,
      grade: grade || doc.grade,
      type: type || doc.type,
      thumbnail: thumbUrl,
      cloudinaryThumbId: thumbPublicId,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @DELETE /api/documents/:id — Xóa tài liệu (admin)
// PDF xóa khỏi disk, thumbnail xóa khỏi Cloudinary
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' });

    // Xóa file PDF khỏi disk server
    if (doc.filename) {
      const filePath = path.join(PDF_UPLOAD_DIR, doc.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); console.log('[Delete] Đã xóa PDF:', filePath); }
        catch (e) { console.warn('[Delete] Không xóa được file PDF:', e.message); }
      }
    }

    // Xóa thumbnail trên Cloudinary (nếu có)
    if (doc.cloudinaryThumbId) {
      await deleteResource(doc.cloudinaryThumbId, 'image');
    }

    await Document.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa tài liệu' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;