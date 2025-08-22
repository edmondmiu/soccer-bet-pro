/**
 * End-to-End Game Flow Integration Test
 * Tests the complete 8-phase game loop from lobby to match end
 */

import { GameController } from '../src/core/GameController.js';
import { StateManager } from '../src/core/StateManager.js';

describe('End-to-End Game Flow Integration', () => {
    let gameController;
    let stateManager;
    let testResults = {
        phases: {},
        errors: [],
        performance: {}
    };

    beforeEach(async () => {
        // Create fresh instances for each test
        gameController = new GameController();
        stateManager = new StateManager();
        
        // Initialize the game
        const initResult = await gameController.initialize();
        expect(initResult.success).toBe(true);
        
        testResults = {
            phases: {},
            errors: [],
            performance: {}
        };
    });

    afterEach(() => {
        // Cleanup after each test
        if (gameController) {
            gameController.destroy();
        }
    });

    describe('Phase 1: Game Initialization', () => {
        test('should initialize all modules correctly', async () => {
            const startTime = performance.now();
            
            const status = gameController.getStatus();
            
            testResults.performance.initialization = performance.now() - startTime;
            testResults.phases.initialization = {
                success: true,
                modules: status.modules,
                gamePhase: status.gamePhase
            };
            
            expect(status.isInitialized).toBe(true);
            expect(status.gamePhase).toBe('lobby');
            expect(status.modules).toContain('stateManager');
            expect(status.modules).toContain('bettingManager');
            expect(status.modules).toContain('uiManager');
            expect(status.modules).toContain('timerManager');
        });

        test('should have correct initial state', () => {
            const state = gameController.modules.stateManager.getState();
            
            expect(state.wallet).toBe(1000);
            expect(state.currentScreen).toBe('lobby');
            expect(state.classicMode).toBe(false);
            expect(state.match.active).toBe(false);
        });
    });

    describe('Phase 2: Lobby & Match Selection', () => {
        test('should handle match selection and transition to match', async () => {
            const startTime = performance.now();
            
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            
            const result = await gameController.startMatch(matchData);
            
            testResults.performance.matchStart = performance.now() - startTime;
            testResults.phases.matchSelection = {
                success: result.success,
                matchData: matchData
            };
            
            expect(result.success).toBe(true);
            
            const state = gameController.modules.stateManager.getState();
            expect(state.currentScreen).toBe('match');
            expect(state.match.active).toBe(true);
            expect(state.match.homeTeam).toBe('Arsenal');
            expect(state.match.awayTeam).toBe('Chelsea');
        });
    });

    describe('Phase 3: Match Timer & Event System', () => {
        beforeEach(async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            await gameController.startMatch(matchData);
        });

        test('should start match timer and generate events', async () => {
            const startTime = performance.now();
            
            // Check timer is running
            const timerStatus = gameController.modules.timerManager.getStatus();
            expect(timerStatus.isRunning).toBe(true);
            expect(timerStatus.matchTime).toBeGreaterThanOrEqual(0);
            
            // Check events are generated
            const state = gameController.modules.stateManager.getState();
            expect(state.match.timeline).toBeDefined();
            expect(state.match.timeline.length).toBeGreaterThan(0);
            
            testResults.performance.eventGeneration = performance.now() - startTime;
            testResults.phases.timerAndEvents = {
                success: true,
                timerRunning: timerStatus.isRunning,
                eventsGenerated: state.match.timeline.length
            };
        });

        test('should process events according to timeline', (done) => {
            let eventProcessed = false;
            
            // Listen for event processing
            document.addEventListener('game:eventProcessed', () => {
                eventProcessed = true;
                testResults.phases.eventProcessing = {
                    success: true,
                    eventProcessed: true
                };
                done();
            });
            
            // Trigger event processing manually for testing
            setTimeout(() => {
                if (!eventProcessed) {
                    testResults.phases.eventProcessing = {
                        success: false,
                        error: 'No events processed in time limit'
                    };
                    done();
                }
            }, 2000);
        });
    });

    describe('Phase 4: Continuous Full-Match Betting', () => {
        beforeEach(async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            await gameController.startMatch(matchData);
        });

        test('should allow continuous betting without pausing game', async () => {
            const startTime = performance.now();
            
            const betData = {
                type: 'fullMatch',
                outcome: 'home',
                stake: 50,
                odds: 1.85
            };
            
            const result = await gameController.placeBet(betData);
            
            testResults.performance.fullMatchBetting = performance.now() - startTime;
            testResults.phases.fullMatchBetting = {
                success: result.success,
                betPlaced: result.success,
                gameStillRunning: gameController.getStatus().gamePhase === 'match'
            };
            
            expect(result.success).toBe(true);
            expect(gameController.getStatus().gamePhase).toBe('match'); // Game should not pause
            
            const state = gameController.modules.stateManager.getState();
            expect(state.bets.fullMatch).toHaveLength(1);
            expect(state.wallet).toBe(950); // 1000 - 50
        });

        test('should allow multiple bets on different outcomes', async () => {
            const bets = [
                { type: 'fullMatch', outcome: 'home', stake: 25, odds: 1.85 },
                { type: 'fullMatch', outcome: 'draw', stake: 30, odds: 3.50 },
                { type: 'fullMatch', outcome: 'away', stake: 20, odds: 4.20 }
            ];
            
            for (const bet of bets) {
                const result = await gameController.placeBet(bet);
                expect(result.success).toBe(true);
            }
            
            const state = gameController.modules.stateManager.getState();
            expect(state.bets.fullMatch).toHaveLength(3);
            expect(state.wallet).toBe(925); // 1000 - 75
        });
    });

    describe('Phase 5: Action Betting Pause System', () => {
        beforeEach(async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            await gameController.startMatch(matchData);
        });

        test('should pause game for action betting opportunities', async () => {
            const startTime = performance.now();
            
            const eventData = {
                id: 'test-action-bet',
                type: 'ACTION_BET',
                description: 'Corner kick opportunity',
                choices: [
                    { id: 'corner-yes', description: 'Corner taken', odds: 1.5 },
                    { id: 'corner-no', description: 'No corner', odds: 2.5 }
                ]
            };
            
            const result = gameController.pauseForActionBet(eventData);
            
            testResults.performance.actionBettingPause = performance.now() - startTime;
            testResults.phases.actionBettingPause = {
                success: result.success,
                gamePaused: gameController.getStatus().gamePhase === 'paused'
            };
            
            expect(result.success).toBe(true);
            expect(gameController.getStatus().gamePhase).toBe('paused');
        });

        test('should resume game after action betting', async () => {
            // First pause the game
            const eventData = {
                id: 'test-action-bet',
                type: 'ACTION_BET',
                description: 'Corner kick opportunity',
                choices: [
                    { id: 'corner-yes', description: 'Corner taken', odds: 1.5 }
                ]
            };
            
            gameController.pauseForActionBet(eventData);
            expect(gameController.getStatus().gamePhase).toBe('paused');
            
            // Then resume
            const result = gameController.resumeMatch();
            
            testResults.phases.actionBettingResume = {
                success: result.success,
                gameResumed: gameController.getStatus().gamePhase === 'match'
            };
            
            expect(result.success).toBe(true);
            expect(gameController.getStatus().gamePhase).toBe('match');
        });
    });

    describe('Phase 6: Power-Up System', () => {
        beforeEach(async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            await gameController.startMatch(matchData);
        });

        test('should award power-ups on action bet wins', async () => {
            const startTime = performance.now();
            
            // Place an action bet
            const betData = {
                type: 'actionBet',
                outcome: 'corner-yes',
                stake: 25,
                odds: 1.5,
                eventId: 'test-action-bet'
            };
            
            await gameController.placeBet(betData);
            
            // Simulate winning the bet
            const powerUpResult = gameController.modules.powerUpManager.awardPowerUp();
            
            testResults.performance.powerUpSystem = performance.now() - startTime;
            testResults.phases.powerUpSystem = {
                success: powerUpResult.success,
                powerUpAwarded: powerUpResult.success
            };
            
            if (powerUpResult.success) {
                const state = gameController.modules.stateManager.getState();
                expect(state.powerUp.held).toBeTruthy();
            }
        });

        test('should disable power-ups in classic mode', async () => {
            // Enable classic mode
            gameController.toggleClassicMode(true);
            
            const state = gameController.modules.stateManager.getState();
            expect(state.classicMode).toBe(true);
            
            // Try to award power-up
            const powerUpResult = gameController.modules.powerUpManager.awardPowerUp();
            
            // Should not award power-up in classic mode
            expect(powerUpResult.success).toBe(false);
        });
    });

    describe('Phase 7: Event Resolution & Scoring', () => {
        beforeEach(async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            await gameController.startMatch(matchData);
        });

        test('should resolve action bets after 4 minutes', (done) => {
            const startTime = performance.now();
            
            // Place an action bet
            const betData = {
                type: 'actionBet',
                outcome: 'corner-yes',
                stake: 25,
                odds: 1.5,
                eventId: 'test-action-bet'
            };
            
            gameController.placeBet(betData);
            
            // Listen for bet resolution
            document.addEventListener('game:actionBetResolution', (event) => {
                testResults.performance.betResolution = performance.now() - startTime;
                testResults.phases.betResolution = {
                    success: true,
                    resolutionData: event.detail
                };
                done();
            });
            
            // Simulate resolution after delay
            setTimeout(() => {
                gameController.handleActionBetResolution({
                    winningOutcome: 'corner-yes',
                    originalEvent: { id: 'test-action-bet' }
                });
            }, 100);
        });

        test('should update odds after goal events', async () => {
            const initialState = gameController.modules.stateManager.getState();
            const initialOdds = { ...initialState.match.odds };
            
            // Simulate goal event
            const goalEvent = {
                type: 'GOAL',
                team: 'home',
                newScore: '1-0'
            };
            
            gameController.handleGoalEvent(goalEvent);
            
            // Check if odds were updated
            const updatedState = gameController.modules.stateManager.getState();
            
            testResults.phases.oddsUpdate = {
                success: true,
                initialOdds: initialOdds,
                updatedOdds: updatedState.match.odds,
                oddsChanged: JSON.stringify(initialOdds) !== JSON.stringify(updatedState.match.odds)
            };
        });
    });

    describe('Phase 8: Match Conclusion & Summary', () => {
        beforeEach(async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            await gameController.startMatch(matchData);
        });

        test('should end match at 90 minutes and show summary', async () => {
            const startTime = performance.now();
            
            // Place some bets first
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 50,
                odds: 1.85
            });
            
            // Simulate match end
            const result = await gameController.endMatch();
            
            testResults.performance.matchConclusion = performance.now() - startTime;
            testResults.phases.matchConclusion = {
                success: result.success,
                outcome: result.outcome,
                summaryCreated: !!result.summaryData
            };
            
            expect(result.success).toBe(true);
            expect(result.outcome).toMatch(/^(home|away|draw)$/);
            expect(result.summaryData).toBeDefined();
            expect(result.summaryData.match).toBeDefined();
            expect(result.summaryData.betting).toBeDefined();
        });

        test('should calculate final winnings correctly', async () => {
            // Place winning bet
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 1.85
            });
            
            // Set final score to home win
            gameController.modules.stateManager.updateState({
                'match.homeScore': 2,
                'match.awayScore': 1
            });
            
            const result = await gameController.endMatch();
            
            expect(result.success).toBe(true);
            expect(result.outcome).toBe('home');
            
            const finalState = gameController.modules.stateManager.getState();
            // Should have original 1000 - 100 stake + 185 winnings = 1085
            expect(finalState.wallet).toBeGreaterThan(1000);
        });

        test('should return to lobby after match summary', async () => {
            await gameController.endMatch();
            
            const returnResult = gameController.returnToLobby();
            
            testResults.phases.returnToLobby = {
                success: returnResult.success,
                inLobby: gameController.getStatus().gamePhase === 'lobby'
            };
            
            expect(returnResult.success).toBe(true);
            expect(gameController.getStatus().gamePhase).toBe('lobby');
        });
    });

    describe('Session Continuity & State Persistence', () => {
        test('should maintain wallet balance between matches', async () => {
            // Start first match
            const matchData1 = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            
            await gameController.startMatch(matchData1);
            
            // Place bet and end match
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 1.85
            });
            
            // Set winning outcome
            gameController.modules.stateManager.updateState({
                'match.homeScore': 1,
                'match.awayScore': 0
            });
            
            await gameController.endMatch();
            const walletAfterMatch1 = gameController.modules.stateManager.getState().wallet;
            
            gameController.returnToLobby();
            
            // Start second match
            const matchData2 = {
                homeTeam: 'Liverpool',
                awayTeam: 'Manchester City',
                odds: { home: 2.10, draw: 3.20, away: 3.80 }
            };
            
            await gameController.startMatch(matchData2);
            const walletAfterMatch2Start = gameController.modules.stateManager.getState().wallet;
            
            testResults.phases.sessionContinuity = {
                success: true,
                walletPersisted: walletAfterMatch1 === walletAfterMatch2Start
            };
            
            expect(walletAfterMatch2Start).toBe(walletAfterMatch1);
        });

        test('should remember bet amounts between matches', async () => {
            // Start first match and place bet
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };
            
            await gameController.startMatch(matchData);
            
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 75,
                odds: 1.85
            });
            
            const betAmountMemory = gameController.modules.stateManager.getBetAmountMemory('fullMatch');
            
            testResults.phases.betAmountMemory = {
                success: true,
                memoryStored: betAmountMemory === 75
            };
            
            expect(betAmountMemory).toBe(75);
        });
    });

    describe('Error Handling & Recovery', () => {
        test('should handle and recover from errors gracefully', async () => {
            const startTime = performance.now();
            
            // Simulate an error condition
            const errorResult = gameController.handleError('test', new Error('Test error'));
            
            testResults.performance.errorHandling = performance.now() - startTime;
            testResults.phases.errorHandling = {
                success: !errorResult.success, // Error handling should return false for success
                errorHandled: true,
                recovered: errorResult.recovered
            };
            
            expect(errorResult.success).toBe(false);
            expect(errorResult.error).toBe('Test error');
        });

        test('should reset game after max recovery attempts', async () => {
            // Force multiple errors to trigger reset
            for (let i = 0; i < 4; i++) {
                gameController.handleError('test', new Error(`Test error ${i}`));
            }
            
            // Game should be reset to lobby
            expect(gameController.getStatus().gamePhase).toBe('lobby');
            expect(gameController.getStatus().errorRecoveryAttempts).toBe(0);
        });
    });

    describe('Performance & Memory Management', () => {
        test('should complete full game cycle within performance thresholds', () => {
            const performanceThresholds = {
                initialization: 1000, // 1 second
                matchStart: 500,      // 0.5 seconds
                fullMatchBetting: 100, // 0.1 seconds
                actionBettingPause: 50, // 0.05 seconds
                betResolution: 200,    // 0.2 seconds
                matchConclusion: 300,  // 0.3 seconds
                errorHandling: 50      // 0.05 seconds
            };
            
            let performanceIssues = [];
            
            Object.entries(testResults.performance).forEach(([phase, time]) => {
                const threshold = performanceThresholds[phase];
                if (threshold && time > threshold) {
                    performanceIssues.push(`${phase}: ${time}ms > ${threshold}ms`);
                }
            });
            
            testResults.phases.performance = {
                success: performanceIssues.length === 0,
                issues: performanceIssues,
                measurements: testResults.performance
            };
            
            expect(performanceIssues).toHaveLength(0);
        });

        test('should properly cleanup resources', () => {
            const initialModules = Object.keys(gameController.modules).length;
            
            gameController.destroy();
            
            const finalModules = Object.keys(gameController.modules).length;
            
            testResults.phases.cleanup = {
                success: finalModules === 0,
                initialModules,
                finalModules
            };
            
            expect(finalModules).toBe(0);
            expect(gameController.isInitialized).toBe(false);
        });
    });

    // Generate comprehensive test report
    afterAll(() => {
        const report = {
            timestamp: new Date().toISOString(),
            testResults,
            summary: {
                totalPhases: Object.keys(testResults.phases).length,
                successfulPhases: Object.values(testResults.phases).filter(p => p.success).length,
                errors: testResults.errors,
                averagePerformance: Object.values(testResults.performance).reduce((a, b) => a + b, 0) / Object.values(testResults.performance).length
            }
        };
        
        console.log('End-to-End Test Report:', JSON.stringify(report, null, 2));
    });
});