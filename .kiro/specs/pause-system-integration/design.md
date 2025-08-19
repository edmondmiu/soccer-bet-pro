# Design Document

## Overview

The pause system integration converts the main game from inline JavaScript to a proper ES6 module structure, enabling seamless integration with the existing modular pause system. The design ensures ALL betting events trigger pause functionality while maintaining the existing game architecture and user experience.

## Architecture

### Current State Analysis

**Problems:**
- Main game uses inline `<script>` tags with all JavaScript embedded in HTML
- Pause system built as ES6 modules (`pauseManager.js`, `pauseUI.js`) 
- Module imports fail in inline script context
- Only `MULTI_CHOICE_ACTION_BET` events trigger pause
- No systematic way to ensure all betting events pause the game

**Solution Architecture:**
- Extract inline JavaScript to `scripts/main.js` as ES6 module
- Import existing pause system modules properly
- Create centralized betting event detection in `processMatchEvent()`
- Maintain all existing functionality during conversion

### Module Structure

```
scripts/
├── main.js              (NEW - extracted game logic)
├── gameState.js         (existing - may need pause state updates)
├── pauseManager.js      (existing - pause system core)
├── pauseUI.js           (existing - pause UI components)
├── betting.js           (existing - betting logic)
├── gameLogic.js         (existing - match simulation)
└── utils.js             (existing - utility functions)
```

## Components and Interfaces

### Main Game Module (scripts/main.js)

```javascript
// Import existing modules
import { pauseManager } from './pauseManager.js';
import { pauseUI } from './pauseUI.js';
import { getCurrentState, updateState } from './gameState.js';

// Main game class
export class SoccerBettingGame {
  constructor() {
    this.state = getInitialState();
    this.matchInterval = null;
    this.pauseManager = null;
    this.pauseUI = null;
  }
  
  // Initialize game and pause system
  async initialize() {
    this.pauseManager = pauseManager;
    this.pauseUI = pauseUI;
    await this.pauseManager.initialize();
    await this.pauseUI.initialize();
  }
  
  // Enhanced processMatchEvent with automatic pause detection
  processMatchEvent(event) {
    // Check if event requires betting pause
    if (this.isBettingEvent(event)) {
      this.pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
    }
    
    // Process event normally
    this.handleEventByType(event);
  }
  
  // Centralized betting event detection
  isBettingEvent(event) {
    const bettingEventTypes = [
      'MULTI_CHOICE_ACTION_BET',
      // Future betting events automatically supported
    ];
    return bettingEventTypes.includes(event.type);
  }
}
```

### Enhanced ProcessMatchEvent Logic

```javascript
processMatchEvent(event) {
  // Add to event feed first
  addEventToFeed(event.description);
  
  // Check if this event requires game pause for betting
  if (this.isBettingEvent(event)) {
    this.pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
  }
  
  // Handle event-specific logic
  switch(event.type) {
    case 'GOAL':
      this.handleGoalEvent(event);
      break;
    case 'MULTI_CHOICE_ACTION_BET':
      this.handleActionBettingEvent(event);
      break;
    case 'RESOLUTION':
      this.handleResolutionEvent(event);
      break;
    default:
      // Non-betting events don't pause
      break;
  }
}
```

### Pause System Integration Points

```javascript
// Betting modal integration
showMultiChoiceActionBet(event) {
  // Pause is already triggered by processMatchEvent
  // Just show the modal
  this.displayBettingModal(event);
}

// Resume integration
handleBettingDecision(decision) {
  // Process the betting decision
  this.processBet(decision);
  
  // Resume game through pause system
  this.pauseManager.resumeGame();
}
```

## Data Models

### Module Export Structure

```javascript
// scripts/main.js exports
export class SoccerBettingGame { /* main game class */ }
export function initializeGame() { /* initialization */ }

// Integration with existing modules
import { pauseManager } from './pauseManager.js';
import { pauseUI } from './pauseUI.js';
import { getCurrentState, updateState } from './gameState.js';
```

### Event Classification

```javascript
const EVENT_CLASSIFICATIONS = {
  BETTING_EVENTS: [
    'MULTI_CHOICE_ACTION_BET',
    // Future betting events
  ],
  INFORMATIONAL_EVENTS: [
    'GOAL',
    'COMMENTARY',
    'KICK_OFF'
  ],
  RESOLUTION_EVENTS: [
    'RESOLUTION'
  ]
};
```

## Error Handling

### Module Loading Errors

- **Import Failures**: Graceful fallback to inline functionality if modules fail to load
- **Initialization Errors**: Clear error messages and fallback behavior
- **Pause System Failures**: Game continues without pause if pause system fails

### Conversion Safety

- **Functionality Preservation**: All existing game features must work identically
- **State Management**: Ensure state transitions work correctly with modules
- **Event Handling**: Maintain all existing event processing logic

## Testing Strategy

### Conversion Testing

1. **Functionality Comparison**
   - Test inline version vs modular version side-by-side
   - Verify identical behavior for all game functions
   - Validate state management works correctly

2. **Module Integration Testing**
   - Test pause system imports and initialization
   - Verify pause triggers work for all betting events
   - Test resume functionality and countdown

3. **Event Processing Testing**
   - Test all event types process correctly
   - Verify betting events trigger pause
   - Test non-betting events don't trigger pause

### Regression Testing

1. **Game Flow Testing**
   - Complete match simulation from start to finish
   - Test all betting scenarios (action bets, full match bets)
   - Verify power-up system still works

2. **UI Integration Testing**
   - Test all modals and overlays work correctly
   - Verify pause overlay appears and disappears properly
   - Test countdown animations and timing

## Implementation Phases

### Phase 1: Extract and Modularize (Foundation)
- Extract all inline JavaScript from `game_prototype.html`
- Create `scripts/main.js` with proper ES6 module structure
- Update HTML to use module script tag
- Test that game works identically to inline version

### Phase 2: Integrate Pause System (Core Integration)
- Import `pauseManager` and `pauseUI` modules in main.js
- Initialize pause system on game startup
- Connect pause system to existing game state
- Test basic pause/resume functionality

### Phase 3: Enhance Event Processing (Betting Integration)
- Update `processMatchEvent()` with automatic betting event detection
- Add pause triggers for all betting events
- Test that ALL betting opportunities pause the game
- Verify resume functionality works correctly

### Phase 4: Testing and Validation (Quality Assurance)
- Comprehensive testing of all game functionality
- Regression testing against original inline version
- Performance testing and optimization
- Deploy and test on Firebase hosting

## Success Criteria

✅ **All betting events pause the game automatically**  
✅ **Main game uses proper ES6 module structure**  
✅ **Existing pause system fully integrated and functional**  
✅ **No loss of functionality during conversion**  
✅ **Extensible architecture for future betting features**  
✅ **Works correctly on both local and Firebase hosting**

This design ensures a clean, maintainable solution that fixes the pause system for all betting events while maintaining the quality of the existing codebase.