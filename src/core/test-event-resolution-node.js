#!/usr/bin/env node

/**
 * Event Resolution System Node.js Test Runner
 * Comprehensive tests for action bet resolution timing and accuracy
 */

// Mock DOM environment for Node.js
global.document = {
    dispatchEvent: () => {},
    addEventListener: () => {}
};
global.CustomEvent = function(type, options) {
    this.type = type;
    this.detail = options?.detail;
};

// Import modules
import { EventManager } from './EventManager.js';
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
                actionBet: []
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
        this.subscribers.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('Subscriber error:', error);
            }
        });
    }
}

// Mock PowerUpManager
class MockPowerUpManager {
    awardPowerUp() {
        return { success: true, powerUp: { type: '2x_multiplier' } };
    }
}

// Test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async runTests() {
        console.log('🎯 Running Event Resolution System Tests...\n');
        
        this.results = [];
        let passed = 0;
        let failed = 0;

        for (const test of this.tests) {
            try {
                await test.fn();
                this.results.push({ name: test.name, status: 'PASS' });
                console.log(`✅ ${test.name}`);
                passed++;
            } catch (error) {
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}`);
                failed++;
            }
        }

        console.log(`\n📊 Test Results:`);
        console.log(`   Total: ${this.tests.length}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Success Rate: ${((passed / this.tests.length) * 100).toFixed(1)}%`);

        return { total: this.tests.length, passed, failed };
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error('Expected value to be defined');
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, got ${actual.length}`);
                }
            },
            toMatchObject: (expected) => {
                for (const key in expected) {
                    if (actual[key] !== expected[key]) {
                        throw new Error(`Expected ${key} to be ${expected[key]}, got ${actual[key]}`);
                    }
                }
            }
        };
    }
}

// Initialize test runner
const testRunner = new TestRunner();

// Bind methods to maintain context
const test = testRunner.test.bind(testRunner);
const expect = testRunner.expect.bind(testRunner);

// Test setup function
function setupTest() {
    const mockStateManager = new MockStateManager();
    const mockPowerUpManager = new MockPowerUpManager();
    const eventManager = new EventManager(mockStateManager);
    const bettingManager = new BettingManager(mockStateManager, mockPowerUpManager);
    
    return { eventManager, bettingManager, mockStateManager, mockPowerUpManager };
}

// Event Resolution Tests
test('Action Bet Resolution Scheduling - should schedule resolution 4 minutes after event', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

test('Action Bet Resolution Processing - should resolve with random outcome', () => {
    const { eventManager } = setupTest();
    
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

    // Mock the triggerEvent method to capture the resolution
    let resolutionData = null;
    eventManager.triggerEvent = (eventType, data) => {
        if (eventType === 'actionBetResolution') {
            resolutionData = data;
        }
    };

    eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

    expect(resolutionData).toBeDefined();
    expect(resolutionData.originalEvent).toEqual(actionBetEvent);
    expect(resolutionData.eventId).toBe(actionBetEvent.id);
    
    // Verify outcome is one of the valid choices
    const validOutcomes = actionBetEvent.data.choices.map(choice => choice.outcome);
    expect(validOutcomes).toContain(resolutionData.winningOutcome);
});

test('Goal Event Processing - should update score and odds', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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
    
    // Odds should be recalculated (home odds should decrease)
    expect(state.match.odds.home).toBeLessThan(initialOdds.home);
    expect(state.match.odds.away).toBeGreaterThan(initialOdds.away);
});

test('Goal Event Processing - should trigger enhanced goal event', () => {
    const { eventManager } = setupTest();
    
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

    let goalEventData = null;
    eventManager.triggerEvent = (eventType, data) => {
        if (eventType === 'goal') {
            goalEventData = data;
        }
    };

    eventManager.processGoalEvent(goalEvent);

    expect(goalEventData).toBeDefined();
    expect(goalEventData.team).toBe('away');
    expect(goalEventData.player).toBe('Away Player');
    expect(goalEventData.previousScore).toBe('0-0');
    expect(goalEventData.newScore).toBe('0-1');
    expect(goalEventData.goalType).toBe('volley');
    expect(goalEventData.previousOdds).toBeDefined();
    expect(goalEventData.newOdds).toBeDefined();
});

