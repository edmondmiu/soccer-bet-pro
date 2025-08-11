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
 * Modal Setup Process:
 * 1. Updates current action bet state to active
 * 2. Populates modal with event description and choices
 * 3. Creates clickable buttons for each betting option
 * 4. Starts visual countdown timer animation
 * 5. Sets 10-second auto-hide timeout
 * 6. Handles user interactions and bet placement
 * 
 * User Experience Features:
 * - Visual countdown bar showing remaining time
 * - Clear odds display for each choice
 * - One-click betting option selection
 * - Automatic timeout with user notification
 * - Seamless transition to bet slip for stake entry
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
    // Set current action bet state
    updateCurrentActionBet({
        active: true,
        details: event,
        timeoutId: null,
    });

    // Update modal content
    const titleElement = document.getElementById('action-bet-title');
    const descriptionElement = document.getElementById('action-bet-main-description');
    const choicesContainer = document.getElementById('action-bet-choices');
    const actionBetModal = document.getElementById('action-bet-modal');
    
    if (titleElement) titleElement.textContent = '⚡ Foul Event! ⚡';
    if (descriptionElement) descriptionElement.textContent = event.description;
    
    if (choicesContainer) {
        choicesContainer.innerHTML = '';

        event.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'w-full py-3 bg-gray-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition';
            button.innerHTML = `${choice.text} <span class="text-gray-400 text-xs">@${choice.odds.toFixed(2)}</span>`;
            button.onclick = () => {
                hideActionBet();
                showActionBetSlip('action', choice.text, choice.odds, event.betType);
            };
            choicesContainer.appendChild(button);
        });
    }

    // Show modal
    if (actionBetModal) {
        actionBetModal.classList.remove('hidden');
    }

    // Start countdown timer
    const timerBar = document.getElementById('action-bet-timer-bar');
    if (timerBar) {
        timerBar.classList.remove('countdown-bar-animate');
        void timerBar.offsetWidth; // Trigger reflow
        timerBar.classList.add('countdown-bar-animate');
    }

    // Set timeout to auto-hide
    const timeoutId = setTimeout(() => hideActionBet(true), 10000);
    updateCurrentActionBet({ timeoutId });
}

/**
 * Hides the action bet modal
 * @param {boolean} timedOut - Whether the modal timed out
 */
export function hideActionBet(timedOut = false) {
    const currentState = getCurrentState();
    
    if (!currentState.currentActionBet.active) return;
    
    if (timedOut && typeof window !== 'undefined' && window.addEventToFeed) {
        window.addEventToFeed(`Action Bet on '${currentState.currentActionBet.details.description}' timed out.`, 'text-gray-400');
    }
    
    // Clear timeout
    if (currentState.currentActionBet.timeoutId) {
        clearTimeout(currentState.currentActionBet.timeoutId);
    }
    
    // Reset action bet state
    updateCurrentActionBet({
        active: false,
        details: null,
        timeoutId: null
    });
    
    // Hide modal
    const actionBetModal = document.getElementById('action-bet-modal');
    if (actionBetModal) {
        actionBetModal.classList.add('hidden');
    }
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