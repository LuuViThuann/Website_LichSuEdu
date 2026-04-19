import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';
import BookReader from './pages/BookReader';
import QuizList from './pages/QuizList';
import QuizDetail from './pages/QuizDetail';
import MyProgress from './pages/MyProgress';
import Lessons from './pages/Lessons';           // [MỚI]
import LessonDetail from './pages/LessonDetail'; // [MỚI]

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminQuiz from './pages/admin/ManageQuiz';
import AdminDocuments from './pages/admin/ManageDocuments';
import AdminUsers from './pages/admin/ManageUsers';
import AdminGrades from './pages/admin/ManageGrades';
import AdminQuizCategories from './pages/admin/ManageQuizCategories';
import AdminLessons from './pages/admin/ManageLessons';
import AdminLessonCategories from './pages/admin/ManageLessonCategories';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/read/:id" element={<ProtectedRoute><BookReader /></ProtectedRoute>} />
        <Route path="/quiz" element={<QuizList />} />
        <Route path="/quiz/:id" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><MyProgress /></ProtectedRoute>} />
        {/* [MỚI] Bài học */}
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/lessons/:id" element={<LessonDetail />} />
        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/quiz" element={<ProtectedRoute adminOnly><AdminQuiz /></ProtectedRoute>} />
        <Route path="/admin/quiz-categories" element={<ProtectedRoute adminOnly><AdminQuizCategories /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute adminOnly><AdminDocuments /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/grades" element={<ProtectedRoute adminOnly><AdminGrades /></ProtectedRoute>} />
        {/* Admin Quản lý bài học */}
        <Route path="/admin/lesson-categories" element={<ProtectedRoute adminOnly><AdminLessonCategories /></ProtectedRoute>} />
        <Route path="/admin/lessons" element={<ProtectedRoute adminOnly><AdminLessons /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Be Vietnam Pro', borderRadius: '10px', border: '1px solid #E1EAF5' },
        success: { iconTheme: { primary: '#1565C0', secondary: '#fff' } }
      }} />
    </BrowserRouter>
  );
}