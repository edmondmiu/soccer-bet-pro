/**
 * UI Rendering Module
 * 
 * This module manages all user interface rendering and DOM manipulation for the
 * Soccer Betting Game. It provides a reactive UI system that automatically updates
 * based on state changes through the observer pattern.
 * 
 * Architecture:
 * - Reactive rendering based on centralized state
 * - Modular rendering functions for different UI sections
 * - Performance optimization through DOM element caching
 * - Comprehensive error handling with graceful degradation
 * - Accessibility considerations and semantic HTML
 * 
 * Key Rendering Components:
 * 1. Screen Management - Lobby and match screen switching
 * 2. Match Display - Real-time score, time, and event updates
 * 3. Betting Interface - Odds display and bet placement UI
 * 4. Dashboard - Wallet, stakes, and potential winnings
 * 5. Event Feed - Live match commentary and notifications
 * 6. Power-up System - Visual power-up state and interactions
 * 7. Modal System - Betting slips and match end summaries
 * 
 * Performance Features:
 * - DOM element caching for faster updates
 * - Selective re-rendering to avoid unnecessary DOM manipulation
 * - Event feed pagination to prevent memory issues
 * - Efficient animation handling with CSS classes
 * 
 * Error Handling:
 * - Graceful degradation when DOM elements are missing
 * - Fallback rendering for critical errors
 * - User-friendly error messages
 * - Automatic recovery attempts
 * 
 * @module ui
 * @requires gameState - For reactive state-based rendering
 * @requires utils - For formatting and utility functions
 * @requires betting - For betting calculations and data
 * @exports {Function} render - Main rendering function
 * @exports {Function} initializeUI - UI system initialization
 * @exports {Function} addEventToFeed - Event feed management
 * @exports {Function} triggerWinAnimation - Celebration animations
 */

import { 
    getCurrentState, 
    subscribeToStateChanges,
    getCurrentScreen,
    getWalletBalance,
    getMatchState,
    getBettingState,
    getPowerUpState,
    getClassicMode
} from './gameState.js';

import { MOCK_MATCHES, formatCurrency, formatTime } from './utils.js';
import { calculatePotentialWinnings, getTotalStaked } from './betting.js';

// --- DOM ELEMENT REFERENCES ---

let domElements = {};

/**
 * Initializes DOM element references for better performance
 * 
 * This function implements a DOM element caching strategy to improve rendering
 * performance by avoiding repeated getElementById calls. Elements are cached
 * once during initialization and reused throughout the application lifecycle.
 * 
 * Performance Benefits:
 * - Eliminates repeated DOM queries during rendering
 * - Reduces browser reflow/repaint operations
 * - Improves responsiveness during frequent updates
 * - Centralizes DOM element management
 * 
 * Should be called after DOM is loaded but before any rendering operations.
 */
export function initializeDOMElements() {
    // Cache all frequently accessed DOM elements in a single object
    // This pattern significantly improves performance for real-time updates
    domElements = {
        // Screen elements - main application views
        lobbyScreen: document.getElementById('lobby-screen'),
        matchScreen: document.getElementById('match-screen'),
        
        // Lobby elements - match selection and wallet display
        matchList: document.getElementById('match-list'),
        lobbyWalletBalance: document.getElementById('lobby-wallet-balance'),
        
        // Match screen elements - live match display components
        matchTeams: document.getElementById('match-teams'),
        matchTimer: document.getElementById('match-timer'),
        matchScore: document.getElementById('match-score'),
        eventFeed: document.getElementById('event-feed'),
        
        // Dashboard elements - player statistics and betting info
        totalStaked: document.getElementById('total-staked'),
        matchWalletBalance: document.getElementById('match-wallet-balance'),
        potentialWin: document.getElementById('potential-win'),
        
        // Bet history - displays active and completed bets
        betHistoryList: document.getElementById('bet-history-list'),
        
        // Power-up elements - power-up display and interaction
        powerUpSlot: document.getElementById('power-up-slot'),
        
        // Betting elements - bet placement interface
        inlineBetSlip: document.getElementById('inline-bet-slip'),
        inlineStakeAmount: document.getElementById('inline-stake-amount'),
        
        // Modal elements - overlay dialogs for betting and results
        actionBetSlipModal: document.getElementById('action-bet-slip-modal'),
        actionBetModal: document.getElementById('action-bet-modal'),
        matchEndModal: document.getElementById('match-end-modal'),
        
        // Animation container - for celebration effects
        confettiContainer: document.getElementById('confetti-container')
    };
}

