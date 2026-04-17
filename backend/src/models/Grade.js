const { getPool, sql } = require('../config/database');

const Grade = {
  // Lấy tất cả lớp (đang hoạt động)
  async findAll(activeOnly = false) {
    const pool = getPool();
    const where = activeOnly ? "WHERE isActive = 1" : "";
    const result = await pool.request()
      .query(`SELECT * FROM Grades ${where} ORDER BY gradeNumber ASC`);
    return result.recordset;
  },

  // Tìm lớp theo id
  async findById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Grades WHERE id = @id');
    return result.recordset[0] || null;
  },

  // Tìm lớp theo tên (VD: "4", "5", ...)
  async findByName(name) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar(10), name)
      .query('SELECT * FROM Grades WHERE name = @name');
    return result.recordset[0] || null;
  },

  // Tạo lớp mới
  async create({ name, gradeNumber, description = '' }) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar(10), name)
      .input('gradeNumber', sql.Int, gradeNumber)
      .input('description', sql.NVarChar(200), description)
      .query(`
        INSERT INTO Grades (name, gradeNumber, description, isActive, createdAt)
        OUTPUT INSERTED.*
        VALUES (@name, @gradeNumber, @description, 1, GETDATE())
      `);
    return result.recordset[0];
  },

  // Cập nhật lớp
  async updateById(id, { name, gradeNumber, description, isActive }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(10), name)
      .input('gradeNumber', sql.Int, gradeNumber)
      .input('description', sql.NVarChar(200), description || '')
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query(`
        UPDATE Grades
        SET name=@name, gradeNumber=@gradeNumber, description=@description, isActive=@isActive
        WHERE id=@id;
        SELECT * FROM Grades WHERE id=@id;
      `);
    return result.recordset[0];
  },

  // Xóa lớp
  async deleteById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Grades WHERE id = @id');
    return true;
  }
};

module.exports = Grade;
