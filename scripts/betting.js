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
    getWalletBalance
} from './gameState.js';

import { validateStake, generateId } from './utils.js';
import { pauseManager } from './pauseManager.js';

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
        // Validate input parameters
        if (!type || typeof type !== 'string') {
            console.error(`Invalid bet type: ${type}`);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Invalid bet type.", "text-red-400");
            }
            return false;
        }
        
        if (!outcome || typeof outcome !== 'string') {
            console.error(`Invalid bet outcome: ${outcome}`);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Invalid bet outcome.", "text-red-400");
            }
            return false;
        }
        
        if (typeof odds !== 'number' || isNaN(odds) || odds <= 0) {
            console.error(`Invalid odds: ${odds}`);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Invalid betting odds.", "text-red-400");
            }
            return false;
        }
        
        const currentState = getCurrentState();
        
        if (!validateStake(stake, currentState.wallet)) {
            console.warn(`Invalid stake: ${stake}, wallet: ${currentState.wallet}`);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Invalid stake amount or insufficient funds.", "text-red-400");
            }
            return false;
        }

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
        } else {
            console.error(`Unknown bet type: ${type}`);
            // Refund the stake since bet wasn't placed
            adjustWalletBalance(stake);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Unknown bet type.", "text-red-400");
            }
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
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            window.addEventToFeed("Failed to place bet. Please try again.", "text-red-400");
        }
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
        if (!betType || typeof betType !== 'string') {
            console.error(`Invalid bet type for resolution: ${betType}`);
            return;
        }
        
        if (!result || typeof result !== 'string') {
            console.error(`Invalid result for bet resolution: ${result}`);
            return;
        }
        
        const currentState = getCurrentState();
        
        if (!currentState.bets || !Array.isArray(currentState.bets.actionBets)) {
            console.error('Invalid bets state structure');
            return;
        }
        
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
    } catch (error) {
        console.error('Error resolving bets:', error);
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            window.addEventToFeed("Error resolving bets. Please refresh the page.", "text-red-400");
        }
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
    updatePowerUpState({ held: type });
    
    // Import addEventToFeed from ui module when available
    if (typeof window !== 'undefined' && window.addEventToFeed) {
        window.addEventToFeed(`⭐ POWER-UP AWARDED: 2x Winnings Multiplier!`, 'text-yellow-300 font-bold');
    }
    
    // Import renderPowerUp from ui module when available
    if (typeof window !== 'undefined' && window.renderPowerUp) {
        window.renderPowerUp();
    }
}

/**
 * Uses the held power-up if conditions are met
 * @returns {boolean} True if power-up was used successfully
 */
