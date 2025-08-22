/**
 * ErrorHandler Tests
 * Tests for comprehensive error handling system
 */

import { ErrorHandler, ERROR_TYPES } from './ErrorHandler.js';

describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
        errorHandler.setDebugMode(false); // Reduce console noise in tests
    });

    afterEach(() => {
        errorHandler.clearErrorLog();
    });

    describe('Error Handling', () => {
        test('should handle basic error', () => {
            const error = new Error('Test error');
            const result = errorHandler.handleError(error, ERROR_TYPES.VALIDATION);
            
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('error');
            expect(result.error.message).toBe('Test error');
            expect(result.error.type).toBe(ERROR_TYPES.VALIDATION);
        });

        test('should handle string error', () => {
            const result = errorHandler.handleError('String error', ERROR_TYPES.UI);
            
            expect(result.error.message).toBe('String error');
            expect(result.error.type).toBe(ERROR_TYPES.UI);
        });

        test('should generate unique error IDs', () => {
            const result1 = errorHandler.handleError('Error 1', ERROR_TYPES.TIMER);
            const result2 = errorHandler.handleError('Error 2', ERROR_TYPES.TIMER);
            
            expect(result1.error.id).not.toBe(result2.error.id);
        });

        test('should assign correct severity levels', () => {
            const validationResult = errorHandler.handleError('Validation error', ERROR_TYPES.VALIDATION);
            const criticalResult = errorHandler.handleError('Critical error', ERROR_TYPES.CRITICAL);
            
            expect(validationResult.error.severity).toBe('low');
            expect(criticalResult.error.severity).toBe('critical');
        });

        test('should include context information', () => {
            const context = { component: 'TestComponent', action: 'testAction' };
            const result = errorHandler.handleError('Test error', ERROR_TYPES.STATE, context);
            
            expect(result.error.context).toEqual(context);
        });
    });

    describe('Error Logging', () => {
        test('should log errors to internal log', () => {
            errorHandler.handleError('Test error', ERROR_TYPES.BETTING);
            
            const stats = errorHandler.getErrorStats();
            expect(stats.total).toBe(1);
            expect(stats.byType[ERROR_TYPES.BETTING]).toBe(1);
        });

        test('should maintain log size limit', () => {
            // Add more than 100 errors
            for (let i = 0; i < 120; i++) {
                errorHandler.handleError(`Error ${i}`, ERROR_TYPES.VALIDATION);
            }
            
            const stats = errorHandler.getErrorStats();
            expect(stats.total).toBeLessThanOrEqual(100);
        });

        test('should provide error statistics', () => {
            errorHandler.handleError('Error 1', ERROR_TYPES.VALIDATION);
            errorHandler.handleError('Error 2', ERROR_TYPES.BETTING);
            errorHandler.handleError('Error 3', ERROR_TYPES.VALIDATION);
            
            const stats = errorHandler.getErrorStats();
            expect(stats.total).toBe(3);
            expect(stats.byType[ERROR_TYPES.VALIDATION]).toBe(2);
            expect(stats.byType[ERROR_TYPES.BETTING]).toBe(1);
            expect(stats.unhandled).toBe(3);
        });
    });

    describe('Recovery Strategies', () => {
        test('should register and execute recovery callbacks', async () => {
            let callbackExecuted = false;
            
            errorHandler.registerRecoveryCallback('test_strategy', async (errorInfo, options) => {
                callbackExecuted = true;
                return { success: true, message: 'Recovery successful' };
            });
            
            const result = await errorHandler.executeRecoveryStrategy(
                { type: ERROR_TYPES.VALIDATION },
                'test_strategy',
                {}
            );
            
            expect(callbackExecuted).toBe(true);
            expect(result.success).toBe(true);
        });

        test('should attempt recovery with retry logic', async () => {
            let attemptCount = 0;
            
            errorHandler.registerRecoveryCallback('retry_strategy', async (errorInfo, options) => {
                attemptCount++;
                if (attemptCount < 2) {
                    throw new Error('Recovery failed');
                }
                return { success: true, message: 'Recovery successful on retry' };
            });
            
            const errorInfo = { type: ERROR_TYPES.TIMER, id: 'test-error' };
            const result = await errorHandler.attemptRecovery(errorInfo, { maxRetries: 3 });
            
            expect(attemptCount).toBe(2);
            expect(result.success).toBe(true);
        });

        test('should fall back to default strategy on failure', async () => {
            const errorInfo = { type: ERROR_TYPES.STATE, id: 'test-error' };
            const result = await errorHandler.attemptRecovery(errorInfo);
            
            // Should use default fallback strategy
            expect(result.success).toBe(true);
        });
    });

    describe('Global Error Handlers', () => {
        test('should handle unhandled promise rejections', () => {
            const originalHandler = window.onunhandledrejection;
            let handledError = null;
            
            // Mock the error handler
            const mockHandler = jest.spyOn(errorHandler, 'handleError').mockImplementation((error, type, context) => {
                handledError = { error, type, context };
                return { success: true };
            });
            
            // Simulate unhandled rejection
            const event = new Event('unhandledrejection');
            event.reason = new Error('Unhandled promise rejection');
            event.promise = Promise.reject('test');
            
            window.dispatchEvent(event);
            
            expect(mockHandler).toHaveBeenCalled();
            
            mockHandler.mockRestore();
            window.onunhandledrejection = originalHandler;
        });
    });

    describe('Debug Mode', () => {
        test('should enable debug mode', () => {
            errorHandler.setDebugMode(true);
            
            // Debug mode should be reflected in logging behavior
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            errorHandler.handleError('Debug test error', ERROR_TYPES.CRITICAL);
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Error Export', () => {
        test('should export error log', () => {
            errorHandler.handleError('Export test error', ERROR_TYPES.NETWORK);
            
            const exported = errorHandler.exportErrorLog();
            
            expect(exported).toHaveProperty('timestamp');
            expect(exported).toHaveProperty('errors');
            expect(exported).toHaveProperty('stats');
            expect(exported.errors).toHaveLength(1);
            expect(exported.errors[0].message).toBe('Export test error');
        });
    });

    describe('User-Friendly Messages', () => {
        test('should provide user-friendly error messages', () => {
            const errorInfo = {
                type: ERROR_TYPES.BETTING,
                message: 'Technical betting error'
            };
            
            const userMessage = errorHandler.getUserFriendlyMessage(errorInfo);
            
            expect(userMessage).toBe('Betting error occurred. Please try placing your bet again.');
        });

        test('should handle unknown error types', () => {
            const errorInfo = {
                type: 'UNKNOWN_TYPE',
                message: 'Unknown error'
            };
            
            const userMessage = errorHandler.getUserFriendlyMessage(errorInfo);
            
            expect(userMessage).toBe('An unexpected error occurred. Please try again.');
        });
    });
});

