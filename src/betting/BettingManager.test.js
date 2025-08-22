/**
 * BettingManager Tests
 * Comprehensive test suite for betting logic and edge cases
 */

import { BettingManager } from './BettingManager.js';

// Mock StateManager for testing
class MockStateManager {
    constructor(initialState = {}) {
        this.state = {
            wallet: 1000,
            bets: {
                fullMatch: [],
                actionBet: []
            },
            powerUp: {
                held: null,
                applied: false
            },
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

// Mock PowerUpManager for testing
class MockPowerUpManager {
    constructor() {
        this.powerUps = [];
    }

    awardPowerUp() {
        return { success: true, powerUp: { type: '2x_multiplier' } };
    }
}

// Test runner
function runTests() {
    const tests = [];
    let passedTests = 0;
    let failedTests = 0;

    function test(name, testFn) {
        tests.push({ name, testFn });
    }

    function expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, got ${actual}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            }
        };
    }

    // Test: Basic bet placement
    test('should place valid full-match bet', () => {
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
        
        expect(result.success).toBeTruthy();
        expect(result.bet.stake).toBe(50);
        expect(result.bet.odds).toBe(1.85);
        expect(result.bet.potentialWinnings).toBe(92.5);
        expect(stateManager.getState().wallet).toBe(950);
    });

