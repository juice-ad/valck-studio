import { useState, type FormEvent } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminInstellingen() {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  // Moneybird settings
  const [mbTesting, setMbTesting] = useState(false);
  const [mbStatus, setMbStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [mbAdminName, setMbAdminName] = useState("");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);

    try {
      await updateProfile({ full_name: fullName.trim() });
      toast.success("Instellingen opgeslagen");
    } catch {
      toast.error("Fout bij opslaan");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestMoneybird() {
    setMbTesting(true);
    setMbStatus("idle");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-client-to-moneybird`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "test_connection" }),
        }
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setMbStatus("success");
        setMbAdminName(result.administration_name ?? "Verbonden");
        toast.success("Moneybird verbinding succesvol");
      } else {
        setMbStatus("error");
        toast.error(result.error ?? "Verbinding mislukt");
      }
    } catch (err) {
      setMbStatus("error");
      toast.error((err as Error).message);
    } finally {
      setMbTesting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Instellingen</h1>

      {/* Profile */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 max-w-lg mb-6">
        <h2 className="text-lg font-semibold text-text mb-4">Profiel</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Naam
            </label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Je volledige naam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              E-mailadres
            </label>
            <Input value={profile?.email ?? ""} disabled />
            <p className="text-xs text-text-muted mt-1">
              Je e-mailadres kan niet worden gewijzigd.
            </p>
          </div>
          <Button
            type="submit"
            disabled={saving || fullName.trim() === profile?.full_name}
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </div>

      {/* Moneybird Integration */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-text mb-2">
          Moneybird Integratie
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          De API token en administration ID worden ingesteld via Supabase Edge
          Function secrets. Gebruik de knop hieronder om de verbinding te testen.
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleTestMoneybird}
            disabled={mbTesting}
          >
            {mbTesting && <Loader2 size={14} className="animate-spin" />}
            Test verbinding
          </Button>

          {mbStatus === "success" && (
            <span className="inline-flex items-center gap-1 text-sm text-green">
              <CheckCircle size={14} />
              {mbAdminName}
            </span>
          )}
          {mbStatus === "error" && (
            <span className="inline-flex items-center gap-1 text-sm text-red-600">
              <XCircle size={14} />
              Verbinding mislukt
            </span>
          )}
        </div>

        <div className="mt-4 p-3 rounded-[8px] bg-accent-soft">
          <p className="text-xs text-text-muted">
            Secrets instellen via Supabase Dashboard → Edge Functions → Secrets:
          </p>
          <ul className="text-xs text-text-secondary mt-1 space-y-0.5 font-mono">
            <li>MONEYBIRD_API_TOKEN</li>
            <li>MONEYBIRD_ADMINISTRATION_ID</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
