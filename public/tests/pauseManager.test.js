/**
 * Unit Tests for PauseManager Class
 * 
 * Tests the PauseManager functionality including pause/resume operations,
 * timeout handling, and integration with the game state system.
 */

// Import the PauseManager and related functions
import { PauseManager, pauseManager } from '../scripts/pauseManager.js';
import { resetState, getPauseState } from '../scripts/gameState.js';

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
        console.log('🧪 Running PauseManager Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                // Reset state before each test
                resetState();
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

    assertNotNull(value, message = '') {
        if (value === null) {
            throw new Error(`${message}\nExpected: not null\nActual: ${value}`);
        }
    }
}

// Create test runner instance
const testRunner = new TestRunner();

// Test 1: PauseManager constructor creates instance correctly
testRunner.test('PauseManager constructor creates instance correctly', () => {
    const manager = new PauseManager();
    testRunner.assertTrue(manager instanceof PauseManager, 'Should create PauseManager instance');
    testRunner.assertTrue(typeof manager.pauseGame === 'function', 'Should have pauseGame method');
    testRunner.assertTrue(typeof manager.resumeGame === 'function', 'Should have resumeGame method');
    testRunner.assertTrue(typeof manager.isPaused === 'function', 'Should have isPaused method');
});

// Test 2: Default pauseManager instance is available
testRunner.test('Default pauseManager instance is available', () => {
    testRunner.assertTrue(pauseManager instanceof PauseManager, 'Default instance should be PauseManager');
    testRunner.assertFalse(pauseManager.isPaused(), 'Default instance should not be paused initially');
});

// Test 3: pauseGame with valid parameters
testRunner.test('pauseGame works with valid parameters', () => {
    const manager = new PauseManager();
    const result = manager.pauseGame('BETTING_OPPORTUNITY', 10000);
    
    testRunner.assertTrue(result, 'pauseGame should return true on success');
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused after pauseGame');
    
    const pauseState = getPauseState();
    testRunner.assertEqual(pauseState.active, true, 'Pause state should be active');
    testRunner.assertEqual(pauseState.reason, 'BETTING_OPPORTUNITY', 'Pause reason should be set');
    testRunner.assertNotNull(pauseState.startTime, 'Start time should be set');
    testRunner.assertNull(pauseState.timeoutId, 'Timeout ID should be null in state (managed internally)');
});

// Test 4: pauseGame with default timeout
testRunner.test('pauseGame uses default timeout when not specified', () => {
    const manager = new PauseManager();
    const result = manager.pauseGame('TEST_PAUSE');
    
    testRunner.assertTrue(result, 'pauseGame should work with default timeout');
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    
    const pauseState = getPauseState();
    testRunner.assertEqual(pauseState.reason, 'TEST_PAUSE', 'Reason should be set');
    testRunner.assertNull(pauseState.timeoutId, 'Timeout ID should be null in state (managed internally)');
});

// Test 5: pauseGame with invalid parameters
testRunner.test('pauseGame handles invalid parameters correctly', () => {
    const manager = new PauseManager();
    
    // Test with invalid reason
    let result = manager.pauseGame(null, 5000);
    testRunner.assertFalse(result, 'Should return false for null reason');
    testRunner.assertFalse(manager.isPaused(), 'Game should not be paused');
    
    // Test with invalid timeout
    result = manager.pauseGame('VALID_REASON', -1000);
    testRunner.assertFalse(result, 'Should return false for negative timeout');
    testRunner.assertFalse(manager.isPaused(), 'Game should not be paused');
    
    // Test with non-string reason
    result = manager.pauseGame(123, 5000);
    testRunner.assertFalse(result, 'Should return false for non-string reason');
    testRunner.assertFalse(manager.isPaused(), 'Game should not be paused');
});

// Test 6: pauseGame when already paused
testRunner.test('pauseGame handles already paused state', () => {
    const manager = new PauseManager();
    
    // First pause
    const firstResult = manager.pauseGame('FIRST_PAUSE', 10000);
    testRunner.assertTrue(firstResult, 'First pause should succeed');
    
    const firstPauseState = getPauseState();
    const firstStartTime = firstPauseState.startTime;
    
    // Try to pause again
    const secondResult = manager.pauseGame('SECOND_PAUSE', 5000);
    testRunner.assertFalse(secondResult, 'Second pause should fail');
    
    const secondPauseState = getPauseState();
    testRunner.assertEqual(secondPauseState.reason, 'FIRST_PAUSE', 'Original reason should be preserved');
    testRunner.assertEqual(secondPauseState.startTime, firstStartTime, 'Original start time should be preserved');
});

