import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Financeiro from "./pages/Financeiro";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Medicos from "./pages/Medicos";
import Procedimentos from "./pages/Procedimentos";
import Integracoes from "./pages/Integracoes";
import Configuracoes from "./pages/Configuracoes";
import Kanban from "./pages/Kanban";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <div>
              <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
                <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                <Route path="/medicos" element={<ProtectedRoute><Medicos /></ProtectedRoute>} />
                <Route path="/procedimentos" element={<ProtectedRoute><Procedimentos /></ProtectedRoute>} />
                <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
                <Route path="/integracoes" element={<ProtectedRoute><Integracoes /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