    // Test: Insufficient funds validation
    test('should reject bet with insufficient funds', () => {
        const stateManager = new MockStateManager({ wallet: 25 });
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        };

        const result = bettingManager.placeBet(betData);
        
        expect(result.success).toBeFalsy();
        expect(result.error).toContain('Insufficient funds');
        expect(stateManager.getState().wallet).toBe(25); // Wallet unchanged
    });

    // Test: Invalid bet data validation
    test('should reject invalid bet data', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        // Test missing type
        let result = bettingManager.placeBet({
            outcome: 'home',
            stake: 50,
            odds: 1.85
        });
        expect(result.success).toBeFalsy();
        expect(result.error).toContain('Invalid bet type');

        // Test invalid stake
        result = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: -10,
            odds: 1.85
        });
        expect(result.success).toBeFalsy();
        expect(result.error).toContain('Invalid bet amount');

        // Test invalid odds
        result = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 0
        });
        expect(result.success).toBeFalsy();
        expect(result.error).toContain('Invalid odds');
    });

    // Test: Minimum bet validation
    test('should enforce minimum bet amount', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 0.5,
            odds: 1.85
        };

        const result = bettingManager.placeBet(betData);
        
        expect(result.success).toBeFalsy();
        expect(result.error).toContain('Minimum bet amount is $1');
    });

    // Test: Action bet placement
    test('should place valid action bet with event ID', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const betData = {
            type: 'actionBet',
            outcome: 'goal',
            stake: 25,
            odds: 2.5,
            eventId: 'event_123'
        };

        const result = bettingManager.placeBet(betData);
        
        expect(result.success).toBeTruthy();
        expect(result.bet.eventId).toBe('event_123');
        expect(result.bet.type).toBe('actionBet');
        expect(stateManager.getState().bets.actionBet.length).toBe(1);
    });

    // Test: Winnings calculation
    test('should calculate winnings correctly', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const bet = {
            outcome: 'home',
            stake: 50,
            odds: 1.85,
            powerUpApplied: false
        };

        // Winning bet
        let winnings = bettingManager.calculateWinnings(bet, 'home');
        expect(winnings).toBe(92.5);

        // Losing bet
        winnings = bettingManager.calculateWinnings(bet, 'away');
        expect(winnings).toBe(0);

        // Winning bet with power-up
        bet.powerUpApplied = true;
        winnings = bettingManager.calculateWinnings(bet, 'home');
        expect(winnings).toBe(185); // 92.5 * 2
    });

    // Test: Power-up application
    test('should apply power-up to pending bet', () => {
        const stateManager = new MockStateManager({
            wallet: 1000,
            bets: {
                fullMatch: [{
                    id: 'bet_1',
                    type: 'fullMatch',
                    outcome: 'home',
                    stake: 50,
                    odds: 1.85,
                    status: 'pending',
                    powerUpApplied: false,
                    potentialWinnings: 92.5
                }],
                actionBet: []
            },
            powerUp: {
                held: { type: '2x_multiplier' },
                applied: false
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const result = bettingManager.applyPowerUp('bet_1');
        
        expect(result.success).toBeTruthy();
        
        const state = stateManager.getState();
        const bet = state.bets.fullMatch[0];
        expect(bet.powerUpApplied).toBeTruthy();
        expect(bet.potentialWinnings).toBe(185); // 92.5 * 2
        expect(state.powerUp.held).toBe(null);
        expect(state.powerUp.applied).toBeTruthy();
    });

    // Test: Power-up application without power-up
    test('should reject power-up application when no power-up held', () => {
        const stateManager = new MockStateManager({
            wallet: 1000,
            bets: {
                fullMatch: [{
                    id: 'bet_1',
                    type: 'fullMatch',
                    outcome: 'home',
                    stake: 50,
                    odds: 1.85,
                    status: 'pending',
                    powerUpApplied: false
                }],
                actionBet: []
            },
            powerUp: {
                held: null,
                applied: false
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const result = bettingManager.applyPowerUp('bet_1');
        
        expect(result.success).toBeFalsy();
        expect(result.error).toContain('No power-up available');
    });

    // Test: Bet resolution
    test('should resolve bets correctly', () => {
        const stateManager = new MockStateManager({
            wallet: 900, // After placing bets
            bets: {
                fullMatch: [
                    {
                        id: 'bet_1',
                        outcome: 'home',
                        stake: 50,
                        odds: 1.85,
                        status: 'pending',
                        powerUpApplied: false
                    },
                    {
                        id: 'bet_2',
                        outcome: 'away',
                        stake: 50,
                        odds: 4.2,
                        status: 'pending',
                        powerUpApplied: false
                    }
                ],
                actionBet: []
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const result = bettingManager.resolveBets('home', 'fullMatch');
        
        expect(result.success).toBeTruthy();
        expect(result.totalWinnings).toBe(92.5); // Only bet_1 wins
        expect(result.resolvedBets).toBe(2);
        expect(stateManager.getState().wallet).toBe(992.5); // 900 + 92.5
        
        const state = stateManager.getState();
        expect(state.bets.fullMatch[0].status).toBe('won');
        expect(state.bets.fullMatch[1].status).toBe('lost');
    });

    // Test: Action bet resolution by event ID
    test('should resolve action bets by event ID', () => {
        const stateManager = new MockStateManager({
            wallet: 950,
            bets: {
                fullMatch: [],
                actionBet: [
                    {
                        id: 'bet_1',
                        outcome: 'goal',
                        stake: 25,
                        odds: 2.5,
                        status: 'pending',
                        eventId: 'event_123',
                        powerUpApplied: false
                    },
                    {
                        id: 'bet_2',
                        outcome: 'card',
                        stake: 25,
                        odds: 3.0,
                        status: 'pending',
                        eventId: 'event_456',
                        powerUpApplied: false
                    }
                ]
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const result = bettingManager.resolveBets('goal', 'actionBet', 'event_123');
        
        expect(result.success).toBeTruthy();
        expect(result.totalWinnings).toBe(62.5); // Only bet_1 wins
        expect(result.resolvedBets).toBe(1); // Only one bet resolved
        
        const state = stateManager.getState();
        expect(state.bets.actionBet[0].status).toBe('won');
        expect(state.bets.actionBet[1].status).toBe('pending'); // Not resolved
    });

    // Test: Multiple bets on same outcome
    test('should handle multiple bets on same outcome', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        // Place multiple bets on home win
        const betData1 = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 25,
            odds: 1.85
        };

        const betData2 = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        };

        const result1 = bettingManager.placeBet(betData1);
        const result2 = bettingManager.placeBet(betData2);
        
        expect(result1.success).toBeTruthy();
        expect(result2.success).toBeTruthy();
        expect(stateManager.getState().bets.fullMatch.length).toBe(2);
        expect(stateManager.getState().wallet).toBe(925); // 1000 - 25 - 50
    });

    // Test: Bet statistics
    test('should calculate bet statistics correctly', () => {
        const stateManager = new MockStateManager({
            wallet: 1000,
            bets: {
                fullMatch: [
                    {
                        id: 'bet_1',
                        stake: 50,
                        status: 'won',
                        actualWinnings: 92.5
                    },
                    {
                        id: 'bet_2',
                        stake: 25,
                        status: 'lost'
                    },
                    {
                        id: 'bet_3',
                        stake: 30,
                        status: 'pending'
                    }
                ],
                actionBet: [
                    {
                        id: 'bet_4',
                        stake: 20,
                        status: 'won',
                        actualWinnings: 50
                    }
                ]
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const stats = bettingManager.getBetStatistics();
        
        expect(stats.totalBets).toBe(4);
        expect(stats.totalStaked).toBe(125); // 50 + 25 + 30 + 20
        expect(stats.totalWinnings).toBe(142.5); // 92.5 + 50
        expect(stats.pendingBets).toBe(1);
        expect(stats.wonBets).toBe(2);
        expect(stats.lostBets).toBe(1);
        expect(stats.netProfit).toBe(17.5); // 142.5 - 125
        expect(stats.winRate).toBe('66.7'); // 2/3 * 100
    });

    // Test: Bet cancellation
    test('should cancel pending bet and refund stake', () => {
        const stateManager = new MockStateManager({
            wallet: 950,
            bets: {
                fullMatch: [{
                    id: 'bet_1',
                    stake: 50,
                    status: 'pending'
                }],
                actionBet: []
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const result = bettingManager.cancelBet('bet_1');
        
        expect(result.success).toBeTruthy();
        expect(result.refundedAmount).toBe(50);
        expect(stateManager.getState().wallet).toBe(1000);
        expect(stateManager.getState().bets.fullMatch.length).toBe(0);
    });

    // Test: Edge case - bet amount validation
    test('should validate bet amounts correctly', () => {
        const stateManager = new MockStateManager();
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        expect(bettingManager.validateBetAmount(50, 1000)).toBeTruthy();
        expect(bettingManager.validateBetAmount(1000, 1000)).toBeTruthy();
        expect(bettingManager.validateBetAmount(1001, 1000)).toBeFalsy();
        expect(bettingManager.validateBetAmount(0, 1000)).toBeFalsy();
        expect(bettingManager.validateBetAmount(-10, 1000)).toBeFalsy();
        expect(bettingManager.validateBetAmount(0.5, 1000)).toBeFalsy();
    });

    // Test: Get pending bets
    test('should get pending bets correctly', () => {
        const stateManager = new MockStateManager({
            wallet: 1000,
            bets: {
                fullMatch: [
                    { id: 'bet_1', status: 'pending' },
                    { id: 'bet_2', status: 'won' },
                    { id: 'bet_3', status: 'pending' }
                ],
                actionBet: [
                    { id: 'bet_4', status: 'pending' },
                    { id: 'bet_5', status: 'lost' }
                ]
            }
        });
        
        const powerUpManager = new MockPowerUpManager();
        const bettingManager = new BettingManager(stateManager, powerUpManager);

        const allPending = bettingManager.getPendingBets();
        expect(allPending.length).toBe(3);

        const fullMatchPending = bettingManager.getPendingBets('fullMatch');
        expect(fullMatchPending.length).toBe(2);

        const actionBetPending = bettingManager.getPendingBets('actionBet');
        expect(actionBetPending.length).toBe(1);
    });

    // Run all tests
    console.log('Running BettingManager Tests...\n');

    for (const { name, testFn } of tests) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failedTests++;
        }
    }

    console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed`);
    
    if (failedTests === 0) {
        console.log('🎉 All tests passed!');
    }

    return { passed: passedTests, failed: failedTests };
}

// Export for use in other test files
export { runTests, MockStateManager, MockPowerUpManager };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    runTests();
}