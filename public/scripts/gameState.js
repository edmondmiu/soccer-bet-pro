/**
 * Game State Management Module
 * 
 * This module provides centralized state management for the Soccer Betting Game using
 * the observer pattern for state change notifications. It ensures data consistency
 * and provides a single source of truth for the application state.
 * 
 * Key Features:
 * - Centralized state storage with validation
 * - Observer pattern for reactive UI updates
 * - Deep state merging with rollback on errors
 * - Type validation and error handling
 * - Immutable state access (returns copies)
 * 
 * State Structure:
 * - currentScreen: Current UI screen ('lobby' | 'match')
 * - wallet: Player's current balance
 * - classicMode: Whether power-ups are disabled
 * - match: Complete match state including scores, time, odds
 * - bets: All betting data (full match and action bets)
 * - powerUp: Power-up state and status
 * - currentBet: Temporary bet being placed
 * - currentActionBet: Active action betting state
 * 
 * @module gameState
 * @requires none
 * @exports {Function} getInitialState - Returns initial game state
 * @exports {Function} getCurrentState - Gets current state (immutable copy)
 * @exports {Function} updateState - Updates state with validation
 * @exports {Function} resetState - Resets to initial state
 * @exports {Function} subscribeToStateChanges - Observer pattern subscription
 */

// --- STATE STRUCTURE ---

/**
 * Returns the initial state for the game
 * 
 * This function defines the default state structure and values for a fresh game.
 * All state properties are initialized with safe defaults to prevent undefined errors.
 * 
 * @returns {Object} Initial game state object
 * @returns {string} returns.currentScreen - Starting screen ('lobby')
 * @returns {number} returns.wallet - Starting wallet balance (1000.00)
 * @returns {boolean} returns.classicMode - Power-ups disabled flag (false)
 * @returns {Object} returns.match - Match state with default values
 * @returns {Object} returns.bets - Empty betting arrays
 * @returns {Object} returns.powerUp - Empty power-up state
 * @returns {Object|null} returns.currentBet - No active bet
 * @returns {Object} returns.currentActionBet - Inactive action bet state
 */
export function getInitialState() {
    return {
        currentScreen: 'lobby',
        wallet: 1000.00,
        classicMode: false,
        match: {
            active: false,
            time: 0,
            homeScore: 0,
            awayScore: 0,
            homeTeam: '',
            awayTeam: '',
            timeline: [],
            odds: { home: 1.85, draw: 3.50, away: 4.20 },
            initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
            initialWallet: 1000.00,
        },
        bets: {
            fullMatch: [],
            actionBets: [],
        },
        powerUp: {
            held: null,
            applied: false,
        },
        currentBet: null,
        currentActionBet: {
            active: false,
            details: null,
            timeoutId: null,
        },
    };
}

// --- STATE MANAGEMENT ---

/**
 * Current game state
 * @type {Object}
 */
let currentState = getInitialState();

/**
 * Array of observer callbacks for state changes
 * @type {Array<Function>}
 */
let stateObservers = [];

/**
 * Gets the current game state
 * @returns {Object} Current state (read-only copy)
 */
export function getCurrentState() {
    // Return a deep copy to prevent direct mutations
    return JSON.parse(JSON.stringify(currentState));
}

/**
 * Updates the game state with partial updates using deep merge strategy
 * 
 * This function safely updates the game state by:
 * 1. Validating the updates structure
 * 2. Creating a backup of current state for rollback
 * 3. Deep merging updates into current state
 * 4. Validating the resulting state
 * 5. Notifying all observers of the change
 * 6. Rolling back on any errors
 * 
 * The deep merge preserves nested object structures while allowing
 * partial updates at any level of the state tree.
 * 
 * @param {Object} updates - Partial state updates to apply
 * @param {string} [updates.currentScreen] - Screen to switch to
 * @param {number} [updates.wallet] - New wallet balance
 * @param {boolean} [updates.classicMode] - Classic mode setting
 * @param {Object} [updates.match] - Match state updates
 * @param {Object} [updates.bets] - Betting state updates
 * @param {Object} [updates.powerUp] - Power-up state updates
 * @returns {Object} Updated state (immutable copy)
 * @throws {Error} Logs errors but doesn't throw, returns previous state on failure
 */
export function updateState(updates) {
    if (!updates || typeof updates !== 'object') {
        console.warn('Invalid state update: updates must be an object', updates);
        return getCurrentState();
    }

    // Store previous state for rollback
    const previousState = JSON.parse(JSON.stringify(currentState));

    try {
        // Validate state structure before applying updates
        // This prevents invalid data from corrupting the application state
        if (!validateStateStructure(updates)) {
            console.error('Invalid state structure in updates:', updates);
            return getCurrentState();
        }

        // Deep merge the updates into current state
        // This preserves existing nested data while applying only the changes
        currentState = deepMerge(currentState, updates);
        
        // Validate the resulting state after merge
        // Ensures the final state maintains all required properties and types
        if (!validateCompleteState(currentState)) {
            console.error('State validation failed after update, rolling back');
            // Rollback to previous known-good state on validation failure
            currentState = previousState;
            return getCurrentState();
        }
        
        // Notify all observers of the state change using observer pattern
        // This triggers reactive UI updates and other state-dependent logic
        notifyStateObservers(currentState);
        
        return getCurrentState();
    } catch (error) {
        console.error('Error updating state, rolling back:', error);
        // Critical error handling: always rollback to maintain application stability
        currentState = previousState;
        return getCurrentState();
    }
}

