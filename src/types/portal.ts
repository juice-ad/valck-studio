export type ProjectPhase = "discovery" | "build" | "scale" | "completed";

export type InvoiceStatus = "concept" | "verstuurd" | "betaald" | "vervallen";

export interface Profile {
  id: string;
  full_name: string;
  company: string | null;
  email: string;
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
  business_name: string;
  business_description: string | null;
  website_url: string | null;
  industry: string | null;
  selected_features: string[];
  inspiration_urls: string[] | null;
  brand_colors: string | null;
  brand_notes: string | null;
  additional_notes: string | null;
  budget_range: string | null;
  status: DiscoveryBriefStatus;
  created_at: string;
  submitted_at: string | null;
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

export interface PreviewFeedback {
  id: string;
  project_id: string;
  client_id: string;
  deployment_url: string;
  body: string;
  created_at: string;
}
