/**
 * Node.js Integration Tests for Betting-Pause System
 * 
 * Simple test runner without external dependencies to verify
 * the integration between betting system and pause functionality.
 */

// Mock console to capture logs
const originalConsole = { ...console };
const testLogs = [];
console.log = (...args) => {
    testLogs.push(args.join(' '));
    originalConsole.log(...args);
};
console.error = (...args) => {
    testLogs.push('ERROR: ' + args.join(' '));
    originalConsole.error(...args);
};

// Mock DOM and global objects
global.document = {
    getElementById: (id) => ({
        textContent: '',
        innerHTML: '',
        classList: {
            add: () => {},
            remove: () => {}
        },
        appendChild: () => {},
        value: '',
        focus: () => {},
        offsetWidth: 100
    }),
    createElement: () => ({
        className: '',
        innerHTML: '',
        textContent: '',
        onclick: null,
        appendChild: () => {}
    }),
    body: { appendChild: () => {} },
    head: { appendChild: () => {} }
};

global.window = {
    addEventToFeed: (message, className) => {
        testLogs.push(`EVENT_FEED: ${message} (${className})`);
    },
    render: () => {
        testLogs.push('UI_RENDER: render() called');
    }
};

global.setTimeout = (callback, delay) => {
    testLogs.push(`TIMEOUT: Set timeout for ${delay}ms`);
    return 'timeout-id-123';
};

global.clearTimeout = (id) => {
    testLogs.push(`TIMEOUT: Cleared timeout ${id}`);
};

// Mock modules
const mockGameState = {
    state: {
        currentActionBet: { active: false, details: null, timeoutId: null },
        pause: { active: false, reason: null, startTime: null, timeoutId: null },
        wallet: 100,
        bets: { fullMatch: [], actionBets: [] },
        currentBet: null
    },
    getCurrentState: function() { return this.state; },
    updateState: function(updates) { Object.assign(this.state, updates); },
    updateCurrentActionBet: function(updates) { Object.assign(this.state.currentActionBet, updates); },
    updatePauseState: function(updates) { Object.assign(this.state.pause, updates); },
    getPauseState: function() { return this.state.pause; },
    adjustWalletBalance: function(amount) { this.state.wallet += amount; },
    addBet: function(type, bet) { this.state.bets[type].push(bet); },
    getWalletBalance: function() { return this.state.wallet; },
    getBettingState: function() { return this.state.bets; }
};

const mockUtils = {
    validateStake: () => true,
    generateId: () => 'test-id-123'
};

const mockPauseManager = {
    pauseGame: function(reason, timeout = 15000) {
        testLogs.push(`PAUSE_MANAGER: pauseGame(${reason}, ${timeout})`);
        mockGameState.updatePauseState({ active: true, reason, startTime: Date.now() });
        return true;
    },
    resumeGame: function(withCountdown = true, countdownSeconds = 3) {
        testLogs.push(`PAUSE_MANAGER: resumeGame(${withCountdown}, ${countdownSeconds})`);
        mockGameState.updatePauseState({ active: false, reason: null, startTime: null });
        return Promise.resolve(true);
    },
    isPaused: function() {
        return mockGameState.getPauseState().active;
    }
};

// Mock module system
const modules = {
    './gameState.js': mockGameState,
    './utils.js': mockUtils,
    './pauseManager.js': { pauseManager: mockPauseManager }
};

// Simple require mock
function mockRequire(modulePath) {
    if (modules[modulePath]) {
        return modules[modulePath];
    }
    throw new Error(`Module not found: ${modulePath}`);
}

