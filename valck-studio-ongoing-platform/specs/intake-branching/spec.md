## ADDED Requirements

### Requirement: Intake wizard supports conditional question branches
The system SHALL show or hide sub-questions within wizard steps based on the client's previous answers.

#### Scenario: Crew-related questions appear for crew businesses
- **WHEN** client indicates they work with freelance crew/personnel in the business description or workflow step
- **THEN** additional questions appear about crew size, scheduling method, availability management, and compliance tracking

#### Scenario: Event-related questions appear for event businesses
- **WHEN** client indicates they manage events or projects with dates
- **THEN** additional questions appear about event lifecycle, on-site logistics, and client-facing event portals

#### Scenario: Inventory questions appear for asset-based businesses
- **WHEN** client indicates they manage physical assets or inventory
- **THEN** additional questions appear about asset tracking, maintenance schedules, and allocation

#### Scenario: CRM questions appear for client-heavy businesses
- **WHEN** client indicates they manage multiple clients or accounts
- **THEN** additional questions appear about client onboarding, communication preferences, and reporting needs

### Requirement: Branch conditions are evaluated on step transitions
The system SHALL evaluate branching conditions when the user navigates between steps, using answers from all previously completed steps.

#### Scenario: Branches update when navigating back and changing answers
- **WHEN** client goes back to an earlier step and changes an answer that affects branching
- **THEN** subsequent steps update their visible questions accordingly on next navigation

#### Scenario: Skipped branch questions are not required
- **WHEN** a branch's questions are hidden because the condition is not met
- **THEN** those questions are not validated and their absence does not block submission

### Requirement: Design preview step with live mockup
The system SHALL include a design preview step where the client uploads their logo, selects an accent color, and sees a live preview of how their platform dashboard would look.

#### Scenario: Client uploads logo
- **WHEN** client uploads a logo file (PNG, SVG, or JPG, max 2MB)
- **THEN** the logo appears in the preview mockup in the sidebar position

#### Scenario: Client selects accent color
- **WHEN** client picks an accent color from presets or enters a custom hex value
- **THEN** the preview mockup updates in real-time showing buttons, badges, and active states in the chosen color

#### Scenario: Live preview renders a dashboard mockup
- **WHEN** client has selected a color and optionally uploaded a logo
- **THEN** a static dashboard mockup renders below the form showing: sidebar with logo, navigation items, a dashboard header, stat cards, and a table — all styled with the client's chosen accent color against the standard Valck Studio design system (#fafafa bg, Inter font, #111111 text)

### Requirement: Branch answers are stored in discovery_briefs
The system SHALL store branching answers in the existing discovery_briefs table using a JSONB field for branch-specific responses.

#### Scenario: Branch responses are saved on auto-save
- **WHEN** auto-save triggers during a step with branch questions
- **THEN** the branch answers are saved in a `branch_responses` JSONB column on the discovery_briefs table

#### Scenario: Branch responses are loaded on resume
- **WHEN** client resumes an in-progress intake
- **THEN** all branch-specific answers are restored from the branch_responses field

### Requirement: Admin can see branch responses in brief detail
The system SHALL display branch-specific answers in the admin brief detail view, clearly labeled with the branch category.

#### Scenario: Admin reviews a brief with crew branch
- **WHEN** admin opens a brief detail that includes crew branch responses
- **THEN** the crew-specific answers are displayed in a separate "Crew & Personeel" section with all branch questions and answers
