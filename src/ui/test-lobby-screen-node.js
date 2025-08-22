/**
 * Node.js Test Runner for LobbyScreen
 * Runs LobbyScreen tests in Node.js environment with DOM simulation
 */

// Mock DOM environment
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Set up global DOM objects
Object.defineProperty(global, 'window', {
    value: dom.window,
    writable: true
});
Object.defineProperty(global, 'document', {
    value: dom.window.document,
    writable: true
});
Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true
});
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;

// Import modules after DOM setup
import { LobbyScreen } from './LobbyScreen.js';
import { StateManager } from '../core/StateManager.js';

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🚀 Running LobbyScreen Node.js Tests\n');

        for (const { name, testFn } of this.tests) {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n⚠️  ${this.results.failed} test(s) failed.`);
        }
    }
}

// Test utilities
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${actual} to be greater than ${expected}`);
    }
}

function assertLessThanOrEqual(actual, expected, message) {
    if (actual > expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${actual} to be less than or equal to ${expected}`);
    }
}

// Mock UIManager
global.window.uiManager = {
    showNotification: () => {},
    showLoading: () => {},
    hideLoading: () => {}
};

// Create test runner
const runner = new TestRunner();

// Test: Initialization
runner.test('LobbyScreen initialization', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    assert(lobbyScreen.stateManager === stateManager, 'StateManager should be set');
    assert(Array.isArray(lobbyScreen.availableMatches), 'Available matches should be an array');
    assertGreaterThan(lobbyScreen.availableMatches.length, 2, 'Should have at least 3 matches');
    assertLessThanOrEqual(lobbyScreen.availableMatches.length, 6, 'Should have at most 6 matches');
});

// Test: Match generation
runner.test('Match generation with unique teams', () => {
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    const allTeams = [];
    matches.forEach(match => {
        allTeams.push(match.homeTeam, match.awayTeam);
    });
    
    const uniqueTeams = new Set(allTeams);
    assertEqual(uniqueTeams.size, allTeams.length, 'All teams should be unique');
});

// Test: Match structure validation
runner.test('Match structure validation', () => {
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    matches.forEach((match, index) => {
        assert(match.id, `Match ${index} should have ID`);
        assert(match.homeTeam, `Match ${index} should have home team`);
        assert(match.awayTeam, `Match ${index} should have away team`);
        assert(match.odds, `Match ${index} should have odds`);
        assert(match.kickoff, `Match ${index} should have kickoff time`);
        
        // Validate odds structure
        assert(typeof match.odds.home === 'number', 'Home odds should be number');
        assert(typeof match.odds.draw === 'number', 'Draw odds should be number');
        assert(typeof match.odds.away === 'number', 'Away odds should be number');
        
        assertGreaterThan(match.odds.home, 1, 'Home odds should be greater than 1');
        assertGreaterThan(match.odds.draw, 1, 'Draw odds should be greater than 1');
        assertGreaterThan(match.odds.away, 1, 'Away odds should be greater than 1');
    });
});

// Test: Rendering
runner.test('Basic rendering', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    assert(element instanceof HTMLElement, 'Should return HTML element');
    assert(element.classList.contains('lobby-screen'), 'Should have lobby-screen class');
    
    // Check for required elements
    assert(element.querySelector('.lobby-header'), 'Should have header');
    assert(element.querySelector('.lobby-title'), 'Should have title');
    assert(element.querySelector('.wallet-display'), 'Should have wallet display');
    assert(element.querySelector('.classic-mode-toggle'), 'Should have classic mode toggle');
    assert(element.querySelector('.matches-section'), 'Should have matches section');
});

// Test: Wallet display
runner.test('Wallet display rendering', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    // Test with custom wallet amount
    const state = { ...stateManager.getState(), wallet: 1500.75 };
    const element = lobbyScreen.render(state);
    
    const walletBalance = element.querySelector('.wallet-balance');
    assertEqual(walletBalance.textContent, '1500.75', 'Should display correct wallet balance');
});

// Test: Classic mode toggle
runner.test('Classic mode toggle rendering', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    // Test with classic mode enabled
    const state = { ...stateManager.getState(), classicMode: true };
    const element = lobbyScreen.render(state);
    
    const checkbox = element.querySelector('#classic-mode-checkbox');
    assert(checkbox.checked, 'Checkbox should be checked when classic mode is enabled');
});

// Test: Match cards rendering
runner.test('Match cards rendering', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    const matchCards = element.querySelectorAll('.match-card');
    const availableMatches = lobbyScreen.getAvailableMatches();
    
    assertEqual(matchCards.length, availableMatches.length, 'Should render all available matches');
    
    // Check first match card content
    const firstMatch = availableMatches[0];
    const firstCard = element.querySelector(`[data-match-id="${firstMatch.id}"]`);
    
    assert(firstCard, 'Should find first match card');
    
    const homeTeam = firstCard.querySelector('.home-team');
    const awayTeam = firstCard.querySelector('.away-team');
    const joinButton = firstCard.querySelector('.join-match-btn');
    
    assertEqual(homeTeam.textContent, firstMatch.homeTeam, 'Should display correct home team');
    assertEqual(awayTeam.textContent, firstMatch.awayTeam, 'Should display correct away team');
    assert(joinButton, 'Should have join button');
    assertEqual(joinButton.dataset.matchId, firstMatch.id, 'Join button should have correct match ID');
});

// Test: State updates
runner.test('State updates handling', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    // Add to DOM for testing
    document.body.appendChild(element);
    
    // Update wallet
    stateManager.updateState({ wallet: 2500.50 });
    
    const walletBalance = element.querySelector('.wallet-balance');
    assertEqual(walletBalance.textContent, '2500.50', 'Should update wallet display');
    
    // Update classic mode
    stateManager.updateState({ classicMode: true });
    
    const checkbox = element.querySelector('#classic-mode-checkbox');
    assert(checkbox.checked, 'Should update classic mode toggle');
    
    // Cleanup
    element.remove();
});

// Test: Classic mode toggle functionality
runner.test('Classic mode toggle functionality', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    // Add to DOM for event testing
    document.body.appendChild(element);
    
    const checkbox = element.querySelector('#classic-mode-checkbox');
    
    // Test enabling classic mode
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    const updatedState = stateManager.getState();
    assert(updatedState.classicMode, 'Should enable classic mode');
    
    // Test disabling classic mode
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    
    const finalState = stateManager.getState();
    assert(!finalState.classicMode, 'Should disable classic mode');
    
    // Cleanup
    element.remove();
});

// Test: Match selection
runner.test('Match selection functionality', (done) => {
    return new Promise((resolve, reject) => {
        const lobbyScreen = new LobbyScreen();
        const stateManager = new StateManager();
        
        lobbyScreen.initialize(stateManager);
        
        const state = stateManager.getState();
        const element = lobbyScreen.render(state);
        
        // Add to DOM for event testing
        document.body.appendChild(element);
        
        const firstMatch = lobbyScreen.getAvailableMatches()[0];
        
        // Subscribe to state changes
        const unsubscribe = stateManager.subscribe((newState) => {
            if (newState.currentScreen === 'match') {
                try {
                    assertEqual(newState.match.homeTeam, firstMatch.homeTeam, 'Should set correct home team');
                    assertEqual(newState.match.awayTeam, firstMatch.awayTeam, 'Should set correct away team');
                    assert(newState.match.active, 'Match should be active');
                    
                    unsubscribe();
                    element.remove();
                    resolve();
                } catch (error) {
                    unsubscribe();
                    element.remove();
                    reject(error);
                }
            }
        });
        
        // Mock setTimeout to execute immediately
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback) => {
            callback();
            global.setTimeout = originalSetTimeout;
        };
        
        // Trigger match selection
        const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
        joinButton.click();
    });
});

// Test: Responsive design
runner.test('Responsive design handling', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    // Add to DOM for resize testing
    document.body.appendChild(element);
    
    // Test mobile layout
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
    });
    
    lobbyScreen.handleResize();
    assert(element.classList.contains('mobile-layout'), 'Should add mobile layout class');
    
    // Test desktop layout
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
    });
    
    lobbyScreen.handleResize();
    assert(!element.classList.contains('mobile-layout'), 'Should remove mobile layout class');
    
    // Cleanup
    element.remove();
});

// Test: Requirements validation
runner.test('Requirements 1.1 - Initialize with $1000', () => {
    const stateManager = new StateManager();
    const state = stateManager.getState();
    
    assertEqual(state.wallet, 1000, 'Should initialize with $1000 virtual currency');
});

runner.test('Requirements 1.2 - Show available matches', () => {
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    assertGreaterThan(matches.length, 0, 'Should show available matches');
    
    matches.forEach(match => {
        assert(match.homeTeam, 'Match should have home team');
        assert(match.awayTeam, 'Match should have away team');
        assert(match.odds, 'Match should have odds');
    });
});

runner.test('Requirements 1.3 - Initialize with correct odds', () => {
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    matches.forEach(match => {
        assertGreaterThan(match.odds.home, 1.0, 'Home odds should be greater than 1.0');
        assertGreaterThan(match.odds.draw, 2.0, 'Draw odds should be greater than 2.0');
        assertGreaterThan(match.odds.away, 1.0, 'Away odds should be greater than 1.0');
    });
});

runner.test('Requirements 1.5 - Auto-join functionality', () => {
    return new Promise((resolve, reject) => {
        const lobbyScreen = new LobbyScreen();
        const stateManager = new StateManager();
        
        lobbyScreen.initialize(stateManager);
        
        const state = stateManager.getState();
        const element = lobbyScreen.render(state);
        
        document.body.appendChild(element);
        
        const firstMatch = lobbyScreen.getAvailableMatches()[0];
        
        // Subscribe to state changes to verify auto-join
        const unsubscribe = stateManager.subscribe((newState) => {
            if (newState.currentScreen === 'match') {
                try {
                    assert(newState.match.active, 'Match should be active after auto-join');
                    assertEqual(newState.match.homeTeam, firstMatch.homeTeam, 'Should auto-join correct match');
                    
                    unsubscribe();
                    element.remove();
                    resolve();
                } catch (error) {
                    unsubscribe();
                    element.remove();
                    reject(error);
                }
            }
        });
        
        // Mock setTimeout to execute immediately
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback) => {
            callback();
            global.setTimeout = originalSetTimeout;
        };
        
        // Trigger auto-join
        const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
        joinButton.click();
    });
});

// Test: Error handling
runner.test('Error handling - Invalid match selection', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    // Should not throw when selecting invalid match
    assert(() => {
        lobbyScreen.handleMatchSelection('invalid-match-id');
    }, 'Should handle invalid match selection gracefully');
});

runner.test('Error handling - State manager errors', () => {
    const lobbyScreen = new LobbyScreen();
    
    // Should not throw when state manager is not available
    assert(() => {
        lobbyScreen.joinMatch({ id: 'test', homeTeam: 'Test', awayTeam: 'Test' });
    }, 'Should handle missing state manager gracefully');
});

// Test: Cleanup
runner.test('Cleanup functionality', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    document.body.appendChild(element);
    
    // Verify element is in DOM
    assert(document.body.contains(element), 'Element should be in DOM');
    
    // Cleanup
    lobbyScreen.destroy();
    
    // Verify cleanup
    assert(lobbyScreen.element === null, 'Element reference should be null');
    assert(lobbyScreen.stateManager === null, 'StateManager reference should be null');
    assert(lobbyScreen.selectedMatch === null, 'Selected match should be null');
    assertEqual(lobbyScreen.availableMatches.length, 0, 'Available matches should be empty');
});

// Run all tests
runner.run().catch(console.error);