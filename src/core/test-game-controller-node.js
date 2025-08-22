/**
 * GameController Node.js Test Runner
 * Runs GameController integration tests in Node.js environment
 */

// Mock browser environment for Node.js
const mockBrowserEnvironment = () => {
    // Mock DOM
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
        dispatchEvent: () => true,
        head: { appendChild: () => {} },
        body: { appendChild: () => {} }
    };
    
    // Mock window
    global.window = {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { reload: () => {} }
    };
    
    // Mock CustomEvent
    global.CustomEvent = class CustomEvent {
        constructor(type, options = {}) {
            this.type = type;
            this.detail = options.detail || {};
        }
    };
    
    // Mock Audio
    global.Audio = class Audio {
        constructor() {
            this.volume = 1;
            this.muted = false;
        }
        play() { return Promise.resolve(); }
        pause() {}
        load() {}
    };
};

// Initialize browser mocks
mockBrowserEnvironment();

// Import GameController after mocking
import { GameController } from './GameController.js';

// Test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    describe(suiteName, testFn) {
        console.log(`\n📋 ${suiteName}`);
        console.log('='.repeat(50));
        
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null
        };

        const context = {
            test: (testName, testFn) => {
                suite.tests.push({
                    name: testName,
                    fn: testFn,
                    suite: suiteName
                });
            },
            beforeEach: (fn) => {
                suite.beforeEach = fn;
            },
            afterEach: (fn) => {
                suite.afterEach = fn;
            }
        };

        testFn.call(context, context);
        this.tests.push(suite);
    }

    async runTests() {
        console.log('🎮 GameController Integration Tests');
        console.log('=====================================\n');
        
        for (const suite of this.tests) {
            await this.runSuite(suite);
        }
        
        this.printSummary();
    }

    async runSuite(suite) {
        for (const test of suite.tests) {
            await this.runTest(test, suite);
        }
    }

    async runTest(test, suite) {
        process.stdout.write(`  ${test.name}... `);
        
        this.results.total++;
        
        try {
            // Setup
            let testContext = {};
            if (suite.beforeEach) {
                testContext = await suite.beforeEach() || {};
            }
            
            // Run test
            await test.fn.call(testContext);
            
            // Cleanup
            if (suite.afterEach) {
                await suite.afterEach.call(testContext);
            }
            
            console.log('✅ PASSED');
            this.results.passed++;
        } catch (error) {
            console.log('❌ FAILED');
            console.log(`     Error: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({
                test: `${suite.name} > ${test.name}`,
                error: error.message,
                stack: error.stack
            });
        }
    }

    printSummary() {
        console.log('\n📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\n🚨 Failed Tests:');
            this.results.errors.forEach((error, index) => {
                console.log(`\n${index + 1}. ${error.test}`);
                console.log(`   ${error.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('💥 Some tests failed!');
            process.exit(1);
        }
    }
}

// Test assertions
const expect = (actual) => ({
    toBe: (expected) => {
        if (actual !== expected) {
            throw new Error(`Expected ${actual} to be ${expected}`);
        }
    },
    toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
    },
    toBeDefined: () => {
        if (actual === undefined) {
            throw new Error(`Expected ${actual} to be defined`);
        }
    },
    toBeNull: () => {
        if (actual !== null) {
            throw new Error(`Expected ${actual} to be null`);
        }
    },
    toBeGreaterThan: (expected) => {
        if (actual <= expected) {
            throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
    },
    toContain: (expected) => {
        if (!actual.includes(expected)) {
            throw new Error(`Expected ${actual} to contain ${expected}`);
        }
    },
    toBeInstanceOf: (expected) => {
        if (!(actual instanceof expected)) {
            throw new Error(`Expected ${actual} to be instance of ${expected.name}`);
        }
    }
});

// Initialize test runner
const testRunner = new TestRunner();

// Define tests
testRunner.describe('GameController Initialization', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should initialize successfully', async function() {
        const result = await this.gameController.initialize();
        expect(result.success).toBe(true);
        expect(this.gameController.isInitialized).toBe(true);
        expect(this.gameController.gamePhase).toBe('lobby');
    });

    this.test('should initialize all required modules', async function() {
        await this.gameController.initialize();
        
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
            expect(this.gameController.modules[moduleName]).toBeDefined();
        });
    });

    this.test('should setup module connections', async function() {
        await this.gameController.initialize();
        
        // Check timer callbacks are set
        expect(this.gameController.modules.timerManager.callbacks.onMatchTimeUpdate).toBeDefined();
        expect(this.gameController.modules.timerManager.callbacks.onCountdownUpdate).toBeDefined();
        expect(this.gameController.modules.timerManager.callbacks.onCountdownComplete).toBeDefined();
    });
});

