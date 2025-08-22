# Requirements Document

## Introduction

This document outlines the requirements for a complete soccer betting game prototype that implements an 8-phase game loop with dual betting systems. The game features continuous full-match betting alongside time-limited action betting opportunities, enhanced by a power-up system that rewards active participation. The prototype will be built with a modular architecture to ensure maintainability and extensibility.

## Requirements

### Requirement 1: Lobby & Match Selection System

**User Story:** As a player, I want to start with virtual currency and automatically join matches, so that I can begin playing the betting game seamlessly.

#### Acceptance Criteria

1. WHEN the game loads THEN the system SHALL initialize the player with $1000 virtual currency
2. WHEN the lobby displays THEN the system SHALL show available simulated soccer matches
3. WHEN the player selects a match THEN the system SHALL automatically join them to the match and initialize it with random team names and odds (Home 1.85, Draw 3.50, Away 4.20)
4. WHEN match initialization occurs THEN the system SHALL operate as a house-based betting system (multiplayer context for future extension, but no multiplayer UI elements required)
5. WHEN joining a match THEN the system SHALL transition directly to the match view

### Requirement 2: Match Timer & Event System

**User Story:** As a player, I want to experience a realistic 90-minute match with timed events, so that the betting feels authentic and engaging.

#### Acceptance Criteria

1. WHEN a match starts THEN the system SHALL begin a 90-minute simulated timer
2. WHEN the match is active THEN the system SHALL display a live dashboard showing current wallet balance, potential winnings, and total amount staked
3. WHEN generating match events THEN the system SHALL create a timeline with 20% chance of goals, 45% chance of action betting opportunities, and 35% chance of commentary events
4. WHEN spacing events THEN the system SHALL place them 8-18 minutes apart for realistic pacing
5. WHEN the timer reaches 90 minutes THEN the system SHALL conclude the match

### Requirement 3: Continuous Full-Match Betting

**User Story:** As a player, I want to place bets on match outcomes at any time during the game, so that I can make strategic decisions throughout the match.

#### Acceptance Criteria

1. WHEN the match is active THEN the system SHALL always display Home/Draw/Away betting buttons
2. WHEN a player clicks any outcome button THEN the system SHALL show an inline betting form without pausing the game
3. WHEN displaying the betting form THEN the system SHALL pre-populate with the last full-match bet amount or $25 default
4. WHEN a bet is placed THEN the system SHALL process it instantly while the game continues running
5. WHEN multiple bets are placed THEN the system SHALL allow bets on the same or different outcomes
6. WHEN full-match betting occurs THEN the system SHALL never pause the game timer

### Requirement 4: Action Betting Pause System

**User Story:** As a player, I want to participate in time-limited betting opportunities during match events, so that I can make quick reactive decisions for higher rewards.

#### Acceptance Criteria

1. WHEN the timeline reaches an action betting event THEN the system SHALL pause the game timer immediately
2. WHEN the game pauses THEN the system SHALL display a betting opportunity modal with "⏸️ Game Paused - Betting Opportunity" header
3. WHEN showing the modal THEN the system SHALL include event description and 3 betting choices with odds
4. WHEN the modal appears THEN the system SHALL start a 10-second countdown timer
5. WHEN a player selects a choice THEN the system SHALL open a bet slip with pre-populated amount (last action bet or $25)
6. WHEN the timer expires OR player skips OR bet is placed THEN the system SHALL close the modal and when the 10-second timer finishes resume the game
7. WHEN the game resumes THEN the system SHALL show a 3-second countdown before continuing

### Requirement 5: Power-Up Reward System

**User Story:** As a player, I want to earn power-ups from successful action bets, so that I can multiply my winnings on full-match bets.

#### Acceptance Criteria

1. WHEN an action bet wins THEN the system SHALL trigger a power-up chance with 80% probability
2. WHEN a power-up is awarded THEN the system SHALL display "⭐ POWER-UP AWARDED: 2x Winnings Multiplier!" message
3. WHEN a power-up is held THEN the system SHALL show a "Use Power-Up" button in the UI
4. WHEN a power-up exists THEN the system SHALL allow only one power-up to be held at a time
5. WHEN a power-up is applied THEN the system SHALL double the potential winnings for any active full-match bet
6. WHEN classic mode is enabled THEN the system SHALL disable all power-up mechanics

### Requirement 6: Event Resolution & Scoring

**User Story:** As a player, I want to see my bets resolve with clear outcomes and updated balances, so that I understand my wins and losses.

#### Acceptance Criteria

1. WHEN 4 minutes pass after an action betting event THEN the system SHALL determine and display the actual outcome
2. WHEN action bets resolve THEN the system SHALL pay out winning bets and forfeit losing bets immediately
3. WHEN goals occur THEN the system SHALL update the score and dynamically adjust match outcome odds based on the new game state
4. WHEN commentary events happen THEN the system SHALL add atmosphere without affecting betting
5. WHEN any bet resolves THEN the system SHALL update results in the event feed

### Requirement 7: Match Conclusion & Summary

**User Story:** As a player, I want to see a comprehensive summary of my match performance, so that I can understand my overall results.

#### Acceptance Criteria

1. WHEN the match reaches 90 minutes THEN the system SHALL resolve all full-match bets based on the final score
2. WHEN calculating winnings THEN the system SHALL use base winnings = stake × odds
3. WHEN a power-up is applied THEN the system SHALL multiply winnings by 2
4. WHEN the match ends THEN the system SHALL display a match summary modal with final score, total winnings/losses, and bet-by-bet breakdown
5. WHEN displaying results THEN the system SHALL update the wallet with the final balance
6. WHEN the summary is shown THEN the system SHALL provide a "Return to Lobby" button

### Requirement 8: Session Management & Continuity

**User Story:** As a player, I want my preferences and progress to persist between matches, so that I have a consistent gaming experience.

#### Acceptance Criteria

1. WHEN returning to the lobby THEN the system SHALL maintain the updated wallet balance
2. WHEN starting a new match THEN the system SHALL persist bet amount memory for the next match
3. WHEN a new match begins THEN the system SHALL reset all betting preferences and power-up eligibility
4. WHEN managing state THEN the system SHALL maintain separate bet amount memory for each betting type
5. WHEN errors occur THEN the system SHALL provide comprehensive error handling and recovery

### Requirement 9: Modular Architecture & User Experience

**User Story:** As a developer, I want the game to be built with modular components, so that it's maintainable and extensible.

#### Acceptance Criteria

1. WHEN building the system THEN the code SHALL be organized into separate modules for each major component
2. WHEN designing interfaces THEN the system SHALL maintain clear visual hierarchy in all betting interfaces
3. WHEN displaying pause information THEN the system SHALL integrate it without separate overlays
4. WHEN styling components THEN the system SHALL use consistent styling and behavior across betting types
5. WHEN designing for mobile THEN the system SHALL be responsive with touch-friendly controls
6. WHEN managing state THEN the system SHALL implement smart state management with comprehensive error handling
7. WHEN key game events occur THEN the system SHALL provide audio feedback using simple sound effects (can use basic tones or simple audio files for prototype)