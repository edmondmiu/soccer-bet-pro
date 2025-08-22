/**
 * UIManager Tests
 * Tests for UI orchestration, screen transitions, and notification system
 */

import { UIManager } from './UIManager.js';

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

describe('UIManager', () => {
    let uiManager;
    let mockStateManager;
    let originalDocument;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        
        // Create fresh UIManager instance
        uiManager = new UIManager();
        mockStateManager = new MockStateManager();
        
        // Mock console methods
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Cleanup
        uiManager.destroy();
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize UI structure', () => {
            expect(document.getElementById('app')).toBeTruthy();
            expect(document.getElementById('notification-container')).toBeTruthy();
        });

        test('should apply base styles', () => {
            const styles = document.querySelectorAll('style');
            expect(styles.length).toBeGreaterThan(0);
            
            const appContainer = document.getElementById('app');
            expect(appContainer.className).toBe('app-container');
        });

        test('should initialize with StateManager', () => {
            uiManager.initialize(mockStateManager);
            
            expect(uiManager.stateManager).toBe(mockStateManager);
            expect(mockStateManager.subscribers.length).toBe(1);
        });
    });

    describe('Screen Management', () => {
        let mockLobbyScreen;
        let mockMatchScreen;

        beforeEach(() => {
            mockLobbyScreen = new MockScreen('Lobby');
            mockMatchScreen = new MockScreen('Match');
            
            uiManager.registerScreen('lobby', mockLobbyScreen);
            uiManager.registerScreen('match', mockMatchScreen);
        });

        test('should register screens', () => {
            expect(uiManager.screens.has('lobby')).toBe(true);
            expect(uiManager.screens.has('match')).toBe(true);
        });

        test('should show screen', () => {
            const testData = { test: 'data' };
            uiManager.showScreen('lobby', testData);

            expect(uiManager.currentScreen).toBe('lobby');
            expect(mockLobbyScreen.renderCalled).toBe(true);
            expect(mockLobbyScreen.renderData).toEqual(testData);
            
            const screenElement = document.querySelector('.mock-screen');
            expect(screenElement).toBeTruthy();
            expect(screenElement.textContent).toBe('Mock Lobby Screen');
        });

        test('should handle screen transitions', (done) => {
            uiManager.showScreen('lobby');
            
            setTimeout(() => {
                uiManager.showScreen('match');
                
                setTimeout(() => {
                    expect(uiManager.currentScreen).toBe('match');
                    expect(mockMatchScreen.renderCalled).toBe(true);
                    done();
                }, 350); // Wait for transition
            }, 100);
        });

        test('should handle unknown screen', () => {
            uiManager.showScreen('unknown');
            
            expect(console.error).toHaveBeenCalledWith("Screen 'unknown' not found");
            expect(uiManager.currentScreen).toBeNull();
        });

        test('should initialize screen if method exists', () => {
            const testData = { test: 'data' };
            uiManager.showScreen('lobby', testData);

            expect(mockLobbyScreen.initializeCalled).toBe(true);
            expect(mockLobbyScreen.initializeData).toEqual(testData);
        });
    });

    describe('State Management Integration', () => {
        let mockScreen;

        beforeEach(() => {
            mockScreen = new MockScreen('Test');
            uiManager.registerScreen('test', mockScreen);
            uiManager.initialize(mockStateManager);
        });

        test('should render on state changes', () => {
            mockStateManager.updateState({ currentScreen: 'test' });
            
            expect(mockScreen.renderCalled).toBe(true);
            expect(uiManager.currentScreen).toBe('test');
        });

        test('should update current screen on state changes', () => {
            uiManager.showScreen('test');
            mockScreen.renderCalled = false; // Reset
            
            mockStateManager.updateState({ wallet: 500 });
            
            expect(mockScreen.updateCalled).toBe(true);
            expect(mockScreen.updateState.wallet).toBe(500);
        });
    });

    describe('Notification System', () => {
        test('should show notification', () => {
            const notificationId = uiManager.showNotification('Test message', 'success', 'Test Title');
            
            expect(typeof notificationId).toBe('number');
            expect(uiManager.notifications.length).toBe(1);
            
            const notificationElement = document.querySelector('.notification');
            expect(notificationElement).toBeTruthy();
            expect(notificationElement.classList.contains('success')).toBe(true);
            expect(notificationElement.textContent).toContain('Test Title');
            expect(notificationElement.textContent).toContain('Test message');
        });

        test('should show notification without title', () => {
            uiManager.showNotification('Test message', 'info');
            
            const notificationElement = document.querySelector('.notification');
            expect(notificationElement).toBeTruthy();
            expect(notificationElement.querySelector('.notification-title')).toBeFalsy();
        });

        test('should auto-dismiss notification', (done) => {
            uiManager.showNotification('Test message', 'info', '', 100);
            
            expect(uiManager.notifications.length).toBe(1);
            
            setTimeout(() => {
                expect(uiManager.notifications.length).toBe(0);
                done();
            }, 150);
        });

        test('should not auto-dismiss with duration 0', (done) => {
            uiManager.showNotification('Test message', 'info', '', 0);
            
            setTimeout(() => {
                expect(uiManager.notifications.length).toBe(1);
                done();
            }, 100);
        });

        test('should dismiss notification by ID', () => {
            const notificationId = uiManager.showNotification('Test message');
            
            uiManager.dismissNotification(notificationId);
            
            expect(uiManager.notifications.length).toBe(0);
        });

        test('should dismiss notification by element', () => {
            uiManager.showNotification('Test message');
            
            const notificationElement = document.querySelector('.notification');
            uiManager.dismissNotification(notificationElement);
            
            expect(uiManager.notifications.length).toBe(0);
        });

        test('should clear all notifications', () => {
            uiManager.showNotification('Message 1');
            uiManager.showNotification('Message 2');
            uiManager.showNotification('Message 3');
            
            expect(uiManager.notifications.length).toBe(3);
            
            uiManager.clearNotifications();
            
            expect(uiManager.notifications.length).toBe(0);
        });

        test('should handle notification types', () => {
            const types = ['success', 'error', 'warning', 'info'];
            
            types.forEach(type => {
                uiManager.showNotification(`${type} message`, type);
            });
            
            types.forEach(type => {
                const element = document.querySelector(`.notification.${type}`);
                expect(element).toBeTruthy();
            });
        });
    });

    describe('Display Updates', () => {
        beforeEach(() => {
            // Setup DOM elements for testing
            document.body.innerHTML += `
                <div class="wallet-balance">$0.00</div>
                <div class="match-timer">0'</div>
                <div class="match-score">0 - 0</div>
                <div class="odds-home">0.00</div>
                <div class="odds-draw">0.00</div>
                <div class="odds-away">0.00</div>
            `;
        });

        test('should update wallet display', () => {
            uiManager.updateDisplay({ wallet: 1500.50 });
            
            const walletElement = document.querySelector('.wallet-balance');
            expect(walletElement.textContent).toBe('$1500.50');
        });

        test('should update timer display', () => {
            uiManager.updateDisplay({ match: { time: 45.5 } });
            
            const timerElement = document.querySelector('.match-timer');
            expect(timerElement.textContent).toBe("45'");
        });

        test('should update score display', () => {
            uiManager.updateDisplay({ 
                match: { homeScore: 2, awayScore: 1 } 
            });
            
            const scoreElement = document.querySelector('.match-score');
            expect(scoreElement.textContent).toBe('2 - 1');
        });

        test('should update odds display', () => {
            uiManager.updateDisplay({ 
                match: { 
                    odds: { home: 2.10, draw: 3.20, away: 3.80 } 
                } 
            });
            
            expect(document.querySelector('.odds-home').textContent).toBe('2.10');
            expect(document.querySelector('.odds-draw').textContent).toBe('3.20');
            expect(document.querySelector('.odds-away').textContent).toBe('3.80');
        });
    });

    describe('Loading States', () => {
        test('should show loading', () => {
            uiManager.showLoading('Loading match...');
            
            const notification = document.querySelector('.notification');
            expect(notification).toBeTruthy();
            expect(notification.textContent).toContain('Loading match...');
            expect(notification.querySelector('.loading-spinner')).toBeTruthy();
        });

        test('should hide loading', () => {
            uiManager.showLoading('Loading...');
            expect(uiManager.notifications.length).toBe(1);
            
            uiManager.hideLoading();
            expect(uiManager.notifications.length).toBe(0);
        });
    });

    describe('Event Handling', () => {
        test('should handle notification clicks', () => {
            uiManager.showNotification('Test message');
            
            const notificationElement = document.querySelector('.notification');
            notificationElement.click();
            
            expect(uiManager.notifications.length).toBe(0);
        });

        test('should handle escape key', () => {
            uiManager.showNotification('Test message 1');
            uiManager.showNotification('Test message 2');
            
            expect(uiManager.notifications.length).toBe(2);
            
            // Simulate escape key
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);
            
            expect(uiManager.notifications.length).toBe(1);
        });
    });

    describe('Responsive Design', () => {
        test('should detect mobile device', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500,
            });
            
            expect(uiManager.isMobile()).toBe(true);
            
            window.innerWidth = 1024;
            expect(uiManager.isMobile()).toBe(false);
        });

        test('should handle resize events', () => {
            const mockScreen = new MockScreen('Test');
            mockScreen.handleResize = jest.fn();
            
            uiManager.registerScreen('test', mockScreen);
            uiManager.showScreen('test');
            
            // Simulate resize
            window.dispatchEvent(new Event('resize'));
            
            expect(mockScreen.handleResize).toHaveBeenCalled();
        });
    });

    describe('Utility Methods', () => {
        test('should get current screen', () => {
            expect(uiManager.getCurrentScreen()).toBeNull();
            
            const mockScreen = new MockScreen('Test');
            uiManager.registerScreen('test', mockScreen);
            uiManager.showScreen('test');
            
            expect(uiManager.getCurrentScreen()).toBe('test');
        });

        test('should cleanup on destroy', () => {
            uiManager.showNotification('Test');
            expect(uiManager.notifications.length).toBe(1);
            
            uiManager.destroy();
            
            expect(uiManager.notifications.length).toBe(0);
            expect(uiManager.screens.size).toBe(0);
            expect(uiManager.currentScreen).toBeNull();
            expect(uiManager.stateManager).toBeNull();
        });
    });
});

