# Implementation Plan

- [x] 1. Implement bet amount memory system in game state

  - Add betAmountMemory object to initial state structure in gameState.js
  - Create getBetAmountMemory() function to retrieve last amounts by bet type
  - Create updateBetAmountMemory() function to store new amounts
  - Add validation for bet amounts and fallback to $25 default
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 2. Create bet amount memory management functions

  - Implement getDefaultBetAmount() function returning $25
  - Add validateBetAmount() function with existing validation rules
  - Create helper functions for memory persistence across sessions
  - Add error handling for memory corruption or invalid data
  - _Requirements: 3.4, 3.6, 5.3_

- [x] 3. Remove pause system from full match betting

  - Modify showInlineBetSlip() function to remove pauseGame('FULL_MATCH_BETTING') calls
  - Update full match betting flow to continue game execution normally
  - Ensure bet processing works without pause/resume cycle
  - Test that game timer continues during full match betting
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Add bet amount pre-population to full match betting

  - Modify showInlineBetSlip() to pre-populate amount field with last full match amount
  - Update bet confirmation to store amount in memory using updateBetAmountMemory()
  - Add fallback to default $25 when no previous amount exists
  - Ensure amount validation works with pre-populated values
  - _Requirements: 3.1, 3.3, 3.5_

- [x] 5. Integrate pause information into action bet modals

  - Modify action-bet-modal HTML structure to include pause info header
  - Update showMultiChoiceActionBet() to display "⏸️ Game Paused - Betting Opportunity" message
  - Move timer bar inside modal container instead of separate overlay
  - Remove dependency on separate pause overlay for betting opportunities
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Add bet amount pre-population to action betting

  - Modify showActionBetSlip() to pre-populate with last opportunity amount
  - Update action bet confirmation to store amounts in memory
  - Ensure opportunity bets use separate memory from full match bets
  - Add validation and error handling for pre-populated amounts
  - _Requirements: 3.2, 3.4, 3.6_

- [x] 7. Enhance modal structure and visual hierarchy

  - Update modal CSS to show clear visual hierarchy: pause info → betting options → amount selection
  - Implement consistent Bet/Skip button styling and behavior
  - Add integrated timer bar styling within modal container
  - Ensure responsive design works on different screen sizes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Update game resume logic for integrated modals

  - Modify betting decision handling to properly resume game after modal interactions
  - Ensure timeout scenarios work correctly with integrated pause display
  - Update countdown display to work within modal context
  - Test that game resumes properly after bet placement or timeout
  - _Requirements: 2.5, 4.6_

- [x] 9. Implement consistent error handling and user feedback

  - Add consistent error messages for both full match and action betting
  - Implement uniform confirmation feedback for successful bets
  - Add graceful fallback behavior when modal integration fails
  - Ensure error recovery maintains game state consistency
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Create comprehensive tests for betting improvements
  - Write unit tests for bet amount memory functions
  - Create integration tests for full match betting without pause
  - Test action bet modal with integrated pause display
  - Add tests for error handling and fallback scenarios
  - Verify backward compatibility with existing betting features
  - _Requirements: All requirements validation_
