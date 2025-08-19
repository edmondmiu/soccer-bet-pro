/**
 * Modal State Management - Betting Integration Tests
 * 
 * Tests integration between modal state management and the betting system
 * Verifies that modal state persists correctly during betting operations
 */

// Mock DOM environment for testing
if (typeof window === 'undefined') {
    global.window = {
        addEventToFeed: () => {},
        render: () => {},
        MinimizedIndicator: class {
            show() {}
            updateTime() {}
            hide() {}
            onClick() {}
            setUrgent() {}
        }
    };
    global.document = {
        getElementById: () => ({
            classList: { add: () => {}, remove: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {},
            textContent: '',
            innerHTML: '',
            appendChild: () => {},
            querySelector: () => null,
            style: {}
        }),
        createElement: () => ({ 
            classList: { add: () => {}, remove: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {},
            onclick: null,
            className: '',
            textContent: '',
            innerHTML: '',
            style: {}
        })
    };
    global.setTimeout = setTimeout;
    global.clearTimeout = clearTimeout;
    global.setInterval = setInterval;
    global.clearInterval = clearInterval;
}

// Import the functions we're testing
import {
    getCurrentState,
    resetState,
    getModalState,
    updateModalState,
    initializeModalState,
    isModalActive,
    getModalRemainingTime,
    minimizeModal,
    restoreModal,
    closeModal,
    updateCurrentActionBet
} from '../scripts/gameState.js';

import {
    showMultiChoiceActionBet,
    minimizeActionBet,
    restoreActionBet,
    hideActionBet
} from '../scripts/betting.js';

let testsPassed = 0;
let testsTotal = 0;

function test(name, testFn) {
    testsTotal++;
    try {
        testFn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
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
        toBeGreaterThan: (expected) => {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeLessThan: (expected) => {
            if (actual >= expected) {
                throw new Error(`Expected ${actual} to be less than ${expected}`);
            }
        }
    };
}

// Run integration tests
console.log('🧪 Running Modal State - Betting Integration Tests\n');

// Reset state before tests
resetState();

test('showMultiChoiceActionBet should initialize modal state', () => {
    const event = {
        description: 'Test foul event',
        betType: 'FOUL_OUTCOME',
        choices: [
            { text: 'Yellow Card', odds: 2.5 },
            { text: 'Red Card', odds: 8.0 }
        ]
    };
    
    showMultiChoiceActionBet(event);
    
    const state = getCurrentState();
    const modalState = getModalState();
    
    expect(state.currentActionBet.active).toBe(true);
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBeGreaterThan(Date.now() - 1000);
    expect(modalState.duration).toBe(10000);
});

test('minimizeActionBet should update modal state correctly', () => {
    // First show a modal
    const event = {
        description: 'Test minimize event',
        betType: 'TEST_MINIMIZE',
        choices: [{ text: 'Option 1', odds: 2.0 }]
    };
    
    showMultiChoiceActionBet(event);
    
    // Then minimize it
    minimizeActionBet();
    
    const state = getCurrentState();
    const modalState = getModalState();
    
    expect(state.currentActionBet.active).toBe(true);
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(true);
    expect(modalState.startTime).toBeGreaterThan(0);
    expect(modalState.duration).toBe(10000);
});

test('restoreActionBet should restore modal state correctly', () => {
    // Restore from previous test
    restoreActionBet();
    
    const state = getCurrentState();
    const modalState = getModalState();
    
    expect(state.currentActionBet.active).toBe(true);
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBeGreaterThan(0);
    expect(modalState.duration).toBe(10000);
});

test('hideActionBet should reset modal state', () => {
    // Hide the current modal
    hideActionBet();
    
    const state = getCurrentState();
    const modalState = getModalState();
    
    expect(state.currentActionBet.active).toBe(false);
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBe(null);
    expect(modalState.duration).toBe(null);
});

test('Modal state should persist during betting operations', () => {
    const event = {
        description: 'Persistence test event',
        betType: 'PERSISTENCE_TEST',
        choices: [{ text: 'Test Choice', odds: 3.0 }]
    };
    
    // Show modal
    showMultiChoiceActionBet(event);
    const originalStartTime = getModalState().startTime;
    
    // Minimize
    minimizeActionBet();
    
    // Verify state persisted
    let modalState = getModalState();
    expect(modalState.startTime).toBe(originalStartTime);
    expect(modalState.duration).toBe(10000);
    expect(modalState.minimized).toBe(true);
    
    // Restore
    restoreActionBet();
    
    // Verify state still persisted
    modalState = getModalState();
    expect(modalState.startTime).toBe(originalStartTime);
    expect(modalState.duration).toBe(10000);
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
});

test('Timer should continue running during minimize/restore', () => {
    const event = {
        description: 'Timer test event',
        betType: 'TIMER_TEST',
        choices: [{ text: 'Timer Choice', odds: 2.0 }]
    };
    
    // Show modal
    showMultiChoiceActionBet(event);
    const initialRemaining = getModalRemainingTime();
    
    // Wait a bit
    const delay = 100;
    setTimeout(() => {
        // Minimize
        minimizeActionBet();
        const minimizedRemaining = getModalRemainingTime();
        
        // Timer should have decreased
        expect(minimizedRemaining).toBeLessThan(initialRemaining);
        expect(minimizedRemaining).toBeGreaterThan(0);
        
        setTimeout(() => {
            // Restore
            restoreActionBet();
            const restoredRemaining = getModalRemainingTime();
            
            // Timer should continue decreasing
            expect(restoredRemaining).toBeLessThan(minimizedRemaining);
            expect(restoredRemaining).toBeGreaterThan(0);
            
            // Clean up
            hideActionBet();
        }, delay);
    }, delay);
});

test('Multiple betting events should handle state correctly', () => {
    // Show first modal
    const event1 = {
        description: 'First event',
        betType: 'FIRST_EVENT',
        choices: [{ text: 'Choice 1', odds: 2.0 }]
    };
    
    showMultiChoiceActionBet(event1);
    expect(isModalActive()).toBe(true);
    
    // Hide first modal
    hideActionBet();
    expect(isModalActive()).toBe(false);
    
    // Show second modal
    const event2 = {
        description: 'Second event',
        betType: 'SECOND_EVENT',
        choices: [{ text: 'Choice 2', odds: 3.0 }]
    };
    
    showMultiChoiceActionBet(event2);
    const modalState = getModalState();
    
    expect(isModalActive()).toBe(true);
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
    
    // Clean up
    hideActionBet();
});

test('Modal state should integrate with currentActionBet', () => {
    const event = {
        description: 'Integration test',
        betType: 'INTEGRATION_TEST',
        choices: [{ text: 'Integration Choice', odds: 4.0 }]
    };
    
    showMultiChoiceActionBet(event);
    
    const fullState = getCurrentState();
    const modalState = getModalState();
    
    // Modal state should be part of currentActionBet
    expect(fullState.currentActionBet.modalState).toEqual(modalState);
    expect(fullState.currentActionBet.active).toBe(true);
    expect(fullState.currentActionBet.details).toEqual(event);
    
    // Clean up
    hideActionBet();
});

test('Error handling should maintain state consistency', () => {
    // Try to restore without active modal
    restoreActionBet();
    expect(isModalActive()).toBe(false);
    
    // Try to minimize without active modal
    minimizeActionBet();
    expect(isModalActive()).toBe(false);
    
    // State should remain consistent
    const modalState = getModalState();
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(false);
});

// Print results
console.log(`\n📊 Integration Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
    console.log('🎉 All integration tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some integration tests failed');
    process.exit(1);
}