// Integration Tests
describe('UIManager Integration', () => {
    let uiManager;
    let stateManager;

    beforeEach(() => {
        document.body.innerHTML = '';
        uiManager = new UIManager();
        stateManager = new MockStateManager();
    });

    afterEach(() => {
        uiManager.destroy();
    });

    test('should handle complete screen transition flow', (done) => {
        const lobbyScreen = new MockScreen('Lobby');
        const matchScreen = new MockScreen('Match');
        
        uiManager.registerScreen('lobby', lobbyScreen);
        uiManager.registerScreen('match', matchScreen);
        uiManager.initialize(stateManager);
        
        // Should start with lobby
        expect(uiManager.currentScreen).toBe('lobby');
        expect(lobbyScreen.renderCalled).toBe(true);
        
        // Transition to match
        stateManager.updateState({ currentScreen: 'match' });
        
        setTimeout(() => {
            expect(uiManager.currentScreen).toBe('match');
            expect(matchScreen.renderCalled).toBe(true);
            done();
        }, 100);
    });

    test('should handle state updates and display changes', () => {
        document.body.innerHTML += `
            <div class="wallet-balance">$0.00</div>
            <div class="match-timer">0'</div>
        `;
        
        uiManager.initialize(stateManager);
        
        stateManager.updateState({ 
            wallet: 750,
            match: { ...stateManager.state.match, time: 30 }
        });
        
        expect(document.querySelector('.wallet-balance').textContent).toBe('$750.00');
        expect(document.querySelector('.match-timer').textContent).toBe("30'");
    });
});