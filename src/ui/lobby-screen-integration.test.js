/**
 * LobbyScreen Integration Test
 * Tests integration between LobbyScreen, UIManager, and StateManager
 */

import { LobbyScreen } from './LobbyScreen.js';
import { UIManager } from './UIManager.js';
import { StateManager } from '../core/StateManager.js';

// Mock DOM environment for Node.js
if (typeof window === 'undefined') {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
    
    Object.defineProperty(global, 'window', {
        value: dom.window,
        writable: true
    });
    Object.defineProperty(global, 'document', {
        value: dom.window.document,
        writable: true
    });
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
}

class IntegrationTestRunner {
    constructor() {
        this.results = [];
    }

    test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            this.results.push({ name, passed: true });
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   Error: ${error.message}`);
            this.results.push({ name, passed: false, error: error.message });
        }
    }

    async testAsync(name, testFn) {
        try {
            await testFn();
            console.log(`✅ ${name}`);
            this.results.push({ name, passed: true });
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   Error: ${error.message}`);
            this.results.push({ name, passed: false, error: error.message });
        }
    }

    printSummary() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log('\n📊 Integration Test Summary');
        console.log('===========================');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (passed === total) {
            console.log('\n🎉 All integration tests passed!');
        } else {
            console.log(`\n⚠️  ${total - passed} test(s) failed.`);
        }
    }
}

const runner = new IntegrationTestRunner();

console.log('🔗 Running LobbyScreen Integration Tests\n');

// Test: Basic integration setup
runner.test('Basic integration setup', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Initialize components
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    
    // Register lobby screen
    uiManager.registerScreen('lobby', lobbyScreen);
    
    if (!uiManager.screens.has('lobby')) {
        throw new Error('LobbyScreen not registered with UIManager');
    }
    
    if (lobbyScreen.stateManager !== stateManager) {
        throw new Error('LobbyScreen not properly initialized with StateManager');
    }
});

// Test: Screen rendering through UIManager
runner.test('Screen rendering through UIManager', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Setup
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    uiManager.registerScreen('lobby', lobbyScreen);
    
    // Show lobby screen
    uiManager.showScreen('lobby');
    
    if (uiManager.getCurrentScreen() !== 'lobby') {
        throw new Error('Current screen should be lobby');
    }
    
    // Check if screen element exists in DOM
    const screenElement = document.querySelector('.lobby-screen');
    if (!screenElement) {
        throw new Error('Lobby screen element not found in DOM');
    }
});

// Test: State synchronization
runner.test('State synchronization between components', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Setup
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    uiManager.registerScreen('lobby', lobbyScreen);
    uiManager.showScreen('lobby');
    
    // Update state
    const newWallet = 1500.75;
    stateManager.updateState({ wallet: newWallet });
    
    // Check if UI reflects the change
    const walletElement = document.querySelector('.wallet-balance');
    if (!walletElement) {
        throw new Error('Wallet element not found');
    }
    
    if (walletElement.textContent !== newWallet.toFixed(2)) {
        throw new Error(`Wallet not updated: expected ${newWallet.toFixed(2)}, got ${walletElement.textContent}`);
    }
});

// Test: Classic mode toggle integration
runner.test('Classic mode toggle integration', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Setup
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    uiManager.registerScreen('lobby', lobbyScreen);
    uiManager.showScreen('lobby');
    
    // Find and toggle classic mode
    const checkbox = document.querySelector('#classic-mode-checkbox');
    if (!checkbox) {
        throw new Error('Classic mode checkbox not found');
    }
    
    // Toggle on
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    const state = stateManager.getState();
    if (!state.classicMode) {
        throw new Error('Classic mode not enabled in state');
    }
});

