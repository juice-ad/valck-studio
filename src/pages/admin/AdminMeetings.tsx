import { useEffect, useState, type FormEvent } from "react";
import { Plus, Clock, Check, CalendarClock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminModal } from "@/components/admin/AdminModal";
import { notifyClientMembers } from "@/lib/notifications";
import type { Meeting, Client, Project, MeetingType } from "@/types/portal";

const typeLabels: Record<string, string> = {
  intake: "Intakegesprek",
  roadmap: "Roadmap-gesprek",
  meeloopdag: "Meeloopdag",
  review: "Review-gesprek",
};

interface MeetingRow extends Meeting {
  clients: { company_name: string } | null;
}

export function AdminMeetings() {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "", project_id: "", title: "", type: "roadmap" as MeetingType,
    date: "", time: "", duration_min: "30", meet_url: "",
  });

  // Afronden
  const [completing, setCompleting] = useState<string | null>(null);
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [m, c, p] = await Promise.all([
      supabase.from("meetings").select("*, clients(company_name)").order("scheduled_at", { ascending: false }),
      supabase.from("clients").select("*").order("company_name"),
      supabase.from("projects").select("*"),
    ]);
    setMeetings((m.data as MeetingRow[]) ?? []);
    setClients((c.data as Client[]) ?? []);
    setProjects((p.data as Project[]) ?? []);
    setLoading(false);
  }

  async function createMeeting(e: FormEvent) {
    e.preventDefault();
    if (!form.client_id || !form.title.trim() || !form.date || !form.time) return;
    setSaving(true);
    const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();

    await supabase.from("meetings").insert({
      client_id: form.client_id,
      project_id: form.project_id || null,
      title: form.title.trim(),
      type: form.type,
      scheduled_at,
      duration_min: parseInt(form.duration_min) || 30,
      meet_url: form.meet_url.trim() || null,
      status: "planned",
    });

    await notifyClientMembers(form.client_id, {
      type: "meeting_scheduled",
      title: `Nieuwe afspraak: ${form.title.trim()}`,
      body: new Date(scheduled_at).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }),
      link: "/portal/meetings",
    });

    setShowModal(false);
    setForm({ client_id: "", project_id: "", title: "", type: "roadmap", date: "", time: "", duration_min: "30", meet_url: "" });
    setSaving(false);
    loadAll();
  }

  async function completeMeeting(m: MeetingRow) {
    const outcome = (outcomeDrafts[m.id] ?? "").trim();
    setCompleting(m.id);
    await supabase.from("meetings").update({ status: "completed", outcome: outcome || null }).eq("id", m.id);

    // Terugkoppelen naar het project + melding
    if (m.project_id && outcome) {
      await supabase.from("project_updates").insert({
        project_id: m.project_id,
        title: `Afspraken uit ${typeLabels[m.type] ?? "gesprek"}`,
        body: outcome,
      });
    }
    await notifyClientMembers(m.client_id, {
      type: "meeting_completed",
      title: `Gesprek afgerond: ${m.title}`,
      body: outcome || undefined,
      link: m.project_id ? "/portal/overzicht" : "/portal/meetings",
    });

    setCompleting(null);
    setOutcomeDrafts((prev) => ({ ...prev, [m.id]: "" }));
    loadAll();
  }

  const clientProjects = projects.filter((p) => p.client_id === form.client_id);
  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduled_at) >= now && m.status !== "completed" && m.status !== "cancelled");
  const past = meetings.filter((m) => new Date(m.scheduled_at) < now || m.status === "completed");

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Afspraken</h1>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold">
          <Plus size={16} /> Afspraak plannen
        </button>
      </div>

      <h2 className="text-sm font-semibold text-text mb-3">Komend ({upcoming.length})</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-text-muted mb-8">Geen komende afspraken.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {upcoming.map((m) => (
            <div key={m.id} className="rounded-[12px] bg-bg-white border border-border-light p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-soft text-text-secondary">{typeLabels[m.type]}</span>
                    {m.status === "reschedule_requested" && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-bg text-amber flex items-center gap-1">
                        <CalendarClock size={12} /> Klant wil verzetten
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-text">{m.title}</p>
                  <p className="text-xs text-text-muted">{m.clients?.company_name}</p>
                  <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-1">
                    <Clock size={14} />
                    {new Date(m.scheduled_at).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-2">
                <input
                  value={outcomeDrafts[m.id] ?? ""}
                  onChange={(e) => setOutcomeDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="Uitkomst / afspraken (komt in het project + tijdlijn)…"
                  className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm outline-none focus:border-text"
                />
                <button
                  onClick={() => completeMeeting(m)}
                  disabled={completing === m.id}
                  className="inline-flex items-center gap-1.5 bg-green text-white rounded-[8px] px-3 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  <Check size={15} /> Afronden
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-text mb-3">Geweest</h2>
          <div className="flex flex-col gap-2">
            {past.map((m) => (
              <div key={m.id} className="rounded-[10px] bg-bg-white border border-border-light p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{m.title}</p>
                    <p className="text-xs text-text-muted">{m.clients?.company_name} · {new Date(m.scheduled_at).toLocaleDateString("nl-NL")}</p>
                  </div>
                  {m.status === "completed" && <span className="inline-flex items-center gap-1 text-xs font-medium text-green"><Check size={14} /> Afgerond</span>}
                </div>
                {m.outcome && <p className="text-sm text-text-secondary mt-2">{m.outcome}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <AdminModal open={showModal} onClose={() => setShowModal(false)} title="Afspraak plannen">
        <form onSubmit={createMeeting} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Klant *</label>
            <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, project_id: "" })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text">
              <option value="">Kies klant…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          {clientProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Project (optioneel)</label>
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text">
                <option value="">Geen</option>
                {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="bv. Wekelijkse roadmap"
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MeetingType })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text">
                <option value="roadmap">Roadmap-gesprek</option>
                <option value="intake">Intakegesprek</option>
                <option value="meeloopdag">Meeloopdag</option>
                <option value="review">Review-gesprek</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Datum *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Tijd *</label>
              <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Duur (min)</label>
              <input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Video-link (optioneel)</label>
            <input value={form.meet_url} onChange={(e) => setForm({ ...form, meet_url: e.target.value })}
              placeholder="https://meet.google.com/…"
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm outline-none focus:border-text" />
          </div>
          <button type="submit" disabled={saving} className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold disabled:opacity-50">
            {saving ? "Plannen…" : "Afspraak plannen"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
