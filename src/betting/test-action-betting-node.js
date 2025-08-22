#!/usr/bin/env node

/**
 * Node.js Test Runner for ActionBetting
 * Comprehensive testing of action betting functionality
 */

import { ActionBetting } from './ActionBetting.js';

// Test framework utilities
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🎯 ActionBetting Test Suite');
        console.log('=' .repeat(50));

        for (const { name, testFn } of this.tests) {
            try {
                console.log(`\n🧪 ${name}`);
                await testFn();
                console.log(`✅ PASSED: ${name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ FAILED: ${name}`);
                console.log(`   Error: ${error.message}`);
                this.results.failed++;
                this.results.errors.push({ test: name, error: error.message });
            }
            this.results.total++;
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Summary');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach(({ test, error }) => {
                console.log(`  - ${test}: ${error}`);
            });
        }

        console.log('\n' + (this.results.failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
    }
}

// Mock dependencies
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            betAmountMemory: {
                opportunity: 25
            },
            bets: {
                actionBet: []
            }
        };
        this.observers = [];
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyObservers();
    }

    getBetAmountMemory(type) {
        return this.state.betAmountMemory[type] || 25;
    }

    updateBetAmountMemory(type, amount) {
        this.state.betAmountMemory[type] = amount;
        this.updateState({});
    }

    subscribe(callback) {
        this.observers.push(callback);
        return () => {
            const index = this.observers.indexOf(callback);
            if (index > -1) this.observers.splice(index, 1);
        };
    }

    notifyObservers() {
        this.observers.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }
}

class MockTimerManager {
    constructor() {
        this.isPaused = false;
        this.countdownTime = 0;
        this.callbacks = {};
        this.countdownCallback = null;
        this.countdownInterval = null;
    }

    pauseTimer() {
        this.isPaused = true;
    }

    resumeTimer() {
        this.isPaused = false;
    }

    startCountdown(duration, callback) {
        this.countdownTime = duration;
        this.countdownCallback = callback;
        
        // Simulate countdown in test environment
        this.countdownInterval = setInterval(() => {
            this.countdownTime -= 0.1;
            
            if (this.callbacks.onCountdownUpdate) {
                this.callbacks.onCountdownUpdate(Math.max(0, this.countdownTime));
            }

            if (this.countdownTime <= 0) {
                this.stopCountdown();
                if (callback) callback();
                if (this.callbacks.onCountdownComplete) {
                    this.callbacks.onCountdownComplete();
                }
            }
        }, 10); // Fast countdown for testing
        
        console.log(`Mock countdown started: ${duration} seconds`);
    }

    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        this.countdownTime = 0;
    }

    getCountdownTime() {
        return Math.max(0, this.countdownTime);
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    getStatus() {
        return {
            match: { isPaused: this.isPaused },
            countdown: { remainingTime: this.countdownTime }
        };
    }

    // Test helper
    simulateCountdownComplete() {
        if (this.countdownCallback) {
            this.countdownCallback();
        }
        if (this.callbacks.onCountdownComplete) {
            this.callbacks.onCountdownComplete();
        }
    }
}

class MockBettingManager {
    constructor() {
        this.bets = [];
        this.betIdCounter = 1;
        this.shouldFail = false;
    }

    placeBet(betData) {
        if (this.shouldFail) {
            return { success: false, error: 'Insufficient funds' };
        }

        const bet = {
            id: `bet_${this.betIdCounter++}`,
            ...betData,
            placedAt: Date.now(),
            potentialWinnings: betData.stake * betData.odds
        };
        
        this.bets.push(bet);
        return { success: true, bet };
    }

    setShouldFail(shouldFail) {
        this.shouldFail = shouldFail;
    }

    getBets() {
        return [...this.bets];
    }
}

// Assertion helpers
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertNotEqual(actual, unexpected, message) {
    if (actual === unexpected) {
        throw new Error(message || `Expected not ${unexpected}, got ${actual}`);
    }
}

function assertTruthy(value, message) {
    if (!value) {
        throw new Error(message || `Expected truthy value, got ${value}`);
    }
}

function assertFalsy(value, message) {
    if (value) {
        throw new Error(message || `Expected falsy value, got ${value}`);
    }
}

// Test suite
const runner = new TestRunner();

