import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { NotificationBell } from "@/components/portal/NotificationBell";

export function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ClientProvider>
      <div className="min-h-screen flex bg-bg">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <PortalSidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative h-full">
              <PortalSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto">
          <PortalHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          {/* Desktop top bar met notificatie-bel */}
          <div className="hidden md:flex items-center justify-end h-14 px-8 border-b border-border-light bg-bg-white">
            <NotificationBell />
          </div>
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ClientProvider>
  );
}
