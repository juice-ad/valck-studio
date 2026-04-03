import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { ProtectedRoute } from "@/guards/ProtectedRoute";
import { Home } from "@/pages/Home";
import { Werkwijze } from "@/pages/Werkwijze";
import { Portfolio } from "@/pages/Portfolio";
import { Prijzen } from "@/pages/Prijzen";
import { Integraties } from "@/pages/Integraties";
import { Login } from "@/pages/portal/Login";
import { Dashboard } from "@/pages/portal/Dashboard";
import { Projecten } from "@/pages/portal/Projecten";
import { ProjectDetail } from "@/pages/portal/ProjectDetail";
import { Berichten } from "@/pages/portal/Berichten";
import { Documenten } from "@/pages/portal/Documenten";
import { Facturen } from "@/pages/portal/Facturen";
import { Discovery } from "@/pages/portal/Discovery";

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

      {/* Login (standalone, geen layout) */}
      <Route path="/portal/login" element={<Login />} />

      {/* Portal (beveiligd) */}
      <Route element={<PortalLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/portal/dashboard" element={<Dashboard />} />
          <Route path="/portal/discovery" element={<Discovery />} />
          <Route path="/portal/projecten" element={<Projecten />} />
          <Route path="/portal/projecten/:id" element={<ProjectDetail />} />
          <Route path="/portal/berichten" element={<Berichten />} />
          <Route path="/portal/documenten" element={<Documenten />} />
          <Route path="/portal/facturen" element={<Facturen />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
