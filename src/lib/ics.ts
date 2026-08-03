import type { Meeting } from "@/types/portal";

/**
 * Agenda-links zonder koppeling of secrets: een .ics-bestand om te downloaden
 * en een Google-Calendar-template-URL. Werkt in elke agenda-app.
 */

function toICSDate(iso: string): string {
  // 2026-08-10T13:00:00Z -> 20260810T130000Z
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endDate(iso: string, durationMin: number): string {
  return new Date(new Date(iso).getTime() + durationMin * 60000).toISOString();
}

export function meetingToICS(meeting: Meeting): string {
  const dur = meeting.duration_min ?? 30;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Valck Studio//Portaal//NL",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@valckstudio.nl`,
    `DTSTAMP:${toICSDate(meeting.created_at)}`,
    `DTSTART:${toICSDate(meeting.scheduled_at)}`,
    `DTEND:${toICSDate(endDate(meeting.scheduled_at, dur))}`,
    `SUMMARY:${escapeICS(meeting.title)}`,
    meeting.meet_url ? `URL:${meeting.meet_url}` : "",
    meeting.notes ? `DESCRIPTION:${escapeICS(meeting.notes)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function escapeICS(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function downloadICS(meeting: Meeting): void {
  const blob = new Blob([meetingToICS(meeting)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meeting.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(meeting: Meeting): string {
  const dur = meeting.duration_min ?? 30;
  const dates = `${toICSDate(meeting.scheduled_at)}/${toICSDate(endDate(meeting.scheduled_at, dur))}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title,
    dates,
    details: meeting.notes ?? (meeting.meet_url ?? ""),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
