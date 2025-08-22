/**
 * AudioManager - Manages game audio feedback and sound effects
 * 
 * Provides audio feedback for key game events including bets, wins, power-ups, and goals.
 * Includes volume control, mute functionality, and graceful fallback for audio failures.
 */
import { errorHandler, ERROR_TYPES } from '../utils/ErrorHandler.js';

export class AudioManager {
    constructor() {
        try {
            this.audioContext = null;
            this.volume = 0.7;
            this.muted = false;
            this.sounds = new Map();
            this.initialized = false;
            this.silentMode = false;
            this.errorCount = 0;
            this.maxErrors = 3;
            
            // Sound configuration with frequencies for simple tones
            this.soundConfig = {
                betPlaced: { frequency: 440, duration: 0.2, type: 'sine' },
                betWin: { frequency: 659, duration: 0.5, type: 'sine' },
                betLoss: { frequency: 220, duration: 0.3, type: 'sawtooth' },
                powerUpAwarded: { frequency: 880, duration: 0.8, type: 'square' },
                actionBettingOpportunity: { frequency: 523, duration: 0.3, type: 'triangle' },
                countdownTick: { frequency: 330, duration: 0.1, type: 'sine' },
                countdownWarning: { frequency: 440, duration: 0.2, type: 'square' },
                goal: { frequency: 784, duration: 1.0, type: 'sine' },
                matchStart: { frequency: 392, duration: 0.6, type: 'triangle' },
                matchEnd: { frequency: 294, duration: 1.2, type: 'sine' }
            };
            
            this.setupErrorRecovery();
            this.initializeAudio();
        } catch (error) {
            errorHandler.handleError(error, ERROR_TYPES.AUDIO, {
                context: 'AudioManager_constructor',
                component: 'AudioManager'
            });
            this.enableSilentMode();
        }
    }

    /**
     * Initialize the Web Audio API context
     */
    async initializeAudio() {
        try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
                console.warn('AudioManager: Running in non-browser environment, audio disabled');
                this.initialized = false;
                this.enableSilentMode();
                return { success: false, message: 'Non-browser environment' };
            }

