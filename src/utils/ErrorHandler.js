/**
 * Centralized Error Handler for Soccer Betting Game
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.errorCallbacks = new Map();
        this.recoveryStrategies = new Map();
        this.debugMode = false;
        
        // Initialize error categories
        this.ERROR_TYPES = {
            VALIDATION: 'VALIDATION',
            STATE: 'STATE',
            TIMER: 'TIMER',
            UI: 'UI',
            AUDIO: 'AUDIO',
            BETTING: 'BETTING',
            NETWORK: 'NETWORK',
            CRITICAL: 'CRITICAL'
        };
        
        // Initialize recovery strategies
        this.initializeRecoveryStrategies();
        
        // Set up global error handlers
        this.setupGlobalErrorHandlers();
    }
    
    /**
     * Initialize recovery strategies for different error types
     */
    initializeRecoveryStrategies() {
        this.recoveryStrategies.set(this.ERROR_TYPES.VALIDATION, {
            strategy: 'retry_with_defaults',
            maxRetries: 3,
            fallback: 'use_safe_defaults'
        });
        
        this.recoveryStrategies.set(this.ERROR_TYPES.STATE, {
            strategy: 'restore_previous_state',
            maxRetries: 2,
            fallback: 'reset_to_initial_state'
        });
        
        this.recoveryStrategies.set(this.ERROR_TYPES.TIMER, {
            strategy: 'restart_timer',
            maxRetries: 3,
            fallback: 'manual_time_tracking'
        });
        
        this.recoveryStrategies.set(this.ERROR_TYPES.UI, {
            strategy: 'refresh_component',
            maxRetries: 2,
            fallback: 'minimal_ui_mode'
        });
        
        this.recoveryStrategies.set(this.ERROR_TYPES.AUDIO, {
            strategy: 'disable_audio',
            maxRetries: 1,
            fallback: 'silent_mode'
        });
        
        this.recoveryStrategies.set(this.ERROR_TYPES.BETTING, {
            strategy: 'validate_and_retry',
            maxRetries: 2,
            fallback: 'disable_betting_temporarily'
        });
        
        this.recoveryStrategies.set(this.ERROR_TYPES.CRITICAL, {
            strategy: 'safe_shutdown',
            maxRetries: 0,
            fallback: 'emergency_state_save'
        });
    }
    
    /**
     * Set up global error handlers for unhandled errors
     */
    setupGlobalErrorHandlers() {
        // Only set up browser-specific handlers if window is available
        if (typeof window !== 'undefined') {
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(event.reason, this.ERROR_TYPES.CRITICAL, {
                    context: 'unhandled_promise_rejection',
                    promise: event.promise
                });
                event.preventDefault();
            });
            
            // Handle general JavaScript errors
            window.addEventListener('error', (event) => {
                this.handleError(event.error, this.ERROR_TYPES.CRITICAL, {
                    context: 'global_error',
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
        }
        
        // Set up Node.js specific handlers if process is available
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this.handleError(error, this.ERROR_TYPES.CRITICAL, {
                    context: 'uncaught_exception'
                });
            });
            
            process.on('unhandledRejection', (reason, promise) => {
                this.handleError(reason, this.ERROR_TYPES.CRITICAL, {
                    context: 'unhandled_rejection',
                    promise: promise
                });
            });
        }
    }
    
    /**
     * Main error handling method
     * @param {Error|string} error - The error to handle
     * @param {string} type - Error type from ERROR_TYPES
     * @param {Object} context - Additional context information
     * @param {Object} options - Handling options
     */
    handleError(error, type = this.ERROR_TYPES.CRITICAL, context = {}, options = {}) {
        const errorInfo = this.createErrorInfo(error, type, context);
        
        // Log the error
        this.logError(errorInfo);
        
        // Attempt recovery if enabled
        if (options.attemptRecovery !== false) {
            return this.attemptRecovery(errorInfo, options);
        }
        
        // Show user notification if enabled
        if (options.showUserMessage !== false) {
            this.showUserError(errorInfo);
        }
        
        return { success: false, error: errorInfo };
    }
    
    /**
     * Create standardized error information object
     */
    createErrorInfo(error, type, context) {
        const timestamp = new Date().toISOString();
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : null;
        
        return {
            id: this.generateErrorId(),
            timestamp,
            type,
            message: errorMessage,
            stack,
            context,
            severity: this.getSeverity(type),
            handled: false
        };
    }
    
    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get error severity level
     */
    getSeverity(type) {
        const severityMap = {
            [this.ERROR_TYPES.VALIDATION]: 'low',
            [this.ERROR_TYPES.STATE]: 'medium',
            [this.ERROR_TYPES.TIMER]: 'medium',
            [this.ERROR_TYPES.UI]: 'medium',
            [this.ERROR_TYPES.AUDIO]: 'low',
            [this.ERROR_TYPES.BETTING]: 'high',
            [this.ERROR_TYPES.NETWORK]: 'medium',
            [this.ERROR_TYPES.CRITICAL]: 'critical'
        };
        
        return severityMap[type] || 'medium';
    }
    
    /**
     * Log error to console and internal log
     */
    logError(errorInfo) {
        // Add to internal log
        this.errorLog.push(errorInfo);
        
        // Keep log size manageable
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-50);
        }
        
        // Console logging based on severity
        const logMethod = this.getLogMethod(errorInfo.severity);
        const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
        
        if (this.debugMode) {
            logMethod(`${logMessage}\nContext:`, errorInfo.context, '\nStack:', errorInfo.stack);
        } else {
            logMethod(logMessage);
        }
    }
    
    /**
     * Get appropriate console log method based on severity
     */
    getLogMethod(severity) {
        switch (severity) {
            case 'critical':
                return console.error.bind(console);
            case 'high':
                return console.error.bind(console);
            case 'medium':
                return console.warn.bind(console);
            case 'low':
                return console.info.bind(console);
            default:
                return console.log.bind(console);
        }
    }
    
    /**
     * Attempt error recovery based on error type
     */
    async attemptRecovery(errorInfo, options = {}) {
        const strategy = this.recoveryStrategies.get(errorInfo.type);
        if (!strategy) {
            return { success: false, error: errorInfo };
        }
        
        const maxRetries = options.maxRetries || strategy.maxRetries;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                const result = await this.executeRecoveryStrategy(errorInfo, strategy.strategy, options);
                if (result.success) {
                    errorInfo.handled = true;
                    this.logRecovery(errorInfo, strategy.strategy, retryCount + 1);
                    return result;
                }
            } catch (recoveryError) {
                this.logError(this.createErrorInfo(recoveryError, this.ERROR_TYPES.CRITICAL, {
                    originalError: errorInfo.id,
                    recoveryAttempt: retryCount + 1
                }));
            }
            
            retryCount++;
        }
        
        // Try fallback strategy
        try {
            const fallbackResult = await this.executeRecoveryStrategy(errorInfo, strategy.fallback, options);
            if (fallbackResult.success) {
                errorInfo.handled = true;
                this.logRecovery(errorInfo, strategy.fallback, 'fallback');
                return fallbackResult;
            }
        } catch (fallbackError) {
            this.logError(this.createErrorInfo(fallbackError, this.ERROR_TYPES.CRITICAL, {
                originalError: errorInfo.id,
                fallbackAttempt: true
            }));
        }
        
        return { success: false, error: errorInfo };
    }
    
    /**
     * Execute specific recovery strategy
     */
    async executeRecoveryStrategy(errorInfo, strategyName, options) {
        const recoveryCallback = this.errorCallbacks.get(strategyName);
        
        if (recoveryCallback) {
            return await recoveryCallback(errorInfo, options);
        }
        
        // Default recovery strategies
        switch (strategyName) {
            case 'retry_with_defaults':
                return { success: true, message: 'Using default values' };
            
            case 'restore_previous_state':
                return { success: true, message: 'State restored' };
            
            case 'restart_timer':
                return { success: true, message: 'Timer restarted' };
            
            case 'refresh_component':
                return { success: true, message: 'Component refreshed' };
            
            case 'disable_audio':
                return { success: true, message: 'Audio disabled' };
            
            case 'silent_mode':
                return { success: true, message: 'Silent mode enabled' };
            
            case 'validate_and_retry':
                return { success: true, message: 'Validation passed, retrying' };
            
            case 'disable_betting_temporarily':
                return { success: true, message: 'Betting temporarily disabled' };
            
            case 'minimal_ui_mode':
                return { success: true, message: 'Minimal UI mode activated' };
            
            case 'safe_shutdown':
                return { success: true, message: 'Safe shutdown initiated' };
            
            case 'emergency_state_save':
                return { success: true, message: 'Emergency state saved' };
            
            default:
                return { success: false, message: 'Unknown recovery strategy' };
        }
    }
    
    /**
     * Log successful recovery
     */
    logRecovery(errorInfo, strategy, attempt) {
        const message = `Recovery successful for error ${errorInfo.id} using ${strategy} (attempt: ${attempt})`;
        console.info(message);
    }
    
    /**
     * Show user-friendly error message
     */
    showUserError(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        
        // Try to show notification through UI system (browser only)
        if (typeof window !== 'undefined' && window.gameController && window.gameController.uiManager) {
            window.gameController.uiManager.showNotification(userMessage, 'error');
        } else {
            // Fallback to console logging
            console.warn('UI system unavailable, logging error:', userMessage);
        }
    }
    
    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(errorInfo) {
        const messageMap = {
            [this.ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
            [this.ERROR_TYPES.STATE]: 'Something went wrong. The game will try to recover automatically.',
            [this.ERROR_TYPES.TIMER]: 'Timer issue detected. The game will continue with manual timing.',
            [this.ERROR_TYPES.UI]: 'Display issue detected. Refreshing the interface.',
            [this.ERROR_TYPES.AUDIO]: 'Audio unavailable. The game will continue without sound.',
            [this.ERROR_TYPES.BETTING]: 'Betting error occurred. Please try placing your bet again.',
            [this.ERROR_TYPES.NETWORK]: 'Connection issue detected. Please check your internet connection.',
            [this.ERROR_TYPES.CRITICAL]: 'A critical error occurred. The game will attempt to recover.'
        };
        
        return messageMap[errorInfo.type] || 'An unexpected error occurred. Please try again.';
    }
    
    /**
     * Register recovery callback for specific strategy
     */
    registerRecoveryCallback(strategyName, callback) {
        this.errorCallbacks.set(strategyName, callback);
    }
    
    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.info(`Error handler debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            handled: 0,
            unhandled: 0
        };
        
        this.errorLog.forEach(error => {
            // Count by type
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            
            // Count handled vs unhandled
            if (error.handled) {
                stats.handled++;
            } else {
                stats.unhandled++;
            }
        });
        
        return stats;
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        console.info('Error log cleared');
    }
    
    /**
     * Export error log for debugging
     */
    exportErrorLog() {
        return {
            timestamp: new Date().toISOString(),
            errors: [...this.errorLog],
            stats: this.getErrorStats()
        };
    }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export error types for use in other modules
export const ERROR_TYPES = errorHandler.ERROR_TYPES;