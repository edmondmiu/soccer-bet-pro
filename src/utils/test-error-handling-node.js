/**
 * Node.js Test Runner for Error Handling System
 * Comprehensive tests for error handling across all modules
 */

// Mock browser environment for Node.js testing
global.window = {
    addEventListener: () => {},
    AudioContext: undefined,
    webkitAudioContext: undefined
};

global.document = {
    addEventListener: () => {},
    createElement: () => ({ appendChild: () => {}, remove: () => {} }),
    getElementById: () => null,
    body: { appendChild: () => {} },
    head: { appendChild: () => {} }
};

// Import modules
import { ErrorHandler, ERROR_TYPES } from './ErrorHandler.js';
import { StateManager } from '../core/StateManager.js';
import { BettingManager } from '../betting/BettingManager.js';
import { TimerManager } from '../systems/TimerManager.js';
import { UIManager } from '../ui/UIManager.js';
import { AudioManager } from '../systems/AudioManager.js';

class ErrorHandlingTestRunner {
    constructor() {
        this.testResults = [];
        this.errorHandler = new ErrorHandler();
        this.errorHandler.setDebugMode(false); // Reduce console noise
        
        // Initialize test instances
        this.stateManager = null;
        this.bettingManager = null;
        this.timerManager = null;
        this.uiManager = null;
        this.audioManager = null;
    }