testRunner.describe('Match Lifecycle Management', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        await this.gameController.initialize();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should start match successfully', async function() {
        const matchData = {
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            odds: { home: 1.85, draw: 3.50, away: 4.20 }
        };
        
        const result = await this.gameController.startMatch(matchData);
        
        expect(result.success).toBe(true);
        expect(this.gameController.gamePhase).toBe('match');
        expect(this.gameController.currentMatch).toEqual(matchData);
        
        const state = this.gameController.modules.stateManager.getState();
        expect(state.match.active).toBe(true);
        expect(state.match.homeTeam).toBe('Team A');
        expect(state.match.awayTeam).toBe('Team B');
        expect(state.currentScreen).toBe('match');
    });

    this.test('should not start match if not in lobby phase', async function() {
        this.gameController.gamePhase = 'match';
        
        const matchData = {
            homeTeam: 'Team A',
            awayTeam: 'Team B'
        };
        
        const result = await this.gameController.startMatch(matchData);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('not in lobby phase');
    });

    this.test('should pause match for action betting', function() {
        this.gameController.gamePhase = 'match';
        
        const eventData = {
            id: 'event_1',
            description: 'Test action betting event',
            choices: [
                { outcome: 'choice1', odds: 2.0, description: 'Choice 1' }
            ]
        };
        
        const result = this.gameController.pauseForActionBet(eventData);
        
        expect(result.success).toBe(true);
        expect(this.gameController.gamePhase).toBe('paused');
    });

    this.test('should resume match after pause', function() {
        this.gameController.gamePhase = 'paused';
        
        const result = this.gameController.resumeMatch();
        
        expect(result.success).toBe(true);
        expect(this.gameController.gamePhase).toBe('match');
    });

    this.test('should end match successfully', async function() {
        this.gameController.gamePhase = 'match';
        
        // Set up match state
        this.gameController.modules.stateManager.updateState({
            match: {
                active: true,
                homeScore: 2,
                awayScore: 1
            }
        });
        
        const result = await this.gameController.endMatch();
        
        expect(result.success).toBe(true);
        expect(result.outcome).toBe('home');
        expect(this.gameController.gamePhase).toBe('ended');
    });

    this.test('should return to lobby successfully', function() {
        this.gameController.gamePhase = 'match';
        this.gameController.currentMatch = { homeTeam: 'A', awayTeam: 'B' };
        
        const result = this.gameController.returnToLobby();
        
        expect(result.success).toBe(true);
        expect(this.gameController.gamePhase).toBe('lobby');
        expect(this.gameController.currentMatch).toBeNull();
    });
});

testRunner.describe('Betting Integration', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        await this.gameController.initialize();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should place bet successfully', async function() {
        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 25,
            odds: 1.85
        };
        
        const result = await this.gameController.placeBet(betData);
        
        expect(result.success).toBe(true);
        expect(result.bet).toBeDefined();
        expect(result.bet.stake).toBe(25);
        expect(result.bet.outcome).toBe('home');
        
        // Check wallet was updated
        const state = this.gameController.modules.stateManager.getState();
        expect(state.wallet).toBe(975); // 1000 - 25
    });

    this.test('should handle bet placement errors', async function() {
        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 2000, // More than wallet balance
            odds: 1.85
        };
        
        const result = await this.gameController.placeBet(betData);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    this.test('should update bet amount memory after successful bet', async function() {
        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        };
        
        await this.gameController.placeBet(betData);
        
        const memory = this.gameController.modules.stateManager.getBetAmountMemory('fullMatch');
        expect(memory).toBe(50);
    });
});

testRunner.describe('Error Handling and Recovery', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        await this.gameController.initialize();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should handle errors gracefully', function() {
        const error = new Error('Test error');
        
        const result = this.gameController.handleError('test', error);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Test error');
        expect(this.gameController.errorRecoveryAttempts).toBe(1);
    });

    this.test('should attempt recovery based on context', function() {
        this.gameController.gamePhase = 'match';
        const error = new Error('Match start error');
        
        const result = this.gameController.handleError('matchStart', error);
        
        expect(result.recovered).toBe(true);
        expect(this.gameController.gamePhase).toBe('lobby');
    });

    this.test('should reset game after max recovery attempts', function() {
        this.gameController.errorRecoveryAttempts = 3;
        const error = new Error('Critical error');
        
        const result = this.gameController.handleError('critical', error);
        
        expect(this.gameController.gamePhase).toBe('lobby');
        expect(this.gameController.currentMatch).toBeNull();
        expect(this.gameController.errorRecoveryAttempts).toBe(0);
    });
});

