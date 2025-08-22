/**
 * OddsCalculator - Handles dynamic odds calculation and adjustments
 * 
 * Features:
 * - Initial odds generation (Home 1.85, Draw 3.50, Away 4.20)
 * - Goal-based odds recalculation algorithm
 * - Real-time odds adjustments based on match state
 * - Odds validation and bounds checking
 */

export class OddsCalculator {
    constructor() {
        // Initial odds as specified in requirements
        this.initialOdds = {
            home: 1.85,
            draw: 3.50,
            away: 4.20
        };
        
        // Odds adjustment factors for goals
        this.goalAdjustmentFactors = {
            homeGoal: {
                home: 0.85,  // Home odds decrease (more likely to win)
                draw: 1.15,  // Draw odds increase (less likely)
                away: 1.25   // Away odds increase (less likely)
            },
            awayGoal: {
                home: 1.25,  // Home odds increase (less likely to win)
                draw: 1.15,  // Draw odds increase (less likely)
                away: 0.85   // Away odds decrease (more likely to win)
            }
        };
        
        // Odds bounds to prevent unrealistic values
        this.oddsBounds = {
            min: 1.10,
            max: 15.00
        };
    }

    /**
     * Get initial odds for a new match
     * @returns {Object} Initial odds object
     */
    getInitialOdds() {
        return { ...this.initialOdds };
    }

    /**
     * Calculate current odds based on match state
     * @param {Object} matchState - Current match state with scores
     * @returns {Object} Calculated odds
     */
    calculateOdds(matchState) {
        if (!matchState || typeof matchState !== 'object') {
            throw new Error('Invalid match state provided');
        }

        const { homeScore = 0, awayScore = 0 } = matchState;
        
        // Start with initial odds
        let currentOdds = { ...this.initialOdds };
        
        // Apply goal adjustments with reasonable caps to prevent infinite loops
        const homeGoals = Math.max(0, Math.min(50, Math.floor(homeScore))); // Cap at 50 goals
        const awayGoals = Math.max(0, Math.min(50, Math.floor(awayScore))); // Cap at 50 goals
        
        // Adjust for home goals
        for (let i = 0; i < homeGoals; i++) {
            currentOdds = this.adjustForGoal('home', currentOdds);
        }
        
        // Adjust for away goals
        for (let i = 0; i < awayGoals; i++) {
            currentOdds = this.adjustForGoal('away', currentOdds);
        }
        
        // Apply bounds checking
        currentOdds = this.applyOddsBounds(currentOdds);
        
        // Round to 2 decimal places
        return this.roundOdds(currentOdds);
    }

    /**
     * Adjust odds after a goal is scored
     * @param {string} team - Team that scored ('home' or 'away')
     * @param {Object} currentOdds - Current odds before adjustment
     * @returns {Object} Adjusted odds
     */
    adjustForGoal(team, currentOdds) {
        if (!currentOdds || typeof currentOdds !== 'object') {
            throw new Error('Invalid current odds provided');
        }

        if (team !== 'home' && team !== 'away') {
            throw new Error('Team must be "home" or "away"');
        }

        const adjustmentKey = team === 'home' ? 'homeGoal' : 'awayGoal';
        const factors = this.goalAdjustmentFactors[adjustmentKey];
        
        return {
            home: currentOdds.home * factors.home,
            draw: currentOdds.draw * factors.draw,
            away: currentOdds.away * factors.away
        };
    }

    /**
     * Apply odds bounds to prevent unrealistic values
     * @param {Object} odds - Odds to bound
     * @returns {Object} Bounded odds
     */
    applyOddsBounds(odds) {
        return {
            home: Math.max(this.oddsBounds.min, Math.min(this.oddsBounds.max, odds.home)),
            draw: Math.max(this.oddsBounds.min, Math.min(this.oddsBounds.max, odds.draw)),
            away: Math.max(this.oddsBounds.min, Math.min(this.oddsBounds.max, odds.away))
        };
    }

    /**
     * Round odds to 2 decimal places
     * @param {Object} odds - Odds to round
     * @returns {Object} Rounded odds
     */
    roundOdds(odds) {
        return {
            home: Math.round(odds.home * 100) / 100,
            draw: Math.round(odds.draw * 100) / 100,
            away: Math.round(odds.away * 100) / 100
        };
    }

    /**
     * Validate odds object structure and values
     * @param {Object} odds - Odds to validate
     * @returns {boolean} True if valid
     */
    validateOdds(odds) {
        if (!odds || typeof odds !== 'object') {
            return false;
        }

        const requiredKeys = ['home', 'draw', 'away'];
        
        // Check all required keys exist and are numbers
        for (const key of requiredKeys) {
            if (!(key in odds) || typeof odds[key] !== 'number' || isNaN(odds[key])) {
                return false;
            }
            
            // Check bounds
            if (odds[key] < this.oddsBounds.min || odds[key] > this.oddsBounds.max) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate implied probability from odds
     * @param {number} odds - Odds value
     * @returns {number} Implied probability as percentage
     */
    getImpliedProbability(odds) {
        if (typeof odds !== 'number' || odds <= 0) {
            throw new Error('Odds must be a positive number');
        }
        
        return Math.round((1 / odds) * 100 * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get odds update triggers based on match events
     * @param {Object} event - Match event
     * @returns {boolean} True if odds should be updated
     */
    shouldUpdateOdds(event) {
        if (!event || typeof event !== 'object') {
            return false;
        }

        // Update odds for goal events
        return event.type === 'GOAL';
    }

    /**
     * Calculate odds change percentage
     * @param {Object} oldOdds - Previous odds
     * @param {Object} newOdds - New odds
     * @returns {Object} Percentage changes
     */
    calculateOddsChange(oldOdds, newOdds) {
        if (!this.validateOdds(oldOdds) || !this.validateOdds(newOdds)) {
            throw new Error('Invalid odds provided for comparison');
        }

        return {
            home: Math.round(((newOdds.home - oldOdds.home) / oldOdds.home) * 100 * 100) / 100,
            draw: Math.round(((newOdds.draw - oldOdds.draw) / oldOdds.draw) * 100 * 100) / 100,
            away: Math.round(((newOdds.away - oldOdds.away) / oldOdds.away) * 100 * 100) / 100
        };
    }

    /**
     * Get odds summary with implied probabilities
     * @param {Object} odds - Odds to summarize
     * @returns {Object} Odds summary with probabilities
     */
    getOddsSummary(odds) {
        if (!this.validateOdds(odds)) {
            throw new Error('Invalid odds provided');
        }

        return {
            odds: { ...odds },
            probabilities: {
                home: this.getImpliedProbability(odds.home),
                draw: this.getImpliedProbability(odds.draw),
                away: this.getImpliedProbability(odds.away)
            },
            totalProbability: Math.round((
                this.getImpliedProbability(odds.home) +
                this.getImpliedProbability(odds.draw) +
                this.getImpliedProbability(odds.away)
            ) * 100) / 100
        };
    }
}

// Export singleton instance
export const oddsCalculator = new OddsCalculator();