// Test: Match selection integration
runner.testAsync('Match selection integration', async () => {
    return new Promise((resolve, reject) => {
        const stateManager = new StateManager();
        const uiManager = new UIManager();
        const lobbyScreen = new LobbyScreen();
        
        // Setup
        lobbyScreen.initialize(stateManager);
        uiManager.initialize(stateManager);
        uiManager.registerScreen('lobby', lobbyScreen);
        uiManager.showScreen('lobby');
        
        // Subscribe to state changes
        const unsubscribe = stateManager.subscribe((newState) => {
            if (newState.currentScreen === 'match') {
                try {
                    if (!newState.match.active) {
                        throw new Error('Match should be active');
                    }
                    
                    if (!newState.match.homeTeam || !newState.match.awayTeam) {
                        throw new Error('Match teams not set');
                    }
                    
                    unsubscribe();
                    resolve();
                } catch (error) {
                    unsubscribe();
                    reject(error);
                }
            }
        });
        
        // Mock setTimeout for immediate execution
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback) => {
            callback();
            global.setTimeout = originalSetTimeout;
        };
        
        // Trigger match selection
        const firstMatch = lobbyScreen.getAvailableMatches()[0];
        const joinButton = document.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
        
        if (!joinButton) {
            unsubscribe();
            reject(new Error('Join button not found'));
            return;
        }
        
        joinButton.click();
        
        // Timeout after 1 second
        setTimeout(() => {
            unsubscribe();
            reject(new Error('Match selection timeout'));
        }, 1000);
    });
});

// Test: Screen transitions
runner.test('Screen transitions work correctly', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Create a mock match screen
    const mockMatchScreen = {
        render: () => {
            const element = document.createElement('div');
            element.className = 'match-screen';
            element.innerHTML = '<h1>Match Screen</h1>';
            return element;
        },
        initialize: () => {},
        update: () => {}
    };
    
    // Setup
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    uiManager.registerScreen('lobby', lobbyScreen);
    uiManager.registerScreen('match', mockMatchScreen);
    
    // Start with lobby
    uiManager.showScreen('lobby');
    if (uiManager.getCurrentScreen() !== 'lobby') {
        throw new Error('Should start with lobby screen');
    }
    
    // Transition to match
    uiManager.showScreen('match');
    if (uiManager.getCurrentScreen() !== 'match') {
        throw new Error('Should transition to match screen');
    }
    
    // Check DOM
    const matchElement = document.querySelector('.match-screen');
    if (!matchElement) {
        throw new Error('Match screen element not found');
    }
});

// Test: Error handling in integration
runner.test('Error handling in integration', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Setup
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    uiManager.registerScreen('lobby', lobbyScreen);
    
    // Test invalid screen transition
    try {
        uiManager.showScreen('nonexistent');
        // Should not throw but should handle gracefully
    } catch (error) {
        throw new Error('Should handle invalid screen gracefully');
    }
    
    // Test invalid match selection
    try {
        lobbyScreen.handleMatchSelection('invalid-id');
        // Should not throw
    } catch (error) {
        throw new Error('Should handle invalid match selection gracefully');
    }
});

// Test: Memory management
runner.test('Memory management and cleanup', () => {
    const stateManager = new StateManager();
    const uiManager = new UIManager();
    const lobbyScreen = new LobbyScreen();
    
    // Setup
    lobbyScreen.initialize(stateManager);
    uiManager.initialize(stateManager);
    uiManager.registerScreen('lobby', lobbyScreen);
    uiManager.showScreen('lobby');
    
    // Verify elements exist
    const screenElement = document.querySelector('.lobby-screen');
    if (!screenElement) {
        throw new Error('Screen element should exist');
    }
    
    // Cleanup
    lobbyScreen.destroy();
    uiManager.destroy();
    
    // Verify cleanup
    if (lobbyScreen.stateManager !== null) {
        throw new Error('LobbyScreen should cleanup state manager reference');
    }
    
    if (lobbyScreen.element !== null) {
        throw new Error('LobbyScreen should cleanup element reference');
    }
});

// Run all tests
await runner.testAsync('Match selection integration', async () => {
    return new Promise((resolve, reject) => {
        const stateManager = new StateManager();
        const uiManager = new UIManager();
        const lobbyScreen = new LobbyScreen();
        
        lobbyScreen.initialize(stateManager);
        uiManager.initialize(stateManager);
        uiManager.registerScreen('lobby', lobbyScreen);
        uiManager.showScreen('lobby');
        
        const unsubscribe = stateManager.subscribe((newState) => {
            if (newState.currentScreen === 'match') {
                try {
                    if (!newState.match.active) {
                        throw new Error('Match should be active');
                    }
                    
                    unsubscribe();
                    resolve();
                } catch (error) {
                    unsubscribe();
                    reject(error);
                }
            }
        });
        
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback) => {
            callback();
            global.setTimeout = originalSetTimeout;
        };
        
        const firstMatch = lobbyScreen.getAvailableMatches()[0];
        const joinButton = document.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
        
        if (!joinButton) {
            unsubscribe();
            reject(new Error('Join button not found'));
            return;
        }
        
        joinButton.click();
    });
});

runner.printSummary();