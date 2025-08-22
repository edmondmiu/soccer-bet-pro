/**
 * BettingManager Integration Test
 * Tests integration with actual StateManager from the project
 */

import { BettingManager } from './BettingManager.js';
import { StateManager } from '../core/StateManager.js';

// Mock PowerUpManager for integration test
class MockPowerUpManager {
    awardPowerUp() {
        return { success: true, powerUp: { type: '2x_multiplier' } };
    }
}

function runIntegrationTest() {
    console.log('🔗 Running BettingManager Integration Test with StateManager\n');
    
    try {
        // Initialize StateManager with initial state
        const stateManager = new StateManager({
            wallet: 1000,
            bets: {
                fullMatch: [],
                actionBet: []
            },
            powerUp: {
                held: null,
                applied: false
            }
        });

        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        console.log('✅ Initialized BettingManager with StateManager');

        // Test 1: Place a full-match bet
        console.log('\n📝 Test 1: Place full-match bet');
        const bet1Result = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: 100,
            odds: 1.85
        });

        if (bet1Result.success) {
            console.log('✅ Full-match bet placed successfully');
            console.log(`   Bet ID: ${bet1Result.bet.id}`);
            console.log(`   Potential winnings: $${bet1Result.bet.potentialWinnings}`);
            console.log(`   Wallet balance: $${stateManager.getState().wallet}`);
        } else {
            throw new Error(`Bet placement failed: ${bet1Result.error}`);
        }

        // Test 2: Place an action bet
        console.log('\n📝 Test 2: Place action bet');
        const bet2Result = bettingManager.placeBet({
            type: 'actionBet',
            outcome: 'goal',
            stake: 50,
            odds: 2.5,
            eventId: 'event_123'
        });

        if (bet2Result.success) {
            console.log('✅ Action bet placed successfully');
            console.log(`   Bet ID: ${bet2Result.bet.id}`);
            console.log(`   Event ID: ${bet2Result.bet.eventId}`);
            console.log(`   Wallet balance: $${stateManager.getState().wallet}`);
        } else {
            throw new Error(`Action bet placement failed: ${bet2Result.error}`);
        }

        // Test 3: Award and apply power-up
        console.log('\n📝 Test 3: Power-up system');
        
        // Simulate power-up award
        stateManager.updateState({
            powerUp: {
                held: { type: '2x_multiplier', awardedAt: Date.now() },
                applied: false
            }
        });

        const powerUpResult = bettingManager.applyPowerUp(bet1Result.bet.id);
        if (powerUpResult.success) {
            console.log('✅ Power-up applied successfully');
            const state = stateManager.getState();
            const updatedBet = state.bets.fullMatch.find(b => b.id === bet1Result.bet.id);
            console.log(`   Updated potential winnings: $${updatedBet.potentialWinnings}`);
            console.log(`   Power-up applied: ${updatedBet.powerUpApplied}`);
        } else {
            throw new Error(`Power-up application failed: ${powerUpResult.error}`);
        }

        // Test 4: Resolve bets
        console.log('\n📝 Test 4: Bet resolution');
        
        // Resolve action bet first
        const actionResolution = bettingManager.resolveBets('goal', 'actionBet', 'event_123');
        if (actionResolution.success) {
            console.log('✅ Action bet resolved successfully');
            console.log(`   Total winnings: $${actionResolution.totalWinnings}`);
            console.log(`   Wallet balance: $${stateManager.getState().wallet}`);
        } else {
            throw new Error(`Action bet resolution failed: ${actionResolution.error}`);
        }

        // Resolve full-match bet
        const fullMatchResolution = bettingManager.resolveBets('home', 'fullMatch');
        if (fullMatchResolution.success) {
            console.log('✅ Full-match bet resolved successfully');
            console.log(`   Total winnings: $${fullMatchResolution.totalWinnings}`);
            console.log(`   Final wallet balance: $${stateManager.getState().wallet}`);
        } else {
            throw new Error(`Full-match bet resolution failed: ${fullMatchResolution.error}`);
        }

        // Test 5: Statistics
        console.log('\n📝 Test 5: Betting statistics');
        const stats = bettingManager.getBetStatistics();
        console.log('✅ Statistics calculated successfully');
        console.log(`   Total bets: ${stats.totalBets}`);
        console.log(`   Total staked: $${stats.totalStaked}`);
        console.log(`   Total winnings: $${stats.totalWinnings}`);
        console.log(`   Net profit: $${stats.netProfit}`);
        console.log(`   Win rate: ${stats.winRate}%`);

        // Test 6: State consistency
        console.log('\n📝 Test 6: State consistency check');
        const finalState = stateManager.getState();
        
        const expectedWallet = 1000 - 100 - 50 + 125 + 370; // Initial - bets + action win + full match win (with power-up)
        const actualWallet = finalState.wallet;
        
        if (Math.abs(actualWallet - expectedWallet) < 0.01) {
            console.log('✅ Wallet balance is consistent');
            console.log(`   Expected: $${expectedWallet}, Actual: $${actualWallet}`);
        } else {
            throw new Error(`Wallet inconsistency: Expected $${expectedWallet}, got $${actualWallet}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ BettingManager integrates correctly with StateManager');
        console.log('✅ All betting operations work as expected');
        console.log('✅ State management is consistent and reliable');
        console.log('='.repeat(60));

        return true;

    } catch (error) {
        console.error('\n💥 INTEGRATION TEST FAILED:');
        console.error(`❌ ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

// Export for use in other files
export { runIntegrationTest };

// Run integration test if this file is executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('integration-test')) {
    runIntegrationTest();
}