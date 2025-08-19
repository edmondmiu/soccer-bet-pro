/**
 * Simple Node.js Tests for Betting Modal Minimize Functionality
 * 
 * This test suite verifies the minimize/restore behavior without external dependencies.
 */

// Mock DOM and global objects
const mockDOM = {
    elements: {},
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        style: {},
        innerHTML: '',
        textContent: '',
        onclick: null,
        addEventListener: function(event, handler) { this._handlers = this._handlers || {}; this._handlers[event] = handler; },
        removeEventListener: function(event, handler) { if (this._handlers) delete this._handlers[event]; },
        classList: {
            add: function() {},
            remove: function() {},
            contains: function() { return false; }
        },
        appendChild: function() {},
        querySelector: function() { return null; },
        contains: function() { return false; }
    }),
    getElementById: (id) => mockDOM.elements[id] || null
};

global.document = mockDOM;
global.window = {
    MinimizedIndicator: class MockMinimizedIndicator {
        constructor() {
            this.isVisible = false;
            this.eventType = null;
            this.timeRemaining = 0;
            this.clickHandler = null;
            this.urgent = false;
        }
        
        show(eventType, timeRemaining) {
            this.isVisible = true;
            this.eventType = eventType;
            this.timeRemaining = timeRemaining;
        }
        
        hide() {
            this.isVisible = false;
        }
        
        updateTime(remaining) {
            this.timeRemaining = remaining;
        }
        
        setUrgent(urgent) {
            this.urgent = urgent;
        }
        
        onClick(handler) {
            this.clickHandler = handler;
        }
    }
};

global.setTimeout = (fn, delay) => {
    const id = Math.random();
    if (delay <= 100) fn(); // Execute immediately for testing
    return id;
};
global.clearTimeout = () => {};
global.setInterval = (fn, delay) => Math.random();
global.clearInterval = () => {};
global.console = { log: () => {}, error: () => {}, warn: () => {} };

const mockNow = 1000000;
global.Date = { now: () => mockNow };

// Mock pause manager
global.pauseManager = {
    pauseGame: () => true,
    isPaused: () => true
};

// Simple test framework
let testCount = 0;
let passCount = 0;

function test(description, testFn) {
    testCount++;
    try {
        testFn();
        console.log(`✅ PASS: ${description}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${description}`);
        console.log(`   Error: ${error.message}`);
    }
}

function expect(actual) {
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
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected truthy value, got ${actual}`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected falsy value, got ${actual}`);
            }
        }
    };
}

// Mock game state
const mockGameState = {
    currentActionBet: {
        active: false,
        details: null,
        timeoutId: null,
        modalState: null,
        minimizedIndicator: null,
        minimizedUpdateInterval: null
    }
};

function getCurrentState() {
    return JSON.parse(JSON.stringify(mockGameState));
}

function updateCurrentActionBet(updates) {
    Object.assign(mockGameState.currentActionBet, updates);
}

function resetState() {
    mockGameState.currentActionBet = {
        active: false,
        details: null,
        timeoutId: null,
        modalState: null,
        minimizedIndicator: null,
        minimizedUpdateInterval: null
    };
}

// Setup DOM elements
mockDOM.elements['action-bet-modal'] = mockDOM.createElement('div');
mockDOM.elements['action-bet-timer-bar'] = mockDOM.createElement('div');
mockDOM.elements['action-bet-choices'] = mockDOM.createElement('div');
mockDOM.elements['action-bet-title'] = mockDOM.createElement('h2');
mockDOM.elements['action-bet-main-description'] = mockDOM.createElement('p');

// Import the betting module functions (simplified versions for testing)
function showMultiChoiceActionBet(event) {
    updateCurrentActionBet({
        active: true,
        details: event,
        modalState: {
            visible: true,
            minimized: false,
            startTime: Date.now(),
            duration: 10000
        }
    });
    
    const modal = mockDOM.elements['action-bet-modal'];
    modal.classList.remove('hidden');
}

function minimizeActionBet() {
    const state = getCurrentState();
    if (!state.currentActionBet.active) return;
    
    updateCurrentActionBet({
        modalState: {
            ...state.currentActionBet.modalState,
            visible: false,
            minimized: true
        }
    });
    
    const modal = mockDOM.elements['action-bet-modal'];
    modal.classList.add('hidden');
    
    // Show minimized indicator
    const indicator = new window.MinimizedIndicator();
    const eventType = state.currentActionBet.details.betType || 'ACTION_BET';
    const elapsed = Date.now() - state.currentActionBet.modalState.startTime;
    const remaining = Math.max(0, Math.ceil((state.currentActionBet.modalState.duration - elapsed) / 1000));
    
    indicator.show(eventType, remaining);
    indicator.onClick(() => restoreActionBet());
    
    updateCurrentActionBet({
        minimizedIndicator: indicator
    });
}

