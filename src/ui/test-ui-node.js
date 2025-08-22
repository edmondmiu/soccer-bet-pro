/**
 * Node.js test runner for UIManager
 * Tests UIManager functionality in a Node.js environment with DOM mocks
 */

// Mock DOM environment without JSDOM
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
        style: {},
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
        }
    }),
    getElementById: (id) => id === 'app' || id === 'notification-container' ? {
        id,
        className: '',
        appendChild: () => {},
        removeChild: () => {}
    } : null,
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

// Test utilities
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running UIManager Node.js Tests\n');

        for (const { name, testFn } of this.tests) {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed > 0) {
            process.exit(1);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Value should not be null/undefined');
        }
    }
}

// Mock StateManager for testing
class MockStateManager {
    constructor() {
        this.state = {
            currentScreen: 'lobby',
            wallet: 1000,
            match: {
                time: 0,
                homeScore: 0,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            }
        };
        this.subscribers = [];
    }

    getState() {
        return { ...this.state };
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifySubscribers();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }
}

// Mock Screen Component
class MockScreen {
    constructor(name) {
        this.name = name;
        this.renderCalled = false;
        this.updateCalled = false;
        this.initializeCalled = false;
    }

    render(data) {
        this.renderCalled = true;
        this.renderData = data;
        
        const element = document.createElement('div');
        element.className = 'mock-screen';
        element.textContent = `Mock ${this.name} Screen`;
        return element;
    }

    update(state) {
        this.updateCalled = true;
        this.updateState = state;
    }

    initialize(data) {
        this.initializeCalled = true;
        this.initializeData = data;
    }
}

// Test suite
const runner = new TestRunner();

// Initialization Tests
runner.test('UIManager should initialize properly', () => {
    const uiManager = new UIManager();
    
    runner.assertNotNull(document.getElementById('app'), 'App container should be created');
    runner.assertNotNull(document.getElementById('notification-container'), 'Notification container should be created');
    runner.assertEqual(uiManager.notifications.length, 0, 'Should start with no notifications');
    
    uiManager.destroy();
});

runner.test('UIManager should apply base styles', () => {
    const uiManager = new UIManager();
    
    const styles = document.querySelectorAll('style');
    runner.assert(styles.length > 0, 'Should have style elements');
    
    const hasUIStyles = Array.from(styles).some(style => 
        style.textContent.includes('.app-container') || 
        style.textContent.includes('.notification')
    );
    runner.assert(hasUIStyles, 'Should have UI-specific styles');
    
    uiManager.destroy();
});

// Screen Management Tests
runner.test('UIManager should register and manage screens', () => {
    const uiManager = new UIManager();
    const mockScreen = new MockScreen('Test');
    
    uiManager.registerScreen('test', mockScreen);
    
    runner.assert(uiManager.screens.has('test'), 'Should register screen');
    runner.assertEqual(uiManager.screens.get('test'), mockScreen, 'Should store correct screen');
    
    uiManager.destroy();
});

runner.test('UIManager should show screens correctly', () => {
    const uiManager = new UIManager();
    const mockScreen = new MockScreen('Test');
    
    uiManager.registerScreen('test', mockScreen);
    uiManager.showScreen('test', { testData: 'value' });
    
    runner.assertEqual(uiManager.currentScreen, 'test', 'Should set current screen');
    runner.assert(mockScreen.renderCalled, 'Should call screen render method');
    runner.assertEqual(mockScreen.renderData.testData, 'value', 'Should pass data to screen');
    runner.assert(mockScreen.initializeCalled, 'Should call screen initialize method');
    
    const screenElement = document.querySelector('.mock-screen');
    runner.assertNotNull(screenElement, 'Should add screen element to DOM');
    
    uiManager.destroy();
});

runner.test('UIManager should handle screen transitions', async () => {
    const uiManager = new UIManager();
    const screen1 = new MockScreen('Screen1');
    const screen2 = new MockScreen('Screen2');
    
    uiManager.registerScreen('screen1', screen1);
    uiManager.registerScreen('screen2', screen2);
    
    uiManager.showScreen('screen1');
    runner.assertEqual(uiManager.currentScreen, 'screen1', 'Should show first screen');
    
    uiManager.showScreen('screen2');
    runner.assertEqual(uiManager.currentScreen, 'screen2', 'Should transition to second screen');
    runner.assert(screen2.renderCalled, 'Should render second screen');
    
    uiManager.destroy();
});

