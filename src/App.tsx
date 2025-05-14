
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import VacationPage from './pages/VacationPage';
import EmployeesPage from './pages/EmployeesPage';
import CarsPage from './pages/CarsPage';
import AdminPage from './pages/AdminPage';
import PasswordResetPage from './pages/PasswordResetPage';
import { Toaster } from "@/components/ui/toaster";
import MainLayout from './components/Layout/MainLayout';
import AutoPublishHandler from './components/AutoPublish/AutoPublishHandler';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  // Add a delay to ensure auth state is stable before rendering routes
  useEffect(() => {
    if (!authLoading) {
      // Small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        setAppReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Show loading state until auth is ready
  if (authLoading || !appReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Component to handle protected routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <ErrorBoundary>
      <Router>
        {/* Only mount AutoPublishHandler when user is authenticated */}
        {isAuthenticated && <AutoPublishHandler />}
        
        <Routes>
          {/* Public routes without layout */}
          <Route path="/login" element={
            // Prevent authenticated users from accessing login page
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          
          {/* Support both URL formats for password reset */}
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          
          {/* Protected routes wrapped with MainLayout */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/planner" element={
            <ProtectedRoute>
              <MainLayout>
                <PlannerPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/vacation" element={
            <ProtectedRoute>
              <MainLayout>
                <VacationPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute>
              <MainLayout>
                <EmployeesPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/cars" element={
            <ProtectedRoute>
              <MainLayout>
                <CarsPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <MainLayout>
                <AdminPage />
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
