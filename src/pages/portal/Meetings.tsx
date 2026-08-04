import { useEffect, useState } from "react";
import { CalendarPlus, Clock, Video, CalendarClock, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import { downloadICS, googleCalendarUrl } from "@/lib/ics";
import type { Meeting } from "@/types/portal";

const typeLabels: Record<string, string> = {
  intake: "Intakegesprek",
  roadmap: "Roadmap-gesprek",
  meeloopdag: "Meeloopdag",
  review: "Review-gesprek",
};

export function Meetings() {
  const { activeClientId } = useActiveClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClientId) return;
    supabase
      .from("meetings")
      .select("*")
      .eq("client_id", activeClientId)
      .order("scheduled_at", { ascending: true })
      .then(({ data }) => {
        setMeetings((data as Meeting[]) ?? []);
        setLoading(false);
      });
  }, [activeClientId]);

  async function requestReschedule(m: Meeting) {
    await supabase.from("meetings").update({ status: "reschedule_requested" }).eq("id", m.id);
    setMeetings((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "reschedule_requested" } : x)));
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduled_at) >= now && m.status !== "cancelled" && m.status !== "completed");
  const past = meetings.filter((m) => new Date(m.scheduled_at) < now || m.status === "completed");

  if (loading) return <p className="text-sm text-text-muted">Afspraken worden geladen…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-text mb-1">Afspraken</h1>
      <p className="text-text-secondary mb-6">Onze gesprekken tijdens jullie traject.</p>

      <h2 className="text-sm font-semibold text-text mb-3">Komende afspraken</h2>
      {upcoming.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-8 text-sm text-text-muted">
          Nog geen afspraken gepland. We laten het weten zodra er iets in de agenda staat.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {upcoming.map((m) => (
            <div key={m.id} className="rounded-[12px] bg-bg-white border border-border-light p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-soft text-text-secondary">
                      {typeLabels[m.type] ?? m.type}
                    </span>
                    {m.status === "reschedule_requested" && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-bg text-amber">
                        Verzetten aangevraagd
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-text">{m.title}</p>
                  <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-1">
                    <Clock size={14} />
                    {new Date(m.scheduled_at).toLocaleString("nl-NL", {
                      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                    })}
                    {m.duration_min ? ` · ${m.duration_min} min` : ""}
                  </p>
                  {m.meet_url && (
                    <a href={m.meet_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue no-underline hover:underline mt-1.5">
                      <Video size={14} /> Videogesprek openen
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border-light">
                <button
                  onClick={() => downloadICS(m)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-text text-white rounded-[8px] px-3 py-2"
                >
                  <CalendarPlus size={15} /> Zet in agenda
                </button>
                <a
                  href={googleCalendarUrl(m)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-bg border border-border-light text-text rounded-[8px] px-3 py-2 no-underline"
                >
                  Google Agenda
                </a>
                {m.status !== "reschedule_requested" && (
                  <button
                    onClick={() => requestReschedule(m)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text ml-auto"
                  >
                    <CalendarClock size={15} /> Verzetten
                  </button>
                )}
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text">{m.title}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(m.scheduled_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  {m.status === "completed" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green">
                      <Check size={14} /> Afgerond
                    </span>
                  )}
                </div>
                {m.outcome && <p className="text-sm text-text-secondary mt-2">{m.outcome}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
