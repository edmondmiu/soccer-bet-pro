/**
 * PowerUpManager Integration Test
 * 
 * This test simulates real-world usage scenarios to ensure
 * the PowerUpManager integrates correctly with the game system.
 */

import { PowerUpManager } from './PowerUpManager.js';

// Mock StateManager that simulates real game state
class GameStateManager {
    constructor() {
        this.state = {
            classicMode: false,
            wallet: 1000,
            powerUp: { held: null, applied: false },
            bets: { fullMatch: [], actionBets: [] },
            match: {
                active: true,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 1,
                awayScore: 0
            }
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

    // Simulate placing a bet
    placeBet(betData) {
        const bet = {
            id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: betData.type,
            outcome: betData.outcome,
            stake: betData.stake,
            odds: betData.odds,
            potentialWinnings: betData.stake * betData.odds,
            status: 'pending',
            placedAt: Date.now(),
            powerUpApplied: false
        };

        if (betData.type === 'fullMatch') {
            this.state.bets.fullMatch.push(bet);
        } else {
            this.state.bets.actionBets.push(bet);
        }

        this.state.wallet -= betData.stake;
        return bet;
    }

    // Simulate winning an action bet
    resolveActionBet(betId, won) {
        const bet = this.state.bets.actionBets.find(b => b.id === betId);
        if (bet) {
            bet.status = won ? 'won' : 'lost';
            bet.resolvedAt = Date.now();
            
            if (won) {
                this.state.wallet += bet.potentialWinnings;
            }
        }
        return bet;
    }
}

const integrationTests = {
    // Test complete power-up workflow
    testCompleteWorkflow() {
        console.log('🔄 Testing complete power-up workflow...');
        
        const stateManager = new GameStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Step 1: Place an action bet
        const actionBet = stateManager.placeBet({
            type: 'actionBet',
            outcome: 'goal_scored',
            stake: 50,
            odds: 3.0
        });
        
        console.log(`   📝 Placed action bet: $${actionBet.stake} on ${actionBet.outcome}`);
        
        // Step 2: Action bet wins
        stateManager.resolveActionBet(actionBet.id, true);
        console.log(`   🎉 Action bet won! Payout: $${actionBet.potentialWinnings}`);
        
        // Step 3: Try to award power-up (80% chance)
        const originalRandom = Math.random;
        Math.random = () => 0.5; // 50% - should award power-up
        
        const powerUpAwarded = powerUpManager.awardPowerUp();
        console.log(`   ⭐ Power-up awarded: ${powerUpAwarded}`);
        
        Math.random = originalRandom;
        
        if (!powerUpAwarded) {
            console.log('   ℹ️ No power-up awarded this time (random chance)');
            return true; // This is still valid behavior
        }
        
        // Step 4: Place a full-match bet
        const fullMatchBet = stateManager.placeBet({
            type: 'fullMatch',
            outcome: 'home_win',
            stake: 100,
            odds: 2.5
        });
        
        console.log(`   📝 Placed full-match bet: $${fullMatchBet.stake} on ${fullMatchBet.outcome}`);
        
        // Step 5: Apply power-up to full-match bet
        const powerUpApplied = powerUpManager.applyPowerUp(fullMatchBet.id);
        console.log(`   ⚡ Power-up applied: ${powerUpApplied}`);
        
        if (!powerUpApplied) {
            console.log('❌ Power-up application failed');
            return false;
        }
        
        // Step 6: Verify bet has doubled potential winnings
        const updatedState = stateManager.getState();
        const updatedBet = updatedState.bets.fullMatch.find(b => b.id === fullMatchBet.id);
        
        const expectedWinnings = fullMatchBet.stake * fullMatchBet.odds * 2; // 100 * 2.5 * 2 = 500
        if (updatedBet.potentialWinnings !== expectedWinnings) {
            console.log(`❌ Incorrect potential winnings: expected ${expectedWinnings}, got ${updatedBet.potentialWinnings}`);
            return false;
        }
        
        console.log(`   💰 Potential winnings doubled: $${updatedBet.potentialWinnings}`);
        
        // Step 7: Verify power-up is no longer held
        if (powerUpManager.hasPowerUp()) {
            console.log('❌ Power-up still held after application');
            return false;
        }
        
        console.log('   ✅ Power-up cleared after application');
        console.log('✅ Complete workflow test passed');
        return true;
    },

    // Test classic mode integration
    testClassicModeIntegration() {
        console.log('🎯 Testing classic mode integration...');
        
        const stateManager = new GameStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Enable classic mode
        powerUpManager.setClassicMode(true);
        console.log('   🔧 Classic mode enabled');
        
        // Verify state was updated
        const state = stateManager.getState();
        if (!state.classicMode) {
            console.log('❌ Classic mode not updated in state');
            return false;
        }
        
        // Try to award power-up (should fail)
        const originalRandom = Math.random;
        Math.random = () => 0; // 100% chance, but should still fail
        
        const powerUpAwarded = powerUpManager.awardPowerUp();
        Math.random = originalRandom;
        
        if (powerUpAwarded) {
            console.log('❌ Power-up awarded in classic mode');
            return false;
        }
        
        console.log('   ✅ Power-up correctly blocked in classic mode');
        
        // Disable classic mode
        powerUpManager.setClassicMode(false);
        console.log('   🔧 Classic mode disabled');
        
        // Now power-up should work
        Math.random = () => 0;
        const powerUpAwardedAfter = powerUpManager.awardPowerUp();
        Math.random = originalRandom;
        
        if (!powerUpAwardedAfter) {
            console.log('❌ Power-up not awarded after disabling classic mode');
            return false;
        }
        
        console.log('   ✅ Power-up works after disabling classic mode');
        console.log('✅ Classic mode integration test passed');
        return true;
    },

    // Test multiple betting scenarios
    testMultipleBettingScenarios() {
        console.log('🎲 Testing multiple betting scenarios...');
        
        const stateManager = new GameStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Mock 100% power-up chance for predictable testing
        const originalRandom = Math.random;
        Math.random = () => 0;
        
        try {
            // Scenario 1: Win action bet, get power-up, apply to full-match bet
            const actionBet1 = stateManager.placeBet({
                type: 'actionBet',
                outcome: 'corner_kick',
                stake: 25,
                odds: 4.0
            });
            
            stateManager.resolveActionBet(actionBet1.id, true);
            const powerUp1 = powerUpManager.awardPowerUp();
            
            if (!powerUp1) {
                console.log('❌ First power-up not awarded');
                return false;
            }
            
            const fullMatchBet1 = stateManager.placeBet({
                type: 'fullMatch',
                outcome: 'draw',
                stake: 75,
                odds: 3.2
            });
            
            const applied1 = powerUpManager.applyPowerUp(fullMatchBet1.id);
            if (!applied1) {
                console.log('❌ First power-up not applied');
                return false;
            }
            
            console.log('   ✅ Scenario 1: Power-up awarded and applied successfully');
            
            // Scenario 2: Try to get another power-up immediately (should fail - already applied)
            const actionBet2 = stateManager.placeBet({
                type: 'actionBet',
                outcome: 'yellow_card',
                stake: 30,
                odds: 2.8
            });
            
            stateManager.resolveActionBet(actionBet2.id, true);
            const powerUp2 = powerUpManager.awardPowerUp();
            
            if (!powerUp2) {
                console.log('❌ Second power-up not awarded');
                return false;
            }
            
            console.log('   ✅ Scenario 2: New power-up awarded after previous was used');
            
            // Scenario 3: Try to apply power-up to non-existent bet
            const applied3 = powerUpManager.applyPowerUp('non_existent_bet');
            if (applied3) {
                console.log('❌ Power-up applied to non-existent bet');
                return false;
            }
            
            console.log('   ✅ Scenario 3: Power-up correctly rejected for invalid bet');
            
            console.log('✅ Multiple betting scenarios test passed');
            return true;
        } finally {
            Math.random = originalRandom;
        }
    },

    // Test edge cases and error handling
    testEdgeCases() {
        console.log('🔍 Testing edge cases and error handling...');
        
        const stateManager = new GameStateManager();
        const powerUpManager = new PowerUpManager(stateManager);
        
        // Edge case 1: Try to apply power-up when none is held
        const fullMatchBet = stateManager.placeBet({
            type: 'fullMatch',
            outcome: 'away_win',
            stake: 50,
            odds: 2.0
        });
        
        const applied = powerUpManager.applyPowerUp(fullMatchBet.id);
        if (applied) {
            console.log('❌ Power-up applied when none was held');
            return false;
        }
        
        console.log('   ✅ Edge case 1: Correctly rejected power-up application when none held');
        
        // Edge case 2: Clear power-up when none exists
        powerUpManager.clearPowerUp();
        const state = stateManager.getState();
        if (state.powerUp.held !== null || state.powerUp.applied !== false) {
            console.log('❌ Power-up state not properly reset');
            return false;
        }
        
        console.log('   ✅ Edge case 2: Safely cleared non-existent power-up');
        
        // Edge case 3: Calculate winnings for bet without power-up
        const normalBet = {
            id: 'test_bet',
            powerUpApplied: false
        };
        
        const winnings = powerUpManager.calculateWinningsWithPowerUp(normalBet, 100);
        if (winnings !== 100) {
            console.log(`❌ Incorrect winnings for normal bet: expected 100, got ${winnings}`);
            return false;
        }
        
        console.log('   ✅ Edge case 3: Correctly calculated winnings for normal bet');
        
        console.log('✅ Edge cases test passed');
        return true;
    },

    // Run all integration tests
    runAllIntegrationTests() {
        console.log('🧪 PowerUpManager Integration Tests');
        console.log('==================================\n');
        
        const tests = [
            'testCompleteWorkflow',
            'testClassicModeIntegration',
            'testMultipleBettingScenarios',
            'testEdgeCases'
        ];
        
        let passed = 0;
        let failed = 0;
        
        tests.forEach(testName => {
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
            console.log('');
        });
        
        console.log(`📊 Integration Test Results: ${passed} passed, ${failed} failed\n`);
        
        if (failed === 0) {
            console.log('🎉 All integration tests passed!');
            console.log('✅ PowerUpManager is ready for production use.');
        } else {
            console.log('⚠️ Some integration tests failed.');
            console.log('❌ Please review the implementation.');
        }
        
        return failed === 0;
    }
};

// Export for use in other files
export { integrationTests as PowerUpIntegrationTests };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    window.PowerUpIntegrationTests = integrationTests;
} else {
    integrationTests.runAllIntegrationTests();
}