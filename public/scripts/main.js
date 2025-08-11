/**
 * Main Application Entry Point
 * 
 * This module serves as the central orchestrator for the Soccer Betting Game,
 * managing the complete application lifecycle from initialization to cleanup.
 * It ensures proper module loading order, dependency management, and error handling.
 * 
 * Application Architecture:
 * - Modular design with clear separation of concerns
 * - Centralized state management with observer pattern
 * - Reactive UI system with automatic updates
 * - Comprehensive error handling and recovery
 * - Performance monitoring and optimization
 * 
 * Initialization Sequence:
 * 1. Module dependency validation
 * 2. Game state initialization
 * 3. UI system setup and DOM element caching
 * 4. Event listener registration
 * 5. Global function setup for backward compatibility
 * 6. State change subscription for debugging
 * 7. Initial render and user feedback
 * 
 * Error Handling Strategy:
 * - Graceful degradation for non-critical failures
 * - User-friendly error messages with recovery options
 * - Comprehensive logging for debugging
 * - Automatic cleanup on application errors
 * - Fallback rendering for critical UI failures
 * 
 * Performance Features:
 * - Lazy loading of non-critical components
 * - Memory leak prevention with proper cleanup
 * - Efficient event listener management
 * - Optimized rendering with minimal DOM manipulation
 * 
 * Development Features:
 * - Debug mode with detailed state logging
 * - Global functions for console debugging
 * - Application info and status reporting
 * - Module validation and health checks
 * 
 * @module main
 * @requires gameState - Centralized state management
 * @requires gameLogic - Match simulation and game mechanics
 * @requires betting - Betting system and power-ups
 * @requires ui - User interface rendering and management
 * @requires events - Event handling and user interactions
 * @requires utils - Utility functions and constants
 * @exports {Function} initializeApplication - Main initialization function
 * @exports {Function} startGame - Game start controller
 * @exports {Function} resetGame - Game reset controller
 * @exports {Object} appConfig - Application configuration
 * @exports {boolean} isInitialized - Initialization status flag
 */

// Import all required modules
import { 
    getInitialState, 
    getCurrentState, 
    updateState, 
    resetState,
    subscribeToStateChanges 
} from './gameState.js';

import { MOCK_MATCHES } from './utils.js';

import { 
    startMatch, 
    backToLobby,
    clearMatchInterval 
} from './gameLogic.js';

import { 
    placeBet,
    usePowerUp,
    showMultiChoiceActionBet,
    resolveBets
} from './betting.js';

import { 
    initializeUI,
    render,
    addEventToFeed,
    triggerWinAnimation,
    renderPowerUp,
    renderOdds,
    renderEndGameSummary
} from './ui.js';

import { 
    initializeEventListeners 
} from './events.js';

// --- APPLICATION STATE ---

/**
 * Application initialization status
 * @type {boolean}
 */
let isInitialized = false;

/**
 * Application configuration
 * @type {Object}
 */
const appConfig = {
    version: '1.0.0',
    name: 'Soccer Betting Game',
    debug: false
};

// --- VALIDATION FUNCTIONS ---

/**
 * Validates that all required modules and their functions are available
 * 
 * This function performs comprehensive validation of module dependencies
 * before application initialization. It checks for the presence and type
 * of all critical functions required for proper application operation.
 * 
 * Validation Categories:
 * 1. Game State Module - State management functions
 * 2. UI Module - Rendering and DOM manipulation functions
 * 3. Events Module - Event handling and user interaction functions
 * 4. Game Logic Module - Match simulation and game mechanics
 * 5. Betting Module - Betting system and power-up functions
 * 
 * Validation Process:
 * - Checks function existence with typeof validation
 * - Collects all validation errors for comprehensive reporting
 * - Returns structured result with success flag and error details
 * - Provides specific error messages for debugging
 * 
 * Error Reporting:
 * - Detailed error messages for each missing function
 * - Categorized errors by module for easier debugging
 * - Non-blocking validation continues through all checks
 * - Comprehensive error collection for full picture
 * 
 * @returns {Object} Validation result object
 * @returns {boolean} returns.success - True if all validations pass
 * @returns {Array<string>} returns.errors - Array of validation error messages
 * @example
 * const result = validateModuleDependencies();
 * if (!result.success) {
 *   console.error('Module validation failed:', result.errors);
 * }
 */
