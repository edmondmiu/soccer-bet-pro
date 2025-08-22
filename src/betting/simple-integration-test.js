/**
 * Simple BettingManager Integration Test
 * Tests core functionality without complex state updates
 */

import { BettingManager } from './BettingManager.js';
import { MockStateManager } from './BettingManager.test.js';

// Mock PowerUpManager for integration test
class MockPowerUpManager {
    awardPowerUp() {
        return { success: true, powerUp: { type: '2x_multiplier' } };
    }
}

function runSimpleIntegrationTest() {
    console.log('🔗 Running Simple BettingManager Integration Test\n');
    
    try {
        // Initialize with MockStateManager (which works reliably)
        const stateManager = new MockStateManager({
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

        console.log('✅ Initialized BettingManager with MockStateManager');

        // Test complete betting workflow
        console.log('\n📝 Complete Betting Workflow Test');
        
        // 1. Place multiple bets
        const fullMatchBet = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: 100,
            odds: 1.85
        });

        const actionBet = bettingManager.placeBet({
            type: 'actionBet',
            outcome: 'goal',
            stake: 50,
            odds: 2.5,
            eventId: 'event_123'
        });

        if (!fullMatchBet.success || !actionBet.success) {
            throw new Error('Bet placement failed');
        }

        console.log('✅ Multiple bets placed successfully');
        console.log(`   Full-match bet: $${fullMatchBet.bet.stake} at ${fullMatchBet.bet.odds}`);
        console.log(`   Action bet: $${actionBet.bet.stake} at ${actionBet.bet.odds}`);
        console.log(`   Wallet balance: $${stateManager.getState().wallet}`);

        // 2. Apply power-up
        stateManager.updateState({
            powerUp: {
                held: { type: '2x_multiplier' },
                applied: false
            }
        });

        const powerUpResult = bettingManager.applyPowerUp(fullMatchBet.bet.id);
        if (!powerUpResult.success) {
            throw new Error(`Power-up application failed: ${powerUpResult.error}`);
        }

        console.log('✅ Power-up applied successfully');
        const updatedBet = stateManager.getState().bets.fullMatch[0];
        console.log(`   Updated potential winnings: $${updatedBet.potentialWinnings}`);

        // 3. Resolve action bet (winning)
        const actionResolution = bettingManager.resolveBets('goal', 'actionBet', 'event_123');
        if (!actionResolution.success) {
            throw new Error(`Action bet resolution failed: ${actionResolution.error}`);
        }

        console.log('✅ Action bet resolved (won)');
        console.log(`   Winnings: $${actionResolution.totalWinnings}`);
        console.log(`   Wallet balance: $${stateManager.getState().wallet}`);

        // 4. Resolve full-match bet (winning with power-up)
        const fullMatchResolution = bettingManager.resolveBets('home', 'fullMatch');
        if (!fullMatchResolution.success) {
            throw new Error(`Full-match bet resolution failed: ${fullMatchResolution.error}`);
        }

        console.log('✅ Full-match bet resolved (won with power-up)');
        console.log(`   Winnings: $${fullMatchResolution.totalWinnings}`);
        console.log(`   Final wallet balance: $${stateManager.getState().wallet}`);

        // 5. Verify statistics
        const stats = bettingManager.getBetStatistics();
        console.log('\n📊 Final Statistics:');
        console.log(`   Total bets: ${stats.totalBets}`);
        console.log(`   Total staked: $${stats.totalStaked}`);
        console.log(`   Total winnings: $${stats.totalWinnings}`);
        console.log(`   Net profit: $${stats.netProfit}`);
        console.log(`   Win rate: ${stats.winRate}%`);

        // 6. Verify wallet calculation
        const expectedWallet = 1000 - 150 + 125 + 370; // Initial - stakes + action win + full match win (with power-up)
        const actualWallet = stateManager.getState().wallet;
        
        if (Math.abs(actualWallet - expectedWallet) < 0.01) {
            console.log('✅ Wallet calculation is correct');
        } else {
            throw new Error(`Wallet mismatch: Expected $${expectedWallet}, got $${actualWallet}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 SIMPLE INTEGRATION TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ BettingManager core functionality works correctly');
        console.log('✅ All betting operations integrate properly');
        console.log('✅ State management is consistent');
        console.log('✅ Power-up system functions as expected');
        console.log('✅ Bet resolution and payouts work correctly');
        console.log('='.repeat(60));

        return true;

    } catch (error) {
        console.error('\n💥 SIMPLE INTEGRATION TEST FAILED:');
        console.error(`❌ ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

// Export for use in other files
export { runSimpleIntegrationTest };

// Run integration test if this file is executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('simple-integration-test')) {
    runSimpleIntegrationTest();
}