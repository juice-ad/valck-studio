## ADDED Requirements

### Requirement: Admin can connect Moneybird
The system SHALL allow admin to configure Moneybird integration by entering an API token and administration ID in settings.

#### Scenario: Admin configures Moneybird
- **WHEN** admin navigates to admin settings and enters a Moneybird API token and administration ID
- **THEN** the system validates the token by fetching the administration name and saves the configuration as Edge Function secrets

#### Scenario: Moneybird connection is tested
- **WHEN** admin clicks "Test verbinding"
- **THEN** the system calls the Moneybird API and displays a success or error message

### Requirement: Clients are synced to Moneybird as contacts
The system SHALL sync client data to Moneybird when a client is created or updated in Valck Studio.

#### Scenario: New client syncs to Moneybird
- **WHEN** admin creates a new client with company_name, email, and KVK number
- **THEN** the system creates a corresponding contact in Moneybird and stores the moneybird_contact_id on the client record

#### Scenario: Client update syncs to Moneybird
- **WHEN** admin updates a client's billing details
- **THEN** the system updates the corresponding Moneybird contact

### Requirement: Admin can create invoices via Moneybird
The system SHALL allow admin to create invoices that are automatically synced to Moneybird.

#### Scenario: Admin creates a subscription invoice
- **WHEN** admin creates an invoice for a client's monthly subscription
- **THEN** the system creates a sales invoice in Moneybird with the correct contact, line items, and amount, and stores the moneybird_invoice_id locally

#### Scenario: Admin creates a build request invoice
- **WHEN** admin creates an invoice for a completed build request
- **THEN** the system creates a sales invoice in Moneybird linked to the build request with the quoted amount

### Requirement: Invoice payment status syncs from Moneybird
The system SHALL keep invoice payment status in sync with Moneybird via periodic polling or webhook.

#### Scenario: Invoice is paid in Moneybird
- **WHEN** a Moneybird invoice status changes to "paid"
- **THEN** the local invoice record updates to status "betaald" with the paid_at timestamp

#### Scenario: Invoice status is displayed correctly
- **WHEN** client views their invoices in the portal
- **THEN** each invoice shows the current payment status (concept/verstuurd/betaald/vervallen) synced from Moneybird

### Requirement: Invoice list shows Moneybird data
The system SHALL display invoices in both portal and admin with data from the local database, kept in sync with Moneybird.

#### Scenario: Client views invoice list
- **WHEN** client navigates to Facturen in the portal
- **THEN** the system displays all invoices with number, description, amount (EUR formatted), status badge, due date, and sent date

#### Scenario: Admin views invoice overview
- **WHEN** admin navigates to Facturen in the admin panel
- **THEN** the system displays all invoices across clients with client name, amount, status, due date, and a link to the Moneybird invoice
