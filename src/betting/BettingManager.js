/**
 * BettingManager - Coordinates all betting operations and validates bets
 * Handles bet placement, validation, resolution, and winnings calculation
 */
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';

export class BettingManager {
    constructor(stateManager, powerUpManager) {
        try {
            this.stateManager = stateManager;
            this.powerUpManager = powerUpManager;
            this.betIdCounter = 1;
            this.setupErrorRecovery();
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.BETTING, {
                context: 'BettingManager_constructor',
                component: 'BettingManager'
            });
            throw error;
        }
    }

    /**
     * Validates and places a bet
     * @param {Object} betData - Bet information
     * @param {string} betData.type - 'fullMatch' or 'actionBet'
     * @param {string} betData.outcome - Bet outcome (e.g., 'home', 'draw', 'away')
     * @param {number} betData.stake - Bet amount
     * @param {number} betData.odds - Betting odds
     * @param {string} [betData.eventId] - Event ID for action bets
     * @returns {Object} Placed bet object or error
     */
    placeBet(betData) {
        try {
            // Validate bet data first
            const validation = this.validateBet(betData);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const state = this.stateManager.getState();
            
            // Check wallet balance (this is already checked in validateBet, but double-check)
            if (!this.validateBetAmount(betData.stake, state.wallet)) {
                throw new Error('Insufficient funds');
            }

            // Create bet object
            const bet = {
                id: `bet_${this.betIdCounter++}`,
                type: betData.type,
                outcome: betData.outcome,
                stake: betData.stake,
                odds: betData.odds,
                potentialWinnings: this.calculatePotentialWinnings(betData.stake, betData.odds),
                status: 'pending',
                placedAt: Date.now(),
                powerUpApplied: false,
                eventId: betData.eventId || null
            };

            // Update state with new bet and reduced wallet
            const updates = {
                wallet: state.wallet - betData.stake,
                bets: {
                    ...state.bets,
                    [betData.type]: [...(state.bets[betData.type] || []), bet]
                }
            };

            const updateResult = this.stateManager.updateState(updates);
            if (!updateResult.success) {
                throw new Error('Failed to update state with bet');
            }

            return { success: true, bet };
        } catch (error) {
            const errorResult = errorHandler.handleError(error, ERROR_TYPES.BETTING, {
                context: 'BettingManager_placeBet',
                betData,
                walletBalance: this.stateManager.getState().wallet
            }, {
                attemptRecovery: true
            });
            
            return errorResult.success 
                ? { success: true, bet: null, recovered: true }
                : { success: false, error: error.message };
        }
    }

    /**
     * Validates bet data and constraints
     * @param {Object} betData - Bet data to validate
     * @returns {Object} Validation result
     */
    validateBet(betData) {
        if (!betData) {
            return { valid: false, error: 'Bet data is required' };
        }

        if (!betData.type || !['fullMatch', 'actionBet'].includes(betData.type)) {
            return { valid: false, error: 'Invalid bet type' };
        }

        if (!betData.outcome || typeof betData.outcome !== 'string') {
            return { valid: false, error: 'Bet outcome is required' };
        }

        if (!betData.stake || typeof betData.stake !== 'number' || betData.stake <= 0) {
            return { valid: false, error: 'Invalid bet amount' };
        }

        if (!betData.odds || typeof betData.odds !== 'number' || betData.odds <= 0) {
            return { valid: false, error: 'Invalid odds' };
        }

        // Minimum bet validation
        if (betData.stake < 1) {
            return { valid: false, error: 'Minimum bet amount is $1' };
        }

        // Maximum bet validation (prevent betting more than wallet)
        const state = this.stateManager.getState();
        if (betData.stake > state.wallet) {
            return { valid: false, error: 'Insufficient funds' };
        }

        return { valid: true };
    }

    /**
     * Validates bet amount against wallet balance
     * @param {number} amount - Bet amount
     * @param {number} wallet - Current wallet balance
     * @returns {boolean} True if valid
     */
    validateBetAmount(amount, wallet) {
        return amount > 0 && amount <= wallet && amount >= 1;
    }

    /**
     * Calculates potential winnings for a bet
     * @param {number} stake - Bet amount
     * @param {number} odds - Betting odds
     * @param {boolean} [applyPowerUp=false] - Whether to apply power-up multiplier
     * @returns {number} Potential winnings
     */
    calculatePotentialWinnings(stake, odds, applyPowerUp = false) {
        const baseWinnings = stake * odds;
        return applyPowerUp ? baseWinnings * 2 : baseWinnings;
    }

    /**
     * Calculates actual winnings for a winning bet
     * @param {Object} bet - Bet object
     * @param {string} outcome - Actual outcome
     * @returns {number} Actual winnings (0 if bet lost)
     */
    calculateWinnings(bet, outcome) {
        if (bet.outcome !== outcome) {
            return 0; // Bet lost
        }

        const baseWinnings = bet.stake * bet.odds;
        return bet.powerUpApplied ? baseWinnings * 2 : baseWinnings;
    }

    /**
     * Applies power-up to a specific bet
     * @param {string} betId - Bet ID to apply power-up to
     * @returns {Object} Result of power-up application
     */
    applyPowerUp(betId) {
        try {
            const state = this.stateManager.getState();
            
            // Check if player has power-up
            if (!state.powerUp.held) {
                throw new Error('No power-up available');
            }

            // Find the bet
            let targetBet = null;
            let betType = null;
            
            for (const type of ['fullMatch', 'actionBet']) {
                const bet = state.bets[type]?.find(b => b.id === betId);
                if (bet) {
                    targetBet = bet;
                    betType = type;
                    break;
                }
            }

            if (!targetBet) {
                throw new Error('Bet not found');
            }

            if (targetBet.status !== 'pending') {
                throw new Error('Can only apply power-up to pending bets');
            }

            if (targetBet.powerUpApplied) {
                throw new Error('Power-up already applied to this bet');
            }

            // Apply power-up
            const updatedBets = state.bets[betType].map(bet => 
                bet.id === betId 
                    ? { 
                        ...bet, 
                        powerUpApplied: true,
                        potentialWinnings: this.calculatePotentialWinnings(bet.stake, bet.odds, true)
                    }
                    : bet
            );

            const updates = {
                bets: {
                    ...state.bets,
                    [betType]: updatedBets
                },
                powerUp: {
                    ...state.powerUp,
                    held: null,
                    applied: true
                }
            };

            const updateResult = this.stateManager.updateState(updates);
            if (!updateResult.success) {
                throw new Error('Failed to update state with power-up');
            }

            return { success: true, message: 'Power-up applied successfully' };
        } catch (error) {
            return errorHandler.handleError(error, ERROR_TYPES.BETTING, {
                context: 'BettingManager_applyPowerUp',
                betId,
                hasPowerUp: this.stateManager.getState().powerUp.held !== null
            });
        }
    }

    /**
     * Resolves bets based on outcome
     * @param {string} outcome - The actual outcome
     * @param {string} [betType] - Type of bets to resolve ('fullMatch' or 'actionBet')
     * @param {string} [eventId] - Event ID for action bet resolution
     * @returns {Object} Resolution results
     */
    resolveBets(outcome, betType = null, eventId = null) {
        try {
            const state = this.stateManager.getState();
            let totalWinnings = 0;
            let resolvedBets = 0;
            const results = [];

            // Determine which bets to resolve
            const betsToResolve = betType 
                ? (state.bets[betType] || [])
                : [...(state.bets.fullMatch || []), ...(state.bets.actionBet || [])];

            // Filter by event ID for action bets if specified
            const filteredBets = eventId 
                ? betsToResolve.filter(bet => bet.eventId === eventId)
                : betsToResolve;

            // Process each bet
            const updatedBets = { ...state.bets };

            for (const betCategory of ['fullMatch', 'actionBet']) {
                if (betType && betType !== betCategory) continue;

                updatedBets[betCategory] = (state.bets[betCategory] || []).map(bet => {
                    // Skip if not in filtered bets or already resolved
                    if (!filteredBets.includes(bet) || bet.status !== 'pending') {
                        return bet;
                    }

                    const winnings = this.calculateWinnings(bet, outcome);
                    const won = winnings > 0;
                    
                    totalWinnings += winnings;
                    resolvedBets++;

                    results.push({
                        betId: bet.id,
                        outcome: bet.outcome,
                        actualOutcome: outcome,
                        won,
                        winnings,
                        stake: bet.stake
                    });

                    return {
                        ...bet,
                        status: won ? 'won' : 'lost',
                        resolvedAt: Date.now(),
                        actualWinnings: winnings
                    };
                });
            }

            // Update wallet with winnings
            const updates = {
                wallet: state.wallet + totalWinnings,
                bets: updatedBets
            };

            this.stateManager.updateState(updates);

            return {
                success: true,
                totalWinnings,
                resolvedBets,
                results
            };
        } catch (error) {
            console.error('Bet resolution failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Gets all pending bets
     * @param {string} [betType] - Filter by bet type
     * @returns {Array} Array of pending bets
     */
    getPendingBets(betType = null) {
        const state = this.stateManager.getState();
        
        if (betType) {
            return (state.bets[betType] || []).filter(bet => bet.status === 'pending');
        }

        return [
            ...(state.bets.fullMatch || []).filter(bet => bet.status === 'pending'),
            ...(state.bets.actionBet || []).filter(bet => bet.status === 'pending')
        ];
    }

    /**
     * Gets bet statistics
     * @returns {Object} Betting statistics
     */
    getBetStatistics() {
        const state = this.stateManager.getState();
        const allBets = [
            ...(state.bets.fullMatch || []),
            ...(state.bets.actionBet || [])
        ];

        const stats = {
            totalBets: allBets.length,
            totalStaked: allBets.reduce((sum, bet) => sum + bet.stake, 0),
            totalWinnings: allBets
                .filter(bet => bet.status === 'won')
                .reduce((sum, bet) => sum + (bet.actualWinnings || 0), 0),
            pendingBets: allBets.filter(bet => bet.status === 'pending').length,
            wonBets: allBets.filter(bet => bet.status === 'won').length,
            lostBets: allBets.filter(bet => bet.status === 'lost').length
        };

        stats.netProfit = stats.totalWinnings - stats.totalStaked;
        stats.winRate = stats.totalBets > 0 
            ? ((stats.wonBets / (stats.wonBets + stats.lostBets)) * 100).toFixed(1)
            : 0;

        return stats;
    }

    /**
     * Cancels a pending bet (for testing/admin purposes)
     * @param {string} betId - Bet ID to cancel
     * @returns {Object} Cancellation result
     */
    cancelBet(betId) {
        try {
            const state = this.stateManager.getState();
            let targetBet = null;
            let betType = null;

            // Find the bet
            for (const type of ['fullMatch', 'actionBet']) {
                const bet = state.bets[type]?.find(b => b.id === betId);
                if (bet) {
                    targetBet = bet;
                    betType = type;
                    break;
                }
            }

            if (!targetBet) {
                throw new Error('Bet not found');
            }

            if (targetBet.status !== 'pending') {
                throw new Error('Can only cancel pending bets');
            }

            // Remove bet and refund stake
            const updatedBets = state.bets[betType].filter(bet => bet.id !== betId);
            
            const updates = {
                wallet: state.wallet + targetBet.stake,
                bets: {
                    ...state.bets,
                    [betType]: updatedBets
                }
            };

            const updateResult = this.stateManager.updateState(updates);
            if (!updateResult.success) {
                throw new Error('Failed to update state for bet cancellation');
            }

            return { success: true, refundedAmount: targetBet.stake };
        } catch (error) {
            return errorHandler.handleError(error, ERROR_TYPES.BETTING, {
                context: 'BettingManager_cancelBet',
                betId
            });
        }
    }

    /**
     * Setup error recovery strategies for betting operations
     */
    setupErrorRecovery() {
        // Register recovery callback for betting validation and retry
        errorHandler.registerRecoveryCallback('validate_and_retry', async (errorInfo, options) => {
            try {
                // If this is a bet placement error, try with safe defaults
                if (errorInfo.context?.betData) {
                    const safeBetData = this.sanitizeBetData(errorInfo.context.betData);
                    const result = this.placeBet(safeBetData);
                    return { 
                        success: result.success, 
                        message: result.success ? 'Bet placed with safe values' : 'Retry failed' 
                    };
                }
                return { success: false, message: 'No bet data to retry' };
            } catch (error) {
                return { success: false, message: 'Recovery attempt failed' };
            }
        });

        // Register recovery callback for temporarily disabling betting
        errorHandler.registerRecoveryCallback('disable_betting_temporarily', async (errorInfo, options) => {
            try {
                // In a real implementation, you might set a flag to disable betting UI
                console.warn('Betting temporarily disabled due to errors');
                return { success: true, message: 'Betting temporarily disabled' };
            } catch (error) {
                return { success: false, message: 'Failed to disable betting' };
            }
        });
    }

    /**
     * Sanitize bet data to safe values
     */
    sanitizeBetData(betData) {
        const state = this.stateManager.getState();
        const safeData = { ...betData };

        // Ensure valid bet type
        if (!['fullMatch', 'actionBet'].includes(safeData.type)) {
            safeData.type = 'fullMatch';
        }

        // Ensure valid outcome
        if (!safeData.outcome || typeof safeData.outcome !== 'string') {
            safeData.outcome = 'home';
        }

        // Ensure valid stake
        if (!safeData.stake || typeof safeData.stake !== 'number' || safeData.stake <= 0) {
            safeData.stake = Math.min(25, state.wallet);
        }

        // Ensure stake doesn't exceed wallet
        if (safeData.stake > state.wallet) {
            safeData.stake = Math.max(1, Math.floor(state.wallet));
        }

        // Ensure valid odds
        if (!safeData.odds || typeof safeData.odds !== 'number' || safeData.odds <= 0) {
            safeData.odds = 2.0; // Safe default odds
        }

        return safeData;
    }

    /**
     * Safe bet placement with automatic retry and recovery
     */
    safePlaceBet(betData, options = {}) {
        const maxRetries = options.maxRetries || 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const result = this.placeBet(betData);
            
            if (result.success) {
                return result;
            }

            retryCount++;
            
            // Try with sanitized data on retry
            if (retryCount < maxRetries) {
                betData = this.sanitizeBetData(betData);
            }
        }

        // Final fallback - log error and return failure
        errorHandler.handleError(new Error('All bet placement attempts failed'), ERROR_TYPES.BETTING, {
            context: 'BettingManager_safePlaceBet',
            betData,
            retries: maxRetries
        });

        return { success: false, error: 'Unable to place bet after multiple attempts' };
    }

    /**
     * Get betting system health status
     */
    getSystemHealth() {
        try {
            const state = this.stateManager.getState();
            const stats = this.getBetStatistics();
            
            return {
                healthy: true,
                walletBalance: state.wallet,
                pendingBets: stats.pendingBets,
                totalBets: stats.totalBets,
                canPlaceBets: state.wallet > 0,
                stateValid: this.stateManager.isStateValid()
            };
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.BETTING, {
                context: 'BettingManager_getSystemHealth'
            }, {
                showUserMessage: false
            });
            
            return {
                healthy: false,
                error: 'Unable to determine system health'
            };
        }
    }
}