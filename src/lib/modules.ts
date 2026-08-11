import {
  Bot, Boxes, CalendarDays, Clock, CreditCard, FileText, Globe,
  Lightbulb, MessageCircle, Route, Sparkles, Star, TrendingUp, Users,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKind, ModuleStatus } from "@/types/portal";

export const MODULE_STATUS: Record<ModuleStatus, { label: string; badge: string }> = {
  live: { label: "Live", badge: "bg-green-bg text-green" },
  building: { label: "In aanbouw", badge: "bg-blue-bg text-blue" },
  planned: { label: "Gepland", badge: "bg-accent-soft text-text-muted" },
  on_hold: { label: "Gepauzeerd", badge: "bg-amber-bg text-amber" },
};

export const MODULE_STATUS_OPTIONS: { value: ModuleStatus; label: string }[] =
  Object.entries(MODULE_STATUS).map(([value, config]) => ({ value: value as ModuleStatus, label: config.label }));

export const MODULE_KIND: Record<ModuleKind, { label: string; badge: string }> = {
  system: { label: "Module", badge: "bg-accent-soft text-text-muted" },
  agent: { label: "Agent", badge: "bg-[#f3e8ff] text-[#7c3aed]" },
};

const ICONS: Record<string, LucideIcon> = {
  Bot, Boxes, CalendarDays, Clock, CreditCard, FileText, Globe,
  Lightbulb, MessageCircle, Route, Sparkles, Star, TrendingUp, Users,
};

export const MODULE_ICON_NAMES = Object.keys(ICONS);

/** Oude records van vóór migratie 010 hebben nog geen `kind`-waarde. */
export function normalizeModuleKind(kind: string | null | undefined): ModuleKind {
  return kind === "agent" ? "agent" : "system";
}

export function moduleIcon(name: string | null | undefined, kind?: ModuleKind): LucideIcon {
  return (name && ICONS[name]) || (normalizeModuleKind(kind) === "agent" ? Bot : Boxes);
}

export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export function formatMonthly(cents: number): string {
  return `${formatEuros(cents)} per maand`;
}
