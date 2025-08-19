/**
 * Betting System Module
 * 
 * This module manages the complete betting system for the Soccer Betting Game,
 * including full match bets, real-time action bets, and power-up mechanics.
 * It integrates tightly with the centralized state management system.
 * 
 * Betting Types:
 * 1. Full Match Bets - Predict final match outcome (HOME/DRAW/AWAY)
 * 2. Action Bets - Real-time betting on specific match events
 * 
 * Key Features:
 * - Comprehensive bet validation and error handling
 * - Real-time action betting with time-limited opportunities
 * - Power-up system with 2x multiplier mechanics
 * - Automatic bet resolution and winnings calculation
 * - Integration with UI for seamless user experience
 * 
 * Power-Up System:
 * - Awarded randomly after winning action bets (80% chance)
 * - 2x multiplier applies to all full match bet winnings
 * - Disabled in classic mode for traditional gameplay
 * - Visual feedback and state management integration
 * 
 * State Integration:
 * - All betting data stored in centralized state
 * - Automatic wallet balance management
 * - Observer pattern for UI updates
 * - Rollback capabilities for failed operations
 * 
 * @module betting
 * @requires gameState - For centralized state management
 * @requires utils - For validation and utility functions
 * @exports {Function} placeBet - Places bets with validation
 * @exports {Function} resolveBets - Resolves action bets
 * @exports {Function} calculatePotentialWinnings - Calculates potential returns
 * @exports {Function} awardPowerUp - Awards power-ups to players
 * @exports {Function} usePowerUp - Activates held power-ups
 * @exports {Function} showMultiChoiceActionBet - Displays action bet modals
 */

import { 
    getCurrentState, 
    updateState, 
    adjustWalletBalance, 
    addBet, 
    updatePowerUpState,
    updateCurrentActionBet,
    getClassicMode,
    getPowerUpState,
    getBettingState,
    getWalletBalance,
    getBetAmountMemory,
    updateBetAmountMemory,
    getDefaultBetAmount
} from './gameState.js';

import { validateStake, generateId } from './utils.js';
import { pauseManager } from './pauseManager.js';

// --- CENTRALIZED ERROR HANDLING AND USER FEEDBACK SYSTEM ---

/**
 * Centralized error handling and user feedback system for consistent betting experience
 * Implements Requirements 5.1, 5.2, 5.3, 5.4, 5.5 for consistent error messages and feedback
 */
class BettingFeedbackManager {
    constructor() {
        this.errorMessages = {
            // Validation errors (Requirement 5.2)
            INVALID_BET_TYPE: "Invalid bet type. Please try again.",
            INVALID_OUTCOME: "Invalid bet outcome. Please select a valid option.",
            INVALID_ODDS: "Invalid betting odds. Please refresh and try again.",
            INVALID_STAKE: "Invalid stake amount or insufficient funds.",
            INSUFFICIENT_FUNDS: "Insufficient funds. Please check your wallet balance.",
            STAKE_TOO_LOW: "Minimum bet amount is $1.",
            STAKE_TOO_HIGH: "Maximum bet amount is $1000.",
            
            // System errors (Requirement 5.3)
            BET_PLACEMENT_FAILED: "Failed to place bet. Please try again.",
            BET_RESOLUTION_FAILED: "Error resolving bets. Please refresh the page.",
            MEMORY_STORAGE_FAILED: "Unable to save bet preferences.",
            MODAL_DISPLAY_FAILED: "Display error occurred. Please refresh the page.",
            TIMER_FAILED: "Timer display error. Betting will continue normally.",
            
            // Modal integration errors (Requirement 5.3)
            MODAL_NOT_FOUND: "Betting interface not available. Please refresh the page.",
            PAUSE_INTEGRATION_FAILED: "Game pause integration failed. Betting will continue.",
            RESUME_FAILED: "Game resume failed. Please refresh the page.",
            
            // Betting opportunity errors (Requirement 5.3)
            BETTING_OPPORTUNITY_INVALID: "Invalid betting opportunity data.",
            BETTING_OPPORTUNITY_EXPIRED: "Betting opportunity has expired.",
            MULTIPLE_OPPORTUNITIES_ERROR: "Multiple betting events detected. Using latest opportunity.",
            
            // Recovery errors (Requirement 5.4)
            STATE_RECOVERY_FAILED: "Game state recovery failed. Please refresh the page.",
            EMERGENCY_CLEANUP_FAILED: "Critical error occurred. Please refresh the page."
        };
        
        this.successMessages = {
            // Bet placement success (Requirement 5.4)
            FULL_MATCH_BET_PLACED: "✅ Full match bet placed successfully!",
            ACTION_BET_PLACED: "✅ Action bet placed successfully!",
            
            // Bet resolution success (Requirement 5.4)
            ACTION_BET_WON: "✅ Action Bet Won: '{outcome}'. You won ${winnings}!",
            ACTION_BET_LOST: "❌ Action Bet Lost: '{outcome}'.",
            
            // Power-up success (Requirement 5.4)
            POWER_UP_AWARDED: "⭐ POWER-UP AWARDED: 2x Winnings Multiplier!",
            POWER_UP_APPLIED: "⚡ POWER-UP APPLIED to your full match bets! Potential winnings are now doubled.",
            
            // Modal interactions (Requirement 5.4)
            BETTING_CANCELLED: "❌ Betting cancelled.",
            BETTING_TIMEOUT: "⏰ Betting opportunity expired.",
            
            // Memory system (Requirement 5.4)
            PREFERENCES_SAVED: "Bet preferences saved."
        };
        
        this.warningMessages = {
            // Non-critical warnings (Requirement 5.3)
            MEMORY_FALLBACK: "Using default bet amount.",
            TIMER_FALLBACK: "Using simplified timer display.",
            MODAL_FALLBACK: "Using simplified betting interface.",
            ANIMATION_FALLBACK: "Using basic display mode."
        };
    }
    
    /**
     * Shows error message with consistent styling and recovery options (Requirement 5.3)
     * @param {string} errorKey - Key from errorMessages object
     * @param {Object} context - Additional context for error message
     * @param {boolean} showRecovery - Whether to show recovery options
     */
    showError(errorKey, context = {}, showRecovery = false) {
        try {
            const message = this.errorMessages[errorKey] || "An unexpected error occurred.";
            const formattedMessage = this.formatMessage(message, context);
            
            // Log error for debugging
            console.error(`Betting Error [${errorKey}]:`, formattedMessage, context);
            
            // Show user-friendly error message
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed(formattedMessage, "text-red-400");
                
                // Show recovery options for critical errors (Requirement 5.3)
                if (showRecovery) {
                    setTimeout(() => {
                        window.addEventToFeed("💡 Try refreshing the page if problems persist.", "text-yellow-400");
                    }, 1000);
                }
            }
            
            return formattedMessage;
        } catch (feedbackError) {
            console.error('Error in feedback system:', feedbackError);
            // Fallback to browser alert for critical errors
            if (typeof window !== 'undefined' && window.alert) {
                window.alert("A betting error occurred. Please refresh the page.");
            }
        }
    }
    
    /**
     * Shows success message with consistent styling (Requirement 5.4)
     * @param {string} successKey - Key from successMessages object
     * @param {Object} context - Additional context for success message
     */
    showSuccess(successKey, context = {}) {
        try {
            const message = this.successMessages[successKey] || "Operation completed successfully.";
            const formattedMessage = this.formatMessage(message, context);
            
            // Log success for debugging
            console.log(`Betting Success [${successKey}]:`, formattedMessage);
            
            // Show user-friendly success message
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed(formattedMessage, "text-green-400");
            }
            
            return formattedMessage;
        } catch (feedbackError) {
            console.error('Error in success feedback:', feedbackError);
        }
    }
    
    /**
     * Shows warning message with consistent styling (Requirement 5.3)
     * @param {string} warningKey - Key from warningMessages object
     * @param {Object} context - Additional context for warning message
     */
    showWarning(warningKey, context = {}) {
        try {
            const message = this.warningMessages[warningKey] || "Warning: Unexpected condition detected.";
            const formattedMessage = this.formatMessage(message, context);
            
            // Log warning for debugging
            console.warn(`Betting Warning [${warningKey}]:`, formattedMessage);
            
            // Show user-friendly warning message
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed(formattedMessage, "text-yellow-400");
            }
            
            return formattedMessage;
        } catch (feedbackError) {
            console.error('Error in warning feedback:', feedbackError);
        }
    }
    
    /**
     * Formats message with context variables
     * @param {string} message - Message template
     * @param {Object} context - Context variables
     * @returns {string} Formatted message
     */
    formatMessage(message, context) {
        let formatted = message;
        Object.keys(context).forEach(key => {
            const placeholder = `{${key}}`;
            if (formatted.includes(placeholder)) {
                formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), context[key]);
            }
        });
        return formatted;
    }
    
    /**
     * Validates bet parameters with consistent error handling (Requirement 5.2)
     * @param {string} type - Bet type
     * @param {string} outcome - Bet outcome
     * @param {number} odds - Bet odds
     * @param {number} stake - Bet stake
     * @returns {Object} Validation result with success flag and error details
     */
    validateBetParameters(type, outcome, odds, stake) {
        const validation = {
            success: true,
            errors: [],
            warnings: []
        };
        
        // Validate bet type (Requirement 5.2)
        if (!type || typeof type !== 'string') {
            validation.success = false;
            validation.errors.push('INVALID_BET_TYPE');
        }
        
        // Validate outcome (Requirement 5.2)
        if (!outcome || typeof outcome !== 'string') {
            validation.success = false;
            validation.errors.push('INVALID_OUTCOME');
        }
        
        // Validate odds (Requirement 5.2)
        if (typeof odds !== 'number' || isNaN(odds) || odds <= 0) {
            validation.success = false;
            validation.errors.push('INVALID_ODDS');
        }
        
        // Validate stake (Requirement 5.2)
        if (typeof stake !== 'number' || isNaN(stake)) {
            validation.success = false;
            validation.errors.push('INVALID_STAKE');
        } else if (stake < 1) {
            validation.success = false;
            validation.errors.push('STAKE_TOO_LOW');
        } else if (stake > 1000) {
            validation.success = false;
            validation.errors.push('STAKE_TOO_HIGH');
        } else {
            // Check wallet balance
            const currentState = getCurrentState();
            if (stake > currentState.wallet) {
                validation.success = false;
                validation.errors.push('INSUFFICIENT_FUNDS');
            }
        }
        
        return validation;
    }
    
    /**
     * Handles graceful fallback behavior when modal integration fails (Requirement 5.3)
     * @param {string} fallbackType - Type of fallback needed
     * @param {Object} context - Context for fallback
     * @returns {boolean} Whether fallback was successful
     */
    handleModalFallback(fallbackType, context = {}) {
        try {
            switch (fallbackType) {
                case 'MISSING_MODAL':
                    this.showWarning('MODAL_FALLBACK');
                    return this.createFallbackModal(context);
                    
                case 'TIMER_FAILURE':
                    this.showWarning('TIMER_FALLBACK');
                    return this.createFallbackTimer(context);
                    
                case 'ANIMATION_FAILURE':
                    this.showWarning('ANIMATION_FALLBACK');
                    return true; // Continue without animations
                    
                default:
                    this.showError('MODAL_DISPLAY_FAILED', context, true);
                    return false;
            }
        } catch (fallbackError) {
            console.error('Fallback handling failed:', fallbackError);
            this.showError('STATE_RECOVERY_FAILED', { error: fallbackError.message }, true);
            return false;
        }
    }
    
    /**
     * Creates a fallback modal when main modal fails (Requirement 5.3)
     * @param {Object} context - Context for modal creation
     * @returns {boolean} Whether fallback modal was created
     */
    createFallbackModal(context) {
        try {
            if (typeof window !== 'undefined' && window.confirm && context.event) {
                const choices = context.event.choices?.map(c => `${c.text} @${c.odds}`).join(', ') || 'No choices available';
                const userChoice = window.confirm(`${context.event.description}\n\nChoices: ${choices}\n\nClick OK to continue or Cancel to skip.`);
                
                if (userChoice && context.event.choices && context.event.choices.length > 0) {
                    // Use first choice as default
                    const firstChoice = context.event.choices[0];
                    showActionBetSlip('action', firstChoice.text, firstChoice.odds, context.event.betType);
                    return true;
                } else {
                    resumeGameAfterBetting();
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Fallback modal creation failed:', error);
            return false;
        }
    }
    
    /**
     * Creates a fallback timer when main timer fails (Requirement 5.3)
     * @param {Object} context - Context for timer creation
     * @returns {boolean} Whether fallback timer was created
     */
    createFallbackTimer(context) {
        try {
            const duration = context.duration || 10000;
            let remainingSeconds = Math.ceil(duration / 1000);
            
            // Create simple text countdown
            const timerElement = document.createElement('div');
            timerElement.className = 'text-center text-white mb-2 fallback-timer';
            timerElement.innerHTML = `Time remaining: <span class="font-bold">${remainingSeconds}s</span>`;
            
            // Find a suitable container
            const container = document.getElementById('action-bet-modal')?.querySelector('.bg-gray-800');
            if (container) {
                container.insertBefore(timerElement, container.firstChild);
                
                // Simple countdown
                const countdownInterval = setInterval(() => {
                    remainingSeconds--;
                    const timerSpan = timerElement.querySelector('span');
                    if (timerSpan) {
                        timerSpan.textContent = `${remainingSeconds}s`;
                    }
                    
                    if (remainingSeconds <= 0) {
                        clearInterval(countdownInterval);
                        if (context.onTimeout) {
                            context.onTimeout();
                        }
                    }
                }, 1000);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Fallback timer creation failed:', error);
            return false;
        }
    }
    
    /**
     * Ensures game state consistency after errors (Requirement 5.5)
     * @param {string} errorContext - Context where error occurred
     */
    ensureStateConsistency(errorContext) {
        try {
            console.log(`Ensuring state consistency after error in: ${errorContext}`);
            
            const currentState = getCurrentState();
            
            // Check and fix action bet state
            if (currentState.currentActionBet?.active) {
                // Clean up any hanging timeouts
                if (currentState.currentActionBet.timeoutId) {
                    clearTimeout(currentState.currentActionBet.timeoutId);
                }
                
                // Clean up timer bar
                if (currentState.currentActionBet.timerBar?.stop) {
                    currentState.currentActionBet.timerBar.stop();
                }
                
                // Reset to safe state
                updateCurrentActionBet({
                    active: false,
                    details: null,
                    timeoutId: null,
                    modalState: null,
                    timerBar: null
                });
            }
            
            // Ensure modals are in correct state
            const modals = ['action-bet-modal', 'action-bet-slip-modal', 'inline-bet-slip'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    // Only hide if not intentionally visible
                    if (!currentState.currentBet && !currentState.currentActionBet?.active) {
                        modal.classList.add('hidden');
                    }
                }
            });
            
            // Ensure game is not stuck in paused state
            if (pauseManager.isPaused() && !currentState.currentActionBet?.active) {
                console.log('Detected stuck pause state, attempting resume');
                pauseManager.resumeGame(false, 0);
            }
            
            console.log('State consistency check completed');
            
        } catch (consistencyError) {
            console.error('State consistency check failed:', consistencyError);
            this.showError('STATE_RECOVERY_FAILED', { error: consistencyError.message }, true);
        }
    }
}

