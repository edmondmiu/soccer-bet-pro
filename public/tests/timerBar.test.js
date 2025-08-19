/**
 * Unit tests for TimerBar component
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test-container"></div></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const TimerBar = require('../scripts/timerBar.js');

describe('TimerBar Component', () => {
    let timerBar;
    let container;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '<div id="test-container"></div>';
        container = document.getElementById('test-container');
        timerBar = new TimerBar('test-container');
    });

    afterEach(() => {
        if (timerBar) {
            timerBar.destroy();
        }
    });

    describe('Initialization', () => {
        test('should create timer bar DOM structure', () => {
            const timerContainer = container.querySelector('.timer-bar-container');
            const timerBarElement = container.querySelector('.timer-bar');
            
            expect(timerContainer).toBeTruthy();
            expect(timerBarElement).toBeTruthy();
            expect(timerBarElement.classList.contains('timer-bar-normal')).toBe(true);
        });

        test('should handle missing container gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const invalidTimerBar = new TimerBar('non-existent-container');
            
            expect(consoleSpy).toHaveBeenCalledWith("TimerBar: Container with id 'non-existent-container' not found");
            consoleSpy.mockRestore();
        });
    });

    describe('Timer Management', () => {
        test('should start timer with correct initial state', () => {
            const duration = 10000; // 10 seconds
            timerBar.start(duration);
            
            expect(timerBar.duration).toBe(duration);
            expect(timerBar.remaining).toBe(duration);
            expect(timerBar.isRunning).toBe(true);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.style.width).toBe('100%');
            expect(timerBarElement.classList.contains('timer-bar-normal')).toBe(true);
        });

        test('should update timer display correctly', () => {
            const duration = 10000;
            const remaining = 5000; // 50% remaining
            
            timerBar.start(duration);
            timerBar.update(remaining, duration);
            
            expect(timerBar.remaining).toBe(remaining);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.style.width).toBe('50%');
        });

        test('should stop timer correctly', () => {
            timerBar.start(10000);
            expect(timerBar.isRunning).toBe(true);
            
            timerBar.stop();
            expect(timerBar.isRunning).toBe(false);
        });

        test('should return correct remaining time', () => {
            const duration = 10000;
            const remaining = 3000;
            
            timerBar.start(duration);
            timerBar.update(remaining, duration);
            
            expect(timerBar.getRemaining()).toBe(remaining);
        });
    });

    describe('Color State Management', () => {
        test('should start with normal color state', () => {
            timerBar.start(10000);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-normal')).toBe(true);
            expect(timerBarElement.classList.contains('timer-bar-warning')).toBe(false);
            expect(timerBarElement.classList.contains('timer-bar-urgent')).toBe(false);
        });

        test('should change to warning state at 50% remaining', () => {
            const duration = 10000;
            const remaining = 5000; // Exactly 50%
            
            timerBar.start(duration);
            timerBar.update(remaining, duration);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-warning')).toBe(true);
            expect(timerBarElement.classList.contains('timer-bar-normal')).toBe(false);
            expect(timerBarElement.classList.contains('timer-bar-urgent')).toBe(false);
        });

        test('should change to urgent state at 25% remaining', () => {
            const duration = 10000;
            const remaining = 2500; // Exactly 25%
            
            timerBar.start(duration);
            timerBar.update(remaining, duration);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-urgent')).toBe(true);
            expect(timerBarElement.classList.contains('timer-bar-normal')).toBe(false);
            expect(timerBarElement.classList.contains('timer-bar-warning')).toBe(false);
        });

        test('should handle edge cases for color transitions', () => {
            const duration = 10000;
            
            timerBar.start(duration);
            
            // Test just above warning threshold (51%)
            timerBar.update(5100, duration);
            let timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-normal')).toBe(true);
            
            // Test just below warning threshold (49%)
            timerBar.update(4900, duration);
            timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-warning')).toBe(true);
            
            // Test just above urgent threshold (26%)
            timerBar.update(2600, duration);
            timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-warning')).toBe(true);
            
            // Test just below urgent threshold (24%)
            timerBar.update(2400, duration);
            timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.classList.contains('timer-bar-urgent')).toBe(true);
        });
    });

    describe('Timer Expiration', () => {
        test('should call onExpired callback when timer reaches zero', (done) => {
            const duration = 100; // Short duration for testing
            let expiredCalled = false;
            
            timerBar.onExpired(() => {
                expiredCalled = true;
                expect(timerBar.isRunning).toBe(false);
                done();
            });
            
            timerBar.start(duration);
            timerBar.update(0, duration); // Force expiration
        });

        test('should stop timer when expired', () => {
            timerBar.start(10000);
            timerBar.update(0, 10000); // Force expiration
            
            expect(timerBar.isRunning).toBe(false);
        });

        test('should handle zero remaining time correctly', () => {
            const duration = 10000;
            
            timerBar.start(duration);
            timerBar.update(0, duration);
            
            expect(timerBar.remaining).toBe(0);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.style.width).toBe('0%');
        });
    });

    describe('Callback System', () => {
        test('should call onUpdate callback during updates', () => {
            const duration = 10000;
            const remaining = 5000;
            let updateCalled = false;
            let callbackRemaining, callbackDuration;
            
            timerBar.onUpdate((rem, dur) => {
                updateCalled = true;
                callbackRemaining = rem;
                callbackDuration = dur;
            });
            
            timerBar.start(duration);
            timerBar.update(remaining, duration);
            
            expect(updateCalled).toBe(true);
            expect(callbackRemaining).toBe(remaining);
            expect(callbackDuration).toBe(duration);
        });

        test('should not call callbacks when timer is stopped', () => {
            let updateCalled = false;
            
            timerBar.onUpdate(() => {
                updateCalled = true;
            });
            
            timerBar.start(10000);
            timerBar.stop();
            timerBar.update(5000, 10000);
            
            expect(updateCalled).toBe(false);
        });
    });

    describe('Visibility Control', () => {
        test('should hide timer bar', () => {
            timerBar.hide();
            
            const timerContainer = container.querySelector('.timer-bar-container');
            expect(timerContainer.style.display).toBe('none');
        });

        test('should show timer bar', () => {
            timerBar.hide();
            timerBar.show();
            
            const timerContainer = container.querySelector('.timer-bar-container');
            expect(timerContainer.style.display).toBe('block');
        });
    });

    describe('Error Handling', () => {
        test('should handle update without initialization', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const uninitializedTimer = new TimerBar('non-existent');
            
            // Should not throw error
            expect(() => {
                uninitializedTimer.start(10000);
            }).not.toThrow();
            
            consoleSpy.mockRestore();
        });

        test('should handle negative remaining time', () => {
            const duration = 10000;
            
            timerBar.start(duration);
            timerBar.update(-1000, duration); // Negative time
            
            expect(timerBar.remaining).toBe(0);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.style.width).toBe('0%');
        });

        test('should handle zero duration', () => {
            timerBar.start(0);
            timerBar.update(0, 0);
            
            const timerBarElement = container.querySelector('.timer-bar');
            expect(timerBarElement.style.width).toBe('0%');
        });
    });

    describe('Cleanup', () => {
        test('should destroy timer bar and clean up DOM', () => {
            timerBar.start(10000);
            expect(container.querySelector('.timer-bar-container')).toBeTruthy();
            
            timerBar.destroy();
            
            expect(container.querySelector('.timer-bar-container')).toBeFalsy();
            expect(timerBar.isRunning).toBe(false);
        });

        test('should handle destroy when not initialized', () => {
            const uninitializedTimer = new TimerBar('non-existent');
            
            // Should not throw error
            expect(() => {
                uninitializedTimer.destroy();
            }).not.toThrow();
        });
    });

    describe('Real-time Updates', () => {
        test('should update automatically when started', (done) => {
            const duration = 200; // Short duration for testing
            let updateCount = 0;
            
            timerBar.onUpdate(() => {
                updateCount++;
                if (updateCount >= 2) {
                    timerBar.stop();
                    expect(updateCount).toBeGreaterThanOrEqual(2);
                    done();
                }
            });
            
            timerBar.start(duration);
        });
    });
});

// Test configuration
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};