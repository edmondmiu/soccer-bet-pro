/**
 * ActionBetting - Manages time-limited betting opportunities that pause the game
 * 
 * Handles:
 * - 10-second countdown timer with visual feedback
 * - Betting opportunity modal with event descriptions and choices
 * - Skip betting and timeout handling
 * - Integration with TimerManager for pause/resume coordination
 */

export class ActionBetting {
    constructor(stateManager, timerManager, bettingManager) {
        this.stateManager = stateManager;
        this.timerManager = timerManager;
        this.bettingManager = bettingManager;
        
        this.currentEvent = null;
        this.isModalOpen = false;
        this.countdownDuration = 10; // seconds
        this.resumeCountdownDuration = 3; // seconds
        
        this.callbacks = {
            onModalShow: null,
            onModalHide: null,
            onCountdownUpdate: null,
            onBetPlaced: null,
            onTimeout: null,
            onSkip: null
        };

    }

    /**
     * Initialize the action betting system
     */
    initialize() {
        // Bind timer callbacks
        if (this.timerManager && typeof this.timerManager.setCallbacks === 'function') {
            this.timerManager.setCallbacks({
                onCountdownUpdate: (remaining) => this.handleCountdownUpdate(remaining),
                onCountdownComplete: () => this.handleCountdownComplete()
            });
        }
        
        // Reset any existing state
        this.reset();
        console.log('ActionBetting: Initialized');
    }

