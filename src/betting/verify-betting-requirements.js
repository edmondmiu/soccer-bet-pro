/**
 * BettingManager Requirements Verification
 * Verifies implementation against specific requirements from the spec
 */

import { BettingManager } from './BettingManager.js';
import { MockStateManager, MockPowerUpManager } from './BettingManager.test.js';

function verifyRequirements() {
    console.log('🔍 Verifying BettingManager Requirements Implementation\n');
    
    const results = [];
    
    function verifyRequirement(id, description, testFn) {
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${id}: ${description}`);
                results.push({ id, status: 'PASS', description });
            } else {
                console.log(`❌ ${id}: ${description} - FAILED`);
                results.push({ id, status: 'FAIL', description });
            }
        } catch (error) {
            console.log(`❌ ${id}: ${description} - ERROR: ${error.message}`);
            results.push({ id, status: 'ERROR', description, error: error.message });
        }
    }

    // Requirement 3.4: Instant bet placement while game continues running
    verifyRequirement('3.4', 'Instant bet placement while game continues running', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        };

        const result = bettingManager.placeBet(betData);
        return result.success && result.bet.type === 'fullMatch';
    });

    // Requirement 5.5: Multiple bets on same or different outcomes
    verifyRequirement('5.5', 'Multiple bets on same or different outcomes', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const bet1 = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: 25,
            odds: 1.85
        });

        const bet2 = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        });

        const bet3 = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'away',
            stake: 30,
            odds: 4.2
        });

        return bet1.success && bet2.success && bet3.success && 
               stateManager.getState().bets.fullMatch.length === 3;
    });

    // Requirement 6.1: Action bet resolution 4 minutes after events
    verifyRequirement('6.1', 'Action bet resolution logic', () => {
        const stateManager = new MockStateManager({
            wallet: 950,
            bets: {
                fullMatch: [],
                actionBet: [{
                    id: 'bet_1',
                    outcome: 'goal',
                    stake: 25,
                    odds: 2.5,
                    status: 'pending',
                    eventId: 'event_123',
                    powerUpApplied: false
                }]
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const result = bettingManager.resolveBets('goal', 'actionBet', 'event_123');
        return result.success && result.totalWinnings === 62.5;
    });

    // Requirement 6.2: Payout processing and wallet updates
    verifyRequirement('6.2', 'Payout processing and wallet updates', () => {
        const stateManager = new MockStateManager({
            wallet: 900,
            bets: {
                fullMatch: [{
                    id: 'bet_1',
                    outcome: 'home',
                    stake: 50,
                    odds: 1.85,
                    status: 'pending',
                    powerUpApplied: false
                }],
                actionBet: []
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const initialWallet = stateManager.getState().wallet;
        const result = bettingManager.resolveBets('home', 'fullMatch');
        const finalWallet = stateManager.getState().wallet;

        return result.success && finalWallet === initialWallet + 92.5;
    });

    // Requirement 8.1: Bet amount validation against wallet balance
    verifyRequirement('8.1', 'Bet amount validation against wallet balance', () => {
        const stateManager = new MockStateManager({ wallet: 25 });
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        // Test valid bet within wallet
        const validResult = bettingManager.validateBetAmount(20, 25);
        
        // Test invalid bet exceeding wallet
        const invalidResult = bettingManager.validateBetAmount(30, 25);
        
        // Test bet placement with insufficient funds
        const betResult = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        });

        return validResult && !invalidResult && !betResult.success && 
               betResult.error.includes('Insufficient funds');
    });

    // Power-up multiplier support (from requirement 5.5 context)
    verifyRequirement('5.5-PowerUp', 'Power-up multiplier support in winnings calculation', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        // Test base winnings calculation
        const baseWinnings = bettingManager.calculatePotentialWinnings(50, 1.85, false);
        
        // Test power-up winnings calculation
        const powerUpWinnings = bettingManager.calculatePotentialWinnings(50, 1.85, true);

        return baseWinnings === 92.5 && powerUpWinnings === 185;
    });

    // Comprehensive error handling
    verifyRequirement('ErrorHandling', 'Comprehensive error handling and validation', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        // Test various invalid inputs
        const tests = [
            bettingManager.placeBet(null),
            bettingManager.placeBet({}),
            bettingManager.placeBet({ type: 'invalid' }),
            bettingManager.placeBet({ type: 'fullMatch', stake: -10 }),
            bettingManager.placeBet({ type: 'fullMatch', outcome: 'home', stake: 0.5, odds: 1.85 })
        ];

        return tests.every(result => !result.success);
    });

    // Bet statistics and tracking
    verifyRequirement('Statistics', 'Bet statistics calculation and tracking', () => {
        const stateManager = new MockStateManager({
            wallet: 1000,
            bets: {
                fullMatch: [
                    { id: 'bet_1', stake: 50, status: 'won', actualWinnings: 92.5 },
                    { id: 'bet_2', stake: 25, status: 'lost' }
                ],
                actionBet: [
                    { id: 'bet_3', stake: 20, status: 'pending' }
                ]
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const stats = bettingManager.getBetStatistics();
        
        return stats.totalBets === 3 && 
               stats.totalStaked === 95 && 
               stats.totalWinnings === 92.5 &&
               stats.pendingBets === 1 &&
               stats.wonBets === 1 &&
               stats.lostBets === 1;
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 REQUIREMENTS VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed === 0 && errors === 0) {
        console.log('\n🎉 ALL REQUIREMENTS VERIFIED SUCCESSFULLY!');
        console.log('✅ BettingManager fully implements the specified requirements');
        return true;
    } else {
        console.log('\n⚠️  Some requirements verification failed');
        console.log('❌ Review implementation against failed requirements');
        return false;
    }
}

// Export for use in other files
export { verifyRequirements };

// Run verification if this file is executed directly
if (typeof window !== 'undefined' || (typeof process !== 'undefined' && process.argv[1]?.includes('verify-betting-requirements'))) {
    verifyRequirements();
}