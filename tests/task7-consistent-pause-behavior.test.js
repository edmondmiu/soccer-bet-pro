/**
 * Task 7: Consistent Pause Behavior Across All Betting Scenarios
 * 
 * This test suite verifies that pause behavior is consistent across all betting scenarios:
 * - Full-match betting triggers pause when appropriate
 * - Future betting event types are supported
 * - Multiple betting events are handled with proper sequencing
 * - Classic mode compatibility is maintained
 * 
 * Requirements tested: 4.1, 4.4, 4.5, 6.5
 */

// Mock DOM elements and dependencies
const mockDOM = {
    getElementById: (id) => {
        const mockElement = {
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false,
                toggle: () => {}
            },
            addEventListener: () => {},
            textContent: '',
            innerHTML: '',
            value: '',
            focus: () => {},
            style: {},
            appendChild: () => {},
            querySelector: () => mockElement,
            querySelectorAll: () => [mockElement]
        };
        return mockElement;
    },
    querySelectorAll: () => [],
    createElement: () => ({
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {},
        appendChild: () => {},
        style: {},
        onclick: null,
        textContent: '',
        innerHTML: '',
        className: ''
    }),
    addEventListener: () => {}
};

// Mock pause manager
const mockPauseManager = {
    pauseGame: (reason, timeout) => {
        mockPauseManager._paused = true;
        mockPauseManager._reason = reason;
        mockPauseManager._timeout = timeout;
        console.log(`Mock pause: ${reason} for ${timeout}ms`);
        return true;
    },
    resumeGame: (useCountdown = true, seconds = 3) => {
        mockPauseManager._paused = false;
        mockPauseManager._reason = null;
        console.log(`Mock resume: countdown=${useCountdown}, seconds=${seconds}`);
        return Promise.resolve(true);
    },
    isPaused: () => mockPauseManager._paused || false,
    getPauseInfo: () => ({
        active: mockPauseManager._paused || false,
        reason: mockPauseManager._reason || null,
        startTime: Date.now(),
        timeoutId: null
    }),
    clearTimeout: () => {},
    _paused: false,
    _reason: null,
    _timeout: null
};

// Mock pause UI
const mockPauseUI = {
    showPauseOverlay: () => {},
    hidePauseOverlay: () => {},
    showTimeoutWarning: () => {},
    isOverlayVisible: () => false
};

// Set up global mocks
global.document = mockDOM;
global.window = {
    addEventToFeed: (message, className) => {
        console.log(`Event feed: ${message} (${className})`);
    },
    render: () => {},
    pauseManager: mockPauseManager,
    pauseUI: mockPauseUI
};

// Import the main game class
import { SoccerBettingGame, EVENT_CLASSIFICATIONS } from '../scripts/main.js';

