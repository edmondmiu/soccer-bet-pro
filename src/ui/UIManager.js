/**
 * UIManager - Orchestrates all UI updates and manages screen transitions
 * Handles screen rendering based on state changes and provides notification system
 */
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';

export class UIManager {
    constructor() {
        try {
            this.currentScreen = null;
            this.stateManager = null;
            this.screens = new Map();
            this.notifications = [];
            this.notificationContainer = null;
            this.minimalMode = false;
            this.errorCount = 0;
            this.maxErrors = 5;
            
            // Initialize UI elements
            this.initializeUI();
            this.setupEventListeners();
            this.setupErrorRecovery();
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.UI, {
                context: 'UIManager_constructor',
                component: 'UIManager'
            });
            this.enableMinimalMode();
        }
    }

    /**
     * Initialize the UIManager with StateManager
     */
    initialize(stateManager) {
        try {
            this.stateManager = stateManager;
            
            // Subscribe to state changes with error handling
            this.stateManager.subscribe((state) => {
                try {
                    this.handleStateChange(state);
                } catch (error) {
                    this.handleUIError(error, 'state_change_handler');
                }
            });
            
            // Don't render immediately - wait for screens to be registered
        } catch (error) {
            this.handleUIError(error, 'initialize');
        }
    }

    /**
     * Initialize UI structure and notification container
     */
    initializeUI() {
        // Only initialize if document is available (browser environment)
        if (typeof document === 'undefined') {
            return;
        }
        
        // Create main app container if it doesn't exist
        if (!document.getElementById('app')) {
            const app = document.createElement('div');
            app.id = 'app';
            app.className = 'app-container';
            document.body.appendChild(app);
        }

        // Create notification container
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'notification-container';
        document.body.appendChild(this.notificationContainer);

        // Apply base styles
        this.applyBaseStyles();
    }

    /**
     * Apply base CSS styles for the UI
     */
    applyBaseStyles() {
        // Only apply styles if document is available
        if (typeof document === 'undefined') {
            return;
        }
        
        const style = document.createElement('style');
        style.textContent = `
            /* Base App Styles */
            .app-container {
                min-height: 100vh;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #e2e8f0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow-x: hidden;
            }

            /* Screen Transition Styles */
            .screen {
                min-height: 100vh;
                padding: 20px;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease-in-out;
            }

            .screen.active {
                opacity: 1;
                transform: translateY(0);
            }

            /* Notification System Styles */
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            }

            .notification {
                background: rgba(15, 23, 42, 0.95);
                border: 2px solid;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(4px);
                transform: translateX(100%);
                transition: all 0.3s ease-in-out;
                cursor: pointer;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification.success {
                border-color: #059669;
                background: linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
            }

            .notification.error {
                border-color: #dc2626;
                background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
            }

            .notification.warning {
                border-color: #f59e0b;
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
            }

            .notification.info {
                border-color: #3b82f6;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%);
            }

            .notification-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: #ffffff;
            }

            .notification-message {
                color: #e2e8f0;
                font-size: 14px;
                line-height: 1.4;
            }

            /* Button Styles */
            .btn {
                padding: 12px 24px;
                border: 2px solid;
                border-radius: 8px;
                background: transparent;
                color: #ffffff;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
                font-size: 16px;
                min-width: 120px;
            }

            .btn-primary {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border-color: #34d399;
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }

            .btn-primary:hover {
                background: linear-gradient(135deg, #047857 0%, #059669 100%);
                box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
                transform: translateY(-2px);
            }

            .btn-secondary {
                border-color: #475569;
                background: rgba(71, 85, 105, 0.2);
            }

            .btn-secondary:hover {
                border-color: #64748b;
                background: rgba(100, 116, 139, 0.3);
            }

            .btn-danger {
                border-color: #dc2626;
                background: rgba(220, 38, 38, 0.2);
            }

            .btn-danger:hover {
                background: rgba(220, 38, 38, 0.3);
            }

            /* Loading Spinner */
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid #475569;
                border-radius: 50%;
                border-top-color: #10b981;
                animation: spin 1s ease-in-out infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .app-container {
                    padding: 0;
                }

                .screen {
                    padding: 16px;
                }

                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .notification {
                    margin-bottom: 8px;
                }

                .btn {
                    padding: 14px 20px;
                    font-size: 18px;
                    min-height: 48px;
                    touch-action: manipulation;
                }
            }

            /* Touch-friendly interactions */
            @media (hover: none) and (pointer: coarse) {
                .btn:hover {
                    transform: none;
                }

                .btn:active {
                    transform: scale(0.98);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Only setup listeners if document and window are available
        if (typeof document === 'undefined' || typeof window === 'undefined') {
            return;
        }
        
        // Handle notification clicks (dismiss)
        document.addEventListener('click', (event) => {
            if (event.target.closest('.notification')) {
                const notification = event.target.closest('.notification');
                this.dismissNotification(notification);
            }
        });

        // Handle escape key for modals/notifications
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Handle window resize for responsive updates
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Register a screen component
     */
    registerScreen(name, screenComponent) {
        console.log(`UIManager: Registering screen '${name}'`, screenComponent);
        this.screens.set(name, screenComponent);
        console.log(`UIManager: Screen '${name}' registered. Total screens:`, this.screens.size);
    }

    /**
     * Start rendering after all screens are registered
     */
    startRendering() {
        console.log('UIManager: Starting rendering with', this.screens.size, 'registered screens');
        if (this.stateManager) {
            this.render();
        }
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName, data = {}) {
        try {
            console.log(`UIManager: Attempting to show screen '${screenName}'. Available screens:`, Array.from(this.screens.keys()));
            const screen = this.screens.get(screenName);
            if (!screen) {
                console.error(`UIManager: Screen '${screenName}' not found. Available screens:`, Array.from(this.screens.keys()));
                throw new Error(`Screen '${screenName}' not found`);
            }

            // Only proceed if document is available
            if (typeof document === 'undefined') {
                this.currentScreen = screenName;
                return { success: true };
            }

            // Hide current screen
            if (this.currentScreen) {
                const currentElement = document.querySelector('.screen.active');
                if (currentElement) {
                    currentElement.classList.remove('active');
                    setTimeout(() => {
                        if (currentElement.parentNode) {
                            currentElement.remove();
                        }
                    }, 300);
                }
            }

            // Show new screen
            this.currentScreen = screenName;
            
            let screenElement;
            if (this.minimalMode) {
                screenElement = this.createMinimalScreen(screenName, data);
            } else {
                screenElement = screen.render(data);
            }
            
            screenElement.classList.add('screen');
            
            const appContainer = document.getElementById('app');
            if (appContainer) {
                appContainer.appendChild(screenElement);

                // Trigger animation
                setTimeout(() => {
                    screenElement.classList.add('active');
                }, 50);
            }

            // Initialize screen if it has an initialize method and hasn't been initialized yet
            if (screen.initialize && !this.minimalMode && !screen.stateManager) {
                screen.initialize(data);
            }

            return { success: true };
        } catch (error) {
            return this.handleUIError(error, 'showScreen', { screenName, data });
        }
    }

    /**
     * Render current screen based on state
     */
    render() {
        if (!this.stateManager) return;

        const state = this.stateManager.getState();
        const targetScreen = state.currentScreen || 'lobby';

        if (this.currentScreen !== targetScreen) {
            this.showScreen(targetScreen, state);
        } else {
            // Update current screen with new state
            this.updateCurrentScreen(state);
        }
    }

    /**
     * Update current screen with new state data
     */
    updateCurrentScreen(state) {
        const screen = this.screens.get(this.currentScreen);
        if (screen && screen.update) {
            screen.update(state);
        }
    }

    /**
     * Handle state changes from StateManager
     */
    handleStateChange(state) {
        this.render();
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info', title = '', duration = 5000) {
        try {
            const notification = {
                id: Date.now() + Math.random(),
                message: String(message || 'No message'),
                type: ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info',
                title: String(title || ''),
                duration: Math.max(0, Number(duration) || 5000)
            };

            this.notifications.push(notification);
            
            if (this.minimalMode) {
                // In minimal mode, just log to console
                console.log(`[${notification.type.toUpperCase()}] ${notification.title} ${notification.message}`);
            } else {
                this.renderNotification(notification);
            }

            // Auto-dismiss after duration
            if (notification.duration > 0) {
                setTimeout(() => {
                    this.dismissNotification(notification.id);
                }, notification.duration);
            }

            return notification.id;
        } catch (error) {
            // Fallback for notification errors - just log
            console.error('Notification error:', error, { message, type, title });
            return null;
        }
    }

    /**
     * Render a notification element
     */
    renderNotification(notification) {
        // Only render if document is available and notification container exists
        if (typeof document === 'undefined' || !this.notificationContainer) {
            return;
        }
        
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.dataset.notificationId = notification.id;

        element.innerHTML = `
            ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
            <div class="notification-message">${notification.message}</div>
        `;

        this.notificationContainer.appendChild(element);

        // Trigger show animation
        setTimeout(() => {
            element.classList.add('show');
        }, 50);
    }

    /**
     * Dismiss a notification
     */
    dismissNotification(notificationIdOrElement) {
        let element;
        let notificationId;

        if (typeof notificationIdOrElement === 'object') {
            element = notificationIdOrElement;
            notificationId = element.dataset.notificationId;
        } else {
            notificationId = notificationIdOrElement;
            element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        }

        // Always remove from notifications array, even if element not found
        this.notifications = this.notifications.filter(n => n.id != notificationId);

        // Only animate if element exists
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
    }

    /**
     * Clear all notifications
     */
    clearNotifications() {
        // Create a copy of the array to avoid modification during iteration
        const notificationsToRemove = [...this.notifications];
        notificationsToRemove.forEach(notification => {
            this.dismissNotification(notification.id);
        });
    }

    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        // Dismiss topmost notification
        if (this.notifications.length > 0) {
            const lastNotification = this.notifications[this.notifications.length - 1];
            this.dismissNotification(lastNotification.id);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update current screen for responsive changes
        const screen = this.screens.get(this.currentScreen);
        if (screen && screen.handleResize) {
            screen.handleResize();
        }
    }

    /**
     * Update display elements based on state changes
     */
    updateDisplay(stateChanges) {
        // Update wallet display
        if (stateChanges.wallet !== undefined) {
            this.updateWalletDisplay(stateChanges.wallet);
        }

        // Update match timer
        if (stateChanges.match?.time !== undefined) {
            this.updateTimerDisplay(stateChanges.match.time);
        }

        // Update score
        if (stateChanges.match?.homeScore !== undefined || stateChanges.match?.awayScore !== undefined) {
            this.updateScoreDisplay(stateChanges.match);
        }

        // Update odds
        if (stateChanges.match?.odds) {
            this.updateOddsDisplay(stateChanges.match.odds);
        }
    }

    /**
     * Update wallet display elements
     */
    updateWalletDisplay(wallet) {
        const walletElements = document.querySelectorAll('.wallet-balance');
        walletElements.forEach(element => {
            element.textContent = `$${wallet.toFixed(2)}`;
        });
    }

    /**
     * Update timer display elements
     */
    updateTimerDisplay(time) {
        const timerElements = document.querySelectorAll('.match-timer');
        timerElements.forEach(element => {
            element.textContent = `${Math.floor(time)}'`;
        });
    }

    /**
     * Update score display elements
     */
    updateScoreDisplay(match) {
        const scoreElements = document.querySelectorAll('.match-score');
        scoreElements.forEach(element => {
            element.textContent = `${match.homeScore} - ${match.awayScore}`;
        });
    }

    /**
     * Update odds display elements
     */
    updateOddsDisplay(odds) {
        const homeOddsElements = document.querySelectorAll('.odds-home');
        const drawOddsElements = document.querySelectorAll('.odds-draw');
        const awayOddsElements = document.querySelectorAll('.odds-away');

        homeOddsElements.forEach(element => {
            element.textContent = odds.home.toFixed(2);
        });

        drawOddsElements.forEach(element => {
            element.textContent = odds.draw.toFixed(2);
        });

        awayOddsElements.forEach(element => {
            element.textContent = odds.away.toFixed(2);
        });
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        this.showNotification(
            `<div class="loading-spinner"></div> ${message}`,
            'info',
            '',
            0 // Don't auto-dismiss
        );
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Remove loading notifications
        this.notifications = this.notifications.filter(notification => {
            if (notification.message.includes('loading-spinner')) {
                this.dismissNotification(notification.id);
                return false;
            }
            return true;
        });
    }

    /**
     * Get current screen name
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    /**
     * Check if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        try {
            this.clearNotifications();
            
            // Remove event listeners
            if (typeof document !== 'undefined') {
                document.removeEventListener('click', this.handleNotificationClick);
                document.removeEventListener('keydown', this.handleEscapeKey);
            }
            
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', this.handleResize);
            }

            // Clear screens
            this.screens.clear();
            this.currentScreen = null;
            this.stateManager = null;
        } catch (error) {
            console.error('Error during UIManager cleanup:', error);
        }
    }

    /**
     * Setup error recovery strategies for UI operations
     */
    setupErrorRecovery() {
        // Register recovery callback for component refresh
        errorHandler.registerRecoveryCallback('refresh_component', async (errorInfo, options) => {
            try {
                if (this.currentScreen) {
                    const state = this.stateManager ? this.stateManager.getState() : {};
                    const result = this.showScreen(this.currentScreen, state);
                    return { 
                        success: result.success, 
                        message: result.success ? 'Component refreshed' : 'Component refresh failed' 
                    };
                }
                return { success: false, message: 'No current screen to refresh' };
            } catch (error) {
                return { success: false, message: 'Component refresh failed' };
            }
        });

        // Register recovery callback for minimal UI mode
        errorHandler.registerRecoveryCallback('minimal_ui_mode', async (errorInfo, options) => {
            try {
                this.enableMinimalMode();
                return { success: true, message: 'Minimal UI mode enabled' };
            } catch (error) {
                return { success: false, message: 'Failed to enable minimal UI mode' };
            }
        });
    }

    /**
     * Handle UI errors with recovery attempts
     */
    handleUIError(error, context, data = {}) {
        this.errorCount++;
        
        const errorResult = errorHandler.handleError(error, ERROR_TYPES.UI, {
            context: `UIManager_${context}`,
            errorCount: this.errorCount,
            minimalMode: this.minimalMode,
            ...data
        }, {
            attemptRecovery: this.errorCount < this.maxErrors
        });

        // Enable minimal mode if too many errors
        if (this.errorCount >= this.maxErrors && !this.minimalMode) {
            this.enableMinimalMode();
        }

        return errorResult;
    }

    /**
     * Enable minimal UI mode for graceful degradation
     */
    enableMinimalMode() {
        try {
            console.warn('Enabling minimal UI mode due to errors');
            this.minimalMode = true;
            
            // Clear existing UI elements that might be causing issues
            if (typeof document !== 'undefined') {
                const appContainer = document.getElementById('app');
                if (appContainer) {
                    appContainer.innerHTML = this.getMinimalHTML();
                }
            }
            
            return true;
        } catch (error) {
            console.error('Failed to enable minimal UI mode:', error);
            return false;
        }
    }

    /**
     * Create minimal screen for fallback mode
     */
    createMinimalScreen(screenName, data) {
        const element = document.createElement('div');
        element.className = 'minimal-screen';
        
        let content = '';
        
        if (screenName === 'lobby') {
            content = `
                <h1>Soccer Betting Game</h1>
                <p>Wallet: $${data.wallet || 1000}</p>
                <button onclick="window.gameController?.startMatch?.()">Start Match</button>
            `;
        } else if (screenName === 'match') {
            content = `
                <h1>Match in Progress</h1>
                <p>Time: ${Math.floor(data.match?.time || 0)}'</p>
                <p>Score: ${data.match?.homeScore || 0} - ${data.match?.awayScore || 0}</p>
                <p>Wallet: $${data.wallet || 0}</p>
                <button onclick="window.gameController?.endMatch?.()">End Match</button>
            `;
        } else {
            content = `
                <h1>Game Screen</h1>
                <p>Minimal mode active</p>
                <button onclick="location.reload()">Reload Game</button>
            `;
        }
        
        element.innerHTML = content;
        return element;
    }

    /**
     * Get minimal HTML for emergency fallback
     */
    getMinimalHTML() {
        return `
            <div style="padding: 20px; text-align: center; color: white;">
                <h1>Soccer Betting Game - Safe Mode</h1>
                <p>The game is running in safe mode due to display issues.</p>
                <p>Basic functionality is available.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px;">
                    Reload Game
                </button>
            </div>
        `;
    }

    /**
     * Safe screen transition with error handling
     */
    safeShowScreen(screenName, data = {}) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const result = this.showScreen(screenName, data);
            
            if (result.success) {
                return result;
            }

            retryCount++;
            
            // Enable minimal mode on retry
            if (retryCount < maxRetries && !this.minimalMode) {
                this.enableMinimalMode();
            }
        }

        // Final fallback
        this.enableMinimalMode();
        return { success: false, message: 'Screen transition failed, minimal mode enabled' };
    }

    /**
     * Get UI system health status
     */
    getSystemHealth() {
        try {
            return {
                healthy: !this.minimalMode && this.errorCount < this.maxErrors,
                minimalMode: this.minimalMode,
                errorCount: this.errorCount,
                maxErrors: this.maxErrors,
                currentScreen: this.currentScreen,
                notificationCount: this.notifications.length,
                hasDocument: typeof document !== 'undefined',
                hasWindow: typeof window !== 'undefined'
            };
        } catch (error) {
            return {
                healthy: false,
                error: 'Unable to determine UI health'
            };
        }
    }

    /**
     * Reset error count (for recovery)
     */
    resetErrorCount() {
        this.errorCount = 0;
        console.info('UI error count reset');
    }

    /**
     * Disable minimal mode (attempt to return to normal mode)
     */
    disableMinimalMode() {
        try {
            if (!this.minimalMode) {
                return { success: true, message: 'Already in normal mode' };
            }

            this.minimalMode = false;
            this.resetErrorCount();
            
            // Re-initialize UI
            this.initializeUI();
            
            // Re-render current screen
            if (this.currentScreen && this.stateManager) {
                const state = this.stateManager.getState();
                this.showScreen(this.currentScreen, state);
            }
            
            console.info('Minimal mode disabled, returning to normal UI');
            return { success: true, message: 'Normal UI mode restored' };
        } catch (error) {
            this.enableMinimalMode();
            return { success: false, message: 'Failed to disable minimal mode' };
        }
    }
}

// Export singleton instance (only create in browser environment)
export const uiManager = typeof window !== 'undefined' ? new UIManager() : null;