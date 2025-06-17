
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { SecurityProvider } from "./context/SecurityContext";
import { AuthProvider } from "./context/AuthContext";
import { TranslationProvider } from "./context/TranslationContext";
import { NotificationProvider } from "./context/NotificationContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlannerPage from "./pages/PlannerPage";
import EmployeesPage from "./pages/EmployeesPage";
import CarsPage from "./pages/CarsPage";
import VacationPage from "./pages/VacationPage";
import AdminPage from "./pages/AdminPage";
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
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/password-reset" element={<PasswordResetPage />} />
                      
                      {/* Protected routes - MainLayout will handle the layout internally */}
                      <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
                      <Route path="/planner" element={<MainLayout><PlannerPage /></MainLayout>} />
                      <Route path="/planner/:assignmentId" element={<MainLayout><PlannerPage /></MainLayout>} />
                      <Route path="/employees" element={<MainLayout><EmployeesPage /></MainLayout>} />
                      <Route path="/cars" element={<MainLayout><CarsPage /></MainLayout>} />
                      <Route path="/vacation" element={<MainLayout><VacationPage /></MainLayout>} />
                      <Route path="/admin" element={<MainLayout><AdminPage /></MainLayout>} />
                      <Route path="/screen-display" element={<ScreenDisplayPage />} />
                      
                      {/* Catch all other routes and redirect to NotFound */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </NotificationProvider>
            </AuthProvider>
          </SecurityProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
