import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { roleDefaultRoute } from "@/config/role-navigation";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ChiefControl from "./pages/ChiefControl";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
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
import Posts from "./pages/Posts";
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

function RoleGate({ children }: { children: React.ReactNode }) {
  const { roleLoading, roleError } = useRole();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (roleError === 'no_role') {
      signOut().then(() => navigate('/login?error=no_role', { replace: true }));
    }
  }, [roleError, signOut, navigate]);

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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
      <Route path="/dashboard" element={<RequireAuth><RoleGate><DashboardRedirect /></RoleGate></RequireAuth>} />

      {/* Super Admin → Platform Dashboard */}
      {role === 'super_admin' && (
        <>
          <Route path="/super-admin" element={<RequireAuth><RoleGate><SuperAdminDashboard /></RoleGate></RequireAuth>} />
          <Route path="/super-admin/orgs" element={<RequireAuth><RoleGate><SuperAdminDashboard /></RoleGate></RequireAuth>} />
          <Route path="/super-admin/audit" element={<RequireAuth><RoleGate><SuperAdminDashboard /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Dispatcher → Ops Dashboard */}
      {role === 'dispatcher' && (
        <Route path="/ops" element={<RequireAuth><RoleGate><Dashboard /></RoleGate></RequireAuth>} />
      )}

      {/* Org Admin → Admin Dashboard (full config) */}
      {role === 'org_admin' && (
        <>
          <Route path="/admin" element={<RequireAuth><RoleGate><AdminDashboard /></RoleGate></RequireAuth>} />
          <Route path="/posts" element={<RequireAuth><RoleGate><Posts /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Chief → Operations quality control (read-only config) */}
      {role === 'chief' && (
        <>
          <Route path="/chief" element={<RequireAuth><RoleGate><ChiefControl /></RoleGate></RequireAuth>} />
          <Route path="/chief/violations" element={<RequireAuth><RoleGate><ChiefControl /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Guard → Mobile Interface */}
      {role === 'guard' && (
        <>
          <Route path="/m/guard/home" element={<RequireAuth><RoleGate><GuardHome /></RoleGate></RequireAuth>} />
          <Route path="/m/guard/shift" element={<RequireAuth><RoleGate><GuardShift /></RoleGate></RequireAuth>} />
          <Route path="/m/guard/patrol" element={<RequireAuth><RoleGate><GuardPatrol /></RoleGate></RequireAuth>} />
          <Route path="/m/guard/incidents" element={<RequireAuth><RoleGate><GuardIncidents /></RoleGate></RequireAuth>} />
          <Route path="/m/guard/profile" element={<RequireAuth><RoleGate><GuardProfile /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Client → Client Portal */}
      {role === 'client' && (
        <>
          <Route path="/client" element={<RequireAuth><RoleGate><ClientMyObjects /></RoleGate></RequireAuth>} />
          <Route path="/client/acceptance" element={<RequireAuth><RoleGate><ClientAcceptance /></RoleGate></RequireAuth>} />
          <Route path="/client/violations" element={<RequireAuth><RoleGate><ClientViolations /></RoleGate></RequireAuth>} />
          <Route path="/client/incidents" element={<RequireAuth><RoleGate><ClientIncidents /></RoleGate></RequireAuth>} />
          <Route path="/client/reports" element={<RequireAuth><RoleGate><ClientSLAReports /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Director → Executive Dashboard */}
      {role === 'director' && (
        <>
          <Route path="/exec" element={<RequireAuth><RoleGate><ExecutiveDashboard /></RoleGate></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><RoleGate><Analytics /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Shared routes for operational roles */}
      {(role === 'org_admin' || role === 'dispatcher' || role === 'super_admin') && (
        <>
          <Route path="/objects" element={<RequireAuth><RoleGate><Objects /></RoleGate></RequireAuth>} />
          <Route path="/personnel" element={<RequireAuth><RoleGate><Personnel /></RoleGate></RequireAuth>} />
          <Route path="/incidents" element={<RequireAuth><RoleGate><Incidents /></RoleGate></RequireAuth>} />
          <Route path="/shifts" element={<RequireAuth><RoleGate><Shifts /></RoleGate></RequireAuth>} />
          <Route path="/patrols" element={<RequireAuth><RoleGate><Patrols /></RoleGate></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><RoleGate><Analytics /></RoleGate></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><RoleGate><Personnel /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Chief can VIEW (read-only) shifts, patrols, incidents, analytics */}
      {role === 'chief' && (
        <>
          <Route path="/shifts" element={<RequireAuth><RoleGate><Shifts /></RoleGate></RequireAuth>} />
          <Route path="/patrols" element={<RequireAuth><RoleGate><Patrols /></RoleGate></RequireAuth>} />
          <Route path="/incidents" element={<RequireAuth><RoleGate><Incidents /></RoleGate></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><RoleGate><Analytics /></RoleGate></RequireAuth>} />
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