// Sample event data for tests
const sampleEvent = {
    id: 'test_event_1',
    description: 'Corner kick for Home Team',
    choices: [
        { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' },
        { id: 'choice_2', description: 'No goal', odds: 1.3, outcome: 'no_goal' }
    ]
};

runner.test('ActionBetting initialization', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    assertFalsy(actionBetting.isModalActive(), 'Modal should not be active initially');
    assertEqual(actionBetting.getCurrentEvent(), null, 'Current event should be null initially');
    assertEqual(actionBetting.getPrePopulatedAmount(), 25, 'Default pre-populated amount should be 25');
});

runner.test('Show action betting modal', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    let modalShown = false;
    actionBetting.setCallbacks({
        onModalShow: (event) => {
            modalShown = true;
            assertEqual(event.id, sampleEvent.id, 'Event ID should match');
        }
    });

    const result = await actionBetting.showActionBettingModal(sampleEvent);

    assert(result.success, 'Modal show should succeed');
    assert(actionBetting.isModalActive(), 'Modal should be active');
    assert(mockTimerManager.isPaused, 'Timer should be paused');
    assert(modalShown, 'Modal show callback should be called');
    assertEqual(mockTimerManager.countdownTime, 10, 'Countdown should be 10 seconds');
});

runner.test('Reject modal show when already open', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    await actionBetting.showActionBettingModal(sampleEvent);
    const result = await actionBetting.showActionBettingModal(sampleEvent);

    assertFalsy(result.success, 'Second modal show should fail');
    assertEqual(result.error, 'Modal already open', 'Error message should be correct');
});

runner.test('Place action bet successfully', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    let betPlaced = false;
    actionBetting.setCallbacks({
        onBetPlaced: (bet, choice) => {
            betPlaced = true;
            assertEqual(bet.outcome, 'goal', 'Bet outcome should match choice');
            assertEqual(choice.description, 'Goal from corner', 'Choice description should match');
        }
    });

    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.placeBet('choice_1', 50);

    assert(result.success, 'Bet placement should succeed');
    assertTruthy(result.bet, 'Bet object should be returned');
    assertEqual(result.bet.type, 'actionBet', 'Bet type should be actionBet');
    assertEqual(result.bet.outcome, 'goal', 'Bet outcome should match choice');
    assertEqual(result.bet.stake, 50, 'Bet stake should match input');
    assertEqual(result.bet.odds, 3.5, 'Bet odds should match choice');
    assertEqual(result.bet.eventId, sampleEvent.id, 'Event ID should match');
    
    assertFalsy(actionBetting.isModalActive(), 'Modal should close after bet placement');
    assert(betPlaced, 'Bet placed callback should be called');
    assertEqual(mockStateManager.getBetAmountMemory('opportunity'), 50, 'Bet amount memory should be updated');
});

runner.test('Reject invalid choice', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.placeBet('invalid_choice', 50);

    assertFalsy(result.success, 'Invalid choice should be rejected');
    assertEqual(result.error, 'Invalid choice selected', 'Error message should be correct');
});

runner.test('Handle betting manager failure', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    mockBettingManager.setShouldFail(true);
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.placeBet('choice_1', 50);

    assertFalsy(result.success, 'Bet should fail when betting manager fails');
    assertEqual(result.error, 'Insufficient funds', 'Error message should match betting manager error');
});

runner.test('Skip betting successfully', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    let skipCalled = false;
    actionBetting.setCallbacks({
        onSkip: (event) => {
            skipCalled = true;
            assertEqual(event.id, sampleEvent.id, 'Event ID should match in skip callback');
        }
    });

    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.skipBetting();

    assert(result.success, 'Skip should succeed');
    assertFalsy(actionBetting.isModalActive(), 'Modal should close after skip');
    assert(skipCalled, 'Skip callback should be called');
});

runner.test('Reject skip when no modal open', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    const result = actionBetting.skipBetting();

    assertFalsy(result.success, 'Skip should fail when no modal is open');
    assertEqual(result.error, 'No active betting opportunity to skip', 'Error message should be correct');
});

