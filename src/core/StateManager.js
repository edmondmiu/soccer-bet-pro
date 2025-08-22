/**
 * StateManager - Centralized state management with observer pattern
 * Provides reactive state updates and validation
 */
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';

export class StateManager {
  constructor() {
    try {
      this.state = this.getInitialState();
      this.observers = new Set();
      this.validators = new Map();
      this.previousStates = [];
      this.maxStateHistory = 10;
      this.setupValidators();
      this.setupErrorRecovery();
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.STATE, {
        context: 'StateManager_constructor',
        component: 'StateManager'
      });
      throw error;
    }
  }

  /**
   * Get initial state structure
   */
  getInitialState() {
    return {
      currentScreen: 'lobby',
      wallet: 1000,
      classicMode: false,
      match: {
        active: false,
        time: 0,
        homeTeam: '',
        awayTeam: '',
        homeScore: 0,
        awayScore: 0,
        odds: { home: 1.85, draw: 3.50, away: 4.20 },
        initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
        timeline: [],
        eventFeed: []
      },
      bets: {
        fullMatch: [],
        actionBets: []
      },
      powerUp: {
        held: null,
        applied: false
      },
      betAmountMemory: {
        fullMatch: 25,
        opportunity: 25
      }
    };
  }

  /**
   * Setup state validators
   */
  setupValidators() {
    this.validators.set('wallet', (value) => {
      if (typeof value !== 'number' || value < 0) {
        throw new Error('Wallet must be a non-negative number');
      }
      return true;
    });

    this.validators.set('currentScreen', (value) => {
      const validScreens = ['lobby', 'match'];
      if (!validScreens.includes(value)) {
        throw new Error(`Invalid screen: ${value}. Must be one of: ${validScreens.join(', ')}`);
      }
      return true;
    });

    this.validators.set('match.time', (value) => {
      if (typeof value !== 'number' || value < 0 || value > 90) {
        throw new Error('Match time must be between 0 and 90 minutes');
      }
      return true;
    });

    this.validators.set('match.homeScore', (value) => {
      if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
        throw new Error('Home score must be a non-negative integer');
      }
      return true;
    });

    this.validators.set('match.awayScore', (value) => {
      if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
        throw new Error('Away score must be a non-negative integer');
      }
      return true;
    });

    this.validators.set('betAmountMemory.fullMatch', (value) => {
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Full match bet amount memory must be a positive number');
      }
      return true;
    });

    this.validators.set('betAmountMemory.opportunity', (value) => {
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Opportunity bet amount memory must be a positive number');
      }
      return true;
    });
  }

  /**
   * Get current state (immutable copy)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Update state with validation and notify observers
   */
  updateState(updates) {
    try {
      // Save current state to history before updating
      this.saveStateToHistory();
      
      const newState = this.mergeState(this.state, updates);
      this.validateStateUpdates(updates);
      
      const previousState = this.getState();
      this.state = newState;
      
      this.notifyObservers(previousState, this.state);
      
      return { success: true };
    } catch (error) {
      const errorResult = errorHandler.handleError(error, ERROR_TYPES.STATE, {
        context: 'StateManager_updateState',
        updates,
        currentState: this.getState()
      }, {
        attemptRecovery: true
      });
      
      if (!errorResult.success) {
        // Try to restore previous state
        this.restorePreviousState();
      }
      
      return errorResult;
    }
  }

  /**
   * Merge state updates with current state
   */
  mergeState(currentState, updates) {
    const newState = JSON.parse(JSON.stringify(currentState));
    
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes('.')) {
        // Handle nested property updates (e.g., 'match.time')
        this.setNestedProperty(newState, key, value);
      } else {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Merge objects
          newState[key] = { ...newState[key], ...value };
        } else {
          // Direct assignment for primitives and arrays
          newState[key] = value;
        }
      }
    }
    
    return newState;
  }

  /**
   * Set nested property using dot notation
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate state updates
   */
  validateStateUpdates(updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (this.validators.has(key)) {
        this.validators.get(key)(value);
      }
    }
  }

  /**
   * Subscribe to state changes (observer pattern)
   */
  subscribe(callback) {
    try {
      if (typeof callback !== 'function') {
        throw new Error('Observer callback must be a function');
      }
      
      this.observers.add(callback);
      
      // Return unsubscribe function
      return () => {
        this.observers.delete(callback);
      };
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.VALIDATION, {
        context: 'StateManager_subscribe',
        callbackType: typeof callback
      });
      throw error;
    }
  }

  /**
   * Notify all observers of state changes
   */
  notifyObservers(previousState, newState) {
    const changes = this.getStateChanges(previousState, newState);
    
    if (Object.keys(changes).length > 0) {
      this.observers.forEach(callback => {
        try {
          callback(newState, previousState, changes);
        } catch (error) {
          errorHandler.handleError(error, ERROR_TYPES.STATE, {
            context: 'StateManager_notifyObservers',
            callback: callback.name || 'anonymous',
            changes
          }, {
            showUserMessage: false // Don't show user message for observer errors
          });
        }
      });
    }
  }

  /**
   * Get differences between states
   */
  getStateChanges(oldState, newState) {
    const changes = {};
    
    const compareObjects = (old, current, path = '') => {
      for (const key in current) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in old)) {
          changes[currentPath] = { from: undefined, to: current[key] };
        } else if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key]) && 
                   typeof old[key] === 'object' && old[key] !== null && !Array.isArray(old[key])) {
          compareObjects(old[key], current[key], currentPath);
        } else if (JSON.stringify(old[key]) !== JSON.stringify(current[key])) {
          changes[currentPath] = { from: old[key], to: current[key] };
        }
      }
    };
    
    compareObjects(oldState, newState);
    return changes;
  }

  /**
   * Get bet amount memory for specific betting type
   */
  getBetAmountMemory(type) {
    const validTypes = ['fullMatch', 'opportunity'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid bet type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
    
    return this.state.betAmountMemory[type] || 25;
  }

  /**
   * Update bet amount memory
   */
  updateBetAmountMemory(type, amount) {
    const validTypes = ['fullMatch', 'opportunity'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid bet type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Bet amount must be a positive number');
    }
    
    this.updateState({
      [`betAmountMemory.${type}`]: amount
    });
  }

  /**
   * Reset state to initial values
   */
  reset() {
    const initialState = this.getInitialState();
    // Preserve wallet balance when resetting
    initialState.wallet = this.state.wallet;
    
    this.state = initialState;
    this.notifyObservers({}, this.state);
  }

  /**
   * Reset match-specific state while preserving session data
   */
  resetMatch() {
    const matchReset = {
      'match.active': false,
      'match.time': 0,
      'match.homeTeam': '',
      'match.awayTeam': '',
      'match.homeScore': 0,
      'match.awayScore': 0,
      'match.odds': { home: 1.85, draw: 3.50, away: 4.20 },
      'match.initialOdds': { home: 1.85, draw: 3.50, away: 4.20 },
      'match.timeline': [],
      'match.eventFeed': [],
      bets: { fullMatch: [], actionBets: [] },
      powerUp: { held: null, applied: false }
    };
    
    this.updateState(matchReset);
  }

  /**
   * Get specific state slice
   */
  getStateSlice(path) {
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return JSON.parse(JSON.stringify(current));
  }

  /**
   * Check if state is valid
   */
  isStateValid() {
    try {
      // Run all validators on current state
      for (const [path, validator] of this.validators) {
        const value = this.getStateSlice(path);
        if (value !== undefined) {
          validator(value);
        }
      }
      return true;
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.VALIDATION, {
        context: 'StateManager_isStateValid',
        currentState: this.getState()
      }, {
        showUserMessage: false
      });
      return false;
    }
  }

  /**
   * Setup error recovery strategies
   */
  setupErrorRecovery() {
    // Register recovery callback for state restoration
    errorHandler.registerRecoveryCallback('restore_previous_state', async (errorInfo, options) => {
      try {
        const restored = this.restorePreviousState();
        return { 
          success: restored, 
          message: restored ? 'Previous state restored' : 'No previous state available' 
        };
      } catch (error) {
        return { success: false, message: 'Failed to restore previous state' };
      }
    });

    // Register recovery callback for state reset
    errorHandler.registerRecoveryCallback('reset_to_initial_state', async (errorInfo, options) => {
      try {
        this.resetToSafeState();
        return { success: true, message: 'State reset to safe defaults' };
      } catch (error) {
        return { success: false, message: 'Failed to reset state' };
      }
    });
  }

  /**
   * Save current state to history
   */
  saveStateToHistory() {
    try {
      this.previousStates.push(JSON.parse(JSON.stringify(this.state)));
      
      // Keep history size manageable
      if (this.previousStates.length > this.maxStateHistory) {
        this.previousStates = this.previousStates.slice(-this.maxStateHistory);
      }
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.STATE, {
        context: 'StateManager_saveStateToHistory'
      }, {
        showUserMessage: false
      });
    }
  }

  /**
   * Restore previous state from history
   */
  restorePreviousState() {
    try {
      if (this.previousStates.length === 0) {
        return false;
      }

      const previousState = this.previousStates.pop();
      const currentState = this.getState();
      
      this.state = previousState;
      this.notifyObservers(currentState, this.state);
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.STATE, {
        context: 'StateManager_restorePreviousState'
      });
      return false;
    }
  }

  /**
   * Reset to safe state with preserved wallet
   */
  resetToSafeState() {
    try {
      const currentWallet = this.state.wallet;
      const currentBetMemory = { ...this.state.betAmountMemory };
      
      this.state = this.getInitialState();
      this.state.wallet = currentWallet;
      this.state.betAmountMemory = currentBetMemory;
      
      this.notifyObservers({}, this.state);
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.CRITICAL, {
        context: 'StateManager_resetToSafeState'
      });
      return false;
    }
  }

  /**
   * Get state recovery information
   */
  getRecoveryInfo() {
    return {
      hasHistory: this.previousStates.length > 0,
      historyCount: this.previousStates.length,
      isValid: this.isStateValid(),
      canRestore: this.previousStates.length > 0
    };
  }

  /**
   * Safe state update with automatic recovery
   */
  safeUpdateState(updates, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      const result = this.updateState(updates);
      
      if (result.success) {
        return result;
      }

      retryCount++;
      
      // Try with safe defaults on retry
      if (retryCount < maxRetries) {
        updates = this.sanitizeUpdates(updates);
      }
    }

    // Final fallback - reset to safe state
    this.resetToSafeState();
    return { success: false, message: 'State reset to safe defaults after failed updates' };
  }

  /**
   * Sanitize updates to safe values
   */
  sanitizeUpdates(updates) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(updates)) {
      try {
        // Apply basic sanitization rules
        if (key.includes('wallet') && (typeof value !== 'number' || value < 0)) {
          sanitized[key] = Math.max(0, Number(value) || 0);
        } else if (key.includes('Score') && (typeof value !== 'number' || value < 0)) {
          sanitized[key] = Math.max(0, Math.floor(Number(value)) || 0);
        } else if (key.includes('time') && (typeof value !== 'number' || value < 0 || value > 90)) {
          sanitized[key] = Math.max(0, Math.min(90, Number(value) || 0));
        } else if (key.includes('betAmountMemory') && (typeof value !== 'number' || value <= 0)) {
          sanitized[key] = 25; // Safe default
        } else {
          sanitized[key] = value;
        }
      } catch (error) {
        // Skip problematic updates
        errorHandler.handleError(error, ERROR_TYPES.VALIDATION, {
          context: 'StateManager_sanitizeUpdates',
          key,
          value
        }, {
          showUserMessage: false
        });
      }
    }
    
    return sanitized;
  }
}

// Export singleton instance
export const stateManager = new StateManager();