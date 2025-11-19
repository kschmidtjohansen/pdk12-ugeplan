import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { SecurityProvider } from "./context/SecurityContext";
import { AuthProvider } from "./context/AuthContext";
import { TranslationProvider, useTranslation } from "./context/TranslationContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChangeLogProvider } from "./context/ChangeLogContext";
import RouteLoadingFallback from "./components/shared/RouteLoadingFallback";
import MainLayout from "./components/Layout/MainLayout";
import { performanceMonitor } from "./utils/performanceMonitor";

// Lazy load pages for better code splitting with retry logic
const lazyWithRetry = (importFn: () => Promise<any>) => {
  return lazy(() =>
    importFn().catch((error) => {
      console.error('Failed to load module, retrying...', error);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(importFn());
        }, 1000);
      });
    })
  );
};

const Index = lazyWithRetry(() => import("./pages/Index"));
const LoginPage = lazyWithRetry(() => import("./pages/LoginPage"));
const DashboardPage = lazyWithRetry(() => import("./pages/DashboardPage"));
const PlannerPage = lazyWithRetry(() => import("./pages/PlannerPage"));
const EmployeesPage = lazyWithRetry(() => import("./pages/EmployeesPage"));
const CarsPage = lazyWithRetry(() => import("./pages/CarsPage"));
const VacationPage = lazyWithRetry(() => import("./pages/VacationPage"));
const DutyPage = lazyWithRetry(() => import("./pages/DutyPage"));
const WarehousePage = lazyWithRetry(() => import("./pages/WarehousePage"));
const ChangeLogPage = lazyWithRetry(() => import("./pages/ChangeLogPage"));
const AdminPage = lazyWithRetry(() => import("./pages/AdminPage"));
const PasswordResetPage = lazyWithRetry(() => import("./pages/PasswordResetPage"));
const ScreenDisplayPage = lazyWithRetry(() => import("./pages/ScreenDisplayPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

const App = () => {
  // Initialize performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Monitoring initialized');
      // Log performance metrics after 10 seconds
      setTimeout(() => {
        const metrics = performanceMonitor.getAllMetrics();
        console.log('[Performance] Current metrics:', metrics);
      }, 10000);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <TranslationProvider>
          <SecurityProvider>
            <AuthProvider>
              <NotificationProvider>
                <ChangeLogProvider>
                  <TooltipProvider>
                    <AppContent />
                  </TooltipProvider>
                </ChangeLogProvider>
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
    // Use browser language detection for loading screen
    const getBrowserLanguage = () => {
      const lang = navigator.language || (navigator as any).userLanguage || '';
      return lang.startsWith('da') ? 'da' : 'en';
    };
    
    const loadingText = getBrowserLanguage() === 'da' 
      ? 'Indlæser applikation...' 
      : 'Loading application...';
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<RouteLoadingFallback />}>
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
          <Route path="/duty" element={<MainLayout><DutyPage /></MainLayout>} />
          <Route path="/warehouse" element={<MainLayout><WarehousePage /></MainLayout>} />
          <Route path="/changelog" element={<MainLayout><ChangeLogPage /></MainLayout>} />
          <Route path="/admin" element={<MainLayout><AdminPage /></MainLayout>} />
          
          {/* Special routes */}
          <Route path="/screen-display" element={<ScreenDisplayPage />} />
          
          {/* Catch all other routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
