const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  // Tìm user theo email (có password)
  async findByEmail(email, includePassword = false) {
    const pool = getPool();
    const cols = includePassword
      ? 'id, name, email, password, role, avatar, grade, createdAt'
      : 'id, name, email, role, avatar, grade, createdAt';
    const result = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query(`SELECT ${cols} FROM Users WHERE email = @email`);
    return result.recordset[0] || null;
  },

  // Tìm user theo id
  async findById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, name, email, role, avatar, grade, createdAt FROM Users WHERE id = @id');
    return result.recordset[0] || null;
  },

  // Tạo user mới
  async create({ name, email, password, grade = '', role = 'student', avatar = '' }) {
    const pool = getPool();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.request()
      .input('name', sql.NVarChar(50), name)
      .input('email', sql.NVarChar(200), email.toLowerCase())
      .input('password', sql.NVarChar(200), hashedPassword)
      .input('grade', sql.NVarChar(5), grade || '')
      .input('role', sql.NVarChar(10), role)
      .input('avatar', sql.NVarChar(500), avatar || '')
      .query(`
        INSERT INTO Users (name, email, password, grade, role, avatar, createdAt)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.avatar, INSERTED.grade, INSERTED.createdAt
        VALUES (@name, @email, @password, @grade, @role, @avatar, GETDATE())
      `);
    return result.recordset[0];
  },

  // Lấy tất cả users
  async findAll() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT id, name, email, role, avatar, grade, createdAt FROM Users ORDER BY createdAt DESC');
    return result.recordset;
  },

  // Đếm số học sinh
  async countStudents() {
    const pool = getPool();
    const result = await pool.request()
      .query("SELECT COUNT(*) AS total FROM Users WHERE role = 'student'");
    return result.recordset[0].total;
  },

  // Lấy học sinh mới nhất
  async findRecentStudents(limit = 5) {
    const pool = getPool();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) id, name, email, grade, createdAt
        FROM Users WHERE role = 'student'
        ORDER BY createdAt DESC
      `);
    return result.recordset;
  },

  // Xóa user
  async deleteById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE id = @id');
    return true;
  },

  // So sánh password
  async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
};

module.exports = User;