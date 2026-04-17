const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Document = require('../models/Document');
const Progress = require('../models/Progress');
const Grade = require('../models/Grade');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// ============================================================
// STATS
// ============================================================
// @GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalQuizzes, totalDocuments, totalAttempts] = await Promise.all([
      User.countStudents(),
      Quiz.count(),
      Document.count(),
      Progress.count()
    ]);

    const recentUsers = await User.findRecentStudents(5);
    const recentProgress = await Progress.findRecent(5);

    res.json({
      success: true,
      data: { totalUsers, totalQuizzes, totalDocuments, totalAttempts, recentUsers, recentProgress }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// USERS
// ============================================================
// @GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GRADES — Admin quản lý lớp (4 → 12)
// ============================================================
// @GET /api/admin/grades — Lấy tất cả lớp (kể cả ẩn)
router.get('/grades', async (req, res) => {
  try {
    const grades = await Grade.findAll(false);
    res.json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/grades — Thêm lớp mới
router.post('/grades', async (req, res) => {
  try {
    const { name, gradeNumber, description } = req.body;
    if (!name || !gradeNumber) {
      return res.status(400).json({ success: false, message: 'Tên lớp và số lớp là bắt buộc' });
    }
    const grade = await Grade.create({ name, gradeNumber: Number(gradeNumber), description });
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/grades/:id — Cập nhật lớp
router.put('/grades/:id', async (req, res) => {
  try {
    const { name, gradeNumber, description, isActive } = req.body;
    const grade = await Grade.updateById(req.params.id, {
      name, gradeNumber: Number(gradeNumber), description, isActive
    });
    res.json({ success: true, data: grade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/grades/:id — Xóa lớp
router.delete('/grades/:id', async (req, res) => {
  try {
    await Grade.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa lớp' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;