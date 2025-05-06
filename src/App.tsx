
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TranslationProvider } from "./context/TranslationContext";
import { NotificationProvider } from "./context/NotificationContext";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlannerPage from "./pages/PlannerPage";
import EmployeesPage from "./pages/EmployeesPage";
import CarsPage from "./pages/CarsPage";
import VacationPage from "./pages/VacationPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/Layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <TooltipProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/ugeplan" element={<PlannerPage />} />
                  <Route path="/medarbejdere" element={<EmployeesPage />} />
                  <Route path="/biler" element={<CarsPage />} />
                  <Route path="/fridage" element={<VacationPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  
                  {/* Redirects for backwards compatibility */}
                  <Route path="/planner" element={<Navigate to="/ugeplan" replace />} />
                  <Route path="/employees" element={<Navigate to="/medarbejdere" replace />} />
                  <Route path="/cars" element={<Navigate to="/biler" replace />} />
                  <Route path="/vacation" element={<Navigate to="/fridage" replace />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </BrowserRouter>
          </NotificationProvider>
        </TooltipProvider>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
