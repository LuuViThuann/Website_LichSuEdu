const { getPool, sql } = require('../config/database');

const Progress = {
  // Tạo bản ghi kết quả quiz
  async create({ userId, quizId, score, totalQuestions, correctAnswers, answers = [], timeTaken = 0 }) {
    const pool = getPool();

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('quizId', sql.Int, quizId)
      .input('score', sql.Int, score)
      .input('totalQuestions', sql.Int, totalQuestions)
      .input('correctAnswers', sql.Int, correctAnswers)
      .input('timeTaken', sql.Int, timeTaken)
      .query(`
        INSERT INTO Progress (userId, quizId, score, totalQuestions, correctAnswers, timeTaken, completedAt)
        OUTPUT INSERTED.*
        VALUES (@userId, @quizId, @score, @totalQuestions, @correctAnswers, @timeTaken, GETDATE())
      `);

    const progress = result.recordset[0];

    // Insert chi tiết câu trả lời
    for (const ans of answers) {
      await pool.request()
        .input('progressId', sql.Int, progress.id)
        .input('questionId', sql.Int, ans.questionId)
        .input('selectedAnswer', sql.NVarChar(1), ans.selectedAnswer || '')
        .input('isCorrect', sql.Bit, ans.isCorrect ? 1 : 0)
        .query(`
          INSERT INTO ProgressAnswers (progressId, questionId, selectedAnswer, isCorrect)
          VALUES (@progressId, @questionId, @selectedAnswer, @isCorrect)
        `);
    }

    return progress;
  },

  // Lấy lịch sử làm bài của user (kèm thông tin quiz)
  async findByUser(userId, limit = 20) {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          p.id, p.score, p.totalQuestions, p.correctAnswers, p.timeTaken, p.completedAt,
          q.id AS quizId, q.title AS quizTitle, q.grade AS quizGrade
        FROM Progress p
        JOIN Quizzes q ON p.quizId = q.id
        WHERE p.userId = @userId
        ORDER BY p.completedAt DESC
      `);

    return result.recordset.map(r => ({
      id: r.id,
      score: r.score,
      totalQuestions: r.totalQuestions,
      correctAnswers: r.correctAnswers,
      timeTaken: r.timeTaken,
      completedAt: r.completedAt,
      quiz: { id: r.quizId, title: r.quizTitle, grade: r.quizGrade }
    }));
  },

  // Đếm tổng lượt làm bài
  async count() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Progress');
    return result.recordset[0].total;
  },

  // Lấy lịch sử gần đây (admin)
  async findRecent(limit = 5) {
    const pool = getPool();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          p.id, p.score, p.completedAt,
          u.id AS userId, u.name AS userName,
          q.id AS quizId, q.title AS quizTitle
        FROM Progress p
        JOIN Users u ON p.userId = u.id
        JOIN Quizzes q ON p.quizId = q.id
        ORDER BY p.completedAt DESC
      `);

    return result.recordset.map(r => ({
      id: r.id,
      score: r.score,
      completedAt: r.completedAt,
      user: { id: r.userId, name: r.userName },
      quiz: { id: r.quizId, title: r.quizTitle }
    }));
  }
};

module.exports = Progress;