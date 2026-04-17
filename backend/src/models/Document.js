const { getPool, sql } = require('../config/database');

const Document = {
  // Lấy danh sách tài liệu (có filter)
  async findAll({ grade, type } = {}) {
    const pool = getPool();
    let query = "SELECT * FROM Documents WHERE isPublished = 1";
    const request = pool.request();

    if (grade) {
      query += " AND grade = @grade";
      request.input('grade', sql.NVarChar(5), grade);
    }
    if (type) {
      query += " AND type = @type";
      request.input('type', sql.NVarChar(20), type);
    }
    query += " ORDER BY createdAt DESC";

    const result = await request.query(query);
    return result.recordset;
  },

  // Tìm tài liệu theo id
  async findById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Documents WHERE id = @id');
    return result.recordset[0] || null;
  },

  // Tạo tài liệu mới
  async create({ title, description = '', grade, subject = 'Lịch sử', type = 'textbook',
    filename, filepath, thumbnail = '', filesize = 0, totalPages = 0, createdBy,
    cloudinaryPdfId = '', cloudinaryThumbId = '' }) {
    const pool = getPool();
    const result = await pool.request()
      .input('title', sql.NVarChar(500), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('grade', sql.NVarChar(5), grade)
      .input('subject', sql.NVarChar(100), subject)
      .input('type', sql.NVarChar(20), type)
      .input('filename', sql.NVarChar(500), filename)
      .input('filepath', sql.NVarChar(sql.MAX), filepath)
      .input('thumbnail', sql.NVarChar(sql.MAX), thumbnail)
      .input('filesize', sql.BigInt, filesize)
      .input('totalPages', sql.Int, totalPages)
      .input('createdBy', sql.Int, createdBy || null)
      .input('cloudinaryPdfId', sql.NVarChar(500), cloudinaryPdfId)
      .input('cloudinaryThumbId', sql.NVarChar(500), cloudinaryThumbId)
      .query(`
        INSERT INTO Documents
          (title, description, grade, subject, type, filename, filepath, thumbnail,
           filesize, totalPages, views, isPublished, createdBy, cloudinaryPdfId, cloudinaryThumbId, createdAt)
        OUTPUT INSERTED.*
        VALUES
          (@title, @description, @grade, @subject, @type, @filename, @filepath, @thumbnail,
           @filesize, @totalPages, 0, 1, @createdBy, @cloudinaryPdfId, @cloudinaryThumbId, GETDATE())
      `);
    return result.recordset[0];
  },

  // Cập nhật tài liệu (title, description, grade, type, thumbnail, cloudinaryThumbId)
  async updateById(id, { title, description, grade, type, thumbnail, cloudinaryThumbId }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(500), title)
      .input('description', sql.NVarChar(sql.MAX), description || '')
      .input('grade', sql.NVarChar(5), grade)
      .input('type', sql.NVarChar(20), type)
      .input('thumbnail', sql.NVarChar(sql.MAX), thumbnail || '')
      .input('cloudinaryThumbId', sql.NVarChar(500), cloudinaryThumbId || '')
      .query(`
        UPDATE Documents
        SET title = @title,
            description = @description,
            grade = @grade,
            type = @type,
            thumbnail = @thumbnail,
            cloudinaryThumbId = @cloudinaryThumbId
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    return result.recordset[0] || null;
  },

  // Tăng lượt xem
  async incrementViews(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Documents SET views = views + 1 WHERE id = @id');
  },

  // Xóa tài liệu
  async deleteById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Documents WHERE id = @id');
    return true;
  },

  // Đếm tổng tài liệu
  async count() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Documents');
    return result.recordset[0].total;
  }
};

module.exports = Document;