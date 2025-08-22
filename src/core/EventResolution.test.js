/**
 * Event Resolution System Tests
 * Tests for action bet resolution timing, outcome determination, and payout processing
 */

import { EventManager } from './EventManager.js';
import { StateManager } from './StateManager.js';
import { BettingManager } from '../betting/BettingManager.js';

// Mock StateManager for testing
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            match: {
                time: 0,
                homeScore: 0,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                timeline: [],
                eventFeed: []
            },
            bets: {
                fullMatch: [],
                actionBets: []
            },
            powerUp: {
                held: null,
                applied: false
            }
        };
        this.subscribers = [];
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    updateState(updates) {
        if (updates.match) {
            this.state.match = { ...this.state.match, ...updates.match };
        }
        if (updates.bets) {
            this.state.bets = { ...this.state.bets, ...updates.bets };
        }
        if (updates.wallet !== undefined) {
            this.state.wallet = updates.wallet;
        }
        this.notifySubscribers();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }
}

// Mock PowerUpManager
class MockPowerUpManager {
    awardPowerUp() {
        return { success: true, powerUp: { type: '2x_multiplier' } };
    }
}

// Test suite for Event Resolution System
describe('Event Resolution System', () => {
    let eventManager;
    let bettingManager;
    let mockStateManager;
    let mockPowerUpManager;

    beforeEach(() => {
        mockStateManager = new MockStateManager();
        mockPowerUpManager = new MockPowerUpManager();
        eventManager = new EventManager(mockStateManager);
        bettingManager = new BettingManager(mockStateManager, mockPowerUpManager);
        
        // Mock DOM events
        global.document = {
            dispatchEvent: jest.fn()
        };
        global.CustomEvent = jest.fn();
        
        // Mock console methods
        global.console = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        };
    });

    afterEach(() => {
        eventManager.stopEventProcessing();
    });

    describe('Action Bet Resolution Scheduling', () => {
        test('should schedule resolution 4 minutes after action bet event', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 30,
                description: 'Corner kick opportunity',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 },
                        { outcome: 'cleared', description: 'Corner cleared', odds: 1.6 }
                    ]
                }
            };

            eventManager.scheduleActionBetResolution(actionBetEvent);
            
            const state = mockStateManager.getState();
            const resolutionEvent = state.match.timeline.find(event => 
                event.type === 'RESOLUTION' && 
                event.data.originalEventId === actionBetEvent.id
            );

            expect(resolutionEvent).toBeDefined();
            expect(resolutionEvent.time).toBe(34); // 30 + 4 minutes
            expect(resolutionEvent.data.originalEventId).toBe(actionBetEvent.id);
        });

        test('should create resolution event with correct structure', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 15,
                description: 'Free kick opportunity',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Direct goal', odds: 5.0 }
                    ]
                }
            };

            eventManager.scheduleActionBetResolution(actionBetEvent);
            
            const state = mockStateManager.getState();
            const resolutionEvent = state.match.timeline.find(event => 
                event.type === 'RESOLUTION'
            );

            expect(resolutionEvent).toMatchObject({
                id: `resolution_${actionBetEvent.id}`,
                type: 'RESOLUTION',
                time: 19,
                description: `Resolving: ${actionBetEvent.description}`,
                data: {
                    originalEventId: actionBetEvent.id,
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            });
        });
    });

    describe('Action Bet Resolution Processing', () => {
        test('should resolve action bet with random outcome', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 20,
                description: 'Penalty kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Penalty scored', odds: 1.4 },
                        { outcome: 'save', description: 'Penalty saved', odds: 4.8 },
                        { outcome: 'miss', description: 'Penalty missed', odds: 6.2 }
                    ]
                }
            };

            const resolutionEvent = {
                id: 'resolution_test_action_bet',
                type: 'RESOLUTION',
                time: 24,
                description: 'Resolving: Penalty kick',
                data: {
                    originalEventId: actionBetEvent.id,
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');
            const addToEventFeedSpy = jest.spyOn(eventManager, 'addToEventFeed');

            eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

            // Should trigger resolution event
            expect(triggerEventSpy).toHaveBeenCalledWith('actionBetResolution', 
                expect.objectContaining({
                    originalEvent: actionBetEvent,
                    eventId: actionBetEvent.id,
                    winningOutcome: expect.any(String)
                })
            );

            // Should add to event feed
            expect(addToEventFeedSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: expect.stringContaining('✅'),
                    data: expect.objectContaining({
                        resolved: true,
                        winningOutcome: expect.any(String)
                    })
                })
            );
        });

        test('should select outcome from available choices', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 45,
                description: 'Corner kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 },
                        { outcome: 'cleared', description: 'Corner cleared', odds: 1.6 }
                    ]
                }
            };

            const resolutionEvent = {
                id: 'resolution_test_action_bet',
                type: 'RESOLUTION',
                time: 49,
                data: {
                    originalEventId: actionBetEvent.id,
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');

            eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

            const triggerCall = triggerEventSpy.mock.calls.find(call => 
                call[0] === 'actionBetResolution'
            );
            
            expect(triggerCall).toBeDefined();
            const eventData = triggerCall[1];
            const winningOutcome = eventData.winningOutcome;
            
            // Should be one of the available outcomes
            const validOutcomes = actionBetEvent.data.choices.map(choice => choice.outcome);
            expect(validOutcomes).toContain(winningOutcome);
        });
    });

    describe('Goal Event Processing with Enhanced Data', () => {
        test('should update score and odds when processing goal', () => {
            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 25,
                description: 'Goal!',
                data: { 
                    team: 'home', 
                    player: 'Test Player',
                    goalType: 'header'
                }
            };

            const initialOdds = mockStateManager.getState().match.odds;

            eventManager.processGoalEvent(goalEvent);
            
            const state = mockStateManager.getState();
            
            // Score should be updated
            expect(state.match.homeScore).toBe(1);
            expect(state.match.awayScore).toBe(0);
            
            // Odds should be recalculated
            expect(state.match.odds.home).toBeLessThan(initialOdds.home);
            expect(state.match.odds.away).toBeGreaterThan(initialOdds.away);
        });

        test('should trigger goal event with enhanced data', () => {
            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 60,
                description: 'Goal!',
                data: { 
                    team: 'away', 
                    player: 'Away Player',
                    goalType: 'volley'
                }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');

            eventManager.processGoalEvent(goalEvent);

            expect(triggerEventSpy).toHaveBeenCalledWith('goal', 
                expect.objectContaining({
                    team: 'away',
                    player: 'Away Player',
                    previousScore: '0-0',
                    newScore: '0-1',
                    previousOdds: expect.any(Object),
                    newOdds: expect.any(Object),
                    goalType: 'volley'
                })
            );
        });
    });

    describe('Commentary Event Processing', () => {
        test('should process commentary without betting impact', () => {
            const commentaryEvent = {
                id: 'test_commentary',
                type: 'COMMENTARY',
                time: 35,
                description: 'Good passing move in midfield',
                data: { 
                    category: 'possession',
                    intensity: 'medium'
                }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');
            const initialState = mockStateManager.getState();

            eventManager.processCommentaryEvent(commentaryEvent);

            // Should trigger commentary event
            expect(triggerEventSpy).toHaveBeenCalledWith('commentary', 
                expect.objectContaining({
                    description: commentaryEvent.description,
                    time: commentaryEvent.time,
                    category: 'possession',
                    intensity: 'medium'
                })
            );

            // Should not affect match state (score, odds, etc.)
            const newState = mockStateManager.getState();
            expect(newState.match.homeScore).toBe(initialState.match.homeScore);
            expect(newState.match.awayScore).toBe(initialState.match.awayScore);
            expect(newState.match.odds).toEqual(initialState.match.odds);
        });
    });

    describe('Event Feed Updates', () => {
        test('should add action bet events to feed with betting indicator', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 40,
                description: 'Free kick opportunity',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Direct goal', odds: 5.0 }
                    ]
                }
            };

            eventManager.processActionBetEvent(actionBetEvent);

            const state = mockStateManager.getState();
            const feedEntry = state.match.eventFeed.find(entry => 
                entry.id === actionBetEvent.id
            );

            expect(feedEntry).toBeDefined();
            expect(feedEntry.description).toContain('🎯');
            expect(feedEntry.data.isBettingOpportunity).toBe(true);
        });

        test('should add resolution results to feed', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 50,
                description: 'Corner kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 },
                        { outcome: 'cleared', description: 'Corner cleared', odds: 1.6 }
                    ]
                }
            };

            const resolutionEvent = {
                id: 'resolution_test_action_bet',
                type: 'RESOLUTION',
                time: 54,
                data: {
                    originalEventId: actionBetEvent.id,
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

            const state = mockStateManager.getState();
            const resolutionFeedEntry = state.match.eventFeed.find(entry => 
                entry.id === resolutionEvent.id
            );

            expect(resolutionFeedEntry).toBeDefined();
            expect(resolutionFeedEntry.description).toContain('✅');
            expect(resolutionFeedEntry.data.resolved).toBe(true);
        });

        test('should add goal events to feed with score update', () => {
            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 70,
                description: 'Goal!',
                data: { 
                    team: 'home', 
                    player: 'Home Player'
                }
            };

            eventManager.processGoalEvent(goalEvent);

            const state = mockStateManager.getState();
            const goalFeedEntry = state.match.eventFeed.find(entry => 
                entry.id === goalEvent.id
            );

            expect(goalFeedEntry).toBeDefined();
            expect(goalFeedEntry.description).toContain('⚽');
            expect(goalFeedEntry.description).toContain('(1-0)');
        });
    });

    describe('Resolution Statistics and Management', () => {
        test('should track pending resolutions', () => {
            // Create action bet events
            const actionBet1 = {
                id: 'action_bet_1',
                type: 'ACTION_BET',
                time: 20,
                data: { choices: [{ outcome: 'goal', description: 'Goal', odds: 3.0 }] }
            };

            const actionBet2 = {
                id: 'action_bet_2',
                type: 'ACTION_BET',
                time: 40,
                data: { choices: [{ outcome: 'save', description: 'Save', odds: 2.0 }] }
            };

            // Schedule resolutions
            eventManager.scheduleActionBetResolution(actionBet1);
            eventManager.scheduleActionBetResolution(actionBet2);

            const pendingResolutions = eventManager.getPendingResolutions();
            
            expect(pendingResolutions).toHaveLength(2);
            expect(pendingResolutions[0].time).toBe(24); // 20 + 4
            expect(pendingResolutions[1].time).toBe(44); // 40 + 4
        });

        test('should provide resolution statistics', () => {
            // Add some action bet events to timeline
            mockStateManager.updateState({
                match: {
                    ...mockStateManager.getState().match,
                    timeline: [
                        {
                            id: 'action_1',
                            type: 'ACTION_BET',
                            time: 10,
                            data: { choices: [] }
                        },
                        {
                            id: 'action_2',
                            type: 'ACTION_BET',
                            time: 30,
                            data: { choices: [] }
                        },
                        {
                            id: 'resolution_1',
                            type: 'RESOLUTION',
                            time: 14,
                            data: { resolved: true }
                        },
                        {
                            id: 'resolution_2',
                            type: 'RESOLUTION',
                            time: 34,
                            data: { resolved: false }
                        }
                    ]
                }
            });

            const stats = eventManager.getResolutionStatistics();

            expect(stats).toMatchObject({
                totalActionBets: 2,
                totalResolutions: 2,
                resolvedCount: 1,
                pendingCount: 1,
                resolutionRate: '50.0'
            });
        });

        test('should force resolution with specific outcome', () => {
            const actionBetEvent = {
                id: 'force_test',
                type: 'ACTION_BET',
                time: 60,
                description: 'Penalty kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Penalty scored', odds: 1.4 },
                        { outcome: 'save', description: 'Penalty saved', odds: 4.8 }
                    ]
                }
            };

            // Add to timeline
            mockStateManager.updateState({
                match: {
                    ...mockStateManager.getState().match,
                    timeline: [actionBetEvent]
                }
            });

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');

            const result = eventManager.forceResolution('force_test', 'save');

            expect(result.success).toBe(true);
            expect(result.outcome).toBe('save');

            // Should trigger resolution with forced outcome
            const resolutionCall = triggerEventSpy.mock.calls.find(call => 
                call[0] === 'actionBetResolution'
            );
            
            expect(resolutionCall[1].winningOutcome).toBe('save');
        });
    });

    describe('Integration with Betting System', () => {
        test('should resolve action bets when resolution event is processed', (done) => {
            // Place an action bet
            const betData = {
                type: 'actionBet',
                outcome: 'goal',
                stake: 50,
                odds: 4.5,
                eventId: 'test_action_bet'
            };

            const betResult = bettingManager.placeBet(betData);
            expect(betResult.success).toBe(true);

            // Listen for resolution event
            document.addEventListener('game:actionBetResolution', (event) => {
                const { winningOutcome, eventId } = event.detail;
                
                // Resolve bets through betting manager
                const resolutionResult = bettingManager.resolveBets(
                    winningOutcome, 
                    'actionBet', 
                    eventId
                );

                expect(resolutionResult.success).toBe(true);
                expect(resolutionResult.resolvedBets).toBe(1);

                const state = mockStateManager.getState();
                const resolvedBet = state.bets.actionBets[0];
                
                if (winningOutcome === 'goal') {
                    expect(resolvedBet.status).toBe('won');
                    expect(state.wallet).toBe(1000 - 50 + (50 * 4.5)); // Initial - stake + winnings
                } else {
                    expect(resolvedBet.status).toBe('lost');
                    expect(state.wallet).toBe(950); // Initial - stake
                }

                done();
            });

            // Create and process action bet event
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 30,
                description: 'Corner kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 },
                        { outcome: 'cleared', description: 'Corner cleared', odds: 1.6 }
                    ]
                }
            };

            const resolutionEvent = {
                id: 'resolution_test_action_bet',
                type: 'RESOLUTION',
                time: 34,
                data: {
                    originalEventId: 'test_action_bet',
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            // Process resolution
            eventManager.resolveActionBet(actionBetEvent, resolutionEvent);
        });
    });

    describe('Event Processing Timing', () => {
        test('should process events in correct chronological order', () => {
            // Create timeline with mixed event types
            const timeline = [
                {
                    id: 'goal_1',
                    type: 'GOAL',
                    time: 15,
                    description: 'Early goal',
                    data: { team: 'home', player: 'Player 1' }
                },
                {
                    id: 'action_1',
                    type: 'ACTION_BET',
                    time: 25,
                    description: 'Corner kick',
                    data: { choices: [{ outcome: 'goal', description: 'Goal', odds: 4.0 }] }
                },
                {
                    id: 'resolution_1',
                    type: 'RESOLUTION',
                    time: 29,
                    data: {
                        originalEventId: 'action_1',
                        resolutionType: 'actionBet'
                    }
                },
                {
                    id: 'commentary_1',
                    type: 'COMMENTARY',
                    time: 35,
                    description: 'Good play',
                    data: { category: 'possession' }
                }
            ];

            mockStateManager.updateState({
                match: {
                    ...mockStateManager.getState().match,
                    timeline: timeline,
                    time: 40 // Current match time
                }
            });

            const processEventSpy = jest.spyOn(eventManager, 'processEvent');
            
            eventManager.checkForEvents();

            // All events should be processed in order
            expect(processEventSpy).toHaveBeenCalledTimes(4);
            
            const processedEvents = processEventSpy.mock.calls.map(call => call[0]);
            expect(processedEvents[0].time).toBe(15);
            expect(processedEvents[1].time).toBe(25);
            expect(processedEvents[2].time).toBe(29);
            expect(processedEvents[3].time).toBe(35);
        });
    });
});

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
    console.log('Event Resolution tests defined. Run with a test runner like Jest.');
}