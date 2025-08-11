/**
 * Utility functions and constants for the Soccer Betting Game
 * Contains shared utilities, constants, and helper functions used across modules
 */

// --- CONSTANTS ---

/**
 * Mock match data for the game lobby
 * @type {Array<{home: string, away: string}>}
 */
export const MOCK_MATCHES = [
    { home: 'Quantum Strikers', away: 'Celestial FC' },
    { home: 'Nova United', away: 'Vortex Rovers' },
];

/**
 * Animation class constants for consistent styling
 * @type {Object}
 */
export const ANIMATION_CLASSES = {
    FADE_IN: 'animate-fade-in',
    SLIDE_IN_UP: 'animate-slide-in-up',
    POWER_UP_GLOW: 'power-up-glow',
    COUNTDOWN_BAR: 'countdown-bar-animate',
    BET_BTN_SELECTED: 'bet-btn-selected',
    FEED_ITEM_ENTER: 'feed-item-enter'
};

// --- UTILITY FUNCTIONS ---

/**
 * Formats a number as currency with $ symbol and 2 decimal places
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "$123.45")
 */
export function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
        return '$0.00';
    }
    return `$${amount.toFixed(2)}`;
}

/**
 * Formats time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (e.g., "05:30")
 */
export function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Formats match time for display (shows minutes with apostrophe)
 * @param {number} time - Time in minutes
 * @returns {string} Formatted match time (e.g., "45'")
 */
export function formatMatchTime(time) {
    if (typeof time !== 'number' || isNaN(time) || time < 0) {
        return "00'";
    }
    
    const minutes = Math.floor(time).toString().padStart(2, '0');
    return `${minutes}'`;
}

/**
 * Generates a unique ID string
 * @returns {string} Unique identifier
 */
/**
 * Generates a unique ID string using timestamp and random values
 * Uses base36 encoding for compact representation
 * @returns {string} Unique identifier combining timestamp and random string
 * @example
 * // Returns something like "l8x2kd9f3h"
 * const id = generateId();
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Validates if a stake amount is valid for betting
 * @param {number} stake - The stake amount to validate
 * @param {number} walletBalance - Current wallet balance
 * @returns {boolean} True if stake is valid
 */
export function validateStake(stake, walletBalance) {
    try {
        if (typeof stake !== 'number' || isNaN(stake)) {
            console.warn(`Invalid stake type or NaN: ${stake}`);
            return false;
        }
        
        if (typeof walletBalance !== 'number' || isNaN(walletBalance)) {
            console.warn(`Invalid wallet balance type or NaN: ${walletBalance}`);
            return false;
        }
        
        if (stake <= 0) {
            console.warn(`Stake must be positive: ${stake}`);
            return false;
        }
        
        if (stake > walletBalance) {
            console.warn(`Insufficient funds: stake ${stake} > balance ${walletBalance}`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating stake:', error);
        return false;
    }
}

/**
 * Calculates potential winnings for a bet
 * @param {number} stake - The bet stake amount
 * @param {number} odds - The betting odds
 * @returns {number} Potential winnings amount
 */
export function calculateWinnings(stake, odds) {
    if (!validateStake(stake, Infinity) || typeof odds !== 'number' || odds <= 0) {
        return 0;
    }
    return stake * odds;
}

/**
 * Clamps a number between min and max values
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Generates a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Formats odds for display with consistent decimal places
 * @param {number} odds - The odds value to format
 * @returns {string} Formatted odds string
 */
export function formatOdds(odds) {
    if (typeof odds !== 'number' || isNaN(odds)) {
        return '1.00';
    }
    return odds.toFixed(2);
}