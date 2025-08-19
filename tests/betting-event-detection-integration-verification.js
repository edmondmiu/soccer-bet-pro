/**
 * Integration Verification for Centralized Betting Event Detection System
 * Verifies that the betting event detection system works correctly within the game context
 */

// Test scenarios to verify
const testScenarios = [
    {
        name: 'MULTI_CHOICE_ACTION_BET Event Processing',
        event: {
            type: 'MULTI_CHOICE_ACTION_BET',
            betType: 'FOUL_OUTCOME',
            description: 'Crunching tackle near the box! What will the ref do?',
            choices: [
                { text: 'Yellow Card', odds: 2.1, result: 'YELLOW_CARD' },
                { text: 'Red Card', odds: 4.5, result: 'RED_CARD' },
                { text: 'No Card', odds: 1.8, result: 'NO_CARD' }
            ]
        },
        expectedBettingEvent: true,
        expectedPause: true
    },
    {
        name: 'GOAL Event Processing',
        event: {
            type: 'GOAL',
            team: 'HOME',
            description: 'GOAL! A stunning strike for the home team!'
        },
        expectedBettingEvent: false,
        expectedPause: false
    },
    {
        name: 'COMMENTARY Event Processing',
        event: {
            type: 'COMMENTARY',
            description: 'A great save by the keeper!'
        },
        expectedBettingEvent: false,
        expectedPause: false
    },
    {
        name: 'RESOLUTION Event Processing',
        event: {
            type: 'RESOLUTION',
            betType: 'FOUL_OUTCOME',
            result: 'YELLOW_CARD',
            description: 'The referee shows a yellow card!'
        },
        expectedBettingEvent: false,
        expectedPause: false
    },
    {
        name: 'Future Betting Event with Choices',
        event: {
            type: 'PENALTY_BET',
            description: 'Penalty awarded! Will it be scored?',
            choices: [
                { text: 'Goal', odds: 1.5, result: 'GOAL' },
                { text: 'Miss', odds: 3.0, result: 'MISS' }
            ]
        },
        expectedBettingEvent: true,
        expectedPause: true
    },
    {
        name: 'Future Betting Event with betType',
        event: {
            type: 'CORNER_BET',
            betType: 'CORNER_OUTCOME',
            description: 'Corner kick awarded!'
        },
        expectedBettingEvent: true,
        expectedPause: true
    }
];

/**
 * Verification function to test betting event detection in game context
 */
