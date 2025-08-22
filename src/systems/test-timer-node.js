/**
 * Node.js Test Runner for TimerManager
 * 
 * Runs comprehensive tests to verify TimerManager functionality
 */

import { TimerManager } from './TimerManager.js';

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class TestRunner {
    constructor() {
        this.results = [];
        this.timerManager = new TimerManager();
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running: ${testName}`);
        try {
            const result = await testFunction();
            this.results.push({ name: testName, passed: true, result });
            console.log(`✅ PASSED: ${testName}`);
            if (result && typeof result === 'object') {
                console.log(`   Details:`, result);
            }
        } catch (error) {
            this.results.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ FAILED: ${testName}`);
            console.log(`   Error: ${error.message}`);
        }
        
        // Reset timer between tests
        this.timerManager.reset();
    }

    async runAllTests() {
        console.log('🚀 Starting TimerManager Test Suite\n');
        console.log('=' .repeat(60));

        // Basic functionality tests
        await this.runTest('Timer Initialization', () => this.testInitialization());
        await this.runTest('Match Timer Start/Stop', () => this.testMatchTimer());
        await this.runTest('Match Time Progression', () => this.testTimeProgression());

        // Pause/Resume tests
        await this.runTest('Timer Pause Functionality', () => this.testPause());
        await this.runTest('Timer Resume Functionality', () => this.testResume());
        await this.runTest('Multiple Pause/Resume Cycles', () => this.testMultiplePauseResume());

        // Countdown tests
        await this.runTest('Countdown Timer Start', () => this.testCountdownStart());
        await this.runTest('Countdown Timer Progression', () => this.testCountdownProgression());
        await this.runTest('Countdown Timer Completion', () => this.testCountdownCompletion());

        // Accuracy and validation tests
        await this.runTest('Timer Accuracy Validation', () => this.testAccuracy());
        await this.runTest('Status Reporting', () => this.testStatus());
        await this.runTest('Timer Synchronization', () => this.testSynchronization());

        // Edge cases
        await this.runTest('90-Minute Cap', () => this.test90MinuteCap());
        await this.runTest('Error Handling', () => this.testErrorHandling());

        // Requirements validation
        await this.runTest('Action Betting Integration', () => this.testActionBettingIntegration());

        this.printSummary();
    }

    // Test implementations
    testInitialization() {
        const isRunning = this.timerManager.isMatchRunning();
        const isPaused = this.timerManager.isMatchPaused();
        const time = this.timerManager.getMatchTime();
        const countdownRunning = this.timerManager.isCountdownRunning();

        if (isRunning || isPaused || time !== 0 || countdownRunning) {
            throw new Error('Timer not properly initialized');
        }

        return { isRunning, isPaused, time, countdownRunning };
    }

    async testMatchTimer() {
        // Test start
        this.timerManager.startMatch();
        const isRunningAfterStart = this.timerManager.isMatchRunning();
        
        if (!isRunningAfterStart) {
            throw new Error('Timer did not start');
        }

        await sleep(100);

        // Test stop
        this.timerManager.stopMatch();
        const isRunningAfterStop = this.timerManager.isMatchRunning();

        if (isRunningAfterStop) {
            throw new Error('Timer did not stop');
        }

        return { startedCorrectly: isRunningAfterStart, stoppedCorrectly: !isRunningAfterStop };
    }

    async testTimeProgression() {
        this.timerManager.startMatch();
        const initialTime = this.timerManager.getMatchTime();
        
        await sleep(1100); // Wait slightly more than 1 second
        
        const laterTime = this.timerManager.getMatchTime();
        const timeDifference = laterTime - initialTime;

        if (timeDifference <= 0) {
            throw new Error('Time did not progress');
        }

        if (timeDifference > 0.1) { // Should be less than 0.1 minutes (6 seconds)
            throw new Error(`Time progressed too much: ${timeDifference} minutes`);
        }

        return { initialTime, laterTime, timeDifference };
    }

    async testPause() {
        this.timerManager.startMatch();
        await sleep(300);

        const timeBeforePause = this.timerManager.getMatchTime();
        this.timerManager.pauseTimer();
        
        const isPaused = this.timerManager.isMatchPaused();
        
        await sleep(500);
        
        const timeAfterPause = this.timerManager.getMatchTime();
        const timeDifference = Math.abs(timeAfterPause - timeBeforePause);

        if (!isPaused) {
            throw new Error('Timer was not paused');
        }

        if (timeDifference > 0.01) { // Allow small floating point differences
            throw new Error(`Time progressed during pause: ${timeDifference} minutes`);
        }

        return { timeBeforePause, timeAfterPause, timeDifference, isPaused };
    }

    async testResume() {
        this.timerManager.startMatch();
        await sleep(200);
        
        this.timerManager.pauseTimer();
        await sleep(300);
        
        const timeBeforeResume = this.timerManager.getMatchTime();
        this.timerManager.resumeTimer();
        
        const isPausedAfterResume = this.timerManager.isMatchPaused();
        
        await sleep(300);
        
        const timeAfterResume = this.timerManager.getMatchTime();

        if (isPausedAfterResume) {
            throw new Error('Timer was not resumed');
        }

        if (timeAfterResume <= timeBeforeResume) {
            throw new Error('Time did not progress after resume');
        }

        return { timeBeforeResume, timeAfterResume, resumed: !isPausedAfterResume };
    }

    async testMultiplePauseResume() {
        this.timerManager.startMatch();
        
        // First cycle
        await sleep(200);
        this.timerManager.pauseTimer();
        await sleep(200);
        this.timerManager.resumeTimer();
        
        // Second cycle
        await sleep(200);
        this.timerManager.pauseTimer();
        await sleep(200);
        this.timerManager.resumeTimer();
        
        await sleep(200);
        
        const status = this.timerManager.getStatus();
        
        if (status.match.totalPausedDuration < 0.3) { // Should have at least 400ms of pause
            throw new Error('Pause duration not tracked correctly');
        }

        return { totalPausedDuration: status.match.totalPausedDuration };
    }

    testCountdownStart() {
        this.timerManager.startCountdown(5);
        
        const isRunning = this.timerManager.isCountdownRunning();
        const time = this.timerManager.getCountdownTime();

        if (!isRunning) {
            throw new Error('Countdown did not start');
        }

        if (time < 4.5 || time > 5) {
            throw new Error(`Countdown time incorrect: ${time}`);
        }

        return { isRunning, time };
    }

    async testCountdownProgression() {
        this.timerManager.startCountdown(3);
        
        const initialTime = this.timerManager.getCountdownTime();
        
        await sleep(500);
        
        const laterTime = this.timerManager.getCountdownTime();
        
        if (laterTime >= initialTime) {
            throw new Error('Countdown time did not decrease');
        }

        const decrease = initialTime - laterTime;
        if (decrease < 0.3 || decrease > 0.7) {
            throw new Error(`Countdown decrease unexpected: ${decrease}`);
        }

        return { initialTime, laterTime, decrease };
    }

    async testCountdownCompletion() {
        let callbackCalled = false;
        
        this.timerManager.startCountdown(0.5, () => {
            callbackCalled = true;
        });

        await sleep(700);

        const isRunning = this.timerManager.isCountdownRunning();
        const time = this.timerManager.getCountdownTime();

        if (isRunning) {
            throw new Error('Countdown did not complete');
        }

        if (time !== 0) {
            throw new Error(`Countdown time not zero: ${time}`);
        }

        if (!callbackCalled) {
            throw new Error('Countdown callback not called');
        }

        return { completed: !isRunning, finalTime: time, callbackCalled };
    }

    testAccuracy() {
        const validation = this.timerManager.validateTimerAccuracy();

        if (!validation.isAccurate) {
            throw new Error('Timer accuracy validation failed');
        }

        if (validation.syncStatus !== 'good') {
            throw new Error(`Sync status not good: ${validation.syncStatus}`);
        }

        return validation;
    }

    testStatus() {
        this.timerManager.startMatch();
        this.timerManager.startCountdown(5);
        
        const status = this.timerManager.getStatus();

        const requiredProperties = ['match', 'countdown', 'accuracy'];
        for (const prop of requiredProperties) {
            if (!status[prop]) {
                throw new Error(`Missing status property: ${prop}`);
            }
        }

        if (!status.match.isRunning) {
            throw new Error('Match status incorrect');
        }

        if (!status.countdown.isRunning) {
            throw new Error('Countdown status incorrect');
        }

        return status;
    }

    async testSynchronization() {
        // First validation
        const validation1 = this.timerManager.validateTimerAccuracy();
        
        await sleep(1100);
        
        // Second validation
        const validation2 = this.timerManager.validateTimerAccuracy();

        // Allow reasonable drift for JavaScript timing
        if (validation2.drift > 200) {
            throw new Error(`Excessive timer drift: ${validation2.drift}ms`);
        }

        return { validation1, validation2 };
    }

    test90MinuteCap() {
        // Simulate 91 minutes by manipulating internal state
        this.timerManager.startMatch();
        this.timerManager.matchTimer.startTime = Date.now() - (91 * 60 * 1000);
        
        const time = this.timerManager.getMatchTime();

        if (time > 90) {
            throw new Error(`Time exceeded 90 minutes: ${time}`);
        }

        return { cappedTime: time };
    }

    testErrorHandling() {
        // Test pausing when not running
        let warningCaught = false;
        const originalWarn = console.warn;
        console.warn = () => { warningCaught = true; };
        
        this.timerManager.pauseTimer();
        
        console.warn = originalWarn;

        if (!warningCaught) {
            throw new Error('Warning not issued for invalid pause');
        }

        // Test resuming when not paused
        this.timerManager.startMatch();
        warningCaught = false;
        console.warn = () => { warningCaught = true; };
        
        this.timerManager.resumeTimer();
        
        console.warn = originalWarn;

        if (!warningCaught) {
            throw new Error('Warning not issued for invalid resume');
        }

        return { pauseWarning: true, resumeWarning: true };
    }

    async testActionBettingIntegration() {
        // Test requirement 4.4: 10-second countdown for action betting
        this.timerManager.startCountdown(10);
        
        const time = this.timerManager.getCountdownTime();
        if (time < 9.5 || time > 10) {
            throw new Error('10-second countdown not working correctly');
        }

        // Test requirement 4.6: pause/resume coordination
        this.timerManager.startMatch();
        await sleep(200);
        
        // Pause for action betting
        this.timerManager.pauseTimer();
        const isPaused = this.timerManager.isMatchPaused();
        
        // Start action betting countdown while paused
        this.timerManager.startCountdown(5);
        const countdownRunning = this.timerManager.isCountdownRunning();
        
        // Resume after action betting
        this.timerManager.resumeTimer();
        const isResumed = !this.timerManager.isMatchPaused();

        if (!isPaused || !countdownRunning || !isResumed) {
            throw new Error('Action betting integration failed');
        }

        return { 
            tenSecondCountdown: time,
            pauseResumeCoordination: { isPaused, countdownRunning, isResumed }
        };
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));

        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`   • ${result.name}: ${result.error}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED! TimerManager is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the implementation.');
        }
    }
}

// Run tests
const testRunner = new TestRunner();
testRunner.runAllTests().catch(console.error);