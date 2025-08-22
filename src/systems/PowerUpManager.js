/**
 * PowerUpManager - Manages power-up awards and application
 * 
 * Requirements covered:
 * - 5.1: 80% probability power-up award on action bet wins
 * - 5.2: Display power-up award message and UI button
 * - 5.3: Apply 2x winnings multiplier to full-match bets
 * - 5.4: Single power-up holding limitation
 * - 5.6: Classic mode disable functionality
 */

export class PowerUpManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.powerUpProbability = 0.8; // 80% chance
        this.multiplier = 2; // 2x winnings multiplier
        
        // Subscribe to state changes to monitor classic mode
        this.stateManager.subscribe((state) => {
            this.classicMode = state.classicMode || false;
        });
        
        // Initialize classic mode from current state
        const currentState = this.stateManager.getState();
        this.classicMode = currentState.classicMode || false;
    }

    /**
     * Attempts to award a power-up with 80% probability
     * Only awards if not in classic mode and player doesn't already have one
     * 
     * @returns {boolean} True if power-up was awarded
     */
    awardPowerUp() {
        // Requirement 5.6: Classic mode disables power-up mechanics
        if (this.classicMode) {
            return false;
        }

        const currentState = this.stateManager.getState();
        
        // Requirement 5.4: Only one power-up can be held at a time
        if (currentState.powerUp && currentState.powerUp.held) {
            return false;
        }

        // Requirement 5.1: 80% probability of power-up award
        const random = Math.random();
        if (random < this.powerUpProbability) {
            const powerUp = {
                id: `powerup_${Date.now()}`,
                type: '2x_multiplier',
                description: '2x Winnings Multiplier',
                awardedAt: Date.now(),
                applied: false
            };

            this.stateManager.updateState({
                powerUp: {
                    held: powerUp,
                    applied: false
                }
            });

            return true;
        }

        return false;
    }

    /**
     * Applies the held power-up to a full-match bet
     * 
     * @param {string} betId - The ID of the bet to apply power-up to
     * @returns {boolean} True if power-up was successfully applied
     */
    applyPowerUp(betId) {
        // Requirement 5.6: Classic mode disables power-up mechanics
        if (this.classicMode) {
            return false;
        }

        const currentState = this.stateManager.getState();
        
        // Check if player has a power-up to apply
        if (!currentState.powerUp || !currentState.powerUp.held || currentState.powerUp.applied) {
            return false;
        }

        // Find the bet to apply power-up to
        const bet = currentState.bets.fullMatch.find(b => b.id === betId);
        if (!bet) {
            return false;
        }

        // Apply power-up by updating the bet and clearing the held power-up
        const updatedBets = currentState.bets.fullMatch.map(b => {
            if (b.id === betId) {
                return {
                    ...b,
                    powerUpApplied: true,
                    potentialWinnings: b.stake * b.odds * this.multiplier
                };
            }
            return b;
        });

        this.stateManager.updateState({
            bets: {
                ...currentState.bets,
                fullMatch: updatedBets
            },
            powerUp: {
                held: null,
                applied: true
            }
        });

        return true;
    }

    /**
     * Checks if the player currently has a power-up
     * 
     * @returns {boolean} True if player has a power-up
     */
    hasPowerUp() {
        if (this.classicMode) {
            return false;
        }

        const currentState = this.stateManager.getState();
        return !!(currentState.powerUp && currentState.powerUp.held && !currentState.powerUp.applied);
    }

    /**
     * Gets the current power-up details
     * 
     * @returns {Object|null} Power-up object or null if none held
     */
    getCurrentPowerUp() {
        if (this.classicMode) {
            return null;
        }

        const currentState = this.stateManager.getState();
        return currentState.powerUp && currentState.powerUp.held ? currentState.powerUp.held : null;
    }

    /**
     * Calculates winnings with power-up multiplier if applied
     * 
     * @param {Object} bet - The bet object
     * @param {number} baseWinnings - Base winnings without multiplier
     * @returns {number} Final winnings amount
     */
    calculateWinningsWithPowerUp(bet, baseWinnings) {
        // Requirement 5.3: Apply 2x multiplier if power-up was applied to bet
        if (bet.powerUpApplied && !this.classicMode) {
            return baseWinnings * this.multiplier;
        }
        return baseWinnings;
    }

    /**
     * Clears any held power-up (used when starting new match)
     */
    clearPowerUp() {
        this.stateManager.updateState({
            powerUp: {
                held: null,
                applied: false
            }
        });
    }

    /**
     * Gets the multiplier value
     * 
     * @returns {number} The multiplier value (2x)
     */
    getMultiplier() {
        return this.multiplier;
    }

    /**
     * Gets the power-up award probability
     * 
     * @returns {number} The probability (0.8 for 80%)
     */
    getProbability() {
        return this.powerUpProbability;
    }

    /**
     * Checks if classic mode is enabled
     * 
     * @returns {boolean} True if classic mode is enabled
     */
    isClassicMode() {
        return this.classicMode;
    }

    /**
     * Enables or disables classic mode
     * 
     * @param {boolean} enabled - Whether to enable classic mode
     */
    setClassicMode(enabled) {
        this.classicMode = enabled;
        
        // Update state manager with classic mode setting
        this.stateManager.updateState({
            classicMode: enabled
        });
        
        // Clear any held power-up when enabling classic mode
        if (enabled) {
            this.clearPowerUp();
        }
    }
}