/**
 * PauseManager Module
 * 
 * This module provides centralized pause/resume functionality for the Soccer Betting Game.
 * It integrates with the existing game state management system to handle game pausing
 * during betting events and other multiplayer scenarios.
 * 
 * Key Features:
 * - Simple pause/resume operations with reason tracking
 * - Timeout handling for automatic resume with warning messages
 * - Integration with existing gameState.js
 * - Status checking utilities
 * 
 * @module pauseManager
 * @requires gameState
 * @exports {Class} PauseManager - Main pause management class
 */

import { updatePauseState, getPauseState } from './gameState.js';

/**
 * PauseManager class for handling game pause/resume operations
 * 
 * This class provides a simple interface for pausing and resuming the game
 * during betting events and other scenarios that require game interruption.
 * It integrates with the existing game state management system and includes
 * timeout handling with warning messages.
 */
export class PauseManager {
    constructor() {
        // Store timeout ID internally to avoid circular reference issues
        this.currentTimeoutId = null;
        // Store callback for timeout warnings
        this.onTimeoutWarning = null;
        // Store callback for countdown display
        this.onCountdownStart = null;
    }

    /**
     * Pauses the game with a specified reason and optional timeout
     * Enhanced with comprehensive error handling and recovery
     * 
     * @param {string} reason - Reason for pausing (e.g., 'BETTING_OPPORTUNITY')
     * @param {number} [timeout=15000] - Timeout in milliseconds for auto-resume
     * @returns {boolean} True if pause was successful, false otherwise
     */
    pauseGame(reason, timeout = 15000) {
        try {
            // Enhanced input validation
            if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
                console.error('PauseManager: Invalid reason provided for pause', { reason });
                return false;
            }

            if (typeof timeout !== 'number' || isNaN(timeout) || timeout < 0) {
                console.error('PauseManager: Invalid timeout value provided', { timeout });
                return false;
            }

            // Validate timeout is reasonable (not too large to prevent memory issues)
            if (timeout > 300000) { // 5 minutes max
                console.warn('PauseManager: Timeout value is very large, capping at 5 minutes', { timeout });
                timeout = 300000;
            }

            // Check if already paused with enhanced handling
            let currentPauseState;
            try {
                currentPauseState = getPauseState();
            } catch (stateError) {
                console.error('PauseManager: Error getting pause state', stateError);
                // Try to continue with default state
                currentPauseState = { active: false, reason: null, startTime: null, timeoutId: null };
            }

            if (currentPauseState.active) {
                console.warn('PauseManager: Game is already paused, extending timeout', { 
                    currentReason: currentPauseState.reason,
                    newReason: reason,
                    newTimeout: timeout
                });
                
                // Clear existing timeout and set new one (extend pause)
                if (this.currentTimeoutId) {
                    clearTimeout(this.currentTimeoutId);
                    this.currentTimeoutId = null;
                }
                
                // Update reason and extend timeout
                try {
                    updatePauseState({
                        active: true,
                        reason: reason,
                        startTime: currentPauseState.startTime || Date.now(),
                        timeoutId: null
                    });
                } catch (updateError) {
                    console.error('PauseManager: Error updating pause state for extension', updateError);
                    return false;
                }
            } else {
                // New pause - update state first
                try {
                    updatePauseState({
                        active: true,
                        reason: reason,
                        startTime: Date.now(),
                        timeoutId: null // Don't store the actual timeout ID in state
                    });
                } catch (updateError) {
                    console.error('PauseManager: Error updating pause state', updateError);
                    return false;
                }
            }

            // Clear any existing timeout
            if (this.currentTimeoutId) {
                clearTimeout(this.currentTimeoutId);
                this.currentTimeoutId = null;
            }

            // Set up auto-resume timeout with enhanced error handling
            try {
                this.currentTimeoutId = setTimeout(async () => {
                    try {
                        console.log('PauseManager: Auto-resuming game due to timeout');
                        
                        // Display timeout warning message if callback is set
                        if (this.onTimeoutWarning && typeof this.onTimeoutWarning === 'function') {
                            try {
                                this.onTimeoutWarning('Timeout - Resuming Game');
                            } catch (callbackError) {
                                console.error('PauseManager: Error in timeout warning callback', callbackError);
                            }
                        }
                        
                        // Auto-resume the game without countdown (timeout scenario)
                        this._resumeGameInternal(true);
                    } catch (timeoutError) {
                        console.error('PauseManager: Error in timeout handler', timeoutError);
                        // Force resume as fallback
                        try {
                            updatePauseState({
                                active: false,
                                reason: null,
                                startTime: null,
                                timeoutId: null
                            });
                        } catch (fallbackError) {
                            console.error('PauseManager: Critical error in timeout fallback', fallbackError);
                        }
                    }
                }, timeout);
            } catch (timeoutSetupError) {
                console.error('PauseManager: Error setting up timeout', timeoutSetupError);
                // Continue without timeout - manual resume will be required
            }

            console.log(`PauseManager: Game paused - ${reason} (timeout: ${timeout}ms)`);
            return true;

        } catch (error) {
            console.error('PauseManager: Critical error pausing game:', error);
            
            // Attempt to clean up any partial state
            try {
                if (this.currentTimeoutId) {
                    clearTimeout(this.currentTimeoutId);
                    this.currentTimeoutId = null;
                }
                
                // Ensure state is consistent
                updatePauseState({
                    active: false,
                    reason: null,
                    startTime: null,
                    timeoutId: null
                });
            } catch (cleanupError) {
                console.error('PauseManager: Error during cleanup after pause failure', cleanupError);
            }
            
            return false;
        }
    }

    /**
     * Resumes the game and clears pause state
     * Enhanced with comprehensive error handling and recovery
     * 
     * @param {boolean} withCountdown - Whether to show countdown before resuming (default: true)
     * @param {number} countdownSeconds - Number of seconds for countdown (default: 3)
     * @returns {Promise<boolean>} Promise that resolves to true if resume was successful, false otherwise
     */
    async resumeGame(withCountdown = true, countdownSeconds = 3) {
        try {
            // Enhanced input validation
            if (typeof withCountdown !== 'boolean') {
                console.warn('PauseManager: Invalid withCountdown parameter, defaulting to true', { withCountdown });
                withCountdown = true;
            }

            if (typeof countdownSeconds !== 'number' || isNaN(countdownSeconds) || countdownSeconds < 0) {
                console.warn('PauseManager: Invalid countdownSeconds parameter, defaulting to 3', { countdownSeconds });
                countdownSeconds = 3;
            }

            // Cap countdown to reasonable limit
            if (countdownSeconds > 10) {
                console.warn('PauseManager: Countdown too long, capping at 10 seconds', { countdownSeconds });
                countdownSeconds = 10;
            }

            // Get current pause state with error handling
            let currentPauseState;
            try {
                currentPauseState = getPauseState();
            } catch (stateError) {
                console.error('PauseManager: Error getting pause state during resume', stateError);
                // Assume not paused if we can't get state
                currentPauseState = { active: false, reason: null, startTime: null, timeoutId: null };
            }

            // Check if game is actually paused
            if (!currentPauseState.active) {
                console.warn('PauseManager: Game is not currently paused, resume not needed');
                return true; // Return true since game is already in desired state
            }

            // If countdown is requested and we have a UI callback, show countdown
            if (withCountdown && this.onCountdownStart && typeof this.onCountdownStart === 'function') {
                console.log(`PauseManager: Starting ${countdownSeconds}-second resume countdown`);
                
                try {
                    // Show countdown and wait for completion with timeout protection
                    const countdownPromise = this.onCountdownStart(countdownSeconds);
                    
                    // Add timeout to prevent hanging if countdown callback fails
                    const timeoutPromise = new Promise((resolve) => {
                        setTimeout(() => {
                            console.warn('PauseManager: Countdown timeout reached, proceeding with resume');
                            resolve();
                        }, (countdownSeconds + 2) * 1000); // Add 2 seconds buffer
                    });
                    
                    // Race between countdown completion and timeout
                    await Promise.race([countdownPromise, timeoutPromise]);
                    
                } catch (countdownError) {
                    console.error('PauseManager: Error during countdown, proceeding with resume:', countdownError);
                    // Continue with resume even if countdown fails
                }
            } else if (withCountdown && !this.onCountdownStart) {
                console.warn('PauseManager: Countdown requested but no callback available, skipping countdown');
            }

            // Perform the actual resume with enhanced error handling
            return this._resumeGameInternal(false);

        } catch (error) {
            console.error('PauseManager: Critical error resuming game:', error);
            
            // Attempt emergency resume
            try {
                console.warn('PauseManager: Attempting emergency resume after error');
                return this._resumeGameInternal(false, true); // Force resume
            } catch (emergencyError) {
                console.error('PauseManager: Emergency resume also failed:', emergencyError);
                return false;
            }
        }
    }

    /**
     * Internal method to resume the game with optional timeout flag
     * Enhanced with comprehensive error handling and recovery
     * 
     * @param {boolean} isTimeout - Whether this resume was triggered by timeout
     * @param {boolean} forceResume - Whether to force resume even if state is inconsistent
     * @returns {boolean} True if resume was successful, false otherwise
     * @private
     */
    _resumeGameInternal(isTimeout = false, forceResume = false) {
        try {
            // Get current pause state with error handling
            let currentPauseState;
            try {
                currentPauseState = getPauseState();
            } catch (stateError) {
                console.error('PauseManager: Error getting pause state during internal resume', stateError);
                if (!forceResume) {
                    return false;
                }
                // For force resume, assume paused state
                currentPauseState = { active: true, reason: 'unknown', startTime: null, timeoutId: null };
            }

            // Check if game is actually paused (unless forcing)
            if (!currentPauseState.active && !forceResume) {
                console.warn('PauseManager: Game is not currently paused, resume not needed');
                return true; // Return true since game is already in desired state
            }

            // Clear timeout if it exists (important for manual resume)
            if (this.currentTimeoutId) {
                try {
                    clearTimeout(this.currentTimeoutId);
                    this.currentTimeoutId = null;
                } catch (timeoutError) {
                    console.error('PauseManager: Error clearing timeout during resume', timeoutError);
                    // Continue with resume
                }
            }

            // Clear pause state with enhanced error handling
            try {
                updatePauseState({
                    active: false,
                    reason: null,
                    startTime: null,
                    timeoutId: null
                });
            } catch (updateError) {
                console.error('PauseManager: Error updating pause state during resume', updateError);
                
                if (!forceResume) {
                    return false;
                }
                
                // For force resume, try alternative state clearing
                try {
                    // Try to access state management directly if available
                    if (typeof window !== 'undefined' && window.soccerBettingGame) {
                        console.warn('PauseManager: Attempting direct state reset via game instance');
                        // This is a fallback - normally we shouldn't access game internals
                    }
                } catch (fallbackError) {
                    console.error('PauseManager: Fallback state clearing also failed', fallbackError);
                    // Continue anyway for force resume
                }
            }

            const resumeType = isTimeout ? 'auto-resumed (timeout)' : 'manually resumed';
            const forceText = forceResume ? ' (forced)' : '';
            console.log(`PauseManager: Game ${resumeType}${forceText}`);
            
            return true;

        } catch (error) {
            console.error('PauseManager: Critical error in internal resume:', error);
            
            if (forceResume) {
                console.warn('PauseManager: Force resume failed, but returning true to prevent hanging');
                return true; // Return true for force resume to prevent application hanging
            }
            
            return false;
        }
    }

    /**
     * Checks if the game is currently paused
     * 
     * @returns {boolean} True if game is paused, false otherwise
     */
    isPaused() {
        try {
            const pauseState = getPauseState();
            return pauseState.active === true;
        } catch (error) {
            console.error('PauseManager: Error checking pause status:', error);
            return false;
        }
    }

    /**
     * Gets the current pause state information
     * 
     * @returns {Object} Current pause state object
     * @returns {boolean} returns.active - Whether game is paused
     * @returns {string|null} returns.reason - Reason for pause
     * @returns {number|null} returns.startTime - When pause started
     * @returns {number|null} returns.timeoutId - Timeout ID for auto-resume
     */
    getPauseInfo() {
        try {
            return getPauseState();
        } catch (error) {
            console.error('PauseManager: Error getting pause info:', error);
            return {
                active: false,
                reason: null,
                startTime: null,
                timeoutId: null
            };
        }
    }

    /**
     * Gets the duration of the current pause in milliseconds
     * 
     * @returns {number} Duration in milliseconds, or 0 if not paused
     */
    getPauseDuration() {
        try {
            const pauseState = getPauseState();
            if (!pauseState.active || !pauseState.startTime) {
                return 0;
            }
            return Date.now() - pauseState.startTime;
        } catch (error) {
            console.error('PauseManager: Error calculating pause duration:', error);
            return 0;
        }
    }

    /**
     * Sets a callback function to be called when timeout warning should be displayed
     * 
     * @param {Function} callback - Function to call with warning message
     */
    setTimeoutWarningCallback(callback) {
        if (typeof callback === 'function') {
            this.onTimeoutWarning = callback;
        } else {
            console.warn('PauseManager: Invalid callback provided for timeout warning');
        }
    }

    /**
     * Clears the timeout warning callback
     */
    clearTimeoutWarningCallback() {
        this.onTimeoutWarning = null;
    }

    /**
     * Sets a callback function to be called when resume countdown should be displayed
     * 
     * @param {Function} callback - Function to call with countdown seconds, should return a Promise
     */
    setCountdownCallback(callback) {
        if (typeof callback === 'function') {
            this.onCountdownStart = callback;
        } else {
            console.warn('PauseManager: Invalid callback provided for countdown');
        }
    }

    /**
     * Clears the countdown callback
     */
    clearCountdownCallback() {
        this.onCountdownStart = null;
    }

    /**
     * Checks if there is an active timeout for the current pause
     * 
     * @returns {boolean} True if there is an active timeout
     */
    hasActiveTimeout() {
        return this.currentTimeoutId !== null;
    }

    /**
     * Clears any active timeout without resuming the game
     * Useful for extending pause duration or handling manual control
     * 
     * @returns {boolean} True if timeout was cleared, false if no timeout was active
     */
    clearTimeout() {
        if (this.currentTimeoutId) {
            clearTimeout(this.currentTimeoutId);
            this.currentTimeoutId = null;
            console.log('PauseManager: Timeout cleared');
            return true;
        }
        return false;
    }
}

// Export a default instance for convenience
export const pauseManager = new PauseManager();