// Integration tests for error handling across modules
describe('Error Handler Integration', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
    });

    test('should handle cascading errors', async () => {
        let recoveryAttempts = 0;
        
        errorHandler.registerRecoveryCallback('cascade_test', async (errorInfo, options) => {
            recoveryAttempts++;
            if (recoveryAttempts === 1) {
                throw new Error('Recovery also failed');
            }
            return { success: true, message: 'Finally recovered' };
        });
        
        const result = errorHandler.handleError('Initial error', ERROR_TYPES.UI, {}, {
            attemptRecovery: true
        });
        
        expect(recoveryAttempts).toBeGreaterThan(0);
    });

    test('should maintain error context through recovery', async () => {
        const originalContext = { component: 'TestComponent', operation: 'testOp' };
        
        errorHandler.registerRecoveryCallback('context_test', async (errorInfo, options) => {
            expect(errorInfo.context).toEqual(originalContext);
            return { success: true, message: 'Context preserved' };
        });
        
        await errorHandler.handleError('Context test error', ERROR_TYPES.STATE, originalContext, {
            attemptRecovery: true
        });
    });

    test('should handle recovery callback errors gracefully', async () => {
        errorHandler.registerRecoveryCallback('failing_recovery', async (errorInfo, options) => {
            throw new Error('Recovery callback failed');
        });
        
        const result = errorHandler.handleError('Test error', ERROR_TYPES.TIMER, {}, {
            attemptRecovery: true
        });
        
        // Should not throw, should handle recovery failure gracefully
        expect(result).toHaveProperty('success');
    });
});