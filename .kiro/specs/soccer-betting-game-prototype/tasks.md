# Implementation Plan

- [x] 1. Set up project structure and core interfaces

  - Create clean directory structure for modular architecture
  - Define core interfaces and module exports
  - Set up main HTML file with basic structure
  - Create CSS file with navy blue/forest green color scheme and dark mode styling
  - _Requirements: 9.1, 9.5_

- [x] 2. Implement StateManager module

  - Create StateManager.js with centralized state management
  - Implement observer pattern for reactive state updates
  - Add state validation and error handling
  - Write unit tests for state management functionality
  - _Requirements: 8.4, 9.1_

- [x] 3. Create EventManager and timeline generation

  - Implement EventManager.js for match event coordination
  - Create EventGenerator.js for realistic match timeline creation
  - Implement event distribution logic (20% goals, 45% action bets, 35% commentary)
  - Add event spacing algorithm (8-18 minutes apart)
  - Write tests for event generation and timeline management
  - _Requirements: 2.3, 2.4, 6.4_

- [x] 4. Build TimerManager for match timing

  - Create TimerManager.js for 90-minute match timer
  - Implement pause/resume functionality for action betting
  - Add countdown timer for 10-second action betting windows
  - Create timer synchronization and accuracy validation
  - Write tests for timer functionality and pause/resume cycles
  - _Requirements: 2.1, 2.5, 4.4, 4.6_

- [x] 5. Implement BettingManager and validation

  - Create BettingManager.js for bet coordination and validation
  - Implement bet amount validation against wallet balance
  - Add bet placement and resolution logic
  - Create winnings calculation with power-up multiplier support
  - Write comprehensive tests for betting logic and edge cases
  - _Requirements: 3.4, 5.5, 6.1, 6.2, 8.1_

- [x] 6. Create FullMatchBetting system

  - Implement FullMatchBetting.js for continuous betting without pauses
  - Create always-visible betting buttons for Home/Draw/Away
  - Implement inline betting forms with pre-populated amounts
  - Add instant bet placement while game continues running
  - Support multiple bets on same or different outcomes
  - Write tests for continuous betting functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 7. Build ActionBetting pause-based system

  - Create ActionBetting.js for time-limited betting opportunities
  - Implement 10-second countdown timer with visual feedback
  - Create betting opportunity modal with event descriptions and choices
  - Add skip betting and timeout handling
  - Integrate with TimerManager for pause/resume coordination
  - Write tests for action betting timing and modal behavior
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_

- [x] 8. Implement PowerUpManager system

  - Create PowerUpManager.js for power-up awards and application
  - Implement 80% probability power-up award on action bet wins
  - Add 2x winnings multiplier application to full-match bets
  - Create single power-up holding limitation
  - Add classic mode disable functionality
  - Write tests for power-up probability and multiplier application
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 9. Create OddsCalculator for dynamic odds

  - Implement OddsCalculator.js for real-time odds adjustments
  - Create goal-based odds recalculation algorithm
  - Add initial odds generation (Home 1.85, Draw 3.50, Away 4.20)
  - Implement odds update triggers and validation
  - Write tests for odds calculation accuracy and edge cases
  - _Requirements: 6.3, 1.3_

- [x] 10. Build UIManager and screen coordination

  - Create UIManager.js for UI orchestration and screen transitions
  - Implement screen rendering based on state changes
  - Add notification system for user feedback
  - Apply navy blue/forest green color scheme throughout UI components
  - Create responsive design with mobile touch support
  - Write tests for UI state synchronization and screen transitions
  - _Requirements: 9.2, 9.4_

- [x] 11. Implement LobbyScreen interface

  - Create LobbyScreen.js for match selection interface
  - Display available matches with team names and odds
  - Show wallet balance and classic mode toggle
  - Implement auto-join functionality on match selection
  - Add responsive design for mobile devices
  - Write tests for lobby functionality and match selection
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 12. Create MatchScreen with live updates

  - Implement MatchScreen.js for main match interface
  - Display live match timer, score, and team information
  - Show continuous betting buttons and event feed
  - Add wallet tracking and power-up display
  - Implement real-time state updates and rendering
  - Write tests for match screen updates and betting integration
  - _Requirements: 2.2, 3.1, 5.2, 8.5_

- [x] 13. Build BettingModal components

  - Create BettingModal.js for all betting modal interfaces
  - Implement action betting opportunity modal with countdown
  - Create bet slip modal with pre-populated amounts
  - Add match summary modal with comprehensive results
  - Ensure consistent styling and responsive behavior
  - Write tests for modal behavior and user interactions
  - _Requirements: 4.2, 4.3, 7.4, 7.5, 9.3_

- [x] 14. Implement AudioManager for sound effects

  - Create AudioManager.js for game audio feedback
  - Add sound effects for key events (bets, wins, power-ups, goals)
  - Implement volume control and mute functionality
  - Create fallback for audio loading failures
  - Use simple tones or basic audio files for prototype
  - Write tests for audio playback and error handling
  - _Requirements: 9.7_

- [x] 15. Create bet amount memory system

  - Implement bet amount memory in StateManager
  - Add separate memory for full-match and action betting
  - Create pre-population logic for betting forms
  - Implement memory persistence between matches
  - Add validation for stored amounts and fallback to defaults
  - Write tests for bet amount memory and pre-population
  - _Requirements: 8.2, 8.4_

- [x] 16. Build GameController orchestration

  - Create GameController.js as main game orchestrator
  - Implement match lifecycle management (start, pause, resume, end)
  - Coordinate between all modules and handle dependencies
  - Add error handling and recovery mechanisms
  - Create initialization sequence and module loading
  - Write integration tests for complete game flow
  - _Requirements: 2.1, 4.6, 4.7, 7.1, 8.3_

- [x] 17. Implement event resolution system

  - Add action bet resolution logic 4 minutes after events
  - Create outcome determination and payout processing
  - Implement event feed updates with results
  - Add goal event processing with score and odds updates
  - Create commentary event display without betting impact
  - Write tests for event resolution timing and accuracy
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Create match conclusion and summary

  - Implement match end detection at 90 minutes
  - Add full-match bet resolution based on final score
  - Create comprehensive match summary with all results
  - Calculate final winnings with power-up multipliers
  - Update wallet balance and return to lobby functionality
  - Write tests for match conclusion and result calculation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 19. Add comprehensive error handling

  - Implement error handling across all modules
  - Create graceful degradation for failed components
  - Add user-friendly error messages and recovery options
  - Implement logging system for debugging
  - Create fallback modes for critical failures
  - Write tests for error scenarios and recovery mechanisms
  - _Requirements: 8.5, 9.1_

- [x] 20. Integrate and test complete game flow
  - Wire all modules together in GameController
  - Test complete 8-phase game loop from lobby to match end
  - Validate dual betting systems work independently and together
  - Test session continuity and state persistence
  - Perform cross-browser testing and mobile responsiveness
  - Create end-to-end integration tests for full game experience
  - _Requirements: All requirements integration testing_
