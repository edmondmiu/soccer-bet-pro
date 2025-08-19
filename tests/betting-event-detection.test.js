/**
 * Unit Tests for Centralized Betting Event Detection System
 * Tests the isBettingEvent() function and EVENT_CLASSIFICATIONS constant
 */

// Mock DOM elements for testing
const mockDOM = {
    getElementById: (id) => ({
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        textContent: '',
        innerHTML: '',
        value: '',
        focus: () => {},
        appendChild: () => {},
        scrollTop: 0,
        scrollHeight: 100,
        parentElement: { scrollTop: 0, scrollHeight: 100 }
    }),
    createElement: () => ({
        className: '',
        innerHTML: '',
        textContent: '',
        onclick: null,
        style: {},
        appendChild: () => {}
    }),
    querySelectorAll: () => [],
    querySelector: () => mockDOM.getElementById()
};

// Mock global objects
global.document = mockDOM;
global.window = { pauseManager: null, pauseUI: null };
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.clearInterval = () => {};
global.clearTimeout = () => {};
global.setInterval = () => 1;
global.setTimeout = () => 1;

// Import the main game class
import { SoccerBettingGame } from '../scripts/main.js';

describe('Centralized Betting Event Detection System', () => {
    let game;

    beforeEach(() => {
        game = new SoccerBettingGame();
        // Mock pause system for testing
        game.pauseManager = {
            pauseGame: jest.fn(() => true),
            resumeGame: jest.fn(() => Promise.resolve(true)),
            isPaused: jest.fn(() => false),
            getPauseInfo: jest.fn(() => ({ active: false, reason: null, startTime: null, timeoutId: null }))
        };
    });

    describe('EVENT_CLASSIFICATIONS constant', () => {
        test('should contain BETTING_EVENTS array with known betting event types', () => {
            // Access EVENT_CLASSIFICATIONS through the module
            const { EVENT_CLASSIFICATIONS } = await import('../scripts/main.js');
            
            expect(EVENT_CLASSIFICATIONS).toBeDefined();
            expect(EVENT_CLASSIFICATIONS.BETTING_EVENTS).toBeInstanceOf(Array);
            expect(EVENT_CLASSIFICATIONS.BETTING_EVENTS).toContain('MULTI_CHOICE_ACTION_BET');
        });

        test('should contain INFORMATIONAL_EVENTS array with non-betting event types', () => {
            const { EVENT_CLASSIFICATIONS } = await import('../scripts/main.js');
            
            expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toBeInstanceOf(Array);
            expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toContain('GOAL');
            expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toContain('COMMENTARY');
            expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toContain('KICK_OFF');
        });

        test('should contain RESOLUTION_EVENTS array', () => {
            const { EVENT_CLASSIFICATIONS } = await import('../scripts/main.js');
            
            expect(EVENT_CLASSIFICATIONS.RESOLUTION_EVENTS).toBeInstanceOf(Array);
            expect(EVENT_CLASSIFICATIONS.RESOLUTION_EVENTS).toContain('RESOLUTION');
        });
    });

    describe('isBettingEvent() function', () => {
        test('should return true for MULTI_CHOICE_ACTION_BET events', () => {
            const event = {
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Crunching tackle near the box! What will the ref do?',
                choices: [
                    { text: 'Yellow Card', odds: 2.1, result: 'YELLOW_CARD' },
                    { text: 'Red Card', odds: 4.5, result: 'RED_CARD' },
                    { text: 'No Card', odds: 1.8, result: 'NO_CARD' }
                ]
            };

            expect(game.isBettingEvent(event)).toBe(true);
        });

        test('should return false for GOAL events', () => {
            const event = {
                type: 'GOAL',
                team: 'HOME',
                description: 'GOAL! A stunning strike!'
            };

            expect(game.isBettingEvent(event)).toBe(false);
        });

        test('should return false for COMMENTARY events', () => {
            const event = {
                type: 'COMMENTARY',
                description: 'A great save by the keeper!'
            };

            expect(game.isBettingEvent(event)).toBe(false);
        });

        test('should return false for KICK_OFF events', () => {
            const event = {
                type: 'KICK_OFF',
                description: 'The match has kicked off!'
            };

            expect(game.isBettingEvent(event)).toBe(false);
        });

        test('should return false for RESOLUTION events', () => {
            const event = {
                type: 'RESOLUTION',
                betType: 'FOUL_OUTCOME',
                result: 'YELLOW_CARD',
                description: 'The referee shows a yellow card!'
            };

            expect(game.isBettingEvent(event)).toBe(false);
        });

        test('should return true for events with betting choices (extensible system)', () => {
            const event = {
                type: 'PENALTY_BET', // Future betting event type
                description: 'Penalty awarded! Will it be scored?',
                choices: [
                    { text: 'Goal', odds: 1.5, result: 'GOAL' },
                    { text: 'Miss', odds: 3.0, result: 'MISS' }
                ]
            };

            expect(game.isBettingEvent(event)).toBe(true);
        });

        test('should return true for events with betType property', () => {
            const event = {
                type: 'CORNER_BET',
                betType: 'CORNER_OUTCOME',
                description: 'Corner kick awarded!'
            };

            expect(game.isBettingEvent(event)).toBe(true);
        });

        test('should return true for events with bettingOptions property', () => {
            const event = {
                type: 'SUBSTITUTION_BET',
                bettingOptions: ['Player A', 'Player B', 'Player C'],
                description: 'Substitution incoming!'
            };

            expect(game.isBettingEvent(event)).toBe(true);
        });

        test('should handle events with missing or null type', () => {
            const event1 = { description: 'Some event' };
            const event2 = { type: null, description: 'Another event' };

            expect(game.isBettingEvent(event1)).toBe(false);
            expect(game.isBettingEvent(event2)).toBe(false);
        });

        test('should handle empty or malformed events', () => {
            expect(game.isBettingEvent({})).toBe(false);
            expect(game.isBettingEvent(null)).toBe(false);
            expect(game.isBettingEvent(undefined)).toBe(false);
        });
    });

    describe('processMatchEvent() integration with betting detection', () => {
        test('should pause game when betting event is detected', () => {
            const bettingEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Crunching tackle near the box!',
                choices: [
                    { text: 'Yellow Card', odds: 2.1, result: 'YELLOW_CARD' }
                ]
            };

            // Mock addEventToFeed to avoid DOM manipulation
            game.addEventToFeed = jest.fn();

            game.processMatchEvent(bettingEvent);

            expect(game.pauseManager.pauseGame).toHaveBeenCalledWith('BETTING_OPPORTUNITY', 15000);
        });

        test('should not pause game for non-betting events', () => {
            const nonBettingEvent = {
                type: 'GOAL',
                team: 'HOME',
                description: 'GOAL! A stunning strike!'
            };

            // Mock addEventToFeed to avoid DOM manipulation
            game.addEventToFeed = jest.fn();

            game.processMatchEvent(nonBettingEvent);

            expect(game.pauseManager.pauseGame).not.toHaveBeenCalled();
        });

        test('should not pause if game is already paused', () => {
            game.pauseManager.isPaused.mockReturnValue(true);

            const bettingEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Crunching tackle near the box!',
                choices: [
                    { text: 'Yellow Card', odds: 2.1, result: 'YELLOW_CARD' }
                ]
            };

            // Mock addEventToFeed to avoid DOM manipulation
            game.addEventToFeed = jest.fn();

            game.processMatchEvent(bettingEvent);

            expect(game.pauseManager.pauseGame).not.toHaveBeenCalled();
        });

        test('should handle pause system failures gracefully', () => {
            game.pauseManager = null; // Simulate pause system failure

            const bettingEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Crunching tackle near the box!',
                choices: [
                    { text: 'Yellow Card', odds: 2.1, result: 'YELLOW_CARD' }
                ]
            };

            // Mock addEventToFeed to avoid DOM manipulation
            game.addEventToFeed = jest.fn();

            // Should not throw error
            expect(() => game.processMatchEvent(bettingEvent)).not.toThrow();
        });
    });

    describe('Extensibility for future betting events', () => {
        test('should automatically detect new betting event types added to EVENT_CLASSIFICATIONS', () => {
            // Simulate adding a new betting event type
            const { EVENT_CLASSIFICATIONS } = require('../scripts/main.js');
            EVENT_CLASSIFICATIONS.BETTING_EVENTS.push('PENALTY_BET');

            const newBettingEvent = {
                type: 'PENALTY_BET',
                description: 'Penalty awarded!'
            };

            expect(game.isBettingEvent(newBettingEvent)).toBe(true);
        });

        test('should detect betting events based on structure rather than just type', () => {
            const structuralBettingEvent = {
                type: 'UNKNOWN_FUTURE_EVENT',
                choices: [
                    { text: 'Option A', odds: 2.0, result: 'A' },
                    { text: 'Option B', odds: 1.5, result: 'B' }
                ],
                description: 'Future betting opportunity!'
            };

            expect(game.isBettingEvent(structuralBettingEvent)).toBe(true);
        });
    });
});