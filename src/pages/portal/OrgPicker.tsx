import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";

export function OrgPicker() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { memberships, switchClient } = useActiveClient();

  function handleSelect(clientId: string) {
    switchClient(clientId);
    navigate("/portal/overzicht");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-2xl tracking-[-0.5px] text-text mb-2">
            valck
            <span className="font-light text-text-muted ml-1.5">studio</span>
          </h1>
          <p className="text-lg font-semibold text-text mt-4">
            Kies een organisatie
          </p>
          <p className="text-sm text-text-secondary">
            Selecteer het bedrijf waarvoor je wilt inloggen.
          </p>
        </div>

        {/* Org list */}
        <div className="flex flex-col gap-3">
          {memberships.map((membership) => (
            <button
              key={membership.client_id}
              onClick={() => handleSelect(membership.client_id)}
              className="w-full flex items-center gap-4 p-4 bg-bg-white border border-border-light rounded-[12px] hover:border-border hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-accent-soft rounded-[8px] flex items-center justify-center shrink-0 overflow-hidden">
                {membership.client.logo_url ? (
                  <img
                    src={membership.client.logo_url}
                    alt=""
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Building2 size={20} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {membership.client.company_name}
                </p>
                {membership.is_default && (
                  <span className="text-xs text-text-muted">Standaard</span>
                )}
              </div>
              <ChevronRight
                size={18}
                className="text-text-muted group-hover:text-text transition-colors shrink-0"
              />
            </button>
          ))}

          {memberships.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">
                Je bent nog niet gekoppeld aan een organisatie. Neem contact op
                met Valck Studio.
              </p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-2 mx-auto mt-6 text-sm text-text-muted hover:text-text transition-colors"
        >
          <LogOut size={14} />
          Uitloggen
        </button>
      </div>
    </div>
  );
}
