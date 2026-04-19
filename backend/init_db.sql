-- =============================================
-- Script khởi tạo Database: HistoryEduDB
-- Chạy script này trong SQL Server Management Studio (SSMS)
-- =============================================

-- Tạo database (bỏ qua nếu đã có)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'HistoryEduDB')
BEGIN
    CREATE DATABASE HistoryEduDB;
    PRINT '✅ Database HistoryEduDB đã được tạo.';
END
GO

USE HistoryEduDB;
GO

-- =============================================
-- Bảng Grades (Admin quản lý lớp: 4 → 12)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Grades' AND xtype='U')
BEGIN
    CREATE TABLE Grades (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(10)    NOT NULL UNIQUE,   -- '4','5','6',...,'12'
        gradeNumber INT             NOT NULL,           -- Số lớp để sort
        description NVARCHAR(200)   DEFAULT '',
        isActive    BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ Bảng Grades đã được tạo.';

    -- Seed dữ liệu lớp 4 → 12 mặc định
    INSERT INTO Grades (name, gradeNumber, description, isActive)
    VALUES
        ('4',  4,  N'Lớp 4 - Tiểu học', 1),
        ('5',  5,  N'Lớp 5 - Tiểu học', 1),
        ('6',  6,  N'Lớp 6 - THCS',     1),
        ('7',  7,  N'Lớp 7 - THCS',     1),
        ('8',  8,  N'Lớp 8 - THCS',     1),
        ('9',  9,  N'Lớp 9 - THCS',     1),
        ('10', 10, N'Lớp 10 - THPT',    1),
        ('11', 11, N'Lớp 11 - THPT',    1),
        ('12', 12, N'Lớp 12 - THPT',    1);
    PRINT '✅ Đã seed dữ liệu lớp 4 → 12.';
END
GO

-- =============================================
-- Bảng Users
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(50)    NOT NULL,
        email       NVARCHAR(200)   NOT NULL UNIQUE,
        password    NVARCHAR(200)   NOT NULL,
        role        NVARCHAR(10)    NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student','admin')),
        avatar      NVARCHAR(500)   DEFAULT '',
        grade       NVARCHAR(10)    DEFAULT '',  -- Lưu tên lớp: '4','5',...,'12' hoặc ''
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ Bảng Users đã được tạo.';
END
GO

-- =============================================
-- Bảng Documents
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Documents' AND xtype='U')
BEGIN
    CREATE TABLE Documents (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        title               NVARCHAR(500)   NOT NULL,
        description         NVARCHAR(MAX)   DEFAULT '',
        grade               NVARCHAR(10)    NOT NULL,    -- Tên lớp: '4' → '12'
        subject             NVARCHAR(100)   DEFAULT N'Lịch sử',
        type                NVARCHAR(20)    DEFAULT 'textbook'
                                CHECK (type IN ('textbook','reference','exam')),
        filename            NVARCHAR(500)   NOT NULL,
        filepath            NVARCHAR(MAX)   NOT NULL,    -- Cloudinary URL (hoặc local path cũ)
        thumbnail           NVARCHAR(MAX)   DEFAULT '',  -- Cloudinary Image URL
        filesize            BIGINT          DEFAULT 0,
        totalPages          INT             DEFAULT 0,
        views               INT             DEFAULT 0,
        isPublished         BIT             DEFAULT 1,
        createdBy           INT             FOREIGN KEY REFERENCES Users(id) ON DELETE SET NULL,
        cloudinaryPdfId     NVARCHAR(500)   DEFAULT '',  -- Cloudinary public_id của PDF
        cloudinaryThumbId   NVARCHAR(500)   DEFAULT '',  -- Cloudinary public_id của ảnh bìa
        createdAt           DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ Bảng Documents đã được tạo.';
END
GO

-- =============================================
-- Bảng QuizCategories (Danh mục loại đề)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QuizCategories' AND xtype='U')
BEGIN
    CREATE TABLE QuizCategories (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(100)   NOT NULL UNIQUE,   -- 'Thi thử', 'Cuối kì',...
        description NVARCHAR(300)   DEFAULT '',
        isActive    BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ Bảng QuizCategories đã được tạo.';

    -- Seed dữ liệu mặc định
    INSERT INTO QuizCategories (name, description, isActive) VALUES
        (N'Thi thử',            N'Đề thi thử trước kỳ thi', 1),
        (N'Kiểm tra giữa kì',   N'Đề kiểm tra giữa học kỳ', 1),
        (N'Kiểm tra cuối kì',   N'Đề kiểm tra cuối học kỳ', 1),
        (N'Thi tốt nghiệp',     N'Đề thi tốt nghiệp THPT Quốc gia', 1),
        (N'Ôn tập',             N'Đề ôn tập kiến thức', 1),
        (N'Tổng hợp',           N'Đề tổng hợp nhiều chủ đề', 1);
    PRINT '✅ Đã seed dữ liệu QuizCategories.';
END
GO

-- =============================================
-- Bảng Quizzes
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Quizzes' AND xtype='U')
BEGIN
    CREATE TABLE Quizzes (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        title               NVARCHAR(500)   NOT NULL,
        description         NVARCHAR(MAX)   DEFAULT '',
        grade               NVARCHAR(10)    DEFAULT 'mixed', -- '4'→'12' hoặc 'mixed'
        subject             NVARCHAR(100)   DEFAULT N'Lịch sử',
        difficulty          NVARCHAR(10)    DEFAULT 'medium'
                                CHECK (difficulty IN ('easy','medium','hard')),
        categoryId          INT             FOREIGN KEY REFERENCES QuizCategories(id) ON DELETE SET NULL,
        sourceUrl           NVARCHAR(MAX)   DEFAULT '',
        thumbnail           NVARCHAR(MAX)   DEFAULT '',
        thumbnailPublicId   NVARCHAR(500)   DEFAULT '',  -- Cloudinary public_id
        totalQuestions      INT             DEFAULT 0,
        duration            INT             DEFAULT 45,
        isPublished         BIT             DEFAULT 1,
        attempts            INT             DEFAULT 0,
        createdBy           INT             FOREIGN KEY REFERENCES Users(id) ON DELETE SET NULL,
        createdAt           DATETIME2       DEFAULT GETDATE(),
        updatedAt           DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ Bảng Quizzes đã được tạo.';
END
GO

-- =============================================
-- Bảng QuizQuestions (câu hỏi của quiz)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QuizQuestions' AND xtype='U')
BEGIN
    CREATE TABLE QuizQuestions (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        quizId          INT             NOT NULL FOREIGN KEY REFERENCES Quizzes(id) ON DELETE CASCADE,
        questionIndex   INT             NOT NULL DEFAULT 0,
        question        NVARCHAR(MAX)   NOT NULL,
        optionA         NVARCHAR(MAX)   DEFAULT '',
        optionB         NVARCHAR(MAX)   DEFAULT '',
        optionC         NVARCHAR(MAX)   DEFAULT '',
        optionD         NVARCHAR(MAX)   DEFAULT '',
        answer          NVARCHAR(1)     NOT NULL CHECK (answer IN ('A','B','C','D')),
        explanation     NVARCHAR(MAX)   DEFAULT ''
    );
    PRINT '✅ Bảng QuizQuestions đã được tạo.';
END
GO

-- =============================================
-- Bảng Progress (kết quả làm bài)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Progress' AND xtype='U')
BEGIN
    CREATE TABLE Progress (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        userId          INT             NOT NULL FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
        quizId          INT             NOT NULL FOREIGN KEY REFERENCES Quizzes(id) ON DELETE CASCADE,
        score           INT             NOT NULL,
        totalQuestions  INT             NOT NULL,
        correctAnswers  INT             NOT NULL,
        timeTaken       INT             DEFAULT 0,
        completedAt     DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ Bảng Progress đã được tạo.';
END
GO

-- =============================================
-- Bảng ProgressAnswers (chi tiết câu trả lời)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProgressAnswers' AND xtype='U')
BEGIN
    CREATE TABLE ProgressAnswers (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        progressId      INT             NOT NULL FOREIGN KEY REFERENCES Progress(id) ON DELETE CASCADE,
        questionId      INT             NOT NULL,
        selectedAnswer  NVARCHAR(1)     DEFAULT '',
        isCorrect       BIT             DEFAULT 0
    );
    PRINT '✅ Bảng ProgressAnswers đã được tạo.';
END
GO

-- =============================================
-- Tạo tài khoản Admin mặc định
-- Email: admin@historyedu.vn
-- Password: Admin@123
-- BCrypt hash (salt=10) của "Admin@123"
-- ⚠️ Đổi mật khẩu sau khi đăng nhập lần đầu!
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@historyedu.vn')
BEGIN
    INSERT INTO Users (name, email, password, role, grade)
    VALUES (
        N'Quản Trị Viên',
        'admin@historyedu.vn',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Admin@123
        'admin',
        ''
    );
    PRINT '✅ Tài khoản admin mặc định đã được tạo.';
    PRINT '   Email: admin@historyedu.vn';
    PRINT '   Password: Admin@123';
END
GO

-- =============================================
-- Script cập nhật khi DB đã tồn tại (chạy nếu cần update)
-- =============================================

-- Nếu bảng Grades chưa có (DB cũ) → thêm vào
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Grades' AND xtype='U')
BEGIN
    CREATE TABLE Grades (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(10)    NOT NULL UNIQUE,
        gradeNumber INT             NOT NULL,
        description NVARCHAR(200)   DEFAULT '',
        isActive    BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    INSERT INTO Grades (name, gradeNumber, description, isActive)
    VALUES
        ('4',4,N'Lớp 4 - Tiểu học',1),('5',5,N'Lớp 5 - Tiểu học',1),
        ('6',6,N'Lớp 6 - THCS',1),('7',7,N'Lớp 7 - THCS',1),
        ('8',8,N'Lớp 8 - THCS',1),('9',9,N'Lớp 9 - THCS',1),
        ('10',10,N'Lớp 10 - THPT',1),('11',11,N'Lớp 11 - THPT',1),
        ('12',12,N'Lớp 12 - THPT',1);
    PRINT '✅ Đã thêm bảng Grades vào DB cũ.';
END
GO

-- Nếu cột grade trong Users có constraint cũ (chỉ cho 10,11,12) → xóa constraint
-- (Chạy thủ công nếu cần, tìm tên constraint và DROP nó)
-- ALTER TABLE Users DROP CONSTRAINT [tên_constraint];
-- ALTER TABLE Documents DROP CONSTRAINT [tên_constraint];
-- ALTER TABLE Quizzes DROP CONSTRAINT [tên_constraint];

-- =============================================
-- Migration: Thêm cột Cloudinary vào Documents (DB đã tồn tại)
-- =============================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Documents') AND name = 'cloudinaryPdfId'
)
BEGIN
    ALTER TABLE Documents ADD cloudinaryPdfId NVARCHAR(500) DEFAULT '';
    PRINT '✅ Đã thêm cột cloudinaryPdfId vào bảng Documents.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Documents') AND name = 'cloudinaryThumbId'
)
BEGIN
    ALTER TABLE Documents ADD cloudinaryThumbId NVARCHAR(500) DEFAULT '';
    PRINT '✅ Đã thêm cột cloudinaryThumbId vào bảng Documents.';
END
GO

-- =============================================
-- Migration: Thêm bảng QuizCategories (DB đã tồn tại)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QuizCategories' AND xtype='U')
BEGIN
    CREATE TABLE QuizCategories (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(100)   NOT NULL UNIQUE,
        description NVARCHAR(300)   DEFAULT '',
        isActive    BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    INSERT INTO QuizCategories (name, description, isActive) VALUES
        (N'Thi thử',            N'Đề thi thử trước kỳ thi', 1),
        (N'Kiểm tra giữa kì',   N'Đề kiểm tra giữa học kỳ', 1),
        (N'Kiểm tra cuối kì',   N'Đề kiểm tra cuối học kỳ', 1),
        (N'Thi tốt nghiệp',     N'Đề thi tốt nghiệp THPT Quốc gia', 1),
        (N'Ôn tập',             N'Đề ôn tập kiến thức', 1),
        (N'Tổng hợp',           N'Đề tổng hợp nhiều chủ đề', 1);
    PRINT '✅ Đã thêm bảng QuizCategories vào DB cũ.';
END
GO

-- Migration: Thêm cột categoryId vào Quizzes
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Quizzes') AND name = 'categoryId'
)
BEGIN
    ALTER TABLE Quizzes ADD categoryId INT NULL
        FOREIGN KEY REFERENCES QuizCategories(id) ON DELETE SET NULL;
    PRINT '✅ Đã thêm cột categoryId vào bảng Quizzes.';
END
GO

-- Migration: Thêm cột thumbnailPublicId vào Quizzes
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Quizzes') AND name = 'thumbnailPublicId'
)
BEGIN
    ALTER TABLE Quizzes ADD thumbnailPublicId NVARCHAR(500) DEFAULT '';
    PRINT '✅ Đã thêm cột thumbnailPublicId vào bảng Quizzes.';
END
GO

-- =============================================
-- [MỚI] Bảng LessonTopics (Chủ đề / Chương bài học)
-- Tạo ngày: 2026-04-19 | Người tạo: Antigravity
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LessonTopics' AND xtype='U')
BEGIN
    CREATE TABLE LessonTopics (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        grade       NVARCHAR(10)    NOT NULL,        -- '12', '11',... - lớp áp dụng
        book        NVARCHAR(500)   DEFAULT N'Chung',-- VD: 'Lịch Sử 12 Cánh diều'
        title       NVARCHAR(500)   NOT NULL,        -- 'Chủ đề 1: Thế giới trong và sau Chiến tranh lạnh'
        topicOrder  INT             DEFAULT 0,       -- Thứ tự hiển thị
        description NVARCHAR(MAX)   DEFAULT '',      -- Mô tả thêm
        isPublished BIT             DEFAULT 1,       -- 1 = hiển thị, 0 = ẩn
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [MỚI] Bảng LessonTopics đã được tạo.';
END
GO

-- =============================================
-- [MỚI] Bảng Lessons (Bài học cụ thể)
-- Tạo ngày: 2026-04-19 | Người tạo: Antigravity
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Lessons' AND xtype='U')
BEGIN
    CREATE TABLE Lessons (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        topicId         INT             NOT NULL
                            FOREIGN KEY REFERENCES LessonTopics(id) ON DELETE CASCADE,
        title           NVARCHAR(500)   NOT NULL,        -- 'Bài 1: Liên hợp quốc'
        lessonOrder     INT             DEFAULT 0,       -- Thứ tự trong chủ đề
        summary         NVARCHAR(MAX)   DEFAULT '',      -- Tóm tắt lý thuyết (Markdown)
        specialContent  NVARCHAR(MAX)   DEFAULT '',      -- Bài học chuyên đề
        timeline        NVARCHAR(MAX)   DEFAULT '[]',    -- JSON: [{year:'1945', event:'...'}]
        sourceUrl       NVARCHAR(MAX)   DEFAULT '',      -- URL nguồn (VietJack,...)
        views           INT             DEFAULT 0,       -- Lượt xem
        isPublished     BIT             DEFAULT 1,       -- 1 = hiển thị, 0 = ẩn
        createdAt       DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [MỚI] Bảng Lessons đã được tạo.';
END
GO

-- =============================================
-- [MỚI] Migration: Thêm bảng LessonTopics và Lessons nếu chưa có (DB đã tồn tại)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LessonTopics' AND xtype='U')
BEGIN
    CREATE TABLE LessonTopics (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        grade       NVARCHAR(10)    NOT NULL,
        book        NVARCHAR(500)   DEFAULT N'Chung',
        title       NVARCHAR(500)   NOT NULL,
        topicOrder  INT             DEFAULT 0,
        description NVARCHAR(MAX)   DEFAULT '',
        isPublished BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [Migration] Đã thêm bảng LessonTopics vào DB cũ.';
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Lessons' AND xtype='U')
BEGIN
    CREATE TABLE Lessons (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        topicId         INT             NOT NULL
                            FOREIGN KEY REFERENCES LessonTopics(id) ON DELETE CASCADE,
        title           NVARCHAR(500)   NOT NULL,
        lessonOrder     INT             DEFAULT 0,
        summary         NVARCHAR(MAX)   DEFAULT '',
        specialContent  NVARCHAR(MAX)   DEFAULT '',
        timeline        NVARCHAR(MAX)   DEFAULT '[]',
        sourceUrl       NVARCHAR(MAX)   DEFAULT '',
        views           INT             DEFAULT 0,
        isPublished     BIT             DEFAULT 1,
        createdAt       DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [Migration] Đã thêm bảng Lessons vào DB cũ.';
END
GO

-- =============================================
-- [MỚI] Migration: Thêm cột book vào bảng LessonTopics
-- =============================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('LessonTopics') AND name = 'book'
)
BEGIN
    ALTER TABLE LessonTopics ADD book NVARCHAR(500) DEFAULT N'Chung';
    PRINT '✅ Đã thêm cột book vào bảng LessonTopics.';
END
GO

-- =============================================
-- [MỚI] Bảng LessonCategories (Danh mục bài học)
-- VD: "Tóm tắt bài học", "Chuyên đề", "Dòng thời gian"
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LessonCategories' AND xtype='U')
BEGIN
    CREATE TABLE LessonCategories (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(200)   NOT NULL UNIQUE,     -- Tên danh mục
        description NVARCHAR(MAX)   DEFAULT '',           -- Mô tả danh mục
        icon        NVARCHAR(50)    DEFAULT '📚',         -- Emoji icon
        displayOrder INT            DEFAULT 0,            -- Thứ tự hiển thị
        isActive    BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [MỚI] Bảng LessonCategories đã được tạo.';

    -- Seed dữ liệu mặc định
    INSERT INTO LessonCategories (name, description, icon, displayOrder, isActive) VALUES
        (N'Tóm tắt bài học',    N'Tóm tắt lý thuyết ngắn gọn, dễ hiểu cho từng bài học', N'📖', 1, 1),
        (N'Chuyên đề',          N'Nội dung chuyên đề học sâu, mở rộng kiến thức',         N'🎯', 2, 1),
        (N'Dòng thời gian',     N'Các mốc thời gian quan trọng trong lịch sử',             N'⏳', 3, 1),
        (N'Kiến thức trọng tâm',N'Những kiến thức trọng tâm cần nhớ để thi',               N'⭐', 4, 1),
        (N'Ôn tập tổng hợp',    N'Tổng hợp kiến thức ôn tập theo chủ đề và lớp',          N'📝', 5, 1);
    PRINT '✅ Đã seed dữ liệu LessonCategories.';
END
GO

-- =============================================
-- [MỚI] Bảng LessonSections (Phần bài học)
-- VD: "Lý thuyết Lịch Sử 12 Cánh diều (hay, ngắn gọn)"
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LessonSections' AND xtype='U')
BEGIN
    CREATE TABLE LessonSections (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        categoryId      INT             NULL
                            FOREIGN KEY REFERENCES LessonCategories(id) ON DELETE SET NULL,
        name            NVARCHAR(500)   NOT NULL,         -- Tên phần bài học
        description     NVARCHAR(MAX)   DEFAULT '',       -- Mô tả phần
        grade           NVARCHAR(10)    DEFAULT '',       -- Lớp áp dụng (có thể để trống = tất cả)
        coverImage      NVARCHAR(MAX)   DEFAULT '',       -- Ảnh bìa (tuỳ chọn)
        displayOrder    INT             DEFAULT 0,         -- Thứ tự hiển thị
        isPublished     BIT             DEFAULT 1,
        createdAt       DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [MỚI] Bảng LessonSections đã được tạo.';
END
GO

-- =============================================
-- [MỚI] Migration: Thêm cột sectionId vào LessonTopics
-- =============================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('LessonTopics') AND name = 'sectionId'
)
BEGIN
    ALTER TABLE LessonTopics ADD sectionId INT NULL
        FOREIGN KEY REFERENCES LessonSections(id) ON DELETE SET NULL;
    PRINT '✅ Đã thêm cột sectionId vào bảng LessonTopics.';
END
GO

-- =============================================
-- [MỚI] Migration: Thêm bảng LessonCategories nếu chưa có (DB đã tồn tại)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LessonCategories' AND xtype='U')
BEGIN
    CREATE TABLE LessonCategories (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(200)   NOT NULL UNIQUE,
        description NVARCHAR(MAX)   DEFAULT '',
        icon        NVARCHAR(50)    DEFAULT N'📚',
        displayOrder INT            DEFAULT 0,
        isActive    BIT             DEFAULT 1,
        createdAt   DATETIME2       DEFAULT GETDATE()
    );
    INSERT INTO LessonCategories (name, description, icon, displayOrder, isActive) VALUES
        (N'Tóm tắt bài học',    N'Tóm tắt lý thuyết ngắn gọn, dễ hiểu cho từng bài học', N'📖', 1, 1),
        (N'Chuyên đề',          N'Nội dung chuyên đề học sâu, mở rộng kiến thức',         N'🎯', 2, 1),
        (N'Dòng thời gian',     N'Các mốc thời gian quan trọng trong lịch sử',             N'⏳', 3, 1),
        (N'Kiến thức trọng tâm',N'Những kiến thức trọng tâm cần nhớ để thi',               N'⭐', 4, 1),
        (N'Ôn tập tổng hợp',    N'Tổng hợp kiến thức ôn tập theo chủ đề và lớp',          N'📝', 5, 1);
    PRINT '✅ [Migration] Đã thêm bảng LessonCategories vào DB cũ.';
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LessonSections' AND xtype='U')
BEGIN
    CREATE TABLE LessonSections (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        categoryId      INT             NULL FOREIGN KEY REFERENCES LessonCategories(id) ON DELETE SET NULL,
        name            NVARCHAR(500)   NOT NULL,
        description     NVARCHAR(MAX)   DEFAULT '',
        grade           NVARCHAR(10)    DEFAULT '',
        coverImage      NVARCHAR(MAX)   DEFAULT '',
        displayOrder    INT             DEFAULT 0,
        isPublished     BIT             DEFAULT 1,
        createdAt       DATETIME2       DEFAULT GETDATE()
    );
    PRINT '✅ [Migration] Đã thêm bảng LessonSections vào DB cũ.';
END
GO


PRINT '🎉 Khởi tạo/cập nhật database HistoryEduDB hoàn tất!';
GO

-- =============================================
-- [FIX] Sửa tên section bị nhân đôi
-- Áp dụng khi tên có dạng "ABC...ABC..." (chuỗi lặp đôi)
-- Logic: nếu nửa đầu = nửa sau thì chỉ giữ nửa đầu
-- =============================================
UPDATE LessonSections
SET name = LEFT(name, LEN(name) / 2)
WHERE LEN(name) > 20
  AND LEN(name) % 2 = 0
  AND LEFT(name, LEN(name) / 2) = RIGHT(name, LEN(name) / 2);

PRINT CONCAT('✅ [FIX] Đã sửa ', @@ROWCOUNT, ' tên LessonSections bị nhân đôi.');
GO

-- Tương tự fix trường book trong LessonTopics
UPDATE LessonTopics
SET book = LEFT(book, LEN(book) / 2)
WHERE LEN(book) > 20
  AND LEN(book) % 2 = 0
  AND LEFT(book, LEN(book) / 2) = RIGHT(book, LEN(book) / 2);

PRINT CONCAT('✅ [FIX] Đã sửa ', @@ROWCOUNT, ' trường book trong LessonTopics bị nhân đôi.');
GO