            // Create AudioContext with fallback for older browsers
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API not supported');
                this.enableSilentMode();
                return { success: false, message: 'Web Audio API not supported' };
            }

            this.audioContext = new AudioContext();
            
            // Handle audio context state for user interaction requirements
            if (this.audioContext.state === 'suspended') {
                // Audio context will be resumed on first user interaction
                if (typeof document !== 'undefined') {
                    document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
                    document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true });
                }
            }
            
            this.initialized = true;
            this.silentMode = false;
            console.log('AudioManager initialized successfully');
            return { success: true, message: 'Audio initialized' };
        } catch (error) {
            const errorResult = errorHandler.handleError(error, ERROR_TYPES.AUDIO, {
                context: 'AudioManager_initializeAudio'
            }, {
                attemptRecovery: true
            });
            
            if (!errorResult.success) {
                this.enableSilentMode();
            }
            
            return errorResult;
        }
    }

    /**
     * Resume audio context after user interaction
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            } catch (error) {
                console.error('Failed to resume audio context:', error);
            }
        }
    }

    /**
     * Play a sound effect for a specific game event
     * @param {string} eventType - The type of event to play sound for
     * @param {Object} options - Optional parameters for sound customization
     */
    playSound(eventType, options = {}) {
        try {
            const soundConfig = this.soundConfig[eventType];
            if (!soundConfig) {
                console.warn(`Unknown sound event type: ${eventType}`);
                return { success: false, message: 'Unknown sound event' };
            }

            if (this.silentMode) {
                // In silent mode, just log the sound event
                console.log(`[SILENT] Sound event: ${eventType}`);
                return { success: true, message: 'Silent mode active' };
            }

            if (!this.initialized || this.muted || !this.audioContext) {
                return { success: false, message: 'Audio not available' };
            }

            this.generateTone(soundConfig, options);
            return { success: true, message: 'Sound played' };
        } catch (error) {
            this.handleAudioError(error, 'playSound', { eventType, options });
            return { success: false, message: 'Sound playback failed' };
        }
    }

    /**
     * Generate a tone using Web Audio API
     * @param {Object} config - Sound configuration
     * @param {Object} options - Additional options
     */
    generateTone(config, options = {}) {
        if (!this.audioContext || this.silentMode) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Configure oscillator with validation
            oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'].includes(config.type) 
                ? config.type 
                : 'sine';
            
            const frequency = Math.max(20, Math.min(20000, config.frequency || 440));
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Configure gain (volume) with validation
            const finalVolume = Math.max(0, Math.min(1, (options.volume || 1) * this.volume));
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + config.duration);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Start and stop with error handling
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);
            
            // Clean up on end
            oscillator.onended = () => {
                try {
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (error) {
                    // Ignore cleanup errors
                }
            };
        } catch (error) {
            this.handleAudioError(error, 'generateTone', { config, options });
        }
    }

    /**
     * Play sound for bet placement
     */
    playBetPlaced() {
        this.playSound('betPlaced');
    }

    /**
     * Play sound for winning bet
     */
    playBetWin() {
        this.playSound('betWin');
    }

    /**
     * Play sound for losing bet
     */
    playBetLoss() {
        this.playSound('betLoss');
    }

    /**
     * Play sound for power-up award
     */
    playPowerUpAwarded() {
        this.playSound('powerUpAwarded');
    }

    /**
     * Play sound for action betting opportunity
     */
    playActionBettingOpportunity() {
        this.playSound('actionBettingOpportunity');
    }

    /**
     * Play sound for countdown tick
     */
    playCountdownTick() {
        this.playSound('countdownTick');
    }

    /**
     * Play sound for countdown warning (last few seconds)
     */
    playCountdownWarning() {
        this.playSound('countdownWarning');
    }

    /**
     * Play sound for goal event
     */
    playGoal() {
        this.playSound('goal');
    }

    /**
     * Play sound for match start
     */
    playMatchStart() {
        this.playSound('matchStart');
    }

    /**
     * Play sound for match end
     */
    playMatchEnd() {
        this.playSound('matchEnd');
    }

    /**
     * Set the master volume level
     * @param {number} level - Volume level between 0 and 1
     */
    setVolume(level) {
        if (typeof level !== 'number' || level < 0 || level > 1) {
            throw new Error('Volume must be a number between 0 and 1');
        }
        this.volume = level;
        console.log(`Audio volume set to ${Math.round(level * 100)}%`);
    }

    /**
     * Get the current volume level
     * @returns {number} Current volume level
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Mute or unmute audio
     * @param {boolean} enabled - True to mute, false to unmute
     */
    mute(enabled) {
        this.muted = enabled;
        console.log(`Audio ${enabled ? 'muted' : 'unmuted'}`);
    }

    /**
     * Check if audio is currently muted
     * @returns {boolean} True if muted
     */
    isMuted() {
        return this.muted;
    }

    /**
     * Toggle mute state
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        console.log(`Audio ${this.muted ? 'muted' : 'unmuted'}`);
        return this.muted;
    }

    /**
     * Check if audio system is initialized and ready
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized && this.audioContext !== null;
    }

    /**
     * Get audio system status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            muted: this.muted,
            volume: this.volume,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable',
            supportedEvents: Object.keys(this.soundConfig)
        };
    }

    /**
     * Cleanup audio resources
     */
    destroy() {
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (error) {
                console.error('Error closing audio context:', error);
            }
            this.audioContext = null;
        }
        this.sounds.clear();
        this.initialized = false;
        console.log('AudioManager destroyed');
    }

    /**
     * Test audio functionality by playing all available sounds
     */
    testAllSounds() {
        try {
            if (!this.initialized && !this.silentMode) {
                console.warn('AudioManager not initialized');
                return { success: false, message: 'Audio not initialized' };
            }

            console.log('Testing all audio sounds...');
            const events = Object.keys(this.soundConfig);
            
            events.forEach((eventType, index) => {
                setTimeout(() => {
                    console.log(`Playing: ${eventType}`);
                    this.playSound(eventType);
                }, index * 500);
            });
            
            return { success: true, message: 'Audio test started' };
        } catch (error) {
            return this.handleAudioError(error, 'testAllSounds');
        }
    }

    /**
     * Setup error recovery strategies for audio operations
     */
    setupErrorRecovery() {
        // Register recovery callback for disabling audio
        errorHandler.registerRecoveryCallback('disable_audio', async (errorInfo, options) => {
            try {
                this.enableSilentMode();
                return { success: true, message: 'Audio disabled, silent mode enabled' };
            } catch (error) {
                return { success: false, message: 'Failed to disable audio' };
            }
        });

        // Register recovery callback for silent mode
        errorHandler.registerRecoveryCallback('silent_mode', async (errorInfo, options) => {
            try {
                this.enableSilentMode();
                return { success: true, message: 'Silent mode enabled' };
            } catch (error) {
                return { success: false, message: 'Failed to enable silent mode' };
            }
        });
    }

    /**
     * Handle audio errors with recovery attempts
     */
    handleAudioError(error, context, data = {}) {
        this.errorCount++;
        
        const errorResult = errorHandler.handleError(error, ERROR_TYPES.AUDIO, {
            context: `AudioManager_${context}`,
            errorCount: this.errorCount,
            silentMode: this.silentMode,
            initialized: this.initialized,
            ...data
        }, {
            attemptRecovery: this.errorCount < this.maxErrors
        });

        // Enable silent mode if too many errors
        if (this.errorCount >= this.maxErrors && !this.silentMode) {
            this.enableSilentMode();
        }

        return errorResult;
    }

    /**
     * Enable silent mode for graceful degradation
     */
    enableSilentMode() {
        try {
            console.warn('Enabling audio silent mode due to errors');
            this.silentMode = true;
            this.initialized = false;
            
            // Clean up audio context
            if (this.audioContext) {
                try {
                    this.audioContext.close();
                } catch (error) {
                    // Ignore cleanup errors
                }
                this.audioContext = null;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to enable silent mode:', error);
            return false;
        }
    }

    /**
     * Attempt to re-initialize audio (recovery)
     */
    async reinitializeAudio() {
        try {
            this.errorCount = 0;
            this.silentMode = false;
            this.initialized = false;
            
            const result = await this.initializeAudio();
            return result;
        } catch (error) {
            this.enableSilentMode();
            return { success: false, message: 'Audio reinitialization failed' };
        }
    }

    /**
     * Get audio system health status
     */
    getSystemHealth() {
        try {
            return {
                healthy: this.initialized && !this.silentMode && this.errorCount < this.maxErrors,
                initialized: this.initialized,
                silentMode: this.silentMode,
                muted: this.muted,
                volume: this.volume,
                errorCount: this.errorCount,
                maxErrors: this.maxErrors,
                contextState: this.audioContext ? this.audioContext.state : 'unavailable',
                browserSupport: typeof window !== 'undefined' && 
                               (window.AudioContext || window.webkitAudioContext) !== undefined
            };
        } catch (error) {
            return {
                healthy: false,
                error: 'Unable to determine audio health'
            };
        }
    }

    /**
     * Safe sound playback with automatic fallback
     */
    safePlaySound(eventType, options = {}) {
        const maxRetries = 2;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const result = this.playSound(eventType, options);
            
            if (result.success) {
                return result;
            }

            retryCount++;
            
            // Try reinitializing audio on first retry
            if (retryCount === 1 && !this.silentMode) {
                this.reinitializeAudio();
            }
        }

        // Final fallback to silent mode
        if (!this.silentMode) {
            this.enableSilentMode();
        }
        
        return { success: false, message: 'Sound playback failed, silent mode enabled' };
    }

    /**
     * Reset error count (for recovery)
     */
    resetErrorCount() {
        this.errorCount = 0;
        console.info('Audio error count reset');
    }

    /**
     * Disable silent mode (attempt to return to normal audio)
     */
    async disableSilentMode() {
        try {
            if (!this.silentMode) {
                return { success: true, message: 'Already in normal audio mode' };
            }

            this.resetErrorCount();
            const result = await this.reinitializeAudio();
            
            if (result.success) {
                console.info('Silent mode disabled, audio restored');
                return { success: true, message: 'Audio restored' };
            } else {
                this.enableSilentMode();
                return { success: false, message: 'Failed to restore audio' };
            }
        } catch (error) {
            this.enableSilentMode();
            return { success: false, message: 'Failed to disable silent mode' };
        }
    }
}

// Create and export singleton instance
export const audioManager = new AudioManager();
export default audioManager;