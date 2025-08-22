/**
 * Simple UIManager tests focusing on core functionality
 * Tests the main methods and structure without complex DOM interactions
 */

// Simple DOM mocks
global.window = {
    innerWidth: 1024,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
};

global.document = {
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        textContent: '',
        style: { cssText: '' },
        dataset: {},
        innerHTML: '',
        appendChild: () => {},
        removeChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        parentNode: null
    }),
    getElementById: (id) => ({
        id,
        className: id === 'app' ? 'app-container' : '',
        appendChild: () => {},
        removeChild: () => {}
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
        appendChild: () => {},
        removeChild: () => {},
        innerHTML: ''
    },
    head: {
        appendChild: () => {}
    }
};

if (!global.navigator) {
    global.navigator = {};
}
if (!global.performance) {
    global.performance = { now: () => Date.now() };
}

// Import UIManager after DOM setup
const { UIManager } = await import('./UIManager.js');

// Simple test runner
class SimpleTestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            this.failed++;
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    summary() {
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

const runner = new SimpleTestRunner();

console.log('🧪 Running Simple UIManager Tests\n');

// Test 1: UIManager instantiation
runner.test('UIManager can be instantiated', () => {
    const uiManager = new UIManager();
    runner.assert(uiManager instanceof UIManager, 'Should create UIManager instance');
    runner.assert(typeof uiManager.initialize === 'function', 'Should have initialize method');
    runner.assert(typeof uiManager.showScreen === 'function', 'Should have showScreen method');
    runner.assert(typeof uiManager.showNotification === 'function', 'Should have showNotification method');
    uiManager.destroy();
});

// Test 2: Screen management
runner.test('Screen management works correctly', () => {
    const uiManager = new UIManager();
    
    // Mock screen
    const mockScreen = {
        render: () => document.createElement('div'),
        update: () => {},
        initialize: () => {}
    };
    
    uiManager.registerScreen('test', mockScreen);
    runner.assert(uiManager.screens.has('test'), 'Should register screen');
    runner.assert(uiManager.screens.get('test') === mockScreen, 'Should store screen correctly');
    
    uiManager.destroy();
});

// Test 3: Notification system
runner.test('Notification system works', () => {
    const uiManager = new UIManager();
    
    const notificationId = uiManager.showNotification('Test message', 'info');
    runner.assert(typeof notificationId === 'number', 'Should return notification ID');
    runner.assert(uiManager.notifications.length === 1, 'Should add notification to array');
    
    const notification = uiManager.notifications[0];
    runner.assert(notification.message === 'Test message', 'Should store message correctly');
    runner.assert(notification.type === 'info', 'Should store type correctly');
    
    uiManager.destroy();
});

// Test 4: State integration
runner.test('State integration works', () => {
    const uiManager = new UIManager();
    
    // Mock StateManager
    const mockStateManager = {
        state: { currentScreen: 'lobby' },
        subscribers: [],
        getState() { return { ...this.state }; },
        subscribe(callback) { this.subscribers.push(callback); },
        updateState(updates) { 
            this.state = { ...this.state, ...updates };
            this.subscribers.forEach(cb => cb(this.state));
        }
    };
    
    uiManager.initialize(mockStateManager);
    runner.assert(uiManager.stateManager === mockStateManager, 'Should store StateManager reference');
    runner.assert(mockStateManager.subscribers.length === 1, 'Should subscribe to state changes');
    
    uiManager.destroy();
});

// Test 5: Mobile detection
runner.test('Mobile detection works', () => {
    const uiManager = new UIManager();
    
    // Test desktop
    global.window.innerWidth = 1024;
    runner.assert(!uiManager.isMobile(), 'Should not detect mobile for wide screen');
    
    // Test mobile
    global.window.innerWidth = 500;
    runner.assert(uiManager.isMobile(), 'Should detect mobile for narrow screen');
    
    uiManager.destroy();
});

// Test 6: Cleanup
runner.test('Cleanup works properly', () => {
    const uiManager = new UIManager();
    
    // Add some data
    uiManager.showNotification('Test');
    uiManager.registerScreen('test', { render: () => {} });
    
    runner.assert(uiManager.notifications.length > 0, 'Should have notifications before cleanup');
    runner.assert(uiManager.screens.size > 0, 'Should have screens before cleanup');
    
    uiManager.destroy();
    
    runner.assert(uiManager.notifications.length === 0, 'Should clear notifications');
    runner.assert(uiManager.screens.size === 0, 'Should clear screens');
    runner.assert(uiManager.currentScreen === null, 'Should reset current screen');
    runner.assert(uiManager.stateManager === null, 'Should reset state manager');
});

// Test 7: Display updates
runner.test('Display update methods exist', () => {
    const uiManager = new UIManager();
    
    runner.assert(typeof uiManager.updateDisplay === 'function', 'Should have updateDisplay method');
    runner.assert(typeof uiManager.updateWalletDisplay === 'function', 'Should have updateWalletDisplay method');
    runner.assert(typeof uiManager.updateTimerDisplay === 'function', 'Should have updateTimerDisplay method');
    runner.assert(typeof uiManager.updateScoreDisplay === 'function', 'Should have updateScoreDisplay method');
    runner.assert(typeof uiManager.updateOddsDisplay === 'function', 'Should have updateOddsDisplay method');
    
    // Test that methods don't throw errors
    uiManager.updateDisplay({ wallet: 1000 });
    uiManager.updateWalletDisplay(1000);
    uiManager.updateTimerDisplay(45);
    uiManager.updateScoreDisplay({ homeScore: 1, awayScore: 0 });
    uiManager.updateOddsDisplay({ home: 1.85, draw: 3.50, away: 4.20 });
    
    uiManager.destroy();
});

// Test 8: Loading states
runner.test('Loading states work', () => {
    const uiManager = new UIManager();
    
    runner.assert(typeof uiManager.showLoading === 'function', 'Should have showLoading method');
    runner.assert(typeof uiManager.hideLoading === 'function', 'Should have hideLoading method');
    
    uiManager.showLoading('Test loading');
    const hasLoadingNotification = uiManager.notifications.some(n => 
        n.message.includes('loading-spinner')
    );
    runner.assert(hasLoadingNotification, 'Should create loading notification');
    
    uiManager.hideLoading();
    const hasRemainingLoading = uiManager.notifications.some(n => 
        n.message.includes('loading-spinner')
    );
    runner.assert(!hasRemainingLoading, 'Should remove loading notifications');
    
    uiManager.destroy();
});

// Test 9: Event handling methods
runner.test('Event handling methods exist', () => {
    const uiManager = new UIManager();
    
    runner.assert(typeof uiManager.setupEventListeners === 'function', 'Should have setupEventListeners method');
    runner.assert(typeof uiManager.handleEscapeKey === 'function', 'Should have handleEscapeKey method');
    runner.assert(typeof uiManager.handleResize === 'function', 'Should have handleResize method');
    
    // Test that methods don't throw errors
    uiManager.handleEscapeKey();
    uiManager.handleResize();
    
    uiManager.destroy();
});

// Test 10: Utility methods
runner.test('Utility methods work', () => {
    const uiManager = new UIManager();
    
    runner.assert(typeof uiManager.getCurrentScreen === 'function', 'Should have getCurrentScreen method');
    runner.assert(uiManager.getCurrentScreen() === null, 'Should start with no current screen');
    
    // Mock screen transition
    uiManager.currentScreen = 'test';
    runner.assert(uiManager.getCurrentScreen() === 'test', 'Should return current screen');
    
    uiManager.destroy();
});

const success = runner.summary();

if (success) {
    console.log('\n🎉 All core functionality tests passed!');
} else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
}