// State Management Integration Tests
runner.test('UIManager should integrate with StateManager', () => {
    const uiManager = new UIManager();
    const stateManager = new MockStateManager();
    const mockScreen = new MockScreen('Test');
    
    uiManager.registerScreen('lobby', mockScreen);
    uiManager.initialize(stateManager);
    
    runner.assertEqual(uiManager.stateManager, stateManager, 'Should store StateManager reference');
    runner.assertEqual(stateManager.subscribers.length, 1, 'Should subscribe to state changes');
    runner.assert(mockScreen.renderCalled, 'Should render initial screen');
    
    uiManager.destroy();
});

runner.test('UIManager should respond to state changes', () => {
    const uiManager = new UIManager();
    const stateManager = new MockStateManager();
    const mockScreen = new MockScreen('Test');
    
    uiManager.registerScreen('test', mockScreen);
    uiManager.initialize(stateManager);
    
    // Reset render flag
    mockScreen.renderCalled = false;
    
    // Change to different screen
    stateManager.updateState({ currentScreen: 'test' });
    
    runner.assertEqual(uiManager.currentScreen, 'test', 'Should change to new screen');
    runner.assert(mockScreen.renderCalled, 'Should render new screen');
    
    uiManager.destroy();
});

runner.test('UIManager should update current screen on state changes', () => {
    const uiManager = new UIManager();
    const stateManager = new MockStateManager();
    const mockScreen = new MockScreen('Test');
    
    uiManager.registerScreen('lobby', mockScreen);
    uiManager.initialize(stateManager);
    
    // Update state without changing screen
    stateManager.updateState({ wallet: 500 });
    
    runner.assert(mockScreen.updateCalled, 'Should call screen update method');
    runner.assertEqual(mockScreen.updateState.wallet, 500, 'Should pass updated state');
    
    uiManager.destroy();
});

// Notification System Tests
runner.test('UIManager should create notifications', () => {
    const uiManager = new UIManager();
    
    const notificationId = uiManager.showNotification('Test message', 'success', 'Test Title');
    
    runner.assert(typeof notificationId === 'number', 'Should return notification ID');
    runner.assertEqual(uiManager.notifications.length, 1, 'Should add notification to array');
    
    const notificationElement = document.querySelector('.notification');
    runner.assertNotNull(notificationElement, 'Should create notification element');
    runner.assert(notificationElement.classList.contains('success'), 'Should apply correct type class');
    runner.assert(notificationElement.textContent.includes('Test Title'), 'Should include title');
    runner.assert(notificationElement.textContent.includes('Test message'), 'Should include message');
    
    uiManager.destroy();
});

runner.test('UIManager should dismiss notifications', () => {
    const uiManager = new UIManager();
    
    const notificationId = uiManager.showNotification('Test message');
    runner.assertEqual(uiManager.notifications.length, 1, 'Should have one notification');
    
    uiManager.dismissNotification(notificationId);
    runner.assertEqual(uiManager.notifications.length, 0, 'Should remove notification from array');
    
    uiManager.destroy();
});

runner.test('UIManager should auto-dismiss notifications', async () => {
    const uiManager = new UIManager();
    
    uiManager.showNotification('Test message', 'info', '', 50); // 50ms duration
    runner.assertEqual(uiManager.notifications.length, 1, 'Should have one notification');
    
    // Wait for auto-dismiss
    await new Promise(resolve => setTimeout(resolve, 100));
    
    runner.assertEqual(uiManager.notifications.length, 0, 'Should auto-dismiss notification');
    
    uiManager.destroy();
});

runner.test('UIManager should clear all notifications', () => {
    const uiManager = new UIManager();
    
    uiManager.showNotification('Message 1');
    uiManager.showNotification('Message 2');
    uiManager.showNotification('Message 3');
    
    runner.assertEqual(uiManager.notifications.length, 3, 'Should have three notifications');
    
    uiManager.clearNotifications();
    runner.assertEqual(uiManager.notifications.length, 0, 'Should clear all notifications');
    
    uiManager.destroy();
});

