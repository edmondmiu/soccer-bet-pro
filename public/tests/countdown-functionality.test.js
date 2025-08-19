/**
 * Test Suite for Resume Countdown Functionality
 * 
 * Tests the countdown display and timing functionality for the pause system.
 * Covers PauseUI countdown display and PauseManager countdown integration.
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app-container"></div></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);

// Import modules to test
const PauseUI = require('../scripts/pauseUI.js');

describe('Resume Countdown Functionality', () => {
    let pauseUI;
    let mockGameState;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '<div id="app-container"></div>';
        
        // Create fresh PauseUI instance
        pauseUI = new PauseUI();
        
        // Mock game state
        mockGameState = {
            pause: {
                active: false,
                reason: null,
                startTime: null,
                timeoutId: null
            }
        };

        // Mock console methods to avoid noise in tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Clean up
        if (pauseUI) {
            pauseUI.destroy();
        }
        
        // Restore console methods
        console.log.mockRestore();
        console.warn.mockRestore();
        console.error.mockRestore();
        
        // Clear any remaining timers
        jest.clearAllTimers();
    });

    describe('PauseUI.showResumeCountdown()', () => {
        beforeEach(() => {
            // Show pause overlay first (required for countdown)
            pauseUI.showPauseOverlay('Betting in Progress');
        });

        test('should display countdown with correct initial number', async () => {
            const countdownPromise = pauseUI.showResumeCountdown(3);
            
            // Check that countdown display is created
            const countdownNumber = document.querySelector('.countdown-number');
            const countdownText = document.querySelector('.countdown-text');
            
            expect(countdownNumber).toBeTruthy();
            expect(countdownText).toBeTruthy();
            expect(countdownNumber.textContent).toBe('3');
            expect(countdownText.textContent).toBe('Resuming in...');
            
            // Don't wait for full countdown in this test
            return Promise.resolve();
        });

        test('should update countdown display every second', (done) => {
            jest.useFakeTimers();
            
            const countdownPromise = pauseUI.showResumeCountdown(3);
            
            // Initial state
            let countdownNumber = document.querySelector('.countdown-number');
            expect(countdownNumber.textContent).toBe('3');
            
            // After 1 second
            jest.advanceTimersByTime(1000);
            countdownNumber = document.querySelector('.countdown-number');
            expect(countdownNumber.textContent).toBe('2');
            
            // After 2 seconds
            jest.advanceTimersByTime(1000);
            countdownNumber = document.querySelector('.countdown-number');
            expect(countdownNumber.textContent).toBe('1');
            
            // After 3 seconds - should show "GO!"
            jest.advanceTimersByTime(1000);
            countdownNumber = document.querySelector('.countdown-number');
            expect(countdownNumber.textContent).toBe('GO!');
            
            jest.useRealTimers();
            done();
        });

        test('should add animation class during countdown tick', (done) => {
            jest.useFakeTimers();
            
            pauseUI.showResumeCountdown(2);
            
            const countdownNumber = document.querySelector('.countdown-number');
            
            // Advance time to trigger first tick
            jest.advanceTimersByTime(1000);
            
            // Check that animation class is added
            expect(countdownNumber.classList.contains('countdown-tick')).toBe(true);
            
            // Advance time to remove animation class
            jest.advanceTimersByTime(200);
            expect(countdownNumber.classList.contains('countdown-tick')).toBe(false);
            
            jest.useRealTimers();
            done();
        });

        test('should call onComplete callback when countdown finishes', (done) => {
            jest.useFakeTimers();
            
            const mockCallback = jest.fn();
            pauseUI.showResumeCountdown(1, mockCallback);
            
            // Fast-forward through countdown
            jest.advanceTimersByTime(1000); // 1 -> GO!
            jest.advanceTimersByTime(500);  // Complete after "GO!" display
            
            expect(mockCallback).toHaveBeenCalled();
            
            jest.useRealTimers();
            done();
        });

        test('should resolve promise when countdown completes', async () => {
            jest.useFakeTimers();
            
            const countdownPromise = pauseUI.showResumeCountdown(1);
            
            // Fast-forward through countdown
            jest.advanceTimersByTime(1000); // 1 -> GO!
            jest.advanceTimersByTime(500);  // Complete
            
            await expect(countdownPromise).resolves.toBeUndefined();
            
            jest.useRealTimers();
        });

        test('should handle countdown with custom seconds', () => {
            jest.useFakeTimers();
            
            pauseUI.showResumeCountdown(5);
            
            const countdownNumber = document.querySelector('.countdown-number');
            expect(countdownNumber.textContent).toBe('5');
            
            // Advance and check each second
            jest.advanceTimersByTime(1000);
            expect(countdownNumber.textContent).toBe('4');
            
            jest.advanceTimersByTime(1000);
            expect(countdownNumber.textContent).toBe('3');
            
            jest.useRealTimers();
        });

        test('should warn and resolve immediately if overlay not visible', async () => {
            // Hide the overlay first
            pauseUI.hidePauseOverlay();
            
            const mockCallback = jest.fn();
            const result = await pauseUI.showResumeCountdown(3, mockCallback);
            
            expect(console.warn).toHaveBeenCalledWith('PauseUI: Cannot show countdown - overlay not visible');
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should update pause reason to "Resuming Game"', () => {
            pauseUI.showResumeCountdown(3);
            
            const reasonElement = document.querySelector('.pause-reason');
            expect(reasonElement.textContent).toBe('Resuming Game');
        });

        test('should add countdown-specific CSS styles', () => {
            pauseUI.showResumeCountdown(3);
            
            const countdownStyles = document.getElementById('countdown-styles');
            expect(countdownStyles).toBeTruthy();
            expect(countdownStyles.textContent).toContain('.countdown-display');
            expect(countdownStyles.textContent).toContain('.countdown-number');
            expect(countdownStyles.textContent).toContain('.countdown-text');
        });

        test('should not duplicate countdown styles if already added', () => {
            pauseUI.showResumeCountdown(3);
            pauseUI.showResumeCountdown(2);
            
            const countdownStyles = document.querySelectorAll('#countdown-styles');
            expect(countdownStyles.length).toBe(1);
        });
    });

    describe('Countdown Visual Effects', () => {
        beforeEach(() => {
            pauseUI.showPauseOverlay('Betting in Progress');
        });

        test('should apply countdown-go class and animation for final display', () => {
            jest.useFakeTimers();
            
            pauseUI.showResumeCountdown(1);
            
            // Advance to "GO!" state
            jest.advanceTimersByTime(1000);
            
            const countdownNumber = document.querySelector('.countdown-number');
            expect(countdownNumber.textContent).toBe('GO!');
            expect(countdownNumber.classList.contains('countdown-go')).toBe(true);
            
            const countdownText = document.querySelector('.countdown-text');
            expect(countdownText.textContent).toBe('Game Resumed');
            
            jest.useRealTimers();
        });

        test('should have proper CSS classes for styling', () => {
            pauseUI.showResumeCountdown(3);
            
            const countdownDisplay = document.querySelector('.countdown-display');
            const countdownNumber = document.querySelector('.countdown-number');
            const countdownText = document.querySelector('.countdown-text');
            
            expect(countdownDisplay).toBeTruthy();
            expect(countdownNumber).toBeTruthy();
            expect(countdownText).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Create pauseUI without proper DOM setup
            document.body.innerHTML = '';
            const brokenPauseUI = new PauseUI();
            
            expect(() => {
                brokenPauseUI.showResumeCountdown(3);
            }).not.toThrow();
        });

        test('should handle invalid countdown seconds', async () => {
            pauseUI.showPauseOverlay('Test');
            
            // Test with 0 seconds
            const result = await pauseUI.showResumeCountdown(0);
            expect(result).toBeUndefined();
            
            // Test with negative seconds - should still work (treated as 0)
            const result2 = await pauseUI.showResumeCountdown(-1);
            expect(result2).toBeUndefined();
        });
    });
});

describe('PauseManager Countdown Integration', () => {
    let pauseManager;
    let mockUpdatePauseState;
    let mockGetPauseState;

    beforeEach(() => {
        // Mock the gameState functions
        mockUpdatePauseState = jest.fn();
        mockGetPauseState = jest.fn(() => ({
            active: false,
            reason: null,
            startTime: null,
            timeoutId: null
        }));

        // Mock the module imports
        jest.doMock('../scripts/gameState.js', () => ({
            updatePauseState: mockUpdatePauseState,
            getPauseState: mockGetPauseState
        }));

        // Import PauseManager after mocking
        const { PauseManager } = require('../scripts/pauseManager.js');
        pauseManager = new PauseManager();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('resumeGame() with countdown', () => {
        beforeEach(() => {
            // Set up paused state
            mockGetPauseState.mockReturnValue({
                active: true,
                reason: 'BETTING_OPPORTUNITY',
                startTime: Date.now(),
                timeoutId: null
            });
        });

        test('should call countdown callback when resuming with countdown', async () => {
            const mockCountdownCallback = jest.fn(() => Promise.resolve());
            pauseManager.setCountdownCallback(mockCountdownCallback);
            
            const result = await pauseManager.resumeGame(true, 3);
            
            expect(mockCountdownCallback).toHaveBeenCalledWith(3);
            expect(result).toBe(true);
        });

        test('should skip countdown when withCountdown is false', async () => {
            const mockCountdownCallback = jest.fn(() => Promise.resolve());
            pauseManager.setCountdownCallback(mockCountdownCallback);
            
            const result = await pauseManager.resumeGame(false);
            
            expect(mockCountdownCallback).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        test('should use default 3-second countdown', async () => {
            const mockCountdownCallback = jest.fn(() => Promise.resolve());
            pauseManager.setCountdownCallback(mockCountdownCallback);
            
            await pauseManager.resumeGame();
            
            expect(mockCountdownCallback).toHaveBeenCalledWith(3);
        });

        test('should use custom countdown seconds', async () => {
            const mockCountdownCallback = jest.fn(() => Promise.resolve());
            pauseManager.setCountdownCallback(mockCountdownCallback);
            
            await pauseManager.resumeGame(true, 5);
            
            expect(mockCountdownCallback).toHaveBeenCalledWith(5);
        });

        test('should continue with resume even if countdown fails', async () => {
            const mockCountdownCallback = jest.fn(() => Promise.reject(new Error('Countdown failed')));
            pauseManager.setCountdownCallback(mockCountdownCallback);
            
            const result = await pauseManager.resumeGame(true, 3);
            
            expect(mockCountdownCallback).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(mockUpdatePauseState).toHaveBeenCalledWith({
                active: false,
                reason: null,
                startTime: null,
                timeoutId: null
            });
        });

        test('should return false if game is not paused', async () => {
            mockGetPauseState.mockReturnValue({
                active: false,
                reason: null,
                startTime: null,
                timeoutId: null
            });

            const result = await pauseManager.resumeGame();
            
            expect(result).toBe(false);
            expect(console.warn).toHaveBeenCalledWith('PauseManager: Game is not currently paused');
        });
    });

    describe('Countdown callback management', () => {
        test('should set countdown callback', () => {
            const mockCallback = jest.fn();
            pauseManager.setCountdownCallback(mockCallback);
            
            expect(pauseManager.onCountdownStart).toBe(mockCallback);
        });

        test('should warn for invalid countdown callback', () => {
            pauseManager.setCountdownCallback('not a function');
            
            expect(console.warn).toHaveBeenCalledWith('PauseManager: Invalid callback provided for countdown');
            expect(pauseManager.onCountdownStart).toBeNull();
        });

        test('should clear countdown callback', () => {
            const mockCallback = jest.fn();
            pauseManager.setCountdownCallback(mockCallback);
            pauseManager.clearCountdownCallback();
            
            expect(pauseManager.onCountdownStart).toBeNull();
        });
    });
});