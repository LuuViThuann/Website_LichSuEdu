const { getPool, sql } = require('../config/database');

const Quiz = {
  // Lấy danh sách quiz (không kèm questions, có phân trang)
  async findAll({ grade, difficulty, categoryId, page = 1, limit = 12 } = {}) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    let where = "WHERE q.isPublished = 1";
    const request = pool.request();

    if (grade) {
      where += " AND q.grade = @grade";
      request.input('grade', sql.NVarChar(10), grade);
    }
    if (difficulty) {
      where += " AND q.difficulty = @difficulty";
      request.input('difficulty', sql.NVarChar(10), difficulty);
    }
    if (categoryId) {
      where += " AND q.categoryId = @categoryId";
      request.input('categoryId', sql.Int, Number(categoryId));
    }

    request.input('limit', sql.Int, Number(limit));
    request.input('offset', sql.Int, Number(offset));

    // Count query riêng
    const countReq = pool.request();
    if (grade) countReq.input('grade', sql.NVarChar(10), grade);
    if (difficulty) countReq.input('difficulty', sql.NVarChar(10), difficulty);
    if (categoryId) countReq.input('categoryId', sql.Int, Number(categoryId));
    const countRes = await countReq.query(`SELECT COUNT(*) AS total FROM Quizzes q ${where}`);
    const total = countRes.recordset[0].total;

    const result = await request.query(`
      SELECT q.id, q.title, q.description, q.grade, q.subject, q.difficulty,
             q.categoryId, c.name AS categoryName,
             q.sourceUrl, q.thumbnail, q.thumbnailPublicId,
             q.totalQuestions, q.duration, q.isPublished, q.attempts,
             q.createdBy, q.createdAt, q.updatedAt
      FROM Quizzes q
      LEFT JOIN QuizCategories c ON q.categoryId = c.id
      ${where}
      ORDER BY q.createdAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return { data: result.recordset, total };
  },

  // Tìm quiz theo id (kèm questions)
  async findById(id) {
    const pool = getPool();
    const quizResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT q.*, c.name AS categoryName
        FROM Quizzes q
        LEFT JOIN QuizCategories c ON q.categoryId = c.id
        WHERE q.id = @id
      `);

    if (!quizResult.recordset[0]) return null;
    const quiz = quizResult.recordset[0];

    const qResult = await pool.request()
      .input('quizId', sql.Int, id)
      .query(`
        SELECT id, questionIndex AS id_index, question, optionA, optionB, optionC, optionD,
               answer, explanation
        FROM QuizQuestions WHERE quizId = @quizId ORDER BY questionIndex ASC
      `);

    // Map questions sang format cũ để frontend hoạt động
    quiz.questions = qResult.recordset.map((q, idx) => ({
      id: q.id_index != null ? q.id_index : idx,
      question: q.question,
      options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
      answer: q.answer,
      explanation: q.explanation
    }));

    return quiz;
  },

  // Tạo quiz mới (kèm questions)
  async create({ title, description = '', grade = 'mixed', subject = 'Lịch sử',
    difficulty = 'medium', categoryId = null, sourceUrl = '',
    thumbnail = '', thumbnailPublicId = '', duration = 45,
    isPublished = true, questions = [], createdBy }) {
    const pool = getPool();

    // Insert quiz
    const quizResult = await pool.request()
      .input('title', sql.NVarChar(500), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('grade', sql.NVarChar(10), grade)
      .input('subject', sql.NVarChar(100), subject)
      .input('difficulty', sql.NVarChar(10), difficulty)
      .input('categoryId', sql.Int, categoryId ? Number(categoryId) : null)
      .input('sourceUrl', sql.NVarChar(sql.MAX), sourceUrl)
      .input('thumbnail', sql.NVarChar(sql.MAX), thumbnail)
      .input('thumbnailPublicId', sql.NVarChar(500), thumbnailPublicId)
      .input('totalQuestions', sql.Int, questions.length)
      .input('duration', sql.Int, duration)
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .input('createdBy', sql.Int, createdBy || null)
      .query(`
        INSERT INTO Quizzes
          (title, description, grade, subject, difficulty, categoryId, sourceUrl, thumbnail,
           thumbnailPublicId, totalQuestions, duration, isPublished, attempts, createdBy,
           createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES
          (@title, @description, @grade, @subject, @difficulty, @categoryId, @sourceUrl,
           @thumbnail, @thumbnailPublicId, @totalQuestions, @duration, @isPublished,
           0, @createdBy, GETDATE(), GETDATE())
      `);

    const quiz = quizResult.recordset[0];

    // Insert questions
    if (questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await pool.request()
          .input('quizId', sql.Int, quiz.id)
          .input('questionIndex', sql.Int, q.id != null ? q.id : i)
          .input('question', sql.NVarChar(sql.MAX), q.question)
          .input('optionA', sql.NVarChar(sql.MAX), q.options?.A || '')
          .input('optionB', sql.NVarChar(sql.MAX), q.options?.B || '')
          .input('optionC', sql.NVarChar(sql.MAX), q.options?.C || '')
          .input('optionD', sql.NVarChar(sql.MAX), q.options?.D || '')
          .input('answer', sql.NVarChar(1), q.answer)
          .input('explanation', sql.NVarChar(sql.MAX), q.explanation || '')
          .query(`
            INSERT INTO QuizQuestions
              (quizId, questionIndex, question, optionA, optionB, optionC, optionD, answer, explanation)
            VALUES
              (@quizId, @questionIndex, @question, @optionA, @optionB, @optionC, @optionD, @answer, @explanation)
          `);
      }
    }

    quiz.questions = questions;
    return quiz;
  },

  // Cập nhật quiz
  async updateById(id, data) {
    const pool = getPool();
    const { title, description, grade, subject, difficulty, categoryId,
      sourceUrl, thumbnail, thumbnailPublicId, duration, isPublished, questions } = data;

    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(500), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('grade', sql.NVarChar(10), grade)
      .input('subject', sql.NVarChar(100), subject)
      .input('difficulty', sql.NVarChar(10), difficulty)
      .input('categoryId', sql.Int, categoryId ? Number(categoryId) : null)
      .input('sourceUrl', sql.NVarChar(sql.MAX), sourceUrl || '')
      .input('thumbnail', sql.NVarChar(sql.MAX), thumbnail || '')
      .input('thumbnailPublicId', sql.NVarChar(500), thumbnailPublicId || '')
      .input('totalQuestions', sql.Int, questions ? questions.length : 0)
      .input('duration', sql.Int, duration)
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .query(`
        UPDATE Quizzes SET
          title=@title, description=@description, grade=@grade, subject=@subject,
          difficulty=@difficulty, categoryId=@categoryId, sourceUrl=@sourceUrl,
          thumbnail=@thumbnail, thumbnailPublicId=@thumbnailPublicId,
          totalQuestions=@totalQuestions, duration=@duration, isPublished=@isPublished,
          updatedAt=GETDATE()
        WHERE id=@id
      `);

    // Nếu có questions, xóa cũ và insert lại
    if (questions && Array.isArray(questions)) {
      await pool.request()
        .input('quizId', sql.Int, id)
        .query('DELETE FROM QuizQuestions WHERE quizId = @quizId');

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await pool.request()
          .input('quizId', sql.Int, id)
          .input('questionIndex', sql.Int, q.id != null ? q.id : i)
          .input('question', sql.NVarChar(sql.MAX), q.question)
          .input('optionA', sql.NVarChar(sql.MAX), q.options?.A || '')
          .input('optionB', sql.NVarChar(sql.MAX), q.options?.B || '')
          .input('optionC', sql.NVarChar(sql.MAX), q.options?.C || '')
          .input('optionD', sql.NVarChar(sql.MAX), q.options?.D || '')
          .input('answer', sql.NVarChar(1), q.answer)
          .input('explanation', sql.NVarChar(sql.MAX), q.explanation || '')
          .query(`
            INSERT INTO QuizQuestions
              (quizId, questionIndex, question, optionA, optionB, optionC, optionD, answer, explanation)
            VALUES
              (@quizId, @questionIndex, @question, @optionA, @optionB, @optionC, @optionD, @answer, @explanation)
          `);
      }
    }

    return await Quiz.findById(id);
  },

  // Xóa quiz (và questions)
  async deleteById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM QuizQuestions WHERE quizId = @id');
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Quizzes WHERE id = @id');
    return true;
  },

  // Tăng lượt làm bài
  async incrementAttempts(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Quizzes SET attempts = attempts + 1 WHERE id = @id');
  },

  // Đếm tổng quiz
  async count() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Quizzes');
    return result.recordset[0].total;
  }
};

module.exports = Quiz;