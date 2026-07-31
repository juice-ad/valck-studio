## 1. Database Schema & Migrations

- [ ] 1.1 Create migration for `tickets` table (id, client_id, subject, description, priority, status, created_by, created_at, updated_at) with RLS policies
- [ ] 1.2 Create migration for `ticket_messages` table (id, ticket_id, sender_id, body, is_from_studio, created_at) with RLS policies
- [ ] 1.3 Create migration for `build_requests` table (id, client_id, title, description, desired_outcome, context, priority, status, scoping_notes, quoted_amount_cents, created_by, created_at, updated_at) with RLS policies
- [ ] 1.4 Create migration for `subscription_tiers` table (id, name, description, price_cents, features JSONB, sort_order, created_at) with admin-only RLS
- [ ] 1.5 Create migration for `subscriptions` table (id, client_id, tier_id, start_date, end_date, created_at) with RLS policies
- [ ] 1.6 Create migration for `platforms` table (id, client_id, name, live_url, accent_color, modules JSONB, status, created_at, updated_at) with RLS policies
- [ ] 1.7 Add `is_read`, `read_at` columns to existing `messages` table. Default existing messages to is_read = true
- [ ] 1.8 Add `branch_responses` JSONB column to existing `discovery_briefs` table
- [ ] 1.9 Add `moneybird_contact_id` column to existing `clients` table
- [ ] 1.10 Enable Supabase Realtime on the `messages` table

## 2. Support Tickets — Portal

- [ ] 2.1 Create `TicketForm` component with subject, description, priority fields
- [ ] 2.2 Create portal `Tickets.tsx` page with ticket list (subject, status badge, priority, date)
- [ ] 2.3 Create portal `TicketDetail.tsx` page with full ticket view, timeline, and message thread
- [ ] 2.4 Add ticket reply form to TicketDetail
- [ ] 2.5 Add Tickets nav item to PortalSidebar
- [ ] 2.6 Add ticket route to App.tsx (`/portal/tickets` and `/portal/tickets/:id`)
- [ ] 2.7 Add open ticket count stat card to portal Dashboard

## 3. Support Tickets — Admin

- [ ] 3.1 Create admin `AdminTickets.tsx` page with DataTable (client, subject, status, priority, age)
- [ ] 3.2 Create admin `AdminTicketDetail.tsx` with status management, reply form, and timeline
- [ ] 3.3 Add status update controls (open → in_behandeling → opgelost → gesloten)
- [ ] 3.4 Add Tickets nav item to AdminSidebar
- [ ] 3.5 Add ticket routes to App.tsx (`/admin/tickets` and `/admin/tickets/:id`)
- [ ] 3.6 Add open ticket count to admin Dashboard KPIs

## 4. Build Requests — Portal

- [ ] 4.1 Create `BuildRequestForm` component with title, description, desired_outcome, context, priority
- [ ] 4.2 Create portal `BuildRequests.tsx` page with request list (title, status, date, quoted amount)
- [ ] 4.3 Create portal `BuildRequestDetail.tsx` page with full request view, status timeline, and quote approval
- [ ] 4.4 Add approve/decline buttons for quoted build requests
- [ ] 4.5 Add Build Requests nav item to PortalSidebar
- [ ] 4.6 Add routes to App.tsx (`/portal/build-requests` and `/portal/build-requests/:id`)
- [ ] 4.7 Add active build request count to portal Dashboard

## 5. Build Requests — Admin

- [ ] 5.1 Create admin `AdminBuildRequests.tsx` page with pipeline columns (ingediend → in_scoping → offerte → akkoord → in_bouw → opgeleverd)
- [ ] 5.2 Create admin `AdminBuildRequestDetail.tsx` with scoping notes, quoted amount input, and status management
- [ ] 5.3 Add drag-and-drop status transitions using @hello-pangea/dnd
- [ ] 5.4 Add Build Requests nav item to AdminSidebar
- [ ] 5.5 Add routes to App.tsx (`/admin/build-requests` and `/admin/build-requests/:id`)
- [ ] 5.6 Add pending build request count to admin Dashboard

## 6. Subscription Tiers

