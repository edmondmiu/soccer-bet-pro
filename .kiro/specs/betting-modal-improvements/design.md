# Design Document

## Overview

This design enhances the betting system by removing unnecessary pauses from full match betting, integrating pause information directly into betting opportunity modals, implementing smart bet amount memory, and improving the overall betting user experience. The solution builds upon the existing betting.js, pauseManager.js, and gameState.js architecture while introducing new state management for bet amount memory and modal integration patterns.

## Architecture

### Current System Analysis

The current betting system consists of:
- **betting.js**: Handles bet placement, validation, and action bet modals
- **pauseManager.js**: Manages game pause/resume with timeout handling
- **pauseUI.js**: Displays pause overlays and countdown functionality
- **gameState.js**: Centralized state management with observer pattern

### Enhanced Architecture

The improved system will:
1. **Decouple full match betting from pause system** - Remove `pauseGame('FULL_MATCH_BETTING')` calls
2. **Integrate pause display into betting modals** - Embed pause information within action bet modals
3. **Add bet amount memory to game state** - Track last used amounts for different bet types
4. **Enhance modal structure** - Improve visual hierarchy and user experience

## Components and Interfaces

### 1. Bet Amount Memory System

**New State Structure Addition:**
```javascript
// Addition to gameState.js initial state
betAmountMemory: {
    fullMatch: 25.00,     // Default $25
    opportunity: 25.00,   // Default $25
    lastUpdated: null
}
```

**New Functions:**
- `getBetAmountMemory(betType)` - Retrieves last amount for bet type
- `updateBetAmountMemory(betType, amount)` - Stores new amount for bet type
- `getDefaultBetAmount()` - Returns $25 default

### 2. Enhanced Action Bet Modal

**Modified Modal Structure:**
```html
<!-- Enhanced action-bet-modal with integrated pause display -->
<div id="action-bet-modal" class="...">
    <div class="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <!-- Integrated Pause Header -->
        <div class="pause-info-header mb-4 p-3 bg-yellow-900 rounded-lg border border-yellow-600">
            <div class="flex items-center justify-center space-x-2">
                <span class="text-yellow-300">⏸️</span>
                <span class="text-yellow-300 font-semibold">Game Paused - Betting Opportunity</span>
            </div>
        </div>
        
        <!-- Timer Bar (integrated within modal) -->
        <div class="timer-bar-container mb-4">
            <div id="action-bet-timer-bar" class="timer-bar timer-bar-normal"></div>
        </div>
        
        <!-- Existing modal content -->
        <h2 id="action-bet-title">⚡ Action Bet! ⚡</h2>
        <p id="action-bet-main-description">...</p>
        <div id="action-bet-choices">...</div>
    </div>
</div>
```

### 3. Modified Full Match Betting Flow

**Current Flow (with pause):**
```
Click Home/Draw/Away → pauseGame() → Show inline form → Process bet → Resume game
```

**New Flow (without pause):**
```
Click Home/Draw/Away → Show inline form (pre-filled) → Process bet → Continue game
```

### 4. Enhanced Betting Functions

**Modified `showInlineBetSlip()` function:**
- Remove `pauseGame('FULL_MATCH_BETTING')` call
- Add bet amount pre-population from memory
- Maintain existing validation and processing

**Modified `showMultiChoiceActionBet()` function:**
- Keep existing pause functionality for opportunities
- Add integrated pause display within modal
- Remove separate pause overlay dependency
- Add bet amount pre-population

## Data Models

### 1. Enhanced Game State

```javascript
// Extended gameState structure
{
    // ... existing state properties
    betAmountMemory: {
        fullMatch: number,      // Last full match bet amount
        opportunity: number,    // Last opportunity bet amount  
        lastUpdated: timestamp  // When last updated
    },
    currentActionBet: {
        // ... existing properties
        modalState: {
            // ... existing properties
            pauseIntegrated: boolean,  // Whether pause info is shown in modal
            pauseStartTime: timestamp, // When pause began for this opportunity
        }
    }
}
```

