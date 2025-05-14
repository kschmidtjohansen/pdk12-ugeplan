
import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"

import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from "./components/theme-provider"

import MainLayout from './components/Layout/MainLayout';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const CarsPage = lazy(() => import('./pages/CarsPage'));
const VacationPage = lazy(() => import('./pages/VacationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AutoPublishContainer = lazy(() => import('./components/AutoPublish/AutoPublishContainer'));

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for lazy loading
const LoadingFallback = () => <div className="flex items-center justify-center h-screen">Loading...</div>;

function App() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(false);
    };
    checkAuth();
  }, [user]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TranslationProvider>
          <NotificationProvider>
            <ThemeProvider>
              <Router>
                <Toaster />
                <Suspense fallback={<LoadingFallback />}>
                  <AutoPublishContainer />
                  <Routes>
                    <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
                    <Route path="/" element={user ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />
                    <Route path="/planner" element={user ? <MainLayout><PlannerPage /></MainLayout> : <Navigate to="/login" />} />
                    <Route path="/employees" element={user ? <MainLayout><EmployeesPage /></MainLayout> : <Navigate to="/login" />} />
                    <Route path="/cars" element={user ? <MainLayout><CarsPage /></MainLayout> : <Navigate to="/login" />} />
                    <Route path="/vacation" element={user ? <MainLayout><VacationPage /></MainLayout> : <Navigate to="/login" />} />
                    <Route path="/admin" element={user?.role === 'administrator' ? <MainLayout><AdminPage /></MainLayout> : user ? <Navigate to="/" /> : <Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Suspense>
              </Router>
            </ThemeProvider>
          </NotificationProvider>
        </TranslationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