- [ ] 6.1 Create admin `AdminSubscriptions.tsx` page with tier definitions and client assignments overview
- [ ] 6.2 Create tier CRUD form (name, description, price, features list)
- [ ] 6.3 Add tier assignment UI to AdminClientDetail (select tier, set start date)
- [ ] 6.4 Add MRR calculation to admin Dashboard KPI cards
- [ ] 6.5 Add subscription display to portal Instellingen or Dashboard (current tier, price, features)
- [ ] 6.6 Add Subscriptions nav item to AdminSidebar
- [ ] 6.7 Add route to App.tsx (`/admin/subscriptions`)

## 7. Platform Registry

- [ ] 7.1 Create admin platform registration form (name, URL, accent color, modules, status) on AdminClientDetail
- [ ] 7.2 Create admin `AdminPlatforms.tsx` overview page with all platforms
- [ ] 7.3 Create portal `MijnPlatform.tsx` page with platform link, status, accent color swatch, modules list
- [ ] 7.4 Add platform quick-access card to portal Dashboard
- [ ] 7.5 Add Mijn Platform nav item to PortalSidebar
- [ ] 7.6 Add Platforms nav item to AdminSidebar
- [ ] 7.7 Add routes to App.tsx (`/portal/mijn-platform` and `/admin/platforms`)

## 8. Real-time Chat Upgrade

- [ ] 8.1 Create `useRealtimeMessages` hook with Supabase Realtime postgres_changes subscription
- [ ] 8.2 Create `usePresence` hook for online status and typing indicators using Supabase Presence
- [ ] 8.3 Refactor portal `Berichten.tsx` to use real-time hooks instead of fetch-on-load
- [ ] 8.4 Refactor admin `AdminBerichten.tsx` to use real-time hooks
- [ ] 8.5 Add typing indicator UI component ("is aan het typen...")
- [ ] 8.6 Add read receipts — mark messages as read when conversation is opened
- [ ] 8.7 Add unread message count badge to sidebar nav items
- [ ] 8.8 Add online/offline presence dot to conversation list
- [ ] 8.9 Add general channel support (project_id = null) for non-project messages
- [ ] 8.10 Add initials-based avatar component for message sender display

## 9. Moneybird Integration

- [ ] 9.1 Create Supabase Edge Function `moneybird-sync` with Moneybird API client (contacts, invoices)
- [ ] 9.2 Create admin settings UI for Moneybird API token and administration ID configuration
- [ ] 9.3 Add "Test verbinding" button that validates the Moneybird connection
- [ ] 9.4 Add contact sync — create/update Moneybird contact when client is created/updated
- [ ] 9.5 Create invoice creation flow — admin creates invoice → Edge Function creates Moneybird sales invoice
- [ ] 9.6 Build portal `Facturen.tsx` with invoice list (number, description, amount, status, due date)
- [ ] 9.7 Build admin `AdminFacturen.tsx` with invoice overview across clients + create invoice form
- [ ] 9.8 Add invoice payment status sync (polling or webhook from Moneybird)
- [ ] 9.9 Store moneybird_invoice_id on local invoice records for linking

## 10. Intake Branching & Design Preview

- [ ] 10.1 Create `lib/intake-branches.ts` with branch condition definitions per business type (crew, events, inventory, CRM)
- [ ] 10.2 Create `BranchQuestions` component that renders conditional sub-questions based on branch config
- [ ] 10.3 Integrate BranchQuestions into StepWorkflow (business type detection → show relevant branch)
- [ ] 10.4 Integrate BranchQuestions into StepGrowth (scaling-specific branches)
- [ ] 10.5 Update auto-save logic to include branch_responses JSONB field
- [ ] 10.6 Update resume logic to restore branch_responses on load
- [ ] 10.7 Create `DesignPreview` component with live dashboard mockup (sidebar, header, stat cards, table)
- [ ] 10.8 Add logo upload to StepInspiration using Supabase Storage
- [ ] 10.9 Add accent color picker (presets + custom hex) to StepInspiration
- [ ] 10.10 Wire DesignPreview to update in real-time as client changes color/logo
- [ ] 10.11 Update StepSummary to include branch responses grouped by category
- [ ] 10.12 Update AdminBriefDetail to display branch responses in labeled sections
