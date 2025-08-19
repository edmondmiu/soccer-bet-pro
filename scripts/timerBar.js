/**
 * TimerBar Component
 * Provides visual countdown functionality with color-coded urgency states
 */
class TimerBar {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.timerBarElement = null;
        this.duration = 0;
        this.remaining = 0;
        this.startTime = 0;
        this.animationId = null;
        this.isRunning = false;
        
        // Color thresholds (as percentages)
        this.thresholds = {
            warning: 0.5,  // 50% remaining - yellow
            urgent: 0.25   // 25% remaining - red
        };
        
        // Callbacks
        this.onExpiredCallback = null;
        this.onUpdateCallback = null;
        
        this.init();
    }
    
    /**
     * Initialize the timer bar DOM structure with error handling
     */
    init() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                console.error(`TimerBar: Container with id '${this.containerId}' not found`);
                
                // Try to create a fallback container
                try {
                    this.container = document.createElement('div');
                    this.container.id = this.containerId;
                    this.container.className = 'timer-bar-fallback-container';
                    document.body.appendChild(this.container);
                    console.log('Created fallback timer bar container');
                } catch (fallbackError) {
                    console.error('Failed to create fallback container:', fallbackError);
                    return;
                }
            }
            
            // Create timer bar container with error handling
            try {
                const timerContainer = document.createElement('div');
                timerContainer.className = 'timer-bar-container';
                
                // Create the actual timer bar
                this.timerBarElement = document.createElement('div');
                this.timerBarElement.className = 'timer-bar timer-bar-normal';
                
                timerContainer.appendChild(this.timerBarElement);
                this.container.appendChild(timerContainer);
            } catch (creationError) {
                console.error('Error creating timer bar elements:', creationError);
                
                // Fallback: create simple text-based timer
                try {
                    this.timerBarElement = document.createElement('div');
                    this.timerBarElement.className = 'timer-bar-text-fallback';
                    this.timerBarElement.style.cssText = 'text-align: center; color: white; padding: 4px; background: rgba(0,0,0,0.5); border-radius: 4px;';
                    this.timerBarElement.textContent = 'Timer: --s';
                    this.container.appendChild(this.timerBarElement);
                    this.isTextMode = true;
                    console.log('Created text-based timer fallback');
                } catch (textFallbackError) {
                    console.error('Text fallback also failed:', textFallbackError);
                    this.timerBarElement = null;
                }
            }
        } catch (initError) {
            console.error('Critical error in TimerBar initialization:', initError);
            this.timerBarElement = null;
        }
    }
    
    /**
     * Start the timer countdown with error handling
     * @param {number} duration - Duration in milliseconds
     */
    start(duration) {
        try {
            if (!this.timerBarElement) {
                console.error('TimerBar: Timer bar element not initialized');
                return;
            }
            
            // Validate duration parameter
            if (typeof duration !== 'number' || duration <= 0) {
                console.error('TimerBar: Invalid duration:', duration);
                return;
            }
            
            this.duration = duration;
            this.remaining = duration;
            this.startTime = Date.now();
            this.isRunning = true;
            
            // Reset visual state with error handling
            try {
                if (this.isTextMode) {
                    this.timerBarElement.textContent = `Timer: ${Math.ceil(duration / 1000)}s`;
                } else {
                    this.timerBarElement.style.width = '100%';
                    this.setColorState('normal');
                }
            } catch (visualError) {
                console.error('Error setting initial visual state:', visualError);
                // Switch to text mode as fallback
                this.isTextMode = true;
                try {
                    this.timerBarElement.textContent = `Timer: ${Math.ceil(duration / 1000)}s`;
                } catch (textFallbackError) {
                    console.error('Text mode fallback also failed:', textFallbackError);
                }
            }
            
            // Start the update loop
            this.updateLoop();
        } catch (startError) {
            console.error('Error starting timer bar:', startError);
            // Try to continue with basic functionality
            this.isRunning = true;
            this.duration = duration;
            this.remaining = duration;
            this.startTime = Date.now();
        }
    }
    
    /**
     * Update the timer display with comprehensive error handling
     * @param {number} remaining - Remaining time in milliseconds
     * @param {number} total - Total duration in milliseconds
     */
    update(remaining, total) {
        try {
            if (!this.timerBarElement || !this.isRunning) return;
            
            // Validate parameters
            if (typeof remaining !== 'number' || typeof total !== 'number') {
                console.warn('TimerBar: Invalid update parameters:', { remaining, total });
                return;
            }
            
            this.remaining = Math.max(0, remaining);
            this.duration = total;
            
            const percentage = this.duration > 0 ? (this.remaining / this.duration) * 100 : 0;
            
            try {
                if (this.isTextMode) {
                    // Text mode update
                    const seconds = Math.ceil(this.remaining / 1000);
                    this.timerBarElement.textContent = `Timer: ${seconds}s`;
                    
                    // Update text color based on urgency
                    if (percentage <= 25) {
                        this.timerBarElement.style.color = '#ef4444'; // red
                    } else if (percentage <= 50) {
                        this.timerBarElement.style.color = '#f59e0b'; // yellow
                    } else {
                        this.timerBarElement.style.color = '#10b981'; // green
                    }
                } else {
                    // Visual bar mode update
                    try {
                        this.timerBarElement.style.width = `${percentage}%`;
                        this.updateColorState(percentage / 100);
                    } catch (visualUpdateError) {
                        console.warn('Visual update failed, switching to text mode:', visualUpdateError);
                        this.isTextMode = true;
                        const seconds = Math.ceil(this.remaining / 1000);
                        this.timerBarElement.textContent = `Timer: ${seconds}s`;
                    }
                }
            } catch (displayError) {
                console.error('Error updating timer display:', displayError);
                // Continue with basic functionality
            }
            
            // Trigger update callback with error handling
            try {
                if (this.onUpdateCallback) {
                    this.onUpdateCallback(this.remaining, this.duration);
                }
            } catch (callbackError) {
                console.error('Error in update callback:', callbackError);
                // Continue without callback
            }
            
            // Check if expired
            if (this.remaining <= 0) {
                this.handleExpiration();
            }
        } catch (updateError) {
            console.error('Critical error in timer update:', updateError);
            // Try to handle expiration if we can determine it
            try {
                if (remaining <= 0) {
                    this.handleExpiration();
                }
            } catch (expirationError) {
                console.error('Expiration handling also failed:', expirationError);
            }
        }
    }
    
    /**
     * Stop the timer
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Get remaining time in milliseconds
     * @returns {number} Remaining time
     */
    getRemaining() {
        return this.remaining;
    }
    
    /**
     * Set callback for timer expiration
     * @param {Function} callback - Function to call when timer expires
     */
    onExpired(callback) {
        this.onExpiredCallback = callback;
    }
    
    /**
     * Set callback for timer updates
     * @param {Function} callback - Function to call on each update
     */
    onUpdate(callback) {
        this.onUpdateCallback = callback;
    }
    
    /**
     * Internal update loop using requestAnimationFrame
     */
    updateLoop() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const elapsed = now - this.startTime;
        const remaining = Math.max(0, this.duration - elapsed);
        
        this.update(remaining, this.duration);
        
        if (this.isRunning && remaining > 0) {
            this.animationId = requestAnimationFrame(() => this.updateLoop());
        }
    }
    
    /**
     * Update color state based on remaining percentage
     * @param {number} percentage - Remaining time as percentage (0-1)
     */
    updateColorState(percentage) {
        if (percentage <= this.thresholds.urgent) {
            this.setColorState('urgent');
        } else if (percentage <= this.thresholds.warning) {
            this.setColorState('warning');
        } else {
            this.setColorState('normal');
        }
    }
    
    /**
     * Set the visual color state
     * @param {string} state - 'normal', 'warning', or 'urgent'
     */
    setColorState(state) {
        if (!this.timerBarElement) return;
        
        // Remove all color classes
        this.timerBarElement.classList.remove(
            'timer-bar-normal', 
            'timer-bar-warning', 
            'timer-bar-urgent',
            'timer-bar-urgent-enhanced'
        );
        
        // Add the appropriate class
        switch (state) {
            case 'warning':
                this.timerBarElement.classList.add('timer-bar-warning');
                break;
            case 'urgent':
                this.timerBarElement.classList.add('timer-bar-urgent', 'timer-bar-urgent-enhanced');
                break;
            default:
                this.timerBarElement.classList.add('timer-bar-normal');
        }
    }
    
    /**
     * Handle timer expiration
     */
    handleExpiration() {
        this.stop();
        if (this.onExpiredCallback) {
            this.onExpiredCallback();
        }
    }
    
    /**
     * Hide the timer bar
     */
    hide() {
        if (this.container) {
            const timerContainer = this.container.querySelector('.timer-bar-container');
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
        }
    }
    
    /**
     * Show the timer bar
     */
    show() {
        if (this.container) {
            const timerContainer = this.container.querySelector('.timer-bar-container');
            if (timerContainer) {
                timerContainer.style.display = 'block';
            }
        }
    }
    
    /**
     * Destroy the timer bar and clean up
     */
    destroy() {
        this.stop();
        if (this.container) {
            const timerContainer = this.container.querySelector('.timer-bar-container');
            if (timerContainer) {
                timerContainer.remove();
            }
        }
        this.container = null;
        this.timerBarElement = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerBar;
}