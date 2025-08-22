/**
 * Requirements Verification for TimerManager
 * 
 * Verifies that TimerManager meets all specified requirements:
 * - Requirements: 2.1, 2.5, 4.4, 4.6
 */

import { TimerManager } from './TimerManager.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class RequirementsVerifier {
    constructor() {
        this.timerManager = new TimerManager();
        this.verificationResults = [];
    }

    async verifyRequirement(reqId, description, testFunction) {
        console.log(`\n📋 Verifying Requirement ${reqId}: ${description}`);
        try {
            const result = await testFunction();
            this.verificationResults.push({
                requirement: reqId,
                description,
                passed: true,
                result
            });
            console.log(`✅ VERIFIED: Requirement ${reqId}`);
            if (result && typeof result === 'object') {
                console.log(`   Evidence:`, result);
            }
        } catch (error) {
            this.verificationResults.push({
                requirement: reqId,
                description,
                passed: false,
                error: error.message
            });
            console.log(`❌ FAILED: Requirement ${reqId}`);
            console.log(`   Error: ${error.message}`);
        }
        
        this.timerManager.reset();
    }

    async verifyAllRequirements() {
        console.log('🔍 Starting Requirements Verification for TimerManager\n');
        console.log('=' .repeat(80));

        // Requirement 2.1: 90-minute match timer
        await this.verifyRequirement(
            '2.1',
            'WHEN a match starts THEN the system SHALL begin a 90-minute simulated timer',
            () => this.verifyRequirement2_1()
        );

        // Requirement 2.5: Match conclusion at 90 minutes
        await this.verifyRequirement(
            '2.5',
            'WHEN the timer reaches 90 minutes THEN the system SHALL conclude the match',
            () => this.verifyRequirement2_5()
        );

        // Requirement 4.4: 10-second countdown timer
        await this.verifyRequirement(
            '4.4',
            'WHEN the modal appears THEN the system SHALL start a 10-second countdown timer',
            () => this.verifyRequirement4_4()
        );

        // Requirement 4.6: Game pause/resume functionality
        await this.verifyRequirement(
            '4.6',
            'WHEN the timer expires OR player skips OR bet is placed THEN the system SHALL close the modal and when the 10-second timer finishes resume the game',
            () => this.verifyRequirement4_6()
        );

        this.printVerificationSummary();
    }

    // Requirement verification implementations
    async verifyRequirement2_1() {
        // Test that match timer starts and runs for 90 minutes
        this.timerManager.startMatch();
        
        const isRunning = this.timerManager.isMatchRunning();
        if (!isRunning) {
            throw new Error('Match timer did not start');
        }

        await sleep(1100);
        const timeProgressed = this.timerManager.getMatchTime();
        if (timeProgressed <= 0) {
            throw new Error('Match timer is not progressing');
        }

        // Test 90-minute cap
        this.timerManager.matchTimer.startTime = Date.now() - (91 * 60 * 1000);
        const cappedTime = this.timerManager.getMatchTime();
        if (cappedTime > 90) {
            throw new Error('Timer does not cap at 90 minutes');
        }

        return {
            timerStarted: isRunning,
            timeProgression: timeProgressed,
            ninetyMinuteCap: cappedTime <= 90
        };
    }

    async verifyRequirement2_5() {
        // Test that match auto-concludes at 90 minutes
        this.timerManager.startMatch();
        
        // Simulate 90+ minutes
        this.timerManager.matchTimer.startTime = Date.now() - (90.1 * 60 * 1000);
        
        // Wait for the timer to process the 90-minute mark
        await sleep(1100);
        
        const isStillRunning = this.timerManager.isMatchRunning();
        if (isStillRunning) {
            throw new Error('Match did not conclude at 90 minutes');
        }

        return {
            matchConcluded: !isStillRunning,
            finalTime: this.timerManager.getMatchTime()
        };
    }

    async verifyRequirement4_4() {
        // Test 10-second countdown timer functionality
        this.timerManager.startCountdown(10);
        
        const isRunning = this.timerManager.isCountdownRunning();
        const initialTime = this.timerManager.getCountdownTime();
        
        if (!isRunning) {
            throw new Error('10-second countdown did not start');
        }

        if (initialTime < 9.5 || initialTime > 10) {
            throw new Error(`Countdown time incorrect: ${initialTime}, expected ~10`);
        }

        // Test countdown progression
        await sleep(1100);
        const progressedTime = this.timerManager.getCountdownTime();
        
        if (progressedTime >= initialTime) {
            throw new Error('Countdown is not progressing');
        }

        const expectedDecrease = 1.0; // 1 second
        const actualDecrease = initialTime - progressedTime;
        const decreaseTolerance = 0.3; // Allow 300ms tolerance
        
        if (Math.abs(actualDecrease - expectedDecrease) > decreaseTolerance) {
            throw new Error(`Countdown progression incorrect: ${actualDecrease}, expected ~${expectedDecrease}`);
        }

        return {
            countdownStarted: isRunning,
            initialTime,
            progressedCorrectly: Math.abs(actualDecrease - expectedDecrease) <= decreaseTolerance,
            actualDecrease
        };
    }

    async verifyRequirement4_6() {
        // Test pause/resume coordination with countdown
        this.timerManager.startMatch();
        await sleep(200);
        
        // Step 1: Pause the game (simulating action betting event)
        const timeBeforePause = this.timerManager.getMatchTime();
        this.timerManager.pauseTimer();
        
        const isPaused = this.timerManager.isMatchPaused();
        if (!isPaused) {
            throw new Error('Game did not pause for action betting');
        }

        // Step 2: Start 10-second countdown during pause
        this.timerManager.startCountdown(10);
        const countdownRunning = this.timerManager.isCountdownRunning();
        
        if (!countdownRunning) {
            throw new Error('Countdown did not start during pause');
        }

        // Step 3: Verify game stays paused during countdown
        await sleep(300);
        const timeStillPaused = this.timerManager.getMatchTime();
        const timeDifference = Math.abs(timeStillPaused - timeBeforePause);
        
        if (timeDifference > 0.01) {
            throw new Error('Game time progressed during pause');
        }

        // Step 4: Resume game (simulating end of betting window)
        this.timerManager.resumeTimer();
        const isResumed = !this.timerManager.isMatchPaused();
        
        if (!isResumed) {
            throw new Error('Game did not resume after betting window');
        }

        // Step 5: Verify game time progresses after resume
        await sleep(300);
        const timeAfterResume = this.timerManager.getMatchTime();
        
        if (timeAfterResume <= timeStillPaused) {
            throw new Error('Game time did not progress after resume');
        }

        // Test countdown completion and callback
        let callbackExecuted = false;
        this.timerManager.startCountdown(0.3, () => {
            callbackExecuted = true;
        });

        await sleep(500);
        
        if (!callbackExecuted) {
            throw new Error('Countdown completion callback not executed');
        }

        return {
            gamePausedCorrectly: isPaused,
            countdownDuringPause: countdownRunning,
            gameStaysPausedDuringCountdown: timeDifference <= 0.01,
            gameResumedCorrectly: isResumed,
            timeProgressesAfterResume: timeAfterResume > timeStillPaused,
            countdownCallbackExecuted: callbackExecuted
        };
    }

    printVerificationSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 REQUIREMENTS VERIFICATION SUMMARY');
        console.log('='.repeat(80));

        const passed = this.verificationResults.filter(r => r.passed).length;
        const failed = this.verificationResults.filter(r => !r.passed).length;
        const total = this.verificationResults.length;

        console.log(`Total Requirements: ${total}`);
        console.log(`✅ Verified: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Compliance Rate: ${((passed / total) * 100).toFixed(1)}%`);

        console.log('\n📋 DETAILED RESULTS:');
        this.verificationResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} Requirement ${result.requirement}: ${result.description}`);
            if (!result.passed) {
                console.log(`   Error: ${result.error}`);
            }
        });

        if (failed > 0) {
            console.log('\n❌ FAILED REQUIREMENTS:');
            this.verificationResults.filter(r => !r.passed).forEach(result => {
                console.log(`   • Requirement ${result.requirement}: ${result.error}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        
        if (failed === 0) {
            console.log('🎉 ALL REQUIREMENTS VERIFIED! TimerManager is compliant.');
            console.log('✅ Ready for integration with other game modules.');
        } else {
            console.log('⚠️  Some requirements failed verification. Please review the implementation.');
        }

        console.log('\n📝 IMPLEMENTATION NOTES:');
        console.log('• TimerManager provides 90-minute match timing with pause/resume capability');
        console.log('• Supports 10-second countdown timers for action betting windows');
        console.log('• Includes timer accuracy validation and synchronization monitoring');
        console.log('• Provides comprehensive status reporting and error handling');
        console.log('• Integrates seamlessly with action betting pause/resume workflow');
    }
}

// Run verification
const verifier = new RequirementsVerifier();
verifier.verifyAllRequirements().catch(console.error);