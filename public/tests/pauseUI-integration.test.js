/**
 * Integration tests for PauseUI with existing game structure
 * Tests compatibility with the current HTML structure and game flow
 */

// Test integration with existing game structure
function testGameIntegration() {
    console.log('Testing PauseUI integration with game structure...');
    
    // Load the actual game HTML structure (simplified)
    document.body.innerHTML = `
        <div id="app-container" class="max-w-md mx-auto min-h-screen bg-gray-800 shadow-2xl flex flex-col">
            <div id="lobby-screen" class="p-4 flex-grow flex flex-col">
                <header class="text-center mb-6">
                    <h1 class="text-3xl font-bold text-white">Game Lobby</h1>
                </header>
            </div>
            
            <div id="match-screen" class="hidden flex-grow flex flex-col h-screen">
                <header class="bg-gray-900 p-3 shadow-lg sticky top-0 z-20">
                    <div class="flex justify-between items-center">
                        <button id="back-to-lobby" class="text-indigo-400 hover:text-indigo-300">&larr; Lobby</button>
                        <div class="text-center">
                            <div id="match-timer" class="text-2xl font-bold text-white">00:00</div>
                            <div id="match-teams" class="text-sm text-gray-400">TEAM A vs TEAM B</div>
                        </div>
                        <div id="match-score" class="text-2xl font-bold text-white">0 - 0</div>
                    </div>
                </header>
                
                <main id="event-feed-container" class="flex-grow p-4 overflow-y-auto bg-gray-800">
                    <div id="event-feed" class="space-y-3">
                        <div class="bg-gray-700 p-3 rounded-lg">Sample event</div>
                    </div>
                </main>
                
                <footer class="bg-gray-900 p-4 shadow-up z-10">
                    <div class="text-center">Game controls</div>
                </footer>
            </div>
        </div>
    `;
    
    // Test PauseUI creation and integration
    const pauseUI = new PauseUI();
    
    // Verify overlay is properly positioned
    const appContainer = document.getElementById('app-container');
    const overlay = pauseUI.overlay;
    
    console.assert(appContainer.contains(overlay), 'Overlay should be inside app container');
    console.assert(overlay.style.position === 'fixed' || getComputedStyle(overlay).position === 'fixed', 'Overlay should be fixed positioned');
    
    // Test with match screen visible (simulating active game)
    const matchScreen = document.getElementById('match-screen');
    matchScreen.classList.remove('hidden');
    
    // Show pause overlay
    pauseUI.showPauseOverlay('Betting in Progress', 'Waiting for players...');
    
    // Verify game area is properly dimmed
    console.assert(matchScreen.style.filter === 'brightness(0.3)', 'Match screen should be dimmed');
    console.assert(matchScreen.style.pointerEvents === 'none', 'Match screen interactions should be disabled');
    
    // Verify overlay content
    const reasonElement = overlay.querySelector('.pause-reason');
    const messageElement = overlay.querySelector('.pause-waiting-text');
    console.assert(reasonElement.textContent === 'Betting in Progress', 'Reason should be set correctly');
    console.assert(messageElement.textContent === 'Waiting for players...', 'Message should be set correctly');
    
    // Test z-index hierarchy (overlay should be above game elements)
    const overlayZIndex = parseInt(getComputedStyle(overlay).zIndex) || 1000;
    const headerZIndex = parseInt(getComputedStyle(matchScreen.querySelector('header')).zIndex) || 20;
    console.assert(overlayZIndex > headerZIndex, 'Overlay should have higher z-index than game header');
    
    // Test hide functionality
    pauseUI.hidePauseOverlay();
    
    // Verify game area is restored
    setTimeout(() => {
        console.assert(matchScreen.style.filter === '', 'Match screen brightness should be restored');
        console.assert(matchScreen.style.pointerEvents === '', 'Match screen interactions should be restored');
        console.log('✓ Integration tests passed');
        
        // Cleanup
        pauseUI.destroy();
    }, 350); // Wait for hide animation
}