// Create global instance for consistent error handling
const feedbackManager = new BettingFeedbackManager();

// --- BETTING FUNCTIONS ---

/**
 * Places a bet with comprehensive validation and state management
 * 
 * This function handles the complete bet placement process:
 * 1. Validates all input parameters for type safety
 * 2. Checks wallet balance against stake amount
 * 3. Deducts stake from wallet immediately
 * 4. Creates bet object with unique ID and status
 * 5. Adds bet to appropriate state collection
 * 6. Triggers UI updates for immediate feedback
 * 7. Handles errors with user-friendly messages
 * 
 * Bet Validation Rules:
 * - Type must be 'full-match' or 'action'
 * - Outcome must be a non-empty string
 * - Odds must be positive number
 * - Stake must be positive and <= wallet balance
 * 
 * Error Handling:
 * - Invalid parameters show user-friendly error messages
 * - Failed bets refund the stake automatically
 * - All errors are logged for debugging
 * 
 * @param {string} type - Type of bet ('full-match' or 'action')
 * @param {string} outcome - The outcome being bet on (e.g., 'HOME', 'Yellow Card')
 * @param {number} odds - The betting odds (must be > 0)
 * @param {number} stake - The stake amount (must be > 0 and <= wallet)
 * @param {string} [betType] - Optional bet type identifier for action bets
 * @returns {boolean} True if bet was placed successfully, false otherwise
 * @example
 * // Place a full match bet
 * const success = placeBet('full-match', 'HOME', 2.5, 10);
 * 
 * // Place an action bet
 * const success = placeBet('action', 'Yellow Card', 3.0, 5, 'FOUL_OUTCOME');
 */
export function placeBet(type, outcome, odds, stake, betType = null) {
    try {
        // Validate input parameters using centralized validation (Requirement 5.2)
        const validation = feedbackManager.validateBetParameters(type, outcome, odds, stake);
        
        if (!validation.success) {
            // Show all validation errors with consistent messaging (Requirement 5.3)
            validation.errors.forEach(errorKey => {
                feedbackManager.showError(errorKey, { type, outcome, odds, stake });
            });
            return false;
        }
        
        // Show any warnings
        validation.warnings.forEach(warningKey => {
            feedbackManager.showWarning(warningKey);
        });

        // Deduct stake from wallet
        adjustWalletBalance(-stake);

        if (type === 'full-match') {
            const bet = { 
                id: generateId(),
                outcome, 
                stake, 
                odds,
                status: 'PENDING'
            };
            addBet('fullMatch', bet);
            
            // Store bet amount in memory for full match bets with error handling (Requirement 5.3)
            try {
                updateBetAmountMemory('fullMatch', stake);
            } catch (error) {
                console.error('Error storing full match bet amount in memory:', error);
                feedbackManager.showWarning('MEMORY_FALLBACK');
                // Continue with bet placement even if memory storage fails
            }
            
            // Show consistent success message (Requirement 5.4)
            feedbackManager.showSuccess('FULL_MATCH_BET_PLACED', { outcome, stake: stake.toFixed(2) });
            
        } else if (type === 'action') {
            const bet = { 
                id: generateId(),
                description: outcome, 
                stake, 
                odds, 
                status: 'PENDING', 
                betType 
            };
            addBet('actionBets', bet);
            
            // Store bet amount in memory for opportunity bets with error handling (Requirement 5.3)
            try {
                updateBetAmountMemory('opportunity', stake);
            } catch (error) {
                console.error('Error storing opportunity bet amount in memory:', error);
                feedbackManager.showWarning('MEMORY_FALLBACK');
                // Continue with bet placement even if memory storage fails
            }
            
            // Show consistent success message (Requirement 5.4)
            feedbackManager.showSuccess('ACTION_BET_PLACED', { outcome, stake: stake.toFixed(2) });
            
        } else {
            // This should not happen due to validation, but handle gracefully
            console.error(`Unknown bet type after validation: ${type}`);
            // Refund the stake since bet wasn't placed
            adjustWalletBalance(stake);
            feedbackManager.showError('INVALID_BET_TYPE');
            return false;
        }

        // Trigger UI re-render when available
        if (typeof window !== 'undefined' && window.render) {
            window.render();
        }
        
        // If this is an action bet, handle the betting decision completion
        if (type === 'action') {
            handleBettingDecision(true);
        }
        
        return true;
    } catch (error) {
        console.error('Error placing bet:', error);
        
        // Attempt to refund stake if error occurred after deduction
        try {
            const currentState = getCurrentState();
            if (currentState.wallet < stake) {
                adjustWalletBalance(stake); // Refund
            }
        } catch (refundError) {
            console.error('Error attempting refund:', refundError);
        }
        
        // Show consistent error message with recovery options (Requirement 5.3)
        feedbackManager.showError('BET_PLACEMENT_FAILED', { error: error.message }, true);
        
        // Ensure state consistency after error (Requirement 5.5)
        feedbackManager.ensureStateConsistency('placeBet');
        
        return false;
    }
}

/**
 * Resolves action bets based on actual match event outcomes
 * 
 * This function processes the resolution of time-sensitive action bets
 * when match events conclude. It handles the complete resolution flow:
 * 
 * Resolution Process:
 * 1. Finds all pending bets matching the bet type
 * 2. Compares bet outcomes with actual results
 * 3. Updates bet status to 'WON' or 'LOST'
 * 4. Calculates and awards winnings for successful bets
 * 5. Updates wallet balance with winnings
 * 6. Provides user feedback through event feed
 * 7. Awards power-ups for winning action bets (80% chance)
 * 
 * Power-Up Award Logic:
 * - Only awarded for winning action bets
 * - 80% chance of receiving 2x multiplier power-up
 * - Not awarded in classic mode
 * - Only one power-up can be held at a time
 * 
 * @param {string} betType - The type of bet to resolve (e.g., 'FOUL_OUTCOME')
 * @param {string} result - The actual result that occurred (e.g., 'Yellow Card')
 * @throws {Error} Logs errors but doesn't throw, continues processing other bets
 * @example
 * // Resolve foul outcome bets when referee makes decision
 * resolveBets('FOUL_OUTCOME', 'Yellow Card');
 * // This will:
 * // - Mark matching bets as WON/LOST
 * // - Award winnings to successful bets
 * // - Potentially award power-ups
 */
export function resolveBets(betType, result) {
    try {
        // Validate input parameters with consistent error handling (Requirement 5.2)
        if (!betType || typeof betType !== 'string') {
            feedbackManager.showError('INVALID_BET_TYPE', { betType });
            return;
        }
        
        if (!result || typeof result !== 'string') {
            feedbackManager.showError('INVALID_OUTCOME', { result });
            return;
        }
        
        const currentState = getCurrentState();
        
        if (!currentState.bets || !Array.isArray(currentState.bets.actionBets)) {
            feedbackManager.showError('BET_RESOLUTION_FAILED', { reason: 'Invalid bets state structure' }, true);
            return;
        }
        
        let resolvedCount = 0;
        let wonCount = 0;
        let lostCount = 0;
        
        // Use map to create a new array with updated statuses, ensuring a clean state update
        const updatedActionBets = currentState.bets.actionBets.map(bet => {
        // If this isn't the bet we're looking for, return it unchanged
        if (bet.betType !== betType || bet.status !== 'PENDING') {
            return bet;
        }

        // It's the right type and pending, so resolve it
        if (bet.description === result) {
            bet.status = 'WON';
            const winnings = bet.stake * bet.odds;
            adjustWalletBalance(winnings);
            
            // Import addEventToFeed from ui module when available
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed(`✅ Action Bet Won: '${bet.description}'. You won $${winnings.toFixed(2)}!`, 'text-green-400');
            }
            
            // Award power-up if conditions are met
            const powerUpState = getPowerUpState();
            const classicMode = getClassicMode();
            if (!powerUpState.held && !classicMode && Math.random() > 0.2) {
                awardPowerUp('2x_MULTIPLIER');
            }
        } else {
            bet.status = 'LOST';
            
            // Import addEventToFeed from ui module when available
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed(`❌ Action Bet Lost: '${bet.description}'.`, 'text-red-400');
            }
        }
        return bet;
    });

    // Update the state with resolved bets
    updateState({
        bets: {
            ...currentState.bets,
            actionBets: updatedActionBets
        }
    });

        // Trigger UI re-render when available
        if (typeof window !== 'undefined' && window.render) {
            window.render();
        }
        // Log resolution summary for debugging
        console.log(`Bet resolution completed: ${resolvedCount} bets resolved (${wonCount} won, ${lostCount} lost) for ${betType} -> ${result}`);

        // Trigger UI re-render when available
        if (typeof window !== 'undefined' && window.render) {
            window.render();
        }
        
    } catch (error) {
        console.error('Error resolving bets:', error);
        
        // Show consistent error message with recovery options (Requirement 5.3)
        feedbackManager.showError('BET_RESOLUTION_FAILED', { 
            betType, 
            result, 
            error: error.message 
        }, true);
        
        // Ensure state consistency after error (Requirement 5.5)
        feedbackManager.ensureStateConsistency('resolveBets');
    }
}

