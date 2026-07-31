import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Instellingen() {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Instellingen</h1>

      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 max-w-lg">
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
          <Button type="submit" disabled={saving || fullName.trim() === profile?.full_name}>
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </div>
    </div>
  );
}