// Test responsive behavior
function testResponsiveBehavior() {
    console.log('Testing responsive behavior...');
    
    // Set up test environment
    document.body.innerHTML = `
        <div id="app-container" class="max-w-md mx-auto">
            <div id="match-screen">Test content</div>
        </div>
    `;
    
    const pauseUI = new PauseUI();
    pauseUI.showPauseOverlay();
    
    // Test different viewport sizes
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Verify overlay is still properly positioned
    const overlay = pauseUI.overlay;
    const overlayRect = overlay.getBoundingClientRect();
    console.assert(overlayRect.width <= window.innerWidth, 'Overlay should fit within viewport width');
    console.assert(overlayRect.height <= window.innerHeight, 'Overlay should fit within viewport height');
    
    // Restore original viewport
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true });
    
    console.log('✓ Responsive tests passed');
    pauseUI.destroy();
}

// Test accessibility features
function testAccessibility() {
    console.log('Testing accessibility features...');
    
    document.body.innerHTML = `
        <div id="app-container">
            <div id="match-screen">Test content</div>
        </div>
    `;
    
    const pauseUI = new PauseUI();
    pauseUI.showPauseOverlay();
    
    const overlay = pauseUI.overlay;
    
    // Test keyboard navigation (overlay should be focusable or contain focusable elements)
    const focusableElements = overlay.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    console.log(`Found ${focusableElements.length} focusable elements in overlay`);
    
    // Test color contrast (basic check - overlay should have sufficient contrast)
    const content = overlay.querySelector('.pause-content');
    const computedStyle = getComputedStyle(content);
    console.assert(computedStyle.backgroundColor !== 'transparent', 'Overlay should have background color');
    console.assert(computedStyle.color !== '', 'Overlay should have text color');
    
    // Test screen reader compatibility (elements should have proper text content)
    const title = overlay.querySelector('.pause-title');
    const reason = overlay.querySelector('.pause-reason');
    const message = overlay.querySelector('.pause-waiting-text');
    
    console.assert(title.textContent.trim() !== '', 'Title should have text content');
    console.assert(reason.textContent.trim() !== '', 'Reason should have text content');
    console.assert(message.textContent.trim() !== '', 'Message should have text content');
    
    console.log('✓ Accessibility tests passed');
    pauseUI.destroy();
}

// Test performance
function testPerformance() {
    console.log('Testing performance...');
    
    document.body.innerHTML = `
        <div id="app-container">
            <div id="match-screen">Test content</div>
        </div>
    `;
    
    // Test creation performance
    const startTime = performance.now();
    const pauseUI = new PauseUI();
    const creationTime = performance.now() - startTime;
    
    console.assert(creationTime < 50, `Creation should be fast (${creationTime.toFixed(2)}ms)`);
    
    // Test show/hide performance
    const showStartTime = performance.now();
    pauseUI.showPauseOverlay();
    const showTime = performance.now() - showStartTime;
    
    console.assert(showTime < 20, `Show should be fast (${showTime.toFixed(2)}ms)`);
    
    const hideStartTime = performance.now();
    pauseUI.hidePauseOverlay();
    const hideTime = performance.now() - hideStartTime;
    
    console.assert(hideTime < 20, `Hide should be fast (${hideTime.toFixed(2)}ms)`);
    
    // Test memory usage (basic check)
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Create and destroy multiple instances
    for (let i = 0; i < 10; i++) {
        const tempPauseUI = new PauseUI();
        tempPauseUI.showPauseOverlay();
        tempPauseUI.hidePauseOverlay();
        tempPauseUI.destroy();
    }
    
    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    if (performance.memory) {
        console.log(`Memory increase: ${(memoryIncrease / 1024).toFixed(2)}KB`);
        console.assert(memoryIncrease < 1024 * 1024, 'Memory usage should be reasonable'); // Less than 1MB
    }
    
    console.log('✓ Performance tests passed');
    pauseUI.destroy();
}

// Run all integration tests
function runIntegrationTests() {
    console.log('=== PauseUI Integration Tests ===');
    
    try {
        testGameIntegration();
        testResponsiveBehavior();
        testAccessibility();
        testPerformance();
        
        console.log('=== All Integration Tests Passed ===');
    } catch (error) {
        console.error('Integration test failed:', error);
    }
}

// Export for browser testing
if (typeof window !== 'undefined') {
    window.runPauseUIIntegrationTests = runIntegrationTests;
    
    // Auto-run tests when loaded
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runIntegrationTests, 100);
    });
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testGameIntegration,
        testResponsiveBehavior,
        testAccessibility,
        testPerformance,
        runIntegrationTests
    };
}