/**
 * Resets the game state to initial values
 * @returns {Object} Reset state
 */
export function resetState() {
    currentState = getInitialState();
    notifyStateObservers(currentState);
    return getCurrentState();
}

// --- OBSERVER PATTERN ---

/**
 * Subscribes a callback to state changes using the observer pattern
 * 
 * This function implements the observer pattern, allowing UI components
 * and other modules to react to state changes automatically. The callback
 * receives a copy of the new state whenever updateState() is called.
 * 
 * Usage Pattern:
 * ```javascript
 * const unsubscribe = subscribeToStateChanges((newState) => {
 *   console.log('State changed:', newState);
 *   updateUI(newState);
 * });
 * 
 * // Later, when no longer needed:
 * unsubscribe();
 * ```
 * 
 * @param {Function} callback - Function to call when state changes
 * @param {Object} callback.newState - The new state after changes
 * @returns {Function} Unsubscribe function to remove the listener
 * @example
 * // Subscribe to state changes
 * const unsubscribe = subscribeToStateChanges((state) => {
 *   if (state.currentScreen === 'match') {
 *     renderMatchScreen();
 *   }
 * });
 */
export function subscribeToStateChanges(callback) {
    if (typeof callback !== 'function') {
        console.warn('State observer callback must be a function', callback);
        return () => {};
    }

    try {
        stateObservers.push(callback);
        
        // Return unsubscribe function
        return () => {
            try {
                const index = stateObservers.indexOf(callback);
                if (index > -1) {
                    stateObservers.splice(index, 1);
                }
            } catch (error) {
                console.error('Error unsubscribing from state changes:', error);
            }
        };
    } catch (error) {
        console.error('Error subscribing to state changes:', error);
        return () => {};
    }
}

/**
 * Notifies all observers of state changes
 * @param {Object} newState - The new state
 */
function notifyStateObservers(newState) {
    stateObservers.forEach(callback => {
        try {
            callback(getCurrentState());
        } catch (error) {
            console.error('Error in state observer callback:', error);
        }
    });
}

// --- UTILITY FUNCTIONS ---

/**
 * Deep merges two objects, with the second object taking precedence
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
    try {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    // Recursively merge nested objects
                    result[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    // Direct assignment for primitives and arrays
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error in deepMerge:', error);
        return target; // Return original target on error
    }
}

/**
 * Validates the structure of state updates
 * @param {Object} updates - State updates to validate
 * @returns {boolean} True if structure is valid
 */
