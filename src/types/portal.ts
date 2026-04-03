export type ProjectPhase = "discovery" | "build" | "scale" | "completed";

export type InvoiceStatus = "concept" | "verstuurd" | "betaald" | "vervallen";

export type UserRole = "admin" | "client";

export interface Profile {
  id: string;
  full_name: string;
  company: string | null;
  email: string;
  role: UserRole;
  is_admin: boolean;
  linked_client_id: string | null;
  created_at: string;
}

// --- Organizations ---

export interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  logo_url: string | null;
  website_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMembership {
  id: string;
  client_id: string;
  is_default: boolean;
  client: { id: string; company_name: string; logo_url: string | null };
}

export interface Invite {
  id: string;
  token: string;
  client_id: string | null;
  used: boolean;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  phase: ProjectPhase;
  start_date: string | null;
  vercel_project_id: string | null;
  live_url: string | null;
  created_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  body: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string | null;
  sender_id: string;
  body: string;
  is_from_studio: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  project_id: string | null;
  name: string;
  file_url: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  number: string;
  description: string | null;
  amount_cents: number;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
}

// --- Discovery Flow ---

export type DiscoveryBriefStatus = "draft" | "submitted" | "reviewed";

export interface DiscoveryBrief {
  id: string;
  client_id: string;
  // Sectie 1: Bedrijf
  business_name: string;
  business_description: string | null;
  website_url: string | null;
  industry: string | null;
  team_size: string | null;
  annual_revenue: string | null;
  ambition: string | null;
  revenue_model: string | null;
  // Sectie 2: Werkwijze & tools
  current_tools: string | null;
  monthly_tool_costs: string | null;
  time_consuming_tasks: string | null;
  admin_hours_weekly: string | null;
  manual_data_transfers: string | null;
  // Sectie 3: Pijnpunten
  top_frustrations: string | null;
  failure_under_pressure: string | null;
  lost_clients_due_to_workflow: string | null;
  should_be_automatic: string | null;
  // Sectie 4: Groei
  growth_blockers: string | null;
  breaks_at_2x_clients: string | null;
  needs_shared_platform: string | null;
  // Sectie 5: Prioriteiten
  automation_priority: string | null;
  desired_timeline: string | null;
  budget_range: string | null;
  dealbreakers: string | null;
  // Sectie 6: Inspiratie (optioneel)
  selected_features: string[];
  inspiration_urls: string[] | null;
  brand_colors: string | null;
  brand_notes: string | null;
  // Extra
  additional_notes: string | null;
  // Meta
  questionnaire_version: number;
  current_step: number;
  status: DiscoveryBriefStatus;
  created_at: string;
  submitted_at: string | null;
}

// --- Review Rounds ---

export type ReviewRoundStatus = "pending" | "active" | "completed";

export interface ReviewRound {
  id: string;
  project_id: string;
  week_number: number;
  title: string;
  description: string | null;
  deployment_url: string;
  focus_areas: string[];
  status: ReviewRoundStatus;
  notified_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// --- Vercel Preview ---

export interface VercelDeployment {
  uid: string;
  url: string;
  state: "BUILDING" | "READY" | "ERROR" | "QUEUED" | "CANCELED";
  created: number;
  meta?: { githubCommitMessage?: string };
}

// --- Preview Feedback ---

export type FeedbackCategory =
  | "design"
  | "functionaliteit"
  | "content"
  | "technisch"
  | "algemeen";

export type FeedbackStatus = "open" | "acknowledged" | "resolved";

export interface PreviewFeedback {
  id: string;
  project_id: string;
  client_id: string;
  deployment_url: string;
  body: string;
  review_round_id: string | null;
  rating: number | null;
  category: FeedbackCategory | null;
  screenshot_url: string | null;
  status: FeedbackStatus;
  created_at: string;
}
