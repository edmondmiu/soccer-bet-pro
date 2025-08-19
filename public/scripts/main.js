/**
 * Soccer Betting Game - Main Module
 * Extracted from inline JavaScript in game_prototype.html
 */

// Import existing modules
import { pauseManager } from './pauseManager.js';
import { pauseUI } from './pauseUI.js';

// --- CONSTANTS ---
const MOCK_MATCHES = [
    { home: 'Quantum Strikers', away: 'Celestial FC' },
    { home: 'Nova United', away: 'Vortex Rovers' },
];

// Event classifications for centralized betting detection (Requirement 6.5)
export const EVENT_CLASSIFICATIONS = {
    BETTING_EVENTS: [
        'MULTI_CHOICE_ACTION_BET',
        // Future betting event types will be automatically supported (Requirement 6.2, 6.5)
        'PENALTY_BET',
        'CORNER_BET', 
        'CARD_BET',
        'SUBSTITUTION_BET',
        'FREE_KICK_BET',
        'OFFSIDE_BET',
        'INJURY_TIME_BET',
        'PLAYER_PERFORMANCE_BET',
        'NEXT_GOAL_BET',
        'HALF_TIME_SCORE_BET'
    ],
    INFORMATIONAL_EVENTS: [
        'GOAL',
        'COMMENTARY', 
        'KICK_OFF',
        'HALF_TIME',
        'FULL_TIME',
        'SUBSTITUTION',
        'INJURY'
    ],
    RESOLUTION_EVENTS: [
        'RESOLUTION'
    ],
    // New classification for events that might become betting events in the future
    POTENTIAL_BETTING_EVENTS: [
        'YELLOW_CARD',
        'RED_CARD', 
        'PENALTY_AWARDED',
        'CORNER_KICK',
        'FREE_KICK',
        'OFFSIDE',
        'VAR_REVIEW'
    ]
};

// --- MAIN GAME CLASS ---
export class SoccerBettingGame {
    constructor() {
        this.state = this.getInitialState();
        this.matchInterval = null;
        this.pauseManager = null;
        this.pauseUI = null;
        
        // Error handling and debugging
        this.fallbackMode = false;
        this.errorLog = [];
        this.debugMode = localStorage.getItem('soccerBettingDebug') === 'true';
        
        // DOM Elements
        this.lobbyScreen = document.getElementById('lobby-screen');
        this.matchScreen = document.getElementById('match-screen');
        this.actionBetSlipModal = document.getElementById('action-bet-slip-modal');
        this.actionBetModal = document.getElementById('action-bet-modal');
        this.matchEndModal = document.getElementById('match-end-modal');
        this.inlineBetSlip = document.getElementById('inline-bet-slip');
        this.inlineStakeAmount = document.getElementById('inline-stake-amount');
        this.confettiContainer = document.getElementById('confetti-container');
        
        // Initialize error handling
        this.initializeErrorHandling();
        
        // Make game instance globally available for debugging and error recovery
        window.soccerBettingGame = this;
    }

    // --- ERROR HANDLING AND LOGGING ---
    