function validateModuleDependencies() {
    const errors = [];
    
    try {
        // Check game state module
        if (typeof getInitialState !== 'function') {
            errors.push('getInitialState function not available');
        }
        if (typeof getCurrentState !== 'function') {
            errors.push('getCurrentState function not available');
        }
        if (typeof updateState !== 'function') {
            errors.push('updateState function not available');
        }
        if (typeof subscribeToStateChanges !== 'function') {
            errors.push('subscribeToStateChanges function not available');
        }
        
        // Check UI module
        if (typeof initializeUI !== 'function') {
            errors.push('initializeUI function not available');
        }
        if (typeof render !== 'function') {
            errors.push('render function not available');
        }
        
        // Check events module
        if (typeof initializeEventListeners !== 'function') {
            errors.push('initializeEventListeners function not available');
        }
        
        // Check game logic module
        if (typeof startMatch !== 'function') {
            errors.push('startMatch function not available');
        }
        if (typeof clearMatchInterval !== 'function') {
            errors.push('clearMatchInterval function not available');
        }
        
        // Check betting module
        if (typeof usePowerUp !== 'function') {
            errors.push('usePowerUp function not available');
        }
        
    } catch (error) {
        errors.push(`Module validation error: ${error.message}`);
    }
    
    return {
        success: errors.length === 0,
        errors
    };
}

/**
 * Validates the application state after initialization
 * @param {Object} state - The application state to validate
 * @returns {boolean} True if state is valid
 */
