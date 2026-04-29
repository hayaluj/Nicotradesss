import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LangProvider } from '@/contexts/LangContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Calculator from '@/pages/Calculator';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import Signals from '@/pages/Signals';
import Booking from '@/pages/Booking';
import Profile from '@/pages/Profile';
import Legal from '@/pages/Legal';
import Admin from '@/pages/Admin';
import Documents from '@/pages/Documents';
import ResetPassword from '@/pages/ResetPassword';
import Checkout from '@/pages/Checkout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login initialTab="register" />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/privacy-policy" element={<Legal initialTab="privacy" />} />
      <Route path="/terms-of-service" element={<Legal initialTab="terms" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
