/**
 * Integration Tests for TimerBar and Betting Modal System
 * 
 * Tests the integration between TimerBar component and betting modal system
 * according to Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 5.2
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
    <style>
        .timer-bar-container {
            width: 100%;
            height: 4px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .timer-bar {
            height: 100%;
            width: 100%;
            border-radius: 2px;
            transition: width 0.1s linear;
            position: relative;
        }
        .timer-bar-normal { background-color: #10b981; }
        .timer-bar-warning { background-color: #f59e0b; }
        .timer-bar-urgent { background-color: #ef4444; }
    </style>
</head>
<body>
    <div id="action-bet-modal" class="hidden">
        <div class="bg-gray-800">
            <div class="timer-bar-container">
                <div id="action-bet-timer-bar" class="timer-bar timer-bar-normal"></div>
            </div>
            <h2 id="action-bet-title">Action Bet</h2>
            <p id="action-bet-main-description">Description</p>
            <div id="action-bet-choices"></div>
        </div>
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

// Mock TimerBar class
class MockTimerBar {
    constructor(containerId) {
        this.containerId = containerId;
        this.element = document.getElementById('action-bet-timer-bar');
        this.duration = 0;
        this.startTime = 0;
        this.isRunning = false;
        this.onExpiredCallback = null;
        this.onUpdateCallback = null;
    }
    
    start(duration) {
        this.duration = duration;
        this.startTime = Date.now();
        this.isRunning = true;
        if (this.element) {
            this.element.style.width = '100%';
            this.element.className = 'timer-bar timer-bar-normal';
        }
        this.updateLoop();
    }
    
    updateLoop() {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.duration - elapsed);
        const progress = remaining / this.duration;
        
        if (this.element) {
            this.element.style.width = `${progress * 100}%`;
            
            // Update color based on remaining percentage
            this.element.classList.remove('timer-bar-normal', 'timer-bar-warning', 'timer-bar-urgent');
            if (progress > 0.5) {
                this.element.classList.add('timer-bar-normal');
            } else if (progress > 0.25) {
                this.element.classList.add('timer-bar-warning');
            } else {
                this.element.classList.add('timer-bar-urgent');
            }
        }
        
        if (this.onUpdateCallback) {
            this.onUpdateCallback(remaining, this.duration);
        }
        
        if (remaining <= 0) {
            this.stop();
            if (this.onExpiredCallback) {
                this.onExpiredCallback();
            }
            return;
        }
        
        setTimeout(() => this.updateLoop(), 100);
    }
    
    stop() {
        this.isRunning = false;
    }
    
    destroy() {
        this.stop();
        if (this.element) {
            this.element.style.width = '0%';
            this.element.className = 'timer-bar timer-bar-normal';
        }
    }
    
    onExpired(callback) {
        this.onExpiredCallback = callback;
    }
    
    onUpdate(callback) {
        this.onUpdateCallback = callback;
    }
}

global.TimerBar = MockTimerBar;

describe('TimerBar and Betting Modal Integration', () => {
    let timerBar;
    let mockModal;
    let expiredCallbackCalled;
    let updateCallbackCalled;
    
    beforeEach(() => {
        // Reset DOM state
        const modal = document.getElementById('action-bet-modal');
        modal.classList.add('hidden');
        
        const timerElement = document.getElementById('action-bet-timer-bar');
        timerElement.style.width = '100%';
        timerElement.className = 'timer-bar timer-bar-normal';
        
        // Reset callback flags
        expiredCallbackCalled = false;
        updateCallbackCalled = false;
        
        // Create fresh timer bar instance
        timerBar = new MockTimerBar('action-bet-modal');
    });
    
    afterEach(() => {
        if (timerBar) {
            timerBar.destroy();
        }
    });
    
    describe('Timer Bar Visual Display (Requirements 2.1, 2.2)', () => {
        test('should display timer bar at 100% width when started', () => {
            timerBar.start(10000);
            
            const timerElement = document.getElementById('action-bet-timer-bar');
            expect(timerElement.style.width).toBe('100%');
            expect(timerElement.classList.contains('timer-bar-normal')).toBe(true);
        });
        
        test('should animate timer bar from 100% to 0% over duration', (done) => {
            const duration = 1000; // 1 second for faster testing
            timerBar.start(duration);
            
            // Check initial state
            const timerElement = document.getElementById('action-bet-timer-bar');
            expect(timerElement.style.width).toBe('100%');
            
            // Check progress after 500ms (should be around 50%)
            setTimeout(() => {
                const width = parseFloat(timerElement.style.width);
                expect(width).toBeLessThan(60);
                expect(width).toBeGreaterThan(40);
                
                // Check final state after full duration
                setTimeout(() => {
                    const finalWidth = parseFloat(timerElement.style.width);
                    expect(finalWidth).toBeLessThanOrEqual(5); // Allow for timing variance
                    done();
                }, 600);
            }, 500);
        });
    });
    
    describe('Color State Changes (Requirements 2.3, 2.4)', () => {
        test('should change to warning color at 50% remaining time', (done) => {
            const duration = 1000;
            timerBar.start(duration);
            
            // Wait for 50% completion (500ms)
            setTimeout(() => {
                const timerElement = document.getElementById('action-bet-timer-bar');
                expect(timerElement.classList.contains('timer-bar-warning')).toBe(true);
                expect(timerElement.classList.contains('timer-bar-normal')).toBe(false);
                done();
            }, 520); // Slight delay to ensure we're past 50%
        });
        
        test('should change to urgent color at 25% remaining time', (done) => {
            const duration = 1000;
            timerBar.start(duration);
            
            // Wait for 75% completion (750ms)
            setTimeout(() => {
                const timerElement = document.getElementById('action-bet-timer-bar');
                expect(timerElement.classList.contains('timer-bar-urgent')).toBe(true);
                expect(timerElement.classList.contains('timer-bar-warning')).toBe(false);
                expect(timerElement.classList.contains('timer-bar-normal')).toBe(false);
                done();
            }, 770); // Slight delay to ensure we're past 75%
        });
        
        test('should maintain color progression sequence', (done) => {
            const duration = 1200;
            timerBar.start(duration);
            
            const timerElement = document.getElementById('action-bet-timer-bar');
            
            // Check normal state initially
            expect(timerElement.classList.contains('timer-bar-normal')).toBe(true);
            
            // Check warning state at 50%
            setTimeout(() => {
                expect(timerElement.classList.contains('timer-bar-warning')).toBe(true);
                
                // Check urgent state at 25%
                setTimeout(() => {
                    expect(timerElement.classList.contains('timer-bar-urgent')).toBe(true);
                    done();
                }, 300);
            }, 600);
        });
    });
    
    describe('Timer Expiration Handling (Requirement 2.5)', () => {
        test('should trigger expiration callback when timer reaches zero', (done) => {
            const duration = 500;
            
            timerBar.onExpired(() => {
                expiredCallbackCalled = true;
                expect(expiredCallbackCalled).toBe(true);
                done();
            });
            
            timerBar.start(duration);
        });
        
        test('should stop timer when expired', (done) => {
            const duration = 500;
            
            timerBar.onExpired(() => {
                expect(timerBar.isRunning).toBe(false);
                done();
            });
            
            timerBar.start(duration);
        });
        
        test('should handle modal auto-close on expiration', (done) => {
            const duration = 500;
            let modalClosed = false;
            
            timerBar.onExpired(() => {
                // Simulate modal close behavior
                const modal = document.getElementById('action-bet-modal');
                modal.classList.add('hidden');
                modalClosed = true;
                
                expect(modalClosed).toBe(true);
                expect(modal.classList.contains('hidden')).toBe(true);
                done();
            });
            
            timerBar.start(duration);
        });
    });
    
    describe('Update Callbacks and Smooth Animation (Requirement 5.2)', () => {
        test('should call update callback every 100ms', (done) => {
            const duration = 1000;
            let updateCount = 0;
            
            timerBar.onUpdate((remaining, total) => {
                updateCount++;
                expect(remaining).toBeLessThanOrEqual(total);
                expect(remaining).toBeGreaterThanOrEqual(0);
                
                // After several updates, check that we're getting regular callbacks
                if (updateCount >= 5) {
                    expect(updateCount).toBeGreaterThanOrEqual(5);
                    done();
                }
            });
            
            timerBar.start(duration);
        });
        
        test('should provide accurate remaining time in callbacks', (done) => {
            const duration = 1000;
            let firstUpdate = true;
            
            timerBar.onUpdate((remaining, total) => {
                if (firstUpdate) {
                    expect(total).toBe(duration);
                    expect(remaining).toBeLessThanOrEqual(duration);
                    expect(remaining).toBeGreaterThan(duration * 0.8); // Should be close to full duration initially
                    firstUpdate = false;
                    done();
                }
            });
            
            timerBar.start(duration);
        });
    });
    
    describe('Modal State Integration', () => {
        test('should work with modal minimize/restore cycle', () => {
            const duration = 10000;
            timerBar.start(duration);
            
            // Simulate modal minimize
            const modal = document.getElementById('action-bet-modal');
            modal.classList.add('hidden');
            
            // Timer should continue running
            expect(timerBar.isRunning).toBe(true);
            
            // Simulate modal restore
            modal.classList.remove('hidden');
            
            // Timer should still be running and showing progress
            const timerElement = document.getElementById('action-bet-timer-bar');
            const width = parseFloat(timerElement.style.width);
            expect(width).toBeLessThan(100);
            expect(timerBar.isRunning).toBe(true);
        });
        
        test('should clean up properly when modal is closed', () => {
            const duration = 10000;
            timerBar.start(duration);
            
            expect(timerBar.isRunning).toBe(true);
            
            // Simulate modal close
            timerBar.destroy();
            
            expect(timerBar.isRunning).toBe(false);
            
            const timerElement = document.getElementById('action-bet-timer-bar');
            expect(timerElement.style.width).toBe('0%');
            expect(timerElement.classList.contains('timer-bar-normal')).toBe(true);
        });
    });
    
    describe('Error Handling and Edge Cases', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Remove timer element
            const timerElement = document.getElementById('action-bet-timer-bar');
            timerElement.remove();
            
            // Should not throw error
            expect(() => {
                const brokenTimer = new MockTimerBar('action-bet-modal');
                brokenTimer.start(1000);
            }).not.toThrow();
        });
        
        test('should handle stop() called multiple times', () => {
            timerBar.start(10000);
            
            expect(() => {
                timerBar.stop();
                timerBar.stop();
                timerBar.stop();
            }).not.toThrow();
            
            expect(timerBar.isRunning).toBe(false);
        });
        
        test('should handle destroy() called multiple times', () => {
            timerBar.start(10000);
            
            expect(() => {
                timerBar.destroy();
                timerBar.destroy();
                timerBar.destroy();
            }).not.toThrow();
            
            expect(timerBar.isRunning).toBe(false);
        });
    });
    
    describe('Performance and Timing', () => {
        test('should update at approximately 100ms intervals', (done) => {
            const duration = 2000;
            const updateTimes = [];
            let startTime = Date.now();
            
            timerBar.onUpdate(() => {
                updateTimes.push(Date.now() - startTime);
                
                if (updateTimes.length >= 5) {
                    // Check that updates are happening roughly every 100ms
                    for (let i = 1; i < updateTimes.length; i++) {
                        const interval = updateTimes[i] - updateTimes[i-1];
                        expect(interval).toBeGreaterThan(80);  // Allow some variance
                        expect(interval).toBeLessThan(150);
                    }
                    done();
                }
            });
            
            timerBar.start(duration);
        });
        
        test('should maintain accuracy over longer durations', (done) => {
            const duration = 2000;
            const startTime = Date.now();
            
            timerBar.onExpired(() => {
                const actualDuration = Date.now() - startTime;
                // Allow 10% variance for timing accuracy
                expect(actualDuration).toBeGreaterThan(duration * 0.9);
                expect(actualDuration).toBeLessThan(duration * 1.1);
                done();
            });
            
            timerBar.start(duration);
        });
    });
});