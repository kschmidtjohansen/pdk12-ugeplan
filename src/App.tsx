
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";

// Providers
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TranslationProvider } from '@/context/TranslationContext';
import { NotificationProvider } from '@/context/NotificationContext';

// Pages
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import EmployeesPage from '@/pages/EmployeesPage';
import CarsPage from '@/pages/CarsPage';
import PlannerPage from '@/pages/PlannerPage';
import VacationPage from '@/pages/VacationPage';
import AdminPage from '@/pages/AdminPage';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';

// Layout
import MainLayout from '@/components/Layout/MainLayout';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading state while checking authentication
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Auth Route Component (redirects to dashboard if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Show loading state while checking authentication
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        } 
      />
      <Route 
        path="/reset-password" 
        element={<ResetPasswordPage />} 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employees" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <EmployeesPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cars" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <CarsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/planner" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlannerPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vacation" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <VacationPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TranslationProvider>
          <NotificationProvider>
            <AppRoutes />
            <Toaster />
          </NotificationProvider>
        </TranslationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