/**
 * Calculates potential winnings for current full match bets
 * @returns {number} Total potential winnings
 */
export function calculatePotentialWinnings() {
    const bettingState = getBettingState();
    const powerUpState = getPowerUpState();
    
    let potentialWin = bettingState.fullMatch.reduce((sum, bet) => {
        return sum + (bet.stake * bet.odds);
    }, 0);

    if (powerUpState.applied) {
        potentialWin *= 2;
    }
    
    return potentialWin;
}

/**
 * Validates a bet before placing it
 * @param {number} stake - The stake amount
 * @returns {boolean} True if bet is valid
 */
export function validateBet(stake) {
    const walletBalance = getWalletBalance();
    return validateStake(stake, walletBalance);
}

// --- POWER-UP FUNCTIONS ---

/**
 * Awards a power-up to the player
 * @param {string} type - Type of power-up to award
 */
export function awardPowerUp(type) {
    try {
        updatePowerUpState({ held: type });
        
        // Show consistent success message (Requirement 5.4)
        feedbackManager.showSuccess('POWER_UP_AWARDED');
        
        // Import renderPowerUp from ui module when available
        if (typeof window !== 'undefined' && window.renderPowerUp) {
            window.renderPowerUp();
        }
    } catch (error) {
        console.error('Error awarding power-up:', error);
        // Don't show error to user for power-up failures as they're not critical
    }
}

/**
 * Uses the held power-up if conditions are met
 * @returns {boolean} True if power-up was used successfully
 */
export function usePowerUp() {
    try {
        const powerUpState = getPowerUpState();
        const bettingState = getBettingState();
        
        if (powerUpState.held && bettingState.fullMatch.length > 0 && !powerUpState.applied) {
            updatePowerUpState({ 
                applied: true, 
                held: null 
            });
            
            // Show consistent success message (Requirement 5.4)
            feedbackManager.showSuccess('POWER_UP_APPLIED');
            
            // Trigger UI re-render when available
            if (typeof window !== 'undefined' && window.render) {
                window.render();
            }
            
            return true;
        } else if (bettingState.fullMatch.length === 0) {
            // Show consistent warning message (Requirement 5.3)
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed(`Place a Full Match Bet before using a Power-Up!`, 'text-yellow-400');
            }
            return false;
        }
        
        return false;
    } catch (error) {
        console.error('Error using power-up:', error);
        feedbackManager.showError('BET_PLACEMENT_FAILED', { context: 'power-up usage' });
        return false;
    }
}

// --- ACTION BET FUNCTIONS ---

/**
 * Shows the multi-choice action bet modal for time-sensitive betting
 * 
 * This function creates an interactive betting opportunity during live matches.
 * Action bets are time-limited (10 seconds) and offer multiple outcome choices
 * with different odds based on probability.
 * 
 * Integration with Pause System:
 * 1. Pauses the game before showing betting interface
 * 2. Ensures pause activates before displaying betting options
 * 3. Handles betting decisions to trigger resume
 * 4. Manages timeout scenarios with automatic resume
 * 
 * Modal Setup Process:
 * 1. Triggers game pause for betting opportunity
 * 2. Updates current action bet state to active
 * 3. Populates modal with event description and choices
 * 4. Creates clickable buttons for each betting option
 * 5. Starts visual countdown timer animation with TimerBar component
 * 6. Sets 10-second auto-hide timeout
 * 7. Handles user interactions and bet placement
 * 
 * User Experience Features:
 * - Game pauses to ensure no missed action
 * - Visual countdown bar showing remaining time with color changes
 * - Clear odds display for each choice
 * - One-click betting option selection
 * - Automatic timeout with user notification
 * - Seamless transition to bet slip for stake entry
 * - Automatic game resume after betting decision
 * - Minimizable modal instead of closable (Requirements 1.1, 1.2)
 * 
 * Error Handling (Requirement 4.4):
 * - Handles multiple betting events with queue/replace behavior
 * - Provides fallback behavior when DOM elements are missing
 * - Implements graceful degradation when animations fail
 * - Includes error recovery for corrupted modal states
 * 
 * @param {Object} event - The match event containing bet details
 * @param {string} event.description - Event description for display
 * @param {string} event.betType - Bet type identifier for resolution
 * @param {Array<Object>} event.choices - Available betting choices
 * @param {string} event.choices[].text - Choice description
 * @param {number} event.choices[].odds - Betting odds for this choice
 * @example
 * // Show action bet for a foul event
 * showMultiChoiceActionBet({
 *   description: 'Crunching tackle near the box! What will the ref do?',
 *   betType: 'FOUL_OUTCOME',
 *   choices: [
 *     { text: 'Yellow Card', odds: 2.5 },
 *     { text: 'Red Card', odds: 8.0 },
 *     { text: 'Warning', odds: 1.5 }
 *   ]
 * });
 */
