/**
 * PauseUI - Manages the user interface for game pause states
 * Handles displaying pause overlays, dimming effects, and pause-related messages
 */
class PauseUI {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.initializeOverlay();
    }

    /**
     * Initialize the pause overlay HTML structure
     * Creates the overlay element and appends it to the DOM
     * Enhanced with comprehensive error handling
     */
    initializeOverlay() {
        try {
            // Create the main overlay container with error handling
            this.overlay = document.createElement('div');
            if (!this.overlay) {
                throw new Error('Failed to create overlay element');
            }
            
            this.overlay.id = 'pause-overlay';
            this.overlay.className = 'pause-overlay hidden';
            
            // Set up the overlay HTML structure with validation
            try {
                this.overlay.innerHTML = `
                    <div class="pause-backdrop"></div>
                    <div class="pause-content">
                        <div class="pause-icon">⏸️</div>
                        <h2 class="pause-title">Game Paused</h2>
                        <p class="pause-reason">Betting in Progress</p>
                        <div class="pause-status">
                            <div class="pause-spinner"></div>
                            <p class="pause-waiting-text">Waiting for players...</p>
                        </div>
                    </div>
                `;
            } catch (htmlError) {
                console.error('PauseUI: Error setting overlay HTML', htmlError);
                // Fallback to simple structure
                this.overlay.innerHTML = '<div class="pause-backdrop"></div><div class="pause-content"><h2>Game Paused</h2></div>';
            }

            // Add CSS styles with error handling
            try {
                this.addStyles();
            } catch (styleError) {
                console.error('PauseUI: Error adding styles', styleError);
                // Continue without custom styles - browser defaults will apply
            }
            
            // Append to the app container with fallback
            try {
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    appContainer.appendChild(this.overlay);
                } else {
                    // Fallback to body
                    if (document.body) {
                        document.body.appendChild(this.overlay);
                    } else {
                        throw new Error('No suitable container found for overlay');
                    }
                }
            } catch (appendError) {
                console.error('PauseUI: Error appending overlay to DOM', appendError);
                // Try one more fallback
                try {
                    document.documentElement.appendChild(this.overlay);
                } catch (finalError) {
                    console.error('PauseUI: Critical error - cannot append overlay anywhere', finalError);
                    this.overlay = null; // Mark as failed
                }
            }
            
        } catch (error) {
            console.error('PauseUI: Critical error initializing overlay:', error);
            this.overlay = null;
            this.isVisible = false;
        }
    }

    /**
     * Add CSS styles for the pause overlay
     */
    addStyles() {
        const styleId = 'pause-ui-styles';
        
        // Check if styles already exist
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .pause-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .pause-overlay.visible {
                opacity: 1;
                visibility: visible;
            }

            .pause-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
            }

            .pause-content {
                position: relative;
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                border: 2px solid #4f46e5;
                border-radius: 16px;
                padding: 2rem;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                max-width: 320px;
                width: 90%;
                animation: slideInUp 0.4s ease-out;
            }

            .pause-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                animation: pulse 2s infinite;
            }

            .pause-title {
                color: #ffffff;
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }

            .pause-reason {
                color: #a78bfa;
                font-size: 1rem;
                font-weight: 500;
                margin-bottom: 1.5rem;
            }

            .pause-status {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
            }

            .pause-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #4f46e5;
                border-top: 2px solid #a78bfa;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .pause-waiting-text {
                color: #d1d5db;
                font-size: 0.875rem;
                margin: 0;
            }

            @keyframes slideInUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            /* Ensure overlay works on mobile */
            @media (max-width: 480px) {
                .pause-content {
                    padding: 1.5rem;
                    margin: 1rem;
                }
                
                .pause-icon {
                    font-size: 2.5rem;
                }
                
                .pause-title {
                    font-size: 1.25rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show the pause overlay with specified reason
     * Enhanced with comprehensive error handling and recovery
     * @param {string} reason - The reason for the pause (default: "Betting in Progress")
     * @param {string} message - Custom message to display (default: "Waiting for players...")
     */
    showPauseOverlay(reason = "Betting in Progress", message = "Waiting for players...") {
        try {
            // Validate inputs
            if (typeof reason !== 'string') {
                console.warn('PauseUI: Invalid reason parameter, using default', { reason });
                reason = "Betting in Progress";
            }
            
            if (typeof message !== 'string') {
                console.warn('PauseUI: Invalid message parameter, using default', { message });
                message = "Waiting for players...";
            }

            // Check if overlay is initialized
            if (!this.overlay) {
                console.error('PauseUI: Overlay not initialized, attempting to reinitialize');
                try {
                    this.initializeOverlay();
                    if (!this.overlay) {
                        throw new Error('Reinitialization failed');
                    }
                } catch (reinitError) {
                    console.error('PauseUI: Failed to reinitialize overlay', reinitError);
                    // Create minimal fallback overlay
                    this.createFallbackOverlay(reason, message);
                    return;
                }
            }

            // Update the content with error handling
            try {
                const reasonElement = this.overlay.querySelector('.pause-reason');
                const waitingTextElement = this.overlay.querySelector('.pause-waiting-text');
                
                if (reasonElement) {
                    reasonElement.textContent = reason;
                } else {
                    console.warn('PauseUI: Reason element not found in overlay');
                }
                
                if (waitingTextElement) {
                    waitingTextElement.textContent = message;
                } else {
                    console.warn('PauseUI: Waiting text element not found in overlay');
                }
            } catch (updateError) {
                console.error('PauseUI: Error updating overlay content', updateError);
                // Continue with showing overlay even if content update fails
            }

            // Show the overlay with error handling
            try {
                this.overlay.classList.remove('hidden');
                
                // Use requestAnimationFrame to ensure the transition works
                requestAnimationFrame(() => {
                    try {
                        if (this.overlay) {
                            this.overlay.classList.add('visible');
                        }
                    } catch (animationError) {
                        console.error('PauseUI: Error in animation frame callback', animationError);
                    }
                });
                
                this.isVisible = true;
            } catch (showError) {
                console.error('PauseUI: Error showing overlay', showError);
                this.isVisible = false;
                return;
            }
            
            // Dim game area with error handling
            try {
                this.dimGameArea();
            } catch (dimError) {
                console.error('PauseUI: Error dimming game area', dimError);
                // Continue without dimming
            }
            
        } catch (error) {
            console.error('PauseUI: Critical error showing pause overlay:', error);
            // Last resort: try to create a simple overlay
            this.createFallbackOverlay(reason, message);
        }
    }

    /**
     * Hide the pause overlay and restore normal display
     */
    hidePauseOverlay() {
        if (!this.overlay || !this.isVisible) {
            return;
        }

        // Start the hide animation
        this.overlay.classList.remove('visible');
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.classList.add('hidden');
            }
        }, 300);
        
        this.isVisible = false;
        this.restoreGameArea();
    }

    /**
     * Dim the game area to indicate inactive state
     */
    dimGameArea() {
        const matchScreen = document.getElementById('match-screen');
        if (matchScreen) {
            matchScreen.style.filter = 'brightness(0.3)';
            matchScreen.style.pointerEvents = 'none';
        }
    }

    /**
     * Restore the game area to normal brightness and interaction
     */
    restoreGameArea() {
        const matchScreen = document.getElementById('match-screen');
        if (matchScreen) {
            matchScreen.style.filter = '';
            matchScreen.style.pointerEvents = '';
        }
    }

    /**
     * Check if the pause overlay is currently visible
     * @returns {boolean} True if overlay is visible
     */
    isOverlayVisible() {
        return this.isVisible;
    }

    /**
     * Update the pause message without hiding/showing the overlay
     * @param {string} message - New message to display
     */
    updateMessage(message) {
        if (!this.overlay || !this.isVisible) {
            return;
        }

        const waitingTextElement = this.overlay.querySelector('.pause-waiting-text');
        if (waitingTextElement) {
            waitingTextElement.textContent = message;
        }
    }

    /**
     * Update the pause reason without hiding/showing the overlay
     * @param {string} reason - New reason to display
     */
    updateReason(reason) {
        if (!this.overlay || !this.isVisible) {
            return;
        }

        const reasonElement = this.overlay.querySelector('.pause-reason');
        if (reasonElement) {
            reasonElement.textContent = reason;
        }
    }

    /**
     * Show resume countdown before game resumes
     * @param {number} seconds - Number of seconds to countdown from (default: 3)
     * @param {Function} onComplete - Callback function to call when countdown completes
     * @returns {Promise} Promise that resolves when countdown completes
     */
    showResumeCountdown(seconds = 3, onComplete = null) {
        return new Promise((resolve) => {
            if (!this.overlay || !this.isVisible) {
                console.warn('PauseUI: Cannot show countdown - overlay not visible');
                if (onComplete) onComplete();
                resolve();
                return;
            }

            // Update the overlay content for countdown
            const reasonElement = this.overlay.querySelector('.pause-reason');
            const statusElement = this.overlay.querySelector('.pause-status');
            
            if (reasonElement) {
                reasonElement.textContent = 'Resuming Game';
            }

            // Create countdown display
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="countdown-display">
                        <div class="countdown-number">${seconds}</div>
                        <p class="countdown-text">Resuming in...</p>
                    </div>
                `;
            }

            // Add countdown-specific styles
            this.addCountdownStyles();

            let currentSeconds = seconds;
            const countdownInterval = setInterval(() => {
                currentSeconds--;
                
                const countdownNumber = this.overlay.querySelector('.countdown-number');
                if (countdownNumber) {
                    countdownNumber.textContent = currentSeconds;
                    
                    // Add animation class for visual feedback
                    countdownNumber.classList.add('countdown-tick');
                    setTimeout(() => {
                        if (countdownNumber) {
                            countdownNumber.classList.remove('countdown-tick');
                        }
                    }, 200);
                }

                // When countdown reaches 0, complete the countdown
                if (currentSeconds <= 0) {
                    clearInterval(countdownInterval);
                    
                    // Show "GO!" briefly before hiding
                    const countdownNumber = this.overlay.querySelector('.countdown-number');
                    const countdownText = this.overlay.querySelector('.countdown-text');
                    
                    if (countdownNumber && countdownText) {
                        countdownNumber.textContent = 'GO!';
                        countdownText.textContent = 'Game Resumed';
                        countdownNumber.classList.add('countdown-go');
                    }

                    // Complete countdown after brief "GO!" display
                    setTimeout(() => {
                        if (onComplete) onComplete();
                        resolve();
                    }, 500);
                }
            }, 1000);
        });
    }

    /**
     * Add CSS styles for countdown display
     */
    addCountdownStyles() {
        const styleId = 'countdown-styles';
        
        // Check if styles already exist
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .countdown-display {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .countdown-number {
                font-size: 3rem;
                font-weight: 900;
                color: #10b981;
                text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
                transition: all 0.2s ease;
                min-width: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .countdown-number.countdown-tick {
                transform: scale(1.2);
                color: #34d399;
                text-shadow: 0 0 30px rgba(52, 211, 153, 0.8);
            }

            .countdown-number.countdown-go {
                color: #f59e0b;
                text-shadow: 0 0 30px rgba(245, 158, 11, 0.8);
                transform: scale(1.3);
                animation: countdownGo 0.5s ease-out;
            }

            .countdown-text {
                color: #d1d5db;
                font-size: 1rem;
                font-weight: 500;
                margin: 0;
                text-align: center;
            }

            @keyframes countdownGo {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.4);
                }
                100% {
                    transform: scale(1.3);
                }
            }

            /* Mobile responsiveness for countdown */
            @media (max-width: 480px) {
                .countdown-number {
                    font-size: 2.5rem;
                    min-width: 70px;
                }
                
                .countdown-text {
                    font-size: 0.875rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show a timeout warning message
     * @param {string} message - Warning message to display
     * @param {number} duration - How long to show the warning (default: 3000ms)
     */
    showTimeoutWarning(message = 'Timeout - Resuming Game', duration = 3000) {
        // Create warning element if it doesn't exist
        let warningElement = document.getElementById('timeout-warning');
        
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'timeout-warning';
            warningElement.className = 'timeout-warning';
            
            // Add warning styles
            const warningStyles = `
                .timeout-warning {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
                    z-index: 1001;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                
                .timeout-warning.visible {
                    opacity: 1;
                }
                
                .timeout-warning::before {
                    content: '⚠️';
                    margin-right: 8px;
                }
            `;
            
            // Add styles if they don't exist
            if (!document.getElementById('timeout-warning-styles')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'timeout-warning-styles';
                styleElement.textContent = warningStyles;
                document.head.appendChild(styleElement);
            }
            
            document.body.appendChild(warningElement);
        }
        
        // Set message and show
        warningElement.textContent = message;
        warningElement.classList.add('visible');
        
        // Hide after duration
        setTimeout(() => {
            if (warningElement) {
                warningElement.classList.remove('visible');
                // Remove element after transition
                setTimeout(() => {
                    if (warningElement && warningElement.parentNode) {
                        warningElement.parentNode.removeChild(warningElement);
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Create a fallback overlay when main overlay fails
     * @param {string} reason - Pause reason
     * @param {string} message - Pause message
     */
    createFallbackOverlay(reason, message) {
        try {
            console.warn('PauseUI: Creating fallback overlay');
            
            // Remove any existing fallback
            const existingFallback = document.getElementById('pause-overlay-fallback');
            if (existingFallback) {
                existingFallback.remove();
            }
            
            // Create simple fallback overlay
            const fallbackOverlay = document.createElement('div');
            fallbackOverlay.id = 'pause-overlay-fallback';
            fallbackOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                color: white;
                font-family: Arial, sans-serif;
            `;
            
            fallbackOverlay.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #1f2937; border-radius: 8px; border: 2px solid #4f46e5;">
                    <h2 style="margin: 0 0 10px 0;">⏸️ Game Paused</h2>
                    <p style="margin: 0 0 10px 0;">${reason}</p>
                    <p style="margin: 0; opacity: 0.8; font-size: 14px;">${message}</p>
                </div>
            `;
            
            document.body.appendChild(fallbackOverlay);
            this.overlay = fallbackOverlay; // Use fallback as main overlay
            this.isVisible = true;
            
            // Try to dim game area
            this.dimGameArea();
            
        } catch (fallbackError) {
            console.error('PauseUI: Even fallback overlay creation failed', fallbackError);
            this.isVisible = false;
        }
    }

    /**
     * Hide the pause overlay and restore normal display
     * Enhanced with comprehensive error handling
     */
    hidePauseOverlay() {
        try {
            if (!this.overlay || !this.isVisible) {
                return;
            }

            // Start the hide animation with error handling
            try {
                this.overlay.classList.remove('visible');
            } catch (classError) {
                console.error('PauseUI: Error removing visible class', classError);
                // Try direct style manipulation
                try {
                    this.overlay.style.opacity = '0';
                    this.overlay.style.visibility = 'hidden';
                } catch (styleError) {
                    console.error('PauseUI: Error setting hide styles', styleError);
                }
            }
            
            // Wait for transition to complete before hiding
            setTimeout(() => {
                try {
                    if (this.overlay) {
                        if (this.overlay.classList) {
                            this.overlay.classList.add('hidden');
                        } else {
                            this.overlay.style.display = 'none';
                        }
                    }
                } catch (hideError) {
                    console.error('PauseUI: Error in hide timeout callback', hideError);
                }
            }, 300);
            
            this.isVisible = false;
            
            // Restore game area with error handling
            try {
                this.restoreGameArea();
            } catch (restoreError) {
                console.error('PauseUI: Error restoring game area', restoreError);
                // Continue without restoration
            }
            
        } catch (error) {
            console.error('PauseUI: Critical error hiding pause overlay:', error);
            // Force hide as fallback
            try {
                if (this.overlay) {
                    this.overlay.style.display = 'none';
                }
                this.isVisible = false;
                this.restoreGameArea();
            } catch (forceError) {
                console.error('PauseUI: Force hide also failed', forceError);
            }
        }
    }

    /**
     * Dim the game area to indicate inactive state
     * Enhanced with error handling
     */
    dimGameArea() {
        try {
            const matchScreen = document.getElementById('match-screen');
            if (matchScreen) {
                matchScreen.style.filter = 'brightness(0.3)';
                matchScreen.style.pointerEvents = 'none';
            } else {
                console.warn('PauseUI: Match screen element not found for dimming');
            }
        } catch (error) {
            console.error('PauseUI: Error dimming game area:', error);
        }
    }

    /**
     * Restore the game area to normal brightness and interaction
     * Enhanced with error handling
     */
    restoreGameArea() {
        try {
            const matchScreen = document.getElementById('match-screen');
            if (matchScreen) {
                matchScreen.style.filter = '';
                matchScreen.style.pointerEvents = '';
            } else {
                console.warn('PauseUI: Match screen element not found for restoration');
            }
        } catch (error) {
            console.error('PauseUI: Error restoring game area:', error);
        }
    }

    /**
     * Clean up the pause UI (remove from DOM)
     * Enhanced with comprehensive error handling
     */
    destroy() {
        try {
            // Remove main overlay
            if (this.overlay && this.overlay.parentNode) {
                try {
                    this.overlay.parentNode.removeChild(this.overlay);
                } catch (removeError) {
                    console.error('PauseUI: Error removing overlay from DOM', removeError);
                }
            }
            
            // Remove fallback overlay if it exists
            const fallbackOverlay = document.getElementById('pause-overlay-fallback');
            if (fallbackOverlay && fallbackOverlay.parentNode) {
                try {
                    fallbackOverlay.parentNode.removeChild(fallbackOverlay);
                } catch (fallbackRemoveError) {
                    console.error('PauseUI: Error removing fallback overlay', fallbackRemoveError);
                }
            }
            
            // Remove styles
            const styleElement = document.getElementById('pause-ui-styles');
            if (styleElement && styleElement.parentNode) {
                try {
                    styleElement.parentNode.removeChild(styleElement);
                } catch (styleRemoveError) {
                    console.error('PauseUI: Error removing styles', styleRemoveError);
                }
            }
            
            // Remove countdown styles
            const countdownStyles = document.getElementById('countdown-styles');
            if (countdownStyles && countdownStyles.parentNode) {
                try {
                    countdownStyles.parentNode.removeChild(countdownStyles);
                } catch (countdownRemoveError) {
                    console.error('PauseUI: Error removing countdown styles', countdownRemoveError);
                }
            }
            
            // Restore game area
            try {
                this.restoreGameArea();
            } catch (restoreError) {
                console.error('PauseUI: Error restoring game area during destroy', restoreError);
            }
            
            this.overlay = null;
            this.isVisible = false;
            
        } catch (error) {
            console.error('PauseUI: Critical error during destroy:', error);
            // Force cleanup
            this.overlay = null;
            this.isVisible = false;
        }
    }
}

// Export a default instance for convenience
export const pauseUI = new PauseUI();

// Also export the class for custom instances
export { PauseUI };