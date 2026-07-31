## ADDED Requirements

### Requirement: Messages are delivered in real-time
The system SHALL deliver new messages instantly to all participants in a conversation without requiring page refresh.

#### Scenario: Client sends a message
- **WHEN** client sends a message in a conversation
- **THEN** the message appears in the admin's view within 1 second without refresh

#### Scenario: Admin sends a message
- **WHEN** admin sends a reply in a conversation
- **THEN** the message appears in the client's view within 1 second without refresh

### Requirement: Typing indicators are displayed
The system SHALL show a typing indicator when the other party is composing a message.

#### Scenario: Client sees admin is typing
- **WHEN** admin starts typing in a conversation
- **THEN** the client sees a "Valck Studio is aan het typen..." indicator below the last message

#### Scenario: Typing indicator disappears
- **WHEN** the typing party stops typing for 3 seconds or sends the message
- **THEN** the typing indicator disappears

### Requirement: Messages have read status
The system SHALL track whether each message has been read by the recipient and display read status.

#### Scenario: Message is marked as read
- **WHEN** recipient opens a conversation containing unread messages
- **THEN** all visible messages are marked as read and the sender sees read confirmation

#### Scenario: Unread count is displayed
- **WHEN** a conversation has unread messages
- **THEN** the conversation list shows an unread badge with the count of unread messages

### Requirement: Online presence is displayed
The system SHALL show online/offline status for conversation participants.

#### Scenario: Client is online
- **WHEN** client has the portal open and is connected
- **THEN** admin sees a green dot next to the client's name in the conversation list

#### Scenario: Client goes offline
- **WHEN** client closes the portal or loses connection
- **THEN** the green dot disappears within 10 seconds

### Requirement: General client channel exists
The system SHALL support a general messaging channel per client that is not tied to a specific project.

#### Scenario: Client sends a general message
- **WHEN** client opens the Berichten page and sends a message without selecting a project
- **THEN** the message is sent in the general channel (project_id = null)

#### Scenario: Admin sees general vs project messages
- **WHEN** admin views conversations
- **THEN** general messages are grouped under the client name, project messages are grouped under the project name

### Requirement: Profile avatars in chat
The system SHALL display user avatars (initials-based) next to messages.

#### Scenario: Message displays sender avatar
- **WHEN** a message is displayed in the chat thread
- **THEN** the sender's initial avatar (first letter of name, colored background) is shown next to the message