// --- MAIN RENDERING FUNCTIONS ---

/**
 * Main render function that orchestrates complete UI updates
 * 
 * This is the central rendering function that coordinates all UI updates based on
 * the current application state. It implements a top-down rendering approach
 * with comprehensive error handling and recovery mechanisms.
 * 
 * Rendering Flow:
 * 1. Validates current state and screen
 * 2. Toggles screen visibility (lobby vs match)
 * 3. Calls appropriate screen-specific render functions
 * 4. Handles errors with fallback rendering
 * 5. Provides user feedback for critical failures
 * 
 * Error Recovery Strategy:
 * - Individual render failures don't crash the entire UI
 * - Fallback rendering for missing DOM elements
 * - User-friendly error states for critical failures
 * - Automatic retry mechanisms where appropriate
 * 
 * Performance Considerations:
 * - Only re-renders changed sections when possible
 * - Caches DOM elements to avoid repeated queries
 * - Batches DOM updates to minimize reflow/repaint
 * 
 * @throws {Error} Logs errors but provides fallback rendering
 * @see renderLobby For lobby screen rendering
 * @see renderMatchScreen For match screen rendering
 * @example
 * // Trigger a complete UI update
 * render();
 * // This will update all visible UI elements based on current state
 */
export function render() {
    try {
        const state = getCurrentState();
        const currentScreen = getCurrentScreen();
        
        if (!state || !currentScreen) {
            console.error('Invalid state or screen for rendering');
            return;
        }
        
        // Toggle screen visibility with error handling
        try {
            if (domElements.lobbyScreen && domElements.matchScreen) {
                domElements.lobbyScreen.classList.toggle('hidden', currentScreen !== 'lobby');
                domElements.matchScreen.classList.toggle('hidden', currentScreen !== 'match');
            } else {
                console.warn('Screen elements not found, attempting to find them');
                initializeDOMElements();
                if (domElements.lobbyScreen && domElements.matchScreen) {
                    domElements.lobbyScreen.classList.toggle('hidden', currentScreen !== 'lobby');
                    domElements.matchScreen.classList.toggle('hidden', currentScreen !== 'match');
                }
            }
        } catch (screenError) {
            console.error('Error toggling screen visibility:', screenError);
        }
        
        // Render appropriate screen with error handling
        try {
            if (currentScreen === 'lobby') {
                renderLobby();
            } else if (currentScreen === 'match') {
                renderMatchScreen();
            } else {
                console.warn(`Unknown screen: ${currentScreen}`);
            }
        } catch (renderError) {
            console.error(`Error rendering ${currentScreen} screen:`, renderError);
            // Attempt fallback render
            try {
                renderFallbackUI();
            } catch (fallbackError) {
                console.error('Fallback render also failed:', fallbackError);
            }
        }
    } catch (error) {
        console.error('Critical error in main render function:', error);
        renderErrorState();
    }
}

/**
 * Renders the lobby screen with available matches and wallet balance
 */
export function renderLobby() {
    const walletBalance = getWalletBalance();
    
    // Render match list
    if (domElements.matchList) {
        domElements.matchList.innerHTML = '';
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
            matchCard.onclick = () => {
                // Trigger match start through game logic module
                if (window.startGame) {
                    window.startGame(match);
                }
            };
            domElements.matchList.appendChild(matchCard);
        });
    }
    
    // Update wallet balance display
    if (domElements.lobbyWalletBalance) {
        domElements.lobbyWalletBalance.textContent = formatCurrency(walletBalance);
    }
}

/**
 * Renders the match screen with all match-related UI components
 */
export function renderMatchScreen() {
    const matchState = getMatchState();
    
    // Update team names
    if (domElements.matchTeams) {
        domElements.matchTeams.textContent = `${matchState.homeTeam} vs ${matchState.awayTeam}`;
    }
    
    // Render all match screen components
    renderMatchTimeAndScore();
    renderDashboard();
    renderPowerUp();
    renderOdds();
    renderBetHistory();
}

/**
 * Renders the match time and current score
 */
