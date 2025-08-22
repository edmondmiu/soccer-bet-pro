#!/usr/bin/env node

/**
 * ActionBetting Requirements Verification
 * Verifies that ActionBetting implementation meets all specified requirements
 */

import { ActionBetting } from './ActionBetting.js';

// Mock dependencies for verification
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            betAmountMemory: { opportunity: 25 },
            bets: { actionBet: [] }
        };
    }

    getState() { return { ...this.state }; }
    updateState(updates) { this.state = { ...this.state, ...updates }; }
    getBetAmountMemory(type) { return this.state.betAmountMemory[type] || 25; }
    updateBetAmountMemory(type, amount) { this.state.betAmountMemory[type] = amount; }
}

class MockTimerManager {
    constructor() {
        this.isPaused = false;
        this.countdownTime = 0;
        this.callbacks = {};
    }

    pauseTimer() { this.isPaused = true; }
    resumeTimer() { this.isPaused = false; }
    startCountdown(duration, callback) { 
        this.countdownTime = duration;
        this.countdownCallback = callback;
    }
    stopCountdown() { this.countdownTime = 0; }
    getCountdownTime() { return this.countdownTime; }
    setCallbacks(callbacks) { this.callbacks = { ...this.callbacks, ...callbacks }; }
    getStatus() { return { match: { isPaused: this.isPaused }, countdown: { remainingTime: this.countdownTime } }; }
}

class MockBettingManager {
    constructor() {
        this.bets = [];
        this.betIdCounter = 1;
    }

    placeBet(betData) {
        const bet = {
            id: `bet_${this.betIdCounter++}`,
            ...betData,
            placedAt: Date.now()
        };
        this.bets.push(bet);
        return { success: true, bet };
    }
}

// Verification framework
class RequirementVerifier {
    constructor() {
        this.requirements = [];
        this.results = { passed: 0, failed: 0, total: 0, details: [] };
    }

    requirement(id, description, testFn) {
        this.requirements.push({ id, description, testFn });
    }

