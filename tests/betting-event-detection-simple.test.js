/**
 * Simple Browser-Compatible Tests for Centralized Betting Event Detection System
 * Tests the isBettingEvent() function and EVENT_CLASSIFICATIONS constant
 */

// Simple test framework
class SimpleTestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    describe(description, testSuite) {
        console.log(`\n=== ${description} ===`);
        testSuite();
    }

    test(description, testFunction) {
        try {
            testFunction();
            console.log(`✅ ${description}`);
            this.results.push({ description, status: 'PASS' });
        } catch (error) {
            console.error(`❌ ${description}: ${error.message}`);
            this.results.push({ description, status: 'FAIL', error: error.message });
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`Expected instance of ${expectedClass.name}, but got ${typeof actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected array to contain ${expected}, but it didn't`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error('Expected value to be defined, but it was undefined');
                }
            },
            not: {
                toThrow: () => {
                    try {
                        if (typeof actual === 'function') {
                            actual();
                        }
                    } catch (error) {
                        throw new Error(`Expected function not to throw, but it threw: ${error.message}`);
                    }
                }
            }
        };
    }

    getSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        console.log(`\n=== Test Summary ===`);
        console.log(`Total: ${this.results.length}, Passed: ${passed}, Failed: ${failed}`);
        return { total: this.results.length, passed, failed, results: this.results };
    }
}

// Mock DOM and global objects for testing
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

// Set up global mocks
if (typeof document === 'undefined') {
    global.document = mockDOM;
}
if (typeof window === 'undefined') {
    global.window = { pauseManager: null, pauseUI: null };
}
if (typeof requestAnimationFrame === 'undefined') {
    global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
}

