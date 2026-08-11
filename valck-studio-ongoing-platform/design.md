## Context

Valck Studio is a B2B platform studio app (React 19 + Tailwind v4 + shadcn/ui + Supabase) that manages the full client lifecycle: intake → build → delivery. The app currently has a functional discovery wizard, messaging, project tracking, and admin panel. However, the post-delivery phase is absent - there is no support system, no subscription management, and no way for clients to request features or track their live platform.

The existing codebase lives at `/Users/antoine/Desktop/12. CRM /04. valck studio /01. valck-studio/` with:
- 12 admin pages, 12 portal pages, 8 discovery step components
- Supabase tables: profiles, clients, projects, project_updates, discovery_briefs, review_rounds, preview_feedback, messages, documents, invoices
- Auth with admin/client roles, org-based membership via user_client_memberships
- Messaging already works (fetch-based, per-project threads)
- Invoices table exists but has no functional UI or integration

## Goals / Non-Goals

**Goals:**
- Enable the ongoing client relationship in the portal (support, feature requests, platform access)
- Make invoicing functional via Moneybird integration
- Introduce subscription tier management for recurring revenue tracking
- Upgrade messaging to real-time for a modern chat experience
- Add branching logic to the intake wizard for different business types
- Maintain the existing Valck Studio design handschrift (#111111 accent, Inter font, #fafafa bg)

**Non-Goals:**
- Building a public-facing ticketing system (all access is invite-based)
- Multi-tenant deployment (each client platform remains a separate project)
- Automated platform provisioning (blueprint instantiation remains manual via Claude Code)
- Payment processing (Mollie/Stripe) - invoicing is handled through Moneybird
- Mobile app - the portal is web-only
- Dark mode

## Decisions

### D1: Tickets and Build Requests as separate entities
**Decision:** Use two separate tables (`tickets` for support, `build_requests` for large features) rather than a single unified "requests" table with a type column.

**Rationale:** Tickets have a simple lifecycle (open → in_progress → resolved → closed) while build requests have a complex flow (request → scoping → quoted → approved → building → delivered). Build requests carry financial data (quoted amount, linked invoice), scoping fields, and eventually link to project phases. Mixing these in one table would require too many nullable columns and confusing status enums.

**Alternative considered:** Single `requests` table with `type` discriminator. Rejected because the data shapes and workflows diverge too much.

### D2: Supabase Realtime for chat upgrade
**Decision:** Use Supabase Realtime `postgres_changes` on the messages table for live message delivery. Use Supabase Realtime Presence for typing indicators and online status.

**Rationale:** The Supabase client is already installed and configured. Realtime is a built-in feature that requires no additional infrastructure. The existing messages table and RLS policies remain unchanged - Realtime respects RLS.

**Alternative considered:** Polling at short intervals. Rejected because it provides a worse UX and doesn't support typing indicators.

### D3: Moneybird integration via Edge Function with API token
**Decision:** Use a personal API token (not OAuth2) for Moneybird integration. Edge Functions handle all Moneybird API calls server-side.

**Rationale:** Valck Studio is a single-admin setup - Antoine is the only person who needs Moneybird access. A personal API token is simpler than OAuth2 (no auth flow, no token refresh logic). The token is stored as a Supabase Edge Function secret.

**Alternative considered:** OAuth2 flow. Rejected as over-engineered for a single-admin use case.

### D4: Intake branching via conditional steps array
**Decision:** Keep the current step-based wizard architecture but add conditional rendering within steps based on previous answers. Branch logic is defined in a TypeScript config file (`lib/intake-branches.ts`), not stored in the database.

**Rationale:** The current 8-step wizard with auto-save works well. Rather than rebuilding with a dynamic question engine, we add conditional sub-sections within existing steps. For example, StepWorkflow shows crew-specific questions only if the business description mentions crew/personnel. This keeps the code simple and the UX smooth.

**Alternative considered:** Fully dynamic question engine with questions defined in the database. Rejected because it adds unnecessary complexity - the intake doesn't change frequently enough to warrant a CMS-style approach. Code-defined branches are easier to maintain and test.

### D5: Platform registry as a simple lookup table
**Decision:** A `platforms` table stores metadata about deployed client platforms (URL, accent color, modules list, status). This is manually maintained by admin, not auto-synced with Vercel.

**Rationale:** Each client platform is a completely separate project (separate repo, separate Supabase, separate Vercel). There's no API to auto-detect deployment status across unrelated Vercel projects without complex Vercel API integration per project. Manual registration is sufficient for the current scale (< 10 clients).

**Alternative considered:** Vercel API integration for auto-status. Rejected as premature - would require storing Vercel project IDs and team tokens per client, which adds security surface for minimal gain.

### D6: Subscription tiers as admin-defined configuration
**Decision:** Subscription tiers are defined in a `subscription_tiers` table (name, description, price_cents, features list). Each client gets a `subscriptions` record linking them to a tier with start/end dates. Tier changes are manual (admin action).

**Rationale:** Pricing is still being established and may change per client. A simple table structure allows flexibility without building a full billing engine. Moneybird handles the actual invoicing - the subscription table is for tracking and display only.

### D7: Real-time chat architecture
**Decision:** Upgrade the existing project-based messaging to support both project threads and a general client channel. Add an `is_read` field and `read_at` timestamp per message. Typing indicators via Supabase Presence channels keyed by `client_id`.

**Rationale:** The current messaging model groups messages by `project_id`. For ongoing support, clients need a general communication channel that isn't tied to a specific project. Adding a nullable `project_id` (null = general channel) keeps the existing model intact while enabling broader communication.

## Risks / Trade-offs

- **Supabase Realtime connection limits** → The free tier allows 200 concurrent connections. With < 10 clients this is not an issue. Monitor as client base grows.
- **Moneybird API rate limits** → Moneybird allows 100 requests per 5 minutes. Edge Functions should batch operations and cache responses where possible. For the current scale this is not a concern.
- **Intake branching complexity** → Adding branches increases the number of code paths and makes the wizard harder to test. Mitigate by keeping branches shallow (max 1 level of conditional sub-questions per step) and adding comprehensive test scenarios.
- **Cross-project openspec** → This change lives in the Juice Events openspec directory but targets the Valck Studio codebase. Implementation tasks must clearly reference the target directory. This is a workflow convenience, not an architectural risk.
- **Message migration** → Existing messages lack `is_read` and `read_at` fields. Migration should default existing messages to `is_read = true` to avoid a flood of "unread" indicators on upgrade.

## Open Questions

- **Ticket notifications**: Should ticket status changes trigger email notifications to the client (via Resend), or is in-app notification sufficient for now?
- **Build request quoting**: Should the quoted amount be entered as free text or as structured line items (similar to invoice line items)?
- **Moneybird contact sync**: Should client creation in Valck Studio automatically create a Moneybird contact, or should this be a manual admin action?
