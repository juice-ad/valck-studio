import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import type { ClientMembership } from "@/types/portal";

interface ClientContextValue {
  activeClientId: string | null;
  memberships: ClientMembership[];
  loading: boolean;
  switchClient: (clientId: string) => void;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("valck_studio_active_client");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    // Admins don't need client selection
    if (profile.role === "admin") {
      setLoading(false);
      return;
    }

    loadMemberships();
  }, [profile?.id]);

  async function loadMemberships() {
    if (!profile) return;

    try {
      // Load from junction table
      const { data, error } = await supabase
        .from("user_client_memberships")
        .select(
          "id, client_id, is_default, client:clients(id, company_name, logo_url)"
        )
        .eq("user_id", profile.id);

      if (error) {
        // Fallback to linked_client_id
        await fallbackToLinkedClient();
        return;
      }

      const parsed: ClientMembership[] = (data || []).map((row: any) => ({
        id: row.id,
        client_id: row.client_id,
        is_default: row.is_default,
        client: row.client,
      }));

      if (parsed.length === 0) {
        await fallbackToLinkedClient();
        return;
      }

      setMemberships(parsed);

      // Auto-select logic
      const storedId = localStorage.getItem("valck_studio_active_client");
      const storedIsValid =
        storedId && parsed.some((m) => m.client_id === storedId);
      const onOrgPicker = location.pathname === "/portal/select-org";

      if (onOrgPicker) {
        setActiveClientId(null);
        localStorage.removeItem("valck_studio_active_client");
      } else if (storedIsValid) {
        setActiveClientId(storedId);
      } else if (parsed.length === 1) {
        // Auto-select single org
        selectClient(parsed[0].client_id);
      } else {
        // Multiple orgs, no valid selection → redirect to picker
        setActiveClientId(null);
        navigate("/portal/select-org");
      }
    } catch {
      await fallbackToLinkedClient();
    } finally {
      setLoading(false);
    }
  }

  async function fallbackToLinkedClient() {
    if (!profile?.linked_client_id) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    try {
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, company_name, logo_url")
        .eq("id", profile.linked_client_id)
        .maybeSingle();

      if (clientData) {
        const fallback: ClientMembership = {
          id: "fallback",
          client_id: clientData.id,
          is_default: true,
          client: clientData,
        };
        setMemberships([fallback]);
        selectClient(clientData.id);
        return;
      }
    } catch {
      // ignore
    }

    setMemberships([]);
    setLoading(false);
  }

  function selectClient(clientId: string) {
    setActiveClientId(clientId);
    localStorage.setItem("valck_studio_active_client", clientId);
  }

  const switchClient = useCallback((clientId: string) => {
    setActiveClientId(clientId);
    localStorage.setItem("valck_studio_active_client", clientId);
  }, []);

  const value = useMemo(
    () => ({ activeClientId, memberships, loading, switchClient }),
    [activeClientId, memberships, loading, switchClient]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useActiveClient() {
  const ctx = useContext(ClientContext);
  if (!ctx)
    throw new Error(
      "useActiveClient moet binnen ClientProvider gebruikt worden"
    );
  return ctx;
}
