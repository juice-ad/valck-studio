## Why

Valck Studio's client relationship currently ends after the build phase. The app has a solid intake-to-project flow (discovery wizard, messaging, project tracking), but once a platform is live there is no ongoing hub for support, feature requests, or subscription management. This means:

- Clients fall back to email/WhatsApp for support after delivery
- There's no structured way to request new features or large builds
- Monthly subscriptions and invoicing happen outside the platform
- Antoine has no central view of all running client platforms, their health, and ongoing obligations

Building the ongoing relationship layer turns Valck Studio from a project delivery tool into a permanent client hub - directly supporting the recurring revenue model (monthly subscription tiers + pay-per-build).

## What Changes

- **Support ticket system**: Clients can submit and track support tickets. Admin sees all tickets across clients with priority and status tracking.
- **Build requests with mini-intake**: Clients can request large features through a scoped intake flow (description, priority, context). Admin reviews, scopes, and converts to a quoted project phase.
- **Subscription management**: Pricing tiers (basis/groei/premium) tracked per client. Admin manages tier assignments. Clients see their current plan.
- **Platform registry**: Each client's deployed platform is registered (URL, accent color, active modules, deployment status). Visible in both admin overview and client portal.
- **Real-time chat**: Upgrade existing messaging from fetch-based to Supabase Realtime subscriptions. Add typing indicators, read receipts, and profile avatars.
- **Moneybird integration**: Connect invoicing to Moneybird for automated invoice creation, sync, and payment status tracking. Replaces scaffold invoice pages.
- **Intake branching upgrade**: Add conditional branching to the discovery wizard based on business type (crew, events, inventory, CRM). Add a design preview step with live mockup using client's chosen accent color and logo.

## Capabilities

### New Capabilities
- `support-tickets`: Client-facing ticket submission with status tracking, priority, and admin triage. Includes ticket threads (follow-up messages per ticket).
- `build-requests`: Large feature request flow with mini-intake (description, context, desired outcome, priority), admin scoping, and quote/approval workflow.
- `subscription-tiers`: Pricing tier definitions (basis/groei/premium), per-client tier assignment, tier-based feature entitlements display, and admin subscription overview.
- `platform-registry`: Registry of deployed client platforms with URL, accent color, module list, deployment status. Admin sees all platforms; client sees their own with direct link.
- `realtime-chat`: Supabase Realtime upgrade for messaging - live message delivery, typing indicators, read receipts, online presence, profile avatars.
- `moneybird-sync`: Moneybird API integration for invoice creation, payment status sync, and contact sync. Edge Function-based with webhook support.
- `intake-branching`: Conditional question flow in the discovery wizard based on previous answers. Branch detection for business types (crew management, event management, inventory, CRM). Design preview step with live mockup rendering.

### Modified Capabilities
<!-- No existing specs to modify - this is a greenfield openspec setup -->

## Impact

- **Database**: 6+ new tables (tickets, ticket_messages, build_requests, subscriptions, subscription_tiers, platforms) plus modifications to discovery_briefs for branching metadata.
- **Supabase Realtime**: Messages table needs Realtime enabled. New presence channels for online status and typing indicators.
- **Edge Functions**: New functions for Moneybird sync (create contact, create invoice, webhook handler). Existing send functions may need updates for ticket notifications.
- **Frontend**: New portal pages (Tickets, Build Requests, Mijn Platform). New admin pages (Tickets overview, Build Requests pipeline, Subscriptions, Platforms). Upgrade Berichten to real-time. Refactor Discovery wizard for branching.
- **External dependencies**: Moneybird API (OAuth2 or API token). No new frontend npm packages expected beyond what's already installed (Supabase client handles Realtime).
- **Target project**: This change targets the Valck Studio app at `/Users/antoine/Desktop/12. CRM /04. valck studio /01. valck-studio/`, not the Juice Events codebase where this openspec lives. Implementation tasks should be executed in the Valck Studio project directory.