export function usePowerUp() {
    const powerUpState = getPowerUpState();
    const bettingState = getBettingState();
    
    if (powerUpState.held && bettingState.fullMatch.length > 0 && !powerUpState.applied) {
        updatePowerUpState({ 
            applied: true, 
            held: null 
        });
        
        // Import addEventToFeed from ui module when available
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            window.addEventToFeed(`⚡ POWER-UP APPLIED to your full match bets! Potential winnings are now doubled.`, 'text-yellow-300 font-bold');
        }
        
        // Trigger UI re-render when available
        if (typeof window !== 'undefined' && window.render) {
            window.render();
        }
        
        return true;
    } else if (bettingState.fullMatch.length === 0) {
        // Import addEventToFeed from ui module when available
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            window.addEventToFeed(`Place a Full Match Bet before using a Power-Up!`, 'text-yellow-400');
        }
        return false;
    }
    
    return false;
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

        // Validate event parameter (Requirement 4.4)
        if (!event || typeof event !== 'object') {
            console.error('Invalid event parameter for showMultiChoiceActionBet:', event);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Betting opportunity error - invalid event data", "text-red-400");
            }
            return;
        }

        if (!event.description || typeof event.description !== 'string') {
            console.error('Invalid event description:', event.description);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Betting opportunity error - missing description", "text-red-400");
            }
            return;
        }

        if (!event.betType || typeof event.betType !== 'string') {
            console.error('Invalid event betType:', event.betType);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Betting opportunity error - missing bet type", "text-red-400");
            }
            return;
        }

        if (!Array.isArray(event.choices) || event.choices.length === 0) {
            console.error('Invalid event choices:', event.choices);
            if (typeof window !== 'undefined' && window.addEventToFeed) {
                window.addEventToFeed("Betting opportunity error - no betting choices available", "text-red-400");
            }
            return;
        }

        // Validate each choice
        for (let i = 0; i < event.choices.length; i++) {
            const choice = event.choices[i];
            if (!choice || typeof choice !== 'object' || !choice.text || typeof choice.odds !== 'number' || choice.odds <= 0) {
                console.error(`Invalid choice at index ${i}:`, choice);
                if (typeof window !== 'undefined' && window.addEventToFeed) {
                    window.addEventToFeed("Betting opportunity error - invalid choice data", "text-red-400");
                }
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
        
        // Update modal content with error handling for missing elements
        try {
            if (titleElement) {
                titleElement.textContent = '⚡ Foul Event! ⚡';
            } else {
                console.warn('Title element not found, creating fallback');
                const fallbackTitle = document.createElement('h2');
                fallbackTitle.textContent = '⚡ Foul Event! ⚡';
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

        // Handle choices container with comprehensive error handling
        const finalChoicesContainer = choicesContainer || document.getElementById('action-bet-choices');
        
        if (finalChoicesContainer) {
            try {
                finalChoicesContainer.innerHTML = '';

                event.choices.forEach((choice, index) => {
                    try {
                        const button = document.createElement('button');
                        button.className = 'w-full py-3 bg-gray-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition';
                        button.innerHTML = `${choice.text} <span class="text-gray-400 text-xs">@${choice.odds.toFixed(2)}</span>`;
                        button.onclick = () => {
                            try {
                                minimizeActionBet();
                                showActionBetSlip('action', choice.text, choice.odds, event.betType);
                            } catch (choiceError) {
                                console.error(`Error handling choice selection for ${choice.text}:`, choiceError);
                                // Fallback: try direct bet placement
                                try {
                                    placeBet('action', choice.text, choice.odds, 10, event.betType);
                                } catch (betError) {
                                    console.error('Fallback bet placement also failed:', betError);
                                    if (typeof window !== 'undefined' && window.addEventToFeed) {
                                        window.addEventToFeed("Error placing bet. Please try again.", "text-red-400");
                                    }
                                }
                            }
                        };
                        finalChoicesContainer.appendChild(button);
                    } catch (buttonError) {
                        console.error(`Error creating choice button ${index}:`, buttonError);
                        // Continue with other choices
                    }
                });

                // Add minimize button instead of skip (Requirements 1.2, 1.3)
                try {
                    const minimizeButton = document.createElement('button');
                    minimizeButton.className = 'w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition mt-2';
                    minimizeButton.textContent = 'Minimize';
                    minimizeButton.onclick = () => {
                        try {
                            minimizeActionBet();
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
                    finalChoicesContainer.appendChild(minimizeButton);
                } catch (minimizeButtonError) {
                    console.error('Error creating minimize button:', minimizeButtonError);
                }

                // Add skip button for players who don't want to bet
                try {
                    const skipButton = document.createElement('button');
                    skipButton.className = 'w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition mt-1';
                    skipButton.textContent = 'Skip Betting';
                    skipButton.onclick = () => {
                        try {
                            hideActionBet();
                            // Resume game immediately when skipping
                            resumeGameAfterBetting();
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
                    finalChoicesContainer.appendChild(skipButton);
                } catch (skipButtonError) {
                    console.error('Error creating skip button:', skipButtonError);
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

        // Show modal with error handling
        try {
            if (actionBetModal) {
                actionBetModal.classList.remove('hidden');
                
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
                                    this.element.style.width = '100%';
                                    this.element.className = 'timer-bar timer-bar-normal';
                                    this.updateLoop();
                                } catch (startError) {
                                    console.error('Error starting timer bar:', startError);
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
                                        this.element.classList.remove('timer-bar-normal', 'timer-bar-warning', 'timer-bar-urgent');
                                        if (progress > 0.5) {
                                            this.element.classList.add('timer-bar-normal');
                                        } else if (progress > 0.25) {
                                            this.element.classList.add('timer-bar-warning');
                                        } else {
                                            this.element.classList.add('timer-bar-urgent');
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
 */
function handleBettingTimeout() {
    const currentState = getCurrentState();
    
    console.log('Betting opportunity timed out');
    
    // Hide action bet modal if visible
    hideActionBet(true);
    
    // Hide minimized indicator if present
    hideMinimizedIndicator();
    
    // Add timeout notification to event feed
    if (typeof window !== 'undefined' && window.addEventToFeed) {
        const eventDescription = currentState.currentActionBet.details?.description || 'Betting opportunity';
        window.addEventToFeed(`⏰ ${eventDescription} - Time expired!`, 'text-yellow-400');
    }
    
    // Resume game after timeout (Requirement 5.5)
    resumeGameAfterBetting();
}

/**
 * Resumes the game after betting decision is made or timeout occurs
 * Handles the countdown and resume process for betting events
 * Works regardless of modal state (visible, minimized, or closed) (Requirement 5.4)
 */
function resumeGameAfterBetting() {
    // Only resume if game is currently paused
    if (pauseManager.isPaused()) {
        const pauseInfo = pauseManager.getPauseInfo();
        
        // Verify this is a betting-related pause before resuming (Requirement 5.4)
        if (pauseInfo.reason === 'BETTING_OPPORTUNITY') {
            // Clear any existing timeout to prevent conflicts
            pauseManager.clearTimeout();
            
            // Resume with countdown regardless of modal state (Requirement 5.4)
            pauseManager.resumeGame(true, 3).then(() => {
                console.log('Game resumed after betting decision - modal state independent');
            }).catch(error => {
                console.error('Error resuming game after betting:', error);
                // Fallback: force resume without countdown
                try {
                    pauseManager.resumeGame(false, 0);
                    console.log('Fallback resume completed');
                } catch (fallbackError) {
                    console.error('Fallback resume also failed:', fallbackError);
                }
            });
        } else {
            console.log(`Game paused for different reason (${pauseInfo.reason}), not resuming`);
        }
    } else {
        console.log('Game not paused, no resume needed');
    }
}

/**
 * Minimizes the action bet modal instead of closing it (Requirements 1.1, 1.2, 1.3)
 * Shows a minimized indicator in the corner while preserving modal state and timer
 * Ensures game remains paused during minimize operation (Requirement 5.1)
 */
export function minimizeActionBet() {
    const currentState = getCurrentState();
    
    if (!currentState.currentActionBet.active) return;
    
    // Ensure game remains paused when modal is minimized (Requirement 5.1)
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
            }
        }
    } else {
        // If somehow not paused, re-establish pause for betting opportunity (Requirement 5.1)
        const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
        const remaining = Math.max(0, currentState.currentActionBet.modalState.duration - elapsed);
        
        if (remaining > 0) {
            pauseManager.pauseGame('BETTING_OPPORTUNITY', remaining + 1000);
            console.log('Re-established pause for minimized betting modal');
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
    
    // Hide the modal with animation but keep timer running
    const actionBetModal = document.getElementById('action-bet-modal');
    if (actionBetModal) {
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
    
    // Show minimized indicator (Requirement 1.3)
    showMinimizedIndicator();
    
    console.log('Action bet modal minimized - game remains paused');
}

/**
 * Restores the action bet modal from minimized state (Requirement 1.4)
 * Preserves original content and remaining timer
 * Maintains pause state and reason during restore (Requirement 5.2)
 */
export function restoreActionBet() {
    const currentState = getCurrentState();
    
    if (!currentState.currentActionBet.active || !currentState.currentActionBet.modalState?.minimized) {
        console.warn('Cannot restore action bet: not active or not minimized');
        return;
    }
    
    try {
        // Calculate remaining time to ensure timer accuracy (Requirement 1.4)
        const elapsed = Date.now() - currentState.currentActionBet.modalState.startTime;
        const remaining = Math.max(0, currentState.currentActionBet.modalState.duration - elapsed);
        
        // Check if timer has expired while minimized
        if (remaining <= 0) {
            console.log('Action bet expired while minimized, cleaning up');
            hideActionBet(true);
            resumeGameAfterBetting();
            return;
        }
        
        // Maintain pause state and reason during restore (Requirement 5.2)
        if (pauseManager.isPaused()) {
            const pauseInfo = pauseManager.getPauseInfo();
            if (pauseInfo.reason === 'BETTING_OPPORTUNITY') {
                // Update pause timeout to match remaining betting time
                pauseManager.clearTimeout();
                pauseManager.pauseGame('BETTING_OPPORTUNITY', remaining + 1000); // Add 1s buffer
                console.log(`Pause state maintained during restore: ${remaining}ms remaining`);
            }
        } else {
            // If pause was lost, re-establish it (Requirement 5.2)
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
        
        // Restore modal content with original data (Requirement 1.4)
        const event = currentState.currentActionBet.details;
        if (event) {
            const titleElement = document.getElementById('action-bet-title');
            const descriptionElement = document.getElementById('action-bet-main-description');
            const choicesContainer = document.getElementById('action-bet-choices');
            
            // Restore original content
            if (titleElement) titleElement.textContent = '⚡ Foul Event! ⚡';
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
                
                // Re-add skip button
                const skipButton = document.createElement('button');
                skipButton.className = 'w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition mt-1';
                skipButton.textContent = 'Skip Betting';
                skipButton.onclick = () => {
                    hideActionBet();
                    resumeGameAfterBetting();
                };
                choicesContainer.appendChild(skipButton);
            }
        }
        
        // Show the modal with restore animation
        const actionBetModal = document.getElementById('action-bet-modal');
        if (actionBetModal) {
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
        }
        
        // Restore timer bar with remaining time (Requirement 1.4)
        const timerBarElement = document.getElementById('action-bet-timer-bar');
        if (timerBarElement && currentState.currentActionBet.timerBar) {
            // Update timer bar to show correct remaining time
            const progress = remaining / currentState.currentActionBet.modalState.duration;
            timerBarElement.style.width = `${progress * 100}%`;
            
            // Update color based on remaining percentage
            timerBarElement.classList.remove('timer-bar-normal', 'timer-bar-warning', 'timer-bar-urgent');
            if (progress > 0.5) {
                timerBarElement.classList.add('timer-bar-normal');
            } else if (progress > 0.25) {
                timerBarElement.classList.add('timer-bar-warning');
            } else {
                timerBarElement.classList.add('timer-bar-urgent');
            }
            
            // Resume timer bar updates
            currentState.currentActionBet.timerBar.isRunning = true;
            currentState.currentActionBet.timerBar.updateLoop();
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
        
        console.log(`Action bet modal restored from minimized state with ${Math.ceil(remaining / 1000)}s remaining`);
        
    } catch (error) {
        console.error('Error restoring action bet modal:', error);
        // Fallback: handle timeout with proper cleanup (Requirement 5.5)
        handleBettingTimeout();
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
        amountInput.value = '';
        amountInput.focus();
    }
    
    // Show modal
    if (actionBetSlipModal) {
        actionBetSlipModal.classList.remove('hidden');
    }
}

/**
 * Handles the completion of a betting decision (confirm or cancel)
 * This function should be called when the user confirms or cancels their bet
 * @param {boolean} betPlaced - Whether a bet was actually placed
 */
export function handleBettingDecision(betPlaced = false) {
    // Hide the bet slip modal
    const actionBetSlipModal = document.getElementById('action-bet-slip-modal');
    if (actionBetSlipModal) {
        actionBetSlipModal.classList.add('hidden');
    }
    
    // Clear current bet state
    updateState({ currentBet: null });
    
    // Clean up action bet modal and minimized indicator when decision is made (Requirement 4.4)
    const currentState = getCurrentState();
    if (currentState.currentActionBet.active) {
        // Stop and clean up timer bar
        if (currentState.currentActionBet.timerBar) {
            currentState.currentActionBet.timerBar.stop();
            currentState.currentActionBet.timerBar.destroy();
        }
        
        // Clear timeout
        if (currentState.currentActionBet.timeoutId) {
            clearTimeout(currentState.currentActionBet.timeoutId);
        }
        
        // Hide minimized indicator if present (Requirement 3.5)
        hideMinimizedIndicator();
        
        // Hide action bet modal
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
        
        // Add event feed notification
        if (typeof window !== 'undefined' && window.addEventToFeed) {
            const actionDescription = currentState.currentActionBet.details?.description || 'Action Bet';
            window.addEventToFeed(
                `${betPlaced ? '✅ Bet placed' : '❌ Betting cancelled'} for '${actionDescription}'.`, 
                betPlaced ? 'text-green-400' : 'text-gray-400'
            );
        }
    }
    
    // Resume game after betting decision regardless of modal state (Requirement 5.4)
    resumeGameAfterBetting();
    
    // Log the decision for debugging
    console.log(`Betting decision completed: ${betPlaced ? 'bet placed' : 'bet cancelled'}`);
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
        inlineStakeAmount.value = '';
        inlineStakeAmount.focus();
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