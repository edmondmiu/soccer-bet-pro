# Requirements Document

## Introduction

This feature enhances the betting system user experience by removing unnecessary game pauses from full match betting, integrating pause information directly into betting opportunity modals, implementing smart bet amount memory, and improving the overall betting flow. The improvements focus on making betting more seamless while maintaining clear visual feedback for time-sensitive betting opportunities.

## Requirements

### Requirement 1

**User Story:** As a player, I want to place full match bets without the game pausing, so that I can bet on match outcomes while continuing to watch the game action.

#### Acceptance Criteria

1. WHEN a player clicks on Home/Draw/Away betting options THEN the system SHALL display the inline betting form without pausing the game
2. WHEN the inline betting form is displayed THEN the game timer SHALL continue running normally
3. WHEN a player submits a full match bet THEN the system SHALL process the bet without interrupting game flow
4. WHEN a player cancels the full match betting form THEN the system SHALL hide the form without affecting game state

### Requirement 2

**User Story:** As a player, I want betting opportunity modals to show pause information integrated within the modal, so that I have clear context about the game state and time remaining without separate overlays.

#### Acceptance Criteria

1. WHEN a betting opportunity event occurs THEN the system SHALL pause the game and display a modal with integrated pause information
2. WHEN the betting opportunity modal is displayed THEN the modal header SHALL show "⏸️ Game Paused - Betting Opportunity" message
3. WHEN the betting opportunity modal is active THEN the system SHALL display a countdown timer within the modal showing time remaining
4. WHEN the betting opportunity modal is displayed THEN the system SHALL NOT show a separate pause overlay
5. WHEN the betting opportunity timer expires OR player makes a decision THEN the system SHALL resume the game with appropriate countdown

### Requirement 3

**User Story:** As a player, I want the system to remember my last bet amounts, so that I don't have to re-enter my preferred betting amounts each time.

#### Acceptance Criteria

1. WHEN a player places a full match bet THEN the system SHALL store the bet amount as the last full match bet amount
2. WHEN a player places a betting opportunity bet THEN the system SHALL store the bet amount as the last opportunity bet amount
3. WHEN a player opens a full match betting form THEN the system SHALL pre-populate the amount field with the last full match bet amount
4. WHEN a player opens a betting opportunity modal THEN the system SHALL pre-populate the amount field with the last opportunity bet amount
5. WHEN no previous bet history exists THEN the system SHALL default to $25 as the initial amount
6. WHEN the game session ends THEN the system SHALL persist bet amount preferences for future sessions

### Requirement 4

**User Story:** As a player, I want improved modal structure and visual hierarchy in betting interfaces, so that I can quickly understand the betting context and make informed decisions.

#### Acceptance Criteria

1. WHEN a betting opportunity modal is displayed THEN the system SHALL show pause information at the top of the modal
2. WHEN a betting opportunity modal is displayed THEN the system SHALL show betting options in the middle section
3. WHEN a betting opportunity modal is displayed THEN the system SHALL show amount selection at the bottom
4. WHEN a betting opportunity modal is displayed THEN the system SHALL include clear Bet/Skip buttons with obvious outcomes
5. WHEN the timer bar is shown in betting modals THEN the system SHALL display it as an integrated visual countdown element
6. WHEN a player interacts with betting forms THEN the system SHALL provide immediate visual feedback for all actions

### Requirement 5

**User Story:** As a player, I want consistent betting behavior between full match and opportunity betting, so that I have a predictable and intuitive betting experience.

#### Acceptance Criteria

1. WHEN betting forms are displayed THEN the system SHALL use consistent styling and layout patterns
2. WHEN bet amounts are entered THEN the system SHALL validate amounts using the same rules for both betting types
3. WHEN betting errors occur THEN the system SHALL display consistent error messages and recovery options
4. WHEN bets are successfully placed THEN the system SHALL provide consistent confirmation feedback
5. WHEN betting interfaces are closed THEN the system SHALL return to the appropriate game state consistently