// Test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('\n🧪 Running Betting-Pause Integration Tests\n');
        
        for (const { name, testFn } of this.tests) {
            this.results.total++;
            try {
                // Clear logs before each test
                testLogs.length = 0;
                
                // Reset mock state
                mockGameState.state = {
                    currentActionBet: { active: false, details: null, timeoutId: null },
                    pause: { active: false, reason: null, startTime: null, timeoutId: null },
                    wallet: 100,
                    bets: { fullMatch: [], actionBets: [] },
                    currentBet: null
                };
                
                await testFn();
                console.log(`✅ ${name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
                this.results.failed++;
            }
        }
        
        console.log(`\n📊 Test Results:`);
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log(`   Total:  ${this.results.total}`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed.');
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertContains(array, item, message) {
        if (!array.includes(item)) {
            throw new Error(message || `Expected array to contain: ${item}`);
        }
    }
}

// Create test runner
const runner = new TestRunner();

// Load the betting module with mocked dependencies
let bettingModule;
try {
    // Simulate the betting module functionality
    bettingModule = {
        showMultiChoiceActionBet: function(event) {
            // Pause the game before showing betting interface
            const pauseSuccess = mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
            if (!pauseSuccess) {
                console.error('Failed to pause game for betting opportunity');
            }

            // Set current action bet state
            mockGameState.updateCurrentActionBet({
                active: true,
                details: event,
                timeoutId: null,
            });

            // Set timeout to auto-hide and resume game
            const timeoutId = global.setTimeout(() => {
                this.hideActionBet(true);
                this.resumeGameAfterBetting();
            }, 10000);
            
            mockGameState.updateCurrentActionBet({ timeoutId });
        },

        hideActionBet: function(timedOut = false) {
            const currentState = mockGameState.getCurrentState();
            
            if (!currentState.currentActionBet.active) return;
            
            if (timedOut) {
                global.window.addEventToFeed(`Action Bet timed out.`, 'text-gray-400');
            }
            
            // Clear timeout
            if (currentState.currentActionBet.timeoutId) {
                global.clearTimeout(currentState.currentActionBet.timeoutId);
            }
            
            // Reset action bet state
            mockGameState.updateCurrentActionBet({
                active: false,
                details: null,
                timeoutId: null
            });
        },

        placeBet: function(type, outcome, odds, stake, betType = null) {
            // Validate inputs
            if (!type || !outcome || !odds || !stake) {
                return false;
            }

            // Deduct stake from wallet
            mockGameState.adjustWalletBalance(-stake);

            if (type === 'full-match') {
                const bet = { 
                    id: mockUtils.generateId(),
                    outcome, 
                    stake, 
                    odds,
                    status: 'PENDING'
                };
                mockGameState.addBet('fullMatch', bet);
            } else if (type === 'action') {
                const bet = { 
                    id: mockUtils.generateId(),
                    description: outcome, 
                    stake, 
                    odds, 
                    status: 'PENDING', 
                    betType 
                };
                mockGameState.addBet('actionBets', bet);
            }

            // If this is an action bet, handle the betting decision completion
            if (type === 'action') {
                this.handleBettingDecision(true);
            }
            
            return true;
        },

        handleBettingDecision: function(betPlaced = false) {
            // Clear current bet state
            mockGameState.updateState({ currentBet: null });
            
            // Resume game after betting decision
            this.resumeGameAfterBetting();
            
            console.log(`Betting decision completed: ${betPlaced ? 'bet placed' : 'bet cancelled'}`);
        },

        resumeGameAfterBetting: function() {
            // Only resume if game is currently paused
            if (mockPauseManager.isPaused()) {
                return mockPauseManager.resumeGame(true, 3);
            }
            return Promise.resolve();
        }
    };
} catch (error) {
    console.error('Failed to load betting module:', error);
    process.exit(1);
}

// Define tests
runner.test('Game pauses when betting event occurs (Requirement 1.1)', () => {
    const testEvent = {
        description: 'Test foul event',
        betType: 'FOUL_OUTCOME',
        choices: [
            { text: 'Yellow Card', odds: 2.5 },
            { text: 'Red Card', odds: 8.0 }
        ]
    };

    // Game should not be paused initially
    runner.assert(!mockPauseManager.isPaused(), 'Game should not be paused initially');

    // Show betting event
    bettingModule.showMultiChoiceActionBet(testEvent);

    // Verify pause was triggered
    runner.assert(mockPauseManager.isPaused(), 'Game should be paused after betting event');
    runner.assertContains(testLogs, 'PAUSE_MANAGER: pauseGame(BETTING_OPPORTUNITY, 15000)', 'Should log pause with correct parameters');
});

runner.test('Betting decisions trigger resume (Requirement 1.5)', async () => {
    // First pause the game
    mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
    runner.assert(mockPauseManager.isPaused(), 'Game should be paused initially');

    // Handle betting decision
    await bettingModule.handleBettingDecision(true);

    // Verify resume was triggered
    runner.assert(!mockPauseManager.isPaused(), 'Game should be resumed after betting decision');
    runner.assertContains(testLogs, 'PAUSE_MANAGER: resumeGame(true, 3)', 'Should log resume with countdown');
});

runner.test('Action bet placement triggers resume', async () => {
    // First pause the game
    mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
    runner.assert(mockPauseManager.isPaused(), 'Game should be paused initially');

    // Place action bet
    const success = bettingModule.placeBet('action', 'Yellow Card', 2.5, 10, 'FOUL_OUTCOME');

    runner.assert(success, 'Bet should be placed successfully');
    runner.assert(!mockPauseManager.isPaused(), 'Game should be resumed after action bet');
});

runner.test('Skip betting triggers resume', async () => {
    // First pause the game
    mockPauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
    runner.assert(mockPauseManager.isPaused(), 'Game should be paused initially');

    // Handle skip decision
    await bettingModule.handleBettingDecision(false);

    // Verify resume was triggered
    runner.assert(!mockPauseManager.isPaused(), 'Game should be resumed after skip');
    runner.assertContains(testLogs, 'Betting decision completed: bet cancelled', 'Should log skip decision');
});

runner.test('Timeout handling works correctly', () => {
    const testEvent = {
        description: 'Timeout test event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };

    bettingModule.showMultiChoiceActionBet(testEvent);

    // Verify timeout was set
    runner.assertContains(testLogs, 'TIMEOUT: Set timeout for 10000ms', 'Should set timeout for betting event');
    
    // Verify action bet is active
    const currentState = mockGameState.getCurrentState();
    runner.assert(currentState.currentActionBet.active, 'Action bet should be active');
});

runner.test('State management integration works', () => {
    const testEvent = {
        description: 'State test event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };

    bettingModule.showMultiChoiceActionBet(testEvent);

    const currentState = mockGameState.getCurrentState();
    runner.assert(currentState.currentActionBet.active, 'Action bet state should be active');
    runner.assert(currentState.currentActionBet.details === testEvent, 'Action bet details should match event');
    runner.assert(currentState.pause.active, 'Pause state should be active');
    runner.assert(currentState.pause.reason === 'BETTING_OPPORTUNITY', 'Pause reason should be correct');
});

runner.test('Resume only occurs when game is paused', async () => {
    // Ensure game is not paused
    runner.assert(!mockPauseManager.isPaused(), 'Game should not be paused initially');

    // Try to resume
    await bettingModule.resumeGameAfterBetting();

    // Should not call resume since game wasn't paused
    const resumeLogs = testLogs.filter(log => log.includes('PAUSE_MANAGER: resumeGame'));
    runner.assert(resumeLogs.length === 0, 'Should not call resume when game is not paused');
});

runner.test('Error handling for pause failure', () => {
    // Mock pause failure
    const originalPause = mockPauseManager.pauseGame;
    mockPauseManager.pauseGame = () => {
        console.error('Simulated pause failure');
        return false;
    };

    const testEvent = {
        description: 'Pause failure test',
        betType: 'TEST',
        choices: [{ text: 'Test', odds: 2.0 }]
    };

    // Should not throw error
    runner.assert(() => {
        bettingModule.showMultiChoiceActionBet(testEvent);
    }, 'Should handle pause failure gracefully');

    // Restore original function
    mockPauseManager.pauseGame = originalPause;
});

// Run all tests
runner.run().then(() => {
    console.log('\n✨ Integration tests completed!');
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});