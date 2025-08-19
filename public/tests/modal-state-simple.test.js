/**
 * Simple Modal State Management Tests
 * 
 * Basic tests for modal state management functionality without testing framework
 */

// Mock DOM environment for testing
if (typeof window === 'undefined') {
    global.window = {};
    global.document = {
        getElementById: () => null,
        createElement: () => ({ 
            classList: { add: () => {}, remove: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {}
        })
    };
}

// Import the functions we're testing
import {
    getCurrentState,
    resetState,
    getModalState,
    updateModalState,
    setModalVisible,
    setModalMinimized,
    initializeModalState,
    resetModalState,
    isModalActive,
    getModalRemainingTime,
    isModalExpired,
    minimizeModal,
    restoreModal,
    closeModal
} from '../scripts/gameState.js';

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
        },
        toBeGreaterThanOrEqual: (expected) => {
            if (actual < expected) {
                throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
            }
        },
        toBeLessThanOrEqual: (expected) => {
            if (actual > expected) {
                throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
            }
        }
    };
}

// Run tests
console.log('🧪 Running Modal State Management Tests\n');

// Reset state before tests
resetState();

test('Initial modal state should be correct', () => {
    const state = getCurrentState();
    
    expect(state.currentActionBet.modalState).toEqual({
        visible: false,
        minimized: false,
        startTime: null,
        duration: null,
        content: null,
        timerBar: null
    });
});

test('getModalState should return modal state copy', () => {
    const modalState = getModalState();
    
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBe(null);
    expect(modalState.duration).toBe(null);
    expect(modalState.content).toBe(null);
    expect(modalState.timerBar).toBe(null);
});

test('setModalVisible should update visibility', () => {
    setModalVisible(true);
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
});

test('setModalMinimized should update minimized state', () => {
    // Reset state first to ensure clean test
    resetModalState();
    setModalMinimized(true);
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(true);
});

test('updateModalState should update partial state', () => {
    const startTime = Date.now();
    const duration = 10000;
    
    updateModalState({
        visible: true,
        startTime: startTime,
        duration: duration
    });
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(true); // Should remain from previous test
    expect(modalState.startTime).toBe(startTime);
    expect(modalState.duration).toBe(duration);
    expect(modalState.content).toBe(null);
});

test('initializeModalState should set up modal correctly', () => {
    const content = {
        title: 'Test Action Bet',
        description: 'Test betting opportunity',
        choices: [{ text: 'Option 1', odds: 2.0 }]
    };
    const duration = 10000;
    
    const beforeTime = Date.now();
    initializeModalState(content, duration);
    const afterTime = Date.now();
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBeGreaterThanOrEqual(beforeTime);
    expect(modalState.startTime).toBeLessThanOrEqual(afterTime);
    expect(modalState.duration).toBe(duration);
    expect(modalState.content).toEqual(content);
    expect(modalState.timerBar).toBe(null);
});

test('isModalActive should identify active states', () => {
    // Should be active from previous test (visible: true)
    expect(isModalActive()).toBe(true);
    
    // Test minimized state
    setModalVisible(false);
    setModalMinimized(true);
    expect(isModalActive()).toBe(true);
    
    // Test inactive state
    setModalMinimized(false);
    expect(isModalActive()).toBe(false);
});

test('getModalRemainingTime should calculate correctly', () => {
    const duration = 10000; // 10 seconds
    const startTime = Date.now() - 3000; // Started 3 seconds ago
    
    updateModalState({
        startTime: startTime,
        duration: duration
    });
    
    const remaining = getModalRemainingTime();
    expect(remaining).toBeGreaterThan(6000); // Should be around 7 seconds
    expect(remaining).toBeLessThan(8000);
});

test('isModalExpired should identify expired modals', () => {
    // Current modal should not be expired
    expect(isModalExpired()).toBe(false);
    
    // Set expired modal
    updateModalState({
        startTime: Date.now() - 15000,
        duration: 10000
    });
    expect(isModalExpired()).toBe(true);
});

test('minimizeModal should set correct state', () => {
    // Start with visible modal
    setModalVisible(true);
    
    minimizeModal();
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(true);
});

test('restoreModal should set correct state', () => {
    // Start with minimized modal (from previous test)
    restoreModal();
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
});

test('closeModal should reset state', () => {
    // Set up active modal
    initializeModalState({ test: 'data' }, 5000);
    
    closeModal();
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBe(null);
    expect(modalState.duration).toBe(null);
    expect(modalState.content).toBe(null);
    expect(modalState.timerBar).toBe(null);
});

test('resetModalState should reset to initial values', () => {
    // Set some modal state
    initializeModalState({ test: 'data' }, 5000);
    setModalMinimized(true);
    
    // Reset
    resetModalState();
    
    const modalState = getModalState();
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBe(null);
    expect(modalState.duration).toBe(null);
    expect(modalState.content).toBe(null);
    expect(modalState.timerBar).toBe(null);
});

test('State persistence during minimize/restore cycles', () => {
    const content = { title: 'Persistent Test' };
    const duration = 8000;
    
    // Initialize modal
    initializeModalState(content, duration);
    const originalStartTime = getModalState().startTime;
    
    // Minimize
    minimizeModal();
    let modalState = getModalState();
    expect(modalState.visible).toBe(false);
    expect(modalState.minimized).toBe(true);
    expect(modalState.startTime).toBe(originalStartTime);
    expect(modalState.duration).toBe(duration);
    expect(modalState.content).toEqual(content);
    
    // Restore
    restoreModal();
    modalState = getModalState();
    expect(modalState.visible).toBe(true);
    expect(modalState.minimized).toBe(false);
    expect(modalState.startTime).toBe(originalStartTime);
    expect(modalState.duration).toBe(duration);
    expect(modalState.content).toEqual(content);
});

test('Invalid updates should be handled gracefully', () => {
    const originalState = getModalState();
    
    // Try invalid updates
    updateModalState('invalid');
    updateModalState(123);
    updateModalState([]);
    updateModalState(null);
    updateModalState(undefined);
    
    // State should remain unchanged
    const newState = getModalState();
    expect(newState).toEqual(originalState);
});

// Print results
console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}