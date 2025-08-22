/**
 * AudioManager Tests
 * 
 * Tests for audio feedback system including sound effects, volume control,
 * mute functionality, and error handling.
 */

import { AudioManager } from './AudioManager.js';

describe('AudioManager', () => {
    let audioManager;
    let mockAudioContext;
    let mockOscillator;
    let mockGainNode;

    beforeEach(() => {
        // Mock Web Audio API
        mockOscillator = {
            type: 'sine',
            frequency: { setValueAtTime: jest.fn() },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };

        mockGainNode = {
            gain: {
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn()
            },
            connect: jest.fn()
        };

        mockAudioContext = {
            createOscillator: jest.fn(() => mockOscillator),
            createGain: jest.fn(() => mockGainNode),
            currentTime: 0,
            state: 'running',
            resume: jest.fn().mockResolvedValue(),
            close: jest.fn(),
            destination: {}
        };

        // Mock global AudioContext
        global.AudioContext = jest.fn(() => mockAudioContext);
        global.webkitAudioContext = jest.fn(() => mockAudioContext);

        // Mock console methods
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();

        audioManager = new AudioManager();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        if (audioManager) {
            audioManager.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default settings', () => {
            expect(audioManager.volume).toBe(0.7);
            expect(audioManager.muted).toBe(false);
            expect(audioManager.initialized).toBe(true);
        });

        test('should handle missing Web Audio API gracefully', () => {
            global.AudioContext = undefined;
            global.webkitAudioContext = undefined;

            const manager = new AudioManager();
            expect(manager.initialized).toBe(false);
            expect(console.warn).toHaveBeenCalledWith('Web Audio API not supported');
        });

        test('should handle AudioContext creation failure', () => {
            global.AudioContext = jest.fn(() => {
                throw new Error('AudioContext creation failed');
            });

            const manager = new AudioManager();
            expect(manager.initialized).toBe(false);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to initialize AudioManager:',
                expect.any(Error)
            );
        });

        test('should handle suspended audio context', () => {
            mockAudioContext.state = 'suspended';
            const manager = new AudioManager();
            
            // Simulate user interaction
            const clickEvent = new Event('click');
            document.dispatchEvent(clickEvent);
            
            expect(mockAudioContext.resume).toHaveBeenCalled();
        });
    });

    describe('Sound Configuration', () => {
        test('should have all required sound events configured', () => {
            const requiredEvents = [
                'betPlaced', 'betWin', 'betLoss', 'powerUpAwarded',
                'actionBettingOpportunity', 'countdownTick', 'countdownWarning',
                'goal', 'matchStart', 'matchEnd'
            ];

            requiredEvents.forEach(event => {
                expect(audioManager.soundConfig[event]).toBeDefined();
                expect(audioManager.soundConfig[event].frequency).toBeGreaterThan(0);
                expect(audioManager.soundConfig[event].duration).toBeGreaterThan(0);
                expect(audioManager.soundConfig[event].type).toBeDefined();
            });
        });

        test('should have valid frequency ranges for all sounds', () => {
            Object.values(audioManager.soundConfig).forEach(config => {
                expect(config.frequency).toBeGreaterThanOrEqual(20);
                expect(config.frequency).toBeLessThanOrEqual(20000);
            });
        });

        test('should have reasonable duration ranges for all sounds', () => {
            Object.values(audioManager.soundConfig).forEach(config => {
                expect(config.duration).toBeGreaterThan(0);
                expect(config.duration).toBeLessThanOrEqual(2);
            });
        });
    });

    describe('Sound Playback', () => {
        test('should play sound when initialized and not muted', () => {
            audioManager.playSound('betPlaced');

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
            expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
            expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
            expect(mockOscillator.start).toHaveBeenCalled();
            expect(mockOscillator.stop).toHaveBeenCalled();
        });

        test('should not play sound when muted', () => {
            audioManager.mute(true);
            audioManager.playSound('betPlaced');

            expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
        });

        test('should not play sound when not initialized', () => {
            audioManager.initialized = false;
            audioManager.playSound('betPlaced');

            expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
        });

        test('should handle unknown sound event gracefully', () => {
            audioManager.playSound('unknownEvent');

            expect(console.warn).toHaveBeenCalledWith('Unknown sound event type: unknownEvent');
            expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
        });

        test('should handle sound generation errors gracefully', () => {
            mockAudioContext.createOscillator.mockImplementation(() => {
                throw new Error('Oscillator creation failed');
            });

            audioManager.playSound('betPlaced');

            expect(console.error).toHaveBeenCalledWith(
                'Failed to play sound for betPlaced:',
                expect.any(Error)
            );
        });

        test('should apply volume correctly', () => {
            audioManager.setVolume(0.5);
            audioManager.playSound('betPlaced');

            expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
                0.5, // volume * 1 (default options.volume)
                expect.any(Number)
            );
        });

        test('should apply custom volume options', () => {
            audioManager.playSound('betPlaced', { volume: 0.3 });

            expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
                0.21, // 0.7 (default volume) * 0.3 (options.volume)
                expect.any(Number)
            );
        });
    });

    describe('Specific Sound Methods', () => {
        test('should have convenience methods for all game events', () => {
            const methods = [
                'playBetPlaced', 'playBetWin', 'playBetLoss', 'playPowerUpAwarded',
                'playActionBettingOpportunity', 'playCountdownTick', 'playCountdownWarning',
                'playGoal', 'playMatchStart', 'playMatchEnd'
            ];

            methods.forEach(method => {
                expect(typeof audioManager[method]).toBe('function');
            });
        });

        test('should call playSound with correct event type', () => {
            jest.spyOn(audioManager, 'playSound');

            audioManager.playBetPlaced();
            expect(audioManager.playSound).toHaveBeenCalledWith('betPlaced');

            audioManager.playBetWin();
            expect(audioManager.playSound).toHaveBeenCalledWith('betWin');

            audioManager.playGoal();
            expect(audioManager.playSound).toHaveBeenCalledWith('goal');
        });
    });

    describe('Volume Control', () => {
        test('should set volume within valid range', () => {
            audioManager.setVolume(0.5);
            expect(audioManager.getVolume()).toBe(0.5);

            audioManager.setVolume(0);
            expect(audioManager.getVolume()).toBe(0);

            audioManager.setVolume(1);
            expect(audioManager.getVolume()).toBe(1);
        });

        test('should reject invalid volume values', () => {
            expect(() => audioManager.setVolume(-0.1)).toThrow('Volume must be a number between 0 and 1');
            expect(() => audioManager.setVolume(1.1)).toThrow('Volume must be a number between 0 and 1');
            expect(() => audioManager.setVolume('0.5')).toThrow('Volume must be a number between 0 and 1');
            expect(() => audioManager.setVolume(null)).toThrow('Volume must be a number between 0 and 1');
        });

        test('should maintain volume after invalid attempts', () => {
            const originalVolume = audioManager.getVolume();
            
            try {
                audioManager.setVolume(2);
            } catch (e) {
                // Expected to throw
            }
            
            expect(audioManager.getVolume()).toBe(originalVolume);
        });
    });

    describe('Mute Functionality', () => {
        test('should mute and unmute audio', () => {
            expect(audioManager.isMuted()).toBe(false);

            audioManager.mute(true);
            expect(audioManager.isMuted()).toBe(true);

            audioManager.mute(false);
            expect(audioManager.isMuted()).toBe(false);
        });

        test('should toggle mute state', () => {
            const initialState = audioManager.isMuted();
            
            const newState = audioManager.toggleMute();
            expect(newState).toBe(!initialState);
            expect(audioManager.isMuted()).toBe(newState);

            const toggledState = audioManager.toggleMute();
            expect(toggledState).toBe(initialState);
            expect(audioManager.isMuted()).toBe(initialState);
        });

        test('should prevent sound playback when muted', () => {
            audioManager.mute(true);
            audioManager.playSound('betPlaced');

            expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
        });
    });

    describe('Status and Information', () => {
        test('should report initialization status correctly', () => {
            expect(audioManager.isInitialized()).toBe(true);

            audioManager.initialized = false;
            expect(audioManager.isInitialized()).toBe(false);
        });

        test('should provide comprehensive status information', () => {
            const status = audioManager.getStatus();

            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('muted');
            expect(status).toHaveProperty('volume');
            expect(status).toHaveProperty('contextState');
            expect(status).toHaveProperty('supportedEvents');

            expect(Array.isArray(status.supportedEvents)).toBe(true);
            expect(status.supportedEvents.length).toBeGreaterThan(0);
        });

        test('should handle status when audio context is unavailable', () => {
            audioManager.audioContext = null;
            const status = audioManager.getStatus();

            expect(status.contextState).toBe('unavailable');
        });
    });

    describe('Testing and Utilities', () => {
        test('should test all sounds without errors', () => {
            jest.useFakeTimers();
            jest.spyOn(audioManager, 'playSound');

            audioManager.testAllSounds();

            // Fast-forward through all timeouts
            jest.runAllTimers();

            const soundEvents = Object.keys(audioManager.soundConfig);
            expect(audioManager.playSound).toHaveBeenCalledTimes(soundEvents.length);

            soundEvents.forEach(eventType => {
                expect(audioManager.playSound).toHaveBeenCalledWith(eventType);
            });

            jest.useRealTimers();
        });

        test('should handle test sounds when not initialized', () => {
            audioManager.initialized = false;
            audioManager.testAllSounds();

            expect(console.warn).toHaveBeenCalledWith('AudioManager not initialized');
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should cleanup resources on destroy', () => {
            audioManager.destroy();

            expect(mockAudioContext.close).toHaveBeenCalled();
            expect(audioManager.audioContext).toBeNull();
            expect(audioManager.initialized).toBe(false);
        });

        test('should handle destroy when audio context is null', () => {
            audioManager.audioContext = null;
            
            expect(() => audioManager.destroy()).not.toThrow();
            expect(audioManager.initialized).toBe(false);
        });

        test('should handle audio context close errors', () => {
            mockAudioContext.close.mockImplementation(() => {
                throw new Error('Close failed');
            });

            audioManager.destroy();

            expect(console.error).toHaveBeenCalledWith(
                'Error closing audio context:',
                expect.any(Error)
            );
            expect(audioManager.audioContext).toBeNull();
        });
    });

    describe('Error Handling', () => {
        test('should handle audio context resume failure', async () => {
            mockAudioContext.state = 'suspended';
            mockAudioContext.resume.mockRejectedValue(new Error('Resume failed'));

            const manager = new AudioManager();
            
            // Simulate user interaction
            const clickEvent = new Event('click');
            document.dispatchEvent(clickEvent);

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(console.error).toHaveBeenCalledWith(
                'Failed to resume audio context:',
                expect.any(Error)
            );
        });

        test('should continue functioning after individual sound failures', () => {
            // First call fails
            mockAudioContext.createOscillator
                .mockImplementationOnce(() => {
                    throw new Error('First call failed');
                })
                .mockImplementation(() => mockOscillator);

            audioManager.playSound('betPlaced');
            expect(console.error).toHaveBeenCalled();

            // Second call should work
            jest.clearAllMocks();
            audioManager.playSound('betWin');
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('Integration Requirements', () => {
        test('should support all required game events from requirements', () => {
            // Based on requirement 9.7 - audio feedback for key events
            const requiredEvents = [
                'betPlaced',    // Bet placement
                'betWin',       // Winning bets
                'betLoss',      // Losing bets
                'powerUpAwarded', // Power-up awards
                'goal',         // Goals
                'actionBettingOpportunity', // Action betting
                'countdownTick', // Countdown feedback
                'matchStart',   // Match events
                'matchEnd'      // Match conclusion
            ];

            requiredEvents.forEach(event => {
                expect(audioManager.soundConfig[event]).toBeDefined();
                expect(() => audioManager.playSound(event)).not.toThrow();
            });
        });

        test('should provide fallback for audio loading failures', () => {
            // Test that system continues to work even when audio fails
            global.AudioContext = undefined;
            global.webkitAudioContext = undefined;

            const manager = new AudioManager();
            
            // Should not throw errors
            expect(() => manager.playSound('betPlaced')).not.toThrow();
            expect(() => manager.setVolume(0.5)).not.toThrow();
            expect(() => manager.mute(true)).not.toThrow();
        });
    });
});