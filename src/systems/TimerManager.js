/**
 * TimerManager - Manages match timer, countdowns, and pause/resume functionality
 * 
 * Handles:
 * - 90-minute match timer
 * - Pause/resume functionality for action betting
 * - 10-second countdown timer for action betting windows
 * - Timer synchronization and accuracy validation
 */
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';

export class TimerManager {
    constructor() {
        try {
            // Speed multiplier: 180x speed means 90 minutes takes 30 real seconds
            this.speedMultiplier = 180;
            
            this.matchTimer = {
                startTime: null,
                pausedTime: 0,
                totalPausedDuration: 0,
                isRunning: false,
                isPaused: false,
                currentTime: 0 // in minutes
            };

            this.countdown = {
                duration: 0,
                startTime: null,
                isRunning: false,
                callback: null,
                intervalId: null
            };

            this.matchIntervalId = null;
            this.callbacks = {
                onMatchTimeUpdate: null,
                onCountdownUpdate: null,
                onCountdownComplete: null
            };

            // Timer accuracy validation
            this.lastSyncTime = null;
            this.syncThreshold = 100; // milliseconds
            this.fallbackMode = false;
            this.manualTime = 0;
            
            this.setupErrorRecovery();
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_constructor',
                component: 'TimerManager'
            });
            throw error;
        }
    }

    /**
     * Starts the 90-minute match timer
     */
    startMatch() {
        try {
            if (this.matchTimer.isRunning) {
                console.warn('Match timer is already running');
                return { success: true, message: 'Timer already running' };
            }

            this.matchTimer.startTime = Date.now();
            this.matchTimer.pausedTime = 0;
            this.matchTimer.totalPausedDuration = 0;
            this.matchTimer.isRunning = true;
            this.matchTimer.isPaused = false;
            this.matchTimer.currentTime = 0;
            this.fallbackMode = false;
            this.manualTime = 0;

            this._startMatchInterval();
            this.lastSyncTime = Date.now();

            console.log('Match timer started');
            return { success: true, message: 'Match timer started' };
        } catch (error) {
            const errorResult = errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_startMatch'
            }, {
                attemptRecovery: true
            });
            
            if (!errorResult.success) {
                this.enableFallbackMode();
            }
            
            return errorResult;
        }
    }

    /**
     * Pauses the match timer (for action betting)
     */
    pauseTimer() {
        try {
            if (!this.matchTimer.isRunning || this.matchTimer.isPaused) {
                console.warn('Cannot pause timer - not running or already paused');
                return { success: false, message: 'Timer not running or already paused' };
            }

            this.matchTimer.isPaused = true;
            this.matchTimer.pausedTime = Date.now();
            
            if (this.matchIntervalId) {
                clearInterval(this.matchIntervalId);
                this.matchIntervalId = null;
            }

            console.log(`Match timer paused at ${this.matchTimer.currentTime.toFixed(2)} minutes`);
            return { success: true, message: 'Timer paused' };
        } catch (error) {
            return errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_pauseTimer',
                currentTime: this.matchTimer.currentTime
            });
        }
    }

    /**
     * Resumes the match timer after pause
     */
    resumeTimer() {
        if (!this.matchTimer.isRunning || !this.matchTimer.isPaused) {
            console.warn('Cannot resume timer - not running or not paused');
            return;
        }

        const pauseDuration = Date.now() - this.matchTimer.pausedTime;
        this.matchTimer.totalPausedDuration += pauseDuration;
        this.matchTimer.isPaused = false;
        this.matchTimer.pausedTime = 0;

        this._startMatchInterval();

        console.log(`Match timer resumed after ${(pauseDuration / 1000).toFixed(1)}s pause`);
    }

    /**
     * Starts a countdown timer (for action betting windows)
     * @param {number} duration - Duration in seconds
     * @param {Function} callback - Callback when countdown completes
     */
    startCountdown(duration, callback = null) {
        try {
            if (typeof duration !== 'number' || duration <= 0) {
                throw new Error('Invalid countdown duration');
            }

            if (this.countdown.isRunning) {
                this.stopCountdown();
            }

            this.countdown.duration = duration;
            this.countdown.startTime = Date.now();
            this.countdown.isRunning = true;
            this.countdown.callback = callback;

            this.countdown.intervalId = setInterval(() => {
                try {
                    const elapsed = (Date.now() - this.countdown.startTime) / 1000;
                    const remaining = Math.max(0, this.countdown.duration - elapsed);

                    if (this.callbacks.onCountdownUpdate) {
                        this.callbacks.onCountdownUpdate(remaining);
                    }

                    if (remaining <= 0) {
                        const callback = this.countdown.callback;
                        this.stopCountdown();
                        if (callback) {
                            callback();
                        }
                        if (this.callbacks.onCountdownComplete) {
                            this.callbacks.onCountdownComplete();
                        }
                    }
                } catch (error) {
                    errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                        context: 'TimerManager_countdownInterval'
                    }, {
                        showUserMessage: false
                    });
                    this.stopCountdown();
                }
            }, 100); // Update every 100ms for smooth countdown

            console.log(`Countdown started: ${duration} seconds`);
            return { success: true, message: 'Countdown started' };
        } catch (error) {
            return errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_startCountdown',
                duration,
                callbackType: typeof callback
            });
        }
    }

    /**
     * Stops the current countdown timer
     */
    stopCountdown() {
        if (this.countdown.intervalId) {
            clearInterval(this.countdown.intervalId);
            this.countdown.intervalId = null;
        }

        this.countdown.isRunning = false;
        this.countdown.callback = null;
        
        console.log('Countdown stopped');
    }

    /**
     * Gets the current match time in minutes
     * @returns {number} Current match time in minutes
     */
    getMatchTime() {
        if (!this.matchTimer.isRunning) {
            return 0;
        }

        if (this.matchTimer.isPaused) {
            return this.matchTimer.currentTime;
        }

        const elapsed = Date.now() - this.matchTimer.startTime - this.matchTimer.totalPausedDuration;
        return Math.min(90, (elapsed / (1000 * 60)) * this.speedMultiplier); // Cap at 90 minutes
    }

    /**
     * Gets the remaining countdown time in seconds
     * @returns {number} Remaining countdown time in seconds
     */
    getCountdownTime() {
        if (!this.countdown.isRunning) {
            return 0;
        }

        const elapsed = (Date.now() - this.countdown.startTime) / 1000;
        return Math.max(0, this.countdown.duration - elapsed);
    }

    /**
     * Checks if the match timer is running
     * @returns {boolean} True if match timer is running
     */
    isMatchRunning() {
        return this.matchTimer.isRunning && !this.matchTimer.isPaused;
    }

    /**
     * Checks if the match timer is paused
     * @returns {boolean} True if match timer is paused
     */
    isMatchPaused() {
        return this.matchTimer.isPaused;
    }

    /**
     * Checks if countdown is running
     * @returns {boolean} True if countdown is running
     */
    isCountdownRunning() {
        return this.countdown.isRunning;
    }

    /**
     * Stops the match timer
     */
    stopMatch() {
        if (this.matchIntervalId) {
            clearInterval(this.matchIntervalId);
            this.matchIntervalId = null;
        }

        this.stopCountdown();

        this.matchTimer.isRunning = false;
        this.matchTimer.isPaused = false;

        console.log(`Match timer stopped at ${this.matchTimer.currentTime.toFixed(2)} minutes`);
    }

    /**
     * Validates timer accuracy and synchronization
     * @returns {Object} Validation results
     */
    validateTimerAccuracy() {
        const now = Date.now();
        const results = {
            isAccurate: true,
            drift: 0,
            syncStatus: 'good'
        };

        if (this.lastSyncTime) {
            const expectedInterval = 1000; // 1 second
            const actualInterval = now - this.lastSyncTime;
            results.drift = Math.abs(actualInterval - expectedInterval);
            
            if (results.drift > this.syncThreshold) {
                results.isAccurate = false;
                results.syncStatus = 'drift_detected';
                console.warn(`Timer drift detected: ${results.drift}ms`);
            }
        }

        this.lastSyncTime = now;
        return results;
    }

    /**
     * Sets callback functions for timer events
     * @param {Object} callbacks - Object containing callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Gets comprehensive timer status
     * @returns {Object} Complete timer status
     */
    getStatus() {
        return {
            match: {
                isRunning: this.matchTimer.isRunning,
                isPaused: this.matchTimer.isPaused,
                currentTime: this.getMatchTime(),
                totalPausedDuration: this.matchTimer.totalPausedDuration / 1000
            },
            countdown: {
                isRunning: this.countdown.isRunning,
                remainingTime: this.getCountdownTime(),
                duration: this.countdown.duration
            },
            accuracy: this.validateTimerAccuracy()
        };
    }

    /**
     * Resets all timers to initial state
     */
    reset() {
        this.stopMatch();
        
        this.matchTimer = {
            startTime: null,
            pausedTime: 0,
            totalPausedDuration: 0,
            isRunning: false,
            isPaused: false,
            currentTime: 0
        };

        this.countdown = {
            duration: 0,
            startTime: null,
            isRunning: false,
            callback: null,
            intervalId: null
        };

        this.lastSyncTime = null;

        console.log('TimerManager reset');
    }

    /**
     * Private method to start the match timer interval
     */
    _startMatchInterval() {
        try {
            this.matchIntervalId = setInterval(() => {
                try {
                    if (this.fallbackMode) {
                        this.manualTime += 1/60; // Add 1 minute per second in fallback mode
                        this.matchTimer.currentTime = Math.min(90, this.manualTime);
                    } else {
                        this.matchTimer.currentTime = this.getMatchTime();
                    }
                    
                    if (this.callbacks.onMatchTimeUpdate) {
                        console.log(`TimerManager: Updating time to ${this.matchTimer.currentTime.toFixed(2)} minutes`);
                        this.callbacks.onMatchTimeUpdate(this.matchTimer.currentTime);
                    }

                    // Let GameController handle match end at 90 minutes
                    // (GameController will call stopMatch() when needed)

                    // Validate timer accuracy periodically (only in normal mode)
                    if (!this.fallbackMode) {
                        const accuracy = this.validateTimerAccuracy();
                        if (!accuracy.isAccurate) {
                            console.warn('Timer accuracy issue detected, considering fallback mode');
                        }
                    }
                } catch (error) {
                    errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                        context: 'TimerManager_matchInterval'
                    }, {
                        showUserMessage: false
                    });
                    
                    // Enable fallback mode on repeated errors
                    this.enableFallbackMode();
                }
            }, 1000); // Update every second
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_startMatchInterval'
            });
            this.enableFallbackMode();
        }
    }

    /**
     * Setup error recovery strategies for timer operations
     */
    setupErrorRecovery() {
        // Register recovery callback for timer restart
        errorHandler.registerRecoveryCallback('restart_timer', async (errorInfo, options) => {
            try {
                const currentTime = this.matchTimer.currentTime;
                this.stopMatch();
                
                // Restart with preserved time
                const result = this.startMatch();
                if (result.success) {
                    this.matchTimer.currentTime = currentTime;
                    this.manualTime = currentTime;
                }
                
                return { 
                    success: result.success, 
                    message: result.success ? 'Timer restarted successfully' : 'Timer restart failed' 
                };
            } catch (error) {
                return { success: false, message: 'Timer restart failed' };
            }
        });

        // Register recovery callback for manual time tracking
        errorHandler.registerRecoveryCallback('manual_time_tracking', async (errorInfo, options) => {
            try {
                this.enableFallbackMode();
                return { success: true, message: 'Manual time tracking enabled' };
            } catch (error) {
                return { success: false, message: 'Failed to enable manual time tracking' };
            }
        });
    }

    /**
     * Enable fallback mode for manual time tracking
     */
    enableFallbackMode() {
        try {
            console.warn('Enabling timer fallback mode - manual time tracking');
            this.fallbackMode = true;
            
            // Preserve current time if available
            if (this.matchTimer.currentTime > 0) {
                this.manualTime = this.matchTimer.currentTime;
            }
            
            // Clear existing intervals and restart with fallback
            if (this.matchIntervalId) {
                clearInterval(this.matchIntervalId);
                this.matchIntervalId = null;
            }
            
            if (this.matchTimer.isRunning && !this.matchTimer.isPaused) {
                this._startMatchInterval();
            }
            
            return true;
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.CRITICAL, {
                context: 'TimerManager_enableFallbackMode'
            });
            return false;
        }
    }

    /**
     * Get timer system health status
     */
    getSystemHealth() {
        try {
            const status = this.getStatus();
            const accuracy = this.validateTimerAccuracy();
            
            return {
                healthy: !this.fallbackMode && accuracy.isAccurate,
                fallbackMode: this.fallbackMode,
                accuracy: accuracy,
                matchRunning: this.matchTimer.isRunning,
                countdownRunning: this.countdown.isRunning,
                currentTime: this.matchTimer.currentTime
            };
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_getSystemHealth'
            }, {
                showUserMessage: false
            });
            
            return {
                healthy: false,
                error: 'Unable to determine timer health'
            };
        }
    }

    /**
     * Safe timer operations with automatic recovery
     */
    safeStartMatch() {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const result = this.startMatch();
            
            if (result.success) {
                return result;
            }

            retryCount++;
            
            if (retryCount < maxRetries) {
                // Try enabling fallback mode on retry
                this.enableFallbackMode();
            }
        }

        // Final fallback
        this.enableFallbackMode();
        return { success: false, message: 'Timer started in fallback mode after errors' };
    }

    /**
     * Safe countdown with error handling
     */
    safeStartCountdown(duration, callback = null) {
        try {
            // Validate and sanitize inputs
            const safeDuration = Math.max(1, Math.min(60, Number(duration) || 10));
            
            const safeCallback = (typeof callback === 'function') ? (() => {
                try {
                    callback();
                } catch (error) {
                    errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                        context: 'TimerManager_countdownCallback'
                    }, {
                        showUserMessage: false
                    });
                }
            }) : null;

            return this.startCountdown(safeDuration, safeCallback);
        } catch (error) {
            return errorHandler.handleError(error, ERROR_TYPES.TIMER, {
                context: 'TimerManager_safeStartCountdown',
                duration,
                callbackType: typeof callback
            });
        }
    }
}

export default TimerManager;