// Display Update Tests
runner.test('UIManager should update display elements', () => {
    const uiManager = new UIManager();
    
    // Create test elements
    document.body.innerHTML += `
        <div class="wallet-balance">$0.00</div>
        <div class="match-timer">0'</div>
        <div class="match-score">0 - 0</div>
        <div class="odds-home">0.00</div>
        <div class="odds-draw">0.00</div>
        <div class="odds-away">0.00</div>
    `;
    
    uiManager.updateDisplay({
        wallet: 1500.50,
        match: {
            time: 45.7,
            homeScore: 2,
            awayScore: 1,
            odds: { home: 2.10, draw: 3.20, away: 3.80 }
        }
    });
    
    runner.assertEqual(document.querySelector('.wallet-balance').textContent, '$1500.50', 'Should update wallet display');
    runner.assertEqual(document.querySelector('.match-timer').textContent, "45'", 'Should update timer display');
    runner.assertEqual(document.querySelector('.match-score').textContent, '2 - 1', 'Should update score display');
    runner.assertEqual(document.querySelector('.odds-home').textContent, '2.10', 'Should update home odds');
    runner.assertEqual(document.querySelector('.odds-draw').textContent, '3.20', 'Should update draw odds');
    runner.assertEqual(document.querySelector('.odds-away').textContent, '3.80', 'Should update away odds');
    
    uiManager.destroy();
});

// Loading State Tests
runner.test('UIManager should handle loading states', () => {
    const uiManager = new UIManager();
    
    uiManager.showLoading('Loading test...');
    
    const loadingNotification = uiManager.notifications.find(n => 
        n.message.includes('loading-spinner')
    );
    runner.assertNotNull(loadingNotification, 'Should create loading notification');
    runner.assert(loadingNotification.message.includes('Loading test...'), 'Should include loading message');
    
    uiManager.hideLoading();
    
    const remainingLoadingNotifications = uiManager.notifications.filter(n => 
        n.message.includes('loading-spinner')
    );
    runner.assertEqual(remainingLoadingNotifications.length, 0, 'Should remove loading notifications');
    
    uiManager.destroy();
});

// Utility Tests
runner.test('UIManager should detect mobile correctly', () => {
    const uiManager = new UIManager();
    
    // Mock narrow window
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
    });
    
    runner.assert(uiManager.isMobile(), 'Should detect mobile for narrow window');
    
    // Mock wide window
    window.innerWidth = 1024;
    runner.assert(!uiManager.isMobile(), 'Should not detect mobile for wide window');
    
    uiManager.destroy();
});

runner.test('UIManager should cleanup properly', () => {
    const uiManager = new UIManager();
    
    uiManager.showNotification('Test');
    uiManager.registerScreen('test', new MockScreen('Test'));
    
    runner.assert(uiManager.notifications.length > 0, 'Should have notifications before cleanup');
    runner.assert(uiManager.screens.size > 0, 'Should have screens before cleanup');
    
    uiManager.destroy();
    
    runner.assertEqual(uiManager.notifications.length, 0, 'Should clear notifications');
    runner.assertEqual(uiManager.screens.size, 0, 'Should clear screens');
    runner.assertEqual(uiManager.currentScreen, null, 'Should reset current screen');
    runner.assertEqual(uiManager.stateManager, null, 'Should reset state manager');
});

// Integration Tests
runner.test('Complete UIManager integration flow', async () => {
    const uiManager = new UIManager();
    const stateManager = new MockStateManager();
    const lobbyScreen = new MockScreen('Lobby');
    const matchScreen = new MockScreen('Match');
    
    // Setup
    uiManager.registerScreen('lobby', lobbyScreen);
    uiManager.registerScreen('match', matchScreen);
    uiManager.initialize(stateManager);
    
    // Should start with lobby
    runner.assertEqual(uiManager.currentScreen, 'lobby', 'Should start with lobby screen');
    runner.assert(lobbyScreen.renderCalled, 'Should render lobby screen');
    
    // Transition to match
    stateManager.updateState({ currentScreen: 'match' });
    runner.assertEqual(uiManager.currentScreen, 'match', 'Should transition to match screen');
    runner.assert(matchScreen.renderCalled, 'Should render match screen');
    
    // Update state
    stateManager.updateState({ wallet: 750 });
    runner.assert(matchScreen.updateCalled, 'Should update match screen');
    runner.assertEqual(matchScreen.updateState.wallet, 750, 'Should pass updated wallet');
    
    // Test notifications
    uiManager.showNotification('Test notification', 'success');
    runner.assertEqual(uiManager.notifications.length, 1, 'Should create notification');
    
    // Cleanup
    uiManager.destroy();
    runner.assertEqual(uiManager.notifications.length, 0, 'Should cleanup notifications');
});

// Run all tests
runner.run().catch(console.error);