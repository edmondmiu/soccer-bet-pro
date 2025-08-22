/**
 * OddsCalculator Tests
 * 
 * Tests for dynamic odds calculation and adjustments
 */

import { OddsCalculator, oddsCalculator } from './OddsCalculator.js';

// Test suite for OddsCalculator
export function runOddsCalculatorTests() {
    console.log('🧮 Running OddsCalculator Tests...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    function test(name, testFn) {
        results.total++;
        try {
            testFn();
            console.log(`✅ ${name}`);
            results.passed++;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            results.failed++;
        }
    }

    // Test initial odds generation
    test('Should return correct initial odds', () => {
        const calculator = new OddsCalculator();
        const initialOdds = calculator.getInitialOdds();
        
        if (initialOdds.home !== 1.85) throw new Error('Home odds should be 1.85');
        if (initialOdds.draw !== 3.50) throw new Error('Draw odds should be 3.50');
        if (initialOdds.away !== 4.20) throw new Error('Away odds should be 4.20');
    });

    // Test odds calculation with no goals
    test('Should return initial odds for 0-0 match', () => {
        const calculator = new OddsCalculator();
        const matchState = { homeScore: 0, awayScore: 0 };
        const odds = calculator.calculateOdds(matchState);
        
        if (odds.home !== 1.85) throw new Error('Home odds should remain 1.85');
        if (odds.draw !== 3.50) throw new Error('Draw odds should remain 3.50');
        if (odds.away !== 4.20) throw new Error('Away odds should remain 4.20');
    });

    // Test odds adjustment after home goal
    test('Should adjust odds correctly after home goal', () => {
        const calculator = new OddsCalculator();
        const matchState = { homeScore: 1, awayScore: 0 };
        const odds = calculator.calculateOdds(matchState);
        
        // Home odds should decrease (more likely to win)
        if (odds.home >= 1.85) throw new Error('Home odds should decrease after home goal');
        // Draw and away odds should increase (less likely)
        if (odds.draw <= 3.50) throw new Error('Draw odds should increase after home goal');
        if (odds.away <= 4.20) throw new Error('Away odds should increase after home goal');
    });

    // Test odds adjustment after away goal
    test('Should adjust odds correctly after away goal', () => {
        const calculator = new OddsCalculator();
        const matchState = { homeScore: 0, awayScore: 1 };
        const odds = calculator.calculateOdds(matchState);
        
        // Away odds should decrease (more likely to win)
        if (odds.away >= 4.20) throw new Error('Away odds should decrease after away goal');
        // Home and draw odds should increase (less likely)
        if (odds.home <= 1.85) throw new Error('Home odds should increase after away goal');
        if (odds.draw <= 3.50) throw new Error('Draw odds should increase after away goal');
    });

    // Test multiple goals adjustment
    test('Should handle multiple goals correctly', () => {
        const calculator = new OddsCalculator();
        const matchState = { homeScore: 2, awayScore: 1 };
        const odds = calculator.calculateOdds(matchState);
        
        // Verify odds are still within bounds
        if (odds.home < 1.10 || odds.home > 15.00) throw new Error('Home odds out of bounds');
        if (odds.draw < 1.10 || odds.draw > 15.00) throw new Error('Draw odds out of bounds');
        if (odds.away < 1.10 || odds.away > 15.00) throw new Error('Away odds out of bounds');
    });

    // Test adjustForGoal method
    test('Should adjust odds for home goal correctly', () => {
        const calculator = new OddsCalculator();
        const currentOdds = { home: 2.00, draw: 3.00, away: 4.00 };
        const adjustedOdds = calculator.adjustForGoal('home', currentOdds);
        
        // Home odds should decrease
        if (adjustedOdds.home >= currentOdds.home) throw new Error('Home odds should decrease');
        // Draw and away odds should increase
        if (adjustedOdds.draw <= currentOdds.draw) throw new Error('Draw odds should increase');
        if (adjustedOdds.away <= currentOdds.away) throw new Error('Away odds should increase');
    });

    // Test adjustForGoal method for away team
    test('Should adjust odds for away goal correctly', () => {
        const calculator = new OddsCalculator();
        const currentOdds = { home: 2.00, draw: 3.00, away: 4.00 };
        const adjustedOdds = calculator.adjustForGoal('away', currentOdds);
        
        // Away odds should decrease
        if (adjustedOdds.away >= currentOdds.away) throw new Error('Away odds should decrease');
        // Home and draw odds should increase
        if (adjustedOdds.home <= currentOdds.home) throw new Error('Home odds should increase');
        if (adjustedOdds.draw <= currentOdds.draw) throw new Error('Draw odds should increase');
    });

    // Test odds bounds application
    test('Should apply odds bounds correctly', () => {
        const calculator = new OddsCalculator();
        const unboundedOdds = { home: 0.50, draw: 20.00, away: 2.00 };
        const boundedOdds = calculator.applyOddsBounds(unboundedOdds);
        
        if (boundedOdds.home < 1.10) throw new Error('Home odds should be bounded to minimum');
        if (boundedOdds.draw > 15.00) throw new Error('Draw odds should be bounded to maximum');
        if (boundedOdds.away !== 2.00) throw new Error('Away odds should remain unchanged');
    });

    // Test odds rounding
    test('Should round odds to 2 decimal places', () => {
        const calculator = new OddsCalculator();
        const unroundedOdds = { home: 1.8567, draw: 3.4999, away: 4.2001 };
        const roundedOdds = calculator.roundOdds(unroundedOdds);
        
        if (roundedOdds.home !== 1.86) throw new Error('Home odds should be rounded to 1.86');
        if (roundedOdds.draw !== 3.50) throw new Error('Draw odds should be rounded to 3.50');
        if (roundedOdds.away !== 4.20) throw new Error('Away odds should be rounded to 4.20');
    });

    // Test odds validation
    test('Should validate odds correctly', () => {
        const calculator = new OddsCalculator();
        
        // Valid odds
        const validOdds = { home: 1.85, draw: 3.50, away: 4.20 };
        if (!calculator.validateOdds(validOdds)) throw new Error('Valid odds should pass validation');
        
        // Invalid odds - missing key
        const invalidOdds1 = { home: 1.85, draw: 3.50 };
        if (calculator.validateOdds(invalidOdds1)) throw new Error('Incomplete odds should fail validation');
        
        // Invalid odds - non-number value
        const invalidOdds2 = { home: 1.85, draw: 'invalid', away: 4.20 };
        if (calculator.validateOdds(invalidOdds2)) throw new Error('Non-number odds should fail validation');
        
        // Invalid odds - out of bounds
        const invalidOdds3 = { home: 0.50, draw: 3.50, away: 4.20 };
        if (calculator.validateOdds(invalidOdds3)) throw new Error('Out of bounds odds should fail validation');
    });

    // Test implied probability calculation
    test('Should calculate implied probability correctly', () => {
        const calculator = new OddsCalculator();
        
        const prob2_0 = calculator.getImpliedProbability(2.0);
        if (prob2_0 !== 50.00) throw new Error('Probability for odds 2.0 should be 50%');
        
        const prob4_0 = calculator.getImpliedProbability(4.0);
        if (prob4_0 !== 25.00) throw new Error('Probability for odds 4.0 should be 25%');
    });

    // Test odds update triggers
    test('Should identify when odds should be updated', () => {
        const calculator = new OddsCalculator();
        
        const goalEvent = { type: 'GOAL', team: 'home' };
        if (!calculator.shouldUpdateOdds(goalEvent)) throw new Error('Should update odds for goal events');
        
        const commentaryEvent = { type: 'COMMENTARY' };
        if (calculator.shouldUpdateOdds(commentaryEvent)) throw new Error('Should not update odds for commentary events');
    });

    // Test odds change calculation
    test('Should calculate odds change percentage correctly', () => {
        const calculator = new OddsCalculator();
        const oldOdds = { home: 2.00, draw: 3.00, away: 4.00 };
        const newOdds = { home: 1.80, draw: 3.30, away: 4.40 };
        
        const changes = calculator.calculateOddsChange(oldOdds, newOdds);
        
        if (changes.home !== -10.00) throw new Error('Home odds change should be -10%');
        if (changes.draw !== 10.00) throw new Error('Draw odds change should be 10%');
        if (changes.away !== 10.00) throw new Error('Away odds change should be 10%');
    });

    // Test odds summary
    test('Should generate odds summary with probabilities', () => {
        const calculator = new OddsCalculator();
        const odds = { home: 2.00, draw: 3.00, away: 4.00 };
        const summary = calculator.getOddsSummary(odds);
        
        if (summary.probabilities.home !== 50.00) throw new Error('Home probability should be 50%');
        if (summary.probabilities.draw !== 33.33) throw new Error('Draw probability should be 33.33%');
        if (summary.probabilities.away !== 25.00) throw new Error('Away probability should be 25%');
    });

    // Test error handling
    test('Should handle invalid inputs gracefully', () => {
        const calculator = new OddsCalculator();
        
        try {
            calculator.calculateOdds(null);
            throw new Error('Should throw error for null match state');
        } catch (error) {
            if (!error.message.includes('Invalid match state')) {
                throw new Error('Should throw specific error for invalid match state');
            }
        }
        
        try {
            calculator.adjustForGoal('invalid', { home: 1.85, draw: 3.50, away: 4.20 });
            throw new Error('Should throw error for invalid team');
        } catch (error) {
            if (!error.message.includes('Team must be')) {
                throw new Error('Should throw specific error for invalid team');
            }
        }
    });

    // Test singleton instance
    test('Should provide singleton instance', () => {
        if (!(oddsCalculator instanceof OddsCalculator)) {
            throw new Error('oddsCalculator should be instance of OddsCalculator');
        }
        
        const initialOdds = oddsCalculator.getInitialOdds();
        if (initialOdds.home !== 1.85) throw new Error('Singleton should work correctly');
    });

    // Test extreme scenarios
    test('Should handle extreme score scenarios', () => {
        const calculator = new OddsCalculator();
        const extremeMatch = { homeScore: 10, awayScore: 0 };
        const odds = calculator.calculateOdds(extremeMatch);
        
        // Odds should still be within bounds
        if (odds.home < 1.10 || odds.home > 15.00) throw new Error('Extreme home odds out of bounds');
        if (odds.away < 1.10 || odds.away > 15.00) throw new Error('Extreme away odds out of bounds');
    });

    console.log(`\n📊 OddsCalculator Test Results:`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total: ${results.total}`);
    console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

    return results;
}

// Auto-run tests if this file is run directly
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        runOddsCalculatorTests();
    });
} else {
    // Node.js environment
    runOddsCalculatorTests();
}