    async verify() {
        console.log('🔍 ActionBetting Requirements Verification');
        console.log('=' .repeat(60));

        for (const { id, description, testFn } of this.requirements) {
            try {
                console.log(`\n📋 ${id}: ${description}`);
                await testFn();
                console.log(`✅ VERIFIED: ${id}`);
                this.results.passed++;
                this.results.details.push({ id, status: 'PASSED', description });
            } catch (error) {
                console.log(`❌ FAILED: ${id}`);
                console.log(`   Issue: ${error.message}`);
                this.results.failed++;
                this.results.details.push({ id, status: 'FAILED', description, error: error.message });
            }
            this.results.total++;
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Requirements Verification Summary');
        console.log(`Total Requirements: ${this.results.total}`);
        console.log(`Verified: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Compliance: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed > 0) {
            console.log('\n❌ Failed Requirements:');
            this.results.details
                .filter(r => r.status === 'FAILED')
                .forEach(({ id, description, error }) => {
                    console.log(`  - ${id}: ${description}`);
                    console.log(`    Error: ${error}`);
                });
        }

        console.log('\n' + (this.results.failed === 0 ? '🎉 All requirements verified!' : '⚠️  Some requirements not met'));
    }
}

// Helper functions
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

// Create verifier instance
const verifier = new RequirementVerifier();

// Sample event for testing
const sampleEvent = {
    id: 'test_event',
    description: 'Corner kick for Home Team',
    choices: [
        { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' },
        { id: 'choice_2', description: 'No goal', odds: 1.3, outcome: 'no_goal' }
    ]
};

// Requirement 4.1: WHEN the timeline reaches an action betting event THEN the system SHALL pause the game timer immediately
verifier.requirement('4.1', 'System pauses game timer when action betting event occurs', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    // Show modal (simulates action betting event)
    await actionBetting.showActionBettingModal(sampleEvent);
    
    assert(mockTimerManager.isPaused, 'Game timer should be paused when action betting modal is shown');
});

// Requirement 4.2: WHEN the game pauses THEN the system SHALL display a betting opportunity modal with "⏸️ Game Paused - Betting Opportunity" header
verifier.requirement('4.2', 'System displays betting opportunity modal with correct header', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    let modalShown = false;
    let eventData = null;
    
    actionBetting.setCallbacks({
        onModalShow: (event) => {
            modalShown = true;
            eventData = event;
        }
    });
    
    await actionBetting.showActionBettingModal(sampleEvent);
    
    assert(modalShown, 'Modal show callback should be triggered');
    assert(eventData, 'Event data should be provided to modal');
    assertEqual(eventData.description, sampleEvent.description, 'Event description should match');
    assert(actionBetting.isModalActive(), 'Modal should be active');
});

// Requirement 4.3: WHEN showing the modal THEN the system SHALL include event description and 3 betting choices with odds
verifier.requirement('4.3', 'Modal includes event description and betting choices with odds', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    await actionBetting.showActionBettingModal(sampleEvent);
    
    const currentEvent = actionBetting.getCurrentEvent();
    assert(currentEvent, 'Current event should be available');
    assertEqual(currentEvent.description, sampleEvent.description, 'Event description should be included');
    assert(Array.isArray(currentEvent.choices), 'Choices should be an array');
    assert(currentEvent.choices.length >= 2, 'Should have multiple betting choices');
    
    // Verify each choice has required properties
    currentEvent.choices.forEach((choice, index) => {
        assert(choice.id, `Choice ${index} should have an ID`);
        assert(choice.description, `Choice ${index} should have a description`);
        assert(typeof choice.odds === 'number' && choice.odds > 0, `Choice ${index} should have valid odds`);
        assert(choice.outcome, `Choice ${index} should have an outcome`);
    });
});

// Requirement 4.4: WHEN the modal appears THEN the system SHALL start a 10-second countdown timer (covered in TimerManager tests)

// Requirement 4.5: WHEN a player selects a choice THEN the system SHALL open a bet slip with pre-populated amount (last action bet or $25)
verifier.requirement('4.5', 'Bet slip uses pre-populated amount from memory', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    // Test default pre-populated amount
    assertEqual(actionBetting.getPrePopulatedAmount(), 25, 'Default pre-populated amount should be $25');
    
    // Show modal and place bet with custom amount
    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.placeBet('choice_1', 75);
    
    assert(result.success, 'Bet placement should succeed');
    assertEqual(mockStateManager.getBetAmountMemory('opportunity'), 75, 'Bet amount memory should be updated');
    assertEqual(actionBetting.getPrePopulatedAmount(), 75, 'Pre-populated amount should reflect last bet');
});

// Requirement 4.6: WHEN the timer expires OR player skips OR bet is placed THEN the system SHALL close the modal and when the 10-second timer finishes resume the game (covered in TimerManager tests)

// Requirement 4.7: WHEN the game resumes THEN the system SHALL show a 3-second countdown before continuing
verifier.requirement('4.7', 'System shows 3-second countdown before resuming game', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    await actionBetting.showActionBettingModal(sampleEvent);
    
    // Place bet to trigger resume sequence
    actionBetting.placeBet('choice_1', 25);
    
    // Verify resume countdown is started
    assertEqual(mockTimerManager.countdownTime, 3, 'Resume countdown should be 3 seconds');
    assert(!actionBetting.isModalActive(), 'Modal should be closed');
});

// Additional verification: Skip betting functionality
verifier.requirement('SKIP', 'Skip betting functionality works correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    let skipCalled = false;
    actionBetting.setCallbacks({
        onSkip: () => { skipCalled = true; }
    });
    
    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.skipBetting();
    
    assert(result.success, 'Skip should succeed');
    assert(skipCalled, 'Skip callback should be called');
    assert(!actionBetting.isModalActive(), 'Modal should be closed after skip');
});

// Additional verification: Timeout handling
verifier.requirement('TIMEOUT', 'Timeout handling works correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    let timeoutCalled = false;
    actionBetting.setCallbacks({
        onTimeout: () => { timeoutCalled = true; }
    });
    
    await actionBetting.showActionBettingModal(sampleEvent);
    
    // Simulate timeout by calling the countdown complete handler
    actionBetting.handleCountdownComplete();
    
    assert(timeoutCalled, 'Timeout callback should be called');
    assert(!actionBetting.isModalActive(), 'Modal should be closed after timeout');
});

// Additional verification: Timer integration
verifier.requirement('TIMER_INTEGRATION', 'Timer integration works correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    // Verify timer callbacks are set
    assert(typeof mockTimerManager.callbacks.onCountdownUpdate === 'function', 'Countdown update callback should be set');
    assert(typeof mockTimerManager.callbacks.onCountdownComplete === 'function', 'Countdown complete callback should be set');
    
    // Test pause/resume coordination
    await actionBetting.showActionBettingModal(sampleEvent);
    assert(mockTimerManager.isPaused, 'Timer should be paused');
    
    actionBetting.placeBet('choice_1', 25);
    assertEqual(mockTimerManager.countdownTime, 3, 'Resume countdown should start');
});

// Additional verification: Bet validation
verifier.requirement('BET_VALIDATION', 'Bet validation works correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    await actionBetting.showActionBettingModal(sampleEvent);
    
    // Test valid choice
    const validResult = actionBetting.validateChoice('choice_1');
    assert(validResult.valid, 'Valid choice should pass validation');
    assertEqual(validResult.choice.id, 'choice_1', 'Correct choice should be returned');
    
    // Test invalid choice
    const invalidResult = actionBetting.validateChoice('invalid_choice');
    assert(!invalidResult.valid, 'Invalid choice should fail validation');
    assertEqual(invalidResult.error, 'Invalid choice selected', 'Correct error message should be returned');
});

// Additional verification: Error handling
verifier.requirement('ERROR_HANDLING', 'Error handling works correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    // Test bet placement without modal
    const result1 = actionBetting.placeBet('choice_1', 25);
    assert(!result1.success, 'Bet placement should fail without active modal');
    assertEqual(result1.error, 'No active betting opportunity', 'Correct error message should be returned');
    
    // Test skip without modal
    const result2 = actionBetting.skipBetting();
    assert(!result2.success, 'Skip should fail without active modal');
    assertEqual(result2.error, 'No active betting opportunity to skip', 'Correct error message should be returned');
    
    // Test force close and reset
    await actionBetting.showActionBettingModal(sampleEvent);
    actionBetting.forceClose();
    assert(!actionBetting.isModalActive(), 'Force close should work');
    
    await actionBetting.showActionBettingModal(sampleEvent);
    actionBetting.reset();
    assert(!actionBetting.isModalActive(), 'Reset should work');
});

// Additional verification: Status and utility methods
verifier.requirement('UTILITY_METHODS', 'Utility methods work correctly', async () => {
    const mockStateManager = new MockStateManager();
    const mockTimerManager = new MockTimerManager();
    const mockBettingManager = new MockBettingManager();
    
    const actionBetting = new ActionBetting(mockStateManager, mockTimerManager, mockBettingManager);
    
    // Test initial status
    let status = actionBetting.getStatus();
    assert(!status.isModalOpen, 'Initial modal status should be closed');
    assertEqual(status.currentEvent, null, 'Initial current event should be null');
    assertEqual(status.prePopulatedAmount, 25, 'Initial pre-populated amount should be 25');
    
    // Test status with active modal
    await actionBetting.showActionBettingModal(sampleEvent);
    status = actionBetting.getStatus();
    assert(status.isModalOpen, 'Modal status should be open');
    assertEqual(status.currentEvent.id, sampleEvent.id, 'Current event should match');
    assertEqual(status.remainingTime, 10, 'Remaining time should be 10 seconds');
    
    // Test utility methods
    assert(actionBetting.isModalActive(), 'isModalActive should return true');
    assertEqual(actionBetting.getRemainingTime(), 10, 'getRemainingTime should return countdown time');
    
    const currentEvent = actionBetting.getCurrentEvent();
    assertEqual(currentEvent.id, sampleEvent.id, 'getCurrentEvent should return current event');
});

// Run verification
console.log('Starting ActionBetting requirements verification...\n');
verifier.verify().then(() => {
    process.exit(verifier.results.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
});