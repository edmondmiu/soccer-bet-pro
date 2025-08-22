/**
 * PowerUpManager Requirements Verification
 * 
 * This script verifies that the PowerUpManager implementation
 * meets all specified requirements from the design document.
 */

import { PowerUpManager } from './PowerUpManager.js';

// Mock StateManager for verification
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

const verificationTests = {
    // Requirement 5.1: 80% probability power-up award on action bet wins
    verifyRequirement5_1() {
        console.log('🔍 Verifying Requirement 5.1: 80% probability power-up award');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Test that probability is correctly set
        const probability = powerUpManager.getProbability();
        if (probability !== 0.8) {
            console.log('❌ Incorrect probability setting');
            return false;
        }
        
        // Test statistical probability over many attempts
        let awards = 0;
        const attempts = 1000;
        
        for (let i = 0; i < attempts; i++) {
            stateManager.updateState({
                powerUp: { held: null, applied: false }
            });
            
            if (powerUpManager.awardPowerUp()) {
                awards++;
            }
        }
        
        const actualProbability = awards / attempts;
        const withinRange = actualProbability >= 0.75 && actualProbability <= 0.85;
        
        console.log(`   📊 Awarded ${awards}/${attempts} times (${(actualProbability * 100).toFixed(1)}%)`);
        console.log(`   ✅ Requirement 5.1: ${withinRange ? 'PASSED' : 'FAILED'}`);
        
        return withinRange;
    },

    // Requirement 5.2: Display power-up award message and UI button
    verifyRequirement5_2() {
        console.log('🔍 Verifying Requirement 5.2: Power-up award message and UI');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Mock successful power-up award
        const originalRandom = Math.random;
        Math.random = () => 0; // 100% chance
        
        try {
            const awarded = powerUpManager.awardPowerUp();
            
            if (!awarded) {
                console.log('❌ Power-up not awarded');
                return false;
            }
            
            // Check that power-up is available for UI display
            const hasPowerUp = powerUpManager.hasPowerUp();
            const currentPowerUp = powerUpManager.getCurrentPowerUp();
            
            if (!hasPowerUp || !currentPowerUp) {
                console.log('❌ Power-up not available for UI display');
                return false;
            }
            
            // Verify power-up has correct properties for UI
            if (currentPowerUp.type !== '2x_multiplier' || 
                currentPowerUp.description !== '2x Winnings Multiplier') {
                console.log('❌ Power-up missing required UI properties');
                return false;
            }
            
            console.log('   ✅ Requirement 5.2: PASSED');
            return true;
        } finally {
            Math.random = originalRandom;
        }
    },

    // Requirement 5.3: Apply 2x multiplier to full-match bet winnings
    verifyRequirement5_3() {
        console.log('🔍 Verifying Requirement 5.3: 2x multiplier application');
        
        const stateManager = new MockStateManager({
            powerUp: {
                held: {
                    id: 'test_powerup',
                    type: '2x_multiplier',
                    description: '2x Winnings Multiplier'
                },
                applied: false
            },
            bets: {
                fullMatch: [{
                    id: 'bet_1',
                    stake: 100,
                    odds: 2.0,
                    potentialWinnings: 200,
                    powerUpApplied: false
                }],
                actionBets: []
            }
        });
        
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Apply power-up
        const applied = powerUpManager.applyPowerUp('bet_1');
        if (!applied) {
            console.log('❌ Power-up application failed');
            return false;
        }
        
        // Check that winnings were doubled
        const updatedState = stateManager.getState();
        const updatedBet = updatedState.bets.fullMatch[0];
        
        if (updatedBet.potentialWinnings !== 400) { // 100 * 2.0 * 2
            console.log(`❌ Winnings not doubled: expected 400, got ${updatedBet.potentialWinnings}`);
            return false;
        }
        
        // Test calculateWinningsWithPowerUp method
        const baseWinnings = 200;
        const finalWinnings = powerUpManager.calculateWinningsWithPowerUp(updatedBet, baseWinnings);
        
        if (finalWinnings !== 400) { // 200 * 2
            console.log(`❌ calculateWinningsWithPowerUp incorrect: expected 400, got ${finalWinnings}`);
            return false;
        }
        
        console.log('   ✅ Requirement 5.3: PASSED');
        return true;
    },

    // Requirement 5.4: Single power-up holding limitation
    verifyRequirement5_4() {
        console.log('🔍 Verifying Requirement 5.4: Single power-up holding limitation');
        
        const stateManager = new MockStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Mock 100% award chance
        const originalRandom = Math.random;
        Math.random = () => 0;
        
        try {
            // First award should succeed
            const firstAward = powerUpManager.awardPowerUp();
            if (!firstAward) {
                console.log('❌ First power-up award failed');
                return false;
            }
            
            // Second award should fail
            const secondAward = powerUpManager.awardPowerUp();
            if (secondAward) {
                console.log('❌ Second power-up award succeeded (should fail)');
                return false;
            }
            
            // Verify only one power-up exists
            const state = stateManager.getState();
            if (!state.powerUp.held || state.powerUp.held.id === undefined) {
                console.log('❌ Power-up not properly stored');
                return false;
            }
            
            console.log('   ✅ Requirement 5.4: PASSED');
            return true;
        } finally {
            Math.random = originalRandom;
        }
    },

    // Requirement 5.6: Classic mode disables all power-up mechanics
    verifyRequirement5_6() {
        console.log('🔍 Verifying Requirement 5.6: Classic mode disables power-ups');
        
        const stateManager = new MockStateManager({
            classicMode: true
        });
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Mock 100% award chance
        const originalRandom = Math.random;
        Math.random = () => 0;
        
        try {
            // Power-up award should fail in classic mode
            const awarded = powerUpManager.awardPowerUp();
            if (awarded) {
                console.log('❌ Power-up awarded in classic mode');
                return false;
            }
            
            // hasPowerUp should return false
            if (powerUpManager.hasPowerUp()) {
                console.log('❌ hasPowerUp returned true in classic mode');
                return false;
            }
            
            // getCurrentPowerUp should return null
            if (powerUpManager.getCurrentPowerUp() !== null) {
                console.log('❌ getCurrentPowerUp did not return null in classic mode');
                return false;
            }
            
            // Test power-up application should fail
            stateManager.updateState({
                classicMode: false,
                powerUp: {
                    held: { id: 'test', type: '2x_multiplier' },
                    applied: false
                },
                bets: {
                    fullMatch: [{ id: 'bet_1', stake: 100, odds: 2.0 }],
                    actionBets: []
                }
            });
            
            // Re-enable classic mode
            stateManager.updateState({ classicMode: true });
            
            const applied = powerUpManager.applyPowerUp('bet_1');
            if (applied) {
                console.log('❌ Power-up application succeeded in classic mode');
                return false;
            }
            
            console.log('   ✅ Requirement 5.6: PASSED');
            return true;
        } finally {
            Math.random = originalRandom;
        }
    },

    // Run all verification tests
    runAllVerifications() {
        console.log('🔍 PowerUpManager Requirements Verification');
        console.log('==========================================\n');
        
        const verifications = [
            'verifyRequirement5_1',
            'verifyRequirement5_2',
            'verifyRequirement5_3',
            'verifyRequirement5_4',
            'verifyRequirement5_6'
        ];
        
        let passed = 0;
        let failed = 0;
        
        verifications.forEach(verificationName => {
            try {
                if (this[verificationName]()) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.log(`❌ ${verificationName} threw error:`, error.message);
                failed++;
            }
            console.log('');
        });
        
        console.log(`📊 Verification Results: ${passed} passed, ${failed} failed\n`);
        
        if (failed === 0) {
            console.log('🎉 All requirements verified successfully!');
            console.log('✅ PowerUpManager implementation is complete and correct.');
        } else {
            console.log('⚠️ Some requirements failed verification.');
            console.log('❌ Please review the implementation.');
        }
        
        return failed === 0;
    }
};

// Export for use in other files
export { verificationTests as PowerUpVerification };

// Run verification if this file is executed directly
if (typeof window !== 'undefined') {
    window.PowerUpVerification = verificationTests;
} else {
    verificationTests.runAllVerifications();
}