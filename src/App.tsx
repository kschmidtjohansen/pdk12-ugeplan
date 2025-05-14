
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
import { NotificationProvider } from './context/NotificationContext';
import { useAutoPublishAssignments } from './hooks/useAutoPublishAssignments';

function App() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // Auto-publish assignments at 16:00
  const AutoPublishHandler = () => {
    useAutoPublishAssignments();
    return null; // This component doesn't render anything
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      {isAuthenticated && <AutoPublishHandler />}
      <Routes>
        {/* Public routes without layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Support both URL formats for password reset */}
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        
        {/* Protected routes wrapped with MainLayout */}
        <Route path="/" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
        <Route path="/planner" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <PlannerPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
        <Route path="/vacation" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <VacationPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <EmployeesPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
        <Route path="/cars" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <CarsPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <NotificationProvider>
              <MainLayout>
                <AdminPage />
              </MainLayout>
            </NotificationProvider>
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
