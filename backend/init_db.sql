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

PRINT '🎉 Khởi tạo/cập nhật database HistoryEduDB hoàn tất!';
GO
