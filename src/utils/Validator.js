/**
 * Validator - Input validation utilities
 */
export class Validator {
    /**
     * Validate bet amount
     */
    static validateBetAmount(amount, wallet) {
        if (typeof amount !== 'number' || amount <= 0) {
            return { valid: false, error: 'Bet amount must be a positive number' };
        }
        
        if (amount > wallet) {
            return { valid: false, error: 'Insufficient funds' };
        }
        
        return { valid: true };
    }

    /**
     * Validate match data
     */
    static validateMatchData(matchData) {
        const required = ['homeTeam', 'awayTeam', 'odds'];
        
        for (const field of required) {
            if (!matchData[field]) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        
        return { valid: true };
    }

    /**
     * Validate state update
     */
    static validateStateUpdate(updates) {
        // Basic validation - implementation in later tasks
        return { valid: true };
    }
}