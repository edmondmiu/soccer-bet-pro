/**
 * MatchScreen Node.js Tests
 * Tests for MatchScreen functionality in Node.js environment
 */

// Mock DOM environment for Node.js
global.document = {
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        children: [],
        parentNode: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        appendChild: (child) => {
            child.parentNode = this;
            this.children.push(child);
            return child;
        },
        removeChild: (child) => {
            const index = this.children.indexOf(child);
            if (index > -1) {
                this.children.splice(index, 1);
                child.parentNode = null;
            }
            return child;
        },
        click: () => {},
        focus: () => {},
        select: () => {},
        dispatchEvent: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        }
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    head: {
        appendChild: () => {}
    },
    body: {
        innerHTML: '',
        appendChild: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => {},
    removeEventListener: () => {}
};

// Import MatchScreen
import { MatchScreen } from './MatchScreen.js';

// Test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0
        };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🏟️ Running MatchScreen Node.js Tests\n');
        
        for (const test of this.tests) {
            this.results.total++;
            
            try {
                await test.fn();
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        const { total, passed, failed } = this.results;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
        
        console.log('\n📊 Test Summary:');
        console.log(`   Total: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Pass Rate: ${passRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n⚠️  ${failed} test(s) failed.`);
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual || !actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected null, but got ${actual}`);
                }
            },
            not: {
                toBe: (expected) => {
                    if (actual === expected) {
                        throw new Error(`Expected not to be ${expected}, but got ${actual}`);
                    }
                },
                toThrow: () => {
                    try {
                        if (typeof actual === 'function') {
                            actual();
                        }
                    } catch (error) {
                        throw new Error(`Expected not to throw, but threw: ${error.message}`);
                    }
                }
            }
        };
    }
}

// Mock dependencies
class MockStateManager {
    constructor() {
        this.state = {
            currentScreen: 'match',
            wallet: 1000,
            classicMode: false,
            match: {
                active: true,
                time: 45,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 1,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
                timeline: [
                    {
                        id: '1',
                        type: 'GOAL',
                        time: 23,
                        description: 'Arsenal scores! Great shot by Smith.',
                        data: { team: 'home', player: 'Smith' }
                    }
                ]
            },
            bets: {
                fullMatch: [
                    {
                        id: 'bet1',
                        type: 'fullMatch',
                        outcome: 'home',
                        stake: 50,
                        odds: 1.85,
                        potentialWinnings: 92.50,
                        status: 'pending',
                        placedAt: Date.now(),
                        powerUpApplied: false
                    }
                ],
                actionBets: []
            },
            powerUp: {
                held: {
                    id: 'power1',
                    type: '2x_multiplier',
                    description: '2x Winnings Multiplier',
                    awardedAt: Date.now()
                },
                applied: false
            },
            betAmountMemory: {
                fullMatch: 25,
                opportunity: 25
            }
        };
    }

    getState() {
        return { ...this.state };
    }

    subscribe(callback) {
        // Mock subscription
    }
}

class MockFullMatchBetting {
    constructor() {
        this.bets = [];
    }

    placeBet(outcome, amount) {
        if (amount <= 0) {
            throw new Error('Invalid bet amount');
        }
        
        const bet = {
            id: `bet_${Date.now()}`,
            outcome,
            amount,
            timestamp: Date.now()
        };
        
        this.bets.push(bet);
        return bet;
    }
}

// Initialize test runner
const runner = new TestRunner();

// Test cases
runner.test('MatchScreen should initialize correctly', () => {
    const matchScreen = new MatchScreen();
    
    runner.expect(matchScreen.element).toBeNull();
    runner.expect(matchScreen.stateManager).toBeNull();
    runner.expect(matchScreen.fullMatchBetting).toBeNull();
    runner.expect(matchScreen.isInitialized).toBe(false);
});

runner.test('MatchScreen should initialize with dependencies', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    const mockFullMatchBetting = new MockFullMatchBetting();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: mockFullMatchBetting
    });
    
    runner.expect(matchScreen.stateManager).toBe(mockStateManager);
    runner.expect(matchScreen.fullMatchBetting).toBe(mockFullMatchBetting);
    runner.expect(matchScreen.isInitialized).toBe(true);
});

runner.test('MatchScreen should render with valid state', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    const element = matchScreen.render(state);
    
    runner.expect(element).toBeTruthy();
    runner.expect(element.id).toBe('match-screen');
    runner.expect(element.className).toBe('match-screen');
});

runner.test('MatchScreen should render error screen with invalid state', () => {
    const matchScreen = new MatchScreen();
    
    const element = matchScreen.render({});
    
    runner.expect(element).toBeTruthy();
    runner.expect(element.className).toContain('error-screen');
});

runner.test('MatchScreen should get correct outcome labels', () => {
    const matchScreen = new MatchScreen();
    const state = {
        match: {
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea'
        }
    };
    
    runner.expect(matchScreen.getOutcomeLabel('home', state)).toBe('Arsenal');
    runner.expect(matchScreen.getOutcomeLabel('away', state)).toBe('Chelsea');
    runner.expect(matchScreen.getOutcomeLabel('draw', state)).toBe('Draw');
    runner.expect(matchScreen.getOutcomeLabel('unknown', state)).toBe('unknown');
});

runner.test('MatchScreen should get correct event CSS classes', () => {
    const matchScreen = new MatchScreen();
    
    runner.expect(matchScreen.getEventClass('GOAL')).toBe('event-goal');
    runner.expect(matchScreen.getEventClass('ACTION_BET')).toBe('event-action-bet');
    runner.expect(matchScreen.getEventClass('RESOLUTION')).toBe('event-resolution');
    runner.expect(matchScreen.getEventClass('COMMENTARY')).toBe('event-commentary');
    runner.expect(matchScreen.getEventClass('UNKNOWN')).toBe('event-default');
});

runner.test('MatchScreen should handle timer updates', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    // Should not throw error even without DOM elements
    runner.expect(() => matchScreen.updateTimer(67)).not.toThrow();
});

runner.test('MatchScreen should handle score updates', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    // Should not throw error even without DOM elements
    runner.expect(() => matchScreen.updateScore(2, 1)).not.toThrow();
});

runner.test('MatchScreen should handle wallet updates', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    // Should not throw error even without DOM elements
    runner.expect(() => matchScreen.updateWallet(750.50)).not.toThrow();
});

runner.test('MatchScreen should handle odds updates', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    const newOdds = { home: 1.50, draw: 4.00, away: 5.00 };
    
    // Should not throw error even without DOM elements
    runner.expect(() => matchScreen.updateOdds(newOdds)).not.toThrow();
});

runner.test('MatchScreen should handle complete state updates', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    const newState = {
        ...state,
        match: {
            ...state.match,
            time: 78,
            homeScore: 3,
            awayScore: 1,
            odds: { home: 1.20, draw: 6.00, away: 8.00 }
        },
        wallet: 1250
    };
    
    // Should not throw error
    runner.expect(() => matchScreen.update(newState)).not.toThrow();
});

runner.test('MatchScreen should handle resize events', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    // Should not throw error
    runner.expect(() => matchScreen.handleResize()).not.toThrow();
});

runner.test('MatchScreen should handle betting form operations', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    // Should not throw errors
    runner.expect(() => matchScreen.showBettingForm('home')).not.toThrow();
    runner.expect(() => matchScreen.closeBettingForm()).not.toThrow();
    runner.expect(() => matchScreen.handlePowerUpUse()).not.toThrow();
});

runner.test('MatchScreen should handle missing dependencies gracefully', () => {
    const matchScreen = new MatchScreen();
    const state = {
        match: {
            active: true,
            time: 45,
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            homeScore: 1,
            awayScore: 0,
            odds: { home: 1.85, draw: 3.50, away: 4.20 },
            timeline: []
        },
        wallet: 1000,
        bets: { fullMatch: [], actionBets: [] },
        powerUp: { held: null, applied: false }
    };
    
    // Should not throw errors without initialization
    runner.expect(() => matchScreen.render(state)).not.toThrow();
    runner.expect(() => matchScreen.update(state)).not.toThrow();
    runner.expect(() => matchScreen.updateTimer(45)).not.toThrow();
});

runner.test('MatchScreen should cleanup resources when destroyed', () => {
    const matchScreen = new MatchScreen();
    const mockStateManager = new MockStateManager();
    
    matchScreen.initialize({
        stateManager: mockStateManager,
        fullMatchBetting: new MockFullMatchBetting()
    });
    
    const state = mockStateManager.getState();
    matchScreen.render(state);
    
    matchScreen.destroy();
    
    runner.expect(matchScreen.element).toBeNull();
    runner.expect(matchScreen.stateManager).toBeNull();
    runner.expect(matchScreen.fullMatchBetting).toBeNull();
    runner.expect(matchScreen.isInitialized).toBe(false);
});

runner.test('MatchScreen should render betting buttons correctly', () => {
    const matchScreen = new MatchScreen();
    const state = {
        match: {
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            odds: { home: 1.85, draw: 3.50, away: 4.20 }
        }
    };
    
    const buttonsHtml = matchScreen.renderBettingButtons(state);
    
    runner.expect(buttonsHtml).toContain('Arsenal');
    runner.expect(buttonsHtml).toContain('Chelsea');
    runner.expect(buttonsHtml).toContain('Draw');
    runner.expect(buttonsHtml).toContain('1.85');
    runner.expect(buttonsHtml).toContain('3.50');
    runner.expect(buttonsHtml).toContain('4.20');
});

runner.test('MatchScreen should render power-up display correctly', () => {
    const matchScreen = new MatchScreen();
    
    // With power-up
    const withPowerUp = matchScreen.renderPowerUpDisplay({
        held: { id: 'power1', type: '2x_multiplier' },
        applied: false
    });
    runner.expect(withPowerUp).toContain('Use Power-Up');
    
    // Without power-up
    const withoutPowerUp = matchScreen.renderPowerUpDisplay({
        held: null,
        applied: false
    });
    runner.expect(withoutPowerUp).toContain('No Power-Up');
});

runner.test('MatchScreen should render current bets correctly', () => {
    const matchScreen = new MatchScreen();
    
    const bets = {
        fullMatch: [
            {
                id: 'bet1',
                outcome: 'home',
                stake: 50,
                odds: 1.85,
                potentialWinnings: 92.50,
                status: 'pending',
                powerUpApplied: false
            }
        ],
        actionBets: []
    };
    
    const betsHtml = matchScreen.renderCurrentBets(bets);
    
    runner.expect(betsHtml).toContain('Full Match Bets');
    runner.expect(betsHtml).toContain('home');
    runner.expect(betsHtml).toContain('$50.00');
    runner.expect(betsHtml).toContain('$92.50');
});

runner.test('MatchScreen should render event feed correctly', () => {
    const matchScreen = new MatchScreen();
    
    const timeline = [
        {
            id: '1',
            type: 'GOAL',
            time: 23,
            description: 'Arsenal scores! Great shot by Smith.',
            outcome: 'Goal scored'
        },
        {
            id: '2',
            type: 'ACTION_BET',
            time: 35,
            description: 'Corner kick opportunity'
        }
    ];
    
    const feedHtml = matchScreen.renderEventFeed(timeline);
    
    runner.expect(feedHtml).toContain('Arsenal scores');
    runner.expect(feedHtml).toContain('Corner kick');
    runner.expect(feedHtml).toContain('23\'');
    runner.expect(feedHtml).toContain('35\'');
});

// Run all tests
runner.run().catch(console.error);