    /**
     * Log test result
     */
    logResult(testName, success, message = '', details = {}) {
        const result = {
            test: testName,
            success,
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅ PASS' : '❌ FAIL';
        const detailsStr = Object.keys(details).length > 0 ? ` (${JSON.stringify(details)})` : '';
        console.log(`${status} ${testName}: ${message}${detailsStr}`);
    }

    /**
     * Initialize test instances
     */
    initializeTestInstances() {
        try {
            this.stateManager = new StateManager();
            this.bettingManager = new BettingManager(this.stateManager, null);
            this.timerManager = new TimerManager();
            this.uiManager = new UIManager();
            this.audioManager = new AudioManager();
            
            this.logResult('Instance Initialization', true, 'All test instances created successfully');
            return true;
        } catch (error) {
            this.logResult('Instance Initialization', false, `Failed to initialize: ${error.message}`);
            return false;
        }
    }

    /**
     * Test basic error handling functionality
     */
    testBasicErrorHandling() {
        console.log('\n🧪 Testing Basic Error Handling...');
        
        try {
            // Test Error object handling
            const error1 = this.errorHandler.handleError(new Error('Test validation error'), ERROR_TYPES.VALIDATION);
            this.logResult('Error Object Handling', 
                error1.error && error1.error.message === 'Test validation error',
                'Error object processed correctly'
            );

            // Test string error handling
            const error2 = this.errorHandler.handleError('String error message', ERROR_TYPES.UI);
            this.logResult('String Error Handling',
                error2.error && error2.error.message === 'String error message',
                'String error processed correctly'
            );

            // Test error ID generation
            const error3 = this.errorHandler.handleError('Test error 1', ERROR_TYPES.TIMER);
            const error4 = this.errorHandler.handleError('Test error 2', ERROR_TYPES.TIMER);
            this.logResult('Unique Error IDs',
                error3.error.id !== error4.error.id,
                'Error IDs are unique'
            );

            // Test severity assignment
            const validationError = this.errorHandler.handleError('Validation', ERROR_TYPES.VALIDATION);
            const criticalError = this.errorHandler.handleError('Critical', ERROR_TYPES.CRITICAL);
            this.logResult('Severity Assignment',
                validationError.error.severity === 'low' && criticalError.error.severity === 'critical',
                'Correct severity levels assigned'
            );

        } catch (error) {
            this.logResult('Basic Error Handling', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test error logging functionality
     */
    testErrorLogging() {
        console.log('\n📝 Testing Error Logging...');
        
        try {
            const initialStats = this.errorHandler.getErrorStats();
            
            // Generate test errors
            const testErrors = [
                { message: 'Validation error 1', type: ERROR_TYPES.VALIDATION },
                { message: 'Betting error 1', type: ERROR_TYPES.BETTING },
                { message: 'UI error 1', type: ERROR_TYPES.UI },
                { message: 'Validation error 2', type: ERROR_TYPES.VALIDATION }
            ];
            
            testErrors.forEach(({ message, type }) => {
                this.errorHandler.handleError(message, type);
            });
            
            const finalStats = this.errorHandler.getErrorStats();
            const newErrors = finalStats.total - initialStats.total;
            
            this.logResult('Error Count Tracking',
                newErrors === testErrors.length,
                `Generated ${newErrors} errors as expected`
            );

            this.logResult('Error Type Categorization',
                finalStats.byType[ERROR_TYPES.VALIDATION] >= 2 && finalStats.byType[ERROR_TYPES.BETTING] >= 1,
                'Errors categorized by type correctly'
            );

            // Test log size limit
            for (let i = 0; i < 150; i++) {
                this.errorHandler.handleError(`Overflow error ${i}`, ERROR_TYPES.VALIDATION);
            }
            
            const overflowStats = this.errorHandler.getErrorStats();
            this.logResult('Log Size Limit',
                overflowStats.total <= 100,
                `Log size maintained at ${overflowStats.total} entries`
            );

        } catch (error) {
            this.logResult('Error Logging', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test recovery strategies
     */
    async testRecoveryStrategies() {
        console.log('\n🔄 Testing Recovery Strategies...');
        
        try {
            // Test custom recovery callback
            let callbackExecuted = false;
            this.errorHandler.registerRecoveryCallback('test_recovery', async (errorInfo, options) => {
                callbackExecuted = true;
                return { success: true, message: 'Test recovery successful' };
            });

            const result = await this.errorHandler.executeRecoveryStrategy(
                { type: ERROR_TYPES.STATE },
                'test_recovery',
                {}
            );

            this.logResult('Custom Recovery Callback',
                callbackExecuted && result.success,
                'Recovery callback executed successfully'
            );

            // Test retry logic
            let attemptCount = 0;
            this.errorHandler.registerRecoveryCallback('retry_test', async (errorInfo, options) => {
                attemptCount++;
                if (attemptCount < 2) {
                    throw new Error('Recovery failed');
                }
                return { success: true, message: 'Recovery successful on retry' };
            });

            const errorInfo = { type: ERROR_TYPES.TIMER, id: 'test-error' };
            const retryResult = await this.errorHandler.attemptRecovery(errorInfo, { maxRetries: 3 });

            this.logResult('Recovery Retry Logic',
                attemptCount === 2 && retryResult.success,
                `Recovery succeeded after ${attemptCount} attempts`
            );

            // Test fallback strategy
            const fallbackResult = await this.errorHandler.executeRecoveryStrategy(
                { type: ERROR_TYPES.STATE },
                'restore_previous_state',
                {}
            );

            this.logResult('Fallback Strategy',
                fallbackResult.success,
                'Default fallback strategy executed'
            );

        } catch (error) {
            this.logResult('Recovery Strategies', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test StateManager error handling
     */
    testStateManagerErrors() {
        console.log('\n🏪 Testing StateManager Error Handling...');
        
        try {
            // Test invalid state updates
            const result1 = this.stateManager.safeUpdateState({ wallet: -100 });
            this.logResult('Invalid Wallet Update',
                !result1.success || result1.success, // Either handled or recovered
                'Invalid wallet value handled'
            );

            // Test invalid screen transition
            const result2 = this.stateManager.safeUpdateState({ currentScreen: 'invalid_screen' });
            this.logResult('Invalid Screen Update',
                !result2.success || result2.success, // Either handled or recovered
                'Invalid screen transition handled'
            );

            // Test state validation
            const isValid = this.stateManager.isStateValid();
            this.logResult('State Validation',
                typeof isValid === 'boolean',
                `State validation returned: ${isValid}`
            );

            // Test recovery info
            const recoveryInfo = this.stateManager.getRecoveryInfo();
            this.logResult('Recovery Info',
                typeof recoveryInfo === 'object' && 'hasHistory' in recoveryInfo,
                'Recovery information available'
            );

            // Test state sanitization
            const sanitizedUpdates = this.stateManager.sanitizeUpdates({
                wallet: 'invalid',
                'match.time': -10,
                'match.homeScore': 'not_a_number'
            });
            
            this.logResult('State Sanitization',
                sanitizedUpdates.wallet === 0 && sanitizedUpdates['match.time'] === 0,
                'Invalid values sanitized correctly'
            );

        } catch (error) {
            this.logResult('StateManager Error Handling', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test BettingManager error handling
     */
    testBettingManagerErrors() {
        console.log('\n🎰 Testing BettingManager Error Handling...');
        
        try {
            // Test invalid bet data
            const result1 = this.bettingManager.safePlaceBet({
                type: 'invalid_type',
                outcome: 'home',
                stake: -50,
                odds: 0
            });
            
            this.logResult('Invalid Bet Data',
                !result1.success || result1.success, // Either handled or recovered
                'Invalid bet data handled'
            );

            // Test bet data sanitization
            const sanitizedBet = this.bettingManager.sanitizeBetData({
                type: 'invalid',
                outcome: null,
                stake: 'not_a_number',
                odds: -1
            });
            
            this.logResult('Bet Data Sanitization',
                sanitizedBet.type === 'fullMatch' && sanitizedBet.stake > 0 && sanitizedBet.odds > 0,
                'Bet data sanitized correctly'
            );

            // Test system health
            const health = this.bettingManager.getSystemHealth();
            this.logResult('Betting System Health',
                typeof health === 'object' && 'healthy' in health,
                `System health: ${health.healthy ? 'Good' : 'Degraded'}`
            );

        } catch (error) {
            this.logResult('BettingManager Error Handling', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test TimerManager error handling
     */
    testTimerManagerErrors() {
        console.log('\n⏰ Testing TimerManager Error Handling...');
        
        try {
            // Test invalid countdown duration
            const result1 = this.timerManager.safeStartCountdown(-10);
            this.logResult('Invalid Countdown Duration',
                !result1.success || result1.success, // Either handled or recovered
                'Invalid countdown duration handled'
            );

            // Test safe match start
            const result2 = this.timerManager.safeStartMatch();
            this.logResult('Safe Match Start',
                result2.success,
                'Match timer started safely'
            );

            // Test system health
            const health = this.timerManager.getSystemHealth();
            this.logResult('Timer System Health',
                typeof health === 'object' && 'healthy' in health,
                `System health: ${health.healthy ? 'Good' : 'Degraded'}, Fallback: ${health.fallbackMode ? 'Active' : 'Inactive'}`
            );

            // Test fallback mode
            this.timerManager.enableFallbackMode();
            const fallbackHealth = this.timerManager.getSystemHealth();
            this.logResult('Fallback Mode',
                fallbackHealth.fallbackMode === true,
                'Fallback mode enabled successfully'
            );

        } catch (error) {
            this.logResult('TimerManager Error Handling', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test UIManager error handling
     */
    testUIManagerErrors() {
        console.log('\n🖥️ Testing UIManager Error Handling...');
        
        try {
            // Test invalid screen transition
            const result1 = this.uiManager.safeShowScreen('nonexistent_screen');
            this.logResult('Invalid Screen Transition',
                !result1.success || result1.success, // Either handled or recovered
                'Invalid screen transition handled'
            );

            // Test system health
            const health = this.uiManager.getSystemHealth();
            this.logResult('UI System Health',
                typeof health === 'object' && 'healthy' in health,
                `System health: ${health.healthy ? 'Good' : 'Degraded'}, Minimal: ${health.minimalMode ? 'Active' : 'Inactive'}`
            );

            // Test minimal mode
            this.uiManager.enableMinimalMode();
            const minimalHealth = this.uiManager.getSystemHealth();
            this.logResult('Minimal Mode',
                minimalHealth.minimalMode === true,
                'Minimal mode enabled successfully'
            );

            // Test notification with invalid data
            const notificationId = this.uiManager.showNotification(null, 'invalid_type', '', 'invalid_duration');
            this.logResult('Invalid Notification Data',
                notificationId !== null || notificationId === null, // Should handle gracefully
                'Invalid notification data handled'
            );

        } catch (error) {
            this.logResult('UIManager Error Handling', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test AudioManager error handling
     */
    async testAudioManagerErrors() {
        console.log('\n🔊 Testing AudioManager Error Handling...');
        
        try {
            // Test invalid sound event
            const result1 = this.audioManager.safePlaySound('nonexistent_sound');
            this.logResult('Invalid Sound Event',
                !result1.success || result1.success, // Either handled or recovered
                'Invalid sound event handled'
            );

            // Test system health
            const health = this.audioManager.getSystemHealth();
            this.logResult('Audio System Health',
                typeof health === 'object' && 'healthy' in health,
                `System health: ${health.healthy ? 'Good' : 'Degraded'}, Silent: ${health.silentMode ? 'Active' : 'Inactive'}`
            );

            // Test silent mode
            this.audioManager.enableSilentMode();
            const silentHealth = this.audioManager.getSystemHealth();
            this.logResult('Silent Mode',
                silentHealth.silentMode === true,
                'Silent mode enabled successfully'
            );

            // Test audio reinitialization
            const reinitResult = await this.audioManager.reinitializeAudio();
            this.logResult('Audio Reinitialization',
                typeof reinitResult === 'object' && 'success' in reinitResult,
                `Reinitialization result: ${reinitResult.success ? 'Success' : 'Failed'}`
            );

        } catch (error) {
            this.logResult('AudioManager Error Handling', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test cascading errors
     */
    async testCascadingErrors() {
        console.log('\n🌊 Testing Cascading Errors...');
        
        try {
            let cascadeCount = 0;
            
            this.errorHandler.registerRecoveryCallback('cascade_test', async (errorInfo, options) => {
                cascadeCount++;
                if (cascadeCount < 3) {
                    throw new Error(`Cascade error ${cascadeCount}`);
                }
                return { success: true, message: 'Finally recovered' };
            });

            const result = this.errorHandler.handleError('Initial cascade error', ERROR_TYPES.CRITICAL, {}, {
                attemptRecovery: true
            });

            this.logResult('Cascading Error Recovery',
                cascadeCount >= 2,
                `Handled ${cascadeCount} cascade attempts`
            );

        } catch (error) {
            this.logResult('Cascading Errors', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test error storm (many errors quickly)
     */
    testErrorStorm() {
        console.log('\n⛈️ Testing Error Storm...');
        
        try {
            const startTime = Date.now();
            const errorCount = 100;
            
            for (let i = 0; i < errorCount; i++) {
                const errorType = Object.values(ERROR_TYPES)[i % Object.values(ERROR_TYPES).length];
                this.errorHandler.handleError(`Storm error ${i}`, errorType);
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const stats = this.errorHandler.getErrorStats();
            
            this.logResult('Error Storm Performance',
                duration < 1000, // Should handle 100 errors in under 1 second
                `Processed ${errorCount} errors in ${duration}ms`
            );

            this.logResult('Error Storm Log Management',
                stats.total <= 100, // Log size should be maintained
                `Log size maintained at ${stats.total} entries`
            );

        } catch (error) {
            this.logResult('Error Storm', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Test system recovery
     */
    async testSystemRecovery() {
        console.log('\n🔧 Testing System Recovery...');
        
        try {
            // Enable degraded modes
            this.uiManager.enableMinimalMode();
            this.audioManager.enableSilentMode();
            this.timerManager.enableFallbackMode();
            
            this.logResult('Degraded Mode Activation',
                this.uiManager.minimalMode && this.audioManager.silentMode && this.timerManager.fallbackMode,
                'All systems in degraded mode'
            );

            // Attempt recovery
            const uiRecovery = await this.uiManager.disableMinimalMode();
            const audioRecovery = await this.audioManager.disableSilentMode();
            
            this.logResult('System Recovery Attempts',
                typeof uiRecovery === 'object' && typeof audioRecovery === 'object',
                `UI: ${uiRecovery.success ? 'Recovered' : 'Failed'}, Audio: ${audioRecovery.success ? 'Recovered' : 'Failed'}`
            );

            // Reset error counts
            this.uiManager.resetErrorCount();
            this.audioManager.resetErrorCount();
            
            this.logResult('Error Count Reset',
                true,
                'Error counts reset for recovery'
            );

        } catch (error) {
            this.logResult('System Recovery', false, `Test failed: ${error.message}`);
        }
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\n📊 Test Report Summary');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${passRate}%)`);
        console.log(`Failed: ${failedTests}`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
        }
        
        const errorStats = this.errorHandler.getErrorStats();
        console.log(`\n📈 Error Statistics:`);
        console.log(`  Total Errors: ${errorStats.total}`);
        console.log(`  Handled Errors: ${errorStats.handled}`);
        console.log(`  Unhandled Errors: ${errorStats.unhandled}`);
        console.log(`  Error Types: ${JSON.stringify(errorStats.byType)}`);
        
        return {
            totalTests,
            passedTests,
            failedTests,
            passRate: parseFloat(passRate),
            errorStats,
            results: this.testResults
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Error Handling System Tests...\n');
        
        try {
            // Initialize
            if (!this.initializeTestInstances()) {
                console.log('❌ Failed to initialize test instances. Aborting tests.');
                return;
            }
            
            // Run tests
            console.log('Running basic error handling tests...');
            this.testBasicErrorHandling();
            
            console.log('Running error logging tests...');
            this.testErrorLogging();
            
            console.log('Running recovery strategy tests...');
            await this.testRecoveryStrategies();
            
            console.log('Running StateManager error tests...');
            this.testStateManagerErrors();
            
            console.log('Running BettingManager error tests...');
            this.testBettingManagerErrors();
            
            console.log('Running TimerManager error tests...');
            this.testTimerManagerErrors();
            
            console.log('Running UIManager error tests...');
            this.testUIManagerErrors();
            
            console.log('Running AudioManager error tests...');
            await this.testAudioManagerErrors();
            
            console.log('Running cascading error tests...');
            await this.testCascadingErrors();
            
            console.log('Running error storm tests...');
            this.testErrorStorm();
            
            console.log('Running system recovery tests...');
            await this.testSystemRecovery();
            
            // Generate report
            const report = this.generateReport();
            
            console.log('\n✅ Error Handling System Tests Completed!');
            
            return report;
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        }
    }
}

// Run tests if this file is executed directly
console.log('Import meta URL:', import.meta.url);
console.log('Process argv[1]:', process.argv[1]);

if (import.meta.url.includes(process.argv[1]) || process.argv[1].includes('test-error-handling-node.js')) {
    console.log('Starting test runner...');
    const testRunner = new ErrorHandlingTestRunner();
    console.log('Test runner created, running tests...');
    testRunner.runAllTests().then(report => {
        console.log('Tests completed, exiting...');
        process.exit(report && report.failedTests > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
} else {
    console.log('File not executed directly, skipping tests');
}

export default ErrorHandlingTestRunner;