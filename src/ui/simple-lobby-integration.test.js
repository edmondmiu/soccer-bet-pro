/**
 * Simple LobbyScreen Integration Test
 * Basic integration test without complex DOM manipulation
 */

import { LobbyScreen } from './LobbyScreen.js';
import { StateManager } from '../core/StateManager.js';

// Mock DOM environment
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

console.log('🔗 Running Simple LobbyScreen Integration Test\n');

let testsPassed = 0;
let testsTotal = 0;

function test(name, testFn) {
    testsTotal++;
    try {
        testFn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Test 1: Basic component integration
test('LobbyScreen and StateManager integration', () => {
    const stateManager = new StateManager();
    const lobbyScreen = new LobbyScreen();
    
    // Initialize
    lobbyScreen.initialize(stateManager);
    
    if (lobbyScreen.stateManager !== stateManager) {
        throw new Error('StateManager not properly set');
    }
    
    if (!Array.isArray(lobbyScreen.availableMatches)) {
        throw new Error('Available matches not initialized');
    }
    
    if (lobbyScreen.availableMatches.length < 3) {
        throw new Error('Should have at least 3 matches');
    }
});

// Test 2: State updates
test('State updates propagate correctly', () => {
    const stateManager = new StateManager();
    const lobbyScreen = new LobbyScreen();
    
    lobbyScreen.initialize(stateManager);
    
    let stateChangeReceived = false;
    const unsubscribe = stateManager.subscribe(() => {
        stateChangeReceived = true;
    });
    
    // Update state
    stateManager.updateState({ wallet: 1500 });
    
    if (!stateChangeReceived) {
        throw new Error('State change not received');
    }
    
    const currentState = stateManager.getState();
    if (currentState.wallet !== 1500) {
        throw new Error('State not updated correctly');
    }
    
    unsubscribe();
});

// Test 3: Match selection logic
test('Match selection updates state correctly', () => {
    const stateManager = new StateManager();
    const lobbyScreen = new LobbyScreen();
    
    lobbyScreen.initialize(stateManager);
    
    const firstMatch = lobbyScreen.getAvailableMatches()[0];
    
    // Mock setTimeout to execute immediately
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (callback) => {
        callback();
        global.setTimeout = originalSetTimeout;
    };
    
    // Trigger match join
    lobbyScreen.joinMatch(firstMatch);
    
    const state = stateManager.getState();
    
    if (state.currentScreen !== 'match') {
        throw new Error('Screen should transition to match');
    }
    
    if (!state.match.active) {
        throw new Error('Match should be active');
    }
    
    if (state.match.homeTeam !== firstMatch.homeTeam) {
        throw new Error('Home team not set correctly');
    }
    
    if (state.match.awayTeam !== firstMatch.awayTeam) {
        throw new Error('Away team not set correctly');
    }
});

// Test 4: Classic mode functionality
test('Classic mode toggle works', () => {
    const stateManager = new StateManager();
    const lobbyScreen = new LobbyScreen();
    
    lobbyScreen.initialize(stateManager);
    
    // Test enabling classic mode
    lobbyScreen.handleClassicModeToggle(true);
    
    let state = stateManager.getState();
    if (!state.classicMode) {
        throw new Error('Classic mode should be enabled');
    }
    
    // Test disabling classic mode
    lobbyScreen.handleClassicModeToggle(false);
    
    state = stateManager.getState();
    if (state.classicMode) {
        throw new Error('Classic mode should be disabled');
    }
});

// Test 5: Error handling
test('Error handling works correctly', () => {
    const lobbyScreen = new LobbyScreen();
    
    // Should not throw when state manager is not set
    try {
        lobbyScreen.joinMatch({ id: 'test', homeTeam: 'Test', awayTeam: 'Test' });
    } catch (error) {
        throw new Error('Should handle missing state manager gracefully');
    }
    
    // Should not throw when invalid match is selected
    try {
        lobbyScreen.handleMatchSelection('invalid-id');
    } catch (error) {
        throw new Error('Should handle invalid match selection gracefully');
    }
});

// Test 6: Component rendering
test('Component renders without errors', () => {
    const stateManager = new StateManager();
    const lobbyScreen = new LobbyScreen();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    if (!element) {
        throw new Error('Render should return an element');
    }
    
    if (!element.classList.contains('lobby-screen')) {
        throw new Error('Element should have lobby-screen class');
    }
    
    // Check for key elements
    if (!element.querySelector('.lobby-header')) {
        throw new Error('Should have lobby header');
    }
    
    if (!element.querySelector('.wallet-display')) {
        throw new Error('Should have wallet display');
    }
    
    if (!element.querySelector('.matches-section')) {
        throw new Error('Should have matches section');
    }
    
    const matchCards = element.querySelectorAll('.match-card');
    if (matchCards.length !== lobbyScreen.availableMatches.length) {
        throw new Error('Should render all available matches');
    }
});

// Test 7: Cleanup
test('Component cleanup works correctly', () => {
    const stateManager = new StateManager();
    const lobbyScreen = new LobbyScreen();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    // Add to DOM
    document.body.appendChild(element);
    
    // Verify element is in DOM
    if (!document.body.contains(element)) {
        throw new Error('Element should be in DOM');
    }
    
    // Cleanup
    lobbyScreen.destroy();
    
    // Verify cleanup
    if (lobbyScreen.stateManager !== null) {
        throw new Error('StateManager reference should be null');
    }
    
    if (lobbyScreen.element !== null) {
        throw new Error('Element reference should be null');
    }
    
    if (lobbyScreen.availableMatches.length !== 0) {
        throw new Error('Available matches should be empty');
    }
});

// Test 8: Requirements compliance
test('Requirements compliance check', () => {
    const stateManager = new StateManager();
    const state = stateManager.getState();
    
    // Requirement 1.1: Initialize with $1000
    if (state.wallet !== 1000) {
        throw new Error('Should initialize with $1000');
    }
    
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    // Requirement 1.2: Show available matches
    if (matches.length === 0) {
        throw new Error('Should show available matches');
    }
    
    // Requirement 1.3: Matches have correct structure
    matches.forEach((match, index) => {
        if (!match.homeTeam || !match.awayTeam) {
            throw new Error(`Match ${index} missing team names`);
        }
        
        if (!match.odds || typeof match.odds.home !== 'number') {
            throw new Error(`Match ${index} missing valid odds`);
        }
    });
    
    // Requirement 1.5: Auto-join functionality exists
    if (typeof lobbyScreen.joinMatch !== 'function') {
        throw new Error('Should have joinMatch method for auto-join');
    }
});

// Print summary
console.log('\n📊 Integration Test Summary');
console.log('===========================');
console.log(`Total Tests: ${testsTotal}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsTotal - testsPassed}`);
console.log(`Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
    console.log('\n🎉 All integration tests passed!');
    console.log('LobbyScreen is properly integrated with StateManager.');
} else {
    console.log(`\n⚠️  ${testsTotal - testsPassed} test(s) failed.`);
}