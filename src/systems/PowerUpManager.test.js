/**
 * PowerUpManager Tests
 * 
 * Tests all power-up functionality including:
 * - 80% probability power-up awards
 * - 2x winnings multiplier application
 * - Single power-up holding limitation
 * - Classic mode disable functionality
 */

import { PowerUpManager } from './PowerUpManager.js';

// Mock StateManager for testing
class MockStateManager {
    constructor(initialState = {}) {
        this.state = {
            classicMode: false,
            powerUp: { held: null, applied: false },
            bets: { fullMatch: [], actionBets: [] },
            ...initialState
        };
        this.subscribers = [];
    }

    getState() {
        return { ...this.state };
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.subscribers.forEach(callback => callback(this.state));
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }
}

// Test suite
const tests = {
    // Test power-up award probability
    testPowerUpAwardProbability() {
        console.log('Testing power-up award probability...');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Test multiple attempts to verify probability
        let awards = 0;
        const attempts = 1000;
        
        for (let i = 0; i < attempts; i++) {
            // Reset state for each attempt
            stateManager.updateState({
                powerUp: { held: null, applied: false }
            });
            
            if (powerUpManager.awardPowerUp()) {
                awards++;
            }
        }
        
        const probability = awards / attempts;
        console.log(`Power-up awarded ${awards}/${attempts} times (${(probability * 100).toFixed(1)}%)`);
        
        // Should be approximately 80% (allow 5% variance for randomness)
        if (probability >= 0.75 && probability <= 0.85) {
            console.log('✅ Power-up probability test passed');
            return true;
        } else {
            console.log('❌ Power-up probability test failed - expected ~80%');
            return false;
        }
    },

    // Test single power-up holding limitation
    testSinglePowerUpLimitation() {
        console.log('Testing single power-up holding limitation...');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Mock Math.random to always return 0 (100% chance)
        const originalRandom = Math.random;
        Math.random = () => 0;
        
        try {
            // First award should succeed
            const firstAward = powerUpManager.awardPowerUp();
            if (!firstAward) {
                console.log('❌ First power-up award failed');
                return false;
            }
            
            // Second award should fail (already holding one)
            const secondAward = powerUpManager.awardPowerUp();
            if (secondAward) {
                console.log('❌ Second power-up award succeeded (should fail)');
                return false;
            }
            
            // Verify only one power-up is held
            if (!powerUpManager.hasPowerUp()) {
                console.log('❌ Power-up not detected as held');
                return false;
            }
            
            console.log('✅ Single power-up limitation test passed');
            return true;
        } finally {
            Math.random = originalRandom;
        }
    },

    // Test power-up application to full-match bets
    testPowerUpApplication() {
        console.log('Testing power-up application...');
        
        const stateManager = new MockStateManager({
            powerUp: {
                held: {
                    id: 'test_powerup',
                    type: '2x_multiplier',
                    description: '2x Winnings Multiplier',
                    awardedAt: Date.now()
                },
                applied: false
            },
            bets: {
                fullMatch: [{
                    id: 'bet_1',
                    stake: 50,
                    odds: 2.0,
                    potentialWinnings: 100,
                    powerUpApplied: false
                }],
                actionBets: []
            }
        });
        
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Apply power-up to bet
        const applied = powerUpManager.applyPowerUp('bet_1');
        if (!applied) {
            console.log('❌ Power-up application failed');
            return false;
        }
        
        // Check updated state
        const updatedState = stateManager.getState();
        const updatedBet = updatedState.bets.fullMatch[0];
        
        // Verify bet was updated with power-up
        if (!updatedBet.powerUpApplied) {
            console.log('❌ Bet not marked as having power-up applied');
            return false;
        }
        
        // Verify winnings were doubled (50 * 2.0 * 2 = 200)
        if (updatedBet.potentialWinnings !== 200) {
            console.log(`❌ Potential winnings incorrect: expected 200, got ${updatedBet.potentialWinnings}`);
            return false;
        }
        
        // Verify power-up was cleared
        if (updatedState.powerUp.held !== null) {
            console.log('❌ Power-up not cleared after application');
            return false;
        }
        
        if (!updatedState.powerUp.applied) {
            console.log('❌ Power-up not marked as applied');
            return false;
        }
        
        console.log('✅ Power-up application test passed');
        return true;
    },

    // Test classic mode disables power-ups
    testClassicModeDisable() {
        console.log('Testing classic mode disable functionality...');
        
        const stateManager = new MockStateManager({
            classicMode: true
        });
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Mock Math.random to always return 0 (100% chance)
        const originalRandom = Math.random;
        Math.random = () => 0;
        
        try {
            // Power-up award should fail in classic mode
            const awarded = powerUpManager.awardPowerUp();
            if (awarded) {
                console.log('❌ Power-up awarded in classic mode');
                return false;
            }
            
            // hasPowerUp should return false in classic mode
            if (powerUpManager.hasPowerUp()) {
                console.log('❌ hasPowerUp returned true in classic mode');
                return false;
            }
            
            // getCurrentPowerUp should return null in classic mode
            if (powerUpManager.getCurrentPowerUp() !== null) {
                console.log('❌ getCurrentPowerUp did not return null in classic mode');
                return false;
            }
            
            console.log('✅ Classic mode disable test passed');
            return true;
        } finally {
            Math.random = originalRandom;
        }
    },

    // Test winnings calculation with power-up
    testWinningsCalculation() {
        console.log('Testing winnings calculation with power-up...');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Test bet without power-up
        const normalBet = {
            id: 'bet_1',
            stake: 50,
            odds: 2.0,
            powerUpApplied: false
        };
        
        const normalWinnings = powerUpManager.calculateWinningsWithPowerUp(normalBet, 100);
        if (normalWinnings !== 100) {
            console.log(`❌ Normal winnings incorrect: expected 100, got ${normalWinnings}`);
            return false;
        }
        
        // Test bet with power-up
        const powerUpBet = {
            id: 'bet_2',
            stake: 50,
            odds: 2.0,
            powerUpApplied: true
        };
        
        const powerUpWinnings = powerUpManager.calculateWinningsWithPowerUp(powerUpBet, 100);
        if (powerUpWinnings !== 200) {
            console.log(`❌ Power-up winnings incorrect: expected 200, got ${powerUpWinnings}`);
            return false;
        }
        
        console.log('✅ Winnings calculation test passed');
        return true;
    },

    // Test power-up clearing
    testPowerUpClearing() {
        console.log('Testing power-up clearing...');
        
        const stateManager = new MockStateManager({
            powerUp: {
                held: {
                    id: 'test_powerup',
                    type: '2x_multiplier'
                },
                applied: false
            }
        });
        
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Verify power-up exists initially
        if (!powerUpManager.hasPowerUp()) {
            console.log('❌ Power-up not detected initially');
            return false;
        }
        
        // Clear power-up
        powerUpManager.clearPowerUp();
        
        // Verify power-up was cleared
        if (powerUpManager.hasPowerUp()) {
            console.log('❌ Power-up not cleared');
            return false;
        }
        
        const state = stateManager.getState();
        if (state.powerUp.held !== null || state.powerUp.applied !== false) {
            console.log('❌ Power-up state not properly reset');
            return false;
        }
        
        console.log('✅ Power-up clearing test passed');
        return true;
    },

    // Test utility methods
    testUtilityMethods() {
        console.log('Testing utility methods...');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Test getMultiplier
        if (powerUpManager.getMultiplier() !== 2) {
            console.log('❌ getMultiplier returned incorrect value');
            return false;
        }
        
        // Test getProbability
        if (powerUpManager.getProbability() !== 0.8) {
            console.log('❌ getProbability returned incorrect value');
            return false;
        }
        
        // Test isClassicMode
        if (powerUpManager.isClassicMode() !== false) {
            console.log('❌ isClassicMode returned incorrect value');
            return false;
        }
        
        // Test setClassicMode
        powerUpManager.setClassicMode(true);
        if (powerUpManager.isClassicMode() !== true) {
            console.log('❌ setClassicMode did not update classic mode');
            return false;
        }
        
        console.log('✅ Utility methods test passed');
        return true;
    },

    // Run all tests
    runAllTests() {
        console.log('🧪 Running PowerUpManager Tests...\n');
        
        const testMethods = [
            'testPowerUpAwardProbability',
            'testSinglePowerUpLimitation',
            'testPowerUpApplication',
            'testClassicModeDisable',
            'testWinningsCalculation',
            'testPowerUpClearing',
            'testUtilityMethods'
        ];
        
        let passed = 0;
        let failed = 0;
        
        testMethods.forEach(testName => {
            try {
                if (this[testName]()) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.log(`❌ ${testName} threw error:`, error.message);
                failed++;
            }
            console.log(''); // Add spacing between tests
        });
        
        console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
        
        if (failed === 0) {
            console.log('🎉 All PowerUpManager tests passed!');
        } else {
            console.log('⚠️ Some tests failed. Please review the implementation.');
        }
        
        return failed === 0;
    }
};

// Export for use in other test files
export { tests as PowerUpManagerTests };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.PowerUpManagerTests = tests;
} else {
    // Node.js environment
    tests.runAllTests();
}