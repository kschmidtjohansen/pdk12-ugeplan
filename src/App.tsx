
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

import LoginPage from './pages/LoginPage';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import AdminPage from './pages/AdminPage';
import EmployeesPage from './pages/EmployeesPage';
import CarsPage from './pages/CarsPage';
import VacationPage from './pages/VacationPage';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TranslationProvider>
          <AuthProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="planner" element={<PlannerPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="cars" element={<CarsPage />} />
                    <Route path="vacation" element={<VacationPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Router>
              <Toaster />
            </NotificationProvider>
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
