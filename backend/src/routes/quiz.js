const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const { protect, authorize } = require('../middleware/auth');
const { uploadBuffer, deleteResource } = require('../config/cloudinary');

// @GET /api/quizzes - Get all quizzes
router.get('/', async (req, res) => {
  try {
    const { grade, difficulty, categoryId, page = 1, limit = 12 } = req.query;
    const { data: quizzes, total } = await Quiz.findAll({ grade, difficulty, categoryId, page, limit });
    res.json({
      success: true,
      data: quizzes,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/quizzes/progress/my - Get user progress (đặt TRƯỚC /:id để không bị nhầm)
router.get('/progress/my', protect, async (req, res) => {
  try {
    const progress = await Progress.findByUser(req.user.id, 20);
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/quizzes/:id - Get single quiz
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ câu hỏi' });

    await Quiz.incrementAttempts(req.params.id);
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/quizzes - Create quiz (admin) - nhận multipart/form-data để hỗ trợ upload ảnh
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const body = req.body;

    // Parse questions nếu gửi dưới dạng JSON string
    let questions = [];
    if (body.questions) {
      try {
        questions = typeof body.questions === 'string'
          ? JSON.parse(body.questions)
          : body.questions;
      } catch { questions = []; }
    }

    // Upload thumbnail lên Cloudinary nếu có file
    let thumbnailUrl = body.thumbnail || '';
    let thumbnailPublicId = '';
    if (req.files && req.files.thumbnail) {
      try {
        const result = await uploadBuffer(req.files.thumbnail.data, {
          folder: 'historyed/quiz-thumbs',
          resource_type: 'image',
          transformation: [{ width: 600, height: 400, crop: 'fill', quality: 'auto' }],
        });
        thumbnailUrl = result.secure_url;
        thumbnailPublicId = result.public_id;
      } catch (thumbErr) {
        console.warn('[Quiz Create] Upload thumbnail thất bại:', thumbErr.message);
      }
    }

    const quiz = await Quiz.create({
      ...body,
      questions,
      thumbnail: thumbnailUrl,
      thumbnailPublicId,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error('[Quiz Create] Lỗi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/quizzes/:id - Update quiz (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const existing = await Quiz.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ câu hỏi' });

    const body = req.body;
    let thumbnailUrl = body.thumbnail !== undefined ? body.thumbnail : existing.thumbnail || '';
    let thumbnailPublicId = existing.thumbnailPublicId || '';

    // Upload ảnh mới nếu có
    if (req.files && req.files.thumbnail) {
      try {
        // Xóa ảnh cũ trên Cloudinary nếu có
        if (thumbnailPublicId) {
          await deleteResource(thumbnailPublicId, 'image');
        }
        const result = await uploadBuffer(req.files.thumbnail.data, {
          folder: 'historyed/quiz-thumbs',
          resource_type: 'image',
          transformation: [{ width: 600, height: 400, crop: 'fill', quality: 'auto' }],
        });
        thumbnailUrl = result.secure_url;
        thumbnailPublicId = result.public_id;
      } catch (thumbErr) {
        console.warn('[Quiz Update] Upload thumbnail thất bại:', thumbErr.message);
      }
    }

    // Xóa ảnh nếu user yêu cầu
    if (body.removeThumbnail === 'true' && thumbnailPublicId) {
      await deleteResource(thumbnailPublicId, 'image');
      thumbnailUrl = '';
      thumbnailPublicId = '';
    }

    // Parse questions nếu gửi dưới dạng JSON string
    let questions = existing.questions;
    if (body.questions) {
      try {
        questions = typeof body.questions === 'string'
          ? JSON.parse(body.questions)
          : body.questions;
      } catch { questions = existing.questions; }
    }

    const quiz = await Quiz.updateById(req.params.id, {
      ...body,
      questions,
      thumbnail: thumbnailUrl,
      thumbnailPublicId,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
    });

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('[Quiz Update] Lỗi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/quizzes/:id - Delete quiz (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Xóa thumbnail Cloudinary khi xóa quiz
    const quiz = await Quiz.findById(req.params.id);
    if (quiz && quiz.thumbnailPublicId) {
      await deleteResource(quiz.thumbnailPublicId, 'image');
    }
    await Quiz.deleteById(req.params.id);
    res.json({ success: true, message: 'Đã xóa bộ câu hỏi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/quizzes/:id/submit - Submit quiz answers
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ câu hỏi' });

    const { answers, timeTaken } = req.body;
    let correctAnswers = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.answer;
      if (isCorrect) correctAnswers++;
      detailedAnswers.push({ questionId: question.id, selectedAnswer: userAnswer, isCorrect });
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    const progress = await Progress.create({
      userId: req.user.id,
      quizId: quiz.id,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      answers: detailedAnswers,
      timeTaken
    });

    res.json({
      success: true,
      data: {
        score,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        answers: detailedAnswers,
        progressId: progress.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;