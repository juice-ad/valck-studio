import { supabase } from "./supabase";
import { notifyClientMembers } from "./notifications";
import type { DiscoveryBrief, WorkflowStepCategory } from "@/types/portal";

/**
 * Standaard eerste stappen van een traject. De klant ziet deze meteen in
 * "Jouw traject" zodra een project uit de intake is aangemaakt.
 */
export const DEFAULT_STEPS: {
  title: string;
  description: string;
  category: WorkflowStepCategory;
  owner: "client" | "studio";
}[] = [
  { title: "Kennismaking & meeloopdag", description: "We lopen een dag mee om het werk echt te zien.", category: "intake", owner: "studio" },
  { title: "Eerste module kiezen", description: "Samen bepalen we welke module als eerste live gaat.", category: "intake", owner: "client" },
  { title: "Portaal opzetten", description: "Jullie eigen portaal in jullie stijl.", category: "build", owner: "studio" },
  { title: "Module bouwen", description: "De eerste module volledig werkend afbouwen.", category: "build", owner: "studio" },
  { title: "Wekelijkse klik-rondes", description: "Elke week bekijk je de preview en geef je feedback.", category: "build", owner: "client" },
  { title: "Twee weken in gebruik", description: "De module draait, we schaven bij waar nodig.", category: "train", owner: "client" },
  { title: "Oplevering", description: "Werkt alles zoals afgesproken? Dan is het klaar.", category: "scale", owner: "studio" },
];

/**
 * Zaait de standaardroute voor een project. Alleen bruikbaar door een admin
 * (RLS). Bestaat los zodat de admin dit ook achteraf kan doen bij projecten
 * die zonder route zijn aangemaakt.
 */
export async function seedDefaultSteps(projectId: string, clientId: string) {
  const steps = DEFAULT_STEPS.map((s, i) => ({
    project_id: projectId,
    client_id: clientId,
    title: s.title,
    description: s.description,
    category: s.category,
    sequence_order: i,
    owner: s.owner,
    status: i === 0 ? "in_progress" : "pending",
  }));
  await supabase.from("workflow_steps").insert(steps);
}

/**
 * Maakt een project aan vanuit een intake-brief, koppelt de brief, en zaait
 * de eerste workflow-stappen. Alleen bruikbaar door een admin (RLS).
 * Geeft het nieuwe project-id terug.
 */
export async function createProjectFromBrief(
  brief: DiscoveryBrief
): Promise<string | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: brief.client_id,
      title: `${brief.business_name} · Portaal`,
      description: brief.ai_summary?.slice(0, 500) ?? brief.business_description ?? null,
      phase: "build",
      brief_id: brief.id,
      start_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !project) {
    console.error("createProjectFromBrief:", error);
    return null;
  }

  await seedDefaultSteps(project.id, brief.client_id);

  await supabase.from("discovery_briefs").update({ status: "reviewed" }).eq("id", brief.id);

  await notifyClientMembers(brief.client_id, {
    type: "project_created",
    title: "Jullie traject is gestart",
    body: "We hebben jullie project aangemaakt. Bekijk de eerste stappen in Jouw traject.",
    link: "/portal/project",
  });

  return project.id;
}
