// ============================================================
// Model: Lesson.js
// Quản lý: LessonCategories, LessonSections, LessonTopics, Lessons
// ============================================================
const { getPool, sql } = require('../config/database');

const Lesson = {

  // ─────────────────────────────────────────────
  // LESSON CATEGORIES (Danh mục bài học)
  // VD: "Tóm tắt bài học", "Chuyên đề", "Dòng thời gian"
  // ─────────────────────────────────────────────

  /** Lấy tất cả danh mục (kèm số phần bài học) */
  async findAllCategories({ activeOnly = true } = {}) {
    const pool = getPool();
    const where = activeOnly ? 'WHERE c.isActive = 1' : '';
    const result = await pool.request().query(`
      SELECT c.*,
             COUNT(s.id) AS sectionCount
      FROM LessonCategories c
      LEFT JOIN LessonSections s ON s.categoryId = c.id AND s.isPublished = 1
      ${where}
      GROUP BY c.id, c.name, c.description, c.icon, c.displayOrder, c.isActive, c.createdAt
      ORDER BY c.displayOrder ASC, c.id ASC
    `);
    return result.recordset;
  },

  /** Tạo danh mục mới */
  async createCategory({ name, description = '', icon = '📚', displayOrder = 0, isActive = true }) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar(200), name)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('icon', sql.NVarChar(50), icon)
      .input('displayOrder', sql.Int, displayOrder)
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query(`
        INSERT INTO LessonCategories (name, description, icon, displayOrder, isActive, createdAt)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @icon, @displayOrder, @isActive, GETDATE())
      `);
    return result.recordset[0];
  },

  /** Cập nhật danh mục */
  async updateCategoryById(id, { name, description, icon, displayOrder, isActive }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(200), name)
      .input('description', sql.NVarChar(sql.MAX), description || '')
      .input('icon', sql.NVarChar(50), icon || '📚')
      .input('displayOrder', sql.Int, displayOrder || 0)
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query(`
        UPDATE LessonCategories
        SET name=@name, description=@description, icon=@icon,
            displayOrder=@displayOrder, isActive=@isActive
        WHERE id=@id;
        SELECT * FROM LessonCategories WHERE id=@id;
      `);
    return result.recordset[0];
  },

  /** Xóa danh mục */
  async deleteCategoryById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM LessonCategories WHERE id = @id');
    return true;
  },

  // ─────────────────────────────────────────────
  // LESSON SECTIONS (Phần bài học)
  // VD: "Lý thuyết Lịch Sử 12 Cánh diều (hay, ngắn gọn)"
  // ─────────────────────────────────────────────

  /** Lấy tất cả phần bài học (kèm tên danh mục + số chủ đề) */
  async findAllSections({ categoryId = null, grade = null, activeOnly = true } = {}) {
    const pool = getPool();
    const conditions = [];
    if (activeOnly) conditions.push('s.isPublished = 1');
    if (categoryId) conditions.push('s.categoryId = @categoryId');
    if (grade) conditions.push('s.grade = @grade');
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const req = pool.request();
    if (categoryId) req.input('categoryId', sql.Int, categoryId);
    if (grade) req.input('grade', sql.NVarChar(10), grade);

    const result = await req.query(`
      SELECT s.*,
             c.name  AS categoryName,
             c.icon  AS categoryIcon,
             COUNT(t.id) AS topicCount
      FROM LessonSections s
      LEFT JOIN LessonCategories c ON c.id = s.categoryId
      LEFT JOIN LessonTopics t   ON t.sectionId = s.id AND t.isPublished = 1
      ${where}
      GROUP BY s.id, s.categoryId, s.name, s.description, s.grade,
               s.coverImage, s.displayOrder, s.isPublished, s.createdAt,
               c.name, c.icon
      ORDER BY s.displayOrder ASC, s.id ASC
    `);
    return result.recordset;
  },

  /** Lấy 1 section theo id */
  async findSectionById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT s.*, c.name AS categoryName, c.icon AS categoryIcon
        FROM LessonSections s
        LEFT JOIN LessonCategories c ON c.id = s.categoryId
        WHERE s.id = @id
      `);
    return result.recordset[0] || null;
  },

  /** Lấy cây đầy đủ của 1 section: Section → Topics → Lessons */
  async findSectionWithTree(id) {
    const pool = getPool();
    const sectionResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT s.*, c.name AS categoryName, c.icon AS categoryIcon
        FROM LessonSections s
        LEFT JOIN LessonCategories c ON c.id = s.categoryId
        WHERE s.id = @id
      `);
    const section = sectionResult.recordset[0];
    if (!section) return null;

    const topicsResult = await pool.request()
      .input('sectionId', sql.Int, id)
      .query(`
        SELECT * FROM LessonTopics
        WHERE sectionId = @sectionId AND isPublished = 1
        ORDER BY topicOrder ASC
      `);
    const topics = topicsResult.recordset;

    if (!topics.length) return { ...section, topics: [] };

    const topicIds = topics.map(t => t.id).join(',');
    const lessonsResult = await pool.request().query(`
      SELECT id, topicId, title, lessonOrder, sourceUrl, views, isPublished,
             CASE WHEN LEN(summary) > 0 THEN 1 ELSE 0 END AS hasSummary,
             CASE WHEN LEN(specialContent) > 0 THEN 1 ELSE 0 END AS hasSpecial,
             CASE WHEN LEN(timeline) > 2 THEN 1 ELSE 0 END AS hasTimeline
      FROM Lessons
      WHERE topicId IN (${topicIds}) AND isPublished = 1
      ORDER BY lessonOrder ASC
    `);
    const lessons = lessonsResult.recordset;

    return {
      ...section,
      topics: topics.map(t => ({
        ...t,
        lessons: lessons.filter(l => l.topicId === t.id)
      }))
    };
  },

  /** Tạo phần bài học mới */
  async createSection({ categoryId, name, description = '', grade = '', coverImage = '', displayOrder = 0, isPublished = true }) {
    const pool = getPool();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId || null)
      .input('name', sql.NVarChar(500), name)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('grade', sql.NVarChar(10), grade)
      .input('coverImage', sql.NVarChar(sql.MAX), coverImage)
      .input('displayOrder', sql.Int, displayOrder)
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .query(`
        INSERT INTO LessonSections (categoryId, name, description, grade, coverImage, displayOrder, isPublished, createdAt)
        OUTPUT INSERTED.*
        VALUES (@categoryId, @name, @description, @grade, @coverImage, @displayOrder, @isPublished, GETDATE())
      `);
    return result.recordset[0];
  },

  /** Cập nhật phần bài học */
  async updateSectionById(id, { categoryId, name, description, grade, coverImage, displayOrder, isPublished }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('categoryId', sql.Int, categoryId || null)
      .input('name', sql.NVarChar(500), name)
      .input('description', sql.NVarChar(sql.MAX), description || '')
      .input('grade', sql.NVarChar(10), grade || '')
      .input('coverImage', sql.NVarChar(sql.MAX), coverImage || '')
      .input('displayOrder', sql.Int, displayOrder || 0)
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .query(`
        UPDATE LessonSections
        SET categoryId=@categoryId, name=@name, description=@description,
            grade=@grade, coverImage=@coverImage, displayOrder=@displayOrder,
            isPublished=@isPublished
        WHERE id=@id;
        SELECT s.*, c.name AS categoryName, c.icon AS categoryIcon
        FROM LessonSections s
        LEFT JOIN LessonCategories c ON c.id = s.categoryId
        WHERE s.id=@id;
      `);
    return result.recordset[0];
  },

  /** Xóa phần bài học (các topic/lesson liên quan sẽ sectionId=NULL) */
  async deleteSectionById(id) {
    const pool = getPool();
    // Gỡ liên kết topics trước (không xóa topic/lesson)
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE LessonTopics SET sectionId = NULL WHERE sectionId = @id');
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM LessonSections WHERE id = @id');
    return true;
  },

  // ─────────────────────────────────────────────
  // LESSON TOPICS (Chủ đề / Chương)
  // ─────────────────────────────────────────────

  /** Lấy tất cả chủ đề, kèm số bài học */
  async findAllTopics({ grade = null, sectionId = null, activeOnly = true } = {}) {
    const pool = getPool();
    const conditions = [];
    if (activeOnly) conditions.push('t.isPublished = 1');
    if (grade) conditions.push('t.grade = @grade');
    if (sectionId !== undefined && sectionId !== null) conditions.push('t.sectionId = @sectionId');
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : 'WHERE 1=1';

    const req = pool.request();
    if (grade) req.input('grade', sql.NVarChar(10), grade);
    if (sectionId !== undefined && sectionId !== null) req.input('sectionId', sql.Int, sectionId);

    const result = await req.query(`
      SELECT t.*,
             COUNT(l.id) AS lessonCount,
             s.name AS sectionName,
             c.name AS categoryName, c.icon AS categoryIcon
      FROM LessonTopics t
      LEFT JOIN Lessons l         ON l.topicId = t.id AND l.isPublished = 1
      LEFT JOIN LessonSections s  ON s.id = t.sectionId
      LEFT JOIN LessonCategories c ON c.id = s.categoryId
      ${where}
      GROUP BY t.id, t.grade, t.book, t.title, t.topicOrder, t.description,
               t.isPublished, t.createdAt, t.sectionId,
               s.name, c.name, c.icon
      ORDER BY t.grade ASC, t.book ASC, t.topicOrder ASC
    `);
    return result.recordset;
  },

  /** Lấy 1 chủ đề theo id */
  async findTopicById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM LessonTopics WHERE id = @id');
    return result.recordset[0] || null;
  },

  /** Tạo chủ đề mới */
  async createTopic({ grade, book = 'Chung', title, topicOrder = 0, description = '', isPublished = true, sectionId = null }) {
    const pool = getPool();
    const result = await pool.request()
      .input('grade', sql.NVarChar(10), grade)
      .input('book', sql.NVarChar(500), book)
      .input('title', sql.NVarChar(500), title)
      .input('topicOrder', sql.Int, topicOrder)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .input('sectionId', sql.Int, sectionId || null)
      .query(`
        INSERT INTO LessonTopics (grade, book, title, topicOrder, description, isPublished, sectionId, createdAt)
        OUTPUT INSERTED.*
        VALUES (@grade, @book, @title, @topicOrder, @description, @isPublished, @sectionId, GETDATE())
      `);
    return result.recordset[0];
  },

  /** Cập nhật chủ đề */
  async updateTopicById(id, { grade, book, title, topicOrder, description, isPublished, sectionId }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('grade', sql.NVarChar(10), grade)
      .input('book', sql.NVarChar(500), book || 'Chung')
      .input('title', sql.NVarChar(500), title)
      .input('topicOrder', sql.Int, topicOrder)
      .input('description', sql.NVarChar(sql.MAX), description || '')
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .input('sectionId', sql.Int, sectionId || null)
      .query(`
        UPDATE LessonTopics
        SET grade=@grade, book=@book, title=@title, topicOrder=@topicOrder,
            description=@description, isPublished=@isPublished, sectionId=@sectionId
        WHERE id=@id;
        SELECT * FROM LessonTopics WHERE id=@id;
      `);
    return result.recordset[0];
  },

  /** Xóa chủ đề (cascade xóa bài học) */
  async deleteTopicById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM LessonTopics WHERE id = @id');
    return true;
  },

  // ─────────────────────────────────────────────
  // LESSONS (Bài học)
  // ─────────────────────────────────────────────

  /** Lấy tất cả bài học kèm tên chủ đề */
  async findAll({ topicId = null, grade = null, sectionId = null, activeOnly = true } = {}) {
    const pool = getPool();
    const conditions = [];
    if (activeOnly) conditions.push('l.isPublished = 1');
    if (topicId)    conditions.push('l.topicId = @topicId');
    if (grade)      conditions.push('t.grade = @grade');
    if (sectionId)  conditions.push('t.sectionId = @sectionId');
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const req = pool.request();
    if (topicId)   req.input('topicId', sql.Int, topicId);
    if (grade)     req.input('grade', sql.NVarChar(10), grade);
    if (sectionId) req.input('sectionId', sql.Int, sectionId);

    const result = await req.query(`
      SELECT l.*, t.title AS topicTitle, t.grade, t.book, t.topicOrder, t.sectionId
      FROM Lessons l
      JOIN LessonTopics t ON t.id = l.topicId
      ${where}
      ORDER BY t.grade ASC, t.book ASC, t.topicOrder ASC, l.lessonOrder ASC
    `);
    return result.recordset;
  },

  /** Lấy cây đầy đủ: Section → Chủ đề → Bài học (public) */
  async findTree({ grade = null, sectionId = null } = {}) {
    const pool = getPool();
    const conditions = ['t.isPublished = 1'];
    if (grade) conditions.push('t.grade = @grade');
    if (sectionId) conditions.push('t.sectionId = @sectionId');
    const whereT = 'WHERE ' + conditions.join(' AND ');

    const req = pool.request();
    if (grade) req.input('grade', sql.NVarChar(10), grade);
    if (sectionId) req.input('sectionId', sql.Int, sectionId);

    const topicsResult = await req.query(`
      SELECT * FROM LessonTopics t ${whereT}
      ORDER BY t.grade ASC, t.book ASC, t.topicOrder ASC
    `);
    const topics = topicsResult.recordset;

    if (!topics.length) return [];

    const topicIds = topics.map(t => t.id).join(',');
    const lessonResult = await pool.request().query(`
      SELECT id, topicId, title, lessonOrder, sourceUrl, views, isPublished
      FROM Lessons
      WHERE topicId IN (${topicIds}) AND isPublished = 1
      ORDER BY lessonOrder ASC
    `);
    const lessons = lessonResult.recordset;

    return topics.map(topic => ({
      ...topic,
      lessons: lessons.filter(l => l.topicId === topic.id)
    }));
  },

  /** Lấy 1 bài học theo id (đầy đủ nội dung) */
  async findById(id) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          l.id, l.topicId, l.title, l.lessonOrder,
          l.summary, l.specialContent, l.timeline,
          l.sourceUrl, l.views, l.isPublished, l.createdAt,
          t.title  AS topicTitle,
          t.grade, t.book, t.topicOrder, t.sectionId,
          s.name   AS sectionName, s.categoryId,
          c.name   AS categoryName, c.icon AS categoryIcon
        FROM Lessons l
        JOIN LessonTopics t        ON t.id = l.topicId
        LEFT JOIN LessonSections s ON s.id = t.sectionId
        LEFT JOIN LessonCategories c ON c.id = s.categoryId
        WHERE l.id = @id
      `);
    const row = result.recordset[0];
    if (!row) return null;
    row.topicId = Array.isArray(row.topicId) ? row.topicId[0] : Number(row.topicId);
    return row;
  },

  /** Lấy bài trước/sau để điều hướng */
  async findNavigation(lessonId, topicId) {
    const pool = getPool();
    const result = await pool.request()
      .input('topicId', sql.Int, topicId)
      .query(`
        SELECT id, title, lessonOrder FROM Lessons
        WHERE topicId = @topicId AND isPublished = 1
        ORDER BY lessonOrder ASC
      `);
    const list = result.recordset;
    const idx = list.findIndex(l => l.id === lessonId);
    return {
      prev: idx > 0 ? list[idx - 1] : null,
      next: idx < list.length - 1 ? list[idx + 1] : null,
    };
  },

  /** Tạo bài học */
  async create({ topicId, title, lessonOrder = 0, summary = '', specialContent = '', timeline = '[]', sourceUrl = '', isPublished = true }) {
    const pool = getPool();
    const result = await pool.request()
      .input('topicId', sql.Int, topicId)
      .input('title', sql.NVarChar(500), title)
      .input('lessonOrder', sql.Int, lessonOrder)
      .input('summary', sql.NVarChar(sql.MAX), summary)
      .input('specialContent', sql.NVarChar(sql.MAX), specialContent)
      .input('timeline', sql.NVarChar(sql.MAX), timeline)
      .input('sourceUrl', sql.NVarChar(sql.MAX), sourceUrl)
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .query(`
        INSERT INTO Lessons
          (topicId, title, lessonOrder, summary, specialContent, timeline, sourceUrl, isPublished, views, createdAt)
        OUTPUT INSERTED.*
        VALUES
          (@topicId, @title, @lessonOrder, @summary, @specialContent, @timeline, @sourceUrl, @isPublished, 0, GETDATE())
      `);
    return result.recordset[0];
  },

  /** Cập nhật bài học */
  async updateById(id, { topicId, title, lessonOrder, summary, specialContent, timeline, sourceUrl, isPublished }) {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('topicId', sql.Int, topicId)
      .input('title', sql.NVarChar(500), title)
      .input('lessonOrder', sql.Int, lessonOrder)
      .input('summary', sql.NVarChar(sql.MAX), summary || '')
      .input('specialContent', sql.NVarChar(sql.MAX), specialContent || '')
      .input('timeline', sql.NVarChar(sql.MAX), timeline || '[]')
      .input('sourceUrl', sql.NVarChar(sql.MAX), sourceUrl || '')
      .input('isPublished', sql.Bit, isPublished ? 1 : 0)
      .query(`
        UPDATE Lessons
        SET topicId=@topicId, title=@title, lessonOrder=@lessonOrder,
            summary=@summary, specialContent=@specialContent,
            timeline=@timeline, sourceUrl=@sourceUrl, isPublished=@isPublished
        WHERE id=@id;
        SELECT * FROM Lessons WHERE id=@id;
      `);
    return result.recordset[0];
  },

  /** Xóa bài học */
  async deleteById(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Lessons WHERE id = @id');
    return true;
  },

  /** Tăng view */
  async incrementViews(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Lessons SET views = views + 1 WHERE id = @id');
  },

  /** Đếm tổng bài học */
  async count() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Lessons');
    return result.recordset[0].total;
  },

  /** Import hàng loạt từ JSON (gắn với sectionId nếu có) */
  async importFromJson({ grade, topics, sectionId = null, book = 'Chung' }) {
    const results = { topics: [], lessons: [] };

    const extractSectionText = (section) => {
      if (!section?.content) return '';
      return section.content
        .filter(c => c.type === 'text' || c.type === 'list' || c.type === 'table')
        .map(c => {
          if (c.type === 'text') return c.text?.trim() || '';
          if (c.type === 'list') return (c.items || []).map(i => `- ${i}`).join('\n');
          if (c.type === 'table') return (c.rows || []).map(row => row.join(' | ')).join('\n');
          return '';
        })
        .filter(t => t.length > 0)
        .join('\n');
    };

    const SPAM_HEADINGS = [
      'Các sản phẩm khác', 'TÀI LIỆU FILE WORD', 'DÀNH CHO GIÁO VIÊN',
      'tailieugiaovien', 'HOT500', 'Đã có app VietJack',
      'Theo dõi chúng tôi', 'Mạng xã hội', 'Phòng luyện thi',
    ];
    const SPAM_PATTERNS = [
      /^\(\d+k\)\s*Xem Khóa học/i,
      /^Đã có app VietJack/i,
      /^Tải ngay ứng dụng/i,
      /^Theo dõi chúng tôi/i,
      /^hãy động viên/i,
      /bình luận vĩnh viễn/i,
      /HOT500\+/i,
      /Combo 3 khóa/i,
      /^Giải lớp \d/i,
      /^Giải sgk/i,
      /^Soạn văn lớp/i,
      /^Giải Chuyên đề/i,
      /^Giải SBT/i,
      /^Phòng luyện thi/i,
      /VietJack\.me/i,
      /tailieugiaovien\.com/i,
    ];

    const isSpamText = (text) => {
      if (!text || text.trim().length === 0) return true;
      return SPAM_PATTERNS.some(p => p.test(text.trim()));
    };

    const isSpamSection = (section) => {
      const heading = (section.heading || '');
      if (SPAM_HEADINGS.some(h => heading.toLowerCase().includes(h.toLowerCase()))) return true;
      if (section.content?.length === 1 && isSpamText(section.content[0]?.text || '')) return true;
      return false;
    };

    const buildSummary = (sections) => {
      if (!sections?.length) return '';
      return sections
        .filter(sec => !isSpamSection(sec))
        .map(sec => {
          const heading = sec.heading && !isSpamText(sec.heading)
            ? `## ${sec.heading}\n` : '';
          const body = (sec.content || [])
            .filter(c => c.type === 'text' || c.type === 'list' || c.type === 'table')
            .map(c => {
              if (c.type === 'text') {
                const t = (c.text || '').trim();
                return isSpamText(t) ? null : t;
              }
              if (c.type === 'list') {
                const filtered = (c.items || []).filter(i => !isSpamText(i));
                return filtered.length > 0 ? filtered.map(i => `- ${i}`).join('\n') : null;
              }
              if (c.type === 'table') {
                const rows = (c.rows || []).slice(0, 30);
                return rows.map(r => r.join(' | ')).join('\n');
              }
              return null;
            })
            .filter(t => t !== null && t.length > 0)
            .join('\n');
          return (heading + body).trim();
        })
        .filter(block => block.length > 0)
        .join('\n\n');
    };

    for (let ti = 0; ti < topics.length; ti++) {
      const topicData = topics[ti];
      const topic = await Lesson.createTopic({
        grade,
        book: book || 'Chung',
        title: topicData.topic_title || `Chủ đề ${ti + 1}`,
        topicOrder: ti + 1,
        isPublished: true,
        sectionId: sectionId || null,
      });
      results.topics.push(topic);

      if (!topicData.lessons?.length) continue;

      for (let li = 0; li < topicData.lessons.length; li++) {
        const lessonData = topicData.lessons[li];
        const sections = lessonData.content?.sections || [];
        const summary = buildSummary(sections);

        const lesson = await Lesson.create({
          topicId: topic.id,
          title: lessonData.title || `Bài ${li + 1}`,
          lessonOrder: li + 1,
          summary,
          sourceUrl: lessonData.url || '',
          isPublished: true,
        });
        results.lessons.push(lesson);
      }
    }
    return results;
  }
};

module.exports = Lesson;