// Test runner function
async function runBettingEventDetectionTests() {
    const test = new SimpleTestFramework();
    
    // Import the game class and constants
    let SoccerBettingGame, EVENT_CLASSIFICATIONS;
    
    try {
        const gameModule = await import('../scripts/main.js');
        SoccerBettingGame = gameModule.SoccerBettingGame;
        EVENT_CLASSIFICATIONS = gameModule.EVENT_CLASSIFICATIONS;
    } catch (error) {
        console.error('Failed to import game module:', error);
        return;
    }

    test.describe('EVENT_CLASSIFICATIONS constant', () => {
        test.test('should contain BETTING_EVENTS array with known betting event types', () => {
            test.expect(EVENT_CLASSIFICATIONS).toBeDefined();
            test.expect(EVENT_CLASSIFICATIONS.BETTING_EVENTS).toBeInstanceOf(Array);
            test.expect(EVENT_CLASSIFICATIONS.BETTING_EVENTS).toContain('MULTI_CHOICE_ACTION_BET');
        });

        test.test('should contain INFORMATIONAL_EVENTS array with non-betting event types', () => {
            test.expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toBeInstanceOf(Array);
            test.expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toContain('GOAL');
            test.expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toContain('COMMENTARY');
            test.expect(EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS).toContain('KICK_OFF');
        });

        test.test('should contain RESOLUTION_EVENTS array', () => {
            test.expect(EVENT_CLASSIFICATIONS.RESOLUTION_EVENTS).toBeInstanceOf(Array);
            test.expect(EVENT_CLASSIFICATIONS.RESOLUTION_EVENTS).toContain('RESOLUTION');
        });
    });

    test.describe('isBettingEvent() function', () => {
        let game;

        // Set up game instance for each test
        game = new SoccerBettingGame();
        game.pauseManager = {
            pauseGame: () => true,
            resumeGame: () => Promise.resolve(true),
            isPaused: () => false,
            getPauseInfo: () => ({ active: false, reason: null, startTime: null, timeoutId: null })
        };

        test.test('should return true for MULTI_CHOICE_ACTION_BET events', () => {
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

            test.expect(game.isBettingEvent(event)).toBe(true);
        });

        test.test('should return false for GOAL events', () => {
            const event = {
                type: 'GOAL',
                team: 'HOME',
                description: 'GOAL! A stunning strike!'
            };

            test.expect(game.isBettingEvent(event)).toBe(false);
        });

        test.test('should return false for COMMENTARY events', () => {
            const event = {
                type: 'COMMENTARY',
                description: 'A great save by the keeper!'
            };

            test.expect(game.isBettingEvent(event)).toBe(false);
        });

        test.test('should return false for KICK_OFF events', () => {
            const event = {
                type: 'KICK_OFF',
                description: 'The match has kicked off!'
            };

            test.expect(game.isBettingEvent(event)).toBe(false);
        });

        test.test('should return false for RESOLUTION events', () => {
            const event = {
                type: 'RESOLUTION',
                betType: 'FOUL_OUTCOME',
                result: 'YELLOW_CARD',
                description: 'The referee shows a yellow card!'
            };

            test.expect(game.isBettingEvent(event)).toBe(false);
        });

        test.test('should return true for events with betting choices (extensible system)', () => {
            const event = {
                type: 'PENALTY_BET', // Future betting event type
                description: 'Penalty awarded! Will it be scored?',
                choices: [
                    { text: 'Goal', odds: 1.5, result: 'GOAL' },
                    { text: 'Miss', odds: 3.0, result: 'MISS' }
                ]
            };

            test.expect(game.isBettingEvent(event)).toBe(true);
        });

        test.test('should return true for events with betType property', () => {
            const event = {
                type: 'CORNER_BET',
                betType: 'CORNER_OUTCOME',
                description: 'Corner kick awarded!'
            };

            test.expect(game.isBettingEvent(event)).toBe(true);
        });

        test.test('should return true for events with bettingOptions property', () => {
            const event = {
                type: 'SUBSTITUTION_BET',
                bettingOptions: ['Player A', 'Player B', 'Player C'],
                description: 'Substitution incoming!'
            };

            test.expect(game.isBettingEvent(event)).toBe(true);
        });

        test.test('should handle events with missing or null type', () => {
            const event1 = { description: 'Some event' };
            const event2 = { type: null, description: 'Another event' };

            test.expect(game.isBettingEvent(event1)).toBe(false);
            test.expect(game.isBettingEvent(event2)).toBe(false);
        });

        test.test('should handle empty or malformed events', () => {
            test.expect(game.isBettingEvent({})).toBe(false);
            test.expect(game.isBettingEvent(null)).toBe(false);
            test.expect(game.isBettingEvent(undefined)).toBe(false);
        });
    });

    test.describe('processMatchEvent() integration with betting detection', () => {
        let game;

        // Set up game instance
        game = new SoccerBettingGame();
        let pauseGameCalled = false;
        game.pauseManager = {
            pauseGame: (reason, timeout) => {
                pauseGameCalled = true;
                return true;
            },
            resumeGame: () => Promise.resolve(true),
            isPaused: () => false,
            getPauseInfo: () => ({ active: false, reason: null, startTime: null, timeoutId: null })
        };

        test.test('should pause game when betting event is detected', () => {
            const bettingEvent = {
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Crunching tackle near the box!',
                choices: [
                    { text: 'Yellow Card', odds: 2.1, result: 'YELLOW_CARD' }
                ]
            };

            // Mock addEventToFeed to avoid DOM manipulation
            game.addEventToFeed = () => {};
            
            pauseGameCalled = false;
            game.processMatchEvent(bettingEvent);

            test.expect(pauseGameCalled).toBe(true);
        });

        test.test('should not pause game for non-betting events', () => {
            const nonBettingEvent = {
                type: 'GOAL',
                team: 'HOME',
                description: 'GOAL! A stunning strike!'
            };

            // Mock addEventToFeed to avoid DOM manipulation
            game.addEventToFeed = () => {};

            pauseGameCalled = false;
            game.processMatchEvent(nonBettingEvent);

            test.expect(pauseGameCalled).toBe(false);
        });

        test.test('should handle pause system failures gracefully', () => {
            const originalPauseManager = game.pauseManager;
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
            game.addEventToFeed = () => {};

            // Should not throw error
            test.expect(() => game.processMatchEvent(bettingEvent)).not.toThrow();
            
            // Restore pause manager
            game.pauseManager = originalPauseManager;
        });
    });

    test.describe('Extensibility for future betting events', () => {
        let game;

        game = new SoccerBettingGame();

        test.test('should detect betting events based on structure rather than just type', () => {
            const structuralBettingEvent = {
                type: 'UNKNOWN_FUTURE_EVENT',
                choices: [
                    { text: 'Option A', odds: 2.0, result: 'A' },
                    { text: 'Option B', odds: 1.5, result: 'B' }
                ],
                description: 'Future betting opportunity!'
            };

            test.expect(game.isBettingEvent(structuralBettingEvent)).toBe(true);
        });
    });

    return test.getSummary();
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runBettingEventDetectionTests };
} else if (typeof window !== 'undefined') {
    window.runBettingEventDetectionTests = runBettingEventDetectionTests;
}

// Auto-run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runBettingEventDetectionTests().then(summary => {
        process.exit(summary.failed > 0 ? 1 : 0);
    });
}