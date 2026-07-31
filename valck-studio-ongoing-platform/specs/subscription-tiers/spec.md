## ADDED Requirements

### Requirement: Admin can define subscription tiers
The system SHALL allow admin to create and manage subscription tier definitions with name, description, monthly price, and a list of included features.

#### Scenario: Admin creates a new tier
- **WHEN** admin navigates to subscription settings and creates a tier with name "Groei", price 249.00 EUR, and feature list
- **THEN** the tier is saved and available for assignment to clients

#### Scenario: Admin edits a tier
- **WHEN** admin modifies a tier's price or feature list
- **THEN** the changes are saved; existing client assignments are not affected until explicitly updated

### Requirement: Admin can assign a subscription tier to a client
The system SHALL allow admin to assign a subscription tier to a client with a start date and optional end date.

#### Scenario: Admin assigns a tier to a client
- **WHEN** admin opens a client detail page and selects a subscription tier
- **THEN** a subscription record is created linking the client to the tier with start_date = today

#### Scenario: Admin changes a client's tier
- **WHEN** admin changes a client's subscription tier
- **THEN** the current subscription's end_date is set to today and a new subscription record is created with the new tier

### Requirement: Client can view their current subscription
The system SHALL display the client's active subscription tier on their portal with tier name, monthly price, and included features.

#### Scenario: Client views their subscription
- **WHEN** client navigates to their settings or dashboard
- **THEN** the system displays their current tier name, monthly amount, and a list of included features

#### Scenario: Client has no subscription
- **WHEN** client has no active subscription assigned
- **THEN** the system displays "Geen actief abonnement" with a note to contact Valck Studio

### Requirement: Admin can view subscription overview
The system SHALL display a summary of all active subscriptions with total MRR (Monthly Recurring Revenue).

#### Scenario: Admin views subscriptions overview
- **WHEN** admin navigates to the subscriptions section
- **THEN** the system displays all clients with their current tier, monthly amount, start date, and a total MRR calculation at the top

### Requirement: Subscription data informs dashboard KPIs
The system SHALL include subscription revenue in the admin dashboard financial KPIs.

#### Scenario: Admin dashboard shows MRR
- **WHEN** admin views the admin dashboard
- **THEN** a KPI card displays total MRR from all active subscriptions
