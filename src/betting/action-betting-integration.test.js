/**
 * ActionBetting Integration Tests
 * Tests integration with StateManager, TimerManager, and BettingManager
 */

import { ActionBetting } from './ActionBetting.js';
import { StateManager } from '../core/StateManager.js';
import { TimerManager } from '../systems/TimerManager.js';
import { BettingManager } from './BettingManager.js';

// Integration test suite
class IntegrationTestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0, errors: [] };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🔗 ActionBetting Integration Tests');
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
        console.log('📊 Integration Test Summary');
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

        console.log('\n' + (this.results.failed === 0 ? '🎉 All integration tests passed!' : '⚠️  Some integration tests failed'));
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

// Create test runner
const runner = new IntegrationTestRunner();

// Sample event for testing
const sampleEvent = {
    id: 'integration_test_event',
    description: 'Free kick opportunity',
    choices: [
        { id: 'choice_1', description: 'Goal', odds: 4.0, outcome: 'goal' },
        { id: 'choice_2', description: 'Miss', odds: 1.25, outcome: 'miss' }
    ]
};

runner.test('Full integration with real modules', async () => {
    // Create real instances
    const stateManager = new StateManager();
    const timerManager = new TimerManager();
    const bettingManager = new BettingManager(stateManager);
    
    const actionBetting = new ActionBetting(
        stateManager,
        timerManager,
        bettingManager
    );

    // Test initial state
    const initialState = stateManager.getState();
    assertEqual(initialState.wallet, 1000, 'Initial wallet should be $1000');
    assertEqual(initialState.betAmountMemory.opportunity, 25, 'Initial bet memory should be $25');

    // Start the timer first (required for pause to work)
    timerManager.startMatch();
    assert(timerManager.isMatchRunning(), 'Timer should be running after start');

    // Show modal
    const result = await actionBetting.showActionBettingModal(sampleEvent);
    assert(result.success, 'Modal show should succeed');
    assert(actionBetting.isModalActive(), 'Modal should be active');

    // Verify timer is paused
    assert(timerManager.isMatchPaused(), 'Timer should be paused');

    // Place bet
    const betResult = actionBetting.placeBet('choice_1', 100);
    assert(betResult.success, 'Bet placement should succeed');

    // Verify state updates
    const updatedState = stateManager.getState();
    assertEqual(updatedState.wallet, 900, 'Wallet should be reduced by bet amount');
    assertEqual(updatedState.betAmountMemory.opportunity, 100, 'Bet memory should be updated');
    assert(updatedState.bets.actionBet.length === 1, 'Action bet should be recorded');

    // Verify bet details
    const placedBet = updatedState.bets.actionBet[0];
    assertEqual(placedBet.type, 'actionBet', 'Bet type should be actionBet');
    assertEqual(placedBet.outcome, 'goal', 'Bet outcome should match choice');
    assertEqual(placedBet.stake, 100, 'Bet stake should match input');
    assertEqual(placedBet.odds, 4.0, 'Bet odds should match choice');
    assertEqual(placedBet.eventId, sampleEvent.id, 'Event ID should match');

    console.log('✓ Full integration test completed successfully');
});

runner.test('State synchronization across modules', async () => {
    const stateManager = new StateManager();
    const timerManager = new TimerManager();
    const bettingManager = new BettingManager(stateManager);
    
    const actionBetting = new ActionBetting(
        stateManager,
        timerManager,
        bettingManager
    );

    // Set up state observer to track changes
    const stateChanges = [];
    stateManager.subscribe((newState, oldState, changes) => {
        stateChanges.push(changes);
    });

    // Show modal and place bet
    await actionBetting.showActionBettingModal(sampleEvent);
    actionBetting.placeBet('choice_2', 50);

    // Verify state changes were tracked
    assert(stateChanges.length > 0, 'State changes should be tracked');
    
    // Check for wallet change
    const walletChange = stateChanges.find(change => change.wallet);
    assert(walletChange, 'Wallet change should be tracked');

    // Check for bet addition
    const betChange = stateChanges.find(change => change['bets.actionBet']);
    assert(betChange, 'Bet addition should be tracked');

    console.log('✓ State synchronization test completed');
});

runner.test('Timer coordination and callbacks', async () => {
    const stateManager = new StateManager();
    const timerManager = new TimerManager();
    const bettingManager = new BettingManager(stateManager);
    
    const actionBetting = new ActionBetting(
        stateManager,
        timerManager,
        bettingManager
    );

    let countdownUpdates = 0;
    let modalEvents = [];

    // Set up callbacks
    actionBetting.setCallbacks({
        onModalShow: (event) => modalEvents.push('show'),
        onModalHide: () => modalEvents.push('hide'),
        onCountdownUpdate: (time) => countdownUpdates++,
        onBetPlaced: (bet, choice) => modalEvents.push('bet_placed')
    });

    // Show modal
    await actionBetting.showActionBettingModal(sampleEvent);
    assert(modalEvents.includes('show'), 'Modal show event should be triggered');

    // Wait for countdown updates
    await new Promise(resolve => setTimeout(resolve, 200));
    assert(countdownUpdates > 0, 'Countdown updates should be received');

    // Place bet
    actionBetting.placeBet('choice_1', 25);
    assert(modalEvents.includes('bet_placed'), 'Bet placed event should be triggered');
    assert(modalEvents.includes('hide'), 'Modal hide event should be triggered');

    console.log('✓ Timer coordination test completed');
});

runner.test('Error handling across modules', async () => {
    const stateManager = new StateManager();
    const timerManager = new TimerManager();
    const bettingManager = new BettingManager(stateManager);
    
    const actionBetting = new ActionBetting(
        stateManager,
        timerManager,
        bettingManager
    );

    // Test insufficient funds
    stateManager.updateState({ wallet: 10 }); // Set low wallet balance
    
    await actionBetting.showActionBettingModal(sampleEvent);
    const result = actionBetting.placeBet('choice_1', 100); // Bet more than wallet

    assert(!result.success, 'Bet should fail with insufficient funds');
    assert(result.error.includes('Insufficient funds'), 'Error message should indicate insufficient funds');

    // Verify modal is still open after failed bet
    assert(actionBetting.isModalActive(), 'Modal should remain open after failed bet');

    // Test successful skip after failed bet
    const skipResult = actionBetting.skipBetting();
    assert(skipResult.success, 'Skip should work after failed bet');

    console.log('✓ Error handling test completed');
});

runner.test('Bet amount memory persistence', async () => {
    const stateManager = new StateManager();
    const timerManager = new TimerManager();
    const bettingManager = new BettingManager(stateManager);
    
    const actionBetting = new ActionBetting(
        stateManager,
        timerManager,
        bettingManager
    );

    // Place first bet
    await actionBetting.showActionBettingModal(sampleEvent);
    actionBetting.placeBet('choice_1', 75);

    // Verify memory is updated
    assertEqual(actionBetting.getPrePopulatedAmount(), 75, 'Memory should be updated to $75');

    // Place second bet with different amount
    await actionBetting.showActionBettingModal({
        ...sampleEvent,
        id: 'second_event'
    });
    
    // Verify pre-populated amount is from memory
    assertEqual(actionBetting.getPrePopulatedAmount(), 75, 'Pre-populated amount should be from memory');
    
    actionBetting.placeBet('choice_2', 150);
    assertEqual(actionBetting.getPrePopulatedAmount(), 150, 'Memory should be updated to $150');

    console.log('✓ Bet amount memory test completed');
});

runner.test('Multiple betting opportunities sequence', async () => {
    const stateManager = new StateManager();
    const timerManager = new TimerManager();
    const bettingManager = new BettingManager(stateManager);
    
    const actionBetting = new ActionBetting(
        stateManager,
        timerManager,
        bettingManager
    );

    const events = [
        { ...sampleEvent, id: 'event_1', description: 'Corner kick' },
        { ...sampleEvent, id: 'event_2', description: 'Free kick' },
        { ...sampleEvent, id: 'event_3', description: 'Penalty' }
    ];

    let totalBets = 0;

    for (const event of events) {
        await actionBetting.showActionBettingModal(event);
        assert(actionBetting.isModalActive(), `Modal should be active for ${event.description}`);
        
        const result = actionBetting.placeBet('choice_1', 25);
        assert(result.success, `Bet should succeed for ${event.description}`);
        totalBets++;
        
        assert(!actionBetting.isModalActive(), `Modal should close after bet for ${event.description}`);
    }

    // Verify all bets were recorded
    const finalState = stateManager.getState();
    assertEqual(finalState.bets.actionBet.length, totalBets, 'All bets should be recorded');
    assertEqual(finalState.wallet, 1000 - (totalBets * 25), 'Wallet should reflect all bets');

    console.log('✓ Multiple betting opportunities test completed');
});

// Run integration tests
console.log('Starting ActionBetting integration tests...\n');
runner.run().then(() => {
    process.exit(runner.results.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('Integration test runner failed:', error);
    process.exit(1);
});

export { ActionBetting };