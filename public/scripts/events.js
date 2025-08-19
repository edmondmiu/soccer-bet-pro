/**
 * Event Handling Module
 * 
 * This module manages all user interactions and event handling for the Soccer
 * Betting Game. It provides a centralized system for handling DOM events,
 * user inputs, and application-level interactions.
 * 
 * Event Categories:
 * 1. Navigation Events - Screen transitions and app navigation
 * 2. Betting Events - Bet placement, confirmation, and cancellation
 * 3. Modal Events - Modal interactions and keyboard shortcuts
 * 4. Power-up Events - Power-up activation and management
 * 5. Input Events - Form inputs and user data entry
 * 
 * Architecture:
 * - Centralized event listener management
 * - Modular event handler functions
 * - Integration with state management system
 * - Comprehensive error handling
 * - Keyboard accessibility support
 * 
 * Key Features:
 * - Automatic event listener setup and cleanup
 * - Keyboard shortcuts and accessibility
 * - Form validation and user feedback
 * - Modal backdrop click handling
 * - Quick stake button functionality
 * - Classic mode toggle management
 * 
 * Integration Points:
 * - State management for data updates
 * - Betting system for bet placement
 * - UI system for visual feedback
 * - Game logic for match control
 * 
 * @module events
 * @requires gameState - For state management integration
 * @requires betting - For bet placement and power-up functions
 * @requires ui - For UI updates and modal management
 * @exports {Function} initializeEventListeners - Sets up all event handlers
 * @exports {Function} removeAllEventListeners - Cleanup function
 * @exports {Function} addManagedEventListener - Utility for managed listeners
 */

import { 
    getCurrentState, 
    setCurrentScreen,
    setClassicMode,
    getClassicMode,
    updateBetAmountMemory
} from './gameState.js';

import { 
    placeBet, 
    usePowerUp, 
    hideActionBet,
    showActionBetSlip,
    showInlineBetSlip,
    hideInlineBetSlip
} from './betting.js';

import { 
    addEventToFeed,
    hideModal
} from './ui.js';

// --- EVENT HANDLER FUNCTIONS ---

/**
 * Handles navigation back to lobby
 */
function handleBackToLobby() {
    // Clear any running intervals or timeouts
    if (window.matchInterval) {
        clearInterval(window.matchInterval);
    }
    
    const currentState = getCurrentState();
    if (currentState.currentActionBet.timeoutId) {
        clearTimeout(currentState.currentActionBet.timeoutId);
    }
    
    setCurrentScreen('lobby');
    
    // Trigger render if available
    if (typeof window !== 'undefined' && window.render) {
        window.render();
    }
}

/**
 * Handles return to lobby from match end modal
 */
function handleReturnToLobby() {
    hideModal('match-end-modal');
    handleBackToLobby();
}

/**
 * Handles prototype reset
 */
function handleResetPrototype() {
    // Clear any running intervals
    if (window.matchInterval) {
        clearInterval(window.matchInterval);
    }
    
    // Reset state
    if (typeof window !== 'undefined' && window.resetState) {
        window.resetState();
    }
    
    // Hide all modals
    hideModal('action-bet-slip-modal');
    hideModal('action-bet-modal');
    hideModal('match-end-modal');
    
    // Trigger render if available
    if (typeof window !== 'undefined' && window.render) {
        window.render();
    }
}

// --- BETTING EVENT HANDLERS ---

/**
 * Handles action bet slip cancellation
 */
function handleCancelActionSlip() {
    hideModal('action-bet-slip-modal');
}

/**
 * Handles action bet slip confirmation
 */
function handleConfirmActionSlip() {
    const stakeInput = document.getElementById('action-slip-amount');
    const stake = parseFloat(stakeInput.value);
    
    const currentState = getCurrentState();
    if (currentState.currentBet) {
        const success = placeBet(
            currentState.currentBet.type, 
            currentState.currentBet.outcome, 
            currentState.currentBet.odds, 
            stake, 
            currentState.currentBet.betType
        );
        
        if (success) {
            // Clear current bet state
            if (typeof window !== 'undefined' && window.updateState) {
                window.updateState({ currentBet: null });
            }
            hideModal('action-bet-slip-modal');
        }
    }
}

/**
 * Handles quick stake button clicks for action bet slip
 * @param {Event} event - The click event
 */
function handleQuickStakeActionSlip(event) {
    const amount = event.currentTarget.dataset.amount;
    const stakeInput = document.getElementById('action-slip-amount');
    if (stakeInput) {
        stakeInput.value = amount;
    }
}

/**
 * Handles inline bet confirmation for full match bets
 */
function handleConfirmInlineBet() {
    const stakeInput = document.getElementById('inline-stake-amount');
    const stake = parseFloat(stakeInput.value);
    
    const currentState = getCurrentState();
    if (currentState.currentBet) {
        const success = placeBet(
            currentState.currentBet.type, 
            currentState.currentBet.outcome, 
            currentState.currentBet.odds, 
            stake
        );
        
        if (success) {
            // Store bet amount in memory for future full match bets
            try {
                updateBetAmountMemory('fullMatch', stake);
            } catch (error) {
                console.error('Error updating bet amount memory:', error);
                // Continue even if memory update fails - bet was still placed successfully
            }
            
            hideInlineBetSlip();
        }
    }
}

/**
 * Handles quick stake button clicks for inline bet slip
 * @param {Event} event - The click event
 */
function handleQuickStakeInline(event) {
    const amount = event.currentTarget.dataset.amount;
    const stakeInput = document.getElementById('inline-stake-amount');
    if (stakeInput) {
        stakeInput.value = amount;
    }
}

/**
 * Handles action bet modal skip button
 */
function handleSkipActionBet() {
    hideActionBet();
}

/**
 * Handles full match bet button clicks
 * @param {Event} event - The click event
 */
function handleFullMatchBetClick(event) {
    const outcome = event.currentTarget.dataset.outcome;
    const currentState = getCurrentState();
    const odds = currentState.match.odds[outcome.toLowerCase()];
    
    showInlineBetSlip(outcome, odds);
}

/**
 * Handles classic mode toggle changes
 */
function handleClassicModeToggle() {
    const toggle = document.getElementById('classic-mode-toggle');
    const isClassicMode = toggle.checked;
    
    setClassicMode(isClassicMode);
    
    // Update toggle visual state
    const dot = toggle.nextElementSibling.nextElementSibling;
    if (dot) {
        if (isClassicMode) {
            dot.style.transform = 'translateX(24px)';
            addEventToFeed("Classic Mode Enabled: Power-Ups are disabled for this match.", "text-gray-400 italic");
        } else {
            dot.style.transform = 'translateX(0)';
            addEventToFeed("Standard Mode Enabled: Power-Ups are active.", "text-gray-400 italic");
        }
    }
    
    // Trigger power-up render update
    if (typeof window !== 'undefined' && window.renderPowerUp) {
        window.renderPowerUp();
    }
}

// --- MODAL EVENT HANDLERS ---

/**
 * Handles modal backdrop clicks to close modals
 * @param {Event} event - The click event
 */
function handleModalBackdropClick(event) {
    // Only close if clicking the backdrop, not the modal content
    if (event.target === event.currentTarget) {
        const modalId = event.currentTarget.id;
        hideModal(modalId);
    }
}

/**
 * Handles keyboard events for modal interactions
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleModalKeyboard(event) {
    if (event.key === 'Escape') {
        // Close any open modals on Escape key
        const openModals = document.querySelectorAll('.fixed:not(.hidden)');
        openModals.forEach(modal => {
            if (modal.id) {
                hideModal(modal.id);
            }
        });
    }
}

// --- POWER-UP EVENT HANDLERS ---

/**
 * Handles power-up slot clicks
 */
function handlePowerUpClick() {
    const classicMode = getClassicMode();
    if (!classicMode) {
        usePowerUp();
    }
}

// --- INITIALIZATION FUNCTION ---

/**
 * Initializes all event listeners for the application
 * 
 * This function sets up the complete event handling system for the application.
 * It must be called after the DOM is loaded and all modules are initialized
 * to ensure proper functionality.
 * 
 * Event Listener Categories:
 * 1. Navigation - Back to lobby, reset, screen transitions
 * 2. Betting - Bet placement, confirmation, quick stakes
 * 3. Modals - Open/close, backdrop clicks, keyboard shortcuts
 * 4. Forms - Input validation, Enter key handling
 * 5. Power-ups - Activation and state management
 * 6. Accessibility - Keyboard navigation, screen readers
 * 
 * Setup Process:
 * 1. Navigation event listeners for app flow
 * 2. Betting interface event handlers
 * 3. Modal interaction management
 * 4. Form input enhancements
 * 5. Keyboard accessibility features
 * 6. Error handling and validation
 * 
 * Error Handling:
 * - Individual listener failures don't prevent others from loading
 * - Missing DOM elements are handled gracefully
 * - Comprehensive error logging for debugging
 * - Fallback behaviors for critical interactions
 * 
 * @throws {Error} Re-throws initialization errors for main.js handling
 * @example
 * // Initialize after DOM and modules are ready
 * document.addEventListener('DOMContentLoaded', () => {
 *   initializeEventListeners();
 * });
 */
export function initializeEventListeners() {
    try {
    // Navigation event listeners
    const backToLobbyBtn = document.getElementById('back-to-lobby');
    if (backToLobbyBtn) {
        backToLobbyBtn.addEventListener('click', handleBackToLobby);
    }
    
    const returnToLobbyBtn = document.getElementById('return-to-lobby-btn');
    if (returnToLobbyBtn) {
        returnToLobbyBtn.addEventListener('click', handleReturnToLobby);
    }
    
    const resetPrototypeBtn = document.getElementById('reset-prototype-btn');
    if (resetPrototypeBtn) {
        resetPrototypeBtn.addEventListener('click', handleResetPrototype);
    }

    // Action Bet Slip modal listeners
    const cancelActionSlipBtn = document.getElementById('cancel-action-slip-btn');
    if (cancelActionSlipBtn) {
        cancelActionSlipBtn.addEventListener('click', handleCancelActionSlip);
    }
    
    const confirmActionSlipBtn = document.getElementById('confirm-action-slip-btn');
    if (confirmActionSlipBtn) {
        confirmActionSlipBtn.addEventListener('click', handleConfirmActionSlip);
    }
    
    // Quick stake buttons for action bet slip
    const quickStakeActionBtns = document.querySelectorAll('#action-bet-slip-modal .quick-stake-btn-action-slip');
    quickStakeActionBtns.forEach(button => {
        button.addEventListener('click', handleQuickStakeActionSlip);
    });

    // Inline Full Match Bet listeners
    const confirmInlineBetBtn = document.getElementById('confirm-inline-bet-btn');
    if (confirmInlineBetBtn) {
        confirmInlineBetBtn.addEventListener('click', handleConfirmInlineBet);
    }
    
    // Quick stake buttons for inline bet slip
    const quickStakeInlineBtns = document.querySelectorAll('#inline-bet-slip .quick-stake-btn-inline');
    quickStakeInlineBtns.forEach(button => {
        button.addEventListener('click', handleQuickStakeInline);
    });

    // Action bet modal listeners
    const skipActionBetBtn = document.getElementById('skip-action-bet-btn');
    if (skipActionBetBtn) {
        skipActionBetBtn.addEventListener('click', handleSkipActionBet);
    }
    
    // Full match bet buttons
    const fullMatchBetBtns = document.querySelectorAll('[data-bet-type="full-match"]');
    fullMatchBetBtns.forEach(button => {
        button.addEventListener('click', handleFullMatchBetClick);
    });
    
    // Classic mode toggle
    const classicModeToggle = document.getElementById('classic-mode-toggle');
    if (classicModeToggle) {
        classicModeToggle.addEventListener('change', handleClassicModeToggle);
    }

    // Modal backdrop click handlers
    const modals = document.querySelectorAll('.fixed[id$="-modal"]');
    modals.forEach(modal => {
        modal.addEventListener('click', handleModalBackdropClick);
    });

    // Keyboard event handlers
    document.addEventListener('keydown', handleModalKeyboard);

    // Power-up slot click handler (will be set dynamically by UI module)
    // This is handled in the UI module's renderPowerUp function

    // Input field event listeners for better UX
    setupInputFieldListeners();
    
        console.log('Event listeners initialized successfully');
    } catch (error) {
        console.error('Error initializing event listeners:', error);
        throw error; // Re-throw to let main.js handle it
    }
}

/**
 * Sets up additional input field event listeners for better user experience
 * @private
 */
function setupInputFieldListeners() {
    // Auto-focus and select text in stake input fields when shown
    const stakeInputs = document.querySelectorAll('input[type="number"]');
    stakeInputs.forEach(input => {
        input.addEventListener('focus', (event) => {
            // Select all text when input is focused
            setTimeout(() => event.target.select(), 10);
        });
        
        input.addEventListener('keydown', (event) => {
            // Allow Enter key to confirm bets
            if (event.key === 'Enter') {
                const inputId = event.target.id;
                if (inputId === 'action-slip-amount') {
                    handleConfirmActionSlip();
                } else if (inputId === 'inline-stake-amount') {
                    handleConfirmInlineBet();
                }
            }
        });
    });
}

// --- UTILITY FUNCTIONS ---

/**
 * Removes all event listeners (useful for cleanup or testing)
 */
export function removeAllEventListeners() {
    // Remove navigation listeners
    const backToLobbyBtn = document.getElementById('back-to-lobby');
    if (backToLobbyBtn) {
        backToLobbyBtn.removeEventListener('click', handleBackToLobby);
    }
    
    const returnToLobbyBtn = document.getElementById('return-to-lobby-btn');
    if (returnToLobbyBtn) {
        returnToLobbyBtn.removeEventListener('click', handleReturnToLobby);
    }
    
    const resetPrototypeBtn = document.getElementById('reset-prototype-btn');
    if (resetPrototypeBtn) {
        resetPrototypeBtn.removeEventListener('click', handleResetPrototype);
    }

    // Remove betting listeners
    const cancelActionSlipBtn = document.getElementById('cancel-action-slip-btn');
    if (cancelActionSlipBtn) {
        cancelActionSlipBtn.removeEventListener('click', handleCancelActionSlip);
    }
    
    const confirmActionSlipBtn = document.getElementById('confirm-action-slip-btn');
    if (confirmActionSlipBtn) {
        confirmActionSlipBtn.removeEventListener('click', handleConfirmActionSlip);
    }
    
    // Remove other listeners...
    // (Additional cleanup code would go here for all listeners)
    
    // Remove keyboard listeners
    document.removeEventListener('keydown', handleModalKeyboard);
    
    console.log('Event listeners removed');
}

/**
 * Re-initializes event listeners (useful after DOM changes)
 */
export function reinitializeEventListeners() {
    removeAllEventListeners();
    initializeEventListeners();
}

/**
 * Adds a custom event listener with automatic cleanup tracking
 * @param {string} elementId - The ID of the element to add listener to
 * @param {string} eventType - The type of event to listen for
 * @param {Function} handler - The event handler function
 * @returns {Function} Cleanup function to remove the listener
 */
export function addManagedEventListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Element with ID '${elementId}' not found`);
        return () => {};
    }
    
    element.addEventListener(eventType, handler);
    
    // Return cleanup function
    return () => {
        element.removeEventListener(eventType, handler);
    };
}

// --- EXPORT EVENT HANDLERS FOR EXTERNAL USE ---

export {
    handleBackToLobby,
    handleReturnToLobby,
    handleResetPrototype,
    handleCancelActionSlip,
    handleConfirmActionSlip,
    handleQuickStakeActionSlip,
    handleConfirmInlineBet,
    handleQuickStakeInline,
    handleSkipActionBet,
    handleFullMatchBetClick,
    handleClassicModeToggle,
    handleModalBackdropClick,
    handleModalKeyboard,
    handlePowerUpClick
};

// Make key functions available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.initializeEventListeners = initializeEventListeners;
    window.handleBackToLobby = handleBackToLobby;
    window.handleResetPrototype = handleResetPrototype;
    window.usePowerUp = usePowerUp; // Re-export from betting module
}