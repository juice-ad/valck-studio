-- ============================================
-- Valck Studio — Klantportaal Database Setup
-- Voer dit uit in Supabase SQL Editor
-- ============================================

-- 1. Profiles tabel (gekoppeld aan auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  company text,
  email text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Gebruikers zien eigen profiel"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Gebruikers updaten eigen profiel"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: maak automatisch een profiel aan bij registratie
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, company, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'company',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Projects tabel
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text,
  phase text not null default 'discovery'
    check (phase in ('discovery', 'build', 'scale', 'completed')),
  start_date date,
  created_at timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Klanten zien eigen projecten"
  on public.projects for select
  using (auth.uid() = client_id);

create index idx_projects_client_id on public.projects (client_id);


-- 3. Project Updates tabel
create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  title text not null,
  body text,
  created_at timestamptz default now() not null
);

alter table public.project_updates enable row level security;

create policy "Klanten zien updates van eigen projecten"
  on public.project_updates for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_updates.project_id
        and projects.client_id = auth.uid()
    )
  );

create index idx_project_updates_project_id on public.project_updates (project_id);


-- 4. Messages tabel
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete set null,
  sender_id uuid not null references auth.users on delete cascade,
  body text not null,
  is_from_studio boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Klanten zien eigen berichten en studio-berichten"
  on public.messages for select
  using (auth.uid() = sender_id or is_from_studio = true);

create policy "Klanten sturen eigen berichten"
  on public.messages for insert
  with check (auth.uid() = sender_id and is_from_studio = false);

create index idx_messages_sender_id on public.messages (sender_id);


-- 5. Documents tabel
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users on delete cascade,
  project_id uuid references public.projects on delete set null,
  name text not null,
  file_url text not null,
  created_at timestamptz default now() not null
);

alter table public.documents enable row level security;

create policy "Klanten zien eigen documenten"
  on public.documents for select
  using (auth.uid() = client_id);

create index idx_documents_client_id on public.documents (client_id);


-- 6. Invoices tabel
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users on delete cascade,
  number text not null,
  description text,
  amount_cents integer not null default 0,
  status text not null default 'concept'
    check (status in ('concept', 'verstuurd', 'betaald', 'vervallen')),
  due_date date,
  created_at timestamptz default now() not null
);

alter table public.invoices enable row level security;

create policy "Klanten zien eigen facturen"
  on public.invoices for select
  using (auth.uid() = client_id);

create index idx_invoices_client_id on public.invoices (client_id);


-- 7. Discovery Briefs tabel (intake formulier)
create table public.discovery_briefs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users on delete cascade,
  business_name text not null,
  business_description text,
  website_url text,
  industry text,
  selected_features jsonb not null default '[]'::jsonb,
  inspiration_urls text[],
  brand_colors text,
  brand_notes text,
  additional_notes text,
  budget_range text,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reviewed')),
  created_at timestamptz default now() not null,
  submitted_at timestamptz
);

alter table public.discovery_briefs enable row level security;

create policy "select_own" on public.discovery_briefs for select
  using (auth.uid() = client_id);

create policy "insert_own" on public.discovery_briefs for insert
  with check (auth.uid() = client_id);

create policy "update_draft" on public.discovery_briefs for update
  using (auth.uid() = client_id and status = 'draft');

create index idx_discovery_briefs_client on public.discovery_briefs (client_id);


-- 8. Vercel kolommen op projects (voor preview deploys)
alter table public.projects add column if not exists vercel_project_id text;
alter table public.projects add column if not exists live_url text;


-- 9. Preview Feedback tabel
create table public.preview_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  client_id uuid not null references auth.users on delete cascade,
  deployment_url text not null,
  body text not null,
  created_at timestamptz default now() not null
);

alter table public.preview_feedback enable row level security;

create policy "select_own_project" on public.preview_feedback for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = preview_feedback.project_id
        and projects.client_id = auth.uid()
    )
  );

create policy "insert_own_project" on public.preview_feedback for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.projects
      where projects.id = preview_feedback.project_id
        and projects.client_id = auth.uid()
    )
  );

create index idx_preview_feedback_project on public.preview_feedback (project_id);
