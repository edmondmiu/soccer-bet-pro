/**
 * EventManager Tests
 * Tests for event coordination and timeline management
 */

import { EventManager } from './EventManager.js';
import { StateManager } from './StateManager.js';

// Mock StateManager for testing
class MockStateManager {
    constructor() {
        this.state = {
            match: {
                time: 0,
                homeScore: 0,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                timeline: [],
                eventFeed: []
            }
        };
        this.subscribers = [];
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        if (updates.match) {
            this.state.match = { ...this.state.match, ...updates.match };
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

// Test suite for EventManager
describe('EventManager', () => {
    let eventManager;
    let mockStateManager;

    beforeEach(() => {
        mockStateManager = new MockStateManager();
        eventManager = new EventManager(mockStateManager);
        
        // Mock DOM events
        global.document = {
            dispatchEvent: jest.fn()
        };
        global.CustomEvent = jest.fn();
    });

    afterEach(() => {
        eventManager.stopEventProcessing();
    });

    describe('Timeline Generation', () => {
        test('should generate a timeline with events', () => {
            const timeline = eventManager.generateTimeline();
            
            expect(Array.isArray(timeline)).toBe(true);
            expect(timeline.length).toBeGreaterThan(0);
            expect(mockStateManager.getState().match.timeline).toEqual(timeline);
        });

        test('should generate events with proper structure', () => {
            const timeline = eventManager.generateTimeline();
            
            timeline.forEach(event => {
                expect(event).toHaveProperty('id');
                expect(event).toHaveProperty('type');
                expect(event).toHaveProperty('time');
                expect(event).toHaveProperty('description');
                expect(event).toHaveProperty('data');
                expect(typeof event.time).toBe('number');
                expect(event.time).toBeGreaterThanOrEqual(0);
                expect(event.time).toBeLessThanOrEqual(90);
            });
        });

        test('should sort events by time', () => {
            const timeline = eventManager.generateTimeline();
            
            for (let i = 1; i < timeline.length; i++) {
                expect(timeline[i].time).toBeGreaterThanOrEqual(timeline[i-1].time);
            }
        });
    });

    describe('Event Processing', () => {
        test('should process events when match time advances', () => {
            // Generate timeline with events
            eventManager.generateTimeline();
            
            // Mock match time advancement
            mockStateManager.updateState({
                match: { ...mockStateManager.getState().match, time: 15 }
            });

            // Spy on processEvent method
            const processEventSpy = jest.spyOn(eventManager, 'processEvent');
            
            // Check for events
            eventManager.checkForEvents();
            
            // Should have processed events that occurred before minute 15
            const timeline = mockStateManager.getState().match.timeline;
            const eventsToProcess = timeline.filter(event => event.time <= 15);
            
            expect(processEventSpy).toHaveBeenCalledTimes(eventsToProcess.length);
        });

        test('should not process future events', () => {
            // Generate timeline
            eventManager.generateTimeline();
            
            // Set match time to early in the game
            mockStateManager.updateState({
                match: { ...mockStateManager.getState().match, time: 5 }
            });

            const processEventSpy = jest.spyOn(eventManager, 'processEvent');
            
            eventManager.checkForEvents();
            
            // Should only process events at or before minute 5
            const timeline = mockStateManager.getState().match.timeline;
            const futureEvents = timeline.filter(event => event.time > 5);
            
            futureEvents.forEach(event => {
                expect(processEventSpy).not.toHaveBeenCalledWith(event);
            });
        });
    });

    describe('Goal Event Processing', () => {
        test('should update score when processing goal event', () => {
            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 25,
                description: 'Goal!',
                data: { team: 'home', player: 'Test Player' }
            };

            eventManager.processGoalEvent(goalEvent);
            
            const state = mockStateManager.getState();
            expect(state.match.homeScore).toBe(1);
            expect(state.match.awayScore).toBe(0);
        });

        test('should update odds after goal', () => {
            const initialOdds = mockStateManager.getState().match.odds;
            
            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 25,
                description: 'Goal!',
                data: { team: 'home', player: 'Test Player' }
            };

            eventManager.processGoalEvent(goalEvent);
            
            const newOdds = mockStateManager.getState().match.odds;
            expect(newOdds.home).toBeLessThan(initialOdds.home); // Home odds should decrease
            expect(newOdds.away).toBeGreaterThan(initialOdds.away); // Away odds should increase
        });

        test('should trigger goal event', () => {
            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 25,
                description: 'Goal!',
                data: { team: 'home', player: 'Test Player' }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');
            
            eventManager.processGoalEvent(goalEvent);
            
            expect(triggerEventSpy).toHaveBeenCalledWith('goal', expect.objectContaining({
                team: 'home',
                player: 'Test Player',
                time: 25
            }));
        });
    });

    describe('Action Bet Event Processing', () => {
        test('should trigger action betting opportunity', () => {
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

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');
            
            eventManager.processActionBetEvent(actionBetEvent);
            
            expect(triggerEventSpy).toHaveBeenCalledWith('actionBettingOpportunity', expect.objectContaining({
                eventData: actionBetEvent,
                choices: actionBetEvent.data.choices
            }));
        });

        test('should schedule action bet resolution', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 30,
                description: 'Corner kick opportunity',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 }
                    ]
                }
            };

            const scheduleResolutionSpy = jest.spyOn(eventManager, 'scheduleActionBetResolution');
            
            eventManager.processActionBetEvent(actionBetEvent);
            
            expect(scheduleResolutionSpy).toHaveBeenCalledWith(actionBetEvent);
        });

        test('should schedule resolution event 4 minutes after action bet', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 30,
                description: 'Corner kick opportunity',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 }
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
        });
    });

    describe('Commentary Event Processing', () => {
        test('should trigger commentary event', () => {
            const commentaryEvent = {
                id: 'test_commentary',
                type: 'COMMENTARY',
                time: 20,
                description: 'Good passing move in midfield',
                data: { category: 'possession' }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');
            
            eventManager.processCommentaryEvent(commentaryEvent);
            
            expect(triggerEventSpy).toHaveBeenCalledWith('commentary', expect.objectContaining({
                description: commentaryEvent.description,
                time: commentaryEvent.time
            }));
        });
    });

    describe('Event Feed Management', () => {
        test('should add events to event feed', () => {
            const event = {
                id: 'test_event',
                type: 'COMMENTARY',
                time: 15,
                description: 'Test event'
            };

            eventManager.addToEventFeed(event);
            
            const state = mockStateManager.getState();
            expect(state.match.eventFeed).toHaveLength(1);
            expect(state.match.eventFeed[0]).toMatchObject({
                id: event.id,
                time: event.time,
                type: event.type,
                description: event.description
            });
        });

        test('should limit event feed to 20 events', () => {
            // Add 25 events
            for (let i = 0; i < 25; i++) {
                const event = {
                    id: `test_event_${i}`,
                    type: 'COMMENTARY',
                    time: i,
                    description: `Test event ${i}`
                };
                eventManager.addToEventFeed(event);
            }
            
            const state = mockStateManager.getState();
            expect(state.match.eventFeed).toHaveLength(20);
        });
    });

    describe('Event Scheduling', () => {
        test('should schedule custom events', () => {
            const customEvent = {
                id: 'custom_event',
                type: 'COMMENTARY',
                description: 'Custom scheduled event',
                data: {}
            };

            eventManager.scheduleEvent(customEvent, 45);
            
            const state = mockStateManager.getState();
            const scheduledEvent = state.match.timeline.find(e => e.id === 'custom_event');
            
            expect(scheduledEvent).toBeDefined();
            expect(scheduledEvent.time).toBe(45);
        });

        test('should maintain timeline sorting after scheduling', () => {
            // Generate initial timeline
            eventManager.generateTimeline();
            
            // Schedule event in the middle
            const customEvent = {
                id: 'custom_event',
                type: 'COMMENTARY',
                description: 'Custom event',
                data: {}
            };
            
            eventManager.scheduleEvent(customEvent, 45);
            
            const timeline = mockStateManager.getState().match.timeline;
            
            // Verify timeline is still sorted
            for (let i = 1; i < timeline.length; i++) {
                expect(timeline[i].time).toBeGreaterThanOrEqual(timeline[i-1].time);
            }
        });
    });

    describe('Odds Calculation', () => {
        test('should calculate correct odds for home team leading', () => {
            const newOdds = eventManager.calculateNewOdds(2, 0);
            
            expect(newOdds.home).toBeLessThan(1.85); // Home odds should decrease
            expect(newOdds.away).toBeGreaterThan(4.20); // Away odds should increase
            expect(newOdds.draw).toBeGreaterThan(3.50); // Draw odds should increase
        });

        test('should calculate correct odds for away team leading', () => {
            const newOdds = eventManager.calculateNewOdds(0, 2);
            
            expect(newOdds.away).toBeLessThan(4.20); // Away odds should decrease
            expect(newOdds.home).toBeGreaterThan(1.85); // Home odds should increase
            expect(newOdds.draw).toBeGreaterThan(3.50); // Draw odds should increase
        });

        test('should keep odds reasonable within bounds', () => {
            const newOdds = eventManager.calculateNewOdds(5, 0);
            
            expect(newOdds.home).toBeGreaterThanOrEqual(1.20); // Minimum odds
            expect(newOdds.away).toBeLessThanOrEqual(8.00); // Maximum odds
            expect(newOdds.draw).toBeLessThanOrEqual(5.00); // Maximum draw odds
        });
    });

    describe('Event Resolution', () => {
        test('should resolve action bet with random outcome', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 20,
                description: 'Penalty kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Penalty scored', odds: 1.4 },
                        { outcome: 'save', description: 'Penalty saved', odds: 4.8 }
                    ]
                }
            };

            const resolutionEvent = {
                id: 'resolution_test_action_bet',
                type: 'RESOLUTION',
                time: 24,
                data: {
                    originalEventId: actionBetEvent.id,
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            const triggerEventSpy = jest.spyOn(eventManager, 'triggerEvent');
            
            eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

            expect(triggerEventSpy).toHaveBeenCalledWith('actionBetResolution', 
                expect.objectContaining({
                    originalEvent: actionBetEvent,
                    eventId: actionBetEvent.id,
                    winningOutcome: expect.any(String)
                })
            );
        });

        test('should get resolution statistics', () => {
            // Add some events to timeline
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
                            id: 'resolution_1',
                            type: 'RESOLUTION',
                            time: 14,
                            data: { resolved: true }
                        }
                    ]
                }
            });

            const stats = eventManager.getResolutionStatistics();

            expect(stats.totalActionBets).toBe(1);
            expect(stats.totalResolutions).toBe(1);
            expect(stats.resolvedCount).toBe(1);
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

            const result = eventManager.forceResolution('force_test', 'save');

            expect(result.success).toBe(true);
            expect(result.outcome).toBe('save');
        });
    });

    describe('Utility Methods', () => {
        test('should get next upcoming event', () => {
            eventManager.generateTimeline();
            eventManager.currentEventIndex = 0;
            
            const nextEvent = eventManager.getNextEvent();
            const timeline = mockStateManager.getState().match.timeline;
            
            expect(nextEvent).toEqual(timeline[0]);
        });

        test('should return null when no more events', () => {
            eventManager.generateTimeline();
            const timeline = mockStateManager.getState().match.timeline;
            eventManager.currentEventIndex = timeline.length;
            
            const nextEvent = eventManager.getNextEvent();
            
            expect(nextEvent).toBeNull();
        });

        test('should filter events by type', () => {
            eventManager.generateTimeline();
            
            const goalEvents = eventManager.getEventsByType('GOAL');
            
            goalEvents.forEach(event => {
                expect(event.type).toBe('GOAL');
            });
        });

        test('should reset properly', () => {
            eventManager.generateTimeline();
            eventManager.startEventProcessing();
            eventManager.currentEventIndex = 5;
            
            eventManager.reset();
            
            expect(eventManager.currentEventIndex).toBe(0);
            expect(eventManager.eventProcessingTimer).toBeNull();
            expect(eventManager.resolutionTimers.size).toBe(0);
        });
    });
});

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
    // Node.js environment - can run with a test runner
    console.log('EventManager tests defined. Run with a test runner like Jest.');
}