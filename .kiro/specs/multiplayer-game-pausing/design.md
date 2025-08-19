# Design Document

## Overview

The multiplayer game pausing system provides synchronized game state management across all connected players during betting events. It integrates with the existing game architecture by extending the current state management system and game logic to support pause/resume functionality with real-time multiplayer synchronization.

## Architecture

### Core Components

1. **PauseManager** - Central controller for pause/resume operations
2. **MultiplayerSync** - Handles real-time communication between players
3. **PauseUI** - User interface components for pause state display
4. **GameStateExtension** - Extensions to existing gameState.js for pause data

### Integration Points

- **gameState.js**: Extended to include pause state and player status
- **gameLogic.js**: Modified to respect pause state during tick() operations
- **betting.js**: Triggers pause events when betting opportunities arise
- **ui.js**: Displays pause status and player information

## Components and Interfaces

### PauseManager

```javascript
class PauseManager {
  // Core pause/resume functionality
  pauseGame(reason, timeout = 15000)
  resumeGame()
  
  // Player management
  addPlayer(playerId)
  removePlayer(playerId)
  markPlayerReady(playerId)
  
  // Status checking
  isPaused()
  getAllPlayersReady()
  getRemainingPlayers()
}
```

### MultiplayerSync

```javascript
class MultiplayerSync {
  // Broadcasting pause state
  broadcastPause(reason, timeout)
  broadcastResume()
  broadcastPlayerStatus(playerId, status)
  
  // Receiving updates
  onPauseReceived(callback)
  onResumeReceived(callback)
  onPlayerStatusReceived(callback)
}
```

### PauseUI

```javascript
class PauseUI {
  // Display management
  showPauseOverlay(reason, playerCount)
  updatePlayerCount(remaining)
  showResumeCountdown(seconds)
  hidePauseOverlay()
  
  // Visual effects
  dimGameArea()
  restoreGameArea()
}
```

## Data Models

### Game State Extensions

```javascript
// Addition to existing gameState structure
{
  // ... existing state properties
  pause: {
    active: false,
    reason: null,
    startTime: null,
    timeout: 15000,
    players: {
      'player1': { ready: false, connected: true },
      'player2': { ready: false, connected: true }
    },
    countdown: {
      active: false,
      remaining: 3
    }
  }
}
```

### Pause Event Structure

```javascript
{
  type: 'PAUSE_EVENT',
  reason: 'BETTING_OPPORTUNITY',
  timeout: 15000,
  timestamp: Date.now(),
  playersRequired: ['player1', 'player2']
}
```

### Player Status Structure

```javascript
{
  playerId: 'player1',
  ready: false,
  connected: true,
  lastActivity: Date.now()
}
```

## Error Handling

### Connection Issues

- **Player Disconnection**: Continue pause for remaining players, remove disconnected player from requirements
- **Network Timeout**: Implement exponential backoff for reconnection attempts
- **Sync Failures**: Fall back to local pause state, attempt re-sync on next event

### Timeout Scenarios

- **Player Non-Response**: Auto-mark as ready after 15-second timeout
- **System Timeout**: Force resume with warning message to all players
- **Partial Response**: Resume when majority of players are ready (configurable threshold)

### State Corruption

- **Invalid Pause State**: Reset to safe default state, log error for debugging
- **Conflicting Commands**: Use timestamp-based resolution, latest command wins
- **Missing Player Data**: Initialize with default values, request sync from other players

## Testing Strategy

### Unit Tests

1. **PauseManager Tests**
   - Pause/resume state transitions
   - Player management operations
   - Timeout handling logic
   - Edge cases (empty player list, invalid states)

2. **MultiplayerSync Tests**
   - Message broadcasting functionality
   - Event handling and callbacks
   - Network error simulation
   - Message ordering and deduplication

3. **State Management Tests**
   - Pause state integration with existing gameState
   - State validation and rollback
   - Observer pattern notifications
   - Deep merge operations with pause data

### Integration Tests

1. **Game Logic Integration**
   - Pause during active match simulation
   - Resume with preserved game state
   - Event processing during pause
   - Timer synchronization

2. **Betting System Integration**
   - Pause triggered by betting events
   - Player decision handling
   - Timeout behavior during betting
   - State consistency across pause/resume

3. **UI Integration**
   - Pause overlay display and hiding
   - Player count updates
   - Countdown animations
   - Visual state transitions

### End-to-End Tests

1. **Multiplayer Scenarios**
   - Two-player pause/resume cycle
   - Player disconnection during pause
   - Simultaneous betting decisions
   - Network latency simulation

2. **Timeout Scenarios**
   - Full timeout with auto-resume
   - Partial player response
   - Mixed ready/not-ready states
   - Rapid pause/resume cycles

3. **Error Recovery**
   - Network interruption during pause
   - Invalid state recovery
   - Sync failure handling
   - UI error state display

## Implementation Phases

### Phase 1: Core Pause Infrastructure
- Extend gameState.js with pause data structures
- Implement PauseManager class
- Add pause/resume hooks to gameLogic.js tick()
- Basic UI overlay for pause state

### Phase 2: Multiplayer Synchronization
- Implement MultiplayerSync class
- Add WebSocket/networking layer for real-time communication
- Player management and status tracking
- Network error handling and recovery

### Phase 3: UI and User Experience
- Complete PauseUI implementation
- Player count display and updates
- Resume countdown animation
- Visual polish and accessibility

### Phase 4: Integration and Testing
- Full integration with betting system
- Comprehensive test suite
- Performance optimization
- Documentation and debugging tools