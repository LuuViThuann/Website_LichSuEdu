const express = require('express');
const router = express.Router();
const QuizCategory = require('../models/QuizCategory');

// @GET /api/quiz-categories - Lấy danh mục đang hoạt động (public)
router.get('/', async (req, res) => {
  try {
    const categories = await QuizCategory.findAll(true); // chỉ lấy đang bật
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
