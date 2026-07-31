import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/guards/ProtectedRoute";
import { Home } from "@/pages/Home";
import { Werkwijze } from "@/pages/Werkwijze";
import { Portfolio } from "@/pages/Portfolio";
import { Prijzen } from "@/pages/Prijzen";
import { Integraties } from "@/pages/Integraties";
import { Login } from "@/pages/portal/Login";
import { Signup } from "@/pages/portal/Signup";
import { OrgPicker } from "@/pages/portal/OrgPicker";
import { Dashboard } from "@/pages/portal/Dashboard";
import { Projecten } from "@/pages/portal/Projecten";
import { ProjectDetail } from "@/pages/portal/ProjectDetail";
import { ReviewDetail } from "@/pages/portal/ReviewDetail";
import { Berichten } from "@/pages/portal/Berichten";
import { Documenten } from "@/pages/portal/Documenten";
import { Facturen } from "@/pages/portal/Facturen";
import { Instellingen } from "@/pages/portal/Instellingen";
import { Discovery } from "@/pages/portal/Discovery";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminClients } from "@/pages/admin/AdminClients";
import { AdminClientDetail } from "@/pages/admin/AdminClientDetail";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { AdminProjecten } from "@/pages/admin/AdminProjecten";
import { AdminProjectDetail } from "@/pages/admin/AdminProjectDetail";
import { AdminBriefs } from "@/pages/admin/AdminBriefs";
import { AdminBriefDetail } from "@/pages/admin/AdminBriefDetail";
import { AdminBerichten } from "@/pages/admin/AdminBerichten";
import { AdminDocumenten } from "@/pages/admin/AdminDocumenten";
import { AdminFacturen } from "@/pages/admin/AdminFacturen";
import { AdminInstellingen } from "@/pages/admin/AdminInstellingen";

function App() {
  return (
    <Routes>
      {/* Publieke routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/werkwijze" element={<Werkwijze />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/integraties" element={<Integraties />} />
        <Route path="/prijzen" element={<Prijzen />} />
        <Route
          path="/voorwaarden"
          element={
            <div className="pt-32 pb-24 px-8 max-w-[720px] mx-auto">
              <h1 className="text-3xl font-bold mb-4">
                Algemene voorwaarden
              </h1>
              <p className="text-text-secondary">Binnenkort beschikbaar.</p>
            </div>
          }
        />
        <Route
          path="/privacy"
          element={
            <div className="pt-32 pb-24 px-8 max-w-[720px] mx-auto">
              <h1 className="text-3xl font-bold mb-4">Privacybeleid</h1>
              <p className="text-text-secondary">Binnenkort beschikbaar.</p>
            </div>
          }
        />
        <Route
          path="/verwerkersovereenkomst"
          element={
            <div className="pt-32 pb-24 px-8 max-w-[720px] mx-auto">
              <h1 className="text-3xl font-bold mb-4">
                Verwerkersovereenkomst
              </h1>
              <p className="text-text-secondary">Binnenkort beschikbaar.</p>
            </div>
          }
        />
      </Route>

      {/* Auth (standalone, geen layout) */}
      <Route path="/portal/login" element={<Login />} />
      <Route path="/portal/signup/:token" element={<Signup />} />

      {/* Portal (beveiligd, alleen client role — admins gaan naar /admin) */}
      <Route element={<PortalLayout />}>
        <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
          <Route path="/portal/select-org" element={<OrgPicker />} />
          <Route path="/portal/dashboard" element={<Dashboard />} />
          <Route path="/portal/discovery" element={<Discovery />} />
          <Route path="/portal/projecten" element={<Projecten />} />
          <Route path="/portal/projecten/:id" element={<ProjectDetail />} />
          <Route
            path="/portal/projecten/:id/review/:reviewId"
            element={<ReviewDetail />}
          />
          <Route path="/portal/berichten" element={<Berichten />} />
          <Route path="/portal/documenten" element={<Documenten />} />
          <Route path="/portal/facturen" element={<Facturen />} />
          <Route path="/portal/instellingen" element={<Instellingen />} />
        </Route>
      </Route>
      {/* Admin (beveiligd, alleen admin role) */}
      <Route element={<AdminLayout />}>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/clients/:id" element={<AdminClientDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/projecten" element={<AdminProjecten />} />
          <Route path="/admin/projecten/:id" element={<AdminProjectDetail />} />
          <Route path="/admin/briefs" element={<AdminBriefs />} />
          <Route path="/admin/briefs/:id" element={<AdminBriefDetail />} />
          <Route path="/admin/berichten" element={<AdminBerichten />} />
          <Route path="/admin/documenten" element={<AdminDocumenten />} />
          <Route path="/admin/facturen" element={<AdminFacturen />} />
          <Route path="/admin/instellingen" element={<AdminInstellingen />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
