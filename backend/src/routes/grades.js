const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');

// @GET /api/grades — Public: Lấy danh sách lớp đang hoạt động (dùng cho Register, filter...)
router.get('/', async (req, res) => {
  try {
    const grades = await Grade.findAll(true); // activeOnly = true
    res.json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
