
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Create a client with default settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/Dashboard" element={<DashboardPage />} />
                  <Route path="/Ugeplan" element={<PlannerPage />} />
                  <Route path="/Medarbejdere" element={<EmployeesPage />} />
                  <Route path="/Biler" element={<CarsPage />} />
                  <Route path="/Fridage" element={<VacationPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  {/* Keep backward compatibility with old routes */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/cars" element={<CarsPage />} />
                  <Route path="/vacation" element={<VacationPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
