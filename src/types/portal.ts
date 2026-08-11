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
  onboarded_at: string | null;
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
  moneybird_contact_id: string | null;
  kvk_number: string | null;
  vat_number: string | null;
  billing_email: string | null;
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
  brief_id: string | null;
  created_at: string;
}

// --- Modules (de onderdelen van een project) ---

export type ModuleStatus = "planned" | "building" | "live" | "on_hold";

/** Systeem-module (het fundament) of agent (draait erop, met maandprijs). */
export type ModuleKind = "system" | "agent";

export interface Module {
  id: string;
  project_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ModuleStatus;
  kind: ModuleKind;
  monthly_price_cents: number | null;
  sequence_order: number;
  preview_url: string | null;
  icon: string | null;
  created_at: string;
}

/** Wat een agent gedaan heeft - voedt de module-pagina en de weekdrop. */
export interface AgentActivity {
  id: string;
  module_id: string;
  client_id: string;
  occurred_on: string;
  summary: string;
  created_at: string;
}

// --- Workflow steps (de ruggengraat van "Jouw traject") ---

export type WorkflowStepCategory =
  | "intake"
  | "build"
  | "integrate"
  | "train"
  | "scale";

export type WorkflowStepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked";

export interface WorkflowStep {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  description: string | null;
  category: WorkflowStepCategory;
  sequence_order: number;
  status: WorkflowStepStatus;
  owner: "client" | "studio";
  due_date: string | null;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
}

// --- Notifications ---

export interface Notification {
  id: string;
  user_id: string;
  client_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// --- Meetings ---

export type MeetingType = "intake" | "roadmap" | "meeloopdag" | "review";
export type MeetingStatus =
  | "planned"
  | "completed"
  | "reschedule_requested"
  | "cancelled";

export interface Meeting {
  id: string;
  project_id: string | null;
  client_id: string;
  brief_id: string | null;
  title: string;
  type: MeetingType;
  scheduled_at: string;
  duration_min: number | null;
  status: MeetingStatus;
  notes: string | null;
  outcome: string | null;
  meet_url: string | null;
  created_at: string;
}

// --- Brief transcripts (context achter de intake) ---

export interface BriefTranscript {
  id: string;
  brief_id: string;
  client_id: string;
  title: string;
  kind: "transcript" | "summary";
  body: string;
  sort_order: number;
  meeting_date: string | null;
  created_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  body: string | null;
  kind: "update" | "drop";
  link: string | null;
  created_at: string;
}

export interface ProjectCost {
  id: string;
  project_id: string;
  client_id: string;
  description: string;
  amount_cents: number;
  is_overrun: boolean;
  sequence_order: number;
  created_at: string;
}

export interface Message {
  id: string;
  client_id: string | null;
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
  // Payment fields (Mollie)
  mollie_payment_id: string | null;
  mollie_payment_link_id: string | null;
  mollie_payment_link_url: string | null;
  paid_at: string | null;
  sent_at: string | null;
  payment_method: string | null;
  line_items: InvoiceLineItem[];
  // Moneybird fields
  moneybird_invoice_id: string | null;
  moneybird_contact_id: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  price_cents: number;
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
  // AI Summary
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
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
  start_date: string | null;
  due_date: string | null;
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
  module_id: string | null;
  rating: number | null;
  category: FeedbackCategory | null;
  screenshot_url: string | null;
  status: FeedbackStatus;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}
