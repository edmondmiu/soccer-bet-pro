/**
 * Node.js compatible test for timeout functionality
 * Simple verification that the timeout features work correctly
 */

import { PauseManager } from '../scripts/pauseManager.js';
import { resetState } from '../scripts/gameState.js';

// Simple test assertions
function assertEqual(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(`${message}\nExpected: true\nActual: ${condition}`);
    }
}

function assertFalse(condition, message = '') {
    if (condition) {
        throw new Error(`${message}\nExpected: false\nActual: ${condition}`);
    }
}

async function runTimeoutTests() {
    console.log('🧪 Running Timeout Functionality Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Basic timeout functionality
    try {
        resetState();
        const manager = new PauseManager();
        let warningMessage = null;
        
        manager.setTimeoutWarningCallback((message) => {
            warningMessage = message;
        });
        
        manager.pauseGame('TEST_TIMEOUT', 100);
        assertTrue(manager.isPaused(), 'Game should be paused');
        assertTrue(manager.hasActiveTimeout(), 'Should have active timeout');
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        assertFalse(manager.isPaused(), 'Game should be auto-resumed');
        assertFalse(manager.hasActiveTimeout(), 'Should not have active timeout');
        assertEqual(warningMessage, 'Timeout - Resuming Game', 'Warning message should be correct');
        
        console.log('✅ Basic timeout functionality');
        passed++;
    } catch (error) {
        console.error('❌ Basic timeout functionality:', error.message);
        failed++;
    }
    
    // Test 2: Manual resume clears timeout
    try {
        resetState();
        const manager = new PauseManager();
        let warningCalled = false;
        
        manager.setTimeoutWarningCallback(() => {
            warningCalled = true;
        });
        
        manager.pauseGame('MANUAL_RESUME_TEST', 200);
        assertTrue(manager.isPaused(), 'Game should be paused');
        
        setTimeout(() => {
            manager.resumeGame();
        }, 50);
        
        await new Promise(resolve => setTimeout(resolve, 250));
        
        assertFalse(manager.isPaused(), 'Game should be resumed');
        assertFalse(warningCalled, 'Warning should not be called for manual resume');
        
        console.log('✅ Manual resume clears timeout');
        passed++;
    } catch (error) {
        console.error('❌ Manual resume clears timeout:', error.message);
        failed++;
    }
    
    // Test 3: clearTimeout method
    try {
        resetState();
        const manager = new PauseManager();
        
        manager.pauseGame('CLEAR_TIMEOUT_TEST', 1000);
        assertTrue(manager.hasActiveTimeout(), 'Should have active timeout');
        
        const cleared = manager.clearTimeout();
        assertTrue(cleared, 'clearTimeout should return true');
        assertFalse(manager.hasActiveTimeout(), 'Should not have active timeout after clearing');
        assertTrue(manager.isPaused(), 'Game should still be paused');
        
        manager.resumeGame(); // Clean up
        
        console.log('✅ clearTimeout method works');
        passed++;
    } catch (error) {
        console.error('❌ clearTimeout method works:', error.message);
        failed++;
    }
    
    // Test 4: Zero timeout
    try {
        resetState();
        const manager = new PauseManager();
        let warningCalled = false;
        
        manager.setTimeoutWarningCallback(() => {
            warningCalled = true;
        });
        
        manager.pauseGame('ZERO_TIMEOUT', 0);
        assertTrue(manager.isPaused(), 'Game should be paused initially');
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        assertFalse(manager.isPaused(), 'Game should be auto-resumed');
        assertTrue(warningCalled, 'Warning should be called for zero timeout');
        
        console.log('✅ Zero timeout works');
        passed++;
    } catch (error) {
        console.error('❌ Zero timeout works:', error.message);
        failed++;
    }
    
    // Test 5: Invalid callback handling
    try {
        resetState();
        const manager = new PauseManager();
        
        // Set invalid callback - should not throw
        manager.setTimeoutWarningCallback('not a function');
        manager.setTimeoutWarningCallback(null);
        
        const result = manager.pauseGame('INVALID_CALLBACK', 100);
        assertTrue(result, 'pauseGame should work with invalid callback');
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        assertFalse(manager.isPaused(), 'Game should still auto-resume');
        
        console.log('✅ Invalid callback handling');
        passed++;
    } catch (error) {
        console.error('❌ Invalid callback handling:', error.message);
        failed++;
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Run the tests
runTimeoutTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});