export function renderMatchTimeAndScore() {
    const matchState = getMatchState();
    
    // Update match timer
    if (domElements.matchTimer) {
        const minutes = Math.floor(matchState.time).toString().padStart(2, '0');
        domElements.matchTimer.textContent = `${minutes}'`;
    }
    
    // Update match score
    if (domElements.matchScore) {
        domElements.matchScore.textContent = `${matchState.homeScore} - ${matchState.awayScore}`;
    }
}

/**
 * Renders the player dashboard with wallet, stakes, and potential winnings
 */
export function renderDashboard() {
    const walletBalance = getWalletBalance();
    const totalStaked = getTotalStaked();
    const potentialWin = calculatePotentialWinnings();
    
    // Update dashboard values
    if (domElements.totalStaked) {
        domElements.totalStaked.textContent = formatCurrency(totalStaked);
    }
    
    if (domElements.potentialWin) {
        domElements.potentialWin.textContent = formatCurrency(potentialWin);
    }
    
    if (domElements.matchWalletBalance) {
        domElements.matchWalletBalance.textContent = formatCurrency(walletBalance);
    }
}

/**
 * Renders the power-up slot with current power-up state
 */
export function renderPowerUp() {
    const powerUpState = getPowerUpState();
    const classicMode = getClassicMode();
    
    if (!domElements.powerUpSlot) return;
    
    if (classicMode) {
        // Classic mode - power-ups disabled
        domElements.powerUpSlot.innerHTML = `<span>Power-Ups Disabled</span>`;
        domElements.powerUpSlot.className = 'w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-600 cursor-not-allowed';
        domElements.powerUpSlot.classList.remove('power-up-glow');
        domElements.powerUpSlot.onclick = null;
    } else if (powerUpState.held) {
        // Power-up available
        domElements.powerUpSlot.innerHTML = `<span class="font-bold text-yellow-300">⚡ 2x WINNINGS ⚡</span>`;
        domElements.powerUpSlot.className = 'w-full h-12 bg-indigo-600 border-2 border-yellow-400 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300';
        domElements.powerUpSlot.classList.add('power-up-glow');
        domElements.powerUpSlot.onclick = () => {
            if (window.usePowerUp) {
                window.usePowerUp();
            }
        };
    } else {
        // Empty slot
        domElements.powerUpSlot.innerHTML = `<span>Empty Slot</span>`;
        domElements.powerUpSlot.className = 'w-full h-12 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center text-gray-500 transition-all duration-300';
        domElements.powerUpSlot.classList.remove('power-up-glow');
        domElements.powerUpSlot.onclick = null;
    }
}

/**
 * Renders the current betting odds for full match bets
 */
export function renderOdds() {
    const matchState = getMatchState();
    
    // Update odds display on betting buttons
    const homeOddsElement = document.querySelector('#full-match-btn-HOME .odds-display');
    const drawOddsElement = document.querySelector('#full-match-btn-DRAW .odds-display');
    const awayOddsElement = document.querySelector('#full-match-btn-AWAY .odds-display');
    
    if (homeOddsElement) {
        homeOddsElement.textContent = `Odds: ${matchState.odds.home.toFixed(2)}`;
    }
    if (drawOddsElement) {
        drawOddsElement.textContent = `Odds: ${matchState.odds.draw.toFixed(2)}`;
    }
    if (awayOddsElement) {
        awayOddsElement.textContent = `Odds: ${matchState.odds.away.toFixed(2)}`;
    }
}

/**
 * Renders the bet history showing active and completed bets
 */
