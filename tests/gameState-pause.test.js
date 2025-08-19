/**
 * Unit Tests for Game State Pause Functionality
 * 
 * Tests the pause state initialization, validation, and integration
 * with the existing game state management system.
 */

// Import the gameState module functions
import { 
    getInitialState, 
    getCurrentState, 
    updateState, 
    resetState,
    getPauseState
} from '../scripts/gameState.js';

/**
 * Simple test framework for browser-based testing
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Game State Pause Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.error(`❌ ${name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }

    assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message}\nExpected: true\nActual: ${condition}`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message}\nExpected: false\nActual: ${condition}`);
        }
    }

    assertNull(value, message = '') {
        if (value !== null) {
            throw new Error(`${message}\nExpected: null\nActual: ${value}`);
        }
    }
}

// Create test runner instance
const testRunner = new TestRunner();

// Test 1: Initial state contains pause properties
testRunner.test('Initial state contains pause properties with correct defaults', () => {
    const initialState = getInitialState();
    
    testRunner.assertTrue(initialState.hasOwnProperty('pause'), 'Initial state should have pause property');
    testRunner.assertEqual(initialState.pause.active, false, 'pause.active should default to false');
    testRunner.assertNull(initialState.pause.reason, 'pause.reason should default to null');
    testRunner.assertNull(initialState.pause.startTime, 'pause.startTime should default to null');
    testRunner.assertNull(initialState.pause.timeoutId, 'pause.timeoutId should default to null');
});

// Test 2: Pause state structure validation
testRunner.test('Pause state structure is validated correctly', () => {
    // Reset to clean state
    resetState();
    
    // Valid pause state update should succeed
    const validPauseUpdate = {
        pause: {
            active: true,
            reason: 'BETTING_OPPORTUNITY',
            startTime: Date.now(),
            timeoutId: 12345
        }
    };
    
    const updatedState = updateState(validPauseUpdate);
    testRunner.assertEqual(updatedState.pause.active, true, 'Valid pause update should be applied');
    testRunner.assertEqual(updatedState.pause.reason, 'BETTING_OPPORTUNITY', 'Valid reason should be set');
});

// Test 3: Invalid pause state validation
testRunner.test('Invalid pause state is rejected', () => {
    resetState();
    const initialWallet = getCurrentState().wallet;
    
    // Invalid pause state with wrong types should be rejected
    const invalidPauseUpdate = {
        pause: {
            active: 'not-boolean',  // Should be boolean
            reason: 123,            // Should be string or null
            startTime: 'not-number', // Should be number or null
            timeoutId: 'not-number'  // Should be number or null
        }
    };
    
    const result = updateState(invalidPauseUpdate);
    
    // State should remain unchanged due to validation failure
    testRunner.assertEqual(result.pause.active, false, 'Invalid pause update should be rejected');
    testRunner.assertEqual(result.wallet, initialWallet, 'Other state should remain unchanged');
});

// Test 4: Partial pause state updates
testRunner.test('Partial pause state updates work correctly', () => {
    resetState();
    
    // First update - set active to true
    updateState({
        pause: {
            active: true,
            reason: 'BETTING_OPPORTUNITY'
        }
    });
    
    let currentState = getCurrentState();
    testRunner.assertEqual(currentState.pause.active, true, 'Partial update should set active to true');
    testRunner.assertEqual(currentState.pause.reason, 'BETTING_OPPORTUNITY', 'Partial update should set reason');
    testRunner.assertNull(currentState.pause.startTime, 'Unspecified fields should remain null');
    
    // Second update - add startTime while preserving other fields
    updateState({
        pause: {
            startTime: 1234567890
        }
    });
    
    currentState = getCurrentState();
    testRunner.assertEqual(currentState.pause.active, true, 'Previous active state should be preserved');
    testRunner.assertEqual(currentState.pause.reason, 'BETTING_OPPORTUNITY', 'Previous reason should be preserved');
    testRunner.assertEqual(currentState.pause.startTime, 1234567890, 'New startTime should be set');
});

// Test 5: getPauseState function returns correct data
testRunner.test('getPauseState returns correct pause state', () => {
    resetState();
    
    // Update pause state
    updateState({
        pause: {
            active: true,
            reason: 'TEST_PAUSE',
            startTime: 9876543210,
            timeoutId: 555
        }
    });
    
    const pauseState = getPauseState();
    
    testRunner.assertEqual(pauseState.active, true, 'getPauseState should return correct active state');
    testRunner.assertEqual(pauseState.reason, 'TEST_PAUSE', 'getPauseState should return correct reason');
    testRunner.assertEqual(pauseState.startTime, 9876543210, 'getPauseState should return correct startTime');
    testRunner.assertEqual(pauseState.timeoutId, 555, 'getPauseState should return correct timeoutId');
});

// Test 6: getPauseState returns immutable copy
testRunner.test('getPauseState returns immutable copy', () => {
    resetState();
    
    updateState({
        pause: {
            active: true,
            reason: 'IMMUTABLE_TEST'
        }
    });
    
    const pauseState = getPauseState();
    
    // Attempt to modify the returned object
    pauseState.active = false;
    pauseState.reason = 'MODIFIED';
    
    // Original state should remain unchanged
    const currentPauseState = getPauseState();
    testRunner.assertEqual(currentPauseState.active, true, 'Original state should not be modified');
    testRunner.assertEqual(currentPauseState.reason, 'IMMUTABLE_TEST', 'Original reason should not be modified');
});

// Test 7: Reset state clears pause data
testRunner.test('Reset state clears pause data to defaults', () => {
    // Set some pause data
    updateState({
        pause: {
            active: true,
            reason: 'RESET_TEST',
            startTime: Date.now(),
            timeoutId: 999
        }
    });
    
    // Reset state
    resetState();
    
    const pauseState = getPauseState();
    testRunner.assertEqual(pauseState.active, false, 'Reset should clear active state');
    testRunner.assertNull(pauseState.reason, 'Reset should clear reason');
    testRunner.assertNull(pauseState.startTime, 'Reset should clear startTime');
    testRunner.assertNull(pauseState.timeoutId, 'Reset should clear timeoutId');
});

// Test 8: Pause state validation with missing properties
testRunner.test('Pause state validation handles missing properties', () => {
    resetState();
    
    // Try to update with incomplete pause object
    const incompletePauseUpdate = {
        pause: {
            active: true
            // Missing reason, startTime, timeoutId
        }
    };
    
    const result = updateState(incompletePauseUpdate);
    
    // Update should be rejected due to missing required properties
    testRunner.assertEqual(result.pause.active, false, 'Incomplete pause update should be rejected');
});

// Test 9: Pause state with null values (valid case)
testRunner.test('Pause state accepts null values for optional fields', () => {
    resetState();
    
    const pauseWithNulls = {
        pause: {
            active: false,
            reason: null,
            startTime: null,
            timeoutId: null
        }
    };
    
    const result = updateState(pauseWithNulls);
    testRunner.assertEqual(result.pause.active, false, 'Null values should be accepted');
    testRunner.assertNull(result.pause.reason, 'Null reason should be accepted');
    testRunner.assertNull(result.pause.startTime, 'Null startTime should be accepted');
    testRunner.assertNull(result.pause.timeoutId, 'Null timeoutId should be accepted');
});

// Test 10: Pause state integration with other state properties
testRunner.test('Pause state updates do not affect other state properties', () => {
    resetState();
    
    // Set some initial state
    updateState({
        wallet: 500,
        currentScreen: 'match'
    });
    
    const beforePauseUpdate = getCurrentState();
    
    // Update pause state
    updateState({
        pause: {
            active: true,
            reason: 'INTEGRATION_TEST',
            startTime: Date.now(),
            timeoutId: 123
        }
    });
    
    const afterPauseUpdate = getCurrentState();
    
    // Other properties should remain unchanged
    testRunner.assertEqual(afterPauseUpdate.wallet, beforePauseUpdate.wallet, 'Wallet should remain unchanged');
    testRunner.assertEqual(afterPauseUpdate.currentScreen, beforePauseUpdate.currentScreen, 'Screen should remain unchanged');
    testRunner.assertEqual(afterPauseUpdate.match.active, beforePauseUpdate.match.active, 'Match state should remain unchanged');
    
    // Pause state should be updated
    testRunner.assertEqual(afterPauseUpdate.pause.active, true, 'Pause state should be updated');
    testRunner.assertEqual(afterPauseUpdate.pause.reason, 'INTEGRATION_TEST', 'Pause reason should be set');
});

// Export the test runner for use in HTML test page
window.gameStatePauseTests = testRunner;

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
    document.addEventListener('DOMContentLoaded', () => {
        testRunner.run();
    });
}