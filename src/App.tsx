
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/cars" element={<CarsPage />} />
              <Route path="/vacation" element={<VacationPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
