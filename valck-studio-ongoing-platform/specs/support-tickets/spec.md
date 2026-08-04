## ADDED Requirements

### Requirement: Client can submit a support ticket
The system SHALL allow clients to create a support ticket from the portal with a subject, description, and priority level (laag/normaal/hoog/urgent).

#### Scenario: Client creates a new ticket
- **WHEN** client navigates to the Tickets page and clicks "Nieuw ticket"
- **THEN** the system displays a form with subject (required), description (required), and priority selector (default: normaal)

#### Scenario: Ticket is submitted successfully
- **WHEN** client fills in the required fields and submits
- **THEN** the ticket is saved with status "open", the client sees a success toast, and the ticket appears in their list

### Requirement: Client can view and track their tickets
The system SHALL display all tickets belonging to the client's organization with status badges and timestamps.

#### Scenario: Client views ticket list
- **WHEN** client navigates to the Tickets page
- **THEN** the system displays all tickets for their organization sorted by most recent, with subject, status badge, priority, and creation date

#### Scenario: Client views ticket detail
- **WHEN** client clicks on a ticket
- **THEN** the system displays the full ticket with description, status, priority, timeline of updates, and a thread of follow-up messages

### Requirement: Client can reply to a ticket
The system SHALL allow clients to add follow-up messages to an existing ticket.

#### Scenario: Client adds a follow-up message
- **WHEN** client types a message in the ticket detail view and submits
- **THEN** the message is added to the ticket thread with the client's name and timestamp

### Requirement: Admin can view all tickets across clients
The system SHALL display all tickets across all clients in the admin panel with filtering and search capabilities.

#### Scenario: Admin views tickets overview
- **WHEN** admin navigates to the Tickets admin page
- **THEN** the system displays all tickets with client name, subject, status, priority, and age, sortable by any column

#### Scenario: Admin filters tickets by status
- **WHEN** admin selects a status filter (open/in_behandeling/opgelost/gesloten)
- **THEN** the list updates to show only tickets matching the selected status

### Requirement: Admin can update ticket status
The system SHALL allow admin to change a ticket's status through its lifecycle: open → in_behandeling → opgelost → gesloten.

#### Scenario: Admin marks ticket as in progress
- **WHEN** admin changes ticket status to "in_behandeling"
- **THEN** the status updates immediately and the change appears in the ticket timeline

#### Scenario: Admin resolves a ticket
- **WHEN** admin changes ticket status to "opgelost"
- **THEN** the status updates and the client sees the resolution on their ticket detail

### Requirement: Admin can reply to tickets
The system SHALL allow admin to post replies on any ticket, visible to the client as studio messages.

#### Scenario: Admin replies to a ticket
- **WHEN** admin types a reply on a ticket detail page and submits
- **THEN** the reply appears in the ticket thread marked as a studio message with timestamp

### Requirement: Ticket counts visible on dashboards
The system SHALL show open ticket counts on both the portal dashboard and admin dashboard.

#### Scenario: Portal dashboard shows open tickets
- **WHEN** client views their dashboard
- **THEN** a stat card displays the count of their open tickets (status: open or in_behandeling)

#### Scenario: Admin dashboard shows total open tickets
- **WHEN** admin views the admin dashboard
- **THEN** a stat card displays the total count of open tickets across all clients
