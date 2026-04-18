const { getPool, sql } = require('../config/database');

const QuizCategory = {
  // Lấy tất cả danh mục (activeOnly: chỉ lấy đang bật)
  async findAll(activeOnly = true) {
    const pool = getPool();
    const where = activeOnly ? 'WHERE isActive = 1' : '';
    const result = await pool.request()
      .query(`SELECT * FROM QuizCategories ${where} ORDER BY id ASC`);
    return result.recordset;
  },

  // Tìm theo id
  async findById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM QuizCategories WHERE id = @id');
    return result.recordset[0] || null;
  },

  // Tạo danh mục mới
  async create({ name, description = '' }) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar(100), name)
      .input('description', sql.NVarChar(300), description)
      .query(`
        INSERT INTO QuizCategories (name, description, isActive, createdAt)
        OUTPUT INSERTED.*
        VALUES (@name, @description, 1, GETDATE())
      `);
    return result.recordset[0];
  },

  // Cập nhật danh mục
  async updateById(id, { name, description, isActive }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(100), name)
      .input('description', sql.NVarChar(300), description || '')
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query(`
        UPDATE QuizCategories
        SET name=@name, description=@description, isActive=@isActive
        WHERE id=@id;
        SELECT * FROM QuizCategories WHERE id=@id;
      `);
    return result.recordset[0];
  },

  // Xóa danh mục
  async deleteById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM QuizCategories WHERE id = @id');
    return true;
  },

  // Đếm số danh mục
  async count() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT COUNT(*) AS total FROM QuizCategories');
    return result.recordset[0].total;
  }
};

module.exports = QuizCategory;