    /**
     * Shows action betting opportunity modal
     * @param {Object} eventData - Event information
     * @param {string} eventData.id - Event ID
     * @param {string} eventData.description - Event description
     * @param {Array} eventData.choices - Betting choices with odds
     * @returns {Promise} Promise that resolves when modal is handled
     */
    async showActionBettingModal(eventData) {
        try {
            if (this.isModalOpen) {
                console.warn('Action betting modal already open');
                return { success: false, error: 'Modal already open' };
            }

            // Pause the game timer
            this.timerManager.pauseTimer();
            
            this.currentEvent = eventData;
            this.isModalOpen = true;

            // Show modal UI
            if (this.callbacks.onModalShow) {
                this.callbacks.onModalShow(eventData);
            }

            // Start countdown timer
            this.timerManager.startCountdown(this.countdownDuration, () => {
                this.handleTimeout();
            });

            console.log(`Action betting modal shown for event: ${eventData.description}`);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to show action betting modal:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Place a bet directly with choice object
     * @param {Object} choice - The selected choice object
     * @param {number} amount - Bet amount
     * @returns {Object} Bet result
     */
    placeBetDirect(choice, amount) {
        try {
            if (!this.isModalOpen || !this.currentEvent) {
                throw new Error('No active betting opportunity');
            }

            // Create bet data
            const betData = {
                type: 'actionBet',
                outcome: choice.outcome,
                stake: amount,
                odds: choice.odds,
                eventId: this.currentEvent.id
            };

            // Place bet through betting manager
            const result = this.bettingManager.placeBet(betData);
            
            if (result.success) {
                console.log('ActionBetting: Bet placed successfully:', betData);
                this.closeModal();
                return result;
            } else {
                throw new Error(result.message || 'Failed to place bet');
            }
            
        } catch (error) {
            console.error('Action bet placement failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Places an action bet
     * @param {string} choiceId - Selected choice ID
     * @param {number} amount - Bet amount
     * @returns {Object} Bet placement result
     */
    placeBet(choiceId, amount) {
        try {
            if (!this.isModalOpen || !this.currentEvent) {
                throw new Error('No active betting opportunity');
            }

            // Find the selected choice
            const choice = this.currentEvent.choices.find(c => c.id === choiceId);
            if (!choice) {
                throw new Error('Invalid choice selected');
            }

            // Create bet data
            const betData = {
                type: 'actionBet',
                outcome: choice.outcome,
                stake: amount,
                odds: choice.odds,
                eventId: this.currentEvent.id
            };

            // Place bet through BettingManager
            const result = this.bettingManager.placeBet(betData);
            
            if (result.success) {
                // Update bet amount memory
                this.stateManager.updateBetAmountMemory('opportunity', amount);
                
                // Notify callback
                if (this.callbacks.onBetPlaced) {
                    this.callbacks.onBetPlaced(result.bet, choice);
                }

                // Close modal and resume game
                this.closeModal();
                
                console.log(`Action bet placed: ${choice.description} for $${amount}`);
            }

            return result;
        } catch (error) {
            console.error('Action bet placement failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Skips the current betting opportunity
     * @returns {Object} Skip result
     */
    skipBetting() {
        try {
            if (!this.isModalOpen) {
                throw new Error('No active betting opportunity to skip');
            }

            console.log('Action betting opportunity skipped');
            
            // Notify callback
            if (this.callbacks.onSkip) {
                this.callbacks.onSkip(this.currentEvent);
            }

            // Close modal and resume game
            this.closeModal();
            
            return { success: true };
        } catch (error) {
            console.error('Skip betting failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handles countdown timer updates
     * @param {number} remaining - Remaining time in seconds
     */
    handleCountdownUpdate(remaining) {
        if (this.callbacks.onCountdownUpdate) {
            this.callbacks.onCountdownUpdate(remaining);
        }
    }

    /**
     * Handles countdown completion (timeout)
     */
    handleCountdownComplete() {
        if (this.isModalOpen) {
            this.handleTimeout();
        }
    }

    /**
     * Handles betting timeout
     */
    handleTimeout() {
        try {
            console.log('Action betting opportunity timed out');
            
            // Notify callback
            if (this.callbacks.onTimeout) {
                this.callbacks.onTimeout(this.currentEvent);
            }

            // Close modal and resume game
            this.closeModal();
        } catch (error) {
            console.error('Timeout handling failed:', error);
        }
    }

    /**
     * Closes the betting modal and resumes the game
     */
    closeModal() {
        try {
            if (!this.isModalOpen) {
                return;
            }

            // Stop countdown timer
            this.timerManager.stopCountdown();
            
            // Hide modal UI
            if (this.callbacks.onModalHide) {
                this.callbacks.onModalHide();
            }

            // Reset state
            this.isModalOpen = false;
            this.currentEvent = null;

            // Start resume countdown before resuming game
            this.startResumeCountdown();
            
        } catch (error) {
            console.error('Modal close failed:', error);
        }
    }

    /**
     * Starts the 3-second countdown before resuming the game
     */
    startResumeCountdown() {
        console.log('Starting resume countdown...');
        
        // Start 3-second countdown
        this.timerManager.startCountdown(this.resumeCountdownDuration, () => {
            // Resume the game through callback
            if (this.callbacks.onGameResume) {
                this.callbacks.onGameResume();
            } else {
                // Fallback: resume timer directly
                this.timerManager.resumeTimer();
            }
            console.log('Game resumed after action betting');
        });
    }

    /**
     * Gets the current betting opportunity
     * @returns {Object|null} Current event data or null
     */
    getCurrentEvent() {
        return this.currentEvent ? { ...this.currentEvent } : null;
    }

    /**
     * Checks if modal is currently open
     * @returns {boolean} True if modal is open
     */
    isModalActive() {
        return this.isModalOpen;
    }

    /**
     * Gets remaining countdown time
     * @returns {number} Remaining time in seconds
     */
    getRemainingTime() {
        return this.timerManager.getCountdownTime();
    }

    /**
     * Gets pre-populated bet amount from memory
     * @returns {number} Remembered bet amount or default
     */
    getPrePopulatedAmount() {
        return this.stateManager.getBetAmountMemory('opportunity');
    }

    /**
     * Sets callback functions for action betting events
     * @param {Object} callbacks - Object containing callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Validates betting choice
     * @param {string} choiceId - Choice ID to validate
     * @returns {Object} Validation result
     */
    validateChoice(choiceId) {
        if (!this.currentEvent) {
            return { valid: false, error: 'No active betting opportunity' };
        }

        const choice = this.currentEvent.choices.find(c => c.id === choiceId);
        if (!choice) {
            return { valid: false, error: 'Invalid choice selected' };
        }

        return { valid: true, choice };
    }

    /**
     * Gets betting opportunity status
     * @returns {Object} Current status information
     */
    getStatus() {
        return {
            isModalOpen: this.isModalOpen,
            currentEvent: this.currentEvent ? { ...this.currentEvent } : null,
            remainingTime: this.getRemainingTime(),
            prePopulatedAmount: this.getPrePopulatedAmount(),
            timerStatus: this.timerManager.getStatus()
        };
    }

    /**
     * Forces close of modal (for emergency situations)
     */
    forceClose() {
        try {
            console.warn('Force closing action betting modal');
            
            this.timerManager.stopCountdown();
            this.timerManager.resumeTimer();
            
            if (this.callbacks.onModalHide) {
                this.callbacks.onModalHide();
            }

            this.isModalOpen = false;
            this.currentEvent = null;
            
        } catch (error) {
            console.error('Force close failed:', error);
        }
    }

    /**
     * Resets action betting system
     */
    reset() {
        this.forceClose();
        this.currentEvent = null;
        this.isModalOpen = false;
        
        console.log('ActionBetting system reset');
    }
}

export default ActionBetting;