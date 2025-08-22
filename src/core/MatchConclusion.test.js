/**
 * Test suite for Match Conclusion and Summary functionality
 * Tests match end detection, bet resolution, and summary generation
 */

import { GameController } from './GameController.js';
import { StateManager } from './StateManager.js';
import { BettingManager } from '../betting/BettingManager.js';
import { TimerManager } from '../systems/TimerManager.js';
import { PowerUpManager } from '../systems/PowerUpManager.js';
import { BettingModal } from '../ui/BettingModal.js';

// Mock DOM environment for testing
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
            remove: () => {}
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
        removeEventListener: () => {}
    };
    
    global.CustomEvent = class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail || {};
        }
    };
};

describe('Match Conclusion and Summary', () => {
    let gameController;
    let stateManager;
    let bettingManager;
    let timerManager;
    let powerUpManager;
    let bettingModal;

    beforeEach(() => {
        mockDOM();
        
        // Initialize components
        stateManager = new StateManager();
        powerUpManager = new PowerUpManager(stateManager);
        bettingManager = new BettingManager(stateManager, powerUpManager);
        timerManager = new TimerManager();
        bettingModal = new BettingModal(stateManager);
        
        gameController = new GameController();
        
        // Initialize state with test data
        stateManager.updateState({
            wallet: 1000,
            match: {
                active: true,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 2,
                awayScore: 1,
                time: 89,
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
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
                        powerUpApplied: false,
                        placedAt: Date.now() - 5000
                    },
                    {
                        id: 'bet_2',
                        type: 'fullMatch',
                        outcome: 'draw',
                        stake: 50,
                        odds: 3.50,
                        status: 'pending',
                        powerUpApplied: true,
                        placedAt: Date.now() - 3000
                    }
                ],
                actionBet: [
                    {
                        id: 'bet_3',
                        type: 'actionBet',
                        outcome: 'goal_scored',
                        stake: 25,
                        odds: 2.50,
                        status: 'won',
                        actualWinnings: 62.50,
                        powerUpApplied: false,
                        placedAt: Date.now() - 10000,
                        resolvedAt: Date.now() - 5000
                    }
                ]
            }
        });
    });

    afterEach(() => {
        if (gameController && gameController.destroy) {
            gameController.destroy();
        }
    });

    describe('Match End Detection', () => {
        test('should detect match end at 90 minutes', () => {
            const endMatchSpy = jest.spyOn(gameController, 'endMatch');
            
            // Set game phase to match
            gameController.gamePhase = 'match';
            
            // Simulate timer callback at 90 minutes
            const timerCallback = gameController.modules?.timerManager?.callbacks?.onMatchTimeUpdate;
            if (timerCallback) {
                timerCallback(90);
            }
            
            expect(endMatchSpy).toHaveBeenCalled();
        });

        test('should not end match before 90 minutes', () => {
            const endMatchSpy = jest.spyOn(gameController, 'endMatch');
            
            gameController.gamePhase = 'match';
            
            // Simulate timer callback at 89 minutes
            const timerCallback = gameController.modules?.timerManager?.callbacks?.onMatchTimeUpdate;
            if (timerCallback) {
                timerCallback(89);
            }
            
            expect(endMatchSpy).not.toHaveBeenCalled();
        });

        test('should not end match if not in match phase', () => {
            const endMatchSpy = jest.spyOn(gameController, 'endMatch');
            
            gameController.gamePhase = 'lobby';
            
            // Simulate timer callback at 90 minutes
            const timerCallback = gameController.modules?.timerManager?.callbacks?.onMatchTimeUpdate;
            if (timerCallback) {
                timerCallback(90);
            }
            
            expect(endMatchSpy).not.toHaveBeenCalled();
        });
    });

    describe('Full-Match Bet Resolution', () => {
        test('should resolve full-match bets based on final score', () => {
            const resolveBetsSpy = jest.spyOn(bettingManager, 'resolveBets');
            
            // Mock the endMatch method to test bet resolution
            gameController.modules = {
                stateManager,
                bettingManager,
                timerManager,
                eventManager: { stopEventProcessing: jest.fn() },
                audioManager: { playSound: jest.fn() },
                bettingModal: { showMatchSummaryModal: jest.fn() }
            };
            
            gameController.gamePhase = 'match';
            
            // End the match
            gameController.endMatch();
            
            expect(resolveBetsSpy).toHaveBeenCalledWith('home', 'fullMatch');
        });

        test('should calculate correct match outcome from scores', () => {
            // Test home win
            expect(gameController.determineMatchOutcome(2, 1)).toBe('home');
            
            // Test away win
            expect(gameController.determineMatchOutcome(1, 2)).toBe('away');
            
            // Test draw
            expect(gameController.determineMatchOutcome(1, 1)).toBe('draw');
        });

        test('should handle power-up multipliers in winnings calculation', () => {
            const resolution = {
                success: true,
                results: [
                    { betId: 'bet_1', won: true, winnings: 185 },
                    { betId: 'bet_2', won: false, winnings: 0 }
                ]
            };
            
            const finalWinnings = gameController.calculateFinalWinnings(resolution);
            
            expect(finalWinnings).toHaveProperty('totalWinnings');
            expect(finalWinnings).toHaveProperty('powerUpBonuses');
            expect(finalWinnings.totalWinnings).toBe(185);
        });
    });

    describe('Match Summary Generation', () => {
        test('should create comprehensive match summary data', () => {
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
            
            const finalWinnings = { totalWinnings: 185, powerUpBonuses: 0, additionalWinnings: 0 };
            
            const summaryData = gameController.createMatchSummary(matchState, resolution, finalWinnings);
            
            expect(summaryData).toHaveProperty('match');
            expect(summaryData).toHaveProperty('betting');
            expect(summaryData).toHaveProperty('bets');
            expect(summaryData).toHaveProperty('powerUps');
            expect(summaryData).toHaveProperty('wallet');
            
            expect(summaryData.match.homeTeam).toBe('Arsenal');
            expect(summaryData.match.awayTeam).toBe('Chelsea');
            expect(summaryData.match.outcome).toBe('home');
            
            expect(summaryData.betting.totalBets).toBe(3); // 2 full-match + 1 action bet
            expect(summaryData.betting.wonBets).toBe(1); // Only the resolved action bet
        });

        test('should calculate correct betting statistics', () => {
            const stats = bettingManager.getBetStatistics();
            
            expect(stats.totalBets).toBe(3);
            expect(stats.totalStaked).toBe(175); // 100 + 50 + 25
            expect(stats.totalWinnings).toBe(62.50); // Only the won action bet
            expect(stats.wonBets).toBe(1);
            expect(stats.lostBets).toBe(0);
            expect(stats.pendingBets).toBe(2);
        });

        test('should handle wallet balance updates correctly', () => {
            const initialWallet = stateManager.getState().wallet;
            
            // Simulate bet resolution with winnings
            const resolution = bettingManager.resolveBets('home', 'fullMatch');
            
            const finalWallet = stateManager.getState().wallet;
            
            // Wallet should increase by winnings from winning bets
            expect(finalWallet).toBeGreaterThan(initialWallet);
        });
    });

    describe('Match Summary Modal', () => {
        test('should display match summary modal with correct data', () => {
            const showModalSpy = jest.spyOn(bettingModal, 'showMatchSummaryModal');
            
            const summaryData = {
                match: {
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    homeScore: 2,
                    awayScore: 1,
                    outcome: 'home'
                },
                betting: {
                    totalBets: 3,
                    wonBets: 2,
                    totalStaked: 175,
                    totalWinnings: 247.50,
                    netResult: 72.50,
                    winRate: 66.7
                },
                bets: [],
                powerUps: { applied: 1, bonuses: 50 },
                wallet: { final: 1072.50, starting: 1000, change: 72.50 }
            };
            
            bettingModal.showMatchSummaryModal(summaryData);
            
            expect(showModalSpy).toHaveBeenCalledWith(summaryData);
        });

        test('should handle return to lobby from summary modal', () => {
            const updateStateSpy = jest.spyOn(stateManager, 'updateState');
            
            // Create a mock modal element
            const mockModal = {
                querySelector: (selector) => {
                    if (selector === '#return-to-lobby' || selector === '.modal-close') {
                        return {
                            addEventListener: (event, callback) => {
                                if (event === 'click') {
                                    // Simulate click
                                    callback();
                                }
                            }
                        };
                    }
                    return null;
                }
            };
            
            bettingModal.setupMatchSummaryListeners(mockModal);
            
            expect(updateStateSpy).toHaveBeenCalledWith({ currentScreen: 'lobby' });
        });

        test('should format bet outcome labels correctly', () => {
            const fullMatchBet = {
                type: 'fullMatch',
                outcome: 'home'
            };
            
            const actionBet = {
                type: 'actionBet',
                outcome: 'goal_scored'
            };
            
            // Mock state for team names
            stateManager.updateState({
                match: {
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea'
                }
            });
            
            const homeLabel = bettingModal.getBetOutcomeLabel(fullMatchBet);
            const actionLabel = bettingModal.getBetOutcomeLabel(actionBet);
            
            expect(homeLabel).toBe('Arsenal Win');
            expect(actionLabel).toBe('goal_scored');
        });
    });

    describe('Error Handling', () => {
        test('should handle match end errors gracefully', async () => {
            // Mock a failing component
            gameController.modules = {
                timerManager: { stopMatch: jest.fn() },
                eventManager: { stopEventProcessing: jest.fn(() => { throw new Error('Test error'); }) },
                stateManager,
                bettingManager,
                audioManager: { playSound: jest.fn() },
                bettingModal: { showMatchSummaryModal: jest.fn() }
            };
            
            gameController.gamePhase = 'match';
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should prevent match end in invalid phases', async () => {
            gameController.gamePhase = 'lobby';
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot end match');
        });

        test('should handle missing bet data in summary', () => {
            // Test with empty bets
            stateManager.updateState({
                bets: { fullMatch: [], actionBet: [] }
            });
            
            const matchState = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 0,
                awayScore: 0,
                time: 90
            };
            
            const resolution = { success: true, results: [] };
            const finalWinnings = { totalWinnings: 0, powerUpBonuses: 0, additionalWinnings: 0 };
            
            const summaryData = gameController.createMatchSummary(matchState, resolution, finalWinnings);
            
            expect(summaryData.betting.totalBets).toBe(0);
            expect(summaryData.betting.totalStaked).toBe(0);
            expect(summaryData.betting.totalWinnings).toBe(0);
        });
    });

    describe('Integration Tests', () => {
        test('should complete full match conclusion workflow', async () => {
            // Setup complete game controller with all modules
            gameController.modules = {
                stateManager,
                bettingManager,
                timerManager,
                eventManager: { 
                    stopEventProcessing: jest.fn(),
                    reset: jest.fn()
                },
                audioManager: { playSound: jest.fn() },
                bettingModal: { 
                    showMatchSummaryModal: jest.fn(),
                    setCallbacks: jest.fn()
                },
                fullMatchBetting: { reset: jest.fn() },
                actionBetting: { reset: jest.fn() }
            };
            
            gameController.gamePhase = 'match';
            
            // End the match
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(true);
            expect(result.outcome).toBe('home'); // Arsenal wins 2-1
            expect(result.summaryData).toBeDefined();
            
            // Verify all cleanup was performed
            expect(gameController.modules.timerManager.stopMatch).toHaveBeenCalled();
            expect(gameController.modules.eventManager.stopEventProcessing).toHaveBeenCalled();
            expect(gameController.modules.bettingModal.showMatchSummaryModal).toHaveBeenCalled();
        });

        test('should maintain state consistency throughout match conclusion', async () => {
            const initialState = stateManager.getState();
            
            gameController.modules = {
                stateManager,
                bettingManager,
                timerManager,
                eventManager: { stopEventProcessing: jest.fn() },
                audioManager: { playSound: jest.fn() },
                bettingModal: { showMatchSummaryModal: jest.fn() }
            };
            
            gameController.gamePhase = 'match';
            
            await gameController.endMatch();
            
            const finalState = stateManager.getState();
            
            // Match should be marked as inactive
            expect(finalState.match.active).toBe(false);
            
            // Wallet should be updated with winnings
            expect(finalState.wallet).toBeGreaterThanOrEqual(initialState.wallet);
            
            // Bets should be resolved
            const allBets = [...finalState.bets.fullMatch, ...finalState.bets.actionBet];
            const pendingBets = allBets.filter(bet => bet.status === 'pending');
            
            // Only action bets should remain pending (they resolve separately)
            expect(pendingBets.every(bet => bet.type === 'actionBet')).toBe(true);
        });
    });
});

// Export test utilities for other test files
export const testUtils = {
    mockDOM,
    createMockGameController: () => {
        mockDOM();
        const stateManager = new StateManager();
        const gameController = new GameController();
        return { gameController, stateManager };
    },
    
    createTestMatchState: (overrides = {}) => ({
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 2,
        awayScore: 1,
        time: 90,
        active: true,
        odds: { home: 1.85, draw: 3.50, away: 4.20 },
        ...overrides
    }),
    
    createTestBets: () => [
        {
            id: 'bet_1',
            type: 'fullMatch',
            outcome: 'home',
            stake: 100,
            odds: 1.85,
            status: 'pending',
            powerUpApplied: false
        },
        {
            id: 'bet_2',
            type: 'actionBet',
            outcome: 'goal_scored',
            stake: 25,
            odds: 2.50,
            status: 'won',
            actualWinnings: 62.50,
            powerUpApplied: false
        }
    ]
};