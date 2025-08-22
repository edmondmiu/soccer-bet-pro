/**
 * OddsCalculator Requirements Verification
 * 
 * Verifies that the OddsCalculator implementation meets all specified requirements
 */

import { OddsCalculator, oddsCalculator } from './OddsCalculator.js';

export function verifyOddsCalculatorRequirements() {
    console.log('🔍 Verifying OddsCalculator Requirements...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    function verifyRequirement(requirement, testFn) {
        results.total++;
        try {
            testFn();
            console.log(`✅ ${requirement}`);
            results.passed++;
        } catch (error) {
            console.error(`❌ ${requirement}: ${error.message}`);
            results.failed++;
        }
    }

    const calculator = new OddsCalculator();

    // Requirement 6.3: Dynamic odds adjustments based on match state
    verifyRequirement('REQ 6.3: Dynamic odds adjustments based on match state', () => {
        const initialState = { homeScore: 0, awayScore: 0 };
        const goalState = { homeScore: 1, awayScore: 0 };
        
        const initialOdds = calculator.calculateOdds(initialState);
        const adjustedOdds = calculator.calculateOdds(goalState);
        
        // Odds should change after a goal
        if (initialOdds.home === adjustedOdds.home) {
            throw new Error('Odds should change after goal events');
        }
        
        // Home odds should decrease after home goal (more likely to win)
        if (adjustedOdds.home >= initialOdds.home) {
            throw new Error('Home odds should decrease after home goal');
        }
        
        // Away odds should increase after home goal (less likely to win)
        if (adjustedOdds.away <= initialOdds.away) {
            throw new Error('Away odds should increase after home goal');
        }
    });

    // Requirement 1.3: Initial odds generation
    verifyRequirement('REQ 1.3: Initial odds generation (Home 1.85, Draw 3.50, Away 4.20)', () => {
        const initialOdds = calculator.getInitialOdds();
        
        if (initialOdds.home !== 1.85) {
            throw new Error(`Home odds should be 1.85, got ${initialOdds.home}`);
        }
        
        if (initialOdds.draw !== 3.50) {
            throw new Error(`Draw odds should be 3.50, got ${initialOdds.draw}`);
        }
        
        if (initialOdds.away !== 4.20) {
            throw new Error(`Away odds should be 4.20, got ${initialOdds.away}`);
        }
    });

    // Additional verification: Real-time odds adjustments
    verifyRequirement('Real-time odds adjustments for goal events', () => {
        const goalEvent = { type: 'GOAL', team: 'home' };
        
        if (!calculator.shouldUpdateOdds(goalEvent)) {
            throw new Error('Should trigger odds update for goal events');
        }
        
        const commentaryEvent = { type: 'COMMENTARY' };
        if (calculator.shouldUpdateOdds(commentaryEvent)) {
            throw new Error('Should not trigger odds update for commentary events');
        }
    });

    // Additional verification: Goal-based recalculation algorithm
    verifyRequirement('Goal-based odds recalculation algorithm', () => {
        const currentOdds = { home: 2.00, draw: 3.00, away: 4.00 };
        
        // Test home goal adjustment
        const homeGoalOdds = calculator.adjustForGoal('home', currentOdds);
        if (homeGoalOdds.home >= currentOdds.home) {
            throw new Error('Home goal should decrease home odds');
        }
        if (homeGoalOdds.draw <= currentOdds.draw) {
            throw new Error('Home goal should increase draw odds');
        }
        if (homeGoalOdds.away <= currentOdds.away) {
            throw new Error('Home goal should increase away odds');
        }
        
        // Test away goal adjustment
        const awayGoalOdds = calculator.adjustForGoal('away', currentOdds);
        if (awayGoalOdds.away >= currentOdds.away) {
            throw new Error('Away goal should decrease away odds');
        }
        if (awayGoalOdds.home <= currentOdds.home) {
            throw new Error('Away goal should increase home odds');
        }
    });

    // Additional verification: Odds validation
    verifyRequirement('Odds validation and bounds checking', () => {
        // Valid odds should pass
        const validOdds = { home: 1.85, draw: 3.50, away: 4.20 };
        if (!calculator.validateOdds(validOdds)) {
            throw new Error('Valid odds should pass validation');
        }
        
        // Out of bounds odds should fail
        const outOfBoundsOdds = { home: 0.50, draw: 3.50, away: 4.20 };
        if (calculator.validateOdds(outOfBoundsOdds)) {
            throw new Error('Out of bounds odds should fail validation');
        }
        
        // Bounds should be applied correctly
        const unboundedOdds = { home: 0.50, draw: 20.00, away: 2.00 };
        const boundedOdds = calculator.applyOddsBounds(unboundedOdds);
        
        if (boundedOdds.home < 1.10) {
            throw new Error('Minimum bounds should be applied');
        }
        if (boundedOdds.draw > 15.00) {
            throw new Error('Maximum bounds should be applied');
        }
    });

    // Additional verification: Multiple goals handling
    verifyRequirement('Multiple goals handling and cumulative adjustments', () => {
        const multiGoalMatch = { homeScore: 3, awayScore: 1 };
        const odds = calculator.calculateOdds(multiGoalMatch);
        
        // Odds should still be valid after multiple goals
        if (!calculator.validateOdds(odds)) {
            throw new Error('Odds should remain valid after multiple goals');
        }
        
        // Home should be heavily favored
        if (odds.home >= calculator.getInitialOdds().home) {
            throw new Error('Home odds should be significantly lower after multiple home goals');
        }
    });

    // Additional verification: Precision and rounding
    verifyRequirement('Odds precision and rounding to 2 decimal places', () => {
        const preciseOdds = { home: 1.8567, draw: 3.4999, away: 4.2001 };
        const roundedOdds = calculator.roundOdds(preciseOdds);
        
        if (roundedOdds.home !== 1.86) {
            throw new Error('Should round to 2 decimal places');
        }
        if (roundedOdds.draw !== 3.50) {
            throw new Error('Should round to 2 decimal places');
        }
        if (roundedOdds.away !== 4.20) {
            throw new Error('Should round to 2 decimal places');
        }
    });

    // Additional verification: Implied probability calculation
    verifyRequirement('Implied probability calculation accuracy', () => {
        const prob2_0 = calculator.getImpliedProbability(2.0);
        if (prob2_0 !== 50.00) {
            throw new Error('Probability for odds 2.0 should be 50%');
        }
        
        const prob4_0 = calculator.getImpliedProbability(4.0);
        if (prob4_0 !== 25.00) {
            throw new Error('Probability for odds 4.0 should be 25%');
        }
    });

    // Additional verification: Error handling
    verifyRequirement('Comprehensive error handling for invalid inputs', () => {
        // Should handle null/undefined inputs
        try {
            calculator.calculateOdds(null);
            throw new Error('Should throw error for null input');
        } catch (error) {
            if (!error.message.includes('Invalid match state')) {
                throw new Error('Should provide specific error message');
            }
        }
        
        // Should handle invalid team names
        try {
            calculator.adjustForGoal('invalid', { home: 1.85, draw: 3.50, away: 4.20 });
            throw new Error('Should throw error for invalid team');
        } catch (error) {
            if (!error.message.includes('Team must be')) {
                throw new Error('Should provide specific error message');
            }
        }
    });

    // Additional verification: Singleton instance
    verifyRequirement('Singleton instance availability', () => {
        if (!(oddsCalculator instanceof OddsCalculator)) {
            throw new Error('oddsCalculator should be instance of OddsCalculator');
        }
        
        const odds1 = oddsCalculator.getInitialOdds();
        const odds2 = oddsCalculator.getInitialOdds();
        
        if (odds1.home !== odds2.home) {
            throw new Error('Singleton should provide consistent results');
        }
    });

    // Additional verification: Performance requirements
    verifyRequirement('Performance requirements for real-time use', () => {
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            calculator.calculateOdds({ homeScore: i % 5, awayScore: (i + 1) % 5 });
        }
        
        const end = performance.now();
        const avgTime = (end - start) / iterations;
        
        // Should complete calculations in reasonable time (< 1ms per calculation)
        if (avgTime > 1.0) {
            throw new Error(`Calculations too slow: ${avgTime.toFixed(4)}ms per calculation`);
        }
    });

    console.log(`\n📊 Requirements Verification Results:`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total: ${results.total}`);
    console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

    if (results.failed === 0) {
        console.log('🎉 All requirements verified! OddsCalculator implementation is complete and compliant! 🚀\n');
    } else {
        console.log('⚠️ Some requirements not met. Please review the implementation.\n');
    }

    return results;
}

// Auto-run verification if this file is run directly
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        verifyOddsCalculatorRequirements();
    });
} else {
    // Node.js environment
    verifyOddsCalculatorRequirements();
}