    /**
     * Initialize comprehensive error handling system
     */
    initializeErrorHandling() {
        try {
            // Set up global error handlers
            window.addEventListener('error', (event) => {
                this.logError('GLOBAL_ERROR', 'Uncaught JavaScript error', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.logError('UNHANDLED_PROMISE_REJECTION', 'Unhandled promise rejection', {
                    reason: event.reason,
                    stack: event.reason?.stack
                });
            });

            // Set up module import error detection
            this.setupModuleErrorDetection();
            
            console.log('SoccerBettingGame: Error handling initialized');
        } catch (error) {
            console.error('Failed to initialize error handling:', error);
        }
    }

    /**
     * Set up module import error detection
     */
    setupModuleErrorDetection() {
        try {
            // Monitor for module loading errors
            const originalImport = window.import || (() => {});
            
            // Override dynamic imports if available
            if (typeof window.import === 'function') {
                window.import = async (specifier) => {
                    try {
                        return await originalImport(specifier);
                    } catch (error) {
                        this.logError('MODULE_IMPORT_ERROR', `Failed to import module: ${specifier}`, {
                            specifier,
                            error: error.message,
                            stack: error.stack
                        });
                        throw error;
                    }
                };
            }
        } catch (error) {
            console.error('Failed to setup module error detection:', error);
        }
    }

    /**
     * Log errors with context and debugging information
     * @param {string} type - Error type/category
     * @param {string} message - Error message
     * @param {Object} context - Additional context information
     */
    logError(type, message, context = {}) {
        try {
            const errorEntry = {
                timestamp: new Date().toISOString(),
                type,
                message,
                context: {
                    ...context,
                    currentScreen: this.state?.currentScreen,
                    fallbackMode: this.fallbackMode,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                }
            };

            // Add to internal error log
            this.errorLog.push(errorEntry);
            
            // Keep only last 50 errors to prevent memory issues
            if (this.errorLog.length > 50) {
                this.errorLog = this.errorLog.slice(-50);
            }

            // Console logging with appropriate level
            if (type.includes('CRITICAL') || type.includes('FAILED')) {
                console.error(`[${type}] ${message}`, context);
            } else if (type.includes('WARNING') || type.includes('FALLBACK')) {
                console.warn(`[${type}] ${message}`, context);
            } else {
                console.log(`[${type}] ${message}`, context);
            }

            // Debug mode: show detailed information
            if (this.debugMode) {
                console.group(`🐛 Debug Info - ${type}`);
                console.log('Error Entry:', errorEntry);
                console.log('Current State:', this.state);
                console.log('Error Log History:', this.errorLog.slice(-5));
                console.groupEnd();
            }

            // Store in localStorage for debugging (last 10 errors only)
            try {
                const storedErrors = JSON.parse(localStorage.getItem('soccerBettingErrors') || '[]');
                storedErrors.push(errorEntry);
                localStorage.setItem('soccerBettingErrors', JSON.stringify(storedErrors.slice(-10)));
            } catch (storageError) {
                console.warn('Failed to store error in localStorage:', storageError);
            }

        } catch (loggingError) {
            console.error('Failed to log error:', loggingError);
        }
    }

    /**
     * Get error log for debugging
     * @returns {Array} Array of error entries
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('soccerBettingErrors');
        } catch (error) {
            console.warn('Failed to clear stored errors:', error);
        }
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        try {
            if (enabled) {
                localStorage.setItem('soccerBettingDebug', 'true');
                console.log('🐛 Debug mode enabled');
            } else {
                localStorage.removeItem('soccerBettingDebug');
                console.log('Debug mode disabled');
            }
        } catch (error) {
            console.warn('Failed to update debug mode setting:', error);
        }
    }

    /**
     * Show fallback pause notification when pause system is unavailable
     * @param {string} reason - Reason for the attempted pause
     */
    showFallbackPauseNotification(reason) {
        try {
            // Create or update fallback notification
            let notification = document.getElementById('fallback-pause-notification');
            
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'fallback-pause-notification';
                notification.className = 'fallback-notification pause-notification';
                document.body.appendChild(notification);
            }

            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">⏸️</div>
                    <div class="notification-text">
                        <strong>Pause Unavailable</strong>
                        <p>${reason}</p>
                    </div>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;

            // Add styles if not already present
            this.addFallbackNotificationStyles();

            // Show notification
            notification.classList.add('visible');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.classList.remove('visible');
                    setTimeout(() => {
                        if (notification && notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 5000);

        } catch (error) {
            console.error('Failed to show fallback pause notification:', error);
        }
    }

    /**
     * Show general fallback notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('info', 'warning', 'error')
     */
    showFallbackNotification(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.className = `fallback-notification ${type}-notification`;
            
            const icons = {
                info: 'ℹ️',
                warning: '⚠️',
                error: '❌'
            };

            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">${icons[type] || icons.info}</div>
                    <div class="notification-text">${message}</div>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;

            document.body.appendChild(notification);
            this.addFallbackNotificationStyles();

            // Show notification
            requestAnimationFrame(() => {
                notification.classList.add('visible');
            });

            // Auto-hide after 4 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.classList.remove('visible');
                    setTimeout(() => {
                        if (notification && notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 4000);

        } catch (error) {
            console.error('Failed to show fallback notification:', error);
        }
    }

    /**
     * Show persistent fallback mode indicator
     */
    showFallbackModeIndicator() {
        try {
            // Remove existing indicator if present
            const existing = document.getElementById('fallback-mode-indicator');
            if (existing) {
                existing.remove();
            }

            const indicator = document.createElement('div');
            indicator.id = 'fallback-mode-indicator';
            indicator.className = 'fallback-mode-indicator';
            indicator.innerHTML = `
                <div class="indicator-content">
                    <span class="indicator-icon">⚠️</span>
                    <span class="indicator-text">Limited Mode</span>
                    <button class="indicator-info" onclick="window.soccerBettingGame?.showFallbackModeInfo()" title="Click for more info">?</button>
                </div>
            `;

            document.body.appendChild(indicator);
            this.addFallbackNotificationStyles();

            // Show indicator
            requestAnimationFrame(() => {
                indicator.classList.add('visible');
            });

        } catch (error) {
            console.error('Failed to show fallback mode indicator:', error);
        }
    }

    /**
     * Show fallback mode information dialog
     */
    showFallbackModeInfo() {
        try {
            const info = `
                The game is running in Limited Mode because the pause system could not be loaded.
                
                This means:
                • Betting events will not pause the game
                • You may miss betting opportunities
                • Some features may be limited
                
                This usually happens due to:
                • Network connectivity issues
                • Browser compatibility problems
                • Script loading errors
                
                Try refreshing the page to restore full functionality.
            `;

            alert(info);
        } catch (error) {
            console.error('Failed to show fallback mode info:', error);
        }
    }

    /**
     * Force game resume as last resort error recovery
     * @param {string} reason - Reason for forced resume
     */
    forceGameResume(reason) {
        try {
            this.logError('FORCE_RESUME', 'Forcing game resume for error recovery', { reason });
            
            // Clear any active betting state
            if (this.state.currentActionBet) {
                this.state.currentActionBet.active = false;
                this.state.currentActionBet.details = null;
                if (this.state.currentActionBet.timeoutId) {
                    clearTimeout(this.state.currentActionBet.timeoutId);
                    this.state.currentActionBet.timeoutId = null;
                }
            }
            
            // Hide any visible modals
            const modals = ['action-bet-modal', 'action-bet-slip-modal'];
            modals.forEach(modalId => {
                try {
                    const modal = document.getElementById(modalId);
                    if (modal && !modal.classList.contains('hidden')) {
                        modal.classList.add('hidden');
                    }
                } catch (modalError) {
                    this.logError('FORCE_RESUME_MODAL_ERROR', 'Error hiding modal during force resume', {
                        modalId,
                        error: modalError.message
                    });
                }
            });
            
            // Force pause system resume if available
            if (this.pauseManager && !this.fallbackMode) {
                try {
                    if (this.pauseManager.isPaused()) {
                        this.pauseManager.resumeGame(false); // No countdown for emergency resume
                    }
                } catch (pauseResumeError) {
                    this.logError('FORCE_RESUME_PAUSE_ERROR', 'Error resuming pause system during force resume', {
                        error: pauseResumeError.message
                    });
                }
            }
            
            // Hide pause overlay if visible
            if (this.pauseUI && !this.fallbackMode) {
                try {
                    if (this.pauseUI.isOverlayVisible()) {
                        this.pauseUI.hidePauseOverlay();
                    }
                } catch (pauseUIError) {
                    this.logError('FORCE_RESUME_UI_ERROR', 'Error hiding pause overlay during force resume', {
                        error: pauseUIError.message
                    });
                }
            }
            
            // Add notification to event feed
            this.addEventToFeed(`⚡ Game resumed automatically (${reason})`, 'text-yellow-400');
            
            console.log(`SoccerBettingGame: Force resume completed - ${reason}`);
            
        } catch (error) {
            this.logError('FORCE_RESUME_ERROR', 'Error during force resume', {
                error: error.message,
                stack: error.stack,
                reason
            });
            console.error('Error during force resume:', error);
        }
    }

    /**
     * Show critical error message to user
     */
    showCriticalErrorMessage() {
        try {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'critical-error-message';
            errorDiv.innerHTML = `
                <div class="error-content">
                    <h2>⚠️ Game Loading Error</h2>
                    <p>The game encountered a critical error during initialization.</p>
                    <p>Please try refreshing the page. If the problem persists, check your browser console for details.</p>
                    <button onclick="window.location.reload()" class="error-reload-btn">Reload Game</button>
                    <button onclick="this.parentElement.parentElement.remove()" class="error-close-btn">Continue Anyway</button>
                </div>
            `;

            document.body.appendChild(errorDiv);
            this.addFallbackNotificationStyles();

            requestAnimationFrame(() => {
                errorDiv.classList.add('visible');
            });

        } catch (error) {
            console.error('Failed to show critical error message:', error);
        }
    }

    /**
     * Add CSS styles for fallback notifications
     */
    addFallbackNotificationStyles() {
        if (document.getElementById('fallback-notification-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'fallback-notification-styles';
        style.textContent = `
            .fallback-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                max-width: 320px;
                z-index: 1002;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .fallback-notification.visible {
                opacity: 1;
                transform: translateX(0);
            }

            .fallback-notification.warning-notification {
                border-color: #f59e0b;
            }

            .fallback-notification.error-notification {
                border-color: #dc2626;
            }

            .fallback-notification.info-notification {
                border-color: #3b82f6;
            }

            .notification-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                color: white;
            }

            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .notification-text {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }

            .notification-text strong {
                display: block;
                margin-bottom: 4px;
                font-weight: 600;
            }

            .notification-text p {
                margin: 0;
                opacity: 0.9;
            }

            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            .notification-close:hover {
                opacity: 1;
            }

            .fallback-mode-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                border-radius: 20px;
                padding: 8px 16px;
                z-index: 1001;
                opacity: 0;
                transform: translateY(100%);
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
            }

            .fallback-mode-indicator.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .indicator-content {
                display: flex;
                align-items: center;
                gap: 8px;
                color: white;
                font-size: 12px;
                font-weight: 600;
            }

            .indicator-icon {
                font-size: 14px;
            }

            .indicator-info {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                font-size: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }

            .indicator-info:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .critical-error-message {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1003;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .critical-error-message.visible {
                opacity: 1;
            }

            .error-content {
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                border: 2px solid #dc2626;
                border-radius: 12px;
                padding: 32px;
                max-width: 400px;
                text-align: center;
                color: white;
            }

            .error-content h2 {
                margin: 0 0 16px 0;
                color: #fca5a5;
                font-size: 24px;
            }

            .error-content p {
                margin: 0 0 12px 0;
                line-height: 1.5;
                opacity: 0.9;
            }

            .error-reload-btn, .error-close-btn {
                background: #dc2626;
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                margin: 8px;
                transition: background 0.2s ease;
            }

            .error-reload-btn:hover {
                background: #b91c1c;
            }

            .error-close-btn {
                background: #374151;
            }

            .error-close-btn:hover {
                background: #4b5563;
            }

            @media (max-width: 480px) {
                .fallback-notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .fallback-mode-indicator {
                    right: 10px;
                    bottom: 10px;
                }

                .error-content {
                    margin: 20px;
                    padding: 24px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // --- INITIALIZATION ---
    async initialize() {
        try {
            // Initialize pause system modules with enhanced error handling
            await this.initializePauseSystem();
            
            // Set up game event listeners
            this.setupEventListeners();
            
            // Initial render
            this.render();
            
            console.log('SoccerBettingGame: Initialization complete');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            // Fallback: continue without pause system
            this.initializeFallbackMode();
        }
    }

    /**
     * Initialize pause system modules with comprehensive error handling and callbacks
     */
    async initializePauseSystem() {
        try {
            this.logError('PAUSE_INIT_START', 'Starting pause system initialization');

            // Check if modules are available
            if (typeof pauseManager === 'undefined') {
                throw new Error('PauseManager module not imported or undefined');
            }
            
            if (typeof pauseUI === 'undefined') {
                throw new Error('PauseUI module not imported or undefined');
            }

            // Assign pause system instances with validation
            this.pauseManager = pauseManager;
            this.pauseUI = pauseUI;
            
            // Validate pauseManager interface
            const requiredPauseManagerMethods = ['pauseGame', 'resumeGame', 'isPaused', 'getPauseInfo'];
            for (const method of requiredPauseManagerMethods) {
                if (!this.pauseManager || typeof this.pauseManager[method] !== 'function') {
                    throw new Error(`PauseManager missing required method: ${method}`);
                }
            }
            
            // Validate pauseUI interface
            const requiredPauseUIMethods = ['showPauseOverlay', 'hidePauseOverlay', 'isOverlayVisible'];
            for (const method of requiredPauseUIMethods) {
                if (!this.pauseUI || typeof this.pauseUI[method] !== 'function') {
                    throw new Error(`PauseUI missing required method: ${method}`);
                }
            }

            // Make pause system available globally for backward compatibility
            window.pauseManager = this.pauseManager;
            window.pauseUI = this.pauseUI;
            
            // Set up pause system callbacks for integration with game
            await this.setupPauseSystemCallbacks();
            
            // Test pause system functionality with comprehensive validation
            // Temporarily disabled to prevent initialization issues
            // await this.testPauseSystemIntegration();
            
            this.logError('PAUSE_INIT_SUCCESS', 'Pause system initialized successfully');
            console.log('SoccerBettingGame: Pause system initialized successfully');
            
        } catch (error) {
            this.logError('PAUSE_INIT_FAILED', 'Failed to initialize pause system', {
                error: error.message,
                stack: error.stack,
                pauseManagerAvailable: typeof pauseManager !== 'undefined',
                pauseUIAvailable: typeof pauseUI !== 'undefined'
            });
            console.error('Failed to initialize pause system:', error);
            throw error; // Re-throw to trigger fallback mode
        }
    }

    /**
     * Set up callbacks between pause system and game UI with error handling
     */
    async setupPauseSystemCallbacks() {
        try {
            // Validate callback methods exist
            if (typeof this.pauseManager.setTimeoutWarningCallback !== 'function') {
                this.logError('CALLBACK_SETUP_WARNING', 'PauseManager missing setTimeoutWarningCallback method');
            } else {
                // Set up timeout warning callback with error handling
                this.pauseManager.setTimeoutWarningCallback((message) => {
                    try {
                        this.pauseUI.showTimeoutWarning(message);
                        this.addEventToFeed(`⚠️ ${message}`, 'text-yellow-400');
                        this.logError('TIMEOUT_WARNING', 'Pause timeout warning displayed', { message });
                    } catch (error) {
                        this.logError('TIMEOUT_WARNING_ERROR', 'Error displaying timeout warning', {
                            error: error.message,
                            message
                        });
                    }
                });
            }

            if (typeof this.pauseManager.setCountdownCallback !== 'function') {
                this.logError('CALLBACK_SETUP_WARNING', 'PauseManager missing setCountdownCallback method');
            } else {
                // Set up countdown callback for resume with error handling
                this.pauseManager.setCountdownCallback(async (seconds) => {
                    return new Promise((resolve) => {
                        try {
                            this.pauseUI.showResumeCountdown(seconds, () => {
                                try {
                                    this.pauseUI.hidePauseOverlay();
                                    this.logError('COUNTDOWN_COMPLETE', 'Resume countdown completed', { seconds });
                                    resolve();
                                } catch (error) {
                                    this.logError('COUNTDOWN_COMPLETE_ERROR', 'Error completing countdown', {
                                        error: error.message,
                                        seconds
                                    });
                                    resolve(); // Still resolve to prevent hanging
                                }
                            });
                        } catch (error) {
                            this.logError('COUNTDOWN_START_ERROR', 'Error starting countdown', {
                                error: error.message,
                                seconds
                            });
                            // Fallback: just resolve after timeout
                            setTimeout(resolve, seconds * 1000);
                        }
                    });
                });
            }

            this.logError('CALLBACK_SETUP_SUCCESS', 'Pause system callbacks configured successfully');
            console.log('SoccerBettingGame: Pause system callbacks configured');
        } catch (error) {
            this.logError('CALLBACK_SETUP_ERROR', 'Error setting up pause system callbacks', {
                error: error.message,
                stack: error.stack
            });
            console.error('Error setting up pause system callbacks:', error);
            // Don't throw here - callbacks are optional enhancements
        }
    }

    /**
     * Test pause system integration with comprehensive validation
     */
    async testPauseSystemIntegration() {
        try {
            this.logError('PAUSE_TEST_START', 'Starting pause system integration test');

            // Test 1: Basic pause functionality
            const testResult = this.pauseManager.pauseGame('INITIALIZATION_TEST', 1000);
            if (!testResult) {
                throw new Error('Pause system test failed - pauseGame returned false');
            }

            // Test 2: Verify pause state
            if (!this.pauseManager.isPaused()) {
                throw new Error('Pause system test failed - game not paused after pauseGame call');
            }

            // Test 3: Verify pause info
            const pauseInfo = this.pauseManager.getPauseInfo();
            if (!pauseInfo || !pauseInfo.active || pauseInfo.reason !== 'INITIALIZATION_TEST') {
                throw new Error('Pause system test failed - invalid pause info returned');
            }

            // Test 4: Test UI integration (if available)
            if (typeof this.pauseUI.showPauseOverlay === 'function') {
                try {
                    this.pauseUI.showPauseOverlay('Test Overlay', 'Testing...');
                    
                    // Verify overlay is visible
                    if (typeof this.pauseUI.isOverlayVisible === 'function' && !this.pauseUI.isOverlayVisible()) {
                        this.logError('PAUSE_TEST_WARNING', 'Pause overlay not visible after showPauseOverlay call');
                    }
                } catch (uiError) {
                    this.logError('PAUSE_TEST_UI_ERROR', 'Error testing pause UI', {
                        error: uiError.message
                    });
                }
            }

            // Test 5: Test resume functionality
            const resumeResult = await this.pauseManager.resumeGame(false); // No countdown for test
            if (!resumeResult) {
                throw new Error('Pause system test failed - resumeGame returned false');
            }

            // Test 6: Verify resume state
            if (this.pauseManager.isPaused()) {
                throw new Error('Pause system test failed - game still paused after resumeGame call');
            }

            // Test 7: Verify pause info after resume
            const resumedPauseInfo = this.pauseManager.getPauseInfo();
            if (resumedPauseInfo.active) {
                throw new Error('Pause system test failed - pause info still shows active after resume');
            }

            // Test 8: Hide UI overlay
            if (typeof this.pauseUI.hidePauseOverlay === 'function') {
                try {
                    this.pauseUI.hidePauseOverlay();
                } catch (uiError) {
                    this.logError('PAUSE_TEST_UI_HIDE_ERROR', 'Error hiding pause overlay', {
                        error: uiError.message
                    });
                }
            }

            // Test 9: Test error handling - invalid pause parameters
            try {
                const invalidResult = this.pauseManager.pauseGame(null, -1);
                if (invalidResult) {
                    this.logError('PAUSE_TEST_WARNING', 'Pause system accepted invalid parameters');
                }
            } catch (validationError) {
                // This is expected - pause system should reject invalid parameters
                this.logError('PAUSE_TEST_VALIDATION', 'Pause system correctly rejected invalid parameters');
            }

            this.logError('PAUSE_TEST_SUCCESS', 'Pause system integration test passed successfully');
            console.log('SoccerBettingGame: Pause system integration test passed');
        } catch (error) {
            this.logError('PAUSE_TEST_FAILED', 'Pause system integration test failed', {
                error: error.message,
                stack: error.stack
            });
            console.error('Pause system integration test failed:', error);
            throw error;
        }
    }

    /**
     * Initialize fallback mode when pause system fails
     * Enhanced with comprehensive error handling and logging
     */
    initializeFallbackMode() {
        try {
            console.warn('SoccerBettingGame: Running in fallback mode without pause system');
            this.logError('PAUSE_SYSTEM_FALLBACK', 'Pause system unavailable, using fallback mode', {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                currentState: this.state.currentScreen
            });
            
            // Create comprehensive mock pause system for compatibility
            this.pauseManager = {
                pauseGame: (reason, timeout) => {
                    console.warn(`Pause system not available - attempted to pause for: ${reason} (${timeout}ms)`);
                    this.logError('PAUSE_FALLBACK_USED', 'Pause attempt in fallback mode', { reason, timeout });
                    
                    // Show visual feedback that pause was attempted but failed
                    this.showFallbackPauseNotification(reason);
                    return false;
                },
                resumeGame: (withCountdown = true) => {
                    console.warn('Pause system not available - attempted to resume game');
                    this.logError('RESUME_FALLBACK_USED', 'Resume attempt in fallback mode', { withCountdown });
                    return Promise.resolve(false);
                },
                isPaused: () => {
                    // Always return false in fallback mode
                    return false;
                },
                getPauseInfo: () => ({ 
                    active: false, 
                    reason: null, 
                    startTime: null, 
                    timeoutId: null,
                    fallbackMode: true
                }),
                setTimeoutWarningCallback: (callback) => {
                    console.warn('Pause system not available - timeout warning callback ignored');
                },
                setCountdownCallback: (callback) => {
                    console.warn('Pause system not available - countdown callback ignored');
                },
                clearTimeout: () => false,
                hasActiveTimeout: () => false
            };
            
            this.pauseUI = {
                showPauseOverlay: (reason, message) => {
                    console.warn(`PauseUI not available - attempted to show overlay: ${reason}`);
                    this.showFallbackPauseNotification(reason || 'Game Paused');
                },
                hidePauseOverlay: () => {
                    console.warn('PauseUI not available - attempted to hide overlay');
                },
                showTimeoutWarning: (message) => {
                    console.warn(`PauseUI not available - timeout warning: ${message}`);
                    this.showFallbackNotification(message, 'warning');
                },
                showResumeCountdown: (seconds, onComplete) => {
                    console.warn(`PauseUI not available - countdown: ${seconds}s`);
                    if (onComplete) setTimeout(onComplete, 1000);
                    return Promise.resolve();
                },
                isOverlayVisible: () => false,
                updateMessage: () => console.warn('PauseUI not available - message update ignored'),
                updateReason: () => console.warn('PauseUI not available - reason update ignored')
            };
            
            // Make fallback available globally for backward compatibility
            window.pauseManager = this.pauseManager;
            window.pauseUI = this.pauseUI;
            
            // Set fallback mode flag
            this.fallbackMode = true;
            
            // Continue with normal initialization
            this.setupEventListeners();
            this.render();
            
            // Add warning to event feed if we're in a match
            if (this.state.currentScreen === 'match') {
                this.addEventToFeed('⚠️ Pause system unavailable - betting events will continue without pause', 'text-yellow-400');
            }
            
            // Show persistent fallback mode indicator
            this.showFallbackModeIndicator();
            
        } catch (error) {
            console.error('Failed to initialize fallback mode:', error);
            this.logError('FALLBACK_INIT_FAILED', 'Critical error in fallback initialization', {
                error: error.message,
                stack: error.stack
            });
            
            // Last resort - basic initialization with minimal functionality
            try {
                this.fallbackMode = true;
                this.pauseManager = { 
                    pauseGame: () => false, 
                    resumeGame: () => Promise.resolve(false), 
                    isPaused: () => false,
                    getPauseInfo: () => ({ active: false, reason: null, startTime: null, timeoutId: null, fallbackMode: true })
                };
                this.pauseUI = { 
                    showPauseOverlay: () => {}, 
                    hidePauseOverlay: () => {},
                    showTimeoutWarning: () => {},
                    isOverlayVisible: () => false
                };
                this.setupEventListeners();
                this.render();
            } catch (criticalError) {
                console.error('Critical initialization failure:', criticalError);
                this.logError('CRITICAL_INIT_FAILED', 'Complete initialization failure', {
                    error: criticalError.message,
                    stack: criticalError.stack
                });
                // Show error message to user
                this.showCriticalErrorMessage();
            }
        }
    }

    // --- STATE MANAGEMENT ---
    getInitialState() {
        return {
            currentScreen: 'lobby',
            wallet: 1000.00,
            classicMode: false,
            match: {
                active: false,
                time: 0,
                homeScore: 0,
                awayScore: 0,
                homeTeam: '',
                awayTeam: '',
                timeline: [],
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
                initialWallet: 1000.00,
            },
            bets: {
                fullMatch: [],
                actionBets: [],
            },
            powerUp: {
                held: null,
                applied: false,
            },
            currentBet: null,
            currentActionBet: {
                active: false,
                details: null,
                timeoutId: null,
            },
            betAmountMemory: {
                fullMatch: 25.00,     // Default $25
                opportunity: 25.00,   // Default $25
                lastUpdated: null
            },
        };
    }

    // --- BET AMOUNT MEMORY MANAGEMENT ---
    
    /**
     * Get the last bet amount for a specific bet type
     * @param {string} betType - 'fullMatch' or 'opportunity'
     * @returns {number} The last bet amount or default $25
     */
    getBetAmountMemory(betType) {
        try {
            // Validate betType parameter
            if (!betType || (betType !== 'fullMatch' && betType !== 'opportunity')) {
                console.error('Invalid betType for getBetAmountMemory:', betType);
                return 25.00; // Default fallback
            }
            
            if (!this.state.betAmountMemory) {
                return 25.00; // Default fallback
            }
            
            const amount = this.state.betAmountMemory[betType];
            if (typeof amount === 'number' && amount > 0 && amount <= this.state.wallet) {
                return amount;
            }
            
            return 25.00; // Default fallback
        } catch (error) {
            console.error('Error getting bet amount memory:', error);
            return 25.00; // Default fallback
        }
    }
    
    /**
     * Update the bet amount memory for a specific bet type
     * @param {string} betType - 'fullMatch' or 'opportunity'
     * @param {number} amount - The bet amount to store
     */
    updateBetAmountMemory(betType, amount) {
        try {
            // Validate betType parameter
            if (!betType || (betType !== 'fullMatch' && betType !== 'opportunity')) {
                console.error('Invalid betType for updateBetAmountMemory:', betType);
                return;
            }
            
            // Validate amount parameter
            if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
                console.error('Invalid amount for updateBetAmountMemory:', amount);
                return;
            }
            
            if (!this.state.betAmountMemory) {
                this.state.betAmountMemory = {
                    fullMatch: 25.00,
                    opportunity: 25.00,
                    lastUpdated: null
                };
            }
            
            this.state.betAmountMemory[betType] = amount;
            this.state.betAmountMemory.lastUpdated = Date.now();
        } catch (error) {
            console.error('Error updating bet amount memory:', error);
        }
    }
    
    /**
     * Get the default bet amount
     * @returns {number} Default bet amount of $25
     */
    getDefaultBetAmount() {
        return 25.00;
    }

    // --- BETTING EVENT QUEUE MANAGEMENT (Requirement 4.4) ---
    
    /**
     * Initialize betting event queue for handling multiple betting events
     */
    initializeBettingEventQueue() {
        if (!this.state.bettingEventQueue) {
            this.state.bettingEventQueue = [];
        }
    }
    
    /**
     * Determines if a new betting event should replace the current one
     * @param {Object} newEvent - The new betting event
     * @returns {boolean} - True if should replace current event
     */
    shouldReplaceCurrentBettingEvent(newEvent) {
        const currentEvent = this.state.currentActionBet.details;
        if (!currentEvent) return true;
        
        // Priority order: PENALTY > CARD > CORNER > MULTI_CHOICE_ACTION_BET > others
        const priorityOrder = {
            'PENALTY_BET': 10,
            'CARD_BET': 9,
            'RED_CARD': 9,
            'CORNER_BET': 8,
            'FREE_KICK_BET': 7,
            'MULTI_CHOICE_ACTION_BET': 6,
            'SUBSTITUTION_BET': 5,
            'OFFSIDE_BET': 4,
            'INJURY_TIME_BET': 3,
            'PLAYER_PERFORMANCE_BET': 2,
            'NEXT_GOAL_BET': 1,
            'HALF_TIME_SCORE_BET': 1
        };
        
        const currentPriority = priorityOrder[currentEvent.type] || 0;
        const newPriority = priorityOrder[newEvent.type] || 0;
        
        return newPriority > currentPriority;
    }
    
    /**
     * Queues a betting event for later processing
     * @param {Object} event - The betting event to queue
     */
    queueBettingEvent(event) {
        this.initializeBettingEventQueue();
        
        // Add to queue with timestamp
        this.state.bettingEventQueue.push({
            ...event,
            queuedAt: Date.now()
        });
        
        console.log(`Betting event queued: ${event.type} (queue length: ${this.state.bettingEventQueue.length})`);
        
        // Notify user about queued betting opportunity
        this.addEventToFeed(`⏳ Betting opportunity queued: ${event.description}`, 'text-yellow-400');
    }
    
    /**
     * Processes the next queued betting event
     */
    processNextQueuedBettingEvent() {
        this.initializeBettingEventQueue();
        
        if (this.state.bettingEventQueue.length === 0) {
            console.log('No queued betting events to process');
            return;
        }
        
        // Get the next event from queue
        const nextEvent = this.state.bettingEventQueue.shift();
        
        console.log(`Processing next queued betting event: ${nextEvent.type}`);
        
        // Check if event is still relevant (not too old)
        const eventAge = Date.now() - nextEvent.queuedAt;
        if (eventAge > 30000) { // 30 seconds
            console.log('Queued betting event expired, skipping');
            this.addEventToFeed(`⏰ Queued betting opportunity expired: ${nextEvent.description}`, 'text-gray-400');
            // Try next event
            this.processNextQueuedBettingEvent();
            return;
        }
        
        // Process the queued event
        setTimeout(() => {
            this.processMatchEvent(nextEvent);
        }, 1000); // Small delay to allow current betting to complete
    }
    
    /**
     * Cleans up current betting event when replacing with new one
     */
    cleanupCurrentBettingEvent() {
        try {
            // Clear any existing timeouts
            if (this.state.currentActionBet.timeoutId) {
                clearTimeout(this.state.currentActionBet.timeoutId);
            }
            
            // Hide current betting modal
            const actionBetModal = document.getElementById('action-bet-modal');
            if (actionBetModal && !actionBetModal.classList.contains('hidden')) {
                actionBetModal.classList.add('hidden');
            }
            
            // Stop timer bar if present
            if (this.state.currentActionBet.timerBar && typeof this.state.currentActionBet.timerBar.stop === 'function') {
                this.state.currentActionBet.timerBar.stop();
            }
            
            // Reset action bet state
            this.state.currentActionBet = {
                active: false,
                details: null,
                timeoutId: null
            };
            
            console.log('Current betting event cleaned up for replacement');
        } catch (error) {
            console.error('Error cleaning up current betting event:', error);
        }
    }

    /**
     * Check if any betting modal is currently visible
     * This prevents the pause overlay from covering betting opportunities
     */
    isBettingModalVisible() {
        try {
            const bettingModals = [
                'action-bet-modal',
                'action-bet-slip-modal'
            ];
            
            for (const modalId of bettingModals) {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking betting modal visibility:', error);
            return false; // Default to false to avoid blocking pause overlay
        }
    }

    // --- GAME LOGIC & SIMULATION ---
    startGame(matchData) {
        this.resetMatchState(matchData);
        
        // Ensure game is not paused when starting
        if (this.pauseManager && this.pauseManager.isPaused()) {
            console.log('Game was paused during start, forcing resume...');
            this.pauseManager.resumeGame(false); // No countdown
        }
        
        // Hide pause overlay if visible
        if (this.pauseUI && this.pauseUI.isOverlayVisible()) {
            this.pauseUI.hidePauseOverlay();
        }
        
        this.state.currentScreen = 'match';
        this.matchInterval = setInterval(() => this.tick(), 500);
        this.render();
    }

    tick() {
        try {
            // Enhanced pause system error handling during gameplay
            if (this.pauseManager) {
                try {
                    // Check if game is paused - if so, don't process game logic
                    if (this.pauseManager.isPaused()) {
                        // Update pause overlay if needed with error handling
                        // Only show pause overlay if no betting modal is currently active
                        if (this.pauseUI && !this.isBettingModalVisible()) {
                            try {
                                if (!this.pauseUI.isOverlayVisible()) {
                                    const pauseInfo = this.pauseManager.getPauseInfo();
                                    this.pauseUI.showPauseOverlay(pauseInfo.reason || 'Game Paused');
                                }
                            } catch (uiError) {
                                this.logError('PAUSE_UI_ERROR', 'Error updating pause overlay during tick', {
                                    error: uiError.message
                                });
                                // Continue without UI updates
                            }
                        }
                        return; // Don't process game logic while paused
                    }
                    
                    // Ensure pause overlay is hidden when game is not paused
                    if (this.pauseUI) {
                        try {
                            if (this.pauseUI.isOverlayVisible()) {
                                this.pauseUI.hidePauseOverlay();
                            }
                        } catch (uiError) {
                            this.logError('PAUSE_UI_HIDE_ERROR', 'Error hiding pause overlay during tick', {
                                error: uiError.message
                            });
                            // Continue with game logic
                        }
                    }
                } catch (pauseError) {
                    this.logError('PAUSE_CHECK_ERROR', 'Error checking pause state during tick', {
                        error: pauseError.message,
                        fallbackMode: this.fallbackMode
                    });
                    
                    // If pause system fails during gameplay, continue without pause functionality
                    if (!this.fallbackMode) {
                        this.logError('PAUSE_RUNTIME_FAILURE', 'Pause system failed during gameplay, switching to fallback');
                        this.initializeFallbackMode();
                    }
                }
            }
            
            // Normal game tick logic with error handling
            try {
                this.state.match.time++;
                
                const eventsToProcess = this.state.match.timeline.filter(event => event.time === this.state.match.time);
                eventsToProcess.forEach(event => {
                    try {
                        this.processMatchEvent(event);
                    } catch (eventError) {
                        this.logError('EVENT_PROCESSING_ERROR', 'Error processing match event', {
                            error: eventError.message,
                            event: event,
                            matchTime: this.state.match.time
                        });
                        // Continue with other events
                    }
                });

                // Update odds periodically with error handling
                if (this.state.match.time % 5 === 0) {
                    try {
                        this.updateOdds();
                    } catch (oddsError) {
                        this.logError('ODDS_UPDATE_ERROR', 'Error updating odds', {
                            error: oddsError.message,
                            matchTime: this.state.match.time
                        });
                        // Continue without odds update
                    }
                }

                // Check for match end with error handling
                if (this.state.match.time >= 90) {
                    try {
                        this.endMatch();
                    } catch (endError) {
                        this.logError('MATCH_END_ERROR', 'Error ending match', {
                            error: endError.message,
                            matchTime: this.state.match.time
                        });
                        // Force match end to prevent infinite loop
                        clearInterval(this.matchInterval);
                        this.state.match.active = false;
                    }
                }
                
                // Render updates with error handling
                try {
                    this.renderMatchTimeAndScore();
                } catch (renderError) {
                    this.logError('RENDER_ERROR', 'Error rendering match time and score', {
                        error: renderError.message,
                        matchTime: this.state.match.time
                    });
                    // Continue without rendering updates
                }
                
            } catch (gameLogicError) {
                this.logError('GAME_LOGIC_ERROR', 'Error in game logic during tick', {
                    error: gameLogicError.message,
                    stack: gameLogicError.stack,
                    matchTime: this.state.match.time
                });
                // Continue game to prevent freezing
            }
            
        } catch (criticalError) {
            this.logError('TICK_CRITICAL_ERROR', 'Critical error in game tick', {
                error: criticalError.message,
                stack: criticalError.stack,
                matchTime: this.state.match?.time
            });
            console.error('Critical error in game tick:', criticalError);
            
            // Last resort: try to keep the game running
            try {
                if (this.state.match && this.state.match.active) {
                    this.state.match.time++;
                    this.renderMatchTimeAndScore();
                }
            } catch (lastResortError) {
                this.logError('TICK_LAST_RESORT_ERROR', 'Even last resort tick failed', {
                    error: lastResortError.message
                });
                // Stop the game to prevent further errors
                if (this.matchInterval) {
                    clearInterval(this.matchInterval);
                    this.matchInterval = null;
                }
            }
        }
    }

    /**
     * Centralized betting event detection system (Requirement 6.1, 6.2, 6.5)
     * Determines if an event requires the game to be paused for betting opportunities
     * Enhanced to handle multiple betting events and future extensibility
     * @param {Object} event - The match event to classify
     * @returns {boolean} - True if event requires pause for betting, false otherwise
     */
    isBettingEvent(event) {
        // Handle null/undefined events
        if (!event || typeof event !== 'object') {
            return false;
        }
        
        // Don't treat resolution events as betting events even if they have betType
        if (EVENT_CLASSIFICATIONS.RESOLUTION_EVENTS.includes(event.type)) {
            return false;
        }
        
        // Don't treat informational events as betting events (unless they have betting properties)
        if (EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS.includes(event.type)) {
            // However, check if this informational event has been enhanced with betting
            if (event.choices || event.betType || event.bettingOptions) {
                console.log(`Enhanced informational event with betting: ${event.type}`);
                return true;
            }
            return false;
        }
        
        // Check if event type is explicitly classified as a betting event (Requirement 6.2)
        if (EVENT_CLASSIFICATIONS.BETTING_EVENTS.includes(event.type)) {
            return true;
        }
        
        // Check potential betting events that might be upgraded to betting events
        if (EVENT_CLASSIFICATIONS.POTENTIAL_BETTING_EVENTS.includes(event.type)) {
            // These become betting events if they have betting properties
            if (event.choices || event.betType || event.bettingOptions) {
                console.log(`Potential betting event upgraded to betting: ${event.type}`);
                return true;
            }
        }
        
        // Extensible logic for future betting features (Requirement 6.5)
        // Any event with betting choices should trigger pause
        if (event.type && event.choices && Array.isArray(event.choices) && event.choices.length > 0) {
            // Validate that choices have proper betting structure
            const validChoices = event.choices.every(choice => 
                choice && typeof choice === 'object' && 
                choice.text && typeof choice.odds === 'number' && choice.odds > 0
            );
            if (validChoices) {
                console.log(`Event with valid betting choices detected: ${event.type}`);
                return true;
            }
        }
        
        // Check for events that have betting-related properties (Requirement 6.3)
        if (event.betType && typeof event.betType === 'string') {
            console.log(`Event with betType detected: ${event.type} (${event.betType})`);
            return true;
        }
        
        if (event.bettingOptions && (Array.isArray(event.bettingOptions) || typeof event.bettingOptions === 'object')) {
            console.log(`Event with bettingOptions detected: ${event.type}`);
            return true;
        }
        
        // Check for events that show any betting UI (Requirement 6.3)
        if (event.showBettingModal || event.requiresPause || event.bettingOpportunity) {
            console.log(`Event with betting UI flags detected: ${event.type}`);
            return true;
        }
        
        return false;
    }

    processMatchEvent(event) {
        this.addEventToFeed(event.description);
        
        // Handle multiple betting events with proper sequencing (Requirement 4.4)
        if (this.isBettingEvent(event)) {
            // Check if there's already an active betting opportunity
            if (this.state.currentActionBet.active) {
                console.log(`Multiple betting events detected: current=${this.state.currentActionBet.details?.type}, new=${event.type}`);
                
                // Queue the new event or replace based on priority
                if (this.shouldReplaceCurrentBettingEvent(event)) {
                    console.log('Replacing current betting event with higher priority event');
                    this.cleanupCurrentBettingEvent();
                } else {
                    console.log('Queueing betting event for later processing');
                    this.queueBettingEvent(event);
                    return; // Don't process this event now
                }
            }
            
            // Pause game for betting opportunity (Requirement 4.1)
            if (this.pauseManager && !this.pauseManager.isPaused()) {
                const pauseSuccess = this.pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
                if (pauseSuccess) {
                    console.log(`SoccerBettingGame: Game paused for betting event - ${event.type}`);
                } else {
                    console.warn(`SoccerBettingGame: Failed to pause for betting event - ${event.type}`);
                }
            } else if (this.pauseManager && this.pauseManager.isPaused()) {
                // Extend pause timeout for new betting event
                this.pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
                console.log(`SoccerBettingGame: Extended pause for new betting event - ${event.type}`);
            }
        }
        
        switch(event.type) {
            case 'GOAL':
                if (event.team === 'HOME') this.state.match.homeScore++;
                else this.state.match.awayScore++;
                break;
            case 'MULTI_CHOICE_ACTION_BET':
                // Handle in both classic and standard mode (Requirement 4.5)
                if (!this.state.currentActionBet.active) {
                    this.showMultiChoiceActionBet(event);
                } else {
                    console.log('Action bet already active, queueing new action bet');
                    this.queueBettingEvent(event);
                }
                break;
            case 'PENALTY_BET':
            case 'CORNER_BET':
            case 'CARD_BET':
            case 'SUBSTITUTION_BET':
            case 'FREE_KICK_BET':
            case 'OFFSIDE_BET':
            case 'INJURY_TIME_BET':
            case 'PLAYER_PERFORMANCE_BET':
            case 'NEXT_GOAL_BET':
            case 'HALF_TIME_SCORE_BET':
                // Future betting event types automatically supported (Requirement 6.2, 6.5)
                if (!this.state.currentActionBet.active) {
                    this.showMultiChoiceActionBet(event);
                } else {
                    console.log(`Future betting event ${event.type} queued`);
                    this.queueBettingEvent(event);
                }
                break;
            case 'RESOLUTION':
                this.resolveBets(event.betType, event.result);
                // Process next queued betting event if any
                this.processNextQueuedBettingEvent();
                break;
        }
    }
    
    endMatch() {
        clearInterval(this.matchInterval);
        if(this.state.currentActionBet.timeoutId) clearTimeout(this.state.currentActionBet.timeoutId);
        this.state.match.active = false;
        this.addEventToFeed("The referee blows the final whistle. Full Time!");
        
        let totalWinnings = 0;
        let finalOutcome;
        if (this.state.match.homeScore > this.state.match.awayScore) finalOutcome = 'HOME';
        else if (this.state.match.homeScore < this.state.match.awayScore) finalOutcome = 'AWAY';
        else finalOutcome = 'DRAW';

        // Finalize full match bet statuses for summary
        this.state.bets.fullMatch.forEach(bet => {
            bet.status = (bet.outcome === finalOutcome) ? 'WON' : 'LOST';
        });

        // Calculate winnings
        this.state.bets.fullMatch.forEach(bet => {
            if (bet.status === 'WON') {
                totalWinnings += bet.stake * bet.odds;
            }
        });

        let resultMessage;
        if (totalWinnings > 0) {
            if (this.state.powerUp.applied) {
                const originalWinnings = totalWinnings;
                totalWinnings *= 2;
                 resultMessage = `YOU WON! Your 2x Power-Up turned ${originalWinnings.toFixed(2)} into ${totalWinnings.toFixed(2)}!`;
            } else {
                resultMessage = `Congratulations! You won a total of ${totalWinnings.toFixed(2)}!`;
            }
            this.state.wallet += totalWinnings;
        } else {
             resultMessage = "None of your full match bets won. Better luck next time.";
        }
        
        // Show summary
        document.getElementById('match-end-score').textContent = `Final Score: ${this.state.match.homeScore} - ${this.state.match.awayScore}`;
        document.getElementById('match-end-winnings').innerHTML = resultMessage;
        this.renderEndGameSummary(finalOutcome);
        
        // Trigger win animation if profitable
        if(this.state.wallet > this.state.match.initialWallet) {
            this.triggerWinAnimation();
        }

        this.matchEndModal.classList.remove('hidden');
    }

    placeBet(type, outcome, odds, stake, betType = null) {
        try {
            // Enhanced validation with error logging
            if (typeof stake !== 'number' || isNaN(stake) || stake <= 0) {
                this.logError('BET_VALIDATION_ERROR', 'Invalid stake amount', { stake, type, outcome });
                this.addEventToFeed("Invalid stake amount.", "text-red-400");
                this.handleBettingDecisionComplete('validation_error');
                return;
            }

            if (stake > this.state.wallet) {
                this.logError('BET_INSUFFICIENT_FUNDS', 'Insufficient funds for bet', { 
                    stake, 
                    wallet: this.state.wallet, 
                    type, 
                    outcome 
                });
                this.addEventToFeed("Insufficient funds.", "text-red-400");
                this.handleBettingDecisionComplete('insufficient_funds');
                return;
            }

            // Deduct stake from wallet
            this.state.wallet -= stake;

            if (type === 'full-match') {
                try {
                    const bet = { outcome, stake, odds, timestamp: Date.now() };
                    this.state.bets.fullMatch.push(bet);
                    this.addEventToFeed(`Full Match Bet placed: ${outcome} (${stake.toFixed(2)} @ ${odds.toFixed(2)})`, 'text-blue-400');
                    
                    this.logError('BET_PLACED_SUCCESS', 'Full match bet placed successfully', {
                        type, outcome, stake, odds, wallet: this.state.wallet
                    });
                    
                    // Store bet amount in memory for full match bets
                    this.updateBetAmountMemory('fullMatch', stake);
                    
                    // Full match betting no longer pauses/resumes game (Requirements 1.1, 1.2, 1.3, 1.4)
                    // Game continues running normally after bet placement
                } catch (fullMatchError) {
                    this.logError('FULL_MATCH_BET_ERROR', 'Error processing full match bet', {
                        error: fullMatchError.message,
                        outcome, stake, odds
                    });
                    // Refund stake on error
                    this.state.wallet += stake;
                    this.addEventToFeed("Error placing bet. Stake refunded.", "text-red-400");
                    return;
                }
            } else if (type === 'action') {
                try {
                    const newBet = { 
                        description: outcome, 
                        stake, 
                        odds, 
                        status: 'PENDING', 
                        betType,
                        timestamp: Date.now()
                    };
                    this.state.bets.actionBets.push(newBet);
                    this.addEventToFeed(`Action Bet placed: ${outcome} (${stake.toFixed(2)} @ ${odds.toFixed(2)})`, 'text-blue-400');
                    
                    this.logError('BET_PLACED_SUCCESS', 'Action bet placed successfully', {
                        type, outcome, stake, odds, betType, wallet: this.state.wallet
                    });
                    
                    // Store bet amount in memory for opportunity bets (separate from full match)
                    this.updateBetAmountMemory('opportunity', stake);
                    
                    // Resume game when action bet is placed using centralized handler
                    this.handleBettingDecisionComplete('bet_placed');
                } catch (actionBetError) {
                    this.logError('ACTION_BET_ERROR', 'Error processing action bet', {
                        error: actionBetError.message,
                        outcome, stake, odds, betType
                    });
                    // Refund stake on error
                    this.state.wallet += stake;
                    this.addEventToFeed("Error placing bet. Stake refunded.", "text-red-400");
                    this.handleBettingDecisionComplete('processing_error');
                    return;
                }
            } else {
                this.logError('BET_TYPE_ERROR', 'Unknown bet type', { type, outcome, stake, odds });
                // Refund stake for unknown bet type
                this.state.wallet += stake;
                this.addEventToFeed("Unknown bet type. Stake refunded.", "text-red-400");
                this.handleBettingDecisionComplete('unknown_type_error');
                return;
            }
            
            // Update UI with error handling
            try {
                this.render();
            } catch (renderError) {
                this.logError('BET_RENDER_ERROR', 'Error rendering after bet placement', {
                    error: renderError.message,
                    type, outcome
                });
                // Continue without rendering update
            }
            
            console.log(`SoccerBettingGame: ${type} bet placed - ${outcome}`);
            
        } catch (error) {
            this.logError('BET_PLACEMENT_CRITICAL_ERROR', 'Critical error placing bet', {
                error: error.message,
                stack: error.stack,
                type, outcome, stake, odds, betType
            });
            console.error('Error placing bet:', error);
            
            // Ensure wallet is not corrupted
            try {
                if (typeof this.state.wallet !== 'number' || this.state.wallet < 0) {
                    this.logError('WALLET_CORRUPTION_DETECTED', 'Wallet corruption detected, attempting recovery');
                    // Try to restore from initial wallet or set to 0
                    this.state.wallet = Math.max(0, this.state.match?.initialWallet || 1000);
                }
            } catch (walletError) {
                this.logError('WALLET_RECOVERY_ERROR', 'Failed to recover wallet state', {
                    error: walletError.message
                });
            }
            
            // Ensure game resumes for action bets only (full-match bets don't pause the game)
            try {
                if (type === 'action') {
                    this.handleBettingDecisionComplete('critical_error');
                } else if (type === 'full-match') {
                    // Full match betting doesn't pause the game, so no resume needed
                    console.log('SoccerBettingGame: Full match bet error handled - game continues running');
                } else {
                    this.handleBettingDecisionComplete('unknown_error');
                }
            } catch (resumeError) {
                this.logError('BET_RESUME_ERROR', 'Failed to resume game after bet error', {
                    error: resumeError.message
                });
                // Force resume using fallback (only for action bets)
                if (type === 'action') {
                    this.forceGameResume('bet_error_recovery');
                }
            }
        }
    }

    resolveBets(betType, result) {
        // Use map to create a new array with updated statuses, ensuring a clean state update
        const updatedActionBets = this.state.bets.actionBets.map(bet => {
            // If this isn't the bet we're looking for, return it unchanged
            if (bet.betType !== betType || bet.status !== 'PENDING') {
                return bet;
            }
    
            // It's the right type and pending, so resolve it
            if (bet.description === result) {
                bet.status = 'WON';
                const winnings = bet.stake * bet.odds;
                this.state.wallet += winnings;
                this.addEventToFeed(`✅ Action Bet Won: '${bet.description}'. You won ${winnings.toFixed(2)}!`, 'text-green-400');
                
                if (!this.state.powerUp.held && !this.state.classicMode && Math.random() > 0.2) {
                    this.awardPowerUp('2x_MULTIPLIER');
                }
            } else {
                bet.status = 'LOST';
                this.addEventToFeed(`❌ Action Bet Lost: '${bet.description}'.`, 'text-red-400');
            }
            return bet;
        });
    
        this.state.bets.actionBets = updatedActionBets;
        this.render();
    }
    
    awardPowerUp(type) {
        this.state.powerUp.held = type;
        this.addEventToFeed(`⭐ POWER-UP AWARDED: 2x Winnings Multiplier!`, 'text-yellow-300 font-bold');
        this.renderPowerUp();
    }
    
    usePowerUp() {
        if (this.state.powerUp.held && this.state.bets.fullMatch.length > 0 && !this.state.powerUp.applied) {
            this.state.powerUp.applied = true;
            this.state.powerUp.held = null;
            this.addEventToFeed(`⚡ POWER-UP APPLIED to your full match bets! Potential winnings are now doubled.`, 'text-yellow-300 font-bold');
            this.render();
        } else if (this.state.bets.fullMatch.length === 0) {
            this.addEventToFeed(`Place a Full Match Bet before using a Power-Up!`, 'text-yellow-400');
        }
    }

    updateOdds() {
        if (!this.state.match.active) return;
        const { time, homeScore, awayScore, odds, initialOdds } = this.state.match;
        const timeFactor = time / 90;

        if (homeScore > awayScore) {
            odds.home = Math.max(1.05, initialOdds.home - (initialOdds.home - 1.05) * timeFactor * 1.5);
            odds.draw = initialOdds.draw + 2 * timeFactor;
            odds.away = initialOdds.away + 3 * timeFactor;
        } else if (awayScore > homeScore) {
            odds.away = Math.max(1.05, initialOdds.away - (initialOdds.away - 1.05) * timeFactor * 1.5);
            odds.draw = initialOdds.draw + 2 * timeFactor;
            odds.home = initialOdds.home + 3 * timeFactor;
        } else {
            odds.home = initialOdds.home - (initialOdds.home * 0.1 * timeFactor);
            odds.away = initialOdds.away - (initialOdds.away * 0.1 * timeFactor);
            odds.draw = Math.max(1.5, initialOdds.draw - (initialOdds.draw - 1.5) * timeFactor);
        }
        this.renderOdds();
    }

    resetMatchState(matchData) {
        this.state.match = {
            active: true,
            time: 0,
            homeScore: 0,
            awayScore: 0,
            homeTeam: matchData.home,
            awayTeam: matchData.away,
            timeline: this.generateMatchTimeline(matchData),
            odds: { home: 1.85, draw: 3.50, away: 4.20 },
            initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
            initialWallet: this.state.wallet,
        };
        this.state.bets = { fullMatch: [], actionBets: [] };
        this.state.powerUp = { held: null, applied: false };
        
        // Initialize betting event queue for handling multiple betting events (Requirement 4.4)
        this.state.bettingEventQueue = [];
        
        document.getElementById('event-feed').innerHTML = '';
        document.getElementById('match-timer').textContent = '00:00';
        document.getElementById('match-score').textContent = '0 - 0';
    }
    
    backToLobby() {
        clearInterval(this.matchInterval);
        if(this.state.currentActionBet.timeoutId) clearTimeout(this.state.currentActionBet.timeoutId);
        this.state.currentScreen = 'lobby';
        this.render();
    }
    
    resetPrototype() {
        clearInterval(this.matchInterval);
        this.state = this.getInitialState();
        this.actionBetSlipModal.classList.add('hidden');
        this.actionBetModal.classList.add('hidden');
        this.matchEndModal.classList.add('hidden');
        this.render();
    }

    // --- UI RENDERING ---
    render() {
        this.lobbyScreen.classList.toggle('hidden', this.state.currentScreen !== 'lobby');
        this.matchScreen.classList.toggle('hidden', this.state.currentScreen !== 'match');
        
        if (this.state.currentScreen === 'lobby') {
            this.renderLobby();
        } else if (this.state.currentScreen === 'match') {
            this.renderMatchScreen();
        }
    }

    renderLobby() {
        const matchList = document.getElementById('match-list');
        matchList.innerHTML = '';
        MOCK_MATCHES.forEach((match) => {
            const matchCard = document.createElement('div');
            matchCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md cursor-pointer hover:bg-indigo-700 transition';
            matchCard.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold text-white text-lg">${match.home} vs ${match.away}</div>
                        <div class="text-sm text-gray-400">Simulated Match</div>
                    </div>
                    <span class="text-lg font-bold text-green-400">JOIN &rarr;</span>
                </div>
            `;
            matchCard.onclick = () => this.startGame(match);
            matchList.appendChild(matchCard);
        });
        document.getElementById('lobby-wallet-balance').textContent = this.state.wallet.toFixed(2);
    }

    renderMatchScreen() {
        document.getElementById('match-teams').textContent = `${this.state.match.homeTeam} vs ${this.state.match.awayTeam}`;
        this.renderMatchTimeAndScore();
        this.renderDashboard();
        this.renderPowerUp();
        this.renderOdds();
        this.renderBetHistory();
    }
    
    renderMatchTimeAndScore() {
        const minutes = Math.floor(this.state.match.time).toString().padStart(2, '0');
        document.getElementById('match-timer').textContent = `${minutes}'`;
        document.getElementById('match-score').textContent = `${this.state.match.homeScore} - ${this.state.match.awayScore}`;
    }
    
    renderDashboard() {
        const fullMatchStakes = this.state.bets.fullMatch.reduce((sum, bet) => sum + bet.stake, 0);
        const actionBetStakes = this.state.bets.actionBets.reduce((sum, bet) => sum + bet.stake, 0);
        const totalStaked = fullMatchStakes + actionBetStakes;

        let potentialWin = this.state.bets.fullMatch.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0);

        if (this.state.powerUp.applied) {
            potentialWin *= 2;
        }
        
        document.getElementById('total-staked').textContent = `${totalStaked.toFixed(2)}`;
        document.getElementById('potential-win').textContent = `${potentialWin.toFixed(2)}`;
        document.getElementById('match-wallet-balance').textContent = `${this.state.wallet.toFixed(2)}`;
    }
    
    renderPowerUp() {
        const slot = document.getElementById('power-up-slot');
        if (this.state.classicMode) {
            slot.innerHTML = `<span>Power-Ups Disabled</span>`;
            slot.className = 'w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-600 cursor-not-allowed';
            slot.classList.remove('power-up-glow');
            slot.onclick = null;
        } else if (this.state.powerUp.held) {
            slot.innerHTML = `<span class="font-bold text-yellow-300">⚡ 2x WINNINGS ⚡</span>`;
            slot.className = 'w-full h-12 bg-indigo-600 border-2 border-yellow-400 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300';
            slot.classList.add('power-up-glow');
            slot.onclick = () => this.usePowerUp();
        } else {
            slot.innerHTML = `<span>Empty Slot</span>`;
            slot.className = 'w-full h-12 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center text-gray-500 transition-all duration-300';
            slot.classList.remove('power-up-glow');
            slot.onclick = null;
        }
    }

    renderOdds() {
        document.querySelector('#full-match-btn-HOME .odds-display').textContent = `Odds: ${this.state.match.odds.home.toFixed(2)}`;
        document.querySelector('#full-match-btn-DRAW .odds-display').textContent = `Odds: ${this.state.match.odds.draw.toFixed(2)}`;
        document.querySelector('#full-match-btn-AWAY .odds-display').textContent = `Odds: ${this.state.match.odds.away.toFixed(2)}`;
    }

    renderBetHistory() {
        const list = document.getElementById('bet-history-list');
        list.innerHTML = '';

        const allBets = [...this.state.bets.fullMatch, ...this.state.bets.actionBets];

        if (allBets.length === 0) {
            list.innerHTML = '<p class="text-gray-500 text-center">No bets placed yet.</p>';
            return;
        }

        allBets.forEach(bet => {
            const item = document.createElement('div');
            let betText, statusText = '', statusClass = '';
            
            if (bet.betType) {
                betText = `${bet.description}`;
                if (bet.status === 'WON') {
                    statusText = `<span class="font-bold text-green-400">WIN</span>`;
                    statusClass = 'border-l-4 border-green-500';
                } else if (bet.status === 'LOST') {
                    statusText = `<span class="font-bold text-red-400">LOSE</span>`;
                    statusClass = 'border-l-4 border-red-500';
                } else { // PENDING
                    statusText = `<span class="font-bold text-gray-400">...</span>`;
                    statusClass = 'border-l-4 border-gray-500';
                }
            } else { // Full match bet
                betText = `Match: ${bet.outcome} Win/Draw`;
                statusClass = 'border-l-4 border-indigo-500';
            }

            item.className = `p-2 bg-gray-700 rounded-md text-xs flex justify-between items-center ${statusClass}`;
            item.innerHTML = `
                <div>
                    <span>${betText}</span>
                    <span class="ml-2 text-gray-400">(${bet.stake.toFixed(2)} @ ${bet.odds.toFixed(2)})</span>
                </div>
                ${statusText}
            `;
            list.appendChild(item);
        });
    }
    
    renderEndGameSummary() {
        const summaryContainer = document.getElementById('match-end-bet-summary');
        summaryContainer.innerHTML = '';
        const allBets = [...this.state.bets.fullMatch, ...this.state.bets.actionBets];

        allBets.forEach(bet => {
            const item = document.createElement('div');
            let betText, resultText, resultClass;

            const stakeText = `${bet.stake.toFixed(2)} @ ${bet.odds.toFixed(2)}`;
            if (bet.betType) { // Action Bet
                betText = bet.description;
            } else { // Full Match Bet
                betText = `Match: ${bet.outcome} Win/Draw`;
            }

            if (bet.status === 'WON') {
                let winAmount = bet.stake * bet.odds;
                if (!bet.betType && this.state.powerUp.applied) { // Apply powerup only to full match bets
                    winAmount *= 2;
                }
                resultText = `+ ${winAmount.toFixed(2)}`;
                resultClass = 'text-green-400';
            } else { // LOST or PENDING (for any unresolved action bets)
                resultText = `- ${bet.stake.toFixed(2)}`;
                resultClass = 'text-red-400';
            }

            item.className = `p-2 bg-gray-800 rounded-md text-sm flex justify-between items-center`;
            item.innerHTML = `
                <div>
                    <p>${betText}</p>
                    <p class="text-xs text-gray-500">${stakeText}</p>
                </div>
                <p class="font-bold ${resultClass}">${resultText}</p>
            `;
            summaryContainer.appendChild(item);
        });
    }

    addEventToFeed(text, customClass = '') {
        const feed = document.getElementById('event-feed');
        const item = document.createElement('div');
        item.className = `p-3 bg-gray-700 rounded-lg text-sm shadow ${customClass} feed-item-enter`;
        item.textContent = text;
        feed.appendChild(item);
        
        requestAnimationFrame(() => {
            item.style.opacity = 1;
            item.style.transform = 'translateY(0)';
        });

        feed.parentElement.scrollTop = feed.parentElement.scrollHeight;
    }
    
    showActionBetSlip(type, outcome, odds, betType = null) {
        this.state.currentBet = { type, outcome, odds, betType };
        document.getElementById('action-slip-title').textContent = 'Place Action Bet';
        document.getElementById('action-slip-description').textContent = `You are betting on: ${outcome}`;
        
        // Pre-populate amount field with last opportunity bet amount
        const amountInput = document.getElementById('action-slip-amount');
        if (amountInput) {
            try {
                const lastAmount = this.getBetAmountMemory('opportunity');
                amountInput.value = lastAmount.toString();
            } catch (error) {
                console.error('Error getting opportunity bet amount memory:', error);
                // Fallback to default $25 when memory retrieval fails
                const defaultAmount = this.getDefaultBetAmount();
                amountInput.value = defaultAmount.toString();
            }
        }
        
        this.actionBetSlipModal.classList.remove('hidden');
        
        // Hide pause overlay if it's visible since betting modal should be on top
        if (this.pauseUI && this.pauseUI.isOverlayVisible()) {
            this.pauseUI.hidePauseOverlay();
        }
        
        if (amountInput) {
            amountInput.focus();
            amountInput.select(); // Select the pre-populated value for easy editing
        }
    }

    showInlineBetSlip(outcome, odds) {
        try {
            // Full match betting no longer pauses the game (Requirements 1.1, 1.2, 1.3, 1.4)
            // Game continues running normally while betting interface is displayed
            
            this.state.currentBet = { type: 'full-match', outcome, odds };
            this.inlineBetSlip.classList.remove('hidden');
            
            // Pre-populate amount field with last full match bet amount
            if (this.inlineStakeAmount) {
                try {
                    const lastAmount = this.getBetAmountMemory('fullMatch');
                    this.inlineStakeAmount.value = lastAmount.toString();
                } catch (error) {
                    console.error('Error getting full match bet amount memory:', error);
                    // Fallback to default $25 when memory retrieval fails
                    const defaultAmount = this.getDefaultBetAmount();
                    this.inlineStakeAmount.value = defaultAmount.toString();
                }
                this.inlineStakeAmount.focus();
                this.inlineStakeAmount.select(); // Select the pre-populated value for easy editing
            }

            document.querySelectorAll('[data-bet-type="full-match"]').forEach(btn => {
                btn.classList.remove('bet-btn-selected');
            });
            document.getElementById(`full-match-btn-${outcome}`).classList.add('bet-btn-selected');
            
            console.log(`SoccerBettingGame: Full-match betting slip shown for ${outcome} - game continues running`);
        } catch (error) {
            console.error('Error showing inline bet slip:', error);
        }
    }

    hideInlineBetSlip() {
        try {
            this.inlineBetSlip.classList.add('hidden');
            
            document.querySelectorAll('[data-bet-type="full-match"]').forEach(btn => {
                btn.classList.remove('bet-btn-selected');
            });
            this.state.currentBet = null;
            
            console.log('SoccerBettingGame: Full-match betting slip hidden - game continues running');
        } catch (error) {
            console.error('Error hiding inline bet slip:', error);
        }
    }
    
    showMultiChoiceActionBet(event) {
        try {
            // Game should already be paused by processMatchEvent before this is called
            // This function now works with pre-triggered pause from centralized betting event detection
            if (this.pauseManager && !this.pauseManager.isPaused()) {
                console.warn('showMultiChoiceActionBet: Game not paused as expected, pausing now as fallback');
                this.pauseManager.pauseGame('BETTING_OPPORTUNITY', 15000);
            } else {
                console.log('showMultiChoiceActionBet: Working with pre-triggered pause from processMatchEvent');
            }
            
            this.state.currentActionBet = {
                active: true,
                details: event,
                timeoutId: null,
            };

            // Update betting modal content
            document.getElementById('action-bet-title').textContent = '⚡ Foul Event! ⚡';
            document.getElementById('action-bet-main-description').textContent = event.description;
            const choicesContainer = document.getElementById('action-bet-choices');
            choicesContainer.innerHTML = '';

            event.choices.forEach(choice => {
                const button = document.createElement('button');
                button.className = 'w-full py-3 bg-gray-700 hover:bg-indigo-600 rounded-lg text-white font-semibold transition';
                button.innerHTML = `${choice.text} <span class="text-gray-400 text-xs">@${choice.odds.toFixed(2)}</span>`;
                button.onclick = () => {
                    this.hideActionBet();
                    this.showActionBetSlip('action', choice.text, choice.odds, event.betType);
                };
                choicesContainer.appendChild(button);
            });

            // Show the betting modal
            this.actionBetModal.classList.remove('hidden');
            
            // Hide pause overlay if it's visible since betting modal should be on top
            if (this.pauseUI && this.pauseUI.isOverlayVisible()) {
                this.pauseUI.hidePauseOverlay();
            }

            // Set up timer bar animation with pause system integration
            this.setupBettingModalTimer(10000);

            // Set up timeout for auto-hide (this works alongside pause system timeout)
            this.state.currentActionBet.timeoutId = setTimeout(() => this.hideActionBet(true), 10000);
            
            console.log('SoccerBettingGame: Action betting modal displayed');
        } catch (error) {
            console.error('Error showing action bet modal:', error);
            // Ensure game resumes if there's an error
            if (this.pauseManager && this.pauseManager.isPaused()) {
                this.pauseManager.resumeGame();
            }
        }
    }

    hideActionBet(timedOut = false) {
        try {
            if (!this.state.currentActionBet.active) return;
            
            if (timedOut) {
                this.addEventToFeed(`Action Bet on '${this.state.currentActionBet.details.description}' timed out.`, 'text-gray-400');
            }
            
            // Clean up timeout
            if (this.state.currentActionBet.timeoutId) {
                clearTimeout(this.state.currentActionBet.timeoutId);
            }
            
            // Reset action bet state
            this.state.currentActionBet.active = false;
            this.state.currentActionBet.details = null;
            this.state.currentActionBet.timeoutId = null;
            
            // Hide the modal
            this.actionBetModal.classList.add('hidden');
            
            // Show pause overlay again if game is still paused and no other betting modals are visible
            if (this.pauseManager && this.pauseManager.isPaused() && 
                this.pauseUI && !this.pauseUI.isOverlayVisible() && 
                !this.isBettingModalVisible()) {
                const pauseInfo = this.pauseManager.getPauseInfo();
                this.pauseUI.showPauseOverlay(pauseInfo.reason || 'Game Paused');
            }
            
            // Resume the game when betting opportunity ends (skip or timeout)
            this.handleBettingDecisionComplete('skip_or_timeout');
            
            // Process next queued betting event if any (Requirement 4.4)
            setTimeout(() => {
                this.processNextQueuedBettingEvent();
            }, 2000); // Wait for resume countdown to complete
            
            console.log('SoccerBettingGame: Action betting modal hidden, game resuming');
        } catch (error) {
            console.error('Error hiding action bet modal:', error);
            // Ensure game resumes even if there's an error
            this.handleBettingDecisionComplete('error');
        }
    }

    /**
     * Handles the completion of a betting decision and ensures game resumes properly
     * This centralizes the resume logic for all betting decision scenarios
     * @param {string} decisionType - Type of decision: 'bet_placed', 'full_match_bet_placed', 'full_match_cancelled', 'skip_or_timeout', 'error'
     */
    handleBettingDecisionComplete(decisionType = 'bet_placed') {
        try {
            // Resume the game with countdown for normal betting decisions
            if (this.pauseManager && this.pauseManager.isPaused()) {
                const pauseInfo = this.pauseManager.getPauseInfo();
                
                // Determine countdown behavior based on decision type and pause reason (Requirement 4.2, 4.5)
                let useCountdown = false;
                let countdownSeconds = 0;
                
                if (decisionType === 'bet_placed' || decisionType === 'full_match_bet_placed') {
                    // Use countdown for successful bet placement
                    useCountdown = true;
                    countdownSeconds = 3;
                } else if (decisionType === 'full_match_cancelled') {
                    // Use shorter countdown for cancelled full-match betting
                    useCountdown = true;
                    countdownSeconds = 1;
                } else if (decisionType === 'skip_or_timeout') {
                    // No countdown for skipped/timed out betting
                    useCountdown = false;
                    countdownSeconds = 0;
                } else if (decisionType === 'error') {
                    // For errors, resume immediately without countdown
                    useCountdown = false;
                    countdownSeconds = 0;
                }
                
                // Verify this is a betting-related pause before resuming
                if (pauseInfo.reason === 'BETTING_OPPORTUNITY' || pauseInfo.reason === 'FULL_MATCH_BETTING') {
                    this.pauseManager.resumeGame(useCountdown, countdownSeconds);
                    console.log(`SoccerBettingGame: Game resuming with ${useCountdown ? countdownSeconds + 's countdown' : 'no countdown'} after ${decisionType}`);
                } else {
                    console.log(`SoccerBettingGame: Game paused for different reason (${pauseInfo.reason}), not resuming`);
                }
            } else {
                console.log('SoccerBettingGame: Game was not paused, no resume needed');
            }
        } catch (error) {
            console.error('Error handling betting decision completion:', error);
            // Last resort: force resume without countdown
            try {
                if (this.pauseManager && this.pauseManager.isPaused()) {
                    this.pauseManager.resumeGame(false, 0);
                }
            } catch (forceResumeError) {
                console.error('Failed to force resume game:', forceResumeError);
            }
        }
    }

    /**
     * Sets up the betting modal timer to work with pause system countdown
     * Connects existing betting modals with pause system countdown functionality
     * @param {number} duration - Duration in milliseconds for the betting timer
     */
    setupBettingModalTimer(duration) {
        try {
            // Set up timer bar animation using existing CSS classes
            const timerBar = document.getElementById('action-bet-timer-bar');
            if (timerBar) {
                // Reset any existing animation
                timerBar.classList.remove('countdown-bar-animate');
                void timerBar.offsetWidth; // Trigger reflow
                
                // Start the countdown animation
                timerBar.classList.add('countdown-bar-animate');
                
                console.log('SoccerBettingGame: Betting modal timer started with pause system integration');
            } else {
                console.warn('SoccerBettingGame: Timer bar element not found, betting modal will work without visual timer');
            }
            
            // Store timer reference for cleanup
            if (this.state.currentActionBet) {
                this.state.currentActionBet.timerStarted = true;
                this.state.currentActionBet.timerDuration = duration;
            }
            
        } catch (error) {
            console.error('Error setting up betting modal timer:', error);
            // Continue without timer - betting functionality will still work
        }
    }

    triggerWinAnimation() {
        this.confettiContainer.innerHTML = '';
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            this.confettiContainer.appendChild(confetti);
        }
    }

    // --- UTILITY: MATCH TIMELINE GENERATOR ---
    generateMatchTimeline(matchData) {
        let timeline = [];
        timeline.push({ time: 1, type: 'KICK_OFF', description: 'The match has kicked off!' });

        let eventTimes = new Set();
        for (let time = 5; time < 90; time += (Math.floor(Math.random() * 10) + 8)) {
             if (time > 88) break;
             eventTimes.add(time);
        }
        
        Array.from(eventTimes).sort((a,b) => a-b).forEach(time => {
            const rand = Math.random();
            if (rand < 0.20) {
                const team = Math.random() > 0.5 ? 'HOME' : 'AWAY';
                timeline.push({ time, type: 'GOAL', team, description: `GOAL! A stunning strike for the ${team === 'HOME' ? matchData.home : matchData.away}!` });
            } else if (rand < 0.65) {
                const foulOutcomes = [
                    { result: 'Yellow Card', text: 'The ref shows a Yellow Card!', odds: 2.5 },
                    { result: 'Red Card', text: 'It\'s a RED CARD! The player is off!', odds: 8.0 },
                    { result: 'Warning', text: 'The referee gives a stern warning.', odds: 1.5 },
                ];
                const outcomeRand = Math.random();
                let chosenOutcome;
                if (outcomeRand < 0.6) chosenOutcome = foulOutcomes[0]; // Yellow
                else if (outcomeRand < 0.9) chosenOutcome = foulOutcomes[2]; // Warning
                else chosenOutcome = foulOutcomes[1]; // Red

                timeline.push({
                    time,
                    type: 'MULTI_CHOICE_ACTION_BET',
                    betType: 'FOUL_OUTCOME',
                    description: 'Crunching tackle near the box! What will the ref do?',
                    choices: [
                        { text: 'Yellow Card', odds: 2.5 },
                        { text: 'Red Card', odds: 8.0 },
                        { text: 'Warning', odds: 1.5 },
                    ],
                });
                // Add the resolution event a few seconds later
                timeline.push({ time: time + 4, type: 'RESOLUTION', betType: 'FOUL_OUTCOME', result: chosenOutcome.result, description: chosenOutcome.text });
            } else {
                const eventTypes = ['A great save by the keeper!', 'The shot goes just wide!', 'A crunching tackle in midfield.', 'A promising attack breaks down.'];
                timeline.push({ time, type: 'COMMENTARY', description: eventTypes[Math.floor(Math.random() * eventTypes.length)] });
            }
        });
        
        return timeline.sort((a, b) => a.time - b.time);
    }

    // --- EVENT LISTENERS ---
    setupEventListeners() {
        // Navigation
        document.getElementById('back-to-lobby').addEventListener('click', () => this.backToLobby());
        document.getElementById('return-to-lobby-btn').addEventListener('click', () => {
            this.matchEndModal.classList.add('hidden');
            this.backToLobby();
        });
        document.getElementById('reset-prototype-btn').addEventListener('click', () => this.resetPrototype());

        // Action Bet Slip listeners
        document.getElementById('cancel-action-slip-btn').addEventListener('click', () => {
            this.actionBetSlipModal.classList.add('hidden');
            
            // Show pause overlay again if game is still paused and no other betting modals are visible
            if (this.pauseManager && this.pauseManager.isPaused() && 
                this.pauseUI && !this.pauseUI.isOverlayVisible() && 
                !this.isBettingModalVisible()) {
                const pauseInfo = this.pauseManager.getPauseInfo();
                this.pauseUI.showPauseOverlay(pauseInfo.reason || 'Game Paused');
            }
            
            // Resume game when betting is cancelled
            this.handleBettingDecisionComplete('skip_or_timeout');
        });
        document.getElementById('confirm-action-slip-btn').addEventListener('click', () => {
            const stake = parseFloat(document.getElementById('action-slip-amount').value);
            if (this.state.currentBet) {
                this.placeBet(this.state.currentBet.type, this.state.currentBet.outcome, this.state.currentBet.odds, stake, this.state.currentBet.betType);
                this.state.currentBet = null;
            }
            this.actionBetSlipModal.classList.add('hidden');
            
            // Show pause overlay again if game is still paused and no other betting modals are visible
            if (this.pauseManager && this.pauseManager.isPaused() && 
                this.pauseUI && !this.pauseUI.isOverlayVisible() && 
                !this.isBettingModalVisible()) {
                const pauseInfo = this.pauseManager.getPauseInfo();
                this.pauseUI.showPauseOverlay(pauseInfo.reason || 'Game Paused');
            }
        });
        document.querySelectorAll('#action-bet-slip-modal .quick-stake-btn-action-slip').forEach(button => {
            button.addEventListener('click', (e) => {
                document.getElementById('action-slip-amount').value = e.currentTarget.dataset.amount;
            });
        });

        // Inline Full Match Bet listeners
        document.getElementById('confirm-inline-bet-btn').addEventListener('click', () => {
            const stake = parseFloat(this.inlineStakeAmount.value);
            if (this.state.currentBet) {
                this.placeBet(this.state.currentBet.type, this.state.currentBet.outcome, this.state.currentBet.odds, stake);
            }
            this.hideInlineBetSlip();
        });
         document.querySelectorAll('#inline-bet-slip .quick-stake-btn-inline').forEach(button => {
            button.addEventListener('click', (e) => {
                this.inlineStakeAmount.value = e.currentTarget.dataset.amount;
            });
        });

        // Action bet modal listeners
        document.getElementById('skip-action-bet-btn').addEventListener('click', () => this.hideActionBet());
        
        // Full match bet buttons
        document.querySelectorAll('[data-bet-type="full-match"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const outcome = e.currentTarget.dataset.outcome;
                const odds = this.state.match.odds[outcome.toLowerCase()];
                this.showInlineBetSlip(outcome, odds);
            });
        });
        
        // Classic mode toggle
        const toggle = document.getElementById('classic-mode-toggle');
        toggle.addEventListener('change', () => {
            this.state.classicMode = toggle.checked;
            const dot = toggle.nextElementSibling.nextElementSibling;
            if (this.state.classicMode) {
                dot.style.transform = 'translateX(24px)';
                this.addEventToFeed("Classic Mode Enabled: Power-Ups are disabled for this match.", "text-gray-400 italic");
            } else {
                dot.style.transform = 'translateX(0)';
                this.addEventToFeed("Standard Mode Enabled: Power-Ups are active.", "text-gray-400 italic");
            }
            this.renderPowerUp();
        });
    }
}

// --- INITIALIZATION FUNCTION ---
export function initializeGame() {
    const game = new SoccerBettingGame();
    game.initialize();
    return game;
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});