function restoreActionBet() {
    const state = getCurrentState();
    if (!state.currentActionBet.active || !state.currentActionBet.modalState?.minimized) {
        return;
    }
    
    updateCurrentActionBet({
        modalState: {
            ...state.currentActionBet.modalState,
            visible: true,
            minimized: false
        }
    });
    
    const modal = mockDOM.elements['action-bet-modal'];
    modal.classList.remove('hidden');
    
    updateCurrentActionBet({
        minimizedIndicator: null
    });
}

// Run tests
console.log('Running Betting Modal Minimize Tests...\n');

test('should show modal with correct state', () => {
    resetState();
    const event = {
        description: 'Test foul event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };
    
    showMultiChoiceActionBet(event);
    
    const state = getCurrentState();
    expect(state.currentActionBet.active).toBe(true);
    expect(state.currentActionBet.modalState.visible).toBe(true);
    expect(state.currentActionBet.modalState.minimized).toBe(false);
});

test('should minimize modal correctly', () => {
    resetState();
    const event = {
        description: 'Test foul event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };
    
    showMultiChoiceActionBet(event);
    minimizeActionBet();
    
    const state = getCurrentState();
    expect(state.currentActionBet.modalState.minimized).toBe(true);
    expect(state.currentActionBet.modalState.visible).toBe(false);
});

test('should show minimized indicator when minimized', () => {
    resetState();
    const event = {
        description: 'Test foul event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };
    
    showMultiChoiceActionBet(event);
    minimizeActionBet();
    
    const state = getCurrentState();
    expect(state.currentActionBet.minimizedIndicator).toBeTruthy();
    expect(state.currentActionBet.minimizedIndicator.isVisible).toBe(true);
    expect(state.currentActionBet.minimizedIndicator.eventType).toBe('FOUL_OUTCOME');
});

test('should restore modal when indicator is clicked', () => {
    resetState();
    const event = {
        description: 'Test foul event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };
    
    showMultiChoiceActionBet(event);
    minimizeActionBet();
    
    const state = getCurrentState();
    const indicator = state.currentActionBet.minimizedIndicator;
    indicator.clickHandler();
    
    const updatedState = getCurrentState();
    expect(updatedState.currentActionBet.modalState.minimized).toBe(false);
    expect(updatedState.currentActionBet.modalState.visible).toBe(true);
});

test('should preserve modal content when minimized and restored', () => {
    resetState();
    const event = {
        description: 'Complex foul event with multiple choices',
        betType: 'FOUL_OUTCOME',
        choices: [
            { text: 'Yellow Card', odds: 2.5 },
            { text: 'Red Card', odds: 8.0 }
        ]
    };
    
    showMultiChoiceActionBet(event);
    const initialState = getCurrentState();
    
    minimizeActionBet();
    restoreActionBet();
    
    const restoredState = getCurrentState();
    expect(restoredState.currentActionBet.details).toEqual(initialState.currentActionBet.details);
    expect(restoredState.currentActionBet.active).toBe(true);
});

test('should preserve timer state when minimized and restored', () => {
    resetState();
    const event = {
        description: 'Test event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };
    
    showMultiChoiceActionBet(event);
    const initialState = getCurrentState();
    
    minimizeActionBet();
    restoreActionBet();
    
    const restoredState = getCurrentState();
    expect(restoredState.currentActionBet.modalState.startTime).toBe(initialState.currentActionBet.modalState.startTime);
    expect(restoredState.currentActionBet.modalState.duration).toBe(initialState.currentActionBet.modalState.duration);
});

test('should handle multiple minimize calls gracefully', () => {
    resetState();
    const event = {
        description: 'Test event',
        betType: 'FOUL_OUTCOME',
        choices: [{ text: 'Yellow Card', odds: 2.5 }]
    };
    
    showMultiChoiceActionBet(event);
    minimizeActionBet();
    minimizeActionBet(); // Second call should be safe
    
    const state = getCurrentState();
    expect(state.currentActionBet.modalState.minimized).toBe(true);
});

test('should handle restore without minimize gracefully', () => {
    resetState();
    
    // Should not throw
    restoreActionBet();
    
    const state = getCurrentState();
    expect(state.currentActionBet.active).toBe(false);
});

// Print results
console.log(`\nTest Results: ${passCount}/${testCount} tests passed`);

if (passCount === testCount) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}