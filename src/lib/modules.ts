import {
  Boxes, Clock, Users, CalendarDays, Route, Sparkles, Star, Globe,
  MessageCircle, TrendingUp, Lightbulb, FileText, CreditCard, Bot, type LucideIcon,
} from "lucide-react";
import type { ModuleKind, ModuleStatus } from "@/types/portal";

/** Status-label, badge-stijl en dot-teken per modulestatus (klant + admin delen dit). */
export const MODULE_STATUS: Record<ModuleStatus, { label: string; badge: string; dot: string }> = {
  live: { label: "Live", badge: "bg-green-bg text-green", dot: "●" },
  building: { label: "In aanbouw", badge: "bg-blue-bg text-blue", dot: "◐" },
  planned: { label: "Gepland", badge: "bg-accent-soft text-text-muted", dot: "○" },
  on_hold: { label: "Gepauzeerd", badge: "bg-amber-bg text-amber", dot: "◌" },
};

export const MODULE_STATUS_OPTIONS: { value: ModuleStatus; label: string }[] = [
  { value: "planned", label: "Gepland" },
  { value: "building", label: "In aanbouw" },
  { value: "live", label: "Live" },
  { value: "on_hold", label: "Gepauzeerd" },
];

export const MODULE_KIND: Record<ModuleKind, { label: string; badge: string }> = {
  system: { label: "Module", badge: "bg-accent-soft text-text-muted" },
  agent: { label: "Agent", badge: "bg-[#f3e8ff] text-[#7c3aed]" },
};

/** Records van vóór migratie 020 hebben nog geen `kind` — behandel die als systeem-module. */
export function normalizeModuleKind(kind: string | null | undefined): ModuleKind {
  return kind === "agent" ? "agent" : "system";
}

/** Kleine, curated icon-map (optioneel `icon`-veld op een module). Val terug op Boxes (systeem) of Bot (agent). */
const ICONS: Record<string, LucideIcon> = {
  Boxes, Clock, Users, CalendarDays, Route, Sparkles, Star, Globe,
  MessageCircle, TrendingUp, Lightbulb, FileText, CreditCard, Bot,
};

export function moduleIcon(name: string | null | undefined, kind?: string | null): LucideIcon {
  return (name && ICONS[name]) || (normalizeModuleKind(kind) === "agent" ? Bot : Boxes);
}

export const MODULE_ICON_NAMES = Object.keys(ICONS);

/** €-notatie voor maandprijzen, bv. "€ 149,00 /maand". */
export function formatMonthly(cents: number) {
  return `${(cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" })} /maand`;
}
