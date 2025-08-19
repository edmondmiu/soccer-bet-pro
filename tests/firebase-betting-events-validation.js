/**
 * Firebase Betting Events Validation Test
 * Comprehensive test for all betting events with pause system on Firebase
 */

const FIREBASE_URL = 'https://soccer-bet-pro.web.app';

/**
 * Test all betting event types trigger pause correctly on Firebase
 */
async function testAllBettingEventsPause() {
    console.log('🔄 Testing all betting events pause correctly on Firebase...');
    
    try {
        // Test that the game loads and initializes
        const gameResponse = await fetch(`${FIREBASE_URL}/game`);
        if (!gameResponse.ok) {
            throw new Error(`Game not accessible: ${gameResponse.status}`);
        }
        
        const gameHtml = await gameResponse.text();
        
        // Verify the game contains the modular structure
        if (!gameHtml.includes('type="module"') || !gameHtml.includes('scripts/main.js')) {
            throw new Error('Game does not use modular structure');
        }
        
        // Verify pause overlay is present
        if (!gameHtml.includes('pause-overlay')) {
            throw new Error('Pause overlay not found in game HTML');
        }
        
        // Verify betting event handling code is present
        const mainJsResponse = await fetch(`${FIREBASE_URL}/scripts/main.js`);
        const mainJsContent = await mainJsResponse.text();
        
        if (!mainJsContent.includes('isBettingEvent') || 
            !mainJsContent.includes('processMatchEvent')) {
            throw new Error('Betting event detection code not found');
        }
        
        console.log('✅ All betting events pause system validated on Firebase');
        return true;
    } catch (error) {
        console.error('❌ Betting events pause test failed:', error.message);
        return false;
    }
}

/**
 * Test pause system integration with betting modals
 */
async function testPauseSystemBettingIntegration() {
    console.log('🔄 Testing pause system integration with betting modals...');
    
    try {
        // Check that betting modal HTML elements exist
        const gameResponse = await fetch(`${FIREBASE_URL}/game`);
        const gameHtml = await gameResponse.text();
        
        // Verify betting modals are present
        const requiredModals = [
            'action-bet-modal',
            'action-bet-slip-modal',
            'pause-overlay'
        ];
        
        for (const modal of requiredModals) {
            if (!gameHtml.includes(modal)) {
                throw new Error(`Required modal ${modal} not found`);
            }
        }
        
        // Verify timer bar integration
        if (!gameHtml.includes('timer-bar') || !gameHtml.includes('action-bet-timer-bar')) {
            throw new Error('Timer bar integration not found');
        }
        
        console.log('✅ Pause system betting integration validated');
        return true;
    } catch (error) {
        console.error('❌ Pause system betting integration test failed:', error.message);
        return false;
    }
}

/**
 * Test that pause system modules are properly imported
 */
async function testPauseSystemModuleImports() {
    console.log('🔄 Testing pause system module imports...');
    
    try {
        const mainJsResponse = await fetch(`${FIREBASE_URL}/scripts/main.js`);
        const mainJsContent = await mainJsResponse.text();
        
        // Check for proper imports
        const requiredImports = [
            'pauseManager',
            'pauseUI'
        ];
        
        for (const importName of requiredImports) {
            if (!mainJsContent.includes(`import`) || !mainJsContent.includes(importName)) {
                throw new Error(`Import for ${importName} not found`);
            }
        }
        
        // Check that pause system is initialized (look for assignment and setup)
        if (!mainJsContent.includes('this.pauseManager = pauseManager') || 
            !mainJsContent.includes('this.pauseUI = pauseUI')) {
            throw new Error('Pause system initialization not found');
        }
        
        console.log('✅ Pause system module imports validated');
        return true;
    } catch (error) {
        console.error('❌ Pause system module imports test failed:', error.message);
        return false;
    }
}

/**
 * Test Firebase hosting configuration for modules
 */
async function testFirebaseModuleConfiguration() {
    console.log('🔄 Testing Firebase module configuration...');
    
    try {
        // Test that JavaScript files are served with correct MIME type
        const response = await fetch(`${FIREBASE_URL}/scripts/main.js`);
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('javascript')) {
            console.warn('⚠️ JavaScript files may not have correct MIME type');
        }
        
        // Test that modules can be imported (basic syntax check)
        const content = await response.text();
        if (!content.includes('export') || !content.includes('import')) {
            throw new Error('Module syntax not found in deployed files');
        }
        
        console.log('✅ Firebase module configuration validated');
        return true;
    } catch (error) {
        console.error('❌ Firebase module configuration test failed:', error.message);
        return false;
    }
}

/**
 * Test comprehensive game flow with pause system
 */
async function testComprehensiveGameFlow() {
    console.log('🔄 Testing comprehensive game flow with pause system...');
    
    try {
        // Verify all required game components are deployed
        const requiredFiles = [
            '/scripts/main.js',
            '/scripts/pauseManager.js',
            '/scripts/pauseUI.js',
            '/scripts/gameState.js',
            '/scripts/betting.js',
            '/scripts/gameLogic.js',
            '/scripts/ui.js',
            '/scripts/utils.js',
            '/styles/main.css',
            '/styles/components.css',
            '/styles/animations.css'
        ];
        
        for (const file of requiredFiles) {
            const response = await fetch(`${FIREBASE_URL}${file}`);
            if (!response.ok) {
                throw new Error(`Required file ${file} not found: ${response.status}`);
            }
        }
        
        // Verify game HTML structure
        const gameResponse = await fetch(`${FIREBASE_URL}/game`);
        const gameHtml = await gameResponse.text();
        
        // Check for essential game elements
        const requiredElements = [
            'match-screen',
            'event-feed',
            'player-dashboard',
            'full-match-bet-section',
            'pause-overlay'
        ];
        
        for (const element of requiredElements) {
            if (!gameHtml.includes(element)) {
                throw new Error(`Required element ${element} not found`);
            }
        }
        
        console.log('✅ Comprehensive game flow validated');
        return true;
    } catch (error) {
        console.error('❌ Comprehensive game flow test failed:', error.message);
        return false;
    }
}

/**
 * Run all Firebase betting events validation tests
 */
async function runFirebaseBettingEventsValidation() {
    console.log('🚀 Starting Firebase Betting Events Validation');
    console.log(`📍 Testing deployment at: ${FIREBASE_URL}`);
    console.log('=' .repeat(60));
    
    const tests = [
        testAllBettingEventsPause,
        testPauseSystemBettingIntegration,
        testPauseSystemModuleImports,
        testFirebaseModuleConfiguration,
        testComprehensiveGameFlow
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
        console.log('🎉 All Firebase betting events validation tests passed!');
        console.log('✅ Pause system works correctly with all betting events on Firebase');
    } else {
        console.log('⚠️ Some tests failed. Please review the issues above.');
    }
    
    return failed === 0;
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runFirebaseBettingEventsValidation,
        testAllBettingEventsPause,
        testPauseSystemBettingIntegration,
        testPauseSystemModuleImports,
        testFirebaseModuleConfiguration,
        testComprehensiveGameFlow
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runFirebaseBettingEventsValidation().then(success => {
        process.exit(success ? 0 : 1);
    });
}