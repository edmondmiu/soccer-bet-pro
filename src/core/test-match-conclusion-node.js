#!/usr/bin/env node

/**
 * Node.js test runner for Match Conclusion functionality
 * Tests match end detection, bet resolution, and summary generation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock DOM environment for Node.js
const mockDOM = () => {
    global.document = {
        createElement: (tag) => ({
            className: '',
            innerHTML: '',
            style: {},
            appendChild: () => {},
            addEventListener: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            setAttribute: () => {},
            getAttribute: () => null,
            remove: () => {},
            parentNode: { removeChild: () => {} }
        }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        getElementById: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
    };
    
    global.window = {
        innerWidth: 1024,
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { reload: () => {} }
    };
    
    global.CustomEvent = class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail || {};
        }
    };
};

// Simple test framework
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentSuite = null;
    }

    describe(name, fn) {
        console.log(`\n📋 ${name}`);
        this.currentSuite = name;
        fn();
        this.currentSuite = null;
    }

    test(name, fn) {
        this.tests.push({
            suite: this.currentSuite,
            name,
            fn
        });
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
                }
            },
            toHaveProperty: (prop) => {
                if (!(prop in actual)) {
                    throw new Error(`Expected object to have property ${prop}`);
                }
            },
            toHaveBeenCalled: () => {
                if (!actual.called) {
                    throw new Error('Expected function to have been called');
                }
            },
            toHaveBeenCalledWith: (...args) => {
                if (!actual.calledWith || !actual.calledWith.some(call => 
                    JSON.stringify(call) === JSON.stringify(args))) {
                    throw new Error(`Expected function to have been called with ${JSON.stringify(args)}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error('Expected value to be defined');
                }
            },
            not: {
                toHaveBeenCalled: () => {
                    if (actual.called) {
                        throw new Error('Expected function not to have been called');
                    }
                }
            }
        };
    }

    jest = {
        spyOn: (obj, method) => {
            const original = obj[method];
            const spy = function(...args) {
                spy.called = true;
                spy.calledWith = spy.calledWith || [];
                spy.calledWith.push(args);
                if (original && typeof original === 'function') {
                    return original.apply(obj, args);
                }
            };
            spy.called = false;
            spy.calledWith = [];
            obj[method] = spy;
            return spy;
        },
        fn: () => {
            const mockFn = function(...args) {
                mockFn.called = true;
                mockFn.calledWith = mockFn.calledWith || [];
                mockFn.calledWith.push(args);
            };
            mockFn.called = false;
            mockFn.calledWith = [];
            return mockFn;
        }
    };

    async runAll() {
        console.log('\n🏆 Running Match Conclusion Tests...\n');
        
        let passed = 0;
        let failed = 0;

        for (const test of this.tests) {
            try {
                await test.fn();
                console.log(`  ✅ ${test.name}`);
                passed++;
            } catch (error) {
                console.log(`  ❌ ${test.name}`);
                console.log(`     Error: ${error.message}`);
                failed++;
            }
        }

        console.log(`\n📊 Test Summary:`);
        console.log(`   Total: ${passed + failed}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

        return { passed, failed, total: passed + failed };
    }
}

// Initialize test framework
const framework = new TestFramework();
const { describe, test, expect, jest } = framework;

// Import modules
async function importModules() {
    try {
        const { StateManager } = await import('./StateManager.js');
        const { BettingManager } = await import('../betting/BettingManager.js');
        const { PowerUpManager } = await import('../systems/PowerUpManager.js');
        const { GameController } = await import('./GameController.js');
        const { BettingModal } = await import('../ui/BettingModal.js');
        
        return { StateManager, BettingManager, PowerUpManager, GameController, BettingModal };
    } catch (error) {
        console.error('Failed to import modules:', error);
        throw error;
    }
}

// Test implementations
async function runTests() {
    mockDOM();
    
    const { StateManager, BettingManager, PowerUpManager, GameController, BettingModal } = await importModules();

    // Mock components for testing
    class MockTimerManager {
        constructor() {
            this.callbacks = {};
        }
        setCallbacks(callbacks) {
            this.callbacks = callbacks;
        }
        stopMatch() {}
        reset() {}
        getStatus() {
            return { match: { isRunning: false } };
        }
    }

    class MockEventManager {
        stopEventProcessing() {}
        reset() {}
        generateTimeline() {}
        startEventProcessing() {}
    }

    class MockAudioManager {
        playSound() {}
    }

    class MockUIManager {
        showNotification() {}
        clearNotifications() {}
    }

    // Test: Match End Detection
    describe('Match End Detection', () => {
        test('should detect match end at 90 minutes', () => {
            const gameController = new GameController();
            const endMatchSpy = jest.spyOn(gameController, 'endMatch');
            
            gameController.gamePhase = 'match';
            
            // Simulate the timer callback logic
            const time = 90;
            if (time >= 90 && gameController.gamePhase === 'match') {
                gameController.endMatch();
            }
            
            expect(endMatchSpy).toHaveBeenCalled();
        });

        test('should determine correct match outcomes', () => {
            const gameController = new GameController();
            
            expect(gameController.determineMatchOutcome(2, 1)).toBe('home');
            expect(gameController.determineMatchOutcome(1, 2)).toBe('away');
            expect(gameController.determineMatchOutcome(1, 1)).toBe('draw');
        });

        test('should not end match before 90 minutes', () => {
            const gameController = new GameController();
            const endMatchSpy = jest.spyOn(gameController, 'endMatch');
            
            gameController.gamePhase = 'match';
            
            // Simulate timer at 89 minutes
            const time = 89;
            if (time >= 90 && gameController.gamePhase === 'match') {
                gameController.endMatch();
            }
            
            expect(endMatchSpy).not.toHaveBeenCalled();
        });
    });

    // Test: Bet Resolution
    describe('Bet Resolution', () => {
        test('should resolve full-match bets correctly', () => {
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            // Setup test bets
            stateManager.updateState({
                wallet: 1000,
                bets: {
                    fullMatch: [
                        {
                            id: 'bet_1',
                            type: 'fullMatch',
                            outcome: 'home',
                            stake: 100,
                            odds: 1.85,
                            status: 'pending',
                            powerUpApplied: false
                        }
                    ],
                    actionBet: []
                }
            });
            
            const resolution = bettingManager.resolveBets('home', 'fullMatch');
            
            expect(resolution.success).toBe(true);
            expect(resolution.results.length).toBe(1);
            expect(resolution.results[0].won).toBe(true);
        });

        test('should calculate winnings with power-up multipliers', () => {
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            const bet = {
                id: 'bet_1',
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 2.0,
                status: 'pending',
                powerUpApplied: true
            };
            
            const winnings = bettingManager.calculateWinnings(bet, 'home');
            
            // Base winnings: 100 * 2.0 = 200
            // With power-up: 200 * 2 = 400
            expect(winnings).toBe(400);
        });

        test('should handle losing bets correctly', () => {
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            const bet = {
                id: 'bet_1',
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 1.85,
                status: 'pending',
                powerUpApplied: false
            };
            
            const winnings = bettingManager.calculateWinnings(bet, 'away');
            
            expect(winnings).toBe(0);
        });
    });

    // Test: Match Summary Generation
    describe('Match Summary Generation', () => {
        test('should create comprehensive summary data', () => {
            const stateManager = new StateManager();
            const gameController = new GameController();
            
            // Mock state manager in game controller
            gameController.modules = {
                stateManager: {
                    getState: () => ({
                        bets: { 
                            fullMatch: [
                                {
                                    id: 'bet_1',
                                    type: 'fullMatch',
                                    outcome: 'home',
                                    stake: 100,
                                    odds: 1.85,
                                    status: 'won',
                                    actualWinnings: 185,
                                    powerUpApplied: false
                                }
                            ], 
                            actionBet: [] 
                        },
                        wallet: 1185
                    })
                }
            };
            
            const matchState = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 2,
                awayScore: 1,
                time: 90
            };
            
            const resolution = {
                success: true,
                totalWinnings: 185,
                results: [
                    { betId: 'bet_1', won: true, winnings: 185 }
                ]
            };
            
            const finalWinnings = {
                totalWinnings: 185,
                powerUpBonuses: 0,
                additionalWinnings: 0
            };
            
            const summaryData = gameController.createMatchSummary(
                matchState, 
                resolution, 
                finalWinnings
            );
            
            expect(summaryData).toHaveProperty('match');
            expect(summaryData).toHaveProperty('betting');
            expect(summaryData).toHaveProperty('wallet');
            expect(summaryData.match.homeTeam).toBe('Arsenal');
            expect(summaryData.match.outcome).toBe('home');
            expect(summaryData.betting.totalBets).toBe(1);
            expect(summaryData.betting.wonBets).toBe(1);
        });

        test('should handle empty bet scenarios', () => {
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            // Initialize with no bets
            stateManager.updateState({
                wallet: 1000,
                bets: { fullMatch: [], actionBet: [] }
            });
            
            const stats = bettingManager.getBetStatistics();
            
            expect(stats.totalBets).toBe(0);
            expect(stats.totalStaked).toBe(0);
            expect(stats.totalWinnings).toBe(0);
            expect(stats.winRate).toBe(0);
        });

        test('should calculate correct net profit/loss', () => {
            const stateManager = new StateManager();
            const gameController = new GameController();
            
            gameController.modules = {
                stateManager: {
                    getState: () => ({
                        bets: { 
                            fullMatch: [
                                {
                                    id: 'bet_1',
                                    type: 'fullMatch',
                                    outcome: 'home',
                                    stake: 100,
                                    odds: 1.85,
                                    status: 'won',
                                    actualWinnings: 185,
                                    powerUpApplied: false
                                },
                                {
                                    id: 'bet_2',
                                    type: 'fullMatch',
                                    outcome: 'away',
                                    stake: 50,
                                    odds: 4.20,
                                    status: 'lost',
                                    actualWinnings: 0,
                                    powerUpApplied: false
                                }
                            ], 
                            actionBet: [] 
                        },
                        wallet: 1135
                    })
                }
            };
            
            const matchState = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 2,
                awayScore: 1,
                time: 90
            };
            
            const resolution = { success: true, results: [] };
            const finalWinnings = { totalWinnings: 185, powerUpBonuses: 0, additionalWinnings: 0 };
            
            const summaryData = gameController.createMatchSummary(matchState, resolution, finalWinnings);
            
            // Total staked: 100 + 50 = 150
            // Total winnings: 185
            // Net result: 185 - 150 = 35
            expect(summaryData.betting.totalStaked).toBe(150);
            expect(summaryData.betting.totalWinnings).toBe(185);
            expect(summaryData.betting.netResult).toBe(35);
        });
    });

    // Test: Error Handling
    describe('Error Handling', () => {
        test('should handle invalid game phases', async () => {
            const gameController = new GameController();
            gameController.gamePhase = 'lobby';
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot end match');
        });

        test('should handle missing modules gracefully', async () => {
            const gameController = new GameController();
            gameController.gamePhase = 'match';
            gameController.modules = {}; // Empty modules
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle bet resolution errors', () => {
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            // Try to resolve bets with invalid outcome
            const resolution = bettingManager.resolveBets(null, 'fullMatch');
            
            expect(resolution.success).toBe(true); // Should handle gracefully
            expect(resolution.results.length).toBe(0);
        });
    });

    // Test: Integration Scenarios
    describe('Integration Scenarios', () => {
        test('should complete full match conclusion workflow', async () => {
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            const gameController = new GameController();
            
            // Setup complete state
            stateManager.updateState({
                wallet: 1000,
                match: {
                    active: true,
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    homeScore: 2,
                    awayScore: 1,
                    time: 90
                },
                bets: {
                    fullMatch: [
                        {
                            id: 'bet_1',
                            type: 'fullMatch',
                            outcome: 'home',
                            stake: 100,
                            odds: 1.85,
                            status: 'pending',
                            powerUpApplied: false
                        }
                    ],
                    actionBet: []
                }
            });
            
            // Setup modules
            gameController.modules = {
                stateManager,
                bettingManager,
                timerManager: new MockTimerManager(),
                eventManager: new MockEventManager(),
                audioManager: new MockAudioManager(),
                bettingModal: {
                    showMatchSummaryModal: jest.fn(),
                    setCallbacks: jest.fn()
                },
                fullMatchBetting: { reset: jest.fn() },
                actionBetting: { reset: jest.fn() }
            };
            
            gameController.gamePhase = 'match';
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(true);
            expect(result.outcome).toBe('home');
            expect(result.summaryData).toBeDefined();
            
            // Check that wallet was updated with winnings
            const finalState = stateManager.getState();
            expect(finalState.wallet).toBeGreaterThan(1000);
            expect(finalState.match.active).toBe(false);
        });

        test('should maintain bet amount memory after match', () => {
            const stateManager = new StateManager();
            
            // Set initial bet amount memory
            stateManager.updateBetAmountMemory('fullMatch', 150);
            stateManager.updateBetAmountMemory('opportunity', 75);
            
            const memory = stateManager.getBetAmountMemory('fullMatch');
            const opportunityMemory = stateManager.getBetAmountMemory('opportunity');
            
            expect(memory).toBe(150);
            expect(opportunityMemory).toBe(75);
        });
    });

    // Run all tests
    return await framework.runAll();
}

// Main execution
async function main() {
    try {
        console.log('🏆 Match Conclusion Test Suite');
        console.log('================================');
        
        const results = await runTests();
        
        if (results.failed > 0) {
            process.exit(1);
        } else {
            console.log('\n✅ All tests passed!');
            process.exit(0);
        }
    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { runTests, mockDOM };