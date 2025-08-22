# Design Document

## Overview

This design document outlines the architecture for a complete soccer betting game prototype that implements an 8-phase game loop with dual betting systems. The game will be built with a modular architecture using vanilla JavaScript ES6 modules, ensuring maintainability and extensibility while providing an engaging betting experience with continuous full-match betting and time-limited action betting opportunities.

The prototype will replace the existing complex codebase with a clean, modular implementation that focuses on the core game loop mechanics without the accumulated technical debt from previous iterations.

## Architecture

### High-Level Architecture

The application follows a modular architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Game Controller                          │
│  (Orchestrates all modules and manages game flow)          │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌──────▼──────┐    ┌─────▼─────┐
│ State  │    │   Event     │    │    UI     │
│Manager │    │  Manager    │    │ Manager   │
└───┬────┘    └──────┬──────┘    └─────┬─────┘
    │                │                 │
┌───▼────┐    ┌──────▼──────┐    ┌─────▼─────┐
│Betting │    │   Timer     │    │  Audio    │
│Manager │    │  Manager    │    │ Manager   │
└────────┘    └─────────────┘    └───────────┘
```

## Design System & Color Scheme

### Color Palette
The game will use a dark mode design with navy blue and forest green accents:

**Primary Colors:**
- **Background**: Navy Blue (#0f172a, #1e293b)
- **Surface**: Dark Navy (#334155, #475569)
- **Primary Accent**: Forest Green (#059669, #10b981)
- **Secondary Accent**: Emerald (#34d399)

**Functional Colors:**
- **Success**: Forest Green (#059669)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#dc2626)
- **Info**: Blue (#3b82f6)

**Text Colors:**
- **Primary Text**: White (#ffffff)
- **Secondary Text**: Light Gray (#e2e8f0)
- **Muted Text**: Gray (#94a3b8)

### Component Styling Examples
```css
/* Betting buttons with forest green accent */
.betting-button {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  border: 2px solid #34d399;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

/* Match screen with navy blue gradient */
.match-screen {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

/* Modal overlays with navy backdrop */
.modal-overlay {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(4px);
}

/* Power-up elements with forest green glow */
.power-up-button {
  background: #059669;
  box-shadow: 0 0 20px rgba(5, 150, 105, 0.5);
  border: 2px solid #34d399;
}
```

### Module Structure

```
src/
├── core/
│   ├── GameController.js      # Main game orchestrator
│   ├── StateManager.js        # Centralized state management
│   └── EventManager.js        # Event system and timeline
├── betting/
│   ├── BettingManager.js      # Betting logic and validation
│   ├── FullMatchBetting.js    # Continuous betting system
│   └── ActionBetting.js       # Pause-based betting system
├── ui/
│   ├── UIManager.js           # UI orchestration and rendering
│   ├── LobbyScreen.js         # Lobby interface
│   ├── MatchScreen.js         # Match interface
│   ├── BettingModal.js        # Betting modals and forms
│   └── MatchSummary.js        # End-of-match summary
├── systems/
│   ├── TimerManager.js        # Match timer and countdown
│   ├── AudioManager.js        # Sound effects
│   └── PowerUpManager.js      # Power-up system
└── utils/
    ├── OddsCalculator.js      # Dynamic odds calculation
    ├── EventGenerator.js      # Match event generation
    └── Validator.js           # Input validation utilities
```

## Components and Interfaces

### Core Components

#### GameController

**Purpose**: Main orchestrator that manages the game flow and coordinates between modules.

**Key Methods**:

- `initialize()` - Sets up all modules and starts the game
- `startMatch(matchData)` - Initiates a new match
- `pauseForActionBet(eventData)` - Handles action betting pauses
- `resumeMatch()` - Resumes match after betting
- `endMatch()` - Concludes match and shows summary

**Dependencies**: All other modules

#### StateManager

**Purpose**: Centralized state management with observer pattern for reactive updates.

**State Structure**:

```javascript
{
  currentScreen: 'lobby' | 'match',
  wallet: number,
  classicMode: boolean,
  match: {
    active: boolean,
    time: number,
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    odds: { home: number, draw: number, away: number },
    timeline: Array<Event>
  },
  bets: {
    fullMatch: Array<Bet>,
    actionBets: Array<Bet>
  },
  powerUp: {
    held: PowerUp | null,
    applied: boolean
  },
  betAmountMemory: {
    fullMatch: number,
    opportunity: number
  }
}
```

**Key Methods**:

- `getState()` - Returns current state (immutable)
- `updateState(updates)` - Updates state with validation
- `subscribe(callback)` - Observer pattern subscription
- `getBetAmountMemory(type)` - Gets remembered bet amounts

#### EventManager

**Purpose**: Manages match timeline generation and event processing.

**Event Types**:

- `GOAL` - Score changes, affects odds
- `ACTION_BET` - Triggers pause and betting opportunity
- `COMMENTARY` - Atmospheric events
- `RESOLUTION` - Resolves action bets

**Key Methods**:

- `generateTimeline()` - Creates match event timeline
- `processNextEvent()` - Handles current timeline event
- `scheduleEvent(event, time)` - Adds event to timeline
- `resolveActionBet(betId, outcome)` - Resolves action betting

### Betting Components

#### BettingManager

**Purpose**: Coordinates all betting operations and validates bets.

**Key Methods**:

- `placeBet(betData)` - Validates and places bets
- `calculateWinnings(bet, outcome)` - Calculates payouts
- `resolveBets(outcome)` - Resolves bets at match end
- `validateBetAmount(amount, wallet)` - Validates bet amounts

#### FullMatchBetting

**Purpose**: Handles continuous betting on match outcomes without pausing.

**Features**:

- Always-visible betting buttons
- Inline betting forms
- Instant bet placement
- Multiple bets on same/different outcomes
- Dynamic odds updates

**Key Methods**:

- `showBettingForm(outcome)` - Shows inline betting form
- `placeBet(outcome, amount)` - Places full-match bet
- `updateOdds(newOdds)` - Updates displayed odds

#### ActionBetting

**Purpose**: Manages time-limited betting opportunities that pause the game.

**Features**:

- 10-second countdown timer
- Modal-based betting interface
- Pause/resume game integration
- Skip betting option
- Bet amount memory

**Key Methods**:

- `showActionBettingModal(eventData)` - Shows betting opportunity
- `startCountdown(duration)` - Starts 10-second timer
- `placeBet(choice, amount)` - Places action bet
- `skipBetting()` - Skips betting opportunity
- `timeoutBetting()` - Handles timeout

### UI Components

#### UIManager

**Purpose**: Orchestrates all UI updates and manages screen transitions.

**Key Methods**:

- `render()` - Renders current screen based on state
- `showScreen(screenName)` - Transitions between screens
- `updateDisplay(stateChanges)` - Updates UI elements
- `showNotification(message, type)` - Shows user notifications

#### LobbyScreen

**Purpose**: Displays available matches and handles match selection.

**Features**:

- Match list with team names and odds
- Wallet balance display
- Classic mode toggle
- Auto-join on selection

#### MatchScreen

**Purpose**: Main match interface with live updates and betting controls.

**Features**:

- Live match timer and score
- Continuous betting buttons
- Event feed
- Wallet and bet tracking
- Power-up display

#### BettingModal

**Purpose**: Handles all betting modal interfaces.

**Modal Types**:

- Action betting opportunity modal
- Bet slip modal
- Match summary modal

**Features**:

- Pre-populated bet amounts
- Real-time odds display
- Countdown timers
- Responsive design

### System Components

#### TimerManager

**Purpose**: Manages match timer, countdowns, and pause/resume functionality.

**Key Methods**:

- `startMatch()` - Starts 90-minute match timer
- `pauseTimer()` - Pauses match timer
- `resumeTimer()` - Resumes match timer
- `startCountdown(duration, callback)` - Starts countdown timer
- `getMatchTime()` - Returns current match time

#### AudioManager

**Purpose**: Provides audio feedback for game events.

**Sound Events**:

- Bet placed
- Action betting opportunity
- Countdown warning
- Bet win/loss
- Power-up awarded
- Match events (goals, cards)

**Key Methods**:

- `playSound(eventType)` - Plays sound for event
- `setVolume(level)` - Adjusts volume
- `mute(enabled)` - Mutes/unmutes audio

#### PowerUpManager

**Purpose**: Manages power-up system and multiplier application.

**Key Methods**:

- `awardPowerUp()` - Awards power-up (80% chance)
- `applyPowerUp(betId)` - Applies 2x multiplier
- `hasPowerUp()` - Checks if player has power-up
- `clearPowerUp()` - Removes used power-up

### Utility Components

#### OddsCalculator

**Purpose**: Calculates dynamic odds based on match state.

**Key Methods**:

- `calculateOdds(matchState)` - Calculates current odds
- `adjustForGoal(team, currentOdds)` - Adjusts odds after goal
- `getInitialOdds()` - Returns starting odds

#### EventGenerator

**Purpose**: Generates realistic match events and timeline.

**Event Distribution**:

- 20% Goals (distributed between teams)
- 45% Action betting opportunities
- 35% Commentary events

**Key Methods**:

- `generateMatchTimeline()` - Creates full match timeline
- `generateActionBetEvent()` - Creates action betting opportunity
- `generateGoalEvent()` - Creates goal event
- `generateCommentaryEvent()` - Creates atmospheric event

## Data Models

### Match Model

```javascript
{
  id: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  time: number, // minutes elapsed
  status: 'pending' | 'active' | 'completed',
  odds: {
    home: number,
    draw: number,
    away: number
  },
  initialOdds: {
    home: number,
    draw: number,
    away: number
  },
  timeline: Array<Event>
}
```

### Event Model

```javascript
{
  id: string,
  type: 'GOAL' | 'ACTION_BET' | 'COMMENTARY' | 'RESOLUTION',
  time: number, // match minute
  description: string,
  data: {
    // Event-specific data
    team?: string,
    player?: string,
    choices?: Array<BettingChoice>,
    outcome?: string
  }
}
```

### Bet Model

```javascript
{
  id: string,
  type: 'fullMatch' | 'actionBet',
  outcome: string,
  stake: number,
  odds: number,
  potentialWinnings: number,
  status: 'pending' | 'won' | 'lost',
  placedAt: number, // timestamp
  resolvedAt?: number, // timestamp
  powerUpApplied: boolean
}
```

### BettingChoice Model (for action bets)

```javascript
{
  id: string,
  description: string,
  odds: number,
  outcome: string
}
```

### PowerUp Model

```javascript
{
  id: string,
  type: '2x_multiplier',
  description: string,
  awardedAt: number, // timestamp
  appliedTo?: string // bet ID
}
```

## Error Handling

### Error Categories

1. **Validation Errors** - Invalid bet amounts, insufficient funds
2. **State Errors** - Invalid state transitions, corrupted data
3. **Timer Errors** - Timer synchronization issues
4. **UI Errors** - DOM manipulation failures
5. **Audio Errors** - Sound loading/playback failures

### Error Handling Strategy

- **Graceful Degradation** - Continue game with limited functionality
- **User Feedback** - Clear error messages and recovery options
- **Logging** - Comprehensive error logging for debugging
- **Recovery** - Automatic recovery where possible

### Error Recovery Mechanisms

```javascript
// Example error handling in BettingManager
try {
  this.placeBet(betData);
} catch (error) {
  console.error("Bet placement failed:", error);
  this.showErrorMessage("Unable to place bet. Please try again.");
  this.restorePreviousState();
}
```

## Testing Strategy

### Unit Testing

- **State Management** - Test state updates and validation
- **Betting Logic** - Test bet placement and resolution
- **Odds Calculation** - Test dynamic odds updates
- **Event Generation** - Test timeline generation

### Integration Testing

- **Game Flow** - Test complete match lifecycle
- **Betting Integration** - Test both betting systems
- **Timer Integration** - Test pause/resume functionality
- **UI Integration** - Test screen transitions and updates

### Browser Testing

- **Cross-browser Compatibility** - Chrome, Firefox, Safari, Edge
- **Mobile Responsiveness** - Touch interactions and responsive design
- **Performance** - Memory usage and timer accuracy

### Test Structure

```javascript
// Example test structure
describe("BettingManager", () => {
  describe("placeBet", () => {
    it("should place valid full-match bet", () => {
      // Test implementation
    });

    it("should reject bet with insufficient funds", () => {
      // Test implementation
    });
  });
});
```

## Performance Considerations

### Memory Management

- **State Cleanup** - Clear unused state data
- **Event Listeners** - Proper cleanup of event listeners
- **Timer Management** - Clear timeouts and intervals

### Optimization Strategies

- **Lazy Loading** - Load modules as needed
- **Event Throttling** - Throttle frequent UI updates
- **Efficient Rendering** - Minimize DOM manipulations

### Performance Monitoring

```javascript
// Performance monitoring example
const performanceMonitor = {
  startTimer: (label) => console.time(label),
  endTimer: (label) => console.timeEnd(label),
  measureMemory: () => performance.memory?.usedJSHeapSize,
};
```

## Security Considerations

### Client-Side Security

- **Input Validation** - Validate all user inputs
- **State Protection** - Prevent state manipulation
- **XSS Prevention** - Sanitize dynamic content

### Data Integrity

- **Bet Validation** - Server-side validation for production
- **State Consistency** - Ensure state remains consistent
- **Audit Trail** - Log all betting actions

## Deployment Strategy

### Development Environment

- **Local Server** - Python HTTP server for development
- **Live Reload** - Automatic refresh during development
- **Debug Mode** - Enhanced logging and error reporting

### Production Considerations

- **Minification** - Minify JavaScript and CSS
- **Compression** - Enable gzip compression
- **CDN** - Use CDN for static assets
- **Monitoring** - Error tracking and performance monitoring

## Browser Compatibility

### Target Browsers

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

### Polyfills and Fallbacks

- **ES6 Modules** - Native support required
- **Fetch API** - Native support or polyfill
- **Audio API** - Graceful degradation for audio features

## Accessibility

### WCAG Compliance

- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Readers** - ARIA labels and descriptions
- **Color Contrast** - Sufficient contrast ratios
- **Focus Management** - Clear focus indicators

### Accessibility Features

```javascript
// Example accessibility implementation
const bettingButton = document.createElement("button");
bettingButton.setAttribute("aria-label", "Place bet on home team win");
bettingButton.setAttribute("role", "button");
```

## Internationalization

### Text Management

- **String Constants** - Centralized text management
- **Dynamic Content** - Template-based text generation
- **Number Formatting** - Locale-aware number formatting

### Future Considerations

- **Multi-language Support** - Prepare for localization
- **Currency Formatting** - Support different currencies
- **Date/Time Formatting** - Locale-aware formatting
