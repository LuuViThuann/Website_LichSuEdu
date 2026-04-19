const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Document = require('../models/Document');
const Progress = require('../models/Progress');
const Grade = require('../models/Grade');
const QuizCategory = require('../models/QuizCategory');
const Lesson = require('../models/Lesson');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// ============================================================
// STATS
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalQuizzes, totalDocuments, totalAttempts, totalLessons] = await Promise.all([
      User.countStudents(),
      Quiz.count(),
      Document.count(),
      Progress.count(),
      Lesson.count()
    ]);

    const recentUsers = await User.findRecentStudents(5);
    const recentProgress = await Progress.findRecent(5);

    res.json({
      success: true,
      data: { totalUsers, totalQuizzes, totalDocuments, totalAttempts, totalLessons, recentUsers, recentProgress }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// USERS
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GRADES
// ============================================================
router.get('/grades', async (req, res) => {
  try {
    const grades = await Grade.findAll(false);
    res.json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.delete('/grades/:id', async (req, res) => {
  try {
    await Grade.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa lớp' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// QUIZ CATEGORIES
// ============================================================
router.get('/quiz-categories', async (req, res) => {
  try {
    const categories = await QuizCategory.findAll(false);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/quiz-categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    const category = await QuizCategory.create({ name: name.trim(), description });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/quiz-categories/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    const category = await QuizCategory.updateById(req.params.id, {
      name: name.trim(), description, isActive
    });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/quiz-categories/:id', async (req, res) => {
  try {
    await QuizCategory.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// LESSON CATEGORIES — Admin quản lý danh mục bài học
// ============================================================

// @GET /api/admin/lesson-categories
router.get('/lesson-categories', async (req, res) => {
  try {
    const categories = await Lesson.findAllCategories({ activeOnly: false });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/lesson-categories
router.post('/lesson-categories', async (req, res) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    const category = await Lesson.createCategory({
      name: name.trim(), description, icon, displayOrder: Number(displayOrder) || 0, isActive
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/lesson-categories/:id
router.put('/lesson-categories/:id', async (req, res) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    const category = await Lesson.updateCategoryById(req.params.id, {
      name: name.trim(), description, icon, displayOrder: Number(displayOrder) || 0, isActive
    });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/lesson-categories/:id
router.delete('/lesson-categories/:id', async (req, res) => {
  try {
    await Lesson.deleteCategoryById(req.params.id);
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// LESSON SECTIONS — Admin quản lý phần bài học
// ============================================================

// @GET /api/admin/lesson-sections
router.get('/lesson-sections', async (req, res) => {
  try {
    const { categoryId, grade } = req.query;
    const sections = await Lesson.findAllSections({
      categoryId: categoryId ? Number(categoryId) : null,
      grade: grade || null,
      activeOnly: false
    });
    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/admin/lesson-sections/:id — Lấy 1 section + cây
router.get('/lesson-sections/:id', async (req, res) => {
  try {
    const section = await Lesson.findSectionWithTree(Number(req.params.id));
    if (!section) return res.status(404).json({ success: false, message: 'Không tìm thấy phần bài học' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/lesson-sections
router.post('/lesson-sections', async (req, res) => {
  try {
    const { categoryId, name, description, grade, coverImage, displayOrder, isPublished } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên phần bài học là bắt buộc' });
    }
    const section = await Lesson.createSection({
      categoryId: categoryId ? Number(categoryId) : null,
      name: name.trim(), description, grade, coverImage,
      displayOrder: Number(displayOrder) || 0, isPublished
    });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/lesson-sections/:id
router.put('/lesson-sections/:id', async (req, res) => {
  try {
    const { categoryId, name, description, grade, coverImage, displayOrder, isPublished } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên phần bài học là bắt buộc' });
    }
    const section = await Lesson.updateSectionById(req.params.id, {
      categoryId: categoryId ? Number(categoryId) : null,
      name: name.trim(), description, grade, coverImage,
      displayOrder: Number(displayOrder) || 0, isPublished
    });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/lesson-sections/:id
router.delete('/lesson-sections/:id', async (req, res) => {
  try {
    await Lesson.deleteSectionById(req.params.id);
    res.json({ success: true, message: 'Đã xóa phần bài học (các chủ đề không bị xóa)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/lesson-sections/:id/import — Import JSON vào 1 section cụ thể
router.post('/lesson-sections/:id/import', async (req, res) => {
  try {
    const sectionId = Number(req.params.id);
    const { grade, topics, book } = req.body;
    if (!grade || !topics || !Array.isArray(topics)) {
      return res.status(400).json({ success: false, message: 'Cần truyền grade và mảng topics' });
    }
    // Kiểm tra section tồn tại
    const section = await Lesson.findSectionById(sectionId);
    if (!section) return res.status(404).json({ success: false, message: 'Không tìm thấy phần bài học' });

    const results = await Lesson.importFromJson({
      grade, topics, sectionId,
      // Dùng `book` từ request, nếu không có thì để trống (hiển thị theo grade)
      book: book || `Lớp ${grade}`

    });
    res.status(201).json({
      success: true,
      message: `Đã import ${results.topics.length} chủ đề và ${results.lessons.length} bài học vào "${section.name}"`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// LESSON TOPICS — Admin quản lý chủ đề/chương bài học
// ============================================================

// @GET /api/admin/lesson-topics
router.get('/lesson-topics', async (req, res) => {
  try {
    const { grade, sectionId } = req.query;
    const topics = await Lesson.findAllTopics({
      grade: grade || null,
      sectionId: sectionId ? Number(sectionId) : undefined,
      activeOnly: false
    });
    res.json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/lesson-topics
router.post('/lesson-topics', async (req, res) => {
  try {
    const { grade, book, title, topicOrder, description, isPublished, sectionId } = req.body;
    if (!grade || !title) {
      return res.status(400).json({ success: false, message: 'Lớp và tiêu đề chủ đề là bắt buộc' });
    }
    const topic = await Lesson.createTopic({
      grade, book, title,
      topicOrder: Number(topicOrder) || 0,
      description, isPublished,
      sectionId: sectionId ? Number(sectionId) : null
    });
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/lesson-topics/:id
router.put('/lesson-topics/:id', async (req, res) => {
  try {
    const { grade, book, title, topicOrder, description, isPublished, sectionId } = req.body;
    const topic = await Lesson.updateTopicById(req.params.id, {
      grade, book, title,
      topicOrder: Number(topicOrder) || 0,
      description, isPublished,
      sectionId: sectionId ? Number(sectionId) : null
    });
    res.json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/lesson-topics/:id
router.delete('/lesson-topics/:id', async (req, res) => {
  try {
    await Lesson.deleteTopicById(req.params.id);
    res.json({ success: true, message: 'Đã xóa chủ đề và các bài học liên quan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// LESSONS — Admin quản lý bài học
// ============================================================

// @GET /api/admin/lessons
router.get('/lessons', async (req, res) => {
  try {
    const { topicId, grade, sectionId } = req.query;
    const lessons = await Lesson.findAll({
      topicId: topicId ? Number(topicId) : null,
      grade: grade || null,
      sectionId: sectionId ? Number(sectionId) : null,
      activeOnly: false
    });
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/admin/lessons/:id
router.get('/lessons/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(Number(req.params.id));
    if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
    res.json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/lessons
router.post('/lessons', async (req, res) => {
  try {
    const { topicId, title, lessonOrder, summary, specialContent, timeline, sourceUrl, isPublished } = req.body;
    if (!topicId || !title) {
      return res.status(400).json({ success: false, message: 'Chủ đề và tiêu đề bài học là bắt buộc' });
    }
    const lesson = await Lesson.create({
      topicId: Number(topicId), title,
      lessonOrder: Number(lessonOrder) || 0,
      summary, specialContent,
      timeline: JSON.stringify(timeline || []),
      sourceUrl, isPublished
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/lessons/:id
router.put('/lessons/:id', async (req, res) => {
  try {
    const { topicId, title, lessonOrder, summary, specialContent, timeline, sourceUrl, isPublished } = req.body;
    const lesson = await Lesson.updateById(req.params.id, {
      topicId: Number(topicId), title,
      lessonOrder: Number(lessonOrder) || 0,
      summary, specialContent,
      timeline: typeof timeline === 'string' ? timeline : JSON.stringify(timeline || []),
      sourceUrl, isPublished
    });
    res.json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/lessons/:id
router.delete('/lessons/:id', async (req, res) => {
  try {
    await Lesson.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa bài học' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/lessons/import — Import hàng loạt (không gắn section)
router.post('/lessons/import', async (req, res) => {
  try {
    const { grade, topics, book } = req.body;
    if (!grade || !topics || !Array.isArray(topics)) {
      return res.status(400).json({ success: false, message: 'Cần truyền grade và mảng topics' });
    }
    const results = await Lesson.importFromJson({ grade, topics, book, sectionId: null });
    res.status(201).json({
      success: true,
      message: `Đã import ${results.topics.length} chủ đề và ${results.lessons.length} bài học`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;