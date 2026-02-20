import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { PlatformAuthProvider, usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { ActiveOrgProvider } from "@/contexts/ActiveOrgContext";
import { PlatformGate } from "@/components/guard/PlatformGate";
import { roleDefaultRoute } from "@/config/role-navigation";

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
import ObjectDetails from "./pages/ObjectDetails";
import Personnel from "./pages/Personnel";
import IncidentsList from "./pages/IncidentsList";
import IncidentDetails from "./pages/IncidentDetails";
import Shifts from "./pages/Shifts";
import Posts from "./pages/Posts";
import Patrols from "./pages/Patrols";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
// Platform pages — guarded by PlatformGate (platform_roles)
import PlatformRoles from "./pages/platform/PlatformRoles";
import Contracts from "./pages/platform/Contracts";
import SLARules from "./pages/platform/SLARules";
import DispatchRules from "./pages/platform/DispatchRules";
import EscalationRules from "./pages/platform/EscalationRules";
import PlatformIncidents from "./pages/platform/PlatformIncidents";
// Super Admin sub-pages (guarded by RequireAuth + RoleGate, role=super_admin)
import SuperAdminOrgs from "./pages/super-admin/SuperAdminOrgs";
import SuperAdminUsers from "./pages/super-admin/SuperAdminUsers";
import SuperAdminObjects from "./pages/super-admin/SuperAdminObjects";
import SuperAdminIncidents from "./pages/super-admin/SuperAdminIncidents";
import SuperAdminAnalytics from "./pages/super-admin/SuperAdminAnalytics";
import SuperAdminAudit from "./pages/super-admin/SuperAdminAudit";
import SuperAdminRoles from "./pages/super-admin/SuperAdminRoles";
import SuperAdminTracker from "./pages/super-admin/SuperAdminTracker";

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
  const { roleLoading, roleError, role } = useRole();

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
        <div className="rounded-xl border border-border bg-card p-10 text-center max-w-md">
          <p className="text-sm text-muted-foreground">{roleError}</p>
        </div>
      </div>
    );
  }

  // No org role — user may be platform-only; don't render org pages
  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
        <div className="rounded-xl border border-border bg-card p-10 text-center max-w-md">
          <p className="text-sm font-medium text-foreground">Нет организационной роли</p>
          <p className="text-xs text-muted-foreground mt-1">У вас нет привязки к организации. Если у вас есть платформенный доступ, используйте разделы платформы.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function DashboardRedirect() {
  const { role } = useRole();
  const { isPlatformStaff } = usePlatformAuth();
  // If user has no org role but is platform staff, redirect to platform
  if (!role && isPlatformStaff) {
    return <Navigate to="/platform/contracts" replace />;
  }
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={roleDefaultRoute[role]} replace />;
}

/** All /platform/* routes are guarded by PlatformGate — no org_members role dependency */
function PlatformRoutes() {
  return (
    <RequireAuth>
      <PlatformGate>
        <Routes>
          <Route path="roles" element={<PlatformRoles />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="sla" element={<SLARules />} />
          <Route path="dispatch" element={<DispatchRules />} />
          <Route path="escalations" element={<EscalationRules />} />
          <Route path="incidents" element={<PlatformIncidents />} />
          <Route path="*" element={<Navigate to="roles" replace />} />
        </Routes>
      </PlatformGate>
    </RequireAuth>
  );
}

function AppRoutes() {
  const { role } = useRole();
  const { isPlatformStaff } = usePlatformAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<RequireAuth><RoleGate><DashboardRedirect /></RoleGate></RequireAuth>} />

      {/* ── Platform cabinet (source of truth: platform_roles) ── */}
      <Route path="/platform/*" element={<PlatformRoutes />} />

      {/* Super Admin sub-pages — accessible to org super_admin OR platform staff */}
      {(role === 'super_admin' || isPlatformStaff) && (
        <>
          <Route path="/super-admin" element={<RequireAuth><SuperAdminDashboard /></RequireAuth>} />
          <Route path="/super-admin/tracker" element={<RequireAuth><SuperAdminTracker /></RequireAuth>} />
          <Route path="/super-admin/orgs" element={<RequireAuth><SuperAdminOrgs /></RequireAuth>} />
          <Route path="/super-admin/users" element={<RequireAuth><SuperAdminUsers /></RequireAuth>} />
          <Route path="/super-admin/objects" element={<RequireAuth><SuperAdminObjects /></RequireAuth>} />
          <Route path="/super-admin/incidents" element={<RequireAuth><SuperAdminIncidents /></RequireAuth>} />
          <Route path="/super-admin/analytics" element={<RequireAuth><SuperAdminAnalytics /></RequireAuth>} />
          <Route path="/super-admin/audit" element={<RequireAuth><SuperAdminAudit /></RequireAuth>} />
          <Route path="/super-admin/roles" element={<RequireAuth><SuperAdminRoles /></RequireAuth>} />
        </>
      )}

      {/* Dispatcher → Ops Dashboard */}
      {role === 'dispatcher' && (
        <Route path="/ops" element={<RequireAuth><RoleGate><Dashboard /></RoleGate></RequireAuth>} />
      )}

      {/* Org Admin → Admin Dashboard (full config) */}
      {role === 'org_admin' && (
        <Route path="/admin" element={<RequireAuth><RoleGate><AdminDashboard /></RoleGate></RequireAuth>} />
      )}

      {/* Posts — accessible to org_admin and super_admin */}
      {(role === 'org_admin' || role === 'super_admin') && (
        <Route path="/posts" element={<RequireAuth><RoleGate><Posts /></RoleGate></RequireAuth>} />
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
          <Route path="/objects/:id" element={<RequireAuth><RoleGate><ObjectDetails /></RoleGate></RequireAuth>} />
          <Route path="/personnel" element={<RequireAuth><RoleGate><Personnel /></RoleGate></RequireAuth>} />
          <Route path="/incidents" element={<RequireAuth><RoleGate><IncidentsList /></RoleGate></RequireAuth>} />
          <Route path="/incidents/:id" element={<RequireAuth><RoleGate><IncidentDetails /></RoleGate></RequireAuth>} />
          <Route path="/shifts" element={<RequireAuth><RoleGate><Shifts /></RoleGate></RequireAuth>} />
          <Route path="/patrols" element={<RequireAuth><RoleGate><Patrols /></RoleGate></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><RoleGate><Analytics /></RoleGate></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><RoleGate><Personnel /></RoleGate></RequireAuth>} />
        </>
      )}

      {/* Chief can VIEW/ACT on incidents */}
      {role === 'chief' && (
        <>
          <Route path="/shifts" element={<RequireAuth><RoleGate><Shifts /></RoleGate></RequireAuth>} />
          <Route path="/patrols" element={<RequireAuth><RoleGate><Patrols /></RoleGate></RequireAuth>} />
          <Route path="/incidents" element={<RequireAuth><RoleGate><IncidentsList /></RoleGate></RequireAuth>} />
          <Route path="/incidents/:id" element={<RequireAuth><RoleGate><IncidentDetails /></RoleGate></RequireAuth>} />
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
            <PlatformAuthProvider>
              <ActiveOrgProvider>
                <AppRoutes />
              </ActiveOrgProvider>
            </PlatformAuthProvider>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
