/**
 * Firebase Deployment Verification Test
 * Tests that the modular structure works correctly on Firebase hosting
 */

// Test configuration
const FIREBASE_URL = 'https://soccer-bet-pro.web.app';
const TEST_TIMEOUT = 30000; // 30 seconds

/**
 * Test that ES6 modules load correctly on Firebase
 */
async function testModuleLoading() {
    console.log('🔄 Testing ES6 module loading on Firebase...');
    
    try {
        // Test that main.js loads as a module
        const response = await fetch(`${FIREBASE_URL}/scripts/main.js`);
        if (!response.ok) {
            throw new Error(`Failed to load main.js: ${response.status}`);
        }
        
        const content = await response.text();
        
        // Verify it contains ES6 module syntax
        if (!content.includes('import') || !content.includes('export')) {
            throw new Error('main.js does not contain ES6 module syntax');
        }
        
        console.log('✅ ES6 modules load correctly on Firebase');
        return true;
    } catch (error) {
        console.error('❌ Module loading test failed:', error.message);
        return false;
    }
}

/**
 * Test that pause system modules are accessible
 */
async function testPauseSystemModules() {
    console.log('🔄 Testing pause system module availability...');
    
    try {
        const modules = ['pauseManager.js', 'pauseUI.js'];
        
        for (const module of modules) {
            const response = await fetch(`${FIREBASE_URL}/scripts/${module}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${module}: ${response.status}`);
            }
            
            const content = await response.text();
            if (!content.includes('export')) {
                throw new Error(`${module} does not contain export statements`);
            }
        }
        
        console.log('✅ Pause system modules are accessible on Firebase');
        return true;
    } catch (error) {
        console.error('❌ Pause system module test failed:', error.message);
        return false;
    }
}

/**
 * Test that the game HTML uses modular structure
 */
async function testGameHTMLStructure() {
    console.log('🔄 Testing game HTML modular structure...');
    
    try {
        const response = await fetch(`${FIREBASE_URL}/game_prototype.html`);
        if (!response.ok) {
            throw new Error(`Failed to load game HTML: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Check for module script tag
        if (!html.includes('type="module"') || !html.includes('src="scripts/main.js"')) {
            throw new Error('Game HTML does not use modular script structure');
        }
        
        // Check that inline scripts are minimal (should not contain game logic)
        const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatches) {
            for (const script of scriptMatches) {
                const content = script.replace(/<\/?script[^>]*>/gi, '').trim();
                if (content.length > 1000) { // Arbitrary threshold for "too much inline code"
                    console.warn('⚠️ Found large inline script block, may indicate incomplete modularization');
                }
            }
        }
        
        console.log('✅ Game HTML uses correct modular structure');
        return true;
    } catch (error) {
        console.error('❌ Game HTML structure test failed:', error.message);
        return false;
    }
}

/**
 * Test that all required script files are deployed
 */
async function testRequiredScripts() {
    console.log('🔄 Testing required script files deployment...');
    
    const requiredScripts = [
        'main.js',
        'pauseManager.js', 
        'pauseUI.js',
        'gameState.js',
        'betting.js',
        'gameLogic.js',
        'ui.js',
        'utils.js'
    ];
    
    try {
        for (const script of requiredScripts) {
            const response = await fetch(`${FIREBASE_URL}/scripts/${script}`);
            if (!response.ok) {
                throw new Error(`Required script ${script} not found: ${response.status}`);
            }
        }
        
        console.log('✅ All required scripts are deployed');
        return true;
    } catch (error) {
        console.error('❌ Required scripts test failed:', error.message);
        return false;
    }
}

/**
 * Test that CSS files are deployed correctly
 */
async function testStyleFiles() {
    console.log('🔄 Testing style files deployment...');
    
    const requiredStyles = [
        'main.css',
        'components.css',
        'animations.css'
    ];
    
    try {
        for (const style of requiredStyles) {
            const response = await fetch(`${FIREBASE_URL}/styles/${style}`);
            if (!response.ok) {
                throw new Error(`Required style ${style} not found: ${response.status}`);
            }
        }
        
        console.log('✅ All style files are deployed');
        return true;
    } catch (error) {
        console.error('❌ Style files test failed:', error.message);
        return false;
    }
}

/**
 * Test Firebase routing configuration
 */
async function testFirebaseRouting() {
    console.log('🔄 Testing Firebase routing configuration...');
    
    try {
        // Test /game route
        const gameResponse = await fetch(`${FIREBASE_URL}/game`);
        if (!gameResponse.ok) {
            throw new Error(`Game route not working: ${gameResponse.status}`);
        }
        
        const gameHtml = await gameResponse.text();
        if (!gameHtml.includes('Soccer Bet Pro')) {
            throw new Error('Game route does not serve correct content');
        }
        
        console.log('✅ Firebase routing works correctly');
        return true;
    } catch (error) {
        console.error('❌ Firebase routing test failed:', error.message);
        return false;
    }
}

/**
 * Run all deployment verification tests
 */
async function runDeploymentVerification() {
    console.log('🚀 Starting Firebase Deployment Verification Tests');
    console.log(`📍 Testing deployment at: ${FIREBASE_URL}`);
    console.log('=' .repeat(60));
    
    const tests = [
        testModuleLoading,
        testPauseSystemModules,
        testGameHTMLStructure,
        testRequiredScripts,
        testStyleFiles,
        testFirebaseRouting
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await Promise.race([
                test(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
                )
            ]);
            
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
        console.log('🎉 All deployment verification tests passed!');
        console.log('✅ Firebase deployment is working correctly with modular structure');
    } else {
        console.log('⚠️ Some tests failed. Please review the issues above.');
    }
    
    return failed === 0;
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runDeploymentVerification,
        testModuleLoading,
        testPauseSystemModules,
        testGameHTMLStructure,
        testRequiredScripts,
        testStyleFiles,
        testFirebaseRouting
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runDeploymentVerification().then(success => {
        process.exit(success ? 0 : 1);
    });
}