import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { roleDefaultRoute } from "@/config/role-navigation";
import Dashboard from "./pages/Dashboard";
import ControlDashboard from "./pages/ControlDashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import GuardInterface from "./pages/GuardInterface";
import Objects from "./pages/Objects";
import Personnel from "./pages/Personnel";
import Incidents from "./pages/Incidents";
import Shifts from "./pages/Shifts";
import Patrols from "./pages/Patrols";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { role } = useRole();

  return (
    <Routes>
      {/* Dispatcher / Super Admin → Ops Dashboard */}
      {(role === 'dispatcher' || role === 'super_admin') && (
        <Route path="/" element={<Dashboard />} />
      )}

      {/* Admin / Chief → Control Dashboard */}
      {(role === 'org_admin' || role === 'chief') && (
        <>
          <Route path="/control" element={<ControlDashboard />} />
          <Route path="/" element={<Navigate to="/control" replace />} />
        </>
      )}

      {/* Guard → Mobile Interface */}
      {role === 'guard' && (
        <>
          <Route path="/guard" element={<GuardInterface />} />
          <Route path="/guard/patrol" element={<GuardInterface />} />
          <Route path="/guard/incidents" element={<GuardInterface />} />
          <Route path="/" element={<Navigate to="/guard" replace />} />
        </>
      )}

      {/* Client → Client Dashboard */}
      {role === 'client' && (
        <>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/incidents" element={<ClientDashboard />} />
          <Route path="/client/reports" element={<ClientDashboard />} />
          <Route path="/" element={<Navigate to="/client" replace />} />
        </>
      )}

      {/* Director → Executive Dashboard */}
      {role === 'director' && (
        <>
          <Route path="/executive" element={<ExecutiveDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/" element={<Navigate to="/executive" replace />} />
        </>
      )}

      {/* Shared routes available to operational roles */}
      {role !== 'guard' && role !== 'client' && role !== 'director' && (
        <>
          <Route path="/objects" element={<Objects />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/patrols" element={<Patrols />} />
          <Route path="/analytics" element={<Analytics />} />
        </>
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={roleDefaultRoute[role]} replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RoleProvider>
          <AppRoutes />
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
