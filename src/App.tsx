import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { roleDefaultRoute } from "@/config/role-navigation";
import Login from "./pages/Login";
import Register from "./pages/Register";
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function DashboardRedirect() {
  const { role } = useRole();
  return <Navigate to={roleDefaultRoute[role]} replace />;
}

function AppRoutes() {
  const { role } = useRole();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<RequireAuth><DashboardRedirect /></RequireAuth>} />

      {/* Dispatcher / Super Admin → Ops Dashboard */}
      {(role === 'dispatcher' || role === 'super_admin') && (
        <Route path="/ops" element={<RequireAuth><Dashboard /></RequireAuth>} />
      )}

      {/* Org Admin → Admin Control Dashboard */}
      {role === 'org_admin' && (
        <Route path="/admin" element={<RequireAuth><ControlDashboard /></RequireAuth>} />
      )}

      {/* Chief of Security → Chief Control Dashboard */}
      {role === 'chief' && (
        <Route path="/chief" element={<RequireAuth><ControlDashboard /></RequireAuth>} />
      )}

      {/* Guard → Mobile Interface */}
      {role === 'guard' && (
        <>
          <Route path="/m/guard/home" element={<RequireAuth><GuardHome /></RequireAuth>} />
          <Route path="/m/guard/shift" element={<RequireAuth><GuardShift /></RequireAuth>} />
          <Route path="/m/guard/patrol" element={<RequireAuth><GuardPatrol /></RequireAuth>} />
          <Route path="/m/guard/incidents" element={<RequireAuth><GuardIncidents /></RequireAuth>} />
          <Route path="/m/guard/profile" element={<RequireAuth><GuardProfile /></RequireAuth>} />
        </>
      )}

      {/* Client → Client Portal */}
      {role === 'client' && (
        <>
          <Route path="/client" element={<RequireAuth><ClientMyObjects /></RequireAuth>} />
          <Route path="/client/acceptance" element={<RequireAuth><ClientAcceptance /></RequireAuth>} />
          <Route path="/client/violations" element={<RequireAuth><ClientViolations /></RequireAuth>} />
          <Route path="/client/incidents" element={<RequireAuth><ClientIncidents /></RequireAuth>} />
          <Route path="/client/reports" element={<RequireAuth><ClientSLAReports /></RequireAuth>} />
        </>
      )}

      {/* Director → Executive Dashboard */}
      {role === 'director' && (
        <>
          <Route path="/exec" element={<RequireAuth><ExecutiveDashboard /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
        </>
      )}

      {/* Shared routes for operational roles */}
      {role !== 'guard' && role !== 'client' && role !== 'director' && (
        <>
          <Route path="/objects" element={<RequireAuth><Objects /></RequireAuth>} />
          <Route path="/personnel" element={<RequireAuth><Personnel /></RequireAuth>} />
          <Route path="/incidents" element={<RequireAuth><Incidents /></RequireAuth>} />
          <Route path="/shifts" element={<RequireAuth><Shifts /></RequireAuth>} />
          <Route path="/patrols" element={<RequireAuth><Patrols /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
        </>
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoleProvider>
            <AppRoutes />
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