function verifyBettingEventDetection() {
    console.log('🎯 Betting Event Detection Integration Verification');
    console.log('=' .repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    // Test each scenario
    testScenarios.forEach((scenario, index) => {
        console.log(`\n${index + 1}. Testing: ${scenario.name}`);
        console.log(`   Event Type: ${scenario.event.type}`);
        console.log(`   Description: ${scenario.event.description}`);
        
        totalTests++;
        
        try {
            // Test the isBettingEvent function directly
            const game = window.game || window.soccerBettingGame;
            
            if (!game) {
                throw new Error('Game instance not found. Make sure the game is initialized.');
            }
            
            if (typeof game.isBettingEvent !== 'function') {
                throw new Error('isBettingEvent method not found on game instance.');
            }
            
            const isBetting = game.isBettingEvent(scenario.event);
            
            if (isBetting !== scenario.expectedBettingEvent) {
                throw new Error(`Expected isBettingEvent to return ${scenario.expectedBettingEvent}, but got ${isBetting}`);
            }
            
            console.log(`   ✅ isBettingEvent: ${isBetting} (expected: ${scenario.expectedBettingEvent})`);
            
            // Test pause behavior by simulating processMatchEvent
            let pauseCalled = false;
            let pauseReason = null;
            let pauseTimeout = null;
            
            // Mock the pause manager to track calls
            const originalPauseGame = game.pauseManager ? game.pauseManager.pauseGame : null;
            const originalIsPaused = game.pauseManager ? game.pauseManager.isPaused : null;
            
            if (game.pauseManager) {
                game.pauseManager.pauseGame = (reason, timeout) => {
                    pauseCalled = true;
                    pauseReason = reason;
                    pauseTimeout = timeout;
                    return true;
                };
                
                game.pauseManager.isPaused = () => false; // Ensure we're not already paused
            }
            
            // Mock addEventToFeed to avoid DOM manipulation during test
            const originalAddEventToFeed = game.addEventToFeed;
            game.addEventToFeed = () => {};
            
            // Process the event
            game.processMatchEvent(scenario.event);
            
            // Restore original methods
            if (originalPauseGame) game.pauseManager.pauseGame = originalPauseGame;
            if (originalIsPaused) game.pauseManager.isPaused = originalIsPaused;
            if (originalAddEventToFeed) game.addEventToFeed = originalAddEventToFeed;
            
            // Verify pause behavior
            if (pauseCalled !== scenario.expectedPause) {
                throw new Error(`Expected pause to be ${scenario.expectedPause ? 'called' : 'not called'}, but it was ${pauseCalled ? 'called' : 'not called'}`);
            }
            
            if (pauseCalled && pauseReason !== 'BETTING_OPPORTUNITY') {
                throw new Error(`Expected pause reason to be 'BETTING_OPPORTUNITY', but got '${pauseReason}'`);
            }
            
            if (pauseCalled && pauseTimeout !== 15000) {
                throw new Error(`Expected pause timeout to be 15000ms, but got ${pauseTimeout}ms`);
            }
            
            console.log(`   ✅ Pause behavior: ${pauseCalled ? 'Called' : 'Not called'} (expected: ${scenario.expectedPause ? 'Called' : 'Not called'})`);
            
            if (pauseCalled) {
                console.log(`   ✅ Pause reason: ${pauseReason}`);
                console.log(`   ✅ Pause timeout: ${pauseTimeout}ms`);
            }
            
            passedTests++;
            console.log(`   🎉 Test PASSED`);
            
        } catch (error) {
            failedTests++;
            console.error(`   ❌ Test FAILED: ${error.message}`);
        }
    });
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Betting event detection system is working correctly.');
    } else {
        console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the implementation.`);
    }
    
    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        success: failedTests === 0
    };
}

/**
 * Test EVENT_CLASSIFICATIONS constant accessibility
 */
function verifyEventClassifications() {
    console.log('\n🔍 Verifying EVENT_CLASSIFICATIONS constant...');
    
    try {
        // Try to access EVENT_CLASSIFICATIONS from the game module
        const game = window.game || window.soccerBettingGame;
        
        if (!game) {
            throw new Error('Game instance not found');
        }
        
        // Check if we can access the constant through the module
        if (typeof window.EVENT_CLASSIFICATIONS === 'undefined') {
            console.log('   ⚠️  EVENT_CLASSIFICATIONS not available globally, but this is expected');
            console.log('   ✅ Constant is properly encapsulated within the module');
        } else {
            console.log('   ✅ EVENT_CLASSIFICATIONS accessible globally');
            console.log(`   ✅ BETTING_EVENTS: ${window.EVENT_CLASSIFICATIONS.BETTING_EVENTS.join(', ')}`);
            console.log(`   ✅ INFORMATIONAL_EVENTS: ${window.EVENT_CLASSIFICATIONS.INFORMATIONAL_EVENTS.join(', ')}`);
            console.log(`   ✅ RESOLUTION_EVENTS: ${window.EVENT_CLASSIFICATIONS.RESOLUTION_EVENTS.join(', ')}`);
        }
        
        return true;
    } catch (error) {
        console.error(`   ❌ Error verifying EVENT_CLASSIFICATIONS: ${error.message}`);
        return false;
    }
}

/**
 * Main verification function
 */
function runIntegrationVerification() {
    console.log('🚀 Starting Betting Event Detection Integration Verification\n');
    
    const classificationResult = verifyEventClassifications();
    const detectionResult = verifyBettingEventDetection();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 FINAL RESULT');
    console.log('=' .repeat(60));
    
    if (classificationResult && detectionResult.success) {
        console.log('✅ Integration verification SUCCESSFUL!');
        console.log('✅ Centralized betting event detection system is working correctly.');
        console.log('✅ All betting events will now automatically pause the game.');
        console.log('✅ System is extensible for future betting event types.');
    } else {
        console.log('❌ Integration verification FAILED!');
        console.log('❌ Please review the implementation and fix any issues.');
    }
    
    return classificationResult && detectionResult.success;
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.verifyBettingEventDetection = verifyBettingEventDetection;
    window.verifyEventClassifications = verifyEventClassifications;
    window.runIntegrationVerification = runIntegrationVerification;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verifyBettingEventDetection,
        verifyEventClassifications,
        runIntegrationVerification
    };
}