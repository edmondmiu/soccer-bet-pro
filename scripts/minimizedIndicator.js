/**
 * MinimizedIndicator - Floating notification component for minimized betting modals
 * Provides visual feedback and time remaining display when betting modal is minimized
 */
class MinimizedIndicator {
    constructor() {
        this.element = null;
        this.timeElement = null;
        this.eventTypeElement = null;
        this.isVisible = false;
        this.timeRemaining = 0;
        this.eventType = '';
        this.onClickCallback = null;
        this.urgentThreshold = 5; // seconds
        this.isUrgent = false;
        
        this.createIndicatorElement();
    }

    /**
     * Creates the DOM element for the minimized indicator with error handling
     */
    createIndicatorElement() {
        try {
            // Create main indicator container
            this.element = document.createElement('div');
            this.element.className = 'minimized-indicator minimized-indicator-hover';
            this.element.style.display = 'none';
            this.element.setAttribute('role', 'button');
            this.element.setAttribute('tabindex', '0');
            this.element.setAttribute('aria-label', 'Minimized betting modal - click to restore');

            // Create event type display with error handling
            try {
                this.eventTypeElement = document.createElement('div');
                this.eventTypeElement.className = 'indicator-event-type';
            } catch (eventTypeError) {
                console.error('Error creating event type element:', eventTypeError);
                this.eventTypeElement = null;
            }

            // Create time display with error handling
            try {
                this.timeElement = document.createElement('div');
                this.timeElement.className = 'indicator-time';
                this.timeElement.setAttribute('aria-live', 'polite');
            } catch (timeElementError) {
                console.error('Error creating time element:', timeElementError);
                this.timeElement = null;
            }

            // Append child elements with error handling
            try {
                if (this.eventTypeElement) {
                    this.element.appendChild(this.eventTypeElement);
                }
                if (this.timeElement) {
                    this.element.appendChild(this.timeElement);
                }
                
                // Fallback: if no child elements, create simple text content
                if (!this.eventTypeElement && !this.timeElement) {
                    this.element.textContent = 'Betting Opportunity';
                    this.isFallbackMode = true;
                }
            } catch (appendError) {
                console.error('Error appending child elements:', appendError);
                this.element.textContent = 'Betting Opportunity';
                this.isFallbackMode = true;
            }

            // Add click handler with error handling
            try {
                this.element.addEventListener('click', () => {
                    try {
                        if (this.onClickCallback) {
                            this.onClickCallback();
                        }
                    } catch (clickError) {
                        console.error('Error in click callback:', clickError);
                    }
                });
            } catch (clickHandlerError) {
                console.error('Error adding click handler:', clickHandlerError);
            }

            // Add keyboard support with error handling
            try {
                this.element.addEventListener('keydown', (e) => {
                    try {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (this.onClickCallback) {
                                this.onClickCallback();
                            }
                        }
                    } catch (keyError) {
                        console.error('Error in keyboard handler:', keyError);
                    }
                });
            } catch (keyHandlerError) {
                console.error('Error adding keyboard handler:', keyHandlerError);
            }

            // Add to document body with error handling
            try {
                if (document.body) {
                    document.body.appendChild(this.element);
                } else {
                    console.error('Document body not available, cannot append indicator');
                    // Try to append to document.documentElement as fallback
                    if (document.documentElement) {
                        document.documentElement.appendChild(this.element);
                        console.log('Appended indicator to document element as fallback');
                    }
                }
            } catch (appendToBodyError) {
                console.error('Error appending indicator to document:', appendToBodyError);
                // Store element for later insertion
                this.pendingElement = this.element;
            }
        } catch (creationError) {
            console.error('Critical error creating minimized indicator:', creationError);
            
            // Create absolute minimal fallback
            try {
                this.element = document.createElement('div');
                this.element.textContent = 'Bet';
                this.element.style.cssText = 'position: fixed; top: 20px; right: 20px; background: blue; color: white; padding: 8px; cursor: pointer; z-index: 1000; display: none;';
                this.element.onclick = () => {
                    try {
                        if (this.onClickCallback) {
                            this.onClickCallback();
                        }
                    } catch (fallbackClickError) {
                        console.error('Error in fallback click handler:', fallbackClickError);
                    }
                };
                
                if (document.body) {
                    document.body.appendChild(this.element);
                }
                
                this.isFallbackMode = true;
                console.log('Created minimal fallback indicator');
            } catch (fallbackError) {
                console.error('Even fallback indicator creation failed:', fallbackError);
                this.element = null;
            }
        }
    }

    /**
     * Shows the minimized indicator with event type and time remaining
     * @param {string} eventType - Type of betting event (e.g., "CORNER_OUTCOME")
     * @param {number} timeRemaining - Time remaining in seconds
     */
    show(eventType, timeRemaining) {
        try {
            if (!this.element) {
                console.error('MinimizedIndicator: Element not available, cannot show');
                return;
            }

            // Validate parameters
            if (typeof eventType !== 'string' || typeof timeRemaining !== 'number') {
                console.error('MinimizedIndicator: Invalid parameters:', { eventType, timeRemaining });
                return;
            }

            this.eventType = eventType;
            this.timeRemaining = timeRemaining;
            this.isVisible = true;

            // Update content with error handling
            try {
                if (this.isFallbackMode) {
                    // Simple text update for fallback mode
                    const formattedType = this.formatEventType(eventType);
                    const timeText = Math.ceil(timeRemaining);
                    this.element.textContent = `${formattedType}: ${timeText}s`;
                } else {
                    // Normal mode updates
                    if (this.eventTypeElement) {
                        this.eventTypeElement.textContent = this.formatEventType(eventType);
                    }
                    this.updateTimeDisplay();
                    this.updateAriaLabel();
                }
            } catch (contentError) {
                console.error('Error updating indicator content:', contentError);
                // Fallback to simple text
                try {
                    this.element.textContent = `Bet: ${Math.ceil(timeRemaining)}s`;
                } catch (fallbackContentError) {
                    console.error('Fallback content update also failed:', fallbackContentError);
                }
            }

            // Show the element with entrance animation
            try {
                this.element.style.display = 'block';
                
                // Try to add entrance animation with graceful degradation
                try {
                    this.element.classList.add('minimized-indicator-entrance');
                    
                    // Remove entrance animation class after animation completes
                    setTimeout(() => {
                        try {
                            this.element.classList.remove('minimized-indicator-entrance');
                        } catch (animationRemoveError) {
                            console.warn('Error removing entrance animation class:', animationRemoveError);
                        }
                    }, 300);
                } catch (animationError) {
                    console.warn('Entrance animation failed, continuing without animation:', animationError);
                    // Continue without animation
                }
            } catch (showError) {
                console.error('Error showing indicator element:', showError);
            }

            // Check if urgent with error handling
            try {
                this.checkUrgency();
            } catch (urgencyError) {
                console.error('Error checking urgency:', urgencyError);
            }
        } catch (showMainError) {
            console.error('Critical error in MinimizedIndicator show:', showMainError);
        }
    }

    /**
     * Updates the time remaining display
     * @param {number} remaining - Time remaining in seconds
     */
    updateTime(remaining) {
        this.timeRemaining = remaining;
        this.updateTimeDisplay();
        this.updateAriaLabel();
        this.checkUrgency();
    }

    /**
     * Updates the time display element
     */
    updateTimeDisplay() {
        if (this.timeElement) {
            this.timeElement.textContent = `${Math.ceil(this.timeRemaining)}s`;
        }
    }

    /**
     * Updates the aria-label for accessibility
     */
    updateAriaLabel() {
        const eventTypeFormatted = this.formatEventType(this.eventType);
        const timeText = Math.ceil(this.timeRemaining);
        const urgentText = this.isUrgent ? ' - URGENT' : '';
        this.element.setAttribute('aria-label', 
            `${eventTypeFormatted} betting opportunity - ${timeText} seconds remaining${urgentText} - click to restore`
        );
    }

    /**
     * Hides the minimized indicator
     */
    hide() {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.element.classList.add('minimized-indicator-exit');
        
        setTimeout(() => {
            this.element.style.display = 'none';
            this.element.classList.remove('minimized-indicator-exit');
            this.removeUrgentEffects();
        }, 300);
    }

    /**
     * Sets the click callback for when indicator is clicked
     * @param {Function} callback - Function to call when indicator is clicked
     */
    onClick(callback) {
        this.onClickCallback = callback;
    }

    /**
     * Positions the indicator at specific coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    position(x, y) {
        if (this.element) {
            this.element.style.right = 'auto';
            this.element.style.top = 'auto';
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
    }

    /**
     * Checks if time remaining is urgent and applies visual effects
     */
    checkUrgency() {
        const wasUrgent = this.isUrgent;
        this.isUrgent = this.timeRemaining <= this.urgentThreshold;

        if (this.isUrgent && !wasUrgent) {
            this.applyUrgentEffects();
        } else if (!this.isUrgent && wasUrgent) {
            this.removeUrgentEffects();
        }
    }

    /**
     * Applies urgent visual effects (pulsing, color changes)
     */
    applyUrgentEffects() {
        this.element.classList.add('urgent', 'minimized-indicator-urgent');
        this.updateAriaLabel();
    }

    /**
     * Removes urgent visual effects
     */
    removeUrgentEffects() {
        this.element.classList.remove('urgent', 'minimized-indicator-urgent');
        this.updateAriaLabel();
    }

    /**
     * Sets urgent state and applies/removes effects accordingly
     * @param {boolean} urgent - Whether indicator should be urgent
     */
    setUrgent(urgent) {
        if (urgent && !this.isUrgent) {
            this.applyUrgentEffects();
        } else if (!urgent && this.isUrgent) {
            this.removeUrgentEffects();
        }
    }

    /**
     * Formats event type for display
     * @param {string} eventType - Raw event type
     * @returns {string} Formatted event type
     */
    formatEventType(eventType) {
        const eventTypeMap = {
            'CORNER_OUTCOME': 'Corner Kick',
            'GOAL_ATTEMPT': 'Goal Attempt',
            'PENALTY': 'Penalty',
            'FREE_KICK': 'Free Kick',
            'YELLOW_CARD': 'Yellow Card',
            'RED_CARD': 'Red Card',
            'SUBSTITUTION': 'Substitution',
            'OFFSIDE': 'Offside',
            'FOUL': 'Foul'
        };

        return eventTypeMap[eventType] || eventType.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Gets current visibility state
     * @returns {boolean} Whether indicator is visible
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * Gets current time remaining
     * @returns {number} Time remaining in seconds
     */
    getTimeRemaining() {
        return this.timeRemaining;
    }

    /**
     * Gets current event type
     * @returns {string} Current event type
     */
    getEventType() {
        return this.eventType;
    }

    /**
     * Destroys the indicator and removes it from DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.timeElement = null;
        this.eventTypeElement = null;
        this.onClickCallback = null;
        this.isVisible = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MinimizedIndicator;
}