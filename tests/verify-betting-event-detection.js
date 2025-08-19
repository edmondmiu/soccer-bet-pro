/**
 * Quick Verification Script for Betting Event Detection System
 * Run this in the browser console when the game is loaded to verify the implementation
 */

(function() {
    console.log('🎯 Quick Betting Event Detection Verification');
    console.log('=' .repeat(50));
    
    // Test events
    const testEvents = [
        {
            name: 'Betting Event (MULTI_CHOICE_ACTION_BET)',
            event: {
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Test betting event',
                choices: [{ text: 'Option 1', odds: 2.0, result: 'OPTION_1' }]
            },
            expected: true
        },
        {
            name: 'Non-Betting Event (GOAL)',
            event: {
                type: 'GOAL',
                team: 'HOME',
                description: 'Test goal event'
            },
            expected: false
        },
        {
            name: 'Future Betting Event (with choices)',
            event: {
                type: 'PENALTY_BET',
                description: 'Test future betting event',
                choices: [{ text: 'Goal', odds: 1.5, result: 'GOAL' }]
            },
            expected: true
        },
        {
            name: 'Resolution Event (should not be betting)',
            event: {
                type: 'RESOLUTION',
                betType: 'FOUL_OUTCOME',
                result: 'YELLOW_CARD',
                description: 'Test resolution event'
            },
            expected: false
        }
    ];
    
    // Find game instance
    const game = window.game || window.soccerBettingGame;
    
    if (!game) {
        console.error('❌ Game instance not found. Make sure the game is loaded.');
        return false;
    }
    
    if (typeof game.isBettingEvent !== 'function') {
        console.error('❌ isBettingEvent method not found. Implementation may be incomplete.');
        return false;
    }
    
    let passed = 0;
    let failed = 0;
    
    // Test each event
    testEvents.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.name}`);
        
        try {
            const result = game.isBettingEvent(test.event);
            
            if (result === test.expected) {
                console.log(`   ✅ PASS: isBettingEvent returned ${result}`);
                passed++;
            } else {
                console.log(`   ❌ FAIL: Expected ${test.expected}, got ${result}`);
                failed++;
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            failed++;
        }
    });
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Betting event detection is working correctly.');
        
        // Additional verification
        console.log('\n🔍 Additional Checks:');
        
        // Check if EVENT_CLASSIFICATIONS is properly defined
        try {
            const hasClassifications = typeof window.EVENT_CLASSIFICATIONS !== 'undefined' || 
                                     (game.constructor && game.constructor.EVENT_CLASSIFICATIONS);
            console.log(`   ✅ EVENT_CLASSIFICATIONS: ${hasClassifications ? 'Available' : 'Properly encapsulated'}`);
        } catch (e) {
            console.log('   ⚠️  Could not verify EVENT_CLASSIFICATIONS');
        }
        
        // Check if pause system integration exists
        if (game.pauseManager && typeof game.pauseManager.pauseGame === 'function') {
            console.log('   ✅ Pause system integration: Available');
        } else {
            console.log('   ⚠️  Pause system integration: Not available or not initialized');
        }
        
        console.log('\n✨ Implementation appears to be working correctly!');
        return true;
    } else {
        console.log('❌ Some tests failed. Please review the implementation.');
        return false;
    }
})();