runner.test('Handle timeout correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    let timeoutCalled = false;
    actionBetting.setCallbacks({
        onTimeout: (event) => {
            timeoutCalled = true;
            assertEqual(event.id, sampleEvent.id, 'Event ID should match in timeout callback');
        }
    });

    await actionBetting.showActionBettingModal(sampleEvent);
    
    // Simulate timeout
    mockTimerManager.simulateCountdownComplete();

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    assertFalsy(actionBetting.isModalActive(), 'Modal should close after timeout');
    assert(timeoutCalled, 'Timeout callback should be called');
});

runner.test('Countdown updates', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    let countdownUpdates = [];
    actionBetting.setCallbacks({
        onCountdownUpdate: (time) => {
            countdownUpdates.push(time);
        }
    });

    await actionBetting.showActionBettingModal(sampleEvent);
    
    // Wait for some countdown updates
    await new Promise(resolve => setTimeout(resolve, 100));

    assert(countdownUpdates.length > 0, 'Countdown updates should be received');
    assert(countdownUpdates[0] <= 10, 'First countdown update should be <= 10');
});

runner.test('Timer integration - pause and resume', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    // Show modal - should pause timer
    await actionBetting.showActionBettingModal(sampleEvent);
    assert(mockTimerManager.isPaused, 'Timer should be paused when modal opens');

    // Place bet - should start resume countdown
    actionBetting.placeBet('choice_1', 25);
    
    // Check resume countdown - the countdown should be 3 seconds or close to it
    await new Promise(resolve => setTimeout(resolve, 50));
    const countdownTime = mockTimerManager.countdownTime;
    assert(countdownTime > 2.5 && countdownTime <= 3, `Resume countdown should be around 3 seconds, got ${countdownTime}`);

    // Simulate resume countdown completion
    mockTimerManager.simulateCountdownComplete();
    assertFalsy(mockTimerManager.isPaused, 'Timer should resume after countdown');
});

runner.test('Validate choice functionality', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    // Test validation without active event
    let result = actionBetting.validateChoice('choice_1');
    assertFalsy(result.valid, 'Validation should fail without active event');
    assertEqual(result.error, 'No active betting opportunity', 'Error message should be correct');

    // Test validation with active event
    await actionBetting.showActionBettingModal(sampleEvent);
    
    result = actionBetting.validateChoice('choice_1');
    assert(result.valid, 'Valid choice should pass validation');
    assertEqual(result.choice.description, 'Goal from corner', 'Choice should be returned');

    result = actionBetting.validateChoice('invalid_choice');
    assertFalsy(result.valid, 'Invalid choice should fail validation');
    assertEqual(result.error, 'Invalid choice selected', 'Error message should be correct');
});

runner.test('Get status functionality', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    // Test status when inactive
    let status = actionBetting.getStatus();
    assertFalsy(status.isModalOpen, 'Modal should not be open initially');
    assertEqual(status.currentEvent, null, 'Current event should be null initially');
    assertEqual(status.prePopulatedAmount, 25, 'Pre-populated amount should be default');

    // Test status when active
    await actionBetting.showActionBettingModal(sampleEvent);
    status = actionBetting.getStatus();
    assert(status.isModalOpen, 'Modal should be open');
    assertEqual(status.currentEvent.id, sampleEvent.id, 'Current event should match');
    assertEqual(status.remainingTime, 10, 'Remaining time should be 10 seconds');
});

runner.test('Force close functionality', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    let modalHidden = false;
    actionBetting.setCallbacks({
        onModalHide: () => {
            modalHidden = true;
        }
    });

    await actionBetting.showActionBettingModal(sampleEvent);
    actionBetting.forceClose();

    assertFalsy(actionBetting.isModalActive(), 'Modal should be closed');
    assertFalsy(mockTimerManager.isPaused, 'Timer should be resumed');
    assert(modalHidden, 'Modal hide callback should be called');
});

runner.test('Reset functionality', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(
        mockStateManager,
        mockTimerManager,
        mockBettingManager
    );

    await actionBetting.showActionBettingModal(sampleEvent);
    actionBetting.reset();

    assertFalsy(actionBetting.isModalActive(), 'Modal should be closed after reset');
    assertEqual(actionBetting.getCurrentEvent(), null, 'Current event should be null after reset');
});

// Run the tests
console.log('Starting ActionBetting Node.js tests...\n');
runner.run().then(() => {
    process.exit(runner.results.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});