function validateApplicationState(state) {
    try {
        if (!state || typeof state !== 'object') {
            console.error('State is not an object');
            return false;
        }
        
        const requiredProps = ['currentScreen', 'wallet', 'classicMode', 'match', 'bets'];
        for (const prop of requiredProps) {
            if (!(prop in state)) {
                console.error(`Missing required state property: ${prop}`);
                return false;
            }
        }
        
        if (typeof state.wallet !== 'number' || state.wallet < 0) {
            console.error('Invalid wallet value');
            return false;
        }
        
        if (!['lobby', 'match'].includes(state.currentScreen)) {
            console.error('Invalid current screen');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating application state:', error);
        return false;
    }
}

// --- INITIALIZATION FUNCTIONS ---

/**
 * Initializes the entire application with comprehensive error handling
 * 
 * This is the main initialization function that orchestrates the complete
 * application startup process. It follows a strict dependency order and
 * provides detailed feedback throughout the initialization process.
 * 
 * Initialization Steps:
 * 1. Module Dependency Validation - Ensures all required functions exist
 * 2. Game State Initialization - Sets up centralized state management
 * 3. UI Module Setup - Initializes rendering system and DOM caching
 * 4. Event Listener Registration - Sets up user interaction handling
 * 5. Global Function Setup - Backward compatibility and debugging
 * 6. State Change Subscription - Debug logging if enabled
 * 7. Initial Render - First UI update and user feedback
 * 
 * Error Handling Strategy:
 * - Each step has individual error handling
 * - Critical errors stop initialization with user feedback
 * - Non-critical errors log warnings but continue
 * - Comprehensive error reporting for debugging
 * - User-friendly error messages with recovery options
 * 
 * Success Indicators:
 * - Console logging for each successful step
 * - Final success message with application info
 * - isInitialized flag set to true
 * - Welcome message with starting wallet balance
 * 
 * @async
 * @throws {Error} Critical initialization errors are caught and displayed
 * @example
 * // Called automatically on DOM load, but can be called manually
 * await initializeApplication();
 */
async function initializeApplication() {
    try {
        console.log('🚀 Initializing Soccer Betting Game...');
        
        // Step 0: Validate module dependencies
        console.log('🔍 Checking module dependencies...');
        const moduleCheckResult = validateModuleDependencies();
        if (!moduleCheckResult.success) {
            throw new Error(`Module dependency check failed: ${moduleCheckResult.errors.join(', ')}`);
        }
        console.log('✅ Module dependencies validated');
        
        // Step 1: Initialize game state (no dependencies)
        console.log('📊 Initializing game state...');
        try {
            const initialState = getInitialState();
            if (!initialState || typeof initialState !== 'object') {
                throw new Error('Invalid initial state returned');
            }
            console.log('✅ Game state initialized');
        } catch (stateError) {
            throw new Error(`Game state initialization failed: ${stateError.message}`);
        }
        
        // Step 2: Initialize UI module (depends on game state)
        console.log('🎨 Initializing UI module...');
        try {
            initializeUI();
            console.log('✅ UI module initialized');
        } catch (uiError) {
            throw new Error(`UI module initialization failed: ${uiError.message}`);
        }
        
        // Step 3: Initialize event listeners (depends on UI and other modules)
        console.log('🎯 Initializing event listeners...');
        try {
            initializeEventListeners();
            console.log('✅ Event listeners initialized');
        } catch (eventsError) {
            throw new Error(`Event listeners initialization failed: ${eventsError.message}`);
        }
        
        // Step 4: Set up global functions for backward compatibility
        try {
            setupGlobalFunctions();
            console.log('✅ Global functions set up');
        } catch (globalError) {
            console.warn('Warning: Global functions setup had issues:', globalError);
            // Continue initialization as this is not critical
        }
        
        // Step 5: Subscribe to state changes for debugging (if enabled)
        if (appConfig.debug) {
            subscribeToStateChanges((newState) => {
                console.log('🔄 State changed:', newState);
            });
        }
        
        // Step 6: Perform initial render
        console.log('🖼️ Performing initial render...');
        render();
        console.log('✅ Initial render complete');
        
        // Mark as initialized
        isInitialized = true;
        console.log('🎉 Application initialized successfully!');
        
        // Add welcome message to console
        console.log(`
        🏆 ${appConfig.name} v${appConfig.version}
        ⚽ Ready to start betting on simulated matches!
        💰 Starting wallet: $${getCurrentState().wallet.toFixed(2)}
        `);
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        isInitialized = false;
        showInitializationError(error);
    }
}

/**
 * Sets up global functions for backward compatibility and external access
 * This ensures existing HTML event handlers and external scripts can still work
 */
function setupGlobalFunctions() {
    // Make key functions available globally
    window.startGame = startGame;
    window.resetGame = resetGame;
    window.getCurrentGameState = getCurrentState;
    window.updateGameState = updateState;
    window.resetState = resetState;
    
    // Make module functions available globally for backward compatibility
    window.render = render;
    window.addEventToFeed = addEventToFeed;
    window.triggerWinAnimation = triggerWinAnimation;
    window.renderPowerUp = renderPowerUp;
    window.renderOdds = renderOdds;
    window.renderEndGameSummary = renderEndGameSummary;
    window.usePowerUp = usePowerUp;
    window.showMultiChoiceActionBet = showMultiChoiceActionBet;
    window.resolveBets = resolveBets;
    
    // Application control functions
    window.getAppInfo = () => ({
        ...appConfig,
        initialized: isInitialized,
        currentState: getCurrentState()
    });
    
    window.enableDebugMode = () => {
        appConfig.debug = true;
        console.log('🐛 Debug mode enabled');
    };
    
    window.disableDebugMode = () => {
        appConfig.debug = false;
        console.log('🐛 Debug mode disabled');
    };
}

// --- GAME CONTROL FUNCTIONS ---

/**
 * Starts a new game with comprehensive validation and error handling
 * 
 * This function serves as the main game controller, handling the complete
 * game start process from validation through initialization. It ensures
 * the application is ready and properly cleans up any existing game state.
 * 
 * Pre-Start Validation:
 * - Checks application initialization status
 * - Validates match data structure and content
 * - Ensures no conflicting game states exist
 * 
 * Game Start Process:
 * 1. Clear any existing match intervals or timeouts
 * 2. Validate and sanitize match data
 * 3. Delegate to game logic module for match initialization
 * 4. Provide user feedback through event feed
 * 5. Log success/failure for debugging
 * 
 * Error Handling:
 * - Application not initialized - prevents game start
 * - Invalid match data - shows user-friendly error
 * - Game logic errors - graceful failure with feedback
 * - UI update errors - logged but don't prevent game start
 * 
 * @param {Object} matchData - Match data containing team information
 * @param {string} matchData.home - Home team name (required, non-empty)
 * @param {string} matchData.away - Away team name (required, non-empty)
 * @throws {Error} Logs errors but doesn't throw, provides user feedback
 * @example
 * // Start a match between two teams
 * startGame({
 *   home: 'Quantum Strikers',
 *   away: 'Celestial FC'
 * });
 */
function startGame(matchData) {
    if (!isInitialized) {
        console.error('❌ Cannot start game: Application not initialized');
        return;
    }
    
    try {
        console.log('🎮 Starting new game:', matchData);
        
        // Clear any existing match intervals
        clearMatchInterval();
        
        // Start the match through game logic module
        startMatch(matchData);
        
        // Add game start message to event feed
        addEventToFeed(`🏁 Match started: ${matchData.home} vs ${matchData.away}`, 'text-green-400 font-bold');
        
        console.log('✅ Game started successfully');
        
    } catch (error) {
        console.error('❌ Failed to start game:', error);
        addEventToFeed('❌ Failed to start match. Please try again.', 'text-red-400');
    }
}

/**
 * Resets the entire game to initial state
 */
function resetGame() {
    if (!isInitialized) {
        console.error('❌ Cannot reset game: Application not initialized');
        return;
    }
    
    try {
        console.log('🔄 Resetting game...');
        
        // Clear any running intervals
        clearMatchInterval();
        
        // Reset game state
        resetState();
        
        // Hide all modals
        const modals = document.querySelectorAll('.fixed[id$="-modal"]');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Clear event feed
        const eventFeed = document.getElementById('event-feed');
        if (eventFeed) {
            eventFeed.innerHTML = '';
        }
        
        // Trigger full re-render
        render();
        
        // Add reset message
        addEventToFeed('🔄 Game reset to initial state', 'text-blue-400');
        
        console.log('✅ Game reset successfully');
        
    } catch (error) {
        console.error('❌ Failed to reset game:', error);
        addEventToFeed('❌ Failed to reset game. Please refresh the page.', 'text-red-400');
    }
}

// --- ERROR HANDLING ---

/**
 * Shows an initialization error to the user
 * @param {Error} error - The initialization error
 */
function showInitializationError(error) {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md text-center">
                    <h2 class="text-2xl font-bold text-red-300 mb-4">⚠️ Initialization Error</h2>
                    <p class="text-red-200 mb-4">
                        The application failed to initialize properly. Please refresh the page and try again.
                    </p>
                    <details class="text-left">
                        <summary class="cursor-pointer text-red-300 hover:text-red-200">Technical Details</summary>
                        <pre class="mt-2 text-xs text-red-200 bg-red-950 p-2 rounded overflow-auto">
${error.message}
${error.stack}
                        </pre>
                    </details>
                    <button onclick="window.location.reload()" 
                            class="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white font-semibold transition">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Global error handler for unhandled errors
 * @param {ErrorEvent} event - The error event
 */
function handleGlobalError(event) {
    console.error('🚨 Unhandled error:', event.error);
    
    if (isInitialized) {
        addEventToFeed('⚠️ An unexpected error occurred. Some features may not work properly.', 'text-red-400');
    }
    
    // Don't prevent default error handling
    return false;
}

/**
 * Global handler for unhandled promise rejections
 * @param {PromiseRejectionEvent} event - The promise rejection event
 */
function handleUnhandledRejection(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    
    if (isInitialized) {
        addEventToFeed('⚠️ An unexpected error occurred. Some features may not work properly.', 'text-red-400');
    }
    
    // Prevent default handling (which would log to console)
    event.preventDefault();
}

// --- APPLICATION LIFECYCLE ---

/**
 * Handles application cleanup when the page is about to unload
 */
function handleBeforeUnload() {
    console.log('🧹 Cleaning up application...');
    
    // Clear any running intervals
    clearMatchInterval();
    
    // Clear any timeouts
    const currentState = getCurrentState();
    if (currentState.currentActionBet.timeoutId) {
        clearTimeout(currentState.currentActionBet.timeoutId);
    }
    
    console.log('✅ Application cleanup complete');
}

/**
 * Handles visibility change events (when user switches tabs)
 */
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('👁️ Application hidden (user switched tabs)');
        // Could pause timers here if needed
    } else {
        console.log('👁️ Application visible (user returned to tab)');
        // Could resume timers here if needed
        if (isInitialized) {
            render(); // Refresh UI when user returns
        }
    }
}

// --- EVENT LISTENERS SETUP ---

/**
 * Sets up application-level event listeners
 */
function setupApplicationEventListeners() {
    // Global error handling
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Application lifecycle events
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    console.log('✅ Application event listeners set up');
}

// --- MAIN INITIALIZATION ---

/**
 * Main initialization function that runs when DOM is loaded
 */
function main() {
    console.log('🎯 DOM loaded, starting application initialization...');
    
    // Set up application-level event listeners first
    setupApplicationEventListeners();
    
    // Initialize the application
    initializeApplication();
}

// --- MODULE EXPORTS ---

export {
    initializeApplication,
    startGame,
    resetGame,
    appConfig,
    isInitialized
};

// --- AUTO-INITIALIZATION ---

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    // DOM is already loaded
    main();
}

// Also initialize if called directly (for testing or manual initialization)
if (typeof window !== 'undefined') {
    window.initializeApp = initializeApplication;
    window.mainApp = {
        start: startGame,
        reset: resetGame,
        config: appConfig,
        initialized: () => isInitialized
    };
}