testRunner.describe('Event Handling', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        await this.gameController.initialize();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should handle action betting opportunity', function() {
        this.gameController.gamePhase = 'match';
        
        const eventData = {
            eventData: {
                id: 'event_1',
                description: 'Test event',
                choices: []
            }
        };
        
        // Should not throw error
        this.gameController.handleActionBettingOpportunity(eventData);
        expect(this.gameController.gamePhase).toBe('paused');
    });

    this.test('should handle goal events', function() {
        const eventData = {
            team: 'home',
            player: 'Player 1',
            time: 25,
            newScore: '1-0'
        };
        
        // Should not throw error
        this.gameController.handleGoalEvent(eventData);
    });

    this.test('should determine match outcome correctly', function() {
        expect(this.gameController.determineMatchOutcome(2, 1)).toBe('home');
        expect(this.gameController.determineMatchOutcome(1, 2)).toBe('away');
        expect(this.gameController.determineMatchOutcome(1, 1)).toBe('draw');
    });
});

testRunner.describe('Complete Game Flow Integration', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        await this.gameController.initialize();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should execute complete match flow', async function() {
        // 1. Start match
        const matchData = {
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            odds: { home: 1.85, draw: 3.50, away: 4.20 }
        };
        
        const startResult = await this.gameController.startMatch(matchData);
        expect(startResult.success).toBe(true);
        
        // 2. Place full-match bet
        const fullMatchBet = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 50,
            odds: 1.85
        };
        
        const betResult = await this.gameController.placeBet(fullMatchBet);
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
        
        this.gameController.handleActionBettingOpportunity(actionEvent);
        expect(this.gameController.gamePhase).toBe('paused');
        
        // 4. Resume match
        const resumeResult = this.gameController.resumeMatch();
        expect(resumeResult.success).toBe(true);
        
        // 5. End match
        this.gameController.modules.stateManager.updateState({
            'match.homeScore': 2,
            'match.awayScore': 1
        });
        
        const endResult = await this.gameController.endMatch();
        expect(endResult.success).toBe(true);
        expect(endResult.outcome).toBe('home');
        
        // 6. Return to lobby
        const lobbyResult = this.gameController.returnToLobby();
        expect(lobbyResult.success).toBe(true);
        expect(this.gameController.gamePhase).toBe('lobby');
    });

    this.test('should maintain session continuity', async function() {
        // Start with initial wallet
        const initialState = this.gameController.modules.stateManager.getState();
        expect(initialState.wallet).toBe(1000);
        
        // Place and win a bet
        const betData = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 100,
            odds: 2.0
        };
        
        await this.gameController.placeBet(betData);
        
        // Simulate winning
        this.gameController.modules.bettingManager.resolveBets('home', 'fullMatch');
        
        const afterBetState = this.gameController.modules.stateManager.getState();
        expect(afterBetState.wallet).toBe(1100); // 1000 - 100 + 200
        
        // Return to lobby (should preserve wallet)
        this.gameController.returnToLobby();
        
        const finalState = this.gameController.modules.stateManager.getState();
        expect(finalState.wallet).toBe(1100);
    });
});

testRunner.describe('Status and Cleanup', function() {
    this.beforeEach(async function() {
        this.gameController = new GameController();
        await this.gameController.initialize();
        return this;
    });

    this.afterEach(function() {
        if (this.gameController) {
            this.gameController.destroy();
        }
    });

    this.test('should get comprehensive status', function() {
        const status = this.gameController.getStatus();
        
        expect(status.isInitialized).toBe(true);
        expect(status.gamePhase).toBe('lobby');
        expect(status.modules).toBeInstanceOf(Array);
        expect(status.modules.length).toBeGreaterThan(0);
        expect(status.state).toBeDefined();
    });

    this.test('should cleanup resources on destroy', function() {
        const moduleCount = Object.keys(this.gameController.modules).length;
        expect(moduleCount).toBeGreaterThan(0);
        
        this.gameController.destroy();
        
        expect(Object.keys(this.gameController.modules).length).toBe(0);
        expect(this.gameController.isInitialized).toBe(false);
        expect(this.gameController.eventListeners.size).toBe(0);
    });
});

// Run tests
testRunner.runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});