import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PwaProvider } from "@/contexts/PwaContext";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import AppLayout from "@/components/AppLayout";
import AdminLayout from "@/components/AdminLayout";
import HomePage from "./pages/HomePage";
import SymptomChecker from "./pages/SymptomChecker";
import EmergencyPanel from "./pages/EmergencyPanel";
import ChatAI from "./pages/ChatAI";
import FacilitiesPage from "./pages/FacilitiesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BookingPage from "./pages/BookingPage";
import SettingsPage from "./pages/SettingsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function PublicLayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function AdminIndexRedirect() {
  const { isAuthenticated } = useAdminAuth();
  return <Navigate to={isAuthenticated ? "/admin/dashboard" : "/admin/login"} replace />;
}

function AdminPortalRoute() {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <PwaProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminIndexRedirect />} />
              <Route element={<AdminPortalRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
                <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>

              <Route element={<PublicLayoutRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/symptoms" element={<SymptomChecker />} />
                <Route path="/emergency" element={<EmergencyPanel />} />
                <Route path="/chat" element={<ChatAI />} />
                <Route path="/facilities" element={<FacilitiesPage />} />
                <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/login" element={<Navigate to="/admin/login" replace />} />
                <Route path="/signin" element={<Navigate to="/admin/login" replace />} />
                <Route path="/auth" element={<Navigate to="/admin/login" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PwaProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