export function showMultiChoiceActionBet(event) {
    try {
        // Handle multiple betting events (Requirement 4.4)
        const currentState = getCurrentState();
        if (currentState.currentActionBet.active) {
            console.log('Multiple betting events detected - replacing current with new event');
            
            // Clean up existing betting opportunity
            try {
                hideActionBet(true);
                hideMinimizedIndicator();
                
                // Clear any existing timeouts
                if (currentState.currentActionBet.timeoutId) {
                    clearTimeout(currentState.currentActionBet.timeoutId);
                }
                
                // Stop existing timer bar if present
                if (currentState.currentActionBet.timerBar && typeof currentState.currentActionBet.timerBar.stop === 'function') {
                    currentState.currentActionBet.timerBar.stop();
                }
            } catch (cleanupError) {
                console.error('Error cleaning up previous betting opportunity:', cleanupError);
                // Continue with new betting opportunity despite cleanup errors
            }
        }

        // Validate event parameter with consistent error handling (Requirement 5.3)
        if (!event || typeof event !== 'object') {
            feedbackManager.showError('BETTING_OPPORTUNITY_INVALID', { reason: 'Invalid event parameter' });
            return;
        }

        if (!event.description || typeof event.description !== 'string') {
            feedbackManager.showError('BETTING_OPPORTUNITY_INVALID', { reason: 'Missing description' });
            return;
        }

        if (!event.betType || typeof event.betType !== 'string') {
            feedbackManager.showError('BETTING_OPPORTUNITY_INVALID', { reason: 'Missing bet type' });
            return;
        }

        if (!Array.isArray(event.choices) || event.choices.length === 0) {
            feedbackManager.showError('BETTING_OPPORTUNITY_INVALID', { reason: 'No betting choices available' });
            return;
        }

        // Validate each choice
        for (let i = 0; i < event.choices.length; i++) {
            const choice = event.choices[i];
            if (!choice || typeof choice !== 'object' || !choice.text || typeof choice.odds !== 'number' || choice.odds <= 0) {
                feedbackManager.showError('BETTING_OPPORTUNITY_INVALID', { reason: 'Invalid choice data' });
                return;
            }
        }
        // Pause the game before showing betting interface (Requirement 1.1)
        const pauseSuccess = pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
        if (!pauseSuccess) {
            console.error('Failed to pause game for betting opportunity');
            // Continue with betting interface even if pause fails
        }

        const duration = 10000; // 10 seconds
        const startTime = Date.now();
        
        console.log('Setting up betting opportunity with duration:', duration, 'ms');

        // Set current action bet state with modal state management
        updateCurrentActionBet({
            active: true,
            details: event,
            timeoutId: null,
            modalState: {
                visible: true,
                minimized: false,
                startTime: startTime,
                duration: duration
            }
        });

        // Update modal content with fallback behavior for missing DOM elements (Requirement 4.4)
        const titleElement = document.getElementById('action-bet-title');
        const descriptionElement = document.getElementById('action-bet-main-description');
        const choicesContainer = document.getElementById('action-bet-choices');
        const actionBetModal = document.getElementById('action-bet-modal');

        // Fallback behavior when DOM elements are missing (Requirement 4.4)
        if (!actionBetModal) {
            console.error('Critical error: action-bet-modal element not found');
            
            // Try to create a fallback modal
            try {
                const fallbackModal = createFallbackModal(event);
                if (fallbackModal) {
                    console.log('Created fallback modal for betting opportunity');
                    return;
                } else {
                    throw new Error('Failed to create fallback modal');
                }
            } catch (fallbackError) {
                console.error('Failed to create fallback modal:', fallbackError);
                
                // Last resort: show browser alert
                if (typeof window !== 'undefined' && window.confirm) {
                    const choices = event.choices.map(c => `${c.text} @${c.odds}`).join(', ');
                    const userChoice = window.confirm(`${event.description}\n\nChoices: ${choices}\n\nClick OK to continue or Cancel to skip.`);
                    if (userChoice) {
                        // Show first choice as default
                        showActionBetSlip('action', event.choices[0].text, event.choices[0].odds, event.betType);
                    } else {
                        resumeGameAfterBetting();
                    }
                }
                return;
            }
        }

        // Check for other critical DOM elements and provide fallbacks
        if (!choicesContainer) {
            console.error('Choices container not found, attempting to create fallback');
            try {
                const fallbackContainer = document.createElement('div');
                fallbackContainer.id = 'action-bet-choices';
                fallbackContainer.className = 'space-y-2';
                
                // Try to find a parent container to append to
                const modalContent = actionBetModal.querySelector('.bg-gray-800') || actionBetModal;
                if (modalContent) {
                    modalContent.appendChild(fallbackContainer);
                    console.log('Created fallback choices container');
                } else {
                    throw new Error('No suitable parent container found');
                }
            } catch (fallbackError) {
                console.error('Failed to create fallback choices container:', fallbackError);
                // Continue without choices container - will handle in choice creation
            }
        }
        
        // Ensure pause header is visible and properly configured (Requirements 2.1, 2.2)
        try {
            const pauseHeader = document.getElementById('action-bet-pause-header');
            if (pauseHeader) {
                // Make sure pause header is visible
                pauseHeader.style.display = 'block';
                
                // Update pause message if needed
                const pauseMessage = pauseHeader.querySelector('span:last-child');
                if (pauseMessage) {
                    pauseMessage.textContent = '⏸️ Game Paused - Betting Opportunity';
                }
            } else {
                console.warn('Pause header not found, creating fallback');
                const fallbackPauseHeader = document.createElement('div');
                fallbackPauseHeader.id = 'action-bet-pause-header';
                fallbackPauseHeader.className = 'pause-info-header mb-4 p-3 bg-yellow-900 rounded-lg border border-yellow-600';
                fallbackPauseHeader.innerHTML = `
                    <div class="flex items-center justify-center space-x-2">
                        <span class="text-yellow-300">⏸️</span>
                        <span class="text-yellow-300 font-semibold">Game Paused - Betting Opportunity</span>
                    </div>
                `;
                
                // Insert at the beginning of the modal content
                const modalContent = actionBetModal.querySelector('.bg-gray-800');
                if (modalContent && modalContent.firstChild) {
                    modalContent.insertBefore(fallbackPauseHeader, modalContent.firstChild);
                } else if (modalContent) {
                    modalContent.appendChild(fallbackPauseHeader);
                }
            }
        } catch (pauseHeaderError) {
            console.error('Error updating pause header:', pauseHeaderError);
        }

        // Update modal content with error handling for missing elements
        try {
            if (titleElement) {
                titleElement.textContent = '⚡ Action Bet! ⚡';
            } else {
                console.warn('Title element not found, creating fallback');
                const fallbackTitle = document.createElement('h2');
                fallbackTitle.textContent = '⚡ Action Bet! ⚡';
                fallbackTitle.className = 'text-xl font-bold mb-2 text-center text-white';
                actionBetModal.querySelector('.bg-gray-800')?.prepend(fallbackTitle);
            }
        } catch (titleError) {
            console.error('Error updating title element:', titleError);
        }

        try {
            if (descriptionElement) {
                descriptionElement.textContent = event.description;
            } else {
                console.warn('Description element not found, creating fallback');
                const fallbackDescription = document.createElement('p');
                fallbackDescription.textContent = event.description;
                fallbackDescription.className = 'mb-4 text-center text-white';
                actionBetModal.querySelector('.bg-gray-800')?.appendChild(fallbackDescription);
            }
        } catch (descriptionError) {
            console.error('Error updating description element:', descriptionError);
        }

        // Handle choices container with enhanced styling and error handling
        const finalChoicesContainer = choicesContainer || document.getElementById('action-bet-choices');
        
        console.log('Choices container found:', !!finalChoicesContainer);
        console.log('Event choices:', event.choices);
        
        if (finalChoicesContainer) {
            try {
                finalChoicesContainer.innerHTML = '';
                console.log('Cleared choices container, adding', event.choices.length, 'choices');

                event.choices.forEach((choice, index) => {
                    console.log(`Creating button ${index}: ${choice.text} @${choice.odds}`);
                    
                    try {
                        const button = document.createElement('button');
                        button.className = 'w-full py-3 bg-gray-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition mb-2';
                        button.style.display = 'block';
                        button.innerHTML = `${choice.text} <span class="text-gray-400 text-xs">@${choice.odds.toFixed(2)}</span>`;
                        
                        button.onclick = () => {
                            console.log(`Choice clicked: ${choice.text}`);
                            try {
                                minimizeActionBet();
                                showActionBetSlip('action', choice.text, choice.odds, event.betType);
                            } catch (choiceError) {
                                console.error(`Error handling choice selection for ${choice.text}:`, choiceError);
                                // Fallback: try direct bet placement with default amount
                                try {
                                    placeBet('action', choice.text, choice.odds, 25, event.betType);
                                } catch (betError) {
                                    console.error('Fallback bet placement also failed:', betError);
                                    if (typeof window !== 'undefined' && window.addEventToFeed) {
                                        window.addEventToFeed("Error placing bet. Please try again.", "text-red-400");
                                    }
                                }
                            }
                        };
                        
                        finalChoicesContainer.appendChild(button);
                        console.log(`✅ Button ${index} added to container`);
                        
                    } catch (buttonError) {
                        console.error(`❌ Error creating choice button ${index}:`, buttonError);
                        
                        // Create simple fallback button
                        try {
                            const fallbackButton = document.createElement('button');
                            fallbackButton.textContent = `${choice.text} @${choice.odds}`;
                            fallbackButton.style.cssText = 'width: 100%; padding: 12px; margin: 4px 0; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer;';
                            fallbackButton.onclick = () => {
                                console.log(`Fallback choice clicked: ${choice.text}`);
                                placeBet('action', choice.text, choice.odds, 25, event.betType);
                            };
                            finalChoicesContainer.appendChild(fallbackButton);
                            console.log(`✅ Fallback button ${index} created`);
                        } catch (fallbackError) {
                            console.error(`❌ Even fallback button failed:`, fallbackError);
                        }
                    }
                });
                
                // Add a simple skip button at the end
                try {
                    const skipButton = document.createElement('button');
                    skipButton.textContent = 'Skip Betting';
                    skipButton.className = 'w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition mt-2';
                    skipButton.onclick = () => {
                        console.log('Skip button clicked');
                        hideActionBet();
                        resumeGameAfterBetting();
                    };
                    finalChoicesContainer.appendChild(skipButton);
                    console.log('✅ Skip button added');
                } catch (skipError) {
                    console.error('Error adding skip button:', skipError);
                }

                // Enhanced action buttons are now handled by the HTML structure
                // Update the existing button event handlers
                try {
                    const minimizeButton = document.getElementById('minimize-action-bet-btn');
                    const skipButton = document.getElementById('skip-action-bet-btn');
                    
                    if (minimizeButton) {
                        minimizeButton.onclick = () => {
                            try {
                                minimizeButton.classList.add('button-press-animation');
                                setTimeout(() => {
                                    minimizeActionBet();
                                }, 100);
                            } catch (minimizeError) {
                                console.error('Error minimizing action bet:', minimizeError);
                                // Fallback: hide modal
                                try {
                                    hideActionBet();
                                } catch (hideError) {
                                    console.error('Fallback hide also failed:', hideError);
                                }
                            }
                        };
                    }
                    
                    if (skipButton) {
                        skipButton.onclick = () => {
                            try {
                                skipButton.classList.add('button-press-animation');
                                setTimeout(() => {
                                    hideActionBet();
                                    // Resume game immediately when skipping
                                    resumeGameAfterBetting();
                                }, 100);
                            } catch (skipError) {
                                console.error('Error handling skip betting:', skipError);
                                // Fallback: force resume
                                try {
                                    if (pauseManager.isPaused()) {
                                        pauseManager.resumeGame(false, 0);
                                    }
                                } catch (resumeError) {
                                    console.error('Fallback resume also failed:', resumeError);
                                }
                            }
                        };
                    }
                } catch (actionButtonError) {
                    console.error('Error setting up action buttons:', actionButtonError);
                }
            } catch (choicesError) {
                console.error('Error populating choices container:', choicesError);
                
                // Fallback: create simple text-based choices
                try {
                    finalChoicesContainer.innerHTML = '<p class="text-white mb-2">Betting choices (click to select):</p>';
                    event.choices.forEach((choice, index) => {
                        const link = document.createElement('a');
                        link.href = '#';
                        link.className = 'block text-blue-400 hover:text-blue-300 mb-1';
                        link.textContent = `${choice.text} @${choice.odds}`;
                        link.onclick = (e) => {
                            e.preventDefault();
                            try {
                                minimizeActionBet();
                                showActionBetSlip('action', choice.text, choice.odds, event.betType);
                            } catch (linkError) {
                                console.error('Error in fallback choice link:', linkError);
                            }
                        };
                        finalChoicesContainer.appendChild(link);
                    });
                } catch (fallbackError) {
                    console.error('Fallback choices creation also failed:', fallbackError);
                }
            }
        } else {
            console.error('No choices container available, cannot display betting options');
            // Last resort: show alert with choices
            try {
                const choices = event.choices.map(c => `${c.text} @${c.odds}`).join('\n');
                if (typeof window !== 'undefined' && window.alert) {
                    window.alert(`Betting Opportunity:\n${event.description}\n\nChoices:\n${choices}\n\nPlease refresh the page to fix display issues.`);
                }
            } catch (alertError) {
                console.error('Even alert fallback failed:', alertError);
            }
        }

        // Show modal FIRST before starting any timers
        let modalShown = false;
        try {
            if (actionBetModal) {
                console.log('Showing action bet modal...');
                console.log('Modal classes before:', actionBetModal.className);
                
                actionBetModal.classList.remove('hidden');
                
                // Force proper modal positioning with inline styles
                actionBetModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 1rem;
                `;
                
                console.log('Modal classes after removing hidden:', actionBetModal.className);
                console.log('Modal display style:', window.getComputedStyle(actionBetModal).display);
                
                // Apply enhanced entrance animation
                const modalContent = actionBetModal.querySelector('.action-bet-modal-content');
                if (modalContent) {
                    modalContent.classList.remove('enhanced-modal-exit');
                    modalContent.classList.add('enhanced-modal-entrance');
                    
                    // Also force modal content positioning
                    modalContent.style.cssText = `
                        background: linear-gradient(145deg, #1f2937, #111827);
                        border-radius: 1rem;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
                        padding: 1.5rem;
                        width: 100%;
                        max-width: 24rem;
                        position: relative;
                    `;
                }
                
                modalShown = true;
                console.log('✅ Modal successfully shown');
                
                // Add click-outside-to-minimize behavior (Requirement 1.1)
                try {
                    setupModalMinimizeHandlers(actionBetModal);
                } catch (handlerError) {
                    console.error('Error setting up modal minimize handlers:', handlerError);
                    // Continue without click-outside behavior
                }
                
            } else {
                console.error('Action bet modal element not found after fallback attempts');
            }
        } catch (modalShowError) {
            console.error('Error showing modal:', modalShowError);
        }
        
        // Only start timer if modal was successfully shown
        if (!modalShown) {
            console.error('Modal not shown, aborting betting opportunity');
            resumeGameAfterBetting();
            return;
        }

        // Wait a moment for modal to render, then start timer
        setTimeout(() => {
            console.log('Starting timer after modal render delay...');
            startBettingTimer();
        }, 100);
        
        function startBettingTimer() {
        // Initialize and start TimerBar component with graceful degradation (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
        try {
            if (typeof TimerBar !== 'undefined') {
                // Create a custom timer bar that works with existing HTML structure
                const timerBarElement = document.getElementById('action-bet-timer-bar');
                if (timerBarElement) {
                    try {
                        // Create a custom timer bar implementation for the existing element
                        const timerBar = {
                            element: timerBarElement,
                            duration: duration,
                            startTime: startTime,
                            isRunning: true,
                            intervalId: null,
                            hasAnimationSupport: true,
                            
                            start() {
                                try {
                                    // Enhanced timer bar initialization with new modal structure
                                    this.element.style.width = '100%';
                                    this.element.className = 'modal-timer-progress';
                                    this.updateLoop();
                                } catch (startError) {
                                    console.error('Error starting enhanced timer bar:', startError);
                                    this.hasAnimationSupport = false;
                                    this.fallbackStart();
                                }
                            },
                            
                            fallbackStart() {
                                // Fallback: simple text-based countdown
                                try {
                                    this.element.innerHTML = `${Math.ceil(this.duration / 1000)}s`;
                                    this.element.style.width = 'auto';
                                    this.element.style.textAlign = 'center';
                                    this.element.style.color = 'white';
                                    this.textUpdateLoop();
                                } catch (fallbackError) {
                                    console.error('Timer bar fallback also failed:', fallbackError);
                                }
                            },
                            
                            textUpdateLoop() {
                                if (!this.isRunning) return;
                                
                                try {
                                    const elapsed = Date.now() - this.startTime;
                                    const remaining = Math.max(0, this.duration - elapsed);
                                    const seconds = Math.ceil(remaining / 1000);
                                    
                                    this.element.innerHTML = `${seconds}s`;
                                    
                                    if (remaining <= 0) {
                                        this.stop();
                                        handleBettingTimeout();
                                        return;
                                    }
                                    
                                    setTimeout(() => this.textUpdateLoop(), 1000);
                                } catch (textUpdateError) {
                                    console.error('Error in text update loop:', textUpdateError);
                                    this.stop();
                                }
                            },
                            
                            updateLoop() {
                                if (!this.isRunning) return;
                                
                                try {
                                    const elapsed = Date.now() - this.startTime;
                                    const remaining = Math.max(0, this.duration - elapsed);
                                    const progress = remaining / this.duration;
                                    
                                    // Update width with animation graceful degradation (Requirements 2.1, 2.2)
                                    if (this.hasAnimationSupport) {
                                        try {
                                            this.element.style.width = `${progress * 100}%`;
                                        } catch (widthError) {
                                            console.warn('Animation failed, switching to fallback mode');
                                            this.hasAnimationSupport = false;
                                            this.fallbackStart();
                                            return;
                                        }
                                    }
                                    
                                    // Update color based on remaining percentage (Requirements 2.3, 2.4)
                                    try {
                                        this.element.classList.remove('warning', 'urgent');
                                        if (progress > 0.5) {
                                            // Normal state - green gradient (default modal-timer-progress class)
                                        } else if (progress > 0.25) {
                                            this.element.classList.add('warning');
                                        } else {
                                            this.element.classList.add('urgent');
                                        }
                                    } catch (colorError) {
                                        console.warn('Color animation failed, continuing with basic timer');
                                        // Continue without color changes
                                    }
                                    
                                    // Check if expired (Requirement 2.5)
                                    if (remaining <= 0) {
                                        this.stop();
                                        // Handle timeout behavior regardless of modal state (Requirement 5.5)
                                        handleBettingTimeout();
                                        return;
                                    }
                                    
                                    // Continue updating every 100ms for smooth animation
                                    setTimeout(() => this.updateLoop(), 100);
                                } catch (updateError) {
                                    console.error('Error in timer update loop:', updateError);
                                    // Switch to fallback mode
                                    this.hasAnimationSupport = false;
                                    this.fallbackStart();
                                }
                            },
                            
                            stop() {
                                this.isRunning = false;
                            },
                            
                            destroy() {
                                try {
                                    this.stop();
                                    if (this.element) {
                                        this.element.style.width = '0%';
                                        this.element.className = 'timer-bar timer-bar-normal';
                                        this.element.innerHTML = '';
                                    }
                                } catch (destroyError) {
                                    console.error('Error destroying timer bar:', destroyError);
                                }
                            }
                        };
                        
                        // Start the timer
                        timerBar.start();
                        
                        // Store timer bar reference for cleanup and updates
                        updateCurrentActionBet({ timerBar: timerBar });
                    } catch (timerBarError) {
                        console.error('Error creating custom timer bar:', timerBarError);
                        // Fall through to basic fallback
                    }
                } else {
                    console.warn('Timer bar element not found, creating fallback');
                    // Try to create a fallback timer display
                    try {
                        const fallbackTimer = document.createElement('div');
                        fallbackTimer.className = 'text-center text-white mb-2';
                        fallbackTimer.innerHTML = `Time remaining: <span id="fallback-timer">${Math.ceil(duration / 1000)}s</span>`;
                        
                        const modalContent = actionBetModal.querySelector('.bg-gray-800');
                        if (modalContent) {
                            modalContent.insertBefore(fallbackTimer, modalContent.firstChild);
                            
                            // Simple countdown
                            let remainingSeconds = Math.ceil(duration / 1000);
                            const countdownInterval = setInterval(() => {
                                remainingSeconds--;
                                const timerSpan = document.getElementById('fallback-timer');
                                if (timerSpan) {
                                    timerSpan.textContent = `${remainingSeconds}s`;
                                }
                                
                                if (remainingSeconds <= 0) {
                                    clearInterval(countdownInterval);
                                    handleBettingTimeout();
                                }
                            }, 1000);
                        }
                    } catch (fallbackTimerError) {
                        console.error('Fallback timer creation failed:', fallbackTimerError);
                    }
                }
            } else {
                console.warn('TimerBar class not available, falling back to basic timer');
                // Fallback to basic timer bar animation with error handling
                try {
                    const timerBar = document.getElementById('action-bet-timer-bar');
                    if (timerBar) {
                        timerBar.classList.remove('countdown-bar-animate');
                        void timerBar.offsetWidth; // Trigger reflow
                        timerBar.classList.add('countdown-bar-animate');
                    }
                } catch (basicTimerError) {
                    console.error('Basic timer fallback failed:', basicTimerError);
                    // Continue without visual timer
                }
            }
        } catch (timerError) {
            console.error('Timer initialization failed completely:', timerError);
            // Continue without timer - timeout will still work
        }

        // Set timeout to auto-hide and resume game (backup timeout)
        try {
            const timeoutId = setTimeout(() => {
                // Handle timeout behavior with minimized modals (Requirement 5.5)
                try {
                    handleBettingTimeout();
                } catch (timeoutError) {
                    console.error('Error in betting timeout handler:', timeoutError);
                    // Force cleanup and resume
                    try {
                        hideActionBet(true);
                        if (pauseManager.isPaused()) {
                            pauseManager.resumeGame(false, 0);
                        }
                    } catch (forceCleanupError) {
                        console.error('Force cleanup also failed:', forceCleanupError);
                    }
                }
            }, duration);
            updateCurrentActionBet({ timeoutId });
        } catch (timeoutSetupError) {
            console.error('Error setting up betting timeout:', timeoutSetupError);
            // Continue without timeout - user will need to manually skip
        }

    } catch (mainError) {
        console.error('Critical error in showMultiChoiceActionBet:', mainError);
        
        // Error recovery for corrupted modal states (Requirement 4.4)
        try {
            // Reset action bet state
            updateCurrentActionBet({
                active: false,
                details: null,
                timeoutId: null,
                modalState: {
                    visible: false,
                    minimized: false,
                    startTime: null,
                    duration: null,
                    content: null,
                    timerBar: null
                }
            });
            
            // Resume game if paused
            if (pauseManager.isPaused()) {
                pauseManager.resumeGame(false, 0);
            }
            
            // Notify user of error
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Betting system error - please refresh the page if issues persist", "text-red-400");
            }
        } catch (recoveryError) {
            console.error('Error recovery also failed:', recoveryError);
            // Last resort: page reload suggestion
            if (typeof window !== 'undefined' && window.confirm) {
                const shouldReload = window.confirm("A critical betting system error occurred. Would you like to reload the page?");
                if (shouldReload) {
                    window.location.reload();
                }
            }
        }
    }
}

/**
 * Creates a fallback modal when main modal DOM elements are missing (Requirement 4.4)
 * @param {Object} event - The betting event data
 * @returns {boolean} True if fallback modal was created successfully
 */
function createFallbackModal(event) {
    try {
        // Create fallback modal structure
        const fallbackModal = document.createElement('div');
        fallbackModal.id = 'action-bet-modal-fallback';
        fallbackModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        fallbackModal.setAttribute('role', 'dialog');
        fallbackModal.setAttribute('aria-modal', 'true');
        fallbackModal.setAttribute('aria-labelledby', 'fallback-modal-title');

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 text-white';

        const title = document.createElement('h2');
        title.id = 'fallback-modal-title';
        title.className = 'text-xl font-bold mb-4 text-center';
        title.textContent = '⚡ Betting Opportunity ⚡';

        const description = document.createElement('p');
        description.className = 'mb-4 text-center';
        description.textContent = event.description;

        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'space-y-2 mb-4';

        // Create choice buttons
        event.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'w-full py-3 bg-gray-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition';
            button.innerHTML = `${choice.text} <span class="text-gray-400 text-xs">@${choice.odds.toFixed(2)}</span>`;
            button.onclick = () => {
                document.body.removeChild(fallbackModal);
                minimizeActionBet();
                showActionBetSlip('action', choice.text, choice.odds, event.betType);
            };
            choicesContainer.appendChild(button);
        });

        // Add minimize and skip buttons
        const minimizeButton = document.createElement('button');
        minimizeButton.className = 'w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition mb-2';
        minimizeButton.textContent = 'Minimize';
        minimizeButton.onclick = () => {
            document.body.removeChild(fallbackModal);
            minimizeActionBet();
        };

        const skipButton = document.createElement('button');
        skipButton.className = 'w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition';
        skipButton.textContent = 'Skip Betting';
        skipButton.onclick = () => {
            document.body.removeChild(fallbackModal);
            hideActionBet();
            resumeGameAfterBetting();
        };

        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(description);
        modalContent.appendChild(choicesContainer);
        modalContent.appendChild(minimizeButton);
        modalContent.appendChild(skipButton);
        fallbackModal.appendChild(modalContent);

        // Add to document
        document.body.appendChild(fallbackModal);

        // Set up timeout for fallback modal
        const timeoutId = setTimeout(() => {
            if (document.body.contains(fallbackModal)) {
                document.body.removeChild(fallbackModal);
            }
            handleBettingTimeout();
        }, 10000);

        updateCurrentActionBet({ timeoutId });

        console.log('Fallback modal created successfully');
        return true;
    } catch (error) {
        console.error('Error creating fallback modal:', error);
        return false;
    }
}

/**
 * Handles betting timeout regardless of modal state (Requirement 5.5)
 * Ensures proper cleanup and game resume when betting opportunity expires
 * Enhanced for integrated modal timeout scenarios
 */
function handleBettingTimeout() {
    try {
        const currentState = getCurrentState();
        
        console.log('Betting opportunity timed out - handling integrated modal timeout');
        
        // Stop any running timer bars to prevent conflicts
        if (currentState.currentActionBet.timerBar) {
            try {
                currentState.currentActionBet.timerBar.stop();
                currentState.currentActionBet.timerBar.destroy();
            } catch (timerError) {
                console.error('Error stopping timer bar during timeout:', timerError);
            }
        }
        
        // Clear any active timeouts to prevent duplicate handling
        if (currentState.currentActionBet.timeoutId) {
            try {
                clearTimeout(currentState.currentActionBet.timeoutId);
            } catch (clearError) {
                console.error('Error clearing timeout during betting timeout:', clearError);
            }
        }
        
        // Hide action bet modal if visible (works for both visible and minimized states)
        hideActionBet(true);
        
        // Hide minimized indicator if present
        hideMinimizedIndicator();
        
        // Add timeout notification to event feed with enhanced context
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            const eventDescription = currentState.currentActionBet.details?.description || 'Betting opportunity';
            const modalState = currentState.currentActionBet.modalState?.minimized ? 'minimized' : 'visible';
            window.addEventToFeed(`⏰ ${eventDescription} - Time expired (${modalState} modal)!`, 'text-yellow-400');
        }
        
        // Reset action bet state before resuming (ensure proper cleanup)
        updateCurrentActionBet({
            active: false,
            details: null,
            timeoutId: null,
            modalState: null,
            minimizedIndicator: null,
            minimizedUpdateInterval: null,
            timerBar: null
        });
        
        // Resume game after timeout with enhanced error handling (Requirement 2.5, 4.6)
        resumeGameAfterBettingTimeout();
        
    } catch (error) {
        console.error('Critical error in handleBettingTimeout:', error);
        
        // Emergency cleanup and resume
        try {
            // Force hide all betting modals
            const actionBetModal = document.getElementById('action-bet-modal');
            if (actionBetModal) {
                actionBetModal.classList.add('hidden');
            }
            
            const actionBetSlipModal = document.getElementById('action-bet-slip-modal');
            if (actionBetSlipModal) {
                actionBetSlipModal.classList.add('hidden');
            }
            
            // Force resume game
            if (pauseManager && pauseManager.isPaused()) {
                pauseManager.resumeGame(false, 0); // No countdown for emergency resume
            }
            
            // Reset action bet state
            updateCurrentActionBet({
                active: false,
                details: null,
                timeoutId: null,
                modalState: null,
                minimizedIndicator: null,
                minimizedUpdateInterval: null,
                timerBar: null
            });
            
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed('⚡ Betting timeout handled with emergency cleanup', 'text-red-400');
            }
            
        } catch (emergencyError) {
            console.error('Emergency timeout cleanup also failed:', emergencyError);
        }
    }
}

/**
 * Resumes the game after betting decision is made or timeout occurs
 * Handles the countdown and resume process for betting events
 * Works regardless of modal state (visible, minimized, or closed) (Requirement 2.5, 4.6)
 * Enhanced for integrated modal context
 */
function resumeGameAfterBetting() {
    try {
        // Only resume if game is currently paused
        if (!pauseManager.isPaused()) {
            console.log('Game not paused, no resume needed');
            return;
        }
        
        const pauseInfo = pauseManager.getPauseInfo();
        
        // Verify this is a betting-related pause before resuming (Requirement 2.5)
        if (pauseInfo.reason !== 'BETTING_OPPORTUNITY') {
            console.log(`Game paused for different reason (${pauseInfo.reason}), not resuming`);
            return;
        }
        
        // Clear any existing timeout to prevent conflicts
        pauseManager.clearTimeout();
        
        // Show countdown within modal context if modal is still visible (Requirement 4.6)
        const currentState = getCurrentState();
        const actionBetModal = document.getElementById('action-bet-modal');
        const isModalVisible = actionBetModal && !actionBetModal.classList.contains('hidden');
        
        if (isModalVisible && currentState.currentActionBet.modalState?.visible) {
            // Show countdown within the modal context
            showModalCountdown(3).then(() => {
                // Complete resume after modal countdown
                completeGameResume();
            }).catch(error => {
                console.error('Error showing modal countdown:', error);
                // Fallback to standard resume
                completeGameResume();
            });
        } else {
            // Use standard pause system countdown for minimized or closed modals
            pauseManager.resumeGame(true, 3).then(() => {
                console.log('Game resumed after betting decision - standard countdown');
            }).catch(error => {
                console.error('Error resuming game after betting:', error);
                // Fallback: force resume without countdown
                completeGameResume(true);
            });
        }
        
    } catch (error) {
        console.error('Critical error in resumeGameAfterBetting:', error);
        // Emergency resume
        completeGameResume(true);
    }
}

/**
 * Enhanced resume function specifically for timeout scenarios
 * Handles integrated modal timeout with appropriate countdown display
 */
function resumeGameAfterBettingTimeout() {
    try {
        // Only resume if game is currently paused
        if (!pauseManager.isPaused()) {
            console.log('Game not paused during timeout, no resume needed');
            return;
        }
        
        const pauseInfo = pauseManager.getPauseInfo();
        
        // Verify this is a betting-related pause before resuming
        if (pauseInfo.reason !== 'BETTING_OPPORTUNITY') {
            console.log(`Game paused for different reason (${pauseInfo.reason}) during timeout, not resuming`);
            return;
        }
        
        // Clear any existing timeout to prevent conflicts
        pauseManager.clearTimeout();
        
        // For timeout scenarios, always use standard pause system countdown
        // This ensures consistent behavior regardless of modal state
        pauseManager.resumeGame(true, 3).then(() => {
            console.log('Game resumed after betting timeout - standard countdown');
        }).catch(error => {
            console.error('Error resuming game after betting timeout:', error);
            // Fallback: force resume without countdown
            completeGameResume(true);
        });
        
    } catch (error) {
        console.error('Critical error in resumeGameAfterBettingTimeout:', error);
        // Emergency resume
        completeGameResume(true);
    }
}

/**
 * Shows countdown within the modal context for integrated pause display
 * @param {number} seconds - Number of seconds to countdown
 * @returns {Promise} Promise that resolves when countdown completes
 */
function showModalCountdown(seconds = 3) {
    return new Promise((resolve, reject) => {
        try {
            const actionBetModal = document.getElementById('action-bet-modal');
            if (!actionBetModal || actionBetModal.classList.contains('hidden')) {
                reject(new Error('Modal not visible for countdown'));
                return;
            }
            
            // Find or create countdown container within modal
            let countdownContainer = actionBetModal.querySelector('.modal-countdown-container');
            if (!countdownContainer) {
                countdownContainer = document.createElement('div');
                countdownContainer.className = 'modal-countdown-container';
                
                // Insert countdown container at the top of modal content
                const modalContent = actionBetModal.querySelector('.bg-gray-800');
                if (modalContent) {
                    modalContent.insertBefore(countdownContainer, modalContent.firstChild);
                } else {
                    reject(new Error('Modal content not found'));
                    return;
                }
            }
            
            // Update pause header to show resuming state
            const pauseHeader = actionBetModal.querySelector('.pause-info-header');
            if (pauseHeader) {
                const pauseMessage = pauseHeader.querySelector('span:last-child');
                if (pauseMessage) {
                    pauseMessage.textContent = '▶️ Resuming Game';
                }
            }
            
            // Create countdown display
            countdownContainer.innerHTML = `
                <div class="modal-countdown-display">
                    <div class="modal-countdown-number">${seconds}</div>
                    <div class="modal-countdown-text">Resuming in...</div>
                </div>
            `;
            
            // Add countdown styles if not present
            addModalCountdownStyles();
            
            let currentSeconds = seconds;
            const countdownInterval = setInterval(() => {
                currentSeconds--;
                
                const countdownNumber = countdownContainer.querySelector('.modal-countdown-number');
                if (countdownNumber) {
                    if (currentSeconds > 0) {
                        countdownNumber.textContent = currentSeconds;
                        countdownNumber.classList.add('countdown-tick');
                        setTimeout(() => {
                            if (countdownNumber) {
                                countdownNumber.classList.remove('countdown-tick');
                            }
                        }, 200);
                    } else {
                        countdownNumber.textContent = 'GO!';
                        countdownNumber.classList.add('countdown-go');
                        
                        const countdownText = countdownContainer.querySelector('.modal-countdown-text');
                        if (countdownText) {
                            countdownText.textContent = 'Game Resumed';
                        }
                        
                        clearInterval(countdownInterval);
                        
                        // Clean up countdown display after brief "GO!" display
                        setTimeout(() => {
                            if (countdownContainer && countdownContainer.parentNode) {
                                countdownContainer.parentNode.removeChild(countdownContainer);
                            }
                            resolve();
                        }, 500);
                    }
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error in showModalCountdown:', error);
            reject(error);
        }
    });
}

/**
 * Completes the game resume process
 * @param {boolean} emergency - Whether this is an emergency resume
 */
function completeGameResume(emergency = false) {
    try {
        if (pauseManager.isPaused()) {
            pauseManager.resumeGame(false, 0).then(() => {
                console.log(`Game resume completed ${emergency ? '(emergency)' : '(normal)'}`);
            }).catch(error => {
                console.error('Error in completeGameResume:', error);
                // Last resort: try to clear pause state directly
                try {
                    // This is a fallback - normally we shouldn't access internal state
                    console.warn('Attempting direct pause state clear as last resort');
                } catch (lastResortError) {
                    console.error('Last resort resume also failed:', lastResortError);
                }
            });
        }
    } catch (error) {
        console.error('Critical error in completeGameResume:', error);
    }
}

/**
 * Adds CSS styles for modal countdown display
 */
function addModalCountdownStyles() {
    const styleId = 'modal-countdown-styles';
    
    // Check if styles already exist
    if (document.getElementById(styleId)) {
        return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .modal-countdown-container {
            margin-bottom: 16px;
            padding: 12px;
            background: linear-gradient(135deg, #065f46 0%, #047857 100%);
            border-radius: 8px;
            border: 1px solid #10b981;
        }

        .modal-countdown-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .modal-countdown-number {
            font-size: 2rem;
            font-weight: 900;
            color: #10b981;
            text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
            transition: all 0.2s ease;
            min-width: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-countdown-number.countdown-tick {
            transform: scale(1.2);
            color: #34d399;
            text-shadow: 0 0 30px rgba(52, 211, 153, 0.8);
        }

        .modal-countdown-number.countdown-go {
            color: #f59e0b;
            text-shadow: 0 0 30px rgba(245, 158, 11, 0.8);
            transform: scale(1.3);
            animation: modalCountdownGo 0.5s ease-out;
        }

        .modal-countdown-text {
            color: #d1fae5;
            font-size: 0.875rem;
            font-weight: 500;
            text-align: center;
        }

        @keyframes modalCountdownGo {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.4);
            }
            100% {
                transform: scale(1.3);
            }
        }

        /* Mobile responsiveness for modal countdown */
        @media (max-width: 480px) {
            .modal-countdown-number {
                font-size: 1.5rem;
                min-width: 50px;
            }
            
            .modal-countdown-text {
                font-size: 0.75rem;
            }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Minimizes the action bet modal instead of closing it (Requirements 1.1, 1.2, 1.3)
 * Shows a minimized indicator in the corner while preserving modal state and timer
 * Ensures game remains paused during minimize operation and proper resume handling
 */
export function minimizeActionBet() {
    try {
        const currentState = getCurrentState();
        
        if (!currentState.currentActionBet.active) {
            console.warn('Cannot minimize action bet: not active');
            return;
        }
        
        // Ensure game remains paused when modal is minimized
        // Verify pause state is maintained and extend timeout if needed
        if (pauseManager.isPaused()) {
            const pauseInfo = pauseManager.getPauseInfo();
            if (pauseInfo.reason === 'BETTING_OPPORTUNITY') {
                // Clear existing timeout to prevent auto-resume while minimized
                pauseManager.clearTimeout();
                
                // Calculate remaining time for the betting opportunity
                const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
                const remaining = Math.max(0, currentState.currentActionBet.modalState.duration - elapsed);
                
                // Set new timeout that matches the betting timer
                if (remaining > 0) {
                    pauseManager.pauseGame('BETTING_OPPORTUNITY', remaining + 1000); // Add 1s buffer
                    console.log(`Pause timeout extended for minimized modal: ${remaining}ms remaining`);
                } else {
                    // Timer expired while minimizing - handle timeout
                    console.log('Timer expired during minimize operation');
                    handleBettingTimeout();
                    return;
                }
            }
        } else {
            // If somehow not paused, re-establish pause for betting opportunity
            const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
            const remaining = Math.max(0, currentState.currentActionBet.modalState.duration - elapsed);
            
            if (remaining > 0) {
                pauseManager.pauseGame('BETTING_OPPORTUNITY', remaining + 1000);
                console.log('Re-established pause for minimized betting modal');
            } else {
                // Timer expired - handle timeout
                handleBettingTimeout();
                return;
            }
        }
        
        // Update modal state to minimized
        updateCurrentActionBet({
            modalState: {
                ...currentState.currentActionBet.modalState,
                visible: false,
                minimized: true
            }
        });
        
        // Clean up any countdown displays within modal before hiding
        const actionBetModal = document.getElementById('action-bet-modal');
        if (actionBetModal) {
            try {
                const countdownContainer = actionBetModal.querySelector('.modal-countdown-container');
                if (countdownContainer && countdownContainer.parentNode) {
                    countdownContainer.parentNode.removeChild(countdownContainer);
                }
            } catch (countdownError) {
                console.error('Error cleaning up countdown during minimize:', countdownError);
            }
            
            const modalContainer = actionBetModal.querySelector('.bg-gray-800');
            if (modalContainer) {
                modalContainer.classList.add('action-bet-modal-container', 'minimizing');
                
                // Hide modal after animation completes
                setTimeout(() => {
                    actionBetModal.classList.add('hidden');
                    modalContainer.classList.remove('minimizing');
                    removeModalMinimizeHandlers(actionBetModal);
                }, 400);
            } else {
                actionBetModal.classList.add('hidden');
                removeModalMinimizeHandlers(actionBetModal);
            }
        }
        
        // Timer bar continues running in background - no need to stop it
        // The TimerBar component will continue updating and will trigger expiration callback
        
        // Show minimized indicator
        showMinimizedIndicator();
        
        console.log('Action bet modal minimized - game remains paused with proper timeout handling');
        
    } catch (error) {
        console.error('Error minimizing action bet modal:', error);
        
        // Fallback: handle as timeout to ensure proper cleanup
        try {
            handleBettingTimeout();
        } catch (fallbackError) {
            console.error('Fallback timeout handling also failed:', fallbackError);
        }
    }
}

/**
 * Restores the action bet modal from minimized state (Requirement 1.4)
 * Preserves original content and remaining timer
 * Maintains pause state and reason during restore with enhanced resume handling
 */
export function restoreActionBet() {
    try {
        const currentState = getCurrentState();
        
        if (!currentState.currentActionBet.active || !currentState.currentActionBet.modalState?.minimized) {
            console.warn('Cannot restore action bet: not active or not minimized');
            return;
        }
        
        // Calculate remaining time to ensure timer accuracy
        const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
        const remaining = Math.max(0, currentState.currentActionBet.modalState.duration - elapsed);
        
        // Check if timer has expired while minimized
        if (remaining <= 0) {
            console.log('Action bet expired while minimized, handling timeout');
            handleBettingTimeout();
            return;
        }
        
        // Maintain pause state and reason during restore
        if (pauseManager.isPaused()) {
            const pauseInfo = pauseManager.getPauseInfo();
            if (pauseInfo.reason === 'BETTING_OPPORTUNITY') {
                // Update pause timeout to match remaining betting time
                pauseManager.clearTimeout();
                pauseManager.pauseGame('BETTING_OPPORTUNITY', remaining + 1000); // Add 1s buffer
                console.log(`Pause state maintained during restore: ${remaining}ms remaining`);
            }
        } else {
            // If pause was lost, re-establish it
            pauseManager.pauseGame('BETTING_OPPORTUNITY', remaining + 1000);
            console.log('Re-established pause state during modal restore');
        }
        
        // Update modal state to visible
        updateCurrentActionBet({
            modalState: {
                ...currentState.currentActionBet.modalState,
                visible: true,
                minimized: false
            }
        });
        
        // Restore modal content with original data
        const event = currentState.currentActionBet.details;
        if (event) {
            try {
                const titleElement = document.getElementById('action-bet-title');
                const descriptionElement = document.getElementById('action-bet-main-description');
                const choicesContainer = document.getElementById('action-bet-choices');
                
                // Restore original content
                if (titleElement) titleElement.textContent = '⚡ Action Bet! ⚡';
                if (descriptionElement) descriptionElement.textContent = event.description;
                
                // Restore choice buttons with original odds
                if (choicesContainer && event.choices) {
                    choicesContainer.innerHTML = '';
                    
                    event.choices.forEach(choice => {
                        const button = document.createElement('button');
                        button.className = 'w-full py-3 bg-gray-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition';
                        button.innerHTML = `${choice.text} <span class="text-gray-400 text-xs">@${choice.odds.toFixed(2)}</span>`;
                        button.onclick = () => {
                            minimizeActionBet();
                            showActionBetSlip('action', choice.text, choice.odds, event.betType);
                        };
                        choicesContainer.appendChild(button);
                    });
                    
                    // Re-add minimize button
                    const minimizeButton = document.createElement('button');
                    minimizeButton.className = 'w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition mt-2';
                    minimizeButton.textContent = 'Minimize';
                    minimizeButton.onclick = () => {
                        minimizeActionBet();
                    };
                    choicesContainer.appendChild(minimizeButton);
                    
                    // Re-add skip button with enhanced resume handling
                    const skipButton = document.createElement('button');
                    skipButton.className = 'w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition mt-1';
                    skipButton.textContent = 'Skip Betting';
                    skipButton.onclick = () => {
                        hideActionBet();
                        resumeGameAfterBetting(); // Uses enhanced resume logic
                    };
                    choicesContainer.appendChild(skipButton);
                }
            } catch (contentError) {
                console.error('Error restoring modal content:', contentError);
                // Continue with restore even if content restoration fails
            }
        }
        
        // Show the modal with restore animation
        const actionBetModal = document.getElementById('action-bet-modal');
        if (actionBetModal) {
            try {
                actionBetModal.classList.remove('hidden');
                const modalContainer = actionBetModal.querySelector('.bg-gray-800');
                if (modalContainer) {
                    modalContainer.classList.add('action-bet-modal-container', 'restoring');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                        modalContainer.classList.remove('restoring');
                    }, 400);
                }
                setupModalMinimizeHandlers(actionBetModal);
            } catch (modalError) {
                console.error('Error showing restored modal:', modalError);
            }
        }
        
        // Restore timer bar with remaining time
        const timerBarElement = document.getElementById('action-bet-timer-bar');
        if (timerBarElement && currentState.currentActionBet.timerBar) {
            try {
                // Update timer bar to show correct remaining time
                const progress = remaining / currentState.currentActionBet.modalState.duration;
                timerBarElement.style.width = `${progress * 100}%`;
                
                // Update color based on remaining percentage
                timerBarElement.classList.remove('warning', 'urgent');
                if (progress > 0.5) {
                    // Normal state - green gradient (default modal-timer-progress class)
                } else if (progress > 0.25) {
                    timerBarElement.classList.add('warning');
                } else {
                    timerBarElement.classList.add('urgent');
                }
                
                // Resume timer bar updates
                currentState.currentActionBet.timerBar.isRunning = true;
                currentState.currentActionBet.timerBar.updateLoop();
            } catch (timerError) {
                console.error('Error restoring timer bar:', timerError);
            }
        }
        
        // Hide minimized indicator
        hideMinimizedIndicator();
        
        // Add event feed notification
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            const remainingSeconds = Math.ceil(remaining / 1000);
            window.addEventToFeed(
                `📱 Betting modal restored with ${remainingSeconds}s remaining.`, 
                'text-blue-400'
            );
        }
        
        console.log(`Action bet modal restored from minimized state with ${Math.ceil(remaining / 1000)}s remaining - enhanced resume ready`);
        
    } catch (error) {
        console.error('Critical error restoring action bet modal:', error);
        // Fallback: handle timeout with proper cleanup
        try {
            handleBettingTimeout();
        } catch (fallbackError) {
            console.error('Fallback timeout handling also failed:', fallbackError);
        }
    }
}

/**
 * Shows the minimized indicator with event type and remaining time (Requirements 1.3, 3.1, 3.2)
 */
function showMinimizedIndicator() {
    const currentState = getCurrentState();
    
    if (!currentState.currentActionBet.active) return;
    
    // Import and use MinimizedIndicator
    if (typeof window !== 'undefined' && window.MinimizedIndicator) {
        const indicator = new window.MinimizedIndicator();
        const eventType = currentState.currentActionBet.details.betType || 'ACTION_BET';
        const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
        const remaining = Math.max(0, Math.ceil((currentState.currentActionBet.modalState.duration - elapsed) / 1000));
        
        indicator.show(eventType, remaining);
        indicator.onClick(() => {
            restoreActionBet();
        });
        
        // Store indicator reference for cleanup
        updateCurrentActionBet({
            minimizedIndicator: indicator
        });
        
        // Update indicator time every second with enhanced error handling (Requirements 3.2, 3.5)
        const updateInterval = setInterval(() => {
            try {
                const currentState = getCurrentState();
                
                // Check if action bet is still active and minimized
                if (!currentState.currentActionBet.active || !currentState.currentActionBet.modalState?.minimized) {
                    clearInterval(updateInterval);
                    return;
                }
                
                // Calculate remaining time
                const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
                const remaining = Math.max(0, Math.ceil((currentState.currentActionBet.modalState.duration - elapsed) / 1000));
                
                // Handle timer expiration (Requirement 3.4)
                if (remaining <= 0) {
                    clearInterval(updateInterval);
                    // Handle timeout with proper cleanup (Requirement 5.5)
                    handleBettingTimeout();
                    return;
                }
                
                // Update indicator time display (Requirement 3.2)
                if (indicator && indicator.updateTime) {
                    indicator.updateTime(remaining);
                    
                    // Apply urgency effects when less than 5 seconds (Requirement 3.3)
                    if (remaining <= 5 && !indicator.isUrgent) {
                        indicator.applyUrgentEffects();
                    } else if (remaining > 5 && indicator.isUrgent) {
                        indicator.removeUrgentEffects();
                    }
                }
                
            } catch (error) {
                console.error('Error updating minimized indicator time:', error);
                clearInterval(updateInterval);
                // Attempt to clean up on error
                hideMinimizedIndicator();
            }
        }, 1000);
        
        updateCurrentActionBet({
            minimizedUpdateInterval: updateInterval
        });
    }
}

/**
 * Hides the minimized indicator
 */
function hideMinimizedIndicator() {
    const currentState = getCurrentState();
    
    if (currentState.currentActionBet.minimizedIndicator) {
        currentState.currentActionBet.minimizedIndicator.hide();
    }
    
    if (currentState.currentActionBet.minimizedUpdateInterval) {
        clearInterval(currentState.currentActionBet.minimizedUpdateInterval);
    }
    
    updateCurrentActionBet({
        minimizedIndicator: null,
        minimizedUpdateInterval: null
    });
}



/**
 * Sets up click-outside-to-minimize behavior for the modal (Requirement 1.1)
 * @param {HTMLElement} modal - The modal element
 */
function setupModalMinimizeHandlers(modal) {
    if (!modal) return;
    
    const handleOutsideClick = (event) => {
        // Check if click is outside the modal content
        const modalContent = modal.querySelector('.bg-gray-800');
        if (modalContent && !modalContent.contains(event.target)) {
            minimizeActionBet();
        }
    };
    
    // Add click handler to modal backdrop
    modal.addEventListener('click', handleOutsideClick);
    
    // Store handler reference for cleanup
    modal._minimizeHandler = handleOutsideClick;
}

/**
 * Removes modal minimize handlers
 * @param {HTMLElement} modal - The modal element
 */
function removeModalMinimizeHandlers(modal) {
    if (!modal || !modal._minimizeHandler) return;
    
    modal.removeEventListener('click', modal._minimizeHandler);
    delete modal._minimizeHandler;
}

/**
 * Hides the action bet modal completely (for timeout or skip)
 * @param {boolean} timedOut - Whether the modal timed out
 */
export function hideActionBet(timedOut = false) {
    const currentState = getCurrentState();
    
    if (!currentState.currentActionBet.active) return;
    
    if (timedOut && typeof window !== 'undefined' && window.addEventToFeed) {
        window.addEventToFeed(`Action Bet on '${currentState.currentActionBet.details.description}' timed out.`, 'text-gray-400');
    }
    
    // Stop and clean up timer bar
    if (currentState.currentActionBet.timerBar) {
        currentState.currentActionBet.timerBar.stop();
        currentState.currentActionBet.timerBar.destroy();
    }
    
    // Clear timeout
    if (currentState.currentActionBet.timeoutId) {
        clearTimeout(currentState.currentActionBet.timeoutId);
    }
    
    // Hide minimized indicator if present
    hideMinimizedIndicator();
    
    // Remove modal handlers
    const actionBetModal = document.getElementById('action-bet-modal');
    if (actionBetModal) {
        removeModalMinimizeHandlers(actionBetModal);
        actionBetModal.classList.add('hidden');
    }
    
    // Reset action bet state
    updateCurrentActionBet({
        active: false,
        details: null,
        timeoutId: null,
        modalState: null,
        minimizedIndicator: null,
        minimizedUpdateInterval: null,
        timerBar: null
    });
}

/**
 * Shows the action bet slip modal for placing a bet
 * @param {string} type - Type of bet
 * @param {string} outcome - The outcome being bet on
 * @param {number} odds - The betting odds
 * @param {string} betType - Optional bet type identifier
 */
export function showActionBetSlip(type, outcome, odds, betType = null) {
    // Set current bet state
    updateState({ 
        currentBet: { type, outcome, odds, betType } 
    });
    
    // Update modal content
    const titleElement = document.getElementById('action-slip-title');
    const descriptionElement = document.getElementById('action-slip-description');
    const amountInput = document.getElementById('action-slip-amount');
    const actionBetSlipModal = document.getElementById('action-bet-slip-modal');
    
    if (titleElement) titleElement.textContent = 'Place Action Bet';
    if (descriptionElement) descriptionElement.textContent = `You are betting on: ${outcome}`;
    
    if (amountInput) {
        // Pre-populate amount field with last opportunity bet amount (Requirement 5.3)
        try {
            const lastAmount = getBetAmountMemory('opportunity');
            amountInput.value = lastAmount.toString();
        } catch (error) {
            console.error('Error getting opportunity bet amount memory:', error);
            feedbackManager.showWarning('MEMORY_FALLBACK');
            // Fallback to default $25 when memory retrieval fails
            const defaultAmount = getDefaultBetAmount();
            amountInput.value = defaultAmount.toString();
        }
        amountInput.focus();
        amountInput.select(); // Select the pre-populated value for easy editing
    }
    
    // Show modal
    if (actionBetSlipModal) {
        actionBetSlipModal.classList.remove('hidden');
    }
}

/**
 * Handles the completion of a betting decision (confirm or cancel)
 * This function should be called when the user confirms or cancels their bet
 * Enhanced for integrated modal interactions and proper game resume (Requirement 2.5, 4.6)
 * @param {boolean} betPlaced - Whether a bet was actually placed
 */
export function handleBettingDecision(betPlaced = false) {
    try {
        console.log(`Handling betting decision: ${betPlaced ? 'bet placed' : 'bet cancelled'}`);
        
        // Hide the bet slip modal
        const actionBetSlipModal = document.getElementById('action-bet-slip-modal');
        if (actionBetSlipModal) {
            actionBetSlipModal.classList.add('hidden');
        }
        
        // Clear current bet state
        updateState({ currentBet: null });
        
        // Clean up action bet modal and minimized indicator when decision is made (Requirement 2.5)
        const currentState = getCurrentState();
        if (currentState.currentActionBet.active) {
            // Store action description for notification before clearing state
            const actionDescription = currentState.currentActionBet.details?.description || 'Action Bet';
            
            // Stop and clean up timer bar with error handling
            if (currentState.currentActionBet.timerBar) {
                try {
                    currentState.currentActionBet.timerBar.stop();
                    currentState.currentActionBet.timerBar.destroy();
                } catch (timerError) {
                    console.error('Error cleaning up timer bar:', timerError);
                }
            }
            
            // Clear timeout with error handling
            if (currentState.currentActionBet.timeoutId) {
                try {
                    clearTimeout(currentState.currentActionBet.timeoutId);
                } catch (clearError) {
                    console.error('Error clearing timeout:', clearError);
                }
            }
            
            // Hide minimized indicator if present
            hideMinimizedIndicator();
            
            // Hide action bet modal with enhanced cleanup
            const actionBetModal = document.getElementById('action-bet-modal');
            if (actionBetModal) {
                try {
                    removeModalMinimizeHandlers(actionBetModal);
                    actionBetModal.classList.add('hidden');
                    
                    // Clean up any countdown displays within modal
                    const countdownContainer = actionBetModal.querySelector('.modal-countdown-container');
                    if (countdownContainer && countdownContainer.parentNode) {
                        countdownContainer.parentNode.removeChild(countdownContainer);
                    }
                } catch (modalError) {
                    console.error('Error cleaning up action bet modal:', modalError);
                }
            }
            
            // Reset action bet state with comprehensive cleanup
            updateCurrentActionBet({
                active: false,
                details: null,
                timeoutId: null,
                modalState: {
                    visible: false,
                    minimized: false,
                    startTime: null,
                    duration: null,
                    content: null,
                    timerBar: null
                },
                minimizedIndicator: null,
                minimizedUpdateInterval: null,
                timerBar: null
            });
            
            // Show consistent feedback message (Requirement 5.4)
            if (betPlaced) {
                // Success message already shown in placeBet function
            } else {
                feedbackManager.showSuccess('BETTING_CANCELLED', { outcome: actionDescription });
            }
        }
        
        // Resume game after betting decision with enhanced modal context handling (Requirement 2.5, 4.6)
        resumeGameAfterBetting();
        
        // Log the decision for debugging with additional context
        console.log(`Betting decision completed: ${betPlaced ? 'bet placed' : 'bet cancelled'} - game resume initiated`);
        
    } catch (error) {
        console.error('Critical error in handleBettingDecision:', error);
        
        // Show consistent error message (Requirement 5.3)
        feedbackManager.showError('STATE_RECOVERY_FAILED', { context: 'betting decision' }, true);
        
        // Emergency cleanup and resume
        try {
            // Force hide all betting modals
            const modals = ['action-bet-modal', 'action-bet-slip-modal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
            
            // Force resume game
            completeGameResume(true);
            
            // Reset action bet state
            updateCurrentActionBet({
                active: false,
                details: null,
                timeoutId: null,
                modalState: null,
                minimizedIndicator: null,
                minimizedUpdateInterval: null,
                timerBar: null
            });
            
        } catch (emergencyError) {
            console.error('Emergency betting decision cleanup also failed:', emergencyError);
            feedbackManager.showError('EMERGENCY_CLEANUP_FAILED', { error: emergencyError.message }, true);
        }
        
        // Ensure state consistency after critical error (Requirement 5.5)
        feedbackManager.ensureStateConsistency('handleBettingDecision');
    }
}

/**
 * Shows the inline bet slip for full match bets
 * @param {string} outcome - The outcome being bet on
 * @param {number} odds - The betting odds
 */
export function showInlineBetSlip(outcome, odds) {
    // Set current bet state
    updateState({ 
        currentBet: { type: 'full-match', outcome, odds } 
    });
    
    const inlineBetSlip = document.getElementById('inline-bet-slip');
    const inlineStakeAmount = document.getElementById('inline-stake-amount');
    
    if (inlineBetSlip) {
        inlineBetSlip.classList.remove('hidden');
    }
    
    if (inlineStakeAmount) {
        // Pre-populate amount field with last full match bet amount (Requirement 5.3)
        try {
            const lastAmount = getBetAmountMemory('fullMatch');
            inlineStakeAmount.value = lastAmount.toString();
        } catch (error) {
            console.error('Error getting bet amount memory:', error);
            feedbackManager.showWarning('MEMORY_FALLBACK');
            // Fallback to default $25 when memory retrieval fails
            const defaultAmount = getDefaultBetAmount();
            inlineStakeAmount.value = defaultAmount.toString();
        }
        inlineStakeAmount.focus();
        inlineStakeAmount.select(); // Select the pre-populated value for easy editing
    }

    // Update button styling
    document.querySelectorAll('[data-bet-type="full-match"]').forEach(btn => {
        btn.classList.remove('bet-btn-selected');
    });
    
    const selectedButton = document.getElementById(`full-match-btn-${outcome}`);
    if (selectedButton) {
        selectedButton.classList.add('bet-btn-selected');
    }
}

/**
 * Hides the inline bet slip
 */
export function hideInlineBetSlip() {
    const inlineBetSlip = document.getElementById('inline-bet-slip');
    if (inlineBetSlip) {
        inlineBetSlip.classList.add('hidden');
    }
    
    // Reset button styling
    document.querySelectorAll('[data-bet-type="full-match"]').forEach(btn => {
        btn.classList.remove('bet-btn-selected');
    });
    
    // Clear current bet state
    updateState({ currentBet: null });
}

// --- UTILITY FUNCTIONS ---

/**
 * Gets the total amount staked across all bets
 * @returns {number} Total staked amount
 */
export function getTotalStaked() {
    const bettingState = getBettingState();
    const fullMatchStakes = bettingState.fullMatch.reduce((sum, bet) => sum + bet.stake, 0);
    const actionBetStakes = bettingState.actionBets.reduce((sum, bet) => sum + bet.stake, 0);
    return fullMatchStakes + actionBetStakes;
}

/**
 * Gets all pending action bets
 * @returns {Array} Array of pending action bets
 */
export function getPendingActionBets() {
    const bettingState = getBettingState();
    return bettingState.actionBets.filter(bet => bet.status === 'PENDING');
}

/**
 * Gets all full match bets
 * @returns {Array} Array of full match bets
 */
export function getFullMatchBets() {
    const bettingState = getBettingState();
    return bettingState.fullMatch;
}

/**
 * Clears all bets (used when starting a new match)
 */
export function clearAllBets() {
    updateState({
        bets: {
            fullMatch: [],
            actionBets: []
        }
    });
}

/**
 * Resolves full match bets based on final match outcome
 * @param {string} finalOutcome - The final match result ('HOME', 'AWAY', or 'DRAW')
 * @returns {number} Total winnings from full match bets
 */
export function resolveFullMatchBets(finalOutcome) {
    const bettingState = getBettingState();
    const powerUpState = getPowerUpState();
    let totalWinnings = 0;

    // Update bet statuses and calculate winnings
    const updatedFullMatchBets = bettingState.fullMatch.map(bet => {
        const updatedBet = { ...bet };
        updatedBet.status = (bet.outcome === finalOutcome) ? 'WON' : 'LOST';
        
        if (updatedBet.status === 'WON') {
            let winnings = bet.stake * bet.odds;
            if (powerUpState.applied) {
                winnings *= 2;
            }
            totalWinnings += winnings;
        }
        
        return updatedBet;
    });

    // Update state with resolved bets
    updateState({
        bets: {
            ...bettingState,
            fullMatch: updatedFullMatchBets
        }
    });

    // Add winnings to wallet
    if (totalWinnings > 0) {
        adjustWalletBalance(totalWinnings);
    }

    return totalWinnings;
}

/**
 * Gets bet summary for match end display
 * @returns {Array} Array of bet summary objects
 */
export function getBetSummary() {
    const bettingState = getBettingState();
    const summary = [];

    // Add full match bets to summary
    bettingState.fullMatch.forEach(bet => {
        summary.push({
            type: 'Full Match',
            description: `${bet.outcome} @ ${bet.odds.toFixed(2)}`,
            stake: bet.stake,
            status: bet.status,
            winnings: bet.status === 'WON' ? bet.stake * bet.odds : 0
        });
    });

    // Add action bets to summary
    bettingState.actionBets.forEach(bet => {
        summary.push({
            type: 'Action Bet',
            description: bet.description,
            stake: bet.stake,
            status: bet.status,
            winnings: bet.status === 'WON' ? bet.stake * bet.odds : 0
        });
    });

    return summary;
}