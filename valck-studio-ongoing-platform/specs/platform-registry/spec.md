## ADDED Requirements

### Requirement: Admin can register a client platform
The system SHALL allow admin to register a deployed client platform with URL, accent color, list of active modules, and deployment status.

#### Scenario: Admin registers a new platform
- **WHEN** admin opens a client detail page and adds a platform with live_url, accent_color, modules, and status
- **THEN** the platform record is saved and linked to the client

#### Scenario: Admin updates platform status
- **WHEN** admin changes a platform's status (development/staging/live/maintenance)
- **THEN** the status updates and the client sees the change in their portal

### Requirement: Client can view their platform in the portal
The system SHALL display the client's registered platform prominently in their portal with a direct link, status indicator, and visual identity (accent color preview).

#### Scenario: Client views their platform
- **WHEN** client navigates to "Mijn Platform" in the portal
- **THEN** the system displays the platform name, URL (clickable, opens in new tab), status badge, accent color swatch, and list of active modules

#### Scenario: Client has no registered platform
- **WHEN** no platform is registered for the client
- **THEN** the system displays a message indicating their platform is in development with project status link

### Requirement: Admin can view all platforms overview
The system SHALL display all registered client platforms in the admin panel with status, URL, and client name.

#### Scenario: Admin views platforms overview
- **WHEN** admin navigates to the platforms section
- **THEN** the system displays all platforms with client name, URL, status badge, accent color, and module count

### Requirement: Platform link is visible on portal dashboard
The system SHALL show a quick-access card for the client's platform on the portal dashboard.

#### Scenario: Dashboard shows platform card
- **WHEN** client has a registered platform with status "live"
- **THEN** the dashboard displays a card with platform name, URL link, and "Live" status badge

#### Scenario: Dashboard shows platform in development
- **WHEN** client has a registered platform with status "development"
- **THEN** the dashboard displays a card with "In ontwikkeling" status and no URL link