function validateStateStructure(updates) {
    try {
        const validKeys = [
            'currentScreen', 'wallet', 'classicMode', 'match', 'bets', 
            'powerUp', 'currentBet', 'currentActionBet'
        ];
        
        for (const key in updates) {
            if (!validKeys.includes(key)) {
                console.warn(`Invalid state key: ${key}`);
                return false;
            }
            
            // Validate specific key types
            switch (key) {
                case 'currentScreen':
                    if (typeof updates[key] !== 'string' || !['lobby', 'match'].includes(updates[key])) {
                        console.warn(`Invalid currentScreen value: ${updates[key]}`);
                        return false;
                    }
                    break;
                case 'wallet':
                    if (typeof updates[key] !== 'number' || updates[key] < 0) {
                        console.warn(`Invalid wallet value: ${updates[key]}`);
                        return false;
                    }
                    break;
                case 'classicMode':
                    if (typeof updates[key] !== 'boolean') {
                        console.warn(`Invalid classicMode value: ${updates[key]}`);
                        return false;
                    }
                    break;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error validating state structure:', error);
        return false;
    }
}

/**
 * Validates the complete state object
 * @param {Object} state - Complete state to validate
 * @returns {boolean} True if state is valid
 */
function validateCompleteState(state) {
    try {
        // Check required properties exist
        const requiredProps = ['currentScreen', 'wallet', 'classicMode', 'match', 'bets', 'powerUp'];
        for (const prop of requiredProps) {
            if (!(prop in state)) {
                console.error(`Missing required state property: ${prop}`);
                return false;
            }
        }
        
        // Validate wallet is a non-negative number
        if (typeof state.wallet !== 'number' || state.wallet < 0) {
            console.error(`Invalid wallet value: ${state.wallet}`);
            return false;
        }
        
        // Validate match object structure
        if (state.match && typeof state.match === 'object') {
            const requiredMatchProps = ['active', 'time', 'homeScore', 'awayScore'];
            for (const prop of requiredMatchProps) {
                if (!(prop in state.match)) {
                    console.error(`Missing required match property: ${prop}`);
                    return false;
                }
            }
        }
        
        // Validate bets object structure
        if (state.bets && typeof state.bets === 'object') {
            if (!Array.isArray(state.bets.fullMatch) || !Array.isArray(state.bets.actionBets)) {
                console.error('Invalid bets structure: fullMatch and actionBets must be arrays');
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error validating complete state:', error);
        return false;
    }
}

// --- SPECIFIC STATE GETTERS ---

/**
 * Gets the current screen
 * @returns {string} Current screen name
 */
export function getCurrentScreen() {
    return currentState.currentScreen;
}

/**
 * Gets the current wallet balance
 * @returns {number} Wallet balance
 */
export function getWalletBalance() {
    return currentState.wallet;
}

/**
 * Gets the current match state
 * @returns {Object} Match state
 */
export function getMatchState() {
    return { ...currentState.match };
}

/**
 * Gets the current betting state
 * @returns {Object} Betting state
 */
export function getBettingState() {
    return {
        fullMatch: [...currentState.bets.fullMatch],
        actionBets: [...currentState.bets.actionBets]
    };
}

/**
 * Gets the current power-up state
 * @returns {Object} Power-up state
 */
export function getPowerUpState() {
    return { ...currentState.powerUp };
}

/**
 * Gets the classic mode setting
 * @returns {boolean} Classic mode enabled
 */
export function getClassicMode() {
    return currentState.classicMode;
}

// --- SPECIFIC STATE SETTERS ---

/**
 * Updates the current screen
 * @param {string} screen - Screen name to set
 */
export function setCurrentScreen(screen) {
    updateState({ currentScreen: screen });
}

/**
 * Updates the wallet balance
 * @param {number} amount - New wallet amount
 */
export function setWalletBalance(amount) {
    try {
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.error(`Invalid wallet amount: ${amount}`);
            return;
        }
        updateState({ wallet: amount });
    } catch (error) {
        console.error('Error setting wallet balance:', error);
    }
}

/**
 * Adds or subtracts from wallet balance
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 */
export function adjustWalletBalance(amount) {
    try {
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error(`Invalid adjustment amount: ${amount}`);
            return;
        }
        const newBalance = Math.max(0, currentState.wallet + amount);
        updateState({ wallet: newBalance });
    } catch (error) {
        console.error('Error adjusting wallet balance:', error);
    }
}

/**
 * Updates the classic mode setting
 * @param {boolean} enabled - Whether classic mode is enabled
 */
export function setClassicMode(enabled) {
    updateState({ classicMode: !!enabled });
}

/**
 * Updates match data
 * @param {Object} matchUpdates - Partial match state updates
 */
export function updateMatchState(matchUpdates) {
    updateState({ 
        match: { 
            ...currentState.match, 
            ...matchUpdates 
        } 
    });
}

/**
 * Adds a bet to the betting state
 * @param {string} betType - Type of bet ('fullMatch' or 'actionBets')
 * @param {Object} bet - Bet object to add
 */
export function addBet(betType, bet) {
    try {
        if (!betType || typeof betType !== 'string') {
            console.error(`Invalid bet type: ${betType}`);
            return;
        }
        
        if (!bet || typeof bet !== 'object') {
            console.error(`Invalid bet object: ${bet}`);
            return;
        }
        
        // Validate bet object structure
        const requiredBetProps = ['id', 'stake', 'odds', 'status'];
        for (const prop of requiredBetProps) {
            if (!(prop in bet)) {
                console.error(`Missing required bet property: ${prop}`);
                return;
            }
        }
        
        if (betType === 'fullMatch') {
            if (!bet.outcome) {
                console.error('Full match bet missing outcome property');
                return;
            }
            updateState({
                bets: {
                    ...currentState.bets,
                    fullMatch: [...currentState.bets.fullMatch, bet]
                }
            });
        } else if (betType === 'actionBets') {
            if (!bet.description) {
                console.error('Action bet missing description property');
                return;
            }
            updateState({
                bets: {
                    ...currentState.bets,
                    actionBets: [...currentState.bets.actionBets, bet]
                }
            });
        } else {
            console.error(`Unknown bet type: ${betType}`);
        }
    } catch (error) {
        console.error('Error adding bet:', error);
    }
}

/**
 * Updates power-up state
 * @param {Object} powerUpUpdates - Partial power-up state updates
 */
export function updatePowerUpState(powerUpUpdates) {
    updateState({
        powerUp: {
            ...currentState.powerUp,
            ...powerUpUpdates
        }
    });
}

/**
 * Updates current action bet state
 * @param {Object} actionBetUpdates - Partial action bet state updates
 */
export function updateCurrentActionBet(actionBetUpdates) {
    updateState({
        currentActionBet: {
            ...currentState.currentActionBet,
            ...actionBetUpdates
        }
    });
}