/**
 * TimerManager Tests
 * 
 * Tests for match timer, countdown functionality, and pause/resume cycles
 */

import { TimerManager } from './TimerManager.js';

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createMockCallbacks = () => ({
    onMatchTimeUpdate: jest.fn ? jest.fn() : () => {},
    onCountdownUpdate: jest.fn ? jest.fn() : () => {},
    onCountdownComplete: jest.fn ? jest.fn() : () => {}
});

// Test Suite
describe('TimerManager', () => {
    let timerManager;
    let mockCallbacks;

    beforeEach(() => {
        timerManager = new TimerManager();
        mockCallbacks = createMockCallbacks();
        timerManager.setCallbacks(mockCallbacks);
    });

    afterEach(() => {
        timerManager.reset();
    });

    describe('Match Timer Functionality', () => {
        test('should initialize with correct default state', () => {
            expect(timerManager.isMatchRunning()).toBe(false);
            expect(timerManager.isMatchPaused()).toBe(false);
            expect(timerManager.getMatchTime()).toBe(0);
        });

        test('should start match timer correctly', () => {
            timerManager.startMatch();
            
            expect(timerManager.isMatchRunning()).toBe(true);
            expect(timerManager.isMatchPaused()).toBe(false);
            expect(timerManager.getMatchTime()).toBeGreaterThanOrEqual(0);
        });

        test('should track match time progression', async () => {
            timerManager.startMatch();
            
            await sleep(1100); // Wait slightly more than 1 second
            
            const matchTime = timerManager.getMatchTime();
            expect(matchTime).toBeGreaterThan(0);
            expect(matchTime).toBeLessThan(0.1); // Should be less than 0.1 minutes (6 seconds)
        });

        test('should prevent starting timer when already running', () => {
            timerManager.startMatch();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            timerManager.startMatch(); // Try to start again
            
            expect(consoleSpy).toHaveBeenCalledWith('Match timer is already running');
            consoleSpy.mockRestore();
        });

        test('should stop match timer correctly', () => {
            timerManager.startMatch();
            timerManager.stopMatch();
            
            expect(timerManager.isMatchRunning()).toBe(false);
            expect(timerManager.isMatchPaused()).toBe(false);
        });
    });

    describe('Pause/Resume Functionality', () => {
        test('should pause match timer correctly', async () => {
            timerManager.startMatch();
            await sleep(500);
            
            const timeBeforePause = timerManager.getMatchTime();
            timerManager.pauseTimer();
            
            expect(timerManager.isMatchPaused()).toBe(true);
            expect(timerManager.isMatchRunning()).toBe(true); // Still running, just paused
            
            await sleep(500);
            const timeAfterPause = timerManager.getMatchTime();
            
            // Time should not have progressed during pause
            expect(timeAfterPause).toBeCloseTo(timeBeforePause, 5);
        });

        test('should resume match timer correctly', async () => {
            timerManager.startMatch();
            await sleep(300);
            
            timerManager.pauseTimer();
            await sleep(500); // Pause for 500ms
            
            const timeBeforeResume = timerManager.getMatchTime();
            timerManager.resumeTimer();
            
            expect(timerManager.isMatchPaused()).toBe(false);
            expect(timerManager.isMatchRunning()).toBe(true);
            
            await sleep(300);
            const timeAfterResume = timerManager.getMatchTime();
            
            // Time should have progressed after resume
            expect(timeAfterResume).toBeGreaterThan(timeBeforeResume);
        });

        test('should handle multiple pause/resume cycles', async () => {
            timerManager.startMatch();
            
            // First cycle
            await sleep(200);
            timerManager.pauseTimer();
            await sleep(300);
            timerManager.resumeTimer();
            
            // Second cycle
            await sleep(200);
            timerManager.pauseTimer();
            await sleep(300);
            timerManager.resumeTimer();
            
            await sleep(200);
            
            const finalTime = timerManager.getMatchTime();
            expect(finalTime).toBeGreaterThan(0);
            
            const status = timerManager.getStatus();
            expect(status.match.totalPausedDuration).toBeGreaterThan(0.5); // At least 600ms of pause
        });

        test('should prevent pausing when not running', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            timerManager.pauseTimer();
            
            expect(consoleSpy).toHaveBeenCalledWith('Cannot pause timer - not running or already paused');
            consoleSpy.mockRestore();
        });

        test('should prevent resuming when not paused', () => {
            timerManager.startMatch();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            timerManager.resumeTimer(); // Try to resume when not paused
            
            expect(consoleSpy).toHaveBeenCalledWith('Cannot resume timer - not running or not paused');
            consoleSpy.mockRestore();
        });
    });

    describe('Countdown Timer Functionality', () => {
        test('should start countdown timer correctly', () => {
            const callback = jest.fn ? jest.fn() : () => {};
            
            timerManager.startCountdown(10, callback);
            
            expect(timerManager.isCountdownRunning()).toBe(true);
            expect(timerManager.getCountdownTime()).toBeCloseTo(10, 1);
        });

        test('should update countdown time correctly', async () => {
            timerManager.startCountdown(2);
            
            const initialTime = timerManager.getCountdownTime();
            expect(initialTime).toBeCloseTo(2, 1);
            
            await sleep(500);
            
            const updatedTime = timerManager.getCountdownTime();
            expect(updatedTime).toBeLessThan(initialTime);
            expect(updatedTime).toBeGreaterThan(1);
        });

        test('should complete countdown and call callback', async () => {
            const callback = jest.fn ? jest.fn() : () => {};
            
            timerManager.startCountdown(0.5, callback); // 500ms countdown
            
            await sleep(600);
            
            expect(timerManager.isCountdownRunning()).toBe(false);
            expect(timerManager.getCountdownTime()).toBe(0);
            
            if (jest.fn) {
                expect(callback).toHaveBeenCalled();
            }
        });

        test('should stop countdown manually', () => {
            timerManager.startCountdown(10);
            
            expect(timerManager.isCountdownRunning()).toBe(true);
            
            timerManager.stopCountdown();
            
            expect(timerManager.isCountdownRunning()).toBe(false);
            expect(timerManager.getCountdownTime()).toBe(0);
        });

        test('should replace existing countdown when starting new one', () => {
            timerManager.startCountdown(10);
            const firstCountdownTime = timerManager.getCountdownTime();
            
            timerManager.startCountdown(5);
            const secondCountdownTime = timerManager.getCountdownTime();
            
            expect(secondCountdownTime).toBeLessThan(firstCountdownTime);
            expect(secondCountdownTime).toBeCloseTo(5, 1);
        });
    });

    describe('Timer Synchronization and Accuracy', () => {
        test('should validate timer accuracy', () => {
            const validation = timerManager.validateTimerAccuracy();
            
            expect(validation).toHaveProperty('isAccurate');
            expect(validation).toHaveProperty('drift');
            expect(validation).toHaveProperty('syncStatus');
            expect(validation.isAccurate).toBe(true);
            expect(validation.syncStatus).toBe('good');
        });

        test('should detect timer drift', async () => {
            // First validation to set baseline
            timerManager.validateTimerAccuracy();
            
            // Simulate time passage
            await sleep(1200); // More than 1 second
            
            const validation = timerManager.validateTimerAccuracy();
            
            expect(validation.drift).toBeGreaterThan(100); // Should detect drift > 100ms
        });

        test('should provide comprehensive status', () => {
            timerManager.startMatch();
            timerManager.startCountdown(5);
            
            const status = timerManager.getStatus();
            
            expect(status).toHaveProperty('match');
            expect(status).toHaveProperty('countdown');
            expect(status).toHaveProperty('accuracy');
            
            expect(status.match.isRunning).toBe(true);
            expect(status.countdown.isRunning).toBe(true);
            expect(status.accuracy.isAccurate).toBe(true);
        });
    });

    describe('Callback Integration', () => {
        test('should call match time update callback', async () => {
            if (!jest.fn) return; // Skip if no jest mocking available
            
            timerManager.startMatch();
            
            await sleep(1100);
            
            expect(mockCallbacks.onMatchTimeUpdate).toHaveBeenCalled();
        });

        test('should call countdown update callback', async () => {
            if (!jest.fn) return; // Skip if no jest mocking available
            
            timerManager.startCountdown(1);
            
            await sleep(200);
            
            expect(mockCallbacks.onCountdownUpdate).toHaveBeenCalled();
        });

        test('should call countdown complete callback', async () => {
            if (!jest.fn) return; // Skip if no jest mocking available
            
            timerManager.startCountdown(0.3);
            
            await sleep(400);
            
            expect(mockCallbacks.onCountdownComplete).toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should cap match time at 90 minutes', () => {
            // Simulate 90+ minutes by manipulating internal state
            timerManager.startMatch();
            timerManager.matchTimer.startTime = Date.now() - (91 * 60 * 1000); // 91 minutes ago
            
            const matchTime = timerManager.getMatchTime();
            expect(matchTime).toBeLessThanOrEqual(90);
        });

        test('should handle countdown with zero duration', () => {
            const callback = jest.fn ? jest.fn() : () => {};
            
            timerManager.startCountdown(0, callback);
            
            expect(timerManager.getCountdownTime()).toBe(0);
        });

        test('should reset all timers correctly', () => {
            timerManager.startMatch();
            timerManager.startCountdown(10);
            
            timerManager.reset();
            
            expect(timerManager.isMatchRunning()).toBe(false);
            expect(timerManager.isCountdownRunning()).toBe(false);
            expect(timerManager.getMatchTime()).toBe(0);
            expect(timerManager.getCountdownTime()).toBe(0);
        });

        test('should handle negative countdown gracefully', () => {
            timerManager.startCountdown(-5);
            
            expect(timerManager.getCountdownTime()).toBe(0);
        });
    });

    describe('Integration with Action Betting Requirements', () => {
        test('should support 10-second action betting window', async () => {
            const callback = jest.fn ? jest.fn() : () => {};
            
            // Start 10-second countdown as per requirement 4.4
            timerManager.startCountdown(10, callback);
            
            expect(timerManager.getCountdownTime()).toBeCloseTo(10, 1);
            expect(timerManager.isCountdownRunning()).toBe(true);
            
            // Verify countdown progresses
            await sleep(1100);
            expect(timerManager.getCountdownTime()).toBeLessThan(9);
        });

        test('should coordinate pause/resume with action betting', async () => {
            // Start match timer
            timerManager.startMatch();
            await sleep(300);
            
            // Pause for action betting (requirement 4.6)
            timerManager.pauseTimer();
            expect(timerManager.isMatchPaused()).toBe(true);
            
            // Start action betting countdown
            timerManager.startCountdown(10);
            expect(timerManager.isCountdownRunning()).toBe(true);
            
            // Resume after action betting
            timerManager.resumeTimer();
            expect(timerManager.isMatchPaused()).toBe(false);
            expect(timerManager.isMatchRunning()).toBe(true);
        });
    });
});