// Test 7: resumeGame works correctly
testRunner.test('resumeGame works correctly', () => {
    const manager = new PauseManager();
    
    // First pause the game
    manager.pauseGame('TEST_RESUME', 10000);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused initially');
    
    // Then resume
    const result = manager.resumeGame();
    testRunner.assertTrue(result, 'resumeGame should return true on success');
    testRunner.assertFalse(manager.isPaused(), 'Game should not be paused after resume');
    
    const pauseState = getPauseState();
    testRunner.assertEqual(pauseState.active, false, 'Pause state should be inactive');
    testRunner.assertNull(pauseState.reason, 'Reason should be cleared');
    testRunner.assertNull(pauseState.startTime, 'Start time should be cleared');
    testRunner.assertNull(pauseState.timeoutId, 'Timeout ID should be cleared');
});

// Test 8: resumeGame when not paused
testRunner.test('resumeGame handles not paused state', () => {
    const manager = new PauseManager();
    
    // Try to resume when not paused
    const result = manager.resumeGame();
    testRunner.assertFalse(result, 'resumeGame should return false when not paused');
    testRunner.assertFalse(manager.isPaused(), 'Game should remain not paused');
});

// Test 9: isPaused returns correct status
testRunner.test('isPaused returns correct status', () => {
    const manager = new PauseManager();
    
    // Initially not paused
    testRunner.assertFalse(manager.isPaused(), 'Should return false initially');
    
    // After pausing
    manager.pauseGame('STATUS_TEST', 5000);
    testRunner.assertTrue(manager.isPaused(), 'Should return true when paused');
    
    // After resuming
    manager.resumeGame();
    testRunner.assertFalse(manager.isPaused(), 'Should return false after resume');
});

// Test 10: getPauseInfo returns correct information
testRunner.test('getPauseInfo returns correct information', () => {
    const manager = new PauseManager();
    
    // When not paused
    let pauseInfo = manager.getPauseInfo();
    testRunner.assertEqual(pauseInfo.active, false, 'Should show inactive when not paused');
    testRunner.assertNull(pauseInfo.reason, 'Reason should be null when not paused');
    
    // When paused
    manager.pauseGame('INFO_TEST', 8000);
    pauseInfo = manager.getPauseInfo();
    testRunner.assertEqual(pauseInfo.active, true, 'Should show active when paused');
    testRunner.assertEqual(pauseInfo.reason, 'INFO_TEST', 'Should return correct reason');
    testRunner.assertNotNull(pauseInfo.startTime, 'Should have start time when paused');
    testRunner.assertNull(pauseInfo.timeoutId, 'Timeout ID should be null in state (managed internally)');
});

// Test 11: getPauseDuration calculates correctly
testRunner.test('getPauseDuration calculates correctly', () => {
    const manager = new PauseManager();
    
    // When not paused
    let duration = manager.getPauseDuration();
    testRunner.assertEqual(duration, 0, 'Duration should be 0 when not paused');
    
    // When paused
    const startTime = Date.now();
    manager.pauseGame('DURATION_TEST', 10000);
    
    // Wait a small amount and check duration
    setTimeout(() => {
        duration = manager.getPauseDuration();
        testRunner.assertTrue(duration > 0, 'Duration should be positive when paused');
        testRunner.assertTrue(duration < 1000, 'Duration should be reasonable for short test');
    }, 10);
});

// Test 12: Timeout functionality (async test)
testRunner.test('Timeout auto-resume functionality works', async () => {
    const manager = new PauseManager();
    
    // Pause with very short timeout for testing
    manager.pauseGame('TIMEOUT_TEST', 100);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused initially');
    
    // Wait for timeout to trigger
    await new Promise(resolve => setTimeout(resolve, 150));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed after timeout');
    
    const pauseState = getPauseState();
    testRunner.assertEqual(pauseState.active, false, 'Pause state should be cleared after timeout');
});

