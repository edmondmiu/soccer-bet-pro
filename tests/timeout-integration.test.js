/**
 * Integration Tests for Timeout Functionality
 * 
 * Tests the integration between PauseManager timeout handling and PauseUI warning display
 */

import { PauseManager } from '../scripts/pauseManager.js';
import { resetState } from '../scripts/gameState.js';

/**
 * Simple test framework for timeout integration testing
 */
class TimeoutIntegrationTestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Timeout Integration Tests...\n');
        
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
        
        console.log(`\n📊 Integration Test Results: ${this.passed} passed, ${this.failed} failed`);
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
}

// Create test runner instance
const testRunner = new TimeoutIntegrationTestRunner();

// Test 1: PauseManager timeout with warning callback integration
testRunner.test('PauseManager timeout triggers warning callback correctly', async () => {
    const manager = new PauseManager();
    let warningMessage = null;
    let warningCount = 0;
    
    // Set up warning callback to simulate UI integration
    manager.setTimeoutWarningCallback((message) => {
        warningMessage = message;
        warningCount++;
    });
    
    // Pause with short timeout
    const pauseResult = manager.pauseGame('INTEGRATION_TEST', 100);
    testRunner.assertTrue(pauseResult, 'Pause should succeed');
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    testRunner.assertTrue(manager.hasActiveTimeout(), 'Should have active timeout');
    
    // Wait for timeout to trigger
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Verify timeout behavior
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed');
    testRunner.assertFalse(manager.hasActiveTimeout(), 'Should not have active timeout after auto-resume');
    testRunner.assertEqual(warningMessage, 'Timeout - Resuming Game', 'Warning message should be correct');
    testRunner.assertEqual(warningCount, 1, 'Warning callback should be called once');
});

// Test 2: Manual resume prevents timeout warning
testRunner.test('Manual resume prevents timeout warning from being triggered', async () => {
    const manager = new PauseManager();
    let warningCalled = false;
    
    manager.setTimeoutWarningCallback(() => {
        warningCalled = true;
    });
    
    // Pause with longer timeout
    manager.pauseGame('MANUAL_RESUME_TEST', 300);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    
    // Resume manually before timeout
    setTimeout(() => {
        const resumeResult = manager.resumeGame();
        testRunner.assertTrue(resumeResult, 'Manual resume should succeed');
    }, 100);
    
    // Wait longer than timeout would have been
    await new Promise(resolve => setTimeout(resolve, 400));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be resumed');
    testRunner.assertFalse(warningCalled, 'Warning callback should not be called for manual resume');
});

// Test 3: Multiple timeout cycles with warning tracking
testRunner.test('Multiple timeout cycles track warnings correctly', async () => {
    const manager = new PauseManager();
    const warnings = [];
    
    manager.setTimeoutWarningCallback((message) => {
        warnings.push({
            message,
            timestamp: Date.now()
        });
    });
    
    // First timeout cycle
    manager.pauseGame('CYCLE_1', 80);
    await new Promise(resolve => setTimeout(resolve, 120));
    testRunner.assertFalse(manager.isPaused(), 'Game should be resumed after first timeout');
    
    // Second timeout cycle
    manager.pauseGame('CYCLE_2', 80);
    await new Promise(resolve => setTimeout(resolve, 120));
    testRunner.assertFalse(manager.isPaused(), 'Game should be resumed after second timeout');
    
    // Verify warnings
    testRunner.assertEqual(warnings.length, 2, 'Should have two warning messages');
    testRunner.assertEqual(warnings[0].message, 'Timeout - Resuming Game', 'First warning should be correct');
    testRunner.assertEqual(warnings[1].message, 'Timeout - Resuming Game', 'Second warning should be correct');
    testRunner.assertTrue(warnings[1].timestamp > warnings[0].timestamp, 'Second warning should be after first');
});

// Test 4: Timeout with zero duration
testRunner.test('Zero timeout duration triggers immediate warning', async () => {
    const manager = new PauseManager();
    let warningTriggered = false;
    let warningTime = null;
    
    manager.setTimeoutWarningCallback(() => {
        warningTriggered = true;
        warningTime = Date.now();
    });
    
    const startTime = Date.now();
    manager.pauseGame('ZERO_TIMEOUT', 0);
    
    // Wait a small amount for immediate timeout
    await new Promise(resolve => setTimeout(resolve, 50));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed immediately');
    testRunner.assertTrue(warningTriggered, 'Warning should be triggered');
    testRunner.assertTrue(warningTime - startTime < 100, 'Warning should be triggered quickly');
});

// Test 5: Timeout callback error handling
testRunner.test('Timeout callback errors do not break pause system', async () => {
    const manager = new PauseManager();
    
    // Set up callback that throws an error
    manager.setTimeoutWarningCallback(() => {
        throw new Error('Callback error');
    });
    
    // Pause should still work despite callback error
    manager.pauseGame('ERROR_TEST', 100);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused despite callback error');
    
    // Wait for timeout (should not throw)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed despite callback error');
});

// Test 6: Clearing timeout callback during active pause
testRunner.test('Clearing timeout callback during active pause works', async () => {
    const manager = new PauseManager();
    let warningCalled = false;
    
    manager.setTimeoutWarningCallback(() => {
        warningCalled = true;
    });
    
    // Pause with timeout
    manager.pauseGame('CLEAR_DURING_PAUSE', 200);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    
    // Clear callback during pause
    setTimeout(() => {
        manager.clearTimeoutWarningCallback();
    }, 50);
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 250));
    
    testRunner.assertFalse(manager.isPaused(), 'Game should be auto-resumed');
    testRunner.assertFalse(warningCalled, 'Warning should not be called after clearing callback');
});

// Test 7: Timeout behavior with clearTimeout method
testRunner.test('clearTimeout method prevents timeout warning', async () => {
    const manager = new PauseManager();
    let warningCalled = false;
    
    manager.setTimeoutWarningCallback(() => {
        warningCalled = true;
    });
    
    // Pause with timeout
    manager.pauseGame('CLEAR_TIMEOUT_METHOD', 200);
    testRunner.assertTrue(manager.isPaused(), 'Game should be paused');
    testRunner.assertTrue(manager.hasActiveTimeout(), 'Should have active timeout');
    
    // Clear timeout manually
    setTimeout(() => {
        const cleared = manager.clearTimeout();
        testRunner.assertTrue(cleared, 'clearTimeout should return true');
        testRunner.assertFalse(manager.hasActiveTimeout(), 'Should not have active timeout after clearing');
    }, 50);
    
    // Wait longer than original timeout
    await new Promise(resolve => setTimeout(resolve, 250));
    
    testRunner.assertTrue(manager.isPaused(), 'Game should still be paused after clearing timeout');
    testRunner.assertFalse(warningCalled, 'Warning should not be called after clearing timeout');
    
    // Clean up
    manager.resumeGame();
});

// Export the test runner for use in HTML test page
window.timeoutIntegrationTests = testRunner;

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
    document.addEventListener('DOMContentLoaded', () => {
        testRunner.run();
    });
}