
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import MainLayout from './components/Layout/MainLayout';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import PasswordResetPage from './pages/PasswordResetPage';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import EmployeesPage from './pages/EmployeesPage';
import CarsPage from './pages/CarsPage';
import VacationPage from './pages/VacationPage';
import AdminPage from './pages/AdminPage';
import ScreenDisplayPage from './pages/ScreenDisplayPage';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="polygon-theme">
          <TranslationProvider>
            <NotificationProvider>
              <AuthProvider>
                <Router>
                  <div className="App">
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/password-reset" element={<PasswordResetPage />} />
                      <Route path="/screen-display" element={<ScreenDisplayPage />} />
                      <Route path="/" element={<MainLayout />}>
                        <Route index element={<Index />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="planner" element={<PlannerPage />} />
                        <Route path="employees" element={<EmployeesPage />} />
                        <Route path="cars" element={<CarsPage />} />
                        <Route path="vacation" element={<VacationPage />} />
                        <Route path="admin" element={<AdminPage />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                  </div>
                </Router>
              </AuthProvider>
            </NotificationProvider>
          </TranslationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
