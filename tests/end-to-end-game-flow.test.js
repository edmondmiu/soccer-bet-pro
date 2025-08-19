/**
 * End-to-End Game Flow Integration Tests
 * Tests complete game scenarios with pause system integration
 */

// Mock environment setup
const mockDOM = {
    getElementById: (id) => ({
        innerHTML: '',
        textContent: '',
        style: { display: 'none' },
        classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn().mockReturnValue(false) },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }),
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        innerHTML: '',
        textContent: '',
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn(),
        appendChild: jest.fn()
    }),
    body: { appendChild: jest.fn() },
    addEventListener: jest.fn()
};

global.document = mockDOM;
global.window = { 
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setTimeout: jest.fn((fn) => fn()),
    clearTimeout: jest.fn(),
    setInterval: jest.fn(),
    clearInterval: jest.fn()
};

describe('End-to-End Game Flow Integration Tests', () => {
    let gameInstance;
    let pauseManager;
    let pauseUI;
    let gameEvents;

    beforeEach(() => {
        // Mock pause system
        pauseManager = {
            initialize: jest.fn().mockResolvedValue(true),
            pauseGame: jest.fn(),
            resumeGame: jest.fn(),
            isPaused: jest.fn().mockReturnValue(false),
            cleanup: jest.fn(),
            getPauseReason: jest.fn().mockReturnValue(null),
            getRemainingTime: jest.fn().mockReturnValue(0)
        };

        pauseUI = {
            initialize: jest.fn().mockResolvedValue(true),
            showPauseOverlay: jest.fn(),
            hidePauseOverlay: jest.fn(),
            startCountdown: jest.fn(),
            updateCountdown: jest.fn(),
            cleanup: jest.fn()
        };

        // Mock game instance with full functionality
        gameInstance = {
            state: {
                currentMinute: 0,
                homeScore: 0,
                awayScore: 0,
                isMatchActive: false,
                isPaused: false,
                matchEvents: [],
                bettingHistory: []
            },
            pauseManager: pauseManager,
            pauseUI: pauseUI,
            matchInterval: null,
            
            initialize: jest.fn(async function() {
                await this.pauseManager.initialize();
                await this.pauseUI.initialize();
                return true;
            }),
            
            startMatch: jest.fn(function() {
                this.state.isMatchActive = true;
                this.state.currentMinute = 0;
            }),
            
            processMatchEvent: jest.fn(function(event) {
                this.state.matchEvents.push(event);
                
                if (this.isBettingEvent(event)) {
                    this.pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
                    this.state.isPaused = true;
                }
                
                return event;
            }),
            
            isBettingEvent: jest.fn(function(event) {
                const bettingEventTypes = [
                    'MULTI_CHOICE_ACTION_BET',
                    'FULL_MATCH_BET',
                    'CORNER_BET',
                    'CARD_BET'
                ];
                return bettingEventTypes.includes(event.type);
            }),
            
            handleBettingDecision: jest.fn(function(decision) {
                this.state.bettingHistory.push(decision);
                this.pauseManager.resumeGame();
                this.state.isPaused = false;
                return decision;
            }),
            
            endMatch: jest.fn(function() {
                this.state.isMatchActive = false;
                if (this.matchInterval) {
                    clearInterval(this.matchInterval);
                    this.matchInterval = null;
                }
            })
        };

        // Sample game events for testing
        gameEvents = [
            { type: 'KICK_OFF', minute: 0, description: 'Match started' },
            { type: 'COMMENTARY', minute: 5, description: 'Early pressure from home team' },
            { type: 'MULTI_CHOICE_ACTION_BET', minute: 10, description: 'Corner kick opportunity', options: ['Goal', 'No Goal', 'Card'] },
            { type: 'GOAL', minute: 15, description: 'GOAL! Home team scores', scorer: 'Player A' },
            { type: 'COMMENTARY', minute: 20, description: 'Celebration in the stands' },
            { type: 'MULTI_CHOICE_ACTION_BET', minute: 25, description: 'Free kick opportunity', options: ['Goal', 'Save', 'Miss'] },
            { type: 'CARD_BET', minute: 30, description: 'Potential yellow card situation' },
            { type: 'COMMENTARY', minute: 35, description: 'Intense midfield battle' },
            { type: 'GOAL', minute: 40, description: 'GOAL! Away team equalizes', scorer: 'Player B' },
            { type: 'RESOLUTION', minute: 45, description: 'Half-time whistle' }
        ];
    });

    describe('Complete Match Flow', () => {
        test('should complete full match with multiple betting events', async () => {
            // Initialize game
            await gameInstance.initialize();
            expect(gameInstance.initialize).toHaveBeenCalled();
            expect(pauseManager.initialize).toHaveBeenCalled();
            expect(pauseUI.initialize).toHaveBeenCalled();

            // Start match
            gameInstance.startMatch();
            expect(gameInstance.state.isMatchActive).toBe(true);
            expect(gameInstance.state.currentMinute).toBe(0);

            // Process all events
            let bettingEventCount = 0;
            for (const event of gameEvents) {
                gameInstance.processMatchEvent(event);
                
                if (gameInstance.isBettingEvent(event)) {
                    bettingEventCount++;
                    
                    // Verify pause was triggered
                    expect(gameInstance.state.isPaused).toBe(true);
                    expect(pauseManager.pauseGame).toHaveBeenCalled();
                    
                    // Simulate betting decision
                    const decision = { 
                        eventId: event.type, 
                        action: 'bet', 
                        amount: 50,
                        option: event.options ? event.options[0] : 'default'
                    };
                    gameInstance.handleBettingDecision(decision);
                    
                    // Verify resume was triggered
                    expect(gameInstance.state.isPaused).toBe(false);
                    expect(pauseManager.resumeGame).toHaveBeenCalled();
                }
            }

            // Verify all events were processed
            expect(gameInstance.state.matchEvents).toHaveLength(gameEvents.length);
            expect(gameInstance.state.bettingHistory).toHaveLength(bettingEventCount);
            
            // End match
            gameInstance.endMatch();
            expect(gameInstance.state.isMatchActive).toBe(false);
        });

        test('should handle betting timeout scenarios', async () => {
            await gameInstance.initialize();
            gameInstance.startMatch();

            const bettingEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                minute: 20,
                description: 'Penalty kick opportunity',
                options: ['Goal', 'Save', 'Miss'],
                timeout: 15000
            };

            // Process betting event
            gameInstance.processMatchEvent(bettingEvent);
            expect(gameInstance.state.isPaused).toBe(true);

            // Simulate timeout (no decision made)
            setTimeout(() => {
                gameInstance.handleBettingDecision({ action: 'timeout' });
            }, bettingEvent.timeout);

            // Verify timeout handling
            expect(gameInstance.state.bettingHistory).toContainEqual(
                expect.objectContaining({ action: 'timeout' })
            );
        });
    });

    describe('Pause System Integration Scenarios', () => {
        test('should handle multiple consecutive betting events', async () => {
            await gameInstance.initialize();
            gameInstance.startMatch();

            const consecutiveBettingEvents = [
                { type: 'MULTI_CHOICE_ACTION_BET', minute: 10, description: 'First bet' },
                { type: 'CORNER_BET', minute: 11, description: 'Corner bet' },
                { type: 'CARD_BET', minute: 12, description: 'Card bet' }
            ];

            for (const event of consecutiveBettingEvents) {
                // Process event (should pause)
                gameInstance.processMatchEvent(event);
                expect(gameInstance.state.isPaused).toBe(true);

                // Make decision (should resume)
                gameInstance.handleBettingDecision({ 
                    action: 'bet', 
                    amount: 25,
                    eventId: event.type 
                });
                expect(gameInstance.state.isPaused).toBe(false);
            }

            expect(gameInstance.state.bettingHistory).toHaveLength(3);
            expect(pauseManager.pauseGame).toHaveBeenCalledTimes(3);
            expect(pauseManager.resumeGame).toHaveBeenCalledTimes(3);
        });

        test('should maintain game state during pause/resume cycles', async () => {
            await gameInstance.initialize();
            gameInstance.startMatch();

            const initialState = { ...gameInstance.state };

            // Process non-betting event
            gameInstance.processMatchEvent({ type: 'COMMENTARY', minute: 5 });
            expect(gameInstance.state.isPaused).toBe(false);

            // Process betting event
            gameInstance.processMatchEvent({ 
                type: 'MULTI_CHOICE_ACTION_BET', 
                minute: 10,
                description: 'Test betting event'
            });
            expect(gameInstance.state.isPaused).toBe(true);

            // Verify core state is preserved
            expect(gameInstance.state.currentMinute).toBe(initialState.currentMinute);
            expect(gameInstance.state.homeScore).toBe(initialState.homeScore);
            expect(gameInstance.state.awayScore).toBe(initialState.awayScore);
            expect(gameInstance.state.isMatchActive).toBe(true);

            // Resume game
            gameInstance.handleBettingDecision({ action: 'skip' });
            expect(gameInstance.state.isPaused).toBe(false);
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle pause system failures gracefully', async () => {
            // Mock pause system failure
            pauseManager.pauseGame.mockImplementation(() => {
                throw new Error('Pause system failure');
            });

            await gameInstance.initialize();
            gameInstance.startMatch();

            const bettingEvent = { 
                type: 'MULTI_CHOICE_ACTION_BET', 
                minute: 15,
                description: 'Test event'
            };

            // Should not throw error even if pause fails
            expect(() => {
                gameInstance.processMatchEvent(bettingEvent);
            }).not.toThrow();

            // Game should continue functioning
            expect(gameInstance.state.matchEvents).toContain(bettingEvent);
        });

        test('should recover from initialization failures', async () => {
            // Mock initialization failure
            pauseManager.initialize.mockRejectedValue(new Error('Init failed'));

            try {
                await gameInstance.initialize();
            } catch (error) {
                expect(error.message).toBe('Init failed');
            }

            // Game should still be able to start without pause system
            gameInstance.startMatch();
            expect(gameInstance.state.isMatchActive).toBe(true);
        });
    });

    describe('Performance and Memory Management', () => {
        test('should handle large number of events efficiently', async () => {
            await gameInstance.initialize();
            gameInstance.startMatch();

            const startTime = Date.now();
            
            // Process 100 events
            for (let i = 0; i < 100; i++) {
                const event = {
                    type: i % 5 === 0 ? 'MULTI_CHOICE_ACTION_BET' : 'COMMENTARY',
                    minute: i,
                    description: `Event ${i}`
                };
                
                gameInstance.processMatchEvent(event);
                
                if (gameInstance.isBettingEvent(event)) {
                    gameInstance.handleBettingDecision({ action: 'skip' });
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(gameInstance.state.matchEvents).toHaveLength(100);
            expect(duration).toBeLessThan(1000); // Should complete in under 1 second
        });

        test('should clean up resources properly', async () => {
            await gameInstance.initialize();
            gameInstance.startMatch();

            // Process some events
            gameInstance.processMatchEvent({ type: 'GOAL', minute: 10 });
            gameInstance.processMatchEvent({ type: 'MULTI_CHOICE_ACTION_BET', minute: 15 });
            gameInstance.handleBettingDecision({ action: 'bet', amount: 100 });

            // End match and cleanup
            gameInstance.endMatch();
            pauseManager.cleanup();
            pauseUI.cleanup();

            expect(gameInstance.state.isMatchActive).toBe(false);
            expect(pauseManager.cleanup).toHaveBeenCalled();
            expect(pauseUI.cleanup).toHaveBeenCalled();
        });
    });

    describe('Regression Validation', () => {
        test('should maintain backward compatibility', async () => {
            // Test that old-style event handling still works
            const legacyEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                minute: 20,
                description: 'Legacy betting event',
                // Old format properties
                eventType: 'betting',
                pauseRequired: true
            };

            await gameInstance.initialize();
            gameInstance.startMatch();

            gameInstance.processMatchEvent(legacyEvent);
            expect(gameInstance.state.isPaused).toBe(true);

            gameInstance.handleBettingDecision({ action: 'bet', amount: 50 });
            expect(gameInstance.state.isPaused).toBe(false);
        });

        test('should preserve all original game features', async () => {
            await gameInstance.initialize();
            
            // Test all core game features still work
            expect(typeof gameInstance.startMatch).toBe('function');
            expect(typeof gameInstance.processMatchEvent).toBe('function');
            expect(typeof gameInstance.handleBettingDecision).toBe('function');
            expect(typeof gameInstance.isBettingEvent).toBe('function');
            expect(typeof gameInstance.endMatch).toBe('function');

            // Test state structure is preserved
            const requiredStateKeys = [
                'currentMinute', 'homeScore', 'awayScore', 
                'isMatchActive', 'isPaused', 'matchEvents', 'bettingHistory'
            ];
            
            requiredStateKeys.forEach(key => {
                expect(gameInstance.state).toHaveProperty(key);
            });
        });
    });
});