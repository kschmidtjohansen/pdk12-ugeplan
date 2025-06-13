
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
import VacationCleanupHandler from './components/Vacation/VacationCleanupHandler';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('40')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Error boundary specifically for the notification provider
const NotificationErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      {children}
    </ErrorBoundary>
  );
};

// Error boundary specifically for the translation provider
const TranslationErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<div className="p-4">Loading translations...</div>}>
      {children}
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="polygon-theme">
          <AuthProvider>
            <TranslationErrorBoundary>
              <TranslationProvider>
                <NotificationErrorBoundary>
                  <NotificationProvider>
                    <Router>
                      <div className="App">
                        {/* Add the VacationCleanupHandler here so it runs in the background */}
                        <VacationCleanupHandler />
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
                  </NotificationProvider>
                </NotificationErrorBoundary>
              </TranslationProvider>
            </TranslationErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
