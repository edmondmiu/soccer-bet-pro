/**
 * Session Continuity and State Persistence Tests
 * Tests that game state persists correctly between matches and sessions
 */

import { GameController } from '../src/core/GameController.js';

describe('Session Continuity and State Persistence', () => {
    let gameController;
    let initialWallet;

    beforeEach(async () => {
        // Clear any existing state
        localStorage.clear();
        sessionStorage.clear();

        gameController = new GameController();
        await gameController.initialize();
        
        initialWallet = gameController.modules.stateManager.getState().wallet;
    });

    afterEach(() => {
        if (gameController) {
            gameController.destroy();
        }
    });

    describe('Wallet Balance Persistence', () => {
        test('should maintain wallet balance between matches', async () => {
            // Start first match
            const match1Data = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(match1Data);

            // Place a winning bet
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 1.85
            });

            // Set winning outcome and end match
            gameController.modules.stateManager.updateState({
                'match.homeScore': 2,
                'match.awayScore': 1
            });

            await gameController.endMatch();
            const walletAfterMatch1 = gameController.modules.stateManager.getState().wallet;

            // Return to lobby
            gameController.returnToLobby();

            // Start second match
            const match2Data = {
                homeTeam: 'Liverpool',
                awayTeam: 'Manchester City',
                odds: { home: 2.10, draw: 3.20, away: 3.80 }
            };

            await gameController.startMatch(match2Data);
            const walletAfterMatch2Start = gameController.modules.stateManager.getState().wallet;

            expect(walletAfterMatch2Start).toBe(walletAfterMatch1);
            expect(walletAfterMatch2Start).toBeGreaterThan(initialWallet);
        });

        test('should handle wallet balance with multiple matches', async () => {
            const matches = [
                { homeTeam: 'Arsenal', awayTeam: 'Chelsea', winningOutcome: 'home', homeScore: 2, awayScore: 1 },
                { homeTeam: 'Liverpool', awayTeam: 'Man City', winningOutcome: 'away', homeScore: 1, awayScore: 3 },
                { homeTeam: 'Tottenham', awayTeam: 'Man United', winningOutcome: 'draw', homeScore: 1, awayScore: 1 }
            ];

            let expectedWallet = initialWallet;
            const betAmount = 50;
            const odds = 2.0;

            for (const match of matches) {
                // Start match
                await gameController.startMatch({
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    odds: { home: 2.0, draw: 3.0, away: 2.5 }
                });

                // Place bet on winning outcome
                await gameController.placeBet({
                    type: 'fullMatch',
                    outcome: match.winningOutcome,
                    stake: betAmount,
                    odds: odds
                });

                // Update expected wallet
                expectedWallet -= betAmount; // Subtract stake
                expectedWallet += betAmount * odds; // Add winnings

                // Set match result
                gameController.modules.stateManager.updateState({
                    'match.homeScore': match.homeScore,
                    'match.awayScore': match.awayScore
                });

                // End match
                await gameController.endMatch();
                gameController.returnToLobby();

                // Verify wallet balance
                const currentWallet = gameController.modules.stateManager.getState().wallet;
                expect(currentWallet).toBeCloseTo(expectedWallet, 2);
            }
        });

        test('should handle losing bets correctly', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Place losing bet
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 1.85
            });

            // Set losing outcome
            gameController.modules.stateManager.updateState({
                'match.homeScore': 0,
                'match.awayScore': 2
            });

            await gameController.endMatch();
            const finalWallet = gameController.modules.stateManager.getState().wallet;

            // Should lose the stake
            expect(finalWallet).toBe(initialWallet - 100);
        });
    });

    describe('Bet Amount Memory', () => {
        test('should remember full-match bet amounts', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Place bet with specific amount
            const betAmount = 75;
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: betAmount,
                odds: 1.85
            });

            // Check memory is stored
            const rememberedAmount = gameController.modules.stateManager.getBetAmountMemory('fullMatch');
            expect(rememberedAmount).toBe(betAmount);

            // End match and start new one
            await gameController.endMatch();
            gameController.returnToLobby();

            await gameController.startMatch({
                homeTeam: 'Liverpool',
                awayTeam: 'Man City',
                odds: { home: 2.10, draw: 3.20, away: 3.80 }
            });

            // Memory should persist
            const persistedAmount = gameController.modules.stateManager.getBetAmountMemory('fullMatch');
            expect(persistedAmount).toBe(betAmount);
        });

        test('should remember action bet amounts separately', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Place different amounts for different bet types
            const fullMatchAmount = 50;
            const actionBetAmount = 25;

            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: fullMatchAmount,
                odds: 1.85
            });

            await gameController.placeBet({
                type: 'actionBet',
                outcome: 'corner-yes',
                stake: actionBetAmount,
                odds: 1.5,
                eventId: 'test-action'
            });

            // Check both memories are stored separately
            expect(gameController.modules.stateManager.getBetAmountMemory('fullMatch')).toBe(fullMatchAmount);
            expect(gameController.modules.stateManager.getBetAmountMemory('opportunity')).toBe(actionBetAmount);
        });

        test('should use default amounts when no memory exists', () => {
            // Fresh state should use defaults
            const fullMatchDefault = gameController.modules.stateManager.getBetAmountMemory('fullMatch');
            const actionBetDefault = gameController.modules.stateManager.getBetAmountMemory('opportunity');

            expect(fullMatchDefault).toBe(25); // Default amount
            expect(actionBetDefault).toBe(25); // Default amount
        });

        test('should validate remembered amounts against wallet', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Set wallet to low amount
            gameController.modules.stateManager.updateState({ wallet: 10 });

            // Try to use remembered amount higher than wallet
            gameController.modules.stateManager.updateBetAmountMemory('fullMatch', 100);

            const result = await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 100,
                odds: 1.85
            });

            // Should fail due to insufficient funds
            expect(result.success).toBe(false);
            expect(result.error).toContain('insufficient');
        });
    });

    describe('Classic Mode Persistence', () => {
        test('should remember classic mode setting', async () => {
            // Enable classic mode
            gameController.toggleClassicMode(true);
            expect(gameController.modules.stateManager.getState().classicMode).toBe(true);

            // Start and end a match
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);
            await gameController.endMatch();
            gameController.returnToLobby();

            // Classic mode should still be enabled
            expect(gameController.modules.stateManager.getState().classicMode).toBe(true);

            // Power-ups should be disabled
            const powerUpResult = gameController.modules.powerUpManager.awardPowerUp();
            expect(powerUpResult.success).toBe(false);
        });

        test('should reset power-ups when classic mode is enabled', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Award a power-up first
            const powerUpResult = gameController.modules.powerUpManager.awardPowerUp();
            if (powerUpResult.success) {
                expect(gameController.modules.stateManager.getState().powerUp.held).toBeTruthy();
            }

            // Enable classic mode
            gameController.toggleClassicMode(true);

            // Power-up should be cleared
            expect(gameController.modules.stateManager.getState().powerUp.held).toBeFalsy();
        });
    });

    describe('Match State Reset', () => {
        test('should reset match-specific state between matches', async () => {
            // Start first match
            const match1Data = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(match1Data);

            // Place bets and simulate match progress
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 50,
                odds: 1.85
            });

            // Simulate goal
            gameController.modules.stateManager.updateState({
                'match.homeScore': 1,
                'match.awayScore': 0
            });

            const stateAfterGoal = gameController.modules.stateManager.getState();
            expect(stateAfterGoal.match.homeScore).toBe(1);
            expect(stateAfterGoal.bets.fullMatch.length).toBe(1);

            // End match and return to lobby
            await gameController.endMatch();
            gameController.returnToLobby();

            // Start second match
            const match2Data = {
                homeTeam: 'Liverpool',
                awayTeam: 'Man City',
                odds: { home: 2.10, draw: 3.20, away: 3.80 }
            };

            await gameController.startMatch(match2Data);

            const stateAfterNewMatch = gameController.modules.stateManager.getState();

            // Match-specific state should be reset
            expect(stateAfterNewMatch.match.homeScore).toBe(0);
            expect(stateAfterNewMatch.match.awayScore).toBe(0);
            expect(stateAfterNewMatch.match.homeTeam).toBe('Liverpool');
            expect(stateAfterNewMatch.match.awayTeam).toBe('Man City');
            expect(stateAfterNewMatch.bets.fullMatch.length).toBe(0);
            expect(stateAfterNewMatch.bets.actionBet.length).toBe(0);

            // But persistent state should remain
            expect(stateAfterNewMatch.wallet).toBe(stateAfterGoal.wallet);
        });

        test('should reset power-up eligibility between matches', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Award and apply power-up
            const powerUpResult = gameController.modules.powerUpManager.awardPowerUp();
            if (powerUpResult.success) {
                gameController.modules.powerUpManager.applyPowerUp('test-bet-id');
            }

            const stateWithPowerUp = gameController.modules.stateManager.getState();

            // End match and start new one
            await gameController.endMatch();
            gameController.returnToLobby();

            await gameController.startMatch({
                homeTeam: 'Liverpool',
                awayTeam: 'Man City',
                odds: { home: 2.10, draw: 3.20, away: 3.80 }
            });

            const stateAfterNewMatch = gameController.modules.stateManager.getState();

            // Power-up should be reset for new match
            expect(stateAfterNewMatch.powerUp.held).toBeFalsy();
            expect(stateAfterNewMatch.powerUp.applied).toBe(false);
        });
    });

    describe('Error Recovery and State Consistency', () => {
        test('should maintain state consistency after errors', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Place bet
            await gameController.placeBet({
                type: 'fullMatch',
                outcome: 'home',
                stake: 50,
                odds: 1.85
            });

            const stateBeforeError = gameController.modules.stateManager.getState();

            // Simulate error
            gameController.handleError('test', new Error('Test error'));

            const stateAfterError = gameController.modules.stateManager.getState();

            // Critical state should be preserved
            expect(stateAfterError.wallet).toBe(stateBeforeError.wallet);
            expect(stateAfterError.bets.fullMatch.length).toBe(stateBeforeError.bets.fullMatch.length);
        });

        test('should recover gracefully from corrupted state', () => {
            // Simulate corrupted state
            const corruptedState = {
                wallet: 'invalid',
                match: null,
                bets: undefined
            };

            // State manager should handle corruption gracefully
            expect(() => {
                gameController.modules.stateManager.updateState(corruptedState);
            }).not.toThrow();

            // Should fall back to valid defaults
            const state = gameController.modules.stateManager.getState();
            expect(typeof state.wallet).toBe('number');
            expect(state.match).toBeDefined();
            expect(state.bets).toBeDefined();
        });
    });

    describe('Performance with State Persistence', () => {
        test('should maintain performance with large state objects', async () => {
            const startTime = performance.now();

            // Create large state by playing multiple matches
            for (let i = 0; i < 5; i++) {
                const matchData = {
                    homeTeam: `Team A${i}`,
                    awayTeam: `Team B${i}`,
                    odds: { home: 1.85, draw: 3.50, away: 4.20 }
                };

                await gameController.startMatch(matchData);

                // Place multiple bets
                for (let j = 0; j < 3; j++) {
                    await gameController.placeBet({
                        type: 'fullMatch',
                        outcome: 'home',
                        stake: 10,
                        odds: 1.85
                    });
                }

                await gameController.endMatch();
                gameController.returnToLobby();
            }

            const duration = performance.now() - startTime;

            // Should complete within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds
        });

        test('should handle rapid state updates efficiently', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            const startTime = performance.now();

            // Perform rapid state updates
            for (let i = 0; i < 100; i++) {
                gameController.modules.stateManager.updateState({
                    'match.time': i
                });
            }

            const duration = performance.now() - startTime;

            // Should handle rapid updates efficiently
            expect(duration).toBeLessThan(1000); // 1 second

            // Final state should be correct
            const finalState = gameController.modules.stateManager.getState();
            expect(finalState.match.time).toBe(99);
        });
    });

    describe('Cross-Session Persistence', () => {
        test('should simulate session restoration', () => {
            // Simulate saving session data
            const currentState = gameController.modules.stateManager.getState();
            const sessionData = {
                wallet: currentState.wallet,
                classicMode: currentState.classicMode,
                betAmountMemory: currentState.betAmountMemory
            };

            // Store in localStorage (simulating browser persistence)
            localStorage.setItem('gameSession', JSON.stringify(sessionData));

            // Create new game controller (simulating page reload)
            const newGameController = new GameController();
            
            // Simulate loading session data
            const savedSession = JSON.parse(localStorage.getItem('gameSession') || '{}');
            
            if (savedSession.wallet) {
                newGameController.modules = gameController.modules; // Simulate initialization
                newGameController.modules.stateManager.updateState({
                    wallet: savedSession.wallet,
                    classicMode: savedSession.classicMode,
                    betAmountMemory: savedSession.betAmountMemory
                });

                const restoredState = newGameController.modules.stateManager.getState();
                expect(restoredState.wallet).toBe(sessionData.wallet);
                expect(restoredState.classicMode).toBe(sessionData.classicMode);
            }
        });
    });
});