### 2. Bet Amount Memory Interface

```javascript
interface BetAmountMemory {
    getBetAmountMemory(betType: 'fullMatch' | 'opportunity'): number
    updateBetAmountMemory(betType: 'fullMatch' | 'opportunity', amount: number): void
    getDefaultBetAmount(): number
    validateBetAmount(amount: number): boolean
}
```

### 3. Enhanced Modal Configuration

```javascript
interface ActionBetModalConfig {
    showPauseInfo: boolean,
    pauseMessage: string,
    timerDuration: number,
    choices: BetChoice[],
    defaultAmount: number,
    betType: string
}
```

## Error Handling

### 1. Bet Amount Memory Errors
- **Invalid amount storage**: Fallback to default $25
- **Memory retrieval failure**: Return default amount with warning
- **State corruption**: Reset memory to defaults

### 2. Modal Integration Errors
- **Pause info display failure**: Continue with modal without pause display
- **Timer integration failure**: Show modal with text countdown
- **DOM element missing**: Create fallback elements or use browser alerts

### 3. Full Match Betting Errors
- **Form pre-population failure**: Show empty form with default amount
- **Bet processing without pause**: Maintain existing error handling
- **State inconsistency**: Log error and continue with current state

### 4. Backward Compatibility
- **Legacy pause overlay**: Hide automatically when new modal is shown
- **Existing bet validation**: Maintain all current validation rules
- **State migration**: Handle missing betAmountMemory gracefully

## Testing Strategy

### 1. Unit Tests

**Bet Amount Memory Tests:**
- Test amount storage and retrieval for both bet types
- Test default amount fallback behavior
- Test state persistence across game sessions
- Test invalid amount handling

**Modal Integration Tests:**
- Test pause info display within action bet modals
- Test timer bar integration and countdown functionality
- Test modal structure and styling consistency
- Test error handling for missing DOM elements

### 2. Integration Tests

**Full Match Betting Flow:**
- Test betting without game pause
- Test amount pre-population from memory
- Test bet processing and state updates
- Test concurrent betting and game events

**Action Betting Flow:**
- Test pause integration within modals
- Test timer countdown and auto-resume
- Test bet amount memory for opportunities
- Test modal minimize/restore functionality

### 3. User Experience Tests

**Betting Flow Consistency:**
- Test visual consistency between bet types
- Test error message consistency
- Test confirmation feedback consistency
- Test responsive design on different screen sizes

**Performance Tests:**
- Test modal display speed with integrated pause info
- Test memory operations performance impact
- Test concurrent betting event handling
- Test state update performance with new memory system

### 4. Regression Tests

**Existing Functionality:**
- Verify all current betting features still work
- Verify pause system works for non-betting scenarios
- Verify power-up system integration remains intact
- Verify match end and scoring functionality

**Error Recovery:**
- Test graceful degradation when new features fail
- Test fallback to current behavior when needed
- Test state recovery after errors
- Test browser compatibility with enhanced modals

## Implementation Phases

### Phase 1: Bet Amount Memory System
1. Add betAmountMemory to gameState initial state
2. Implement memory management functions
3. Add validation and error handling
4. Create unit tests for memory system

### Phase 2: Full Match Betting Enhancement
1. Remove pause calls from showInlineBetSlip()
2. Add amount pre-population logic
3. Update bet processing to store amounts
4. Test full match betting flow

### Phase 3: Action Bet Modal Integration
1. Modify action-bet-modal HTML structure
2. Update showMultiChoiceActionBet() function
3. Integrate pause display within modal
4. Remove dependency on separate pause overlay

### Phase 4: UI/UX Polish
1. Enhance modal styling and visual hierarchy
2. Improve error messages and user feedback
3. Add responsive design improvements
4. Implement accessibility enhancements

### Phase 5: Testing and Validation
1. Comprehensive integration testing
2. User experience validation
3. Performance optimization
4. Browser compatibility testing