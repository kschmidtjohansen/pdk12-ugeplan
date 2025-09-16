
import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { SecurityProvider } from "./context/SecurityContext";
import { AuthProvider } from "./context/AuthContext";
import { TranslationProvider, useTranslation } from "./context/TranslationContext";
import { NotificationProvider } from "./context/NotificationContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlannerPage from "./pages/PlannerPage";
import EmployeesPage from "./pages/EmployeesPage";
import CarsPage from "./pages/CarsPage";
import VacationPage from "./pages/VacationPage";
import AdminPage from "./pages/AdminPage";
import { CalibrationPage } from "./pages/CalibrationPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import ScreenDisplayPage from "./pages/ScreenDisplayPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/Layout/MainLayout";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <TranslationProvider>
          <SecurityProvider>
            <AuthProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <AppContent />
                </TooltipProvider>
              </NotificationProvider>
            </AuthProvider>
          </SecurityProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const AppContent = () => {
  // Safely check if translation is initialized
  let isInitialized = false;
  try {
    const { isInitialized: translationReady } = useTranslation();
    isInitialized = translationReady;
  } catch (error) {
    // Translation provider not ready yet
    console.warn('Translation provider not ready:', error);
    isInitialized = false;
  }
  
  // Don't render routes until translation is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Sonner />
      <Toaster />
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        
        {/* Protected routes wrapped in MainLayout */}
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/planner" element={<MainLayout><PlannerPage /></MainLayout>} />
        <Route path="/planner/:assignmentId" element={<MainLayout><PlannerPage /></MainLayout>} />
        <Route path="/employees" element={<MainLayout><EmployeesPage /></MainLayout>} />
        <Route path="/cars" element={<MainLayout><CarsPage /></MainLayout>} />
        <Route path="/vacation" element={<MainLayout><VacationPage /></MainLayout>} />
        <Route path="/calibration" element={<MainLayout><CalibrationPage /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><AdminPage /></MainLayout>} />
        
        {/* Special routes */}
        <Route path="/screen-display" element={<ScreenDisplayPage />} />
        
        {/* Catch all other routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
