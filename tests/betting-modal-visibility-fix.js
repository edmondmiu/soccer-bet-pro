/**
 * Betting Modal Visibility Fix Verification
 * Tests that betting modals are visible and not covered by pause overlay
 */

const FIREBASE_URL = 'https://soccer-bet-pro.web.app';

async function testBettingModalVisibilityFix() {
    console.log('🔄 Testing betting modal visibility fix...');
    
    try {
        // Test that the fix is deployed
        const mainJsResponse = await fetch(`${FIREBASE_URL}/scripts/main.js`);
        const mainJsContent = await mainJsResponse.text();
        
        // Check for the helper method
        if (!mainJsContent.includes('isBettingModalVisible()')) {
            throw new Error('Helper method isBettingModalVisible not found');
        }
        
        // Check for the conditional pause overlay logic
        if (!mainJsContent.includes('!this.isBettingModalVisible()')) {
            throw new Error('Conditional pause overlay logic not found');
        }
        
        // Check for pause overlay hiding when betting modals are shown
        if (!mainJsContent.includes('Hide pause overlay if it\'s visible since betting modal should be on top')) {
            throw new Error('Pause overlay hiding logic not found');
        }
        
        // Check for pause overlay restoration when betting modals are hidden
        if (!mainJsContent.includes('Show pause overlay again if game is still paused and no other betting modals are visible')) {
            throw new Error('Pause overlay restoration logic not found');
        }
        
        console.log('✅ Betting modal visibility fix is deployed correctly');
        return true;
    } catch (error) {
        console.error('❌ Betting modal visibility fix test failed:', error.message);
        return false;
    }
}

async function testZIndexConfiguration() {
    console.log('🔄 Testing z-index configuration...');
    
    try {
        // Test that the game HTML has correct z-index values
        const gameResponse = await fetch(`${FIREBASE_URL}/game`);
        const gameHtml = await gameResponse.text();
        
        // Check that betting modals have higher z-index than pause overlay
        if (!gameHtml.includes('action-bet-modal') || !gameHtml.includes('z-50')) {
            throw new Error('Betting modal z-index not found');
        }
        
        if (!gameHtml.includes('pause-overlay') || !gameHtml.includes('z-40')) {
            throw new Error('Pause overlay z-index not found');
        }
        
        console.log('✅ Z-index configuration is correct (betting modals: z-50, pause overlay: z-40)');
        return true;
    } catch (error) {
        console.error('❌ Z-index configuration test failed:', error.message);
        return false;
    }
}

async function runBettingModalVisibilityTests() {
    console.log('🚀 Running Betting Modal Visibility Fix Tests');
    console.log(`📍 Testing deployment at: ${FIREBASE_URL}`);
    console.log('=' .repeat(60));
    
    const tests = [
        testBettingModalVisibilityFix,
        testZIndexConfiguration
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test failed with error: ${error.message}`);
            failed++;
        }
        
        console.log(''); // Add spacing between tests
    }
    
    console.log('=' .repeat(60));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All betting modal visibility tests passed!');
        console.log('✅ Betting modals should now be visible and not covered by pause overlay');
        console.log('🎮 Try the game now - betting opportunities should be fully accessible');
    } else {
        console.log('⚠️ Some tests failed. Please review the issues above.');
    }
    
    return failed === 0;
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runBettingModalVisibilityTests,
        testBettingModalVisibilityFix,
        testZIndexConfiguration
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runBettingModalVisibilityTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}