export function renderBetHistory() {
    const bettingState = getBettingState();
    
    if (!domElements.betHistoryList) return;
    
    domElements.betHistoryList.innerHTML = '';
    
    const allBets = [...bettingState.fullMatch, ...bettingState.actionBets];
    
    if (allBets.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-gray-500 text-center';
        emptyMessage.textContent = 'No bets placed yet.';
        domElements.betHistoryList.appendChild(emptyMessage);
        return;
    }
    
    allBets.forEach(bet => {
        const betItem = document.createElement('div');
        betItem.className = 'bg-gray-700 p-2 rounded text-sm';
        
        let betDescription;
        if (bet.outcome) {
            // Full match bet
            betDescription = `${bet.outcome} @ ${bet.odds.toFixed(2)}`;
        } else {
            // Action bet
            betDescription = bet.description;
        }
        
        let statusClass = 'text-yellow-400';
        let statusText = 'PENDING';
        
        if (bet.status === 'WON') {
            statusClass = 'text-green-400';
            statusText = 'WON';
        } else if (bet.status === 'LOST') {
            statusClass = 'text-red-400';
            statusText = 'LOST';
        }
        
        betItem.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-white">${betDescription}</span>
                <span class="${statusClass} font-semibold">${statusText}</span>
            </div>
            <div class="text-gray-400 text-xs">Stake: ${formatCurrency(bet.stake)}</div>
        `;
        
        domElements.betHistoryList.appendChild(betItem);
    });
}

/**
 * Renders the match end summary with bet results
 * @param {string} finalOutcome - The final match outcome ('HOME', 'AWAY', or 'DRAW')
 */
export function renderEndGameSummary(finalOutcome) {
    const summaryContainer = document.getElementById('match-end-bet-summary');
    if (!summaryContainer) return;
    
    const bettingState = getBettingState();
    summaryContainer.innerHTML = '';
    
    const allBets = [...bettingState.fullMatch, ...bettingState.actionBets];
    
    if (allBets.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-gray-500 text-center';
        emptyMessage.textContent = 'No bets were placed.';
        summaryContainer.appendChild(emptyMessage);
        return;
    }
    
    allBets.forEach(bet => {
        const betSummary = document.createElement('div');
        betSummary.className = 'flex justify-between items-center py-1 border-b border-gray-700 last:border-b-0';
        
        let betDescription;
        let betType;
        if (bet.outcome) {
            // Full match bet
            betDescription = `${bet.outcome} @ ${bet.odds.toFixed(2)}`;
            betType = 'Full Match';
        } else {
            // Action bet
            betDescription = bet.description;
            betType = 'Action Bet';
        }
        
        let statusClass = 'text-yellow-400';
        let statusText = 'PENDING';
        let winnings = 0;
        
        if (bet.status === 'WON') {
            statusClass = 'text-green-400';
            statusText = 'WON';
            winnings = bet.stake * bet.odds;
        } else if (bet.status === 'LOST') {
            statusClass = 'text-red-400';
            statusText = 'LOST';
        }
        
        betSummary.innerHTML = `
            <div>
                <div class="text-white text-sm">${betType}</div>
                <div class="text-gray-400 text-xs">${betDescription}</div>
                <div class="text-gray-400 text-xs">Stake: ${formatCurrency(bet.stake)}</div>
            </div>
            <div class="text-right">
                <div class="${statusClass} font-semibold text-sm">${statusText}</div>
                ${winnings > 0 ? `<div class="text-green-400 text-xs">+${formatCurrency(winnings)}</div>` : ''}
            </div>
        `;
        
        summaryContainer.appendChild(betSummary);
    });
}

// --- UI HELPER FUNCTIONS ---

/**
 * Adds an event message to the match event feed with rich formatting
 * 
 * This function manages the live event feed that provides real-time updates
 * during matches. It handles message formatting, timestamps, animations,
 * and feed management to create an engaging user experience.
 * 
 * Features:
 * - Automatic timestamp generation for each event
 * - XSS protection through text sanitization
 * - Smooth entrance animations for new events
 * - Automatic feed pagination (max 20 items)
 * - Auto-scroll to show latest events
 * - Comprehensive error handling with fallbacks
 * 
 * Message Types:
 * - Match events (goals, fouls, commentary)
 * - Betting notifications (wins, losses, power-ups)
 * - System messages (errors, warnings, info)
 * - User actions (bet placements, power-up usage)
 * 
 * Styling System:
 * - Default styling for standard events
 * - Custom CSS classes for special message types
 * - Color coding for different event categories
 * - Responsive design for various screen sizes
 * 
 * @param {string} text - The event message text to display
 * @param {string} [customClass=''] - Optional CSS class for custom styling
 * @throws {Error} Logs errors but provides fallback rendering
 * @example
 * // Add a standard match event
 * addEventToFeed('GOAL! Amazing strike from outside the box!');
 * 
 * // Add a success message with custom styling
 * addEventToFeed('Bet won! You earned $25.00', 'text-green-400 font-bold');
 * 
 * // Add an error message
 * addEventToFeed('Insufficient funds for bet', 'text-red-400');
 */
export function addEventToFeed(text, customClass = '') {
    try {
        if (!text || typeof text !== 'string') {
            console.warn('Invalid text for event feed:', text);
            return;
        }
        
        // Ensure DOM elements are initialized
        if (!domElements.eventFeed) {
            const eventFeed = document.getElementById('event-feed');
            if (eventFeed) {
                domElements.eventFeed = eventFeed;
            } else {
                console.warn('Event feed element not found');
                return;
            }
        }
        
        const item = document.createElement('div');
        item.className = `p-3 bg-gray-700 rounded-lg shadow-sm border-l-4 border-indigo-500 feed-item-enter ${customClass || ''}`;
        
        // Add timestamp with error handling
        let timestamp = '';
        try {
            const now = new Date();
            timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch (timeError) {
            console.warn('Error generating timestamp:', timeError);
            timestamp = 'N/A';
        }
        
        // Sanitize text to prevent XSS
        const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-gray-200 flex-1">${sanitizedText}</span>
                <span class="text-xs text-gray-500 ml-2">${timestamp}</span>
            </div>
        `;
        
        // Add to top of feed with error handling
        try {
            domElements.eventFeed.insertBefore(item, domElements.eventFeed.firstChild);
        } catch (insertError) {
            console.error('Error inserting event to feed:', insertError);
            domElements.eventFeed.appendChild(item); // Fallback to append
        }
        
        // Trigger entrance animation with error handling
        try {
            setTimeout(() => {
                if (item && item.classList) {
                    item.classList.remove('feed-item-enter');
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }
            }, 10);
        } catch (animationError) {
            console.warn('Error with feed animation:', animationError);
        }
        
        // Limit feed to 20 items for performance
        try {
            const feedItems = domElements.eventFeed.children;
            if (feedItems.length > 20) {
                domElements.eventFeed.removeChild(feedItems[feedItems.length - 1]);
            }
        } catch (cleanupError) {
            console.warn('Error cleaning up old feed items:', cleanupError);
        }
        
        // Auto-scroll to show new events
        try {
            domElements.eventFeed.scrollTop = 0;
        } catch (scrollError) {
            console.warn('Error scrolling event feed:', scrollError);
        }
    } catch (error) {
        console.error('Error adding event to feed:', error);
        // Fallback: try to add a simple message
        try {
            const eventFeed = document.getElementById('event-feed');
            if (eventFeed) {
                const fallbackItem = document.createElement('div');
                fallbackItem.textContent = text || 'Event occurred';
                fallbackItem.className = 'p-2 bg-gray-800 text-gray-300 rounded';
                eventFeed.insertBefore(fallbackItem, eventFeed.firstChild);
            }
        } catch (fallbackError) {
            console.error('Fallback event feed also failed:', fallbackError);
        }
    }
}

/**
 * Shows a modal by removing the 'hidden' class
 * @param {string} modalId - The ID of the modal element to show
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
    }
}

/**
 * Hides a modal by adding the 'hidden' class
 * @param {string} modalId - The ID of the modal element to hide
 */
export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('animate-fade-in');
    }
}

