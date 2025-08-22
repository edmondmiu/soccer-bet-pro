/**
 * Simple Node.js test runner for EventManager and EventGenerator
 * Run with: node test-event-system.js
 */

// Mock DOM and browser APIs for Node.js environment
global.document = {
    dispatchEvent: () => {},
};
global.CustomEvent = function(type, options) {
    this.type = type;
    this.detail = options?.detail;
};

// Import modules (simulate ES6 imports)
const fs = require('fs');
const path = require('path');

// Read and evaluate the modules
function loadModule(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Simple ES6 module simulation
    const moduleCode = content
        .replace(/export\s+class\s+(\w+)/g, 'global.$1 = class $1')
        .replace(/import\s+{[^}]+}\s+from\s+['"'][^'"]+['"];?\s*/g, '');
    
    eval(moduleCode);
}

// Load modules
try {
    loadModule(path.join(__dirname, '../utils/EventGenerator.js'));
    loadModule(path.join(__dirname, 'StateManager.js'));
    loadModule(path.join(__dirname, 'EventManager.js'));
} catch (error) {
    console.error('Error loading modules:', error.message);
    process.exit(1);
}

// Test utilities
let testCount = 0;
let passCount = 0;

function test(description, testFn) {
    testCount++;
    try {
        const result = testFn();
        if (result !== false) {
            console.log(`✓ ${description}`);
            passCount++;
        } else {
            console.log(`✗ ${description}`);
        }
    } catch (error) {
        console.log(`✗ ${description} - Error: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
    return true;
}

console.log('🚀 Starting EventManager and EventGenerator Tests\n');

// EventGenerator Tests
console.log('📊 EventGenerator Tests:');

test('EventGenerator can be instantiated', () => {
    const generator = new global.EventGenerator();
    assert(generator instanceof global.EventGenerator);
    return true;
});

test('Event distribution sums to 1.0', () => {
    const generator = new global.EventGenerator();
    assert(generator.validateDistribution());
    return true;
});

test('Timeline generation produces events', () => {
    const generator = new global.EventGenerator();
    const timeline = generator.generateMatchTimeline();
    assert(Array.isArray(timeline));
    assert(timeline.length > 0);
    return true;
});

test('Events have proper structure', () => {
    const generator = new global.EventGenerator();
    const timeline = generator.generateMatchTimeline();
    
    timeline.forEach(event => {
        assert(event.id, 'Event has ID');
        assert(event.type, 'Event has type');
        assert(typeof event.time === 'number', 'Event has numeric time');
        assert(event.description, 'Event has description');
        assert(event.data, 'Event has data');
    });
    return true;
});

test('Events are sorted by time', () => {
    const generator = new global.EventGenerator();
    const timeline = generator.generateMatchTimeline();
    
    for (let i = 1; i < timeline.length; i++) {
        assert(timeline[i].time >= timeline[i-1].time, 'Events are in chronological order');
    }
    return true;
});

test('Event spacing is within 8-18 minutes', () => {
    const generator = new global.EventGenerator();
    const times = generator.generateEventTimes();
    
    for (let i = 1; i < times.length; i++) {
        const spacing = times[i] - times[i-1];
        assert(spacing >= 8 && spacing <= 18, `Spacing ${spacing} is within range`);
    }
    return true;
});

test('Goal events have correct structure', () => {
    const generator = new global.EventGenerator();
    const goalEvent = generator.generateGoalEvent('test', 25);
    
    assert(goalEvent.type === 'GOAL');
    assert(goalEvent.data.team);
    assert(goalEvent.data.player);
    assert(['home', 'away'].includes(goalEvent.data.team));
    return true;
});

test('Action bet events have choices', () => {
    const generator = new global.EventGenerator();
    const actionEvent = generator.generateActionBetEvent('test', 30);
    
    assert(actionEvent.type === 'ACTION_BET');
    assert(Array.isArray(actionEvent.data.choices));
    assert(actionEvent.data.choices.length > 0);
    
    actionEvent.data.choices.forEach(choice => {
        assert(choice.outcome);
        assert(choice.description);
        assert(typeof choice.odds === 'number');
        assert(choice.odds > 1);
    });
    return true;
});

test('Event statistics are calculated correctly', () => {
    const generator = new global.EventGenerator();
    const timeline = generator.generateMatchTimeline();
    const stats = generator.getEventStatistics(timeline);
    
    assert(stats.total === timeline.length);
    assert(stats.goals + stats.actionBets + stats.commentary === stats.total);
    assert(typeof stats.averageSpacing === 'number' || stats.averageSpacing === 0);
    return true;
});

// EventManager Tests
console.log('\n🎮 EventManager Tests:');

test('EventManager can be instantiated', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    assert(eventManager instanceof global.EventManager);
    return true;
});

test('EventManager generates timeline', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    const timeline = eventManager.generateTimeline();
    assert(Array.isArray(timeline));
    assert(timeline.length > 0);
    
    const state = stateManager.getState();
    assert(state.match.timeline.length > 0);
    return true;
});

test('Goal events update score', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    const initialScore = stateManager.getState().match.homeScore;
    
    const goalEvent = {
        id: 'test_goal',
        type: 'GOAL',
        time: 25,
        description: 'Test goal',
        data: { team: 'home', player: 'Test Player' }
    };
    
    eventManager.processGoalEvent(goalEvent);
    
    const newState = stateManager.getState();
    assert(newState.match.homeScore === initialScore + 1);
    return true;
});

test('Odds adjust correctly after goals', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    const newOdds = eventManager.calculateNewOdds(2, 0);
    assert(newOdds.home < 1.85, 'Home odds decrease when home team leads');
    assert(newOdds.away > 4.20, 'Away odds increase when home team leads');
    return true;
});

test('Events are added to feed', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    const testEvent = {
        id: 'test_feed',
        type: 'COMMENTARY',
        time: 15,
        description: 'Test event'
    };
    
    eventManager.addToEventFeed(testEvent);
    
    const state = stateManager.getState();
    assert(state.match.eventFeed && state.match.eventFeed.length > 0);
    return true;
});

test('Custom events can be scheduled', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    eventManager.generateTimeline(); // Generate initial timeline
    
    const customEvent = {
        id: 'custom_event',
        type: 'COMMENTARY',
        description: 'Custom event',
        data: {}
    };
    
    eventManager.scheduleEvent(customEvent, 45);
    
    const state = stateManager.getState();
    const hasCustomEvent = state.match.timeline.some(e => e.id === 'custom_event');
    assert(hasCustomEvent);
    return true;
});

test('Can retrieve next event', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    eventManager.generateTimeline();
    eventManager.currentEventIndex = 0;
    
    const nextEvent = eventManager.getNextEvent();
    assert(nextEvent !== null);
    assert(typeof nextEvent === 'object');
    return true;
});

test('Can filter events by type', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    eventManager.generateTimeline();
    
    const goalEvents = eventManager.getEventsByType('GOAL');
    assert(Array.isArray(goalEvents));
    
    goalEvents.forEach(event => {
        assert(event.type === 'GOAL');
    });
    return true;
});

// Integration Tests
console.log('\n🔗 Integration Tests:');

test('Complete event processing workflow', () => {
    const stateManager = new global.StateManager();
    const eventManager = new global.EventManager(stateManager);
    
    // Generate timeline
    const timeline = eventManager.generateTimeline();
    assert(timeline.length > 0);
    
    // Simulate match time advancement
    stateManager.updateState({
        match: { ...stateManager.getState().match, time: 15 }
    });
    
    // Process events
    eventManager.checkForEvents();
    
    // Verify events were processed (currentEventIndex should advance)
    const eventsToProcess = timeline.filter(event => event.time <= 15);
    assert(eventManager.currentEventIndex >= eventsToProcess.length);
    
    return true;
});

test('Event distribution matches expected percentages', () => {
    const generator = new global.EventGenerator();
    const timeline = generator.generateMatchTimeline();
    const stats = generator.getEventStatistics(timeline);
    
    // Allow for some variance due to rounding
    const goalPercentage = parseFloat(stats.goalPercentage);
    const actionBetPercentage = parseFloat(stats.actionBetPercentage);
    const commentaryPercentage = parseFloat(stats.commentaryPercentage);
    
    assert(goalPercentage >= 15 && goalPercentage <= 25, 'Goal percentage ~20%');
    assert(actionBetPercentage >= 40 && actionBetPercentage <= 50, 'Action bet percentage ~45%');
    assert(commentaryPercentage >= 30 && commentaryPercentage <= 40, 'Commentary percentage ~35%');
    
    return true;
});

// Display sample timeline
console.log('\n📋 Sample Timeline:');
const generator = new global.EventGenerator();
const sampleTimeline = generator.generateMatchTimeline();
const sampleStats = generator.getEventStatistics(sampleTimeline);

console.log(`Generated ${sampleStats.total} events:`);
console.log(`- Goals: ${sampleStats.goals} (${sampleStats.goalPercentage}%)`);
console.log(`- Action Bets: ${sampleStats.actionBets} (${sampleStats.actionBetPercentage}%)`);
console.log(`- Commentary: ${sampleStats.commentary} (${sampleStats.commentaryPercentage}%)`);
console.log(`- Average Spacing: ${sampleStats.averageSpacing?.toFixed(1) || 'N/A'} minutes`);

console.log('\nFirst 5 events:');
sampleTimeline.slice(0, 5).forEach(event => {
    console.log(`  ${event.time}' [${event.type}] ${event.description}`);
});

// Final results
console.log(`\n🏁 Test Results: ${passCount}/${testCount} tests passed`);

if (passCount === testCount) {
    console.log('🎉 All tests passed! EventManager and EventGenerator are working correctly.');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please review the implementation.');
    process.exit(1);
}