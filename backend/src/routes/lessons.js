// ============================================================
// Route: lessons.js (Public API)
// Cung cấp dữ liệu bài học cho người dùng (không cần đăng nhập)
// ============================================================
const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');

// @GET /api/lessons/categories — Lấy danh mục bài học
router.get('/categories', async (req, res) => {
  try {
    const categories = await Lesson.findAllCategories({ activeOnly: true });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/lessons/sections — Lấy danh sách phần bài học
router.get('/sections', async (req, res) => {
  try {
    const { categoryId, grade } = req.query;
    const sections = await Lesson.findAllSections({
      categoryId: categoryId ? Number(categoryId) : null,
      grade: grade || null,
      activeOnly: true
    });
    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/lessons/sections/:id — Lấy 1 section + cây Topic→Lesson
router.get('/sections/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    const section = await Lesson.findSectionWithTree(id);
    if (!section || !section.isPublished)
      return res.status(404).json({ success: false, message: 'Không tìm thấy phần bài học' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/lessons/topics — Lấy danh sách chủ đề
router.get('/topics', async (req, res) => {
  try {
    const { grade, sectionId } = req.query;
    const topics = await Lesson.findAllTopics({
      grade: grade || null,
      sectionId: sectionId ? Number(sectionId) : null,
      activeOnly: true
    });
    res.json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/lessons — Lấy cây đầy đủ Chủ đề → Bài học
router.get('/', async (req, res) => {
  try {
    const { grade, sectionId } = req.query;
    const tree = await Lesson.findTree({
      grade: grade || null,
      sectionId: sectionId ? Number(sectionId) : null
    });
    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/lessons/:id — Lấy chi tiết 1 bài học
router.get('/:id', async (req, res) => {
  try {
    const lessonId = Number(req.params.id);
    if (isNaN(lessonId)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });

    Lesson.incrementViews(lesson.id).catch(() => {});

    const topicId = Number(lesson.topicId);
    let nav = { prev: null, next: null };
    if (!isNaN(topicId) && topicId > 0) {
      nav = await Lesson.findNavigation(lesson.id, topicId).catch(() => ({ prev: null, next: null }));
    }

    res.json({ success: true, data: { ...lesson, navigation: nav } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
