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
import ClientMyObjects from "./pages/client/ClientMyObjects";
import ClientAcceptance from "./pages/client/ClientAcceptance";
import ClientViolations from "./pages/client/ClientViolations";
import ClientIncidents from "./pages/client/ClientIncidents";
import ClientSLAReports from "./pages/client/ClientSLAReports";
import GuardHome from "./pages/guard/GuardHome";
import GuardShift from "./pages/guard/GuardShift";
import GuardPatrol from "./pages/guard/GuardPatrol";
import GuardIncidents from "./pages/guard/GuardIncidents";
import GuardProfile from "./pages/guard/GuardProfile";
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
        <Route path="/ops" element={<Dashboard />} />
      )}

      {/* Org Admin → Admin Control Dashboard */}
      {role === 'org_admin' && (
        <Route path="/admin" element={<ControlDashboard />} />
      )}

      {/* Chief of Security → Chief Control Dashboard */}
      {role === 'chief' && (
        <Route path="/chief" element={<ControlDashboard />} />
      )}

      {/* Guard → Mobile Interface */}
      {role === 'guard' && (
        <>
          <Route path="/m/guard/home" element={<GuardHome />} />
          <Route path="/m/guard/shift" element={<GuardShift />} />
          <Route path="/m/guard/patrol" element={<GuardPatrol />} />
          <Route path="/m/guard/incidents" element={<GuardIncidents />} />
          <Route path="/m/guard/profile" element={<GuardProfile />} />
        </>
      )}

      {/* Client → Client Portal */}
      {role === 'client' && (
        <>
          <Route path="/client" element={<ClientMyObjects />} />
          <Route path="/client/acceptance" element={<ClientAcceptance />} />
          <Route path="/client/violations" element={<ClientViolations />} />
          <Route path="/client/incidents" element={<ClientIncidents />} />
          <Route path="/client/reports" element={<ClientSLAReports />} />
        </>
      )}

      {/* Director → Executive Dashboard */}
      {role === 'director' && (
        <>
          <Route path="/exec" element={<ExecutiveDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
        </>
      )}

      {/* Shared routes for operational roles */}
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

      {/* Fallback → redirect to role default */}
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
