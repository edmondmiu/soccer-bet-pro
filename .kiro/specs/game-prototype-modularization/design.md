# Design Document

## Overview

This design outlines the modularization of the soccer betting game prototype from a single HTML file into a well-structured, maintainable codebase. The modularization will separate concerns into distinct files and modules while preserving all existing functionality.

## Architecture

### File Structure
```
game-prototype/
├── index.html                 # Main HTML file (simplified)
├── README.md                  # Project documentation
├── styles/
│   ├── main.css              # Base styles and layout
│   ├── components.css        # Component-specific styles
│   └── animations.css        # Animations and transitions
├── scripts/
│   ├── main.js              # Application entry point and initialization
│   ├── gameState.js         # State management
│   ├── gameLogic.js         # Core game simulation logic
│   ├── betting.js           # Betting system logic
│   ├── ui.js                # UI rendering and DOM manipulation
│   ├── events.js            # Event handling and user interactions
│   └── utils.js             # Utility functions and constants
└── assets/                   # Future assets (images, sounds, etc.)
```

### Module Dependencies
```
main.js
├── gameState.js (state management)
├── gameLogic.js (depends on gameState)
├── betting.js (depends on gameState)
├── ui.js (depends on gameState)
├── events.js (depends on gameState, betting, ui)
└── utils.js (standalone utilities)
```

## Components and Interfaces

### 1. Game State Module (gameState.js)
**Purpose:** Centralized state management for the entire application

**Key Functions:**
- `getInitialState()` - Returns default game state
- `getCurrentState()` - Returns current state
- `updateState(updates)` - Updates state with partial updates
- `resetState()` - Resets to initial state
- `subscribeToStateChanges(callback)` - Observer pattern for state changes

**State Structure:**
```javascript
{
  currentScreen: 'lobby' | 'match',
  wallet: number,
  classicMode: boolean,
  match: { /* match data */ },
  bets: { /* betting data */ },
  powerUp: { /* power-up data */ },
  currentBet: object | null,
  currentActionBet: { /* action bet data */ }
}
```

### 2. Game Logic Module (gameLogic.js)
**Purpose:** Core game simulation and match progression

**Key Functions:**
- `startMatch(matchData)` - Initializes and starts a match
- `tick()` - Processes one game tick
- `processMatchEvent(event)` - Handles match events
- `endMatch()` - Handles match completion
- `generateMatchTimeline(matchData)` - Creates match events
- `updateOdds()` - Updates betting odds based on match state

### 3. Betting Module (betting.js)
**Purpose:** All betting-related functionality

**Key Functions:**
- `placeBet(type, outcome, odds, stake, betType)` - Places a bet
- `resolveBets(betType, result)` - Resolves completed bets
- `calculatePotentialWinnings()` - Calculates potential winnings
- `validateBet(stake)` - Validates bet parameters
- `showActionBet(eventData)` - Displays action betting modal
- `awardPowerUp(type)` - Awards power-ups
- `usePowerUp()` - Applies power-up effects

### 4. UI Module (ui.js)
**Purpose:** All rendering and DOM manipulation

**Key Functions:**
- `render()` - Main render function
- `renderLobby()` - Renders lobby screen
- `renderMatchScreen()` - Renders match screen
- `renderDashboard()` - Updates player dashboard
- `renderBetHistory()` - Updates bet history display
- `renderPowerUp()` - Updates power-up display
- `addEventToFeed(message, className)` - Adds events to feed
- `showModal(modalId)` - Shows specified modal
- `hideModal(modalId)` - Hides specified modal

### 5. Events Module (events.js)
**Purpose:** Event handling and user interactions

**Key Functions:**
- `initializeEventListeners()` - Sets up all event listeners
- `handleBetButtonClick(event)` - Handles bet button clicks
- `handleModalInteractions()` - Handles modal interactions
- `handleNavigationEvents()` - Handles screen navigation
- `handleQuickStakeButtons()` - Handles quick stake selections

### 6. Utils Module (utils.js)
**Purpose:** Utility functions and constants

**Key Functions:**
- `formatCurrency(amount)` - Formats currency display
- `formatTime(seconds)` - Formats time display
- `generateId()` - Generates unique IDs
- `debounce(func, delay)` - Debounce utility
- `MOCK_MATCHES` - Match data constants
- `ANIMATION_CLASSES` - Animation class constants

## Data Models

### Match Model
```javascript
{
  active: boolean,
  time: number,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string,
  timeline: Array<MatchEvent>,
  odds: { home: number, draw: number, away: number },
  initialOdds: { home: number, draw: number, away: number },
  initialWallet: number
}
```

### Bet Model
```javascript
{
  id: string,
  type: 'full-match' | 'action',
  outcome: string,
  stake: number,
  odds: number,
  status: 'PENDING' | 'WON' | 'LOST',
  betType?: string,
  description?: string
}
```

### Match Event Model
```javascript
{
  time: number,
  type: 'GOAL' | 'MULTI_CHOICE_ACTION_BET' | 'RESOLUTION',
  description: string,
  team?: 'HOME' | 'AWAY',
  betType?: string,
  result?: string,
  choices?: Array<string>
}
```

## Error Handling

### State Management Errors
- Validate state updates before applying
- Provide fallback to previous valid state
- Log state transition errors for debugging

### Betting Errors
- Validate bet amounts against wallet balance
- Handle invalid bet parameters gracefully
- Provide user feedback for failed bets

### UI Rendering Errors
- Graceful degradation for missing DOM elements
- Error boundaries for rendering failures
- Fallback content for failed renders

### Module Loading Errors
- Check for module dependencies before initialization
- Provide meaningful error messages for missing modules
- Graceful fallback for failed module loads

## Testing Strategy

### Unit Testing
- Test each module in isolation
- Mock dependencies for pure unit tests
- Test edge cases and error conditions
- Validate state transitions

### Integration Testing
- Test module interactions
- Verify event flow between modules
- Test complete user workflows
- Validate data consistency across modules

### Manual Testing
- Compare functionality with original prototype
- Test all user interactions
- Verify visual consistency
- Test responsive behavior

### Performance Testing
- Measure module loading times
- Monitor memory usage
- Test with extended gameplay sessions
- Validate smooth animations and transitions

## Migration Strategy

### Phase 1: File Separation
1. Extract CSS into separate files
2. Extract JavaScript into main.js
3. Update HTML to reference external files
4. Verify functionality preservation

### Phase 2: JavaScript Modularization
1. Create module files with basic structure
2. Move functions to appropriate modules
3. Implement module interfaces
4. Update dependencies and imports

### Phase 3: State Management
1. Centralize state in gameState module
2. Update all modules to use centralized state
3. Implement state change notifications
4. Remove global state dependencies

### Phase 4: Testing and Refinement
1. Comprehensive testing of all functionality
2. Performance optimization
3. Code cleanup and documentation
4. Final validation against requirements