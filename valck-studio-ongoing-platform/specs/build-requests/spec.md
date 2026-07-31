## ADDED Requirements

### Requirement: Client can submit a build request
The system SHALL allow clients to submit a large feature request through a structured mini-intake form with title, description, desired outcome, context/motivation, and priority.

#### Scenario: Client initiates a build request
- **WHEN** client navigates to Build Requests and clicks "Nieuw verzoek"
- **THEN** the system displays a multi-field form: title (required), description (required), desired outcome (required), context/motivation (optional), priority (normaal/hoog)

#### Scenario: Build request is submitted
- **WHEN** client completes and submits the form
- **THEN** the request is saved with status "ingediend", the client sees a confirmation, and the admin receives a notification in the dashboard

### Requirement: Client can track build request status
The system SHALL display all build requests for the client's organization with their current status in the pipeline.

#### Scenario: Client views build requests list
- **WHEN** client navigates to the Build Requests page
- **THEN** the system displays all requests with title, status badge, submission date, and quoted amount (if available)

#### Scenario: Client views build request detail
- **WHEN** client clicks on a build request
- **THEN** the system displays the full request with all submitted fields, current status, admin notes, quoted amount, and a timeline of status changes

### Requirement: Client can approve or decline a quoted build request
The system SHALL allow clients to approve or decline a build request once it has been scoped and quoted by admin.

#### Scenario: Client approves a quote
- **WHEN** client clicks "Akkoord" on a quoted build request
- **THEN** the status changes to "akkoord" and the admin is notified to begin building

#### Scenario: Client declines a quote
- **WHEN** client clicks "Afwijzen" on a quoted build request
- **THEN** the status changes to "afgewezen" and the request is archived

### Requirement: Admin can view and manage all build requests
The system SHALL display all build requests across clients in a pipeline view with drag-and-drop status management.

#### Scenario: Admin views build requests pipeline
- **WHEN** admin navigates to the Build Requests admin page
- **THEN** the system displays requests in columns: ingediend → in_scoping → offerte → akkoord → in_bouw → opgeleverd (plus afgewezen)

#### Scenario: Admin moves a request through the pipeline
- **WHEN** admin drags a request card to a new column or updates status via detail page
- **THEN** the status updates and the change appears in the request timeline

### Requirement: Admin can scope and quote a build request
The system SHALL allow admin to add scoping notes and a quoted amount to a build request.

#### Scenario: Admin adds a quote
- **WHEN** admin opens a build request detail and fills in quoted_amount_cents and scoping_notes
- **THEN** the request status changes to "offerte" and the client sees the quote on their detail page

### Requirement: Build request counts on dashboards
The system SHALL show build request counts on both dashboards.

#### Scenario: Portal dashboard shows active build requests
- **WHEN** client views their dashboard
- **THEN** a stat card displays the count of their active build requests (not afgewezen or opgeleverd)

#### Scenario: Admin dashboard shows pending build requests
- **WHEN** admin views the admin dashboard
- **THEN** a stat card displays the count of build requests awaiting action (ingediend + in_scoping)