// --- ANIMATION FUNCTIONS ---

/**
 * Triggers a celebratory confetti animation for winning scenarios
 * 
 * This function creates a visually appealing celebration animation when players
 * have profitable matches. It generates multiple animated confetti particles
 * with randomized properties for a dynamic, engaging effect.
 * 
 * Animation Features:
 * - 50 individual confetti particles with unique properties
 * - Random positioning across the screen width
 * - Varied colors from a curated palette
 * - Staggered animation delays for natural movement
 * - Different animation durations for organic feel
 * - Automatic cleanup after animation completes
 * 
 * Technical Implementation:
 * - Uses CSS animations for smooth performance
 * - Dynamically creates DOM elements for particles
 * - Randomized properties for each particle
 * - Memory-efficient cleanup with setTimeout
 * - Graceful handling of missing container elements
 * 
 * Performance Considerations:
 * - Limited to 50 particles to maintain smooth animation
 * - Automatic cleanup prevents memory leaks
 * - CSS-based animations for hardware acceleration
 * - Non-blocking execution doesn't interfere with game logic
 * 
 * @example
 * // Trigger confetti when player wins money
 * if (finalWallet > initialWallet) {
 *   triggerWinAnimation();
 * }
 */
export function triggerWinAnimation() {
    if (!domElements.confettiContainer) return;
    
    // Clear any existing confetti
    domElements.confettiContainer.innerHTML = '';
    
    // Create 50 confetti particles
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random positioning and colors
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = getRandomConfettiColor();
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        domElements.confettiContainer.appendChild(confetti);
    }
    
    // Clean up confetti after animation
    setTimeout(() => {
        if (domElements.confettiContainer) {
            domElements.confettiContainer.innerHTML = '';
        }
    }, 6000);
}