// Browser-compatible test runner
if (typeof window !== 'undefined') {
    // Simple browser test runner
    window.runTimerManagerTests = async () => {
        console.log('Running TimerManager Tests...');
        
        const timerManager = new TimerManager();
        const results = [];
        
        // Basic functionality test
        try {
            timerManager.startMatch();
            await sleep(1000);
            const time1 = timerManager.getMatchTime();
            
            timerManager.pauseTimer();
            await sleep(500);
            const time2 = timerManager.getMatchTime();
            
            timerManager.resumeTimer();
            await sleep(1000);
            const time3 = timerManager.getMatchTime();
            
            results.push({
                test: 'Match Timer Basic Functionality',
                passed: time1 > 0 && Math.abs(time2 - time1) < 0.01 && time3 > time2,
                details: { time1, time2, time3 }
            });
        } catch (error) {
            results.push({
                test: 'Match Timer Basic Functionality',
                passed: false,
                error: error.message
            });
        }
        
        // Countdown test
        try {
            let countdownCompleted = false;
            timerManager.startCountdown(1, () => { countdownCompleted = true; });
            
            await sleep(1200);
            
            results.push({
                test: 'Countdown Timer Functionality',
                passed: countdownCompleted && !timerManager.isCountdownRunning(),
                details: { countdownCompleted, isRunning: timerManager.isCountdownRunning() }
            });
        } catch (error) {
            results.push({
                test: 'Countdown Timer Functionality',
                passed: false,
                error: error.message
            });
        }
        
        // Status test
        try {
            const status = timerManager.getStatus();
            const hasRequiredProperties = status.match && status.countdown && status.accuracy;
            
            results.push({
                test: 'Timer Status and Validation',
                passed: hasRequiredProperties,
                details: status
            });
        } catch (error) {
            results.push({
                test: 'Timer Status and Validation',
                passed: false,
                error: error.message
            });
        }
        
        timerManager.reset();
        
        console.log('TimerManager Test Results:', results);
        return results;
    };
}

export { TimerManager };