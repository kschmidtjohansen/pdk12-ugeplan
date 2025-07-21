
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner"

import { useAuth } from './context/AuthContext';
import { ThemeProvider } from "./components/theme-provider"

import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index'; 
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import EmployeesPage from './pages/EmployeesPage';
import CarsPage from './pages/CarsPage';
import VacationPage from './pages/VacationPage';
import AdminPage from './pages/AdminPage';
import AutoPublishContainer from './components/AutoPublish/AutoPublishContainer';
import PasswordResetPage from './pages/PasswordResetPage';

const queryClient = new QueryClient();

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
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Toaster />
          <AutoPublishContainer userId={user?.id} />
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            {/* Password reset routes - both paths are accessible without authentication */}
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            {/* Use the Index component for the root path instead of directly rendering DashboardPage */}
            <Route path="/" element={user ? <Index /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" />} />
            <Route path="/planner" element={user ? <MainLayout><PlannerPage /></MainLayout> : <Navigate to="/login" />} />
            <Route path="/employees" element={user ? <MainLayout><EmployeesPage /></MainLayout> : <Navigate to="/login" />} />
            <Route path="/cars" element={user ? <MainLayout><CarsPage /></MainLayout> : <Navigate to="/login" />} />
            <Route path="/vacation" element={user ? <MainLayout><VacationPage /></MainLayout> : <Navigate to="/login" />} />
            <Route path="/admin" element={(user?.role === 'administrator' || user?.role === 'superadmin') ? <MainLayout><AdminPage /></MainLayout> : user ? <Navigate to="/" /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
