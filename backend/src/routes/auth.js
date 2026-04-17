const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, grade, role } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const user = await User.create({ name, email, password, grade, role: role || 'student' });
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Lấy user kèm password
    const user = await User.findByEmail(email, true);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;