test('Commentary Event Processing - should not affect match state', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

    const initialState = mockStateManager.getState();
    
    let commentaryEventData = null;
    eventManager.triggerEvent = (eventType, data) => {
        if (eventType === 'commentary') {
            commentaryEventData = data;
        }
    };

    eventManager.processCommentaryEvent(commentaryEvent);

    // Should trigger commentary event
    expect(commentaryEventData).toBeDefined();
    expect(commentaryEventData.description).toBe(commentaryEvent.description);
    expect(commentaryEventData.category).toBe('possession');
    expect(commentaryEventData.intensity).toBe('medium');

    // Should not affect match state
    const newState = mockStateManager.getState();
    expect(newState.match.homeScore).toBe(initialState.match.homeScore);
    expect(newState.match.awayScore).toBe(initialState.match.awayScore);
    expect(newState.match.odds).toEqual(initialState.match.odds);
});

test('Event Feed Updates - should add action bet events with betting indicator', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

test('Event Feed Updates - should add resolution results to feed', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

test('Resolution Statistics - should track pending and resolved events', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

    expect(stats.totalActionBets).toBe(2);
    expect(stats.totalResolutions).toBe(2);
    expect(stats.resolvedCount).toBe(1);
    expect(stats.pendingCount).toBe(1);
    expect(stats.resolutionRate).toBe('50.0');
});

test('Force Resolution - should resolve with specific outcome', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

    let resolutionData = null;
    eventManager.triggerEvent = (eventType, data) => {
        if (eventType === 'actionBetResolution') {
            resolutionData = data;
        }
    };

    const result = eventManager.forceResolution('force_test', 'save');

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('save');
    expect(resolutionData.winningOutcome).toBe('save');
});

test('Event Processing Order - should process events chronologically', () => {
    const { eventManager, mockStateManager } = setupTest();
    
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

    const processedEvents = [];
    const originalProcessEvent = eventManager.processEvent;
    eventManager.processEvent = function(event) {
        processedEvents.push(event);
        return originalProcessEvent.call(this, event);
    };
    
    eventManager.checkForEvents();

    // All events should be processed in chronological order
    expect(processedEvents).toHaveLength(4);
    expect(processedEvents[0].time).toBe(15);
    expect(processedEvents[1].time).toBe(25);
    expect(processedEvents[2].time).toBe(29);
    expect(processedEvents[3].time).toBe(35);
});

test('Integration with Betting System - should resolve bets correctly', async () => {
    const { eventManager, bettingManager, mockStateManager } = setupTest();
    
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

    // Create action bet event
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

    // Mock resolution to always win
    const originalResolveActionBet = eventManager.resolveActionBet;
    eventManager.resolveActionBet = function(actionEvent, resEvent) {
        const winningChoice = actionEvent.data.choices.find(c => c.outcome === 'goal');
        const updatedResolutionEvent = {
            ...resEvent,
            description: `✅ ${winningChoice.description}`,
            data: {
                ...resEvent.data,
                winningOutcome: winningChoice.outcome,
                winningChoice: winningChoice,
                resolved: true
            }
        };

        this.triggerEvent('actionBetResolution', {
            originalEvent: actionEvent,
            resolution: updatedResolutionEvent,
            winningOutcome: winningChoice.outcome,
            eventId: actionEvent.id
        });

        this.addToEventFeed(updatedResolutionEvent);
    };

    // Process resolution
    eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

    // Resolve bets through betting manager
    const resolutionResult = bettingManager.resolveBets('goal', 'actionBet', 'test_action_bet');

    expect(resolutionResult.success).toBe(true);
    expect(resolutionResult.resolvedBets).toBe(1);

    const state = mockStateManager.getState();
    const resolvedBet = state.bets.actionBet[0];
    
    expect(resolvedBet.status).toBe('won');
    expect(state.wallet).toBe(1000 - 50 + (50 * 4.5)); // Initial - stake + winnings

    // Restore original method
    eventManager.resolveActionBet = originalResolveActionBet;
});

// Run tests
async function runTests() {
    try {
        const results = await testRunner.runTests();
        
        if (results.failed > 0) {
            process.exit(1);
        } else {
            console.log('\n🎉 All event resolution tests passed!');
            process.exit(0);
        }
    } catch (error) {
        console.error('Test runner error:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
} else {
    // Also run if imported as main module
    runTests();
}

export { testRunner, setupTest };