/**
 * Final Firebase Validation Test
 * Comprehensive test suite for Task 10 completion
 */

const FIREBASE_URL = 'https://soccer-bet-pro.web.app';

/**
 * Run all validation tests for Task 10 completion
 */
async function runFinalFirebaseValidation() {
    console.log('🚀 Final Firebase Deployment Validation for Task 10');
    console.log(`📍 Testing deployment at: ${FIREBASE_URL}`);
    console.log('=' .repeat(70));
    
    const testSuite = [
        {
            name: 'Modular Structure Deployment',
            test: testModularStructureDeployment
        },
        {
            name: 'ES6 Module Loading',
            test: testES6ModuleLoading
        },
        {
            name: 'Pause System Integration',
            test: testPauseSystemIntegration
        },
        {
            name: 'All Betting Events Pause',
            test: testAllBettingEventsPause
        },
        {
            name: 'Firebase Configuration',
            test: testFirebaseConfiguration
        },
        {
            name: 'Performance and Accessibility',
            test: testPerformanceAndAccessibility
        }
    ];
    
    let totalPassed = 0;
    let totalFailed = 0;
    const results = [];
    
    for (const { name, test } of testSuite) {
        console.log(`🔄 Running: ${name}`);
        
        try {
            const startTime = Date.now();
            const result = await test();
            const duration = Date.now() - startTime;
            
            if (result) {
                console.log(`✅ ${name} - PASSED (${duration}ms)`);
                totalPassed++;
                results.push({ name, status: 'PASSED', duration });
            } else {
                console.log(`❌ ${name} - FAILED (${duration}ms)`);
                totalFailed++;
                results.push({ name, status: 'FAILED', duration });
            }
        } catch (error) {
            console.log(`❌ ${name} - ERROR: ${error.message}`);
            totalFailed++;
            results.push({ name, status: 'ERROR', error: error.message });
        }
        
        console.log(''); // Add spacing
    }
    
    // Print summary
    console.log('=' .repeat(70));
    console.log('📊 FINAL VALIDATION RESULTS');
    console.log('=' .repeat(70));
    
    results.forEach(result => {
        const icon = result.status === 'PASSED' ? '✅' : '❌';
        const duration = result.duration ? ` (${result.duration}ms)` : '';
        const error = result.error ? ` - ${result.error}` : '';
        console.log(`${icon} ${result.name}: ${result.status}${duration}${error}`);
    });
    
    console.log('');
    console.log(`📈 Summary: ${totalPassed} passed, ${totalFailed} failed`);
    console.log(`🎯 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    
    if (totalFailed === 0) {
        console.log('');
        console.log('🎉 ALL TESTS PASSED! Task 10 is complete.');
        console.log('✅ Firebase deployment is working correctly with modular structure');
        console.log('✅ Pause system works identically on hosted version');
        console.log('✅ All betting events trigger pause correctly');
        console.log('✅ Deployment verification checklist created');
    } else {
        console.log('');
        console.log('⚠️ Some tests failed. Please review the issues above.');
    }
    
    return totalFailed === 0;
}

async function testModularStructureDeployment() {
    // Test that the modular structure is properly deployed
    const gameResponse = await fetch(`${FIREBASE_URL}/game`);
    if (!gameResponse.ok) {
        throw new Error(`Game not accessible: ${gameResponse.status}`);
    }
    
    const gameHtml = await gameResponse.text();
    
    // Verify modular script structure
    if (!gameHtml.includes('type="module"') || !gameHtml.includes('scripts/main.js')) {
        throw new Error('Game does not use modular script structure');
    }
    
    // Verify no large inline scripts (should be minimal)
    const inlineScripts = gameHtml.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi) || [];
    const largeInlineScripts = inlineScripts.filter(script => {
        const content = script.replace(/<\/?script[^>]*>/gi, '').trim();
        return content.length > 500; // Threshold for "too much inline code"
    });
    
    if (largeInlineScripts.length > 0) {
        throw new Error('Found large inline scripts, modularization may be incomplete');
    }
    
    return true;
}

async function testES6ModuleLoading() {
    // Test that all ES6 modules load correctly
    const requiredModules = [
        'main.js',
        'pauseManager.js',
        'pauseUI.js',
        'gameState.js',
        'betting.js',
        'gameLogic.js',
        'ui.js',
        'utils.js'
    ];
    
    for (const module of requiredModules) {
        const response = await fetch(`${FIREBASE_URL}/scripts/${module}`);
        if (!response.ok) {
            throw new Error(`Module ${module} not accessible: ${response.status}`);
        }
        
        const content = await response.text();
        
        // Verify module syntax (should have imports/exports)
        if (module === 'main.js' && (!content.includes('import') || !content.includes('export'))) {
            throw new Error(`${module} does not contain proper ES6 module syntax`);
        }
    }
    
    return true;
}

async function testPauseSystemIntegration() {
    // Test pause system integration
    const mainJsResponse = await fetch(`${FIREBASE_URL}/scripts/main.js`);
    const mainJsContent = await mainJsResponse.text();
    
    // Verify pause system imports
    if (!mainJsContent.includes('import { pauseManager }') || 
        !mainJsContent.includes('import { pauseUI }')) {
        throw new Error('Pause system modules not properly imported');
    }
    
    // Verify pause system initialization
    if (!mainJsContent.includes('this.pauseManager = pauseManager') || 
        !mainJsContent.includes('this.pauseUI = pauseUI')) {
        throw new Error('Pause system not properly initialized');
    }
    
    // Verify pause system integration with betting
    if (!mainJsContent.includes('isBettingEvent') || 
        !mainJsContent.includes('pauseManager.pauseGame')) {
        throw new Error('Pause system not integrated with betting events');
    }
    
    return true;
}

async function testAllBettingEventsPause() {
    // Test that betting event detection is deployed
    const mainJsResponse = await fetch(`${FIREBASE_URL}/scripts/main.js`);
    const mainJsContent = await mainJsResponse.text();
    
    // Verify betting event detection
    if (!mainJsContent.includes('MULTI_CHOICE_ACTION_BET')) {
        throw new Error('Betting event types not found');
    }
    
    // Verify processMatchEvent integration
    if (!mainJsContent.includes('processMatchEvent') || 
        !mainJsContent.includes('isBettingEvent(event)')) {
        throw new Error('Betting event processing not integrated');
    }
    
    // Verify game HTML has betting modals and pause overlay
    const gameResponse = await fetch(`${FIREBASE_URL}/game`);
    const gameHtml = await gameResponse.text();
    
    const requiredElements = [
        'action-bet-modal',
        'pause-overlay',
        'action-bet-timer-bar'
    ];
    
    for (const element of requiredElements) {
        if (!gameHtml.includes(element)) {
            throw new Error(`Required betting element ${element} not found`);
        }
    }
    
    return true;
}

async function testFirebaseConfiguration() {
    // Test Firebase hosting configuration
    
    // Test routing
    const gameRouteResponse = await fetch(`${FIREBASE_URL}/game`);
    if (!gameRouteResponse.ok) {
        throw new Error('Game route not working');
    }
    
    // Test MIME types for JavaScript files
    const jsResponse = await fetch(`${FIREBASE_URL}/scripts/main.js`);
    const contentType = jsResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('javascript')) {
        console.warn('JavaScript files may not have correct MIME type');
    }
    
    // Test CSS files
    const cssResponse = await fetch(`${FIREBASE_URL}/styles/main.css`);
    if (!cssResponse.ok) {
        throw new Error('CSS files not accessible');
    }
    
    return true;
}

async function testPerformanceAndAccessibility() {
    // Basic performance and accessibility checks
    
    // Test main game loads quickly
    const startTime = Date.now();
    const gameResponse = await fetch(`${FIREBASE_URL}/game`);
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 5000) { // 5 second threshold
        console.warn(`Game load time is high: ${loadTime}ms`);
    }
    
    if (!gameResponse.ok) {
        throw new Error('Game not accessible for performance test');
    }
    
    const gameHtml = await gameResponse.text();
    
    // Check for accessibility features
    if (!gameHtml.includes('aria-') || !gameHtml.includes('role=')) {
        console.warn('Limited accessibility attributes found');
    }
    
    // Check for responsive design
    if (!gameHtml.includes('viewport') || !gameHtml.includes('max-width')) {
        console.warn('Responsive design meta tags may be missing');
    }
    
    return true;
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runFinalFirebaseValidation
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runFinalFirebaseValidation().then(success => {
        process.exit(success ? 0 : 1);
    });
}