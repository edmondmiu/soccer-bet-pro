/**
 * GameController Integration Tests
 * Tests the complete game flow orchestration and module coordination
 */

import { GameController } from './GameController.js';

// Mock DOM environment for testing
const mockDOM = () => {
    global.document = {
        createElement: (tag) => ({
            id: '',
            className: '',
            innerHTML: '',
            textContent: '',
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false
            },
            appendChild: () => {},
            removeChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            removeEventListener: () => {},
            setAttribute: () => {},
            dataset: {}
        }),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
        head: { appendChild: () => {} },
        body: { appendChild: () => {} }
    };
    
    global.window = {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { reload: () => {} }
    };
    
    global.CustomEvent = class CustomEvent {
        constructor(type, options = {}) {
            this.type = type;
            this.detail = options.detail || {};
        }
    };
};

describe('GameController', () => {
    let gameController;
    
    beforeEach(() => {
        mockDOM();
        gameController = new GameController();
    });
    
    afterEach(() => {
        if (gameController) {
            gameController.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            const result = await gameController.initialize();
            
            expect(result.success).toBe(true);
            expect(gameController.isInitialized).toBe(true);
            expect(gameController.gamePhase).toBe('lobby');
        });

        test('should initialize all required modules', async () => {
            await gameController.initialize();
            
            const expectedModules = [
                'stateManager',
                'timerManager',
                'audioManager',
                'powerUpManager',
                'oddsCalculator',
                'bettingManager',
                'eventManager',
                'fullMatchBetting',
                'actionBetting',
                'uiManager',
                'lobbyScreen',
                'matchScreen',
                'bettingModal'
            ];
            
            expectedModules.forEach(moduleName => {
                expect(gameController.modules[moduleName]).toBeDefined();
            });
        });

        test('should handle initialization errors gracefully', async () => {
            // Mock a module initialization failure
            const originalStateManager = gameController.modules.stateManager;
            gameController.modules.stateManager = null;
            
            const result = await gameController.initialize();
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Match Lifecycle Management', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should start match successfully', async () => {
            const matchData = {
                homeTeam: 'Team A',
                awayTeam: 'Team B',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            
            const result = await gameController.startMatch(matchData);
            
            expect(result.success).toBe(true);
            expect(gameController.gamePhase).toBe('match');
            expect(gameController.currentMatch).toEqual(matchData);
            
            const state = gameController.modules.stateManager.getState();
            expect(state.match.active).toBe(true);
            expect(state.match.homeTeam).toBe('Team A');
            expect(state.match.awayTeam).toBe('Team B');
        });

        test('should not start match if not in lobby phase', async () => {
            gameController.gamePhase = 'match';
            
            const matchData = {
                homeTeam: 'Team A',
                awayTeam: 'Team B'
            };
            
            const result = await gameController.startMatch(matchData);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('not in lobby phase');
        });

        test('should pause match for action betting', () => {
            gameController.gamePhase = 'match';
            
            const eventData = {
                id: 'event_1',
                description: 'Test action betting event',
                choices: [
                    { outcome: 'choice1', odds: 2.0, description: 'Choice 1' }
                ]
            };
            
            const result = gameController.pauseForActionBet(eventData);
            
            expect(result.success).toBe(true);
            expect(gameController.gamePhase).toBe('paused');
        });

        test('should resume match after pause', () => {
            gameController.gamePhase = 'paused';
            
            const result = gameController.resumeMatch();
            
            expect(result.success).toBe(true);
            expect(gameController.gamePhase).toBe('match');
        });

        test('should end match successfully', async () => {
            gameController.gamePhase = 'match';
            
            // Set up match state
            gameController.modules.stateManager.updateState({
                match: {
                    active: true,
                    homeScore: 2,
                    awayScore: 1
                }
            });
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(true);
            expect(result.outcome).toBe('home');
            expect(gameController.gamePhase).toBe('ended');
        });

        test('should return to lobby successfully', () => {
            gameController.gamePhase = 'match';
            gameController.currentMatch = { homeTeam: 'A', awayTeam: 'B' };
            
            const result = gameController.returnToLobby();
            
            expect(result.success).toBe(true);
            expect(gameController.gamePhase).toBe('lobby');
            expect(gameController.currentMatch).toBeNull();
        });
    });

    describe('Betting Integration', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should place bet successfully', async () => {
            const betData = {
                type: 'fullMatch',
                outcome: 'home',
                stake: 25,
                odds: 1.85
            };
            
            const result = await gameController.placeBet(betData);
            
            expect(result.success).toBe(true);
            expect(result.bet).toBeDefined();
            expect(result.bet.stake).toBe(25);
            expect(result.bet.outcome).toBe('home');
        });

        test('should handle bet placement errors', async () => {
            const betData = {
                type: 'fullMatch',
                outcome: 'home',
                stake: 2000, // More than wallet balance
                odds: 1.85
            };
            
            const result = await gameController.placeBet(betData);
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should update bet amount memory after successful bet', async () => {
            const betData = {
                type: 'fullMatch',
                outcome: 'home',
                stake: 50,
                odds: 1.85
            };
            
            await gameController.placeBet(betData);
            
            const memory = gameController.modules.stateManager.getBetAmountMemory('fullMatch');
            expect(memory).toBe(50);
        });
    });

    describe('Event Handling', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should handle action betting opportunity', () => {
            gameController.gamePhase = 'match';
            
            const eventData = {
                eventData: {
                    id: 'event_1',
                    description: 'Test event',
                    choices: []
                }
            };
            
            // Should not throw error
            expect(() => {
                gameController.handleActionBettingOpportunity(eventData);
            }).not.toThrow();
            
            expect(gameController.gamePhase).toBe('paused');
        });

        test('should handle goal events', () => {
            const eventData = {
                team: 'home',
                player: 'Player 1',
                time: 25,
                newScore: '1-0'
            };
            
            // Should not throw error
            expect(() => {
                gameController.handleGoalEvent(eventData);
            }).not.toThrow();
        });

        test('should handle power-up awarded', () => {
            const eventData = {
                powerUp: {
                    type: '2x_multiplier',
                    description: '2x Winnings Multiplier'
                }
            };
            
            // Should not throw error
            expect(() => {
                gameController.handlePowerUpAwarded(eventData);
            }).not.toThrow();
        });
    });

    describe('Error Handling and Recovery', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should handle errors gracefully', () => {
            const error = new Error('Test error');
            
            const result = gameController.handleError('test', error);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Test error');
            expect(gameController.errorRecoveryAttempts).toBe(1);
        });

        test('should attempt recovery based on context', () => {
            gameController.gamePhase = 'match';
            const error = new Error('Match start error');
            
            const result = gameController.handleError('matchStart', error);
            
            expect(result.recovered).toBe(true);
            expect(gameController.gamePhase).toBe('lobby');
        });

        test('should reset game after max recovery attempts', () => {
            gameController.errorRecoveryAttempts = 3;
            const error = new Error('Critical error');
            
            const result = gameController.handleError('critical', error);
            
            expect(gameController.gamePhase).toBe('lobby');
            expect(gameController.currentMatch).toBeNull();
            expect(gameController.errorRecoveryAttempts).toBe(0);
        });

        test('should reset game state completely', () => {
            gameController.gamePhase = 'match';
            gameController.currentMatch = { homeTeam: 'A', awayTeam: 'B' };
            gameController.errorRecoveryAttempts = 2;
            
            gameController.resetGame();
            
            expect(gameController.gamePhase).toBe('lobby');
            expect(gameController.currentMatch).toBeNull();
            expect(gameController.errorRecoveryAttempts).toBe(0);
        });
    });

    describe('State Management Integration', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should toggle classic mode', () => {
            gameController.toggleClassicMode(true);
            
            const state = gameController.modules.stateManager.getState();
            expect(state.classicMode).toBe(true);
        });

        test('should determine match outcome correctly', () => {
            expect(gameController.determineMatchOutcome(2, 1)).toBe('home');
            expect(gameController.determineMatchOutcome(1, 2)).toBe('away');
            expect(gameController.determineMatchOutcome(1, 1)).toBe('draw');
        });

        test('should get comprehensive status', () => {
            const status = gameController.getStatus();
            
            expect(status.isInitialized).toBe(true);
            expect(status.gamePhase).toBe('lobby');
            expect(status.modules).toBeInstanceOf(Array);
            expect(status.modules.length).toBeGreaterThan(0);
        });
    });

    describe('Module Coordination', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should coordinate timer and state updates', async () => {
            const matchData = {
                homeTeam: 'Team A',
                awayTeam: 'Team B'
            };
            
            await gameController.startMatch(matchData);
            
            // Simulate timer update
            const timerCallback = gameController.modules.timerManager.callbacks.onMatchTimeUpdate;
            expect(timerCallback).toBeDefined();
            
            timerCallback(15.5);
            
            const state = gameController.modules.stateManager.getState();
            expect(state.match.time).toBe(15.5);
        });

        test('should coordinate betting and power-up systems', async () => {
            // Place a winning action bet
            const betData = {
                type: 'actionBet',
                outcome: 'choice1',
                stake: 25,
                odds: 2.0,
                eventId: 'event_1'
            };
            
            await gameController.placeBet(betData);
            
            // Simulate action bet resolution
            const eventData = {
                winningOutcome: 'choice1',
                originalEvent: { id: 'event_1' },
                resolution: {}
            };
            
            gameController.handleActionBetResolution(eventData);
            
            // Should have attempted power-up award
            const state = gameController.modules.stateManager.getState();
            expect(state.wallet).toBeGreaterThan(1000); // Won the bet
        });

        test('should coordinate UI and state changes', async () => {
            const matchData = {
                homeTeam: 'Team A',
                awayTeam: 'Team B'
            };
            
            await gameController.startMatch(matchData);
            
            const state = gameController.modules.stateManager.getState();
            expect(state.currentScreen).toBe('match');
        });
    });

    describe('Complete Game Flow Integration', () => {
        beforeEach(async () => {
            await gameController.initialize();
        });

        test('should execute complete match flow', async () => {
            // 1. Start match
            const matchData = {
                homeTeam: 'Team A',
                awayTeam: 'Team B',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            
            const startResult = await gameController.startMatch(matchData);
            expect(startResult.success).toBe(true);
            
            // 2. Place full-match bet
            const fullMatchBet = {
                type: 'fullMatch',
                outcome: 'home',
                stake: 50,
                odds: 1.85
            };
            
            const betResult = await gameController.placeBet(fullMatchBet);
            expect(betResult.success).toBe(true);
            
            // 3. Simulate action betting opportunity
            const actionEvent = {
                eventData: {
                    id: 'action_1',
                    description: 'Corner kick opportunity',
                    choices: [
                        { outcome: 'goal', odds: 3.0, description: 'Results in goal' },
                        { outcome: 'no_goal', odds: 1.5, description: 'No goal' }
                    ]
                }
            };
            
            gameController.handleActionBettingOpportunity(actionEvent);
            expect(gameController.gamePhase).toBe('paused');
            
            // 4. Place action bet
            const actionBet = {
                type: 'actionBet',
                outcome: 'goal',
                stake: 25,
                odds: 3.0,
                eventId: 'action_1'
            };
            
            const actionBetResult = await gameController.placeBet(actionBet);
            expect(actionBetResult.success).toBe(true);
            
            // 5. Resume match
            const resumeResult = gameController.resumeMatch();
            expect(resumeResult.success).toBe(true);
            
            // 6. Simulate goal event
            const goalEvent = {
                team: 'home',
                player: 'Player 1',
                time: 25,
                newScore: '1-0'
            };
            
            gameController.handleGoalEvent(goalEvent);
            
            // 7. End match
            gameController.modules.stateManager.updateState({
                'match.homeScore': 2,
                'match.awayScore': 1
            });
            
            const endResult = await gameController.endMatch();
            expect(endResult.success).toBe(true);
            expect(endResult.outcome).toBe('home');
            
            // 8. Return to lobby
            const lobbyResult = gameController.returnToLobby();
            expect(lobbyResult.success).toBe(true);
            expect(gameController.gamePhase).toBe('lobby');
        });

        test('should handle session continuity', async () => {
            // Start with initial wallet
            const initialState = gameController.modules.stateManager.getState();
            expect(initialState.wallet).toBe(1000);
            
            // Place and win a bet
            const betData = {
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 2.0
            };
            
            await gameController.placeBet(betData);
            
            // Simulate winning
            gameController.modules.bettingManager.resolveBets('home', 'fullMatch');
            
            const afterBetState = gameController.modules.stateManager.getState();
            expect(afterBetState.wallet).toBe(1100); // 1000 - 100 + 200
            
            // Return to lobby (should preserve wallet)
            gameController.returnToLobby();
            
            const finalState = gameController.modules.stateManager.getState();
            expect(finalState.wallet).toBe(1100);
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should cleanup resources on destroy', async () => {
            await gameController.initialize();
            
            const moduleCount = Object.keys(gameController.modules).length;
            expect(moduleCount).toBeGreaterThan(0);
            
            gameController.destroy();
            
            expect(Object.keys(gameController.modules).length).toBe(0);
            expect(gameController.isInitialized).toBe(false);
            expect(gameController.eventListeners.size).toBe(0);
        });

        test('should handle destroy errors gracefully', async () => {
            await gameController.initialize();
            
            // Mock a module with failing destroy
            gameController.modules.testModule = {
                destroy: () => { throw new Error('Destroy failed'); }
            };
            
            // Should not throw
            expect(() => {
                gameController.destroy();
            }).not.toThrow();
        });
    });
});

// Export test utilities for other test files
export const createMockGameController = async () => {
    mockDOM();
    const controller = new GameController();
    await controller.initialize();
    return controller;
};

export const mockMatchData = {
    homeTeam: 'Test Home',
    awayTeam: 'Test Away',
    odds: { home: 1.85, draw: 3.50, away: 4.20 }
};

export const mockBetData = {
    fullMatch: {
        type: 'fullMatch',
        outcome: 'home',
        stake: 25,
        odds: 1.85
    },
    actionBet: {
        type: 'actionBet',
        outcome: 'goal',
        stake: 25,
        odds: 2.5,
        eventId: 'test_event'
    }
};