/**
 * Gets a random color for confetti particles
 * @returns {string} A random hex color
 * @private
 */
function getRandomConfettiColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// --- INITIALIZATION AND STATE SUBSCRIPTION ---

/**
 * Initializes the UI module and sets up state change subscriptions
 * Should be called after DOM is loaded
 */
export function initializeUI() {
    initializeDOMElements();
    
    // Subscribe to state changes for automatic UI updates
    subscribeToStateChanges((newState) => {
        // Only re-render if we're on a screen that needs updates
        const currentScreen = getCurrentScreen();
        if (currentScreen === 'lobby' || currentScreen === 'match') {
            render();
        }
    });
    
    // Initial render
    render();
}

// --- UTILITY FUNCTIONS FOR EXTERNAL ACCESS ---

/**
 * Updates a specific UI element without full re-render
 * @param {string} elementId - The ID of the element to update
 * @param {string} content - The new content for the element
 * @param {string} property - The property to update ('textContent', 'innerHTML', etc.)
 */
export function updateElement(elementId, content, property = 'textContent') {
    const element = document.getElementById(elementId);
    if (element && element[property] !== undefined) {
        element[property] = content;
    }
}

/**
 * Toggles a CSS class on an element
 * @param {string} elementId - The ID of the element
 * @param {string} className - The CSS class to toggle
 * @param {boolean} force - Optional force parameter for classList.toggle
 */
export function toggleElementClass(elementId, className, force = undefined) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle(className, force);
    }
}

/**
 * Gets the current DOM elements object (for debugging or external access)
 * @returns {Object} The domElements object
 */
export function getDOMElements() {
    return domElements;
}

/**
 * Renders a fallback UI when normal rendering fails
 * @private
 */
function renderFallbackUI() {
    try {
        const appContainer = document.getElementById('app-container') || document.body;
        if (appContainer) {
            const fallbackMessage = document.createElement('div');
            fallbackMessage.className = 'flex items-center justify-center min-h-screen p-4';
            fallbackMessage.innerHTML = `
                <div class="bg-yellow-900 border border-yellow-700 rounded-lg p-6 max-w-md text-center">
                    <h2 class="text-2xl font-bold text-yellow-300 mb-4">⚠️ Rendering Issue</h2>
                    <p class="text-yellow-200 mb-4">
                        The UI encountered an issue while rendering. Some features may not work properly.
                    </p>
                    <button onclick="window.location.reload()" 
                            class="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-white font-semibold transition">
                        Refresh Page
                    </button>
                </div>
            `;
            appContainer.appendChild(fallbackMessage);
        }
    } catch (error) {
        console.error('Failed to render fallback UI:', error);
    }
}

/**
 * Renders an error state when critical errors occur
 * @private
 */
function renderErrorState() {
    try {
        const appContainer = document.getElementById('app-container') || document.body;
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md text-center">
                        <h2 class="text-2xl font-bold text-red-300 mb-4">❌ Critical Error</h2>
                        <p class="text-red-200 mb-4">
                            The application encountered a critical error and cannot continue. Please refresh the page.
                        </p>
                        <button onclick="window.location.reload()" 
                                class="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white font-semibold transition">
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to render error state:', error);
        // Last resort: alert
        alert('Critical application error. Please refresh the page.');
    }
}

// Make key functions available globally for backward compatibility
// This allows existing event handlers to work during the transition
if (typeof window !== 'undefined') {
    window.render = render;
    window.renderLobby = renderLobby;
    window.renderMatchScreen = renderMatchScreen;
    window.renderMatchTimeAndScore = renderMatchTimeAndScore;
    window.renderDashboard = renderDashboard;
    window.renderPowerUp = renderPowerUp;
    window.renderOdds = renderOdds;
    window.renderBetHistory = renderBetHistory;
    window.renderEndGameSummary = renderEndGameSummary;
    window.addEventToFeed = addEventToFeed;
    window.showModal = showModal;
    window.hideModal = hideModal;
    window.triggerWinAnimation = triggerWinAnimation;
}