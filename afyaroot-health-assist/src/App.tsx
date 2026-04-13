import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PwaProvider } from "@/contexts/PwaContext";
import AppLayout from "@/components/AppLayout";
import HomePage from "./pages/HomePage";
import SymptomChecker from "./pages/SymptomChecker";
import EmergencyPanel from "./pages/EmergencyPanel";
import ChatAI from "./pages/ChatAI";
import FacilitiesPage from "./pages/FacilitiesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BookingPage from "./pages/BookingPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <PwaProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/symptoms" element={<SymptomChecker />} />
                <Route path="/emergency" element={<EmergencyPanel />} />
                <Route path="/chat" element={<ChatAI />} />
                <Route path="/facilities" element={<FacilitiesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </PwaProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