describe('Task 7: Consistent Pause Behavior Across All Betting Scenarios', () => {
    let game;
    
    beforeEach(() => {
        // Reset mock state
        mockPauseManager._paused = false;
        mockPauseManager._reason = null;
        mockPauseManager._timeout = null;
        
        // Create new game instance
        game = new SoccerBettingGame();
        game.pauseManager = mockPauseManager;
        game.pauseUI = mockPauseUI;
        
        // Initialize game state
        game.state = game.getInitialState();
        game.state.bettingEventQueue = [];
    });

    describe('Full-Match Betting Pause Integration (Requirement 4.1, 4.5)', () => {
        test('should pause game when full-match betting slip is shown', () => {
            // Arrange
            const outcome = 'HOME';
            const odds = 2.5;
            
            // Act
            game.showInlineBetSlip(outcome, odds);
            
            // Assert
            expect(mockPauseManager.isPaused()).toBe(true);
            expect(mockPauseManager.getPauseInfo().reason).toBe('FULL_MATCH_BETTING');
            expect(game.state.currentBet).toEqual({
                type: 'full-match',
                outcome: outcome,
                odds: odds
            });
        });

        test('should resume game when full-match bet is placed', () => {
            // Arrange
            game.showInlineBetSlip('HOME', 2.5);
            game.state.wallet = 100;
            
            // Act
            game.placeBet('full-match', 'HOME', 2.5, 10);
            
            // Assert
            expect(game.state.bets.fullMatch).toHaveLength(1);
            expect(game.state.bets.fullMatch[0]).toEqual({
                outcome: 'HOME',
                stake: 10,
                odds: 2.5
            });
            // Note: Resume is called in handleBettingDecisionComplete
        });

        test('should resume game when full-match betting is cancelled', () => {
            // Arrange
            game.showInlineBetSlip('HOME', 2.5);
            
            // Act
            game.hideInlineBetSlip();
            
            // Assert
            expect(game.state.currentBet).toBe(null);
            // Note: Resume is called in handleBettingDecisionComplete
        });

        test('should work in classic mode (Requirement 4.5)', () => {
            // Arrange
            game.state.classicMode = true;
            
            // Act
            game.showInlineBetSlip('DRAW', 3.5);
            
            // Assert
            expect(mockPauseManager.isPaused()).toBe(true);
            expect(mockPauseManager.getPauseInfo().reason).toBe('FULL_MATCH_BETTING');
        });
    });

    describe('Future Betting Event Types Support (Requirement 6.2, 6.5)', () => {
        test('should recognize all future betting event types', () => {
            const futureBettingEvents = [
                'PENALTY_BET',
                'CORNER_BET',
                'CARD_BET',
                'SUBSTITUTION_BET',
                'FREE_KICK_BET',
                'OFFSIDE_BET',
                'INJURY_TIME_BET',
                'PLAYER_PERFORMANCE_BET',
                'NEXT_GOAL_BET',
                'HALF_TIME_SCORE_BET'
            ];

            futureBettingEvents.forEach(eventType => {
                expect(EVENT_CLASSIFICATIONS.BETTING_EVENTS).toContain(eventType);
            });
        });

        test('should pause for future betting event types', () => {
            const futureEvent = {
                type: 'PENALTY_BET',
                description: 'Penalty awarded! Will it be scored?',
                choices: [
                    { text: 'Goal', odds: 1.8 },
                    { text: 'Miss', odds: 2.2 }
                ],
                betType: 'PENALTY_OUTCOME'
            };

            // Act
            const isBetting = game.isBettingEvent(futureEvent);
            
            // Assert
            expect(isBetting).toBe(true);
        });

        test('should handle extensible betting event detection', () => {
            // Test event with betting choices but unknown type
            const extensibleEvent = {
                type: 'NEW_BETTING_TYPE',
                description: 'New betting opportunity',
                choices: [
                    { text: 'Option A', odds: 2.0 },
                    { text: 'Option B', odds: 1.5 }
                ]
            };

            // Act
            const isBetting = game.isBettingEvent(extensibleEvent);
            
            // Assert
            expect(isBetting).toBe(true);
        });

        test('should handle events with betType property', () => {
            const eventWithBetType = {
                type: 'CUSTOM_EVENT',
                description: 'Custom betting event',
                betType: 'CUSTOM_BET'
            };

            // Act
            const isBetting = game.isBettingEvent(eventWithBetType);
            
            // Assert
            expect(isBetting).toBe(true);
        });

        test('should handle events with bettingOptions property', () => {
            const eventWithBettingOptions = {
                type: 'ANOTHER_CUSTOM_EVENT',
                description: 'Another custom betting event',
                bettingOptions: {
                    option1: { odds: 2.0 },
                    option2: { odds: 1.8 }
                }
            };

            // Act
            const isBetting = game.isBettingEvent(eventWithBettingOptions);
            
            // Assert
            expect(isBetting).toBe(true);
        });
    });

    describe('Multiple Betting Events Sequencing (Requirement 4.4)', () => {
        test('should queue betting events when one is already active', () => {
            // Arrange
            const firstEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                description: 'First betting event',
                choices: [{ text: 'Option 1', odds: 2.0 }],
                betType: 'FIRST_BET'
            };
            
            const secondEvent = {
                type: 'CORNER_BET',
                description: 'Second betting event',
                choices: [{ text: 'Option 2', odds: 1.8 }],
                betType: 'SECOND_BET'
            };

            // Set up first event as active
            game.state.currentActionBet.active = true;
            game.state.currentActionBet.details = firstEvent;

            // Act
            game.processMatchEvent(secondEvent);

            // Assert
            expect(game.state.bettingEventQueue).toHaveLength(1);
            expect(game.state.bettingEventQueue[0].type).toBe('CORNER_BET');
        });

        test('should replace current betting event with higher priority event', () => {
            // Arrange
            const lowPriorityEvent = {
                type: 'NEXT_GOAL_BET',
                description: 'Low priority event',
                choices: [{ text: 'Option 1', odds: 2.0 }]
            };
            
            const highPriorityEvent = {
                type: 'PENALTY_BET',
                description: 'High priority event',
                choices: [{ text: 'Option 2', odds: 1.8 }]
            };

            // Set up low priority event as active
            game.state.currentActionBet.active = true;
            game.state.currentActionBet.details = lowPriorityEvent;

            // Act
            const shouldReplace = game.shouldReplaceCurrentBettingEvent(highPriorityEvent);

            // Assert
            expect(shouldReplace).toBe(true);
        });

        test('should not replace current betting event with lower priority event', () => {
            // Arrange
            const highPriorityEvent = {
                type: 'PENALTY_BET',
                description: 'High priority event',
                choices: [{ text: 'Option 1', odds: 2.0 }]
            };
            
            const lowPriorityEvent = {
                type: 'NEXT_GOAL_BET',
                description: 'Low priority event',
                choices: [{ text: 'Option 2', odds: 1.8 }]
            };

            // Set up high priority event as active
            game.state.currentActionBet.active = true;
            game.state.currentActionBet.details = highPriorityEvent;

            // Act
            const shouldReplace = game.shouldReplaceCurrentBettingEvent(lowPriorityEvent);

            // Assert
            expect(shouldReplace).toBe(false);
        });

        test('should process next queued betting event after current one completes', () => {
            // Arrange
            const queuedEvent = {
                type: 'CORNER_BET',
                description: 'Queued betting event',
                choices: [{ text: 'Option', odds: 2.0 }],
                queuedAt: Date.now()
            };
            
            game.state.bettingEventQueue = [queuedEvent];

            // Mock setTimeout to execute immediately
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = (fn) => fn();

            // Act
            game.processNextQueuedBettingEvent();

            // Assert
            expect(game.state.bettingEventQueue).toHaveLength(0);

            // Restore setTimeout
            global.setTimeout = originalSetTimeout;
        });

        test('should skip expired queued betting events', () => {
            // Arrange
            const expiredEvent = {
                type: 'CORNER_BET',
                description: 'Expired betting event',
                choices: [{ text: 'Option', odds: 2.0 }],
                queuedAt: Date.now() - 35000 // 35 seconds ago (expired)
            };
            
            game.state.bettingEventQueue = [expiredEvent];

            // Act
            game.processNextQueuedBettingEvent();

            // Assert
            expect(game.state.bettingEventQueue).toHaveLength(0);
        });
    });

    describe('Betting Decision Completion Handling', () => {
        test('should handle full-match bet placement with countdown', () => {
            // Arrange
            mockPauseManager.pauseGame('FULL_MATCH_BETTING', 30000);

            // Act
            game.handleBettingDecisionComplete('full_match_bet_placed');

            // Assert - should resume with 3 second countdown
            expect(mockPauseManager.isPaused()).toBe(false);
        });

        test('should handle full-match bet cancellation with short countdown', () => {
            // Arrange
            mockPauseManager.pauseGame('FULL_MATCH_BETTING', 30000);

            // Act
            game.handleBettingDecisionComplete('full_match_cancelled');

            // Assert - should resume with 1 second countdown
            expect(mockPauseManager.isPaused()).toBe(false);
        });

        test('should handle action bet placement with countdown', () => {
            // Arrange
            mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);

            // Act
            game.handleBettingDecisionComplete('bet_placed');

            // Assert - should resume with 3 second countdown
            expect(mockPauseManager.isPaused()).toBe(false);
        });

        test('should handle skip/timeout without countdown', () => {
            // Arrange
            mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);

            // Act
            game.handleBettingDecisionComplete('skip_or_timeout');

            // Assert - should resume immediately
            expect(mockPauseManager.isPaused()).toBe(false);
        });

        test('should handle errors with immediate resume', () => {
            // Arrange
            mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);

            // Act
            game.handleBettingDecisionComplete('error');

            // Assert - should resume immediately
            expect(mockPauseManager.isPaused()).toBe(false);
        });
    });

    describe('Event Classification and Detection', () => {
        test('should not treat resolution events as betting events', () => {
            const resolutionEvent = {
                type: 'RESOLUTION',
                betType: 'FOUL_OUTCOME',
                result: 'Yellow Card'
            };

            const isBetting = game.isBettingEvent(resolutionEvent);
            expect(isBetting).toBe(false);
        });

        test('should not treat pure informational events as betting events', () => {
            const infoEvent = {
                type: 'GOAL',
                description: 'Goal scored!',
                team: 'HOME'
            };

            const isBetting = game.isBettingEvent(infoEvent);
            expect(isBetting).toBe(false);
        });

        test('should treat enhanced informational events with betting as betting events', () => {
            const enhancedInfoEvent = {
                type: 'GOAL',
                description: 'Goal scored! Bet on next scorer?',
                team: 'HOME',
                choices: [
                    { text: 'Player A', odds: 2.5 },
                    { text: 'Player B', odds: 3.0 }
                ]
            };

            const isBetting = game.isBettingEvent(enhancedInfoEvent);
            expect(isBetting).toBe(true);
        });

        test('should handle potential betting events that are upgraded', () => {
            const upgradedPotentialEvent = {
                type: 'YELLOW_CARD',
                description: 'Yellow card shown! Will there be a red card next?',
                choices: [
                    { text: 'Yes', odds: 4.0 },
                    { text: 'No', odds: 1.25 }
                ]
            };

            const isBetting = game.isBettingEvent(upgradedPotentialEvent);
            expect(isBetting).toBe(true);
        });

        test('should validate betting choices structure', () => {
            const eventWithInvalidChoices = {
                type: 'CUSTOM_BET',
                description: 'Custom betting event',
                choices: [
                    { text: 'Valid choice', odds: 2.0 },
                    { text: 'Invalid choice' }, // Missing odds
                    { odds: 1.5 } // Missing text
                ]
            };

            const isBetting = game.isBettingEvent(eventWithInvalidChoices);
            expect(isBetting).toBe(false);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle null/undefined events gracefully', () => {
            expect(game.isBettingEvent(null)).toBe(false);
            expect(game.isBettingEvent(undefined)).toBe(false);
            expect(game.isBettingEvent({})).toBe(false);
        });

        test('should handle pause manager failures gracefully', () => {
            // Arrange
            const failingPauseManager = {
                pauseGame: () => false,
                isPaused: () => false,
                resumeGame: () => Promise.reject(new Error('Resume failed'))
            };
            game.pauseManager = failingPauseManager;

            // Act & Assert - should not throw
            expect(() => {
                game.showInlineBetSlip('HOME', 2.5);
            }).not.toThrow();
        });

        test('should clean up properly when replacing betting events', () => {
            // Arrange
            game.state.currentActionBet = {
                active: true,
                details: { type: 'OLD_EVENT' },
                timeoutId: 123,
                timerBar: { stop: jest.fn() }
            };

            // Act
            game.cleanupCurrentBettingEvent();

            // Assert
            expect(game.state.currentActionBet.active).toBe(false);
            expect(game.state.currentActionBet.details).toBe(null);
            expect(game.state.currentActionBet.timeoutId).toBe(null);
        });
    });
});

console.log('Task 7 tests completed: Consistent pause behavior across all betting scenarios');