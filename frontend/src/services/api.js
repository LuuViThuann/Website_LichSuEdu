import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally
API.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

// Quizzes
export const getQuizzes = (params) => API.get('/quizzes', { params });
export const getQuiz = (id) => API.get(`/quizzes/${id}`);
export const createQuiz = (formData) => API.post('/quizzes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateQuiz = (id, formData) => API.put(`/quizzes/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);
export const submitQuiz = (id, data) => API.post(`/quizzes/${id}/submit`, data);
export const getMyProgress = () => API.get('/quizzes/progress/my');

// Documents
export const getDocuments = (params) => API.get('/documents', { params });
export const getDocument = (id) => API.get(`/documents/${id}`);
export const uploadDocument = (formData) => API.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateDocument = (id, formData) => API.put(`/documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteDocument = (id) => API.delete(`/documents/${id}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getUsers = () => API.get('/admin/users');
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

// Grades (Public)
export const getGrades = () => API.get('/grades');

// Admin Grades (CRUD)
export const getAdminGrades = () => API.get('/admin/grades');
export const createGrade = (data) => API.post('/admin/grades', data);
export const updateGrade = (id, data) => API.put(`/admin/grades/${id}`, data);
export const deleteGrade = (id) => API.delete(`/admin/grades/${id}`);

// Quiz Categories (Public)
export const getQuizCategories = () => API.get('/quiz-categories');

// Admin Quiz Categories (CRUD)
export const getAdminQuizCategories = () => API.get('/admin/quiz-categories');
export const createQuizCategory = (data) => API.post('/admin/quiz-categories', data);
export const updateQuizCategory = (id, data) => API.put(`/admin/quiz-categories/${id}`, data);
export const deleteQuizCategory = (id) => API.delete(`/admin/quiz-categories/${id}`);

// ── [MỚI] Lessons (Public) ──────────────────────────────────────
export const getLessonsTree = (grade) => API.get('/lessons', { params: { grade } });
export const getLessonTopics = (grade) => API.get('/lessons/topics', { params: { grade } });
export const getLesson = (id) => API.get(`/lessons/${id}`);

// ── [MỚI] Admin Lessons (CRUD) ──────────────────────────────────
export const getAdminLessonTopics = (grade) => API.get('/admin/lesson-topics', { params: { grade } });
export const createLessonTopic = (data) => API.post('/admin/lesson-topics', data);
export const updateLessonTopic = (id, data) => API.put(`/admin/lesson-topics/${id}`, data);
export const deleteLessonTopic = (id) => API.delete(`/admin/lesson-topics/${id}`);

export const getAdminLessons = (params) => API.get('/admin/lessons', { params });
export const getAdminLesson = (id) => API.get(`/admin/lessons/${id}`);
export const createLesson = (data) => API.post('/admin/lessons', data);
export const updateLesson = (id, data) => API.put(`/admin/lessons/${id}`, data);
export const deleteLesson = (id) => API.delete(`/admin/lessons/${id}`);
export const importLessons = (data) => API.post('/admin/lessons/import', data);

export default API;