// Test 13: Manual resume clears timeout
testRunner.test('Manual resume clears timeout correctly', async () => {
    const manager = new PauseManager();
    
    // Pause with longer timeout
    manager.pauseGame('MANUAL_RESUME_TEST', 1000);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    
    const pauseInfo = manager.getPauseInfo();
    testRunner.assertNull(pauseInfo.timeoutId, 'Timeout ID should be null in state (managed internally)');
    
    // Resume manually before timeout
    manager.resumeGame();
    testRunner.assertFalse(manager.isPaused(), 'Game should be resumed');
    
    // Wait to ensure timeout doesn't fire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Game should still be not paused (timeout was cleared)
    testRunner.assertFalse(manager.isPaused(), 'Game should remain not paused after timeout period');
});

// Test 14: Multiple pause/resume cycles
testRunner.test('Multiple pause/resume cycles work correctly', () => {
    const manager = new PauseManager();
    
    for (let i = 0; i < 3; i++) {
        // Pause
        const pauseResult = manager.pauseGame(`CYCLE_TEST_${i}`, 5000);
        testRunner.assertTrue(pauseResult, `Pause ${i} should succeed`);
        testRunner.assertTrue(manager.isPaused(), `Game should be paused in cycle ${i}`);
        
        const pauseInfo = manager.getPauseInfo();
        testRunner.assertEqual(pauseInfo.reason, `CYCLE_TEST_${i}`, `Reason should be correct in cycle ${i}`);
        
        // Resume
        const resumeResult = manager.resumeGame();
        testRunner.assertTrue(resumeResult, `Resume ${i} should succeed`);
        testRunner.assertFalse(manager.isPaused(), `Game should not be paused after resume ${i}`);
    }
});

// Test 15: Error handling in edge cases
testRunner.test('Error handling works in edge cases', () => {
    const manager = new PauseManager();
    
    // Test with empty string reason
    let result = manager.pauseGame('', 5000);
    testRunner.assertFalse(result, 'Empty string reason should be rejected');
    
    // Test with zero timeout
    result = manager.pauseGame('ZERO_TIMEOUT', 0);
    testRunner.assertTrue(result, 'Zero timeout should be accepted');
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused with zero timeout');
    
    // Clean up
    manager.resumeGame();
    
    // Test with very large timeout
    result = manager.pauseGame('LARGE_TIMEOUT', 999999999);
    testRunner.assertTrue(result, 'Large timeout should be accepted');
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused with large timeout');
});

// Test 16: Timeout warning callback functionality
testRunner.test('Timeout warning callback works correctly', async () => {
    const manager = new PauseManager();
    let warningMessage = null;
    
    // Set up warning callback
    manager.setTimeoutWarningCallback((message) => {
        warningMessage = message;
    });
    
    // Pause with short timeout
    manager.pauseGame('WARNING_TEST', 100);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    
    // Wait for timeout to trigger
    await new Promise(resolve => setTimeout(resolve, 150));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed');
    testRunner.assertEqual(warningMessage, 'Timeout - Resuming Game', 'Warning message should be set');
});

// Test 17: Timeout warning callback with invalid callback
testRunner.test('Invalid timeout warning callback is handled', () => {
    const manager = new PauseManager();
    
    // Try to set invalid callback
    manager.setTimeoutWarningCallback('not a function');
    manager.setTimeoutWarningCallback(null);
    manager.setTimeoutWarningCallback(123);
    
    // Should not throw errors and should work normally
    const result = manager.pauseGame('INVALID_CALLBACK_TEST', 5000);
    testRunner.assertTrue(result, 'pauseGame should work even with invalid callback');
    
    manager.resumeGame();
});

// Test 18: Clear timeout warning callback
testRunner.test('Clear timeout warning callback works', async () => {
    const manager = new PauseManager();
    let warningMessage = null;
    
    // Set up and then clear callback
    manager.setTimeoutWarningCallback((message) => {
        warningMessage = message;
    });
    manager.clearTimeoutWarningCallback();
    
    // Pause with short timeout
    manager.pauseGame('CLEAR_CALLBACK_TEST', 100);
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed');
    testRunner.assertNull(warningMessage, 'Warning message should not be set after clearing callback');
});

// Test 19: hasActiveTimeout method
testRunner.test('hasActiveTimeout method works correctly', () => {
    const manager = new PauseManager();
    
    // Initially no timeout
    testRunner.assertFalse(manager.hasActiveTimeout(), 'Should have no active timeout initially');
    
    // After pausing
    manager.pauseGame('TIMEOUT_CHECK', 5000);
    testRunner.assertTrue(manager.hasActiveTimeout(), 'Should have active timeout when paused');
    
    // After resuming
    manager.resumeGame();
    testRunner.assertFalse(manager.hasActiveTimeout(), 'Should have no active timeout after resume');
});

// Test 20: clearTimeout method
testRunner.test('clearTimeout method works correctly', () => {
    const manager = new PauseManager();
    
    // Initially no timeout to clear
    let result = manager.clearTimeout();
    testRunner.assertFalse(result, 'Should return false when no timeout to clear');
    
    // After pausing
    manager.pauseGame('CLEAR_TIMEOUT_TEST', 10000);
    testRunner.assertTrue(manager.hasActiveTimeout(), 'Should have active timeout');
    
    // Clear timeout
    result = manager.clearTimeout();
    testRunner.assertTrue(result, 'Should return true when timeout was cleared');
    testRunner.assertFalse(manager.hasActiveTimeout(), 'Should have no active timeout after clearing');
    testRunner.assertTrue(manager.isPaused(), 'Game should still be paused after clearing timeout');
    
    // Clean up
    manager.resumeGame();
});

// Test 21: Timeout behavior with manual resume before timeout
testRunner.test('Manual resume before timeout clears timeout properly', async () => {
    const manager = new PauseManager();
    let warningCalled = false;
    
    // Set up warning callback to detect if timeout fires
    manager.setTimeoutWarningCallback(() => {
        warningCalled = true;
    });
    
    // Pause with longer timeout
    manager.pauseGame('MANUAL_BEFORE_TIMEOUT', 500);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    testRunner.assertTrue(manager.hasActiveTimeout(), 'Should have active timeout');
    
    // Resume manually before timeout
    setTimeout(() => {
        manager.resumeGame();
    }, 100);
    
    // Wait longer than original timeout to ensure it doesn't fire
    await new Promise(resolve => setTimeout(resolve, 600));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be resumed');
    testRunner.assertFalse(manager.hasActiveTimeout(), 'Should have no active timeout');
    testRunner.assertFalse(warningCalled, 'Warning callback should not have been called');
});

// Test 22: Multiple timeout scenarios
testRunner.test('Multiple timeout scenarios work correctly', async () => {
    const manager = new PauseManager();
    let warningCount = 0;
    
    manager.setTimeoutWarningCallback(() => {
        warningCount++;
    });
    
    // First timeout cycle
    manager.pauseGame('MULTIPLE_TIMEOUT_1', 100);
    await new Promise(resolve => setTimeout(resolve, 150));
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed after first timeout');
    
    // Second timeout cycle
    manager.pauseGame('MULTIPLE_TIMEOUT_2', 100);
    await new Promise(resolve => setTimeout(resolve, 150));
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed after second timeout');
    
    testRunner.assertEqual(warningCount, 2, 'Warning callback should be called twice');
});

// Test 23: Timeout edge case - zero timeout
testRunner.test('Zero timeout behavior', async () => {
    const manager = new PauseManager();
    let warningCalled = false;
    
    manager.setTimeoutWarningCallback(() => {
        warningCalled = true;
    });
    
    // Pause with zero timeout (should trigger immediately)
    manager.pauseGame('ZERO_TIMEOUT_TEST', 0);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused initially');
    
    // Wait a small amount for timeout to trigger
    await new Promise(resolve => setTimeout(resolve, 50));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed immediately');
    testRunner.assertTrue(warningCalled, 'Warning callback should be called');
});

// Test 24: Timeout with pause state preservation
testRunner.test('Timeout preserves pause state correctly during auto-resume', async () => {
    const manager = new PauseManager();
    
    const startTime = Date.now();
    manager.pauseGame('STATE_PRESERVATION_TEST', 100);
    
    const pauseInfo = manager.getPauseInfo();
    testRunner.assertEqual(pauseInfo.reason, 'STATE_PRESERVATION_TEST', 'Reason should be preserved');
    testRunner.assertTrue(pauseInfo.startTime >= startTime, 'Start time should be set');
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // After timeout, state should be cleared
    const finalPauseInfo = manager.getPauseInfo();
    testRunner.assertEqual(finalPauseInfo.active, false, 'Should be inactive after timeout');
    testRunner.assertNull(finalPauseInfo.reason, 'Reason should be cleared');
    testRunner.assertNull(finalPauseInfo.startTime, 'Start time should be cleared');
});

// Export the test runner for use in HTML test page
window.pauseManagerTests = testRunner;

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
    document.addEventListener('DOMContentLoaded', () => {
        testRunner.run();
    });
}