/**
 * LobbyScreen Requirements Verification
 * Verifies that LobbyScreen implementation meets all specified requirements
 */

import { LobbyScreen } from './LobbyScreen.js';
import { StateManager } from '../core/StateManager.js';

// Mock DOM environment for Node.js
if (typeof window === 'undefined') {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
}

class RequirementsVerifier {
    constructor() {
        this.results = [];
        this.setupMocks();
    }

    setupMocks() {
        // Mock UIManager
        global.window.uiManager = {
            showNotification: (message, type, title) => {
                console.log(`📢 Notification: ${title || type} - ${message}`);
            },
            showLoading: (message) => {
                console.log(`⏳ Loading: ${message}`);
            },
            hideLoading: () => {
                console.log('✅ Loading hidden');
            }
        };
    }

    verify(requirementId, description, testFn) {
        try {
            const result = testFn();
            this.results.push({
                id: requirementId,
                description,
                status: 'PASS',
                details: result || 'Requirement verified successfully'
            });
            console.log(`✅ ${requirementId}: ${description}`);
        } catch (error) {
            this.results.push({
                id: requirementId,
                description,
                status: 'FAIL',
                details: error.message
            });
            console.log(`❌ ${requirementId}: ${description}`);
            console.log(`   Error: ${error.message}`);
        }
    }

    async verifyAsync(requirementId, description, testFn) {
        try {
            const result = await testFn();
            this.results.push({
                id: requirementId,
                description,
                status: 'PASS',
                details: result || 'Requirement verified successfully'
            });
            console.log(`✅ ${requirementId}: ${description}`);
        } catch (error) {
            this.results.push({
                id: requirementId,
                description,
                status: 'FAIL',
                details: error.message
            });
            console.log(`❌ ${requirementId}: ${description}`);
            console.log(`   Error: ${error.message}`);
        }
    }

    printSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log('\n📋 Requirements Verification Summary');
        console.log('=====================================');
        console.log(`Total Requirements: ${this.results.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Compliance: ${((passed / this.results.length) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Requirements:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`   ${r.id}: ${r.description}`);
                    console.log(`   Details: ${r.details}`);
                });
        }

        return failed === 0;
    }
}

// Create verifier instance
const verifier = new RequirementsVerifier();

console.log('🔍 Verifying LobbyScreen Requirements Implementation\n');

// Requirement 1.1: Initialize with $1000 virtual currency
verifier.verify('1.1', 'Initialize player with $1000 virtual currency', () => {
    const stateManager = new StateManager();
    const state = stateManager.getState();
    
    if (state.wallet !== 1000) {
        throw new Error(`Expected wallet to be 1000, got ${state.wallet}`);
    }
    
    return `Wallet initialized with $${state.wallet}`;
});

// Requirement 1.2: Show available simulated matches
verifier.verify('1.2', 'Display available simulated soccer matches', () => {
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    if (!Array.isArray(matches) || matches.length === 0) {
        throw new Error('No available matches found');
    }
    
    if (matches.length < 3 || matches.length > 6) {
        throw new Error(`Expected 3-6 matches, got ${matches.length}`);
    }
    
    // Verify match structure
    matches.forEach((match, index) => {
        if (!match.homeTeam || !match.awayTeam) {
            throw new Error(`Match ${index} missing team names`);
        }
        if (!match.odds || !match.odds.home || !match.odds.draw || !match.odds.away) {
            throw new Error(`Match ${index} missing odds structure`);
        }
    });
    
    return `${matches.length} matches available with valid structure`;
});

// Requirement 1.3: Initialize with random team names and correct odds
verifier.verify('1.3', 'Initialize matches with random teams and odds (Home 1.85, Draw 3.50, Away 4.20)', () => {
    const lobbyScreen = new LobbyScreen();
    const matches = lobbyScreen.getAvailableMatches();
    
    // Verify teams are unique
    const allTeams = [];
    matches.forEach(match => {
        allTeams.push(match.homeTeam, match.awayTeam);
    });
    const uniqueTeams = new Set(allTeams);
    
    if (uniqueTeams.size !== allTeams.length) {
        throw new Error('Teams are not unique across matches');
    }
    
    // Verify odds are around base values with variation
    const baseOdds = { home: 1.85, draw: 3.50, away: 4.20 };
    const maxVariation = 0.5; // Allow reasonable variation
    
    matches.forEach((match, index) => {
        const { home, draw, away } = match.odds;
        
        if (Math.abs(home - baseOdds.home) > maxVariation) {
            throw new Error(`Match ${index} home odds ${home} too far from base ${baseOdds.home}`);
        }
        if (Math.abs(draw - baseOdds.draw) > maxVariation) {
            throw new Error(`Match ${index} draw odds ${draw} too far from base ${baseOdds.draw}`);
        }
        if (Math.abs(away - baseOdds.away) > maxVariation) {
            throw new Error(`Match ${index} away odds ${away} too far from base ${baseOdds.away}`);
        }
    });
    
    return `All matches have unique teams and odds within acceptable range of base values`;
});

// Requirement 1.5: Auto-join functionality on match selection
verifier.verifyAsync('1.5', 'Auto-join functionality transitions directly to match view', async () => {
    return new Promise((resolve, reject) => {
        const lobbyScreen = new LobbyScreen();
        const stateManager = new StateManager();
        
        lobbyScreen.initialize(stateManager);
        
        const state = stateManager.getState();
        const element = lobbyScreen.render(state);
        
        // Add to DOM for event testing
        document.body.appendChild(element);
        
        const firstMatch = lobbyScreen.getAvailableMatches()[0];
        
        // Subscribe to state changes to verify auto-join
        const unsubscribe = stateManager.subscribe((newState) => {
            if (newState.currentScreen === 'match') {
                try {
                    // Verify match state is properly initialized
                    if (!newState.match.active) {
                        throw new Error('Match should be active after auto-join');
                    }
                    
                    if (newState.match.homeTeam !== firstMatch.homeTeam) {
                        throw new Error(`Expected home team ${firstMatch.homeTeam}, got ${newState.match.homeTeam}`);
                    }
                    
                    if (newState.match.awayTeam !== firstMatch.awayTeam) {
                        throw new Error(`Expected away team ${firstMatch.awayTeam}, got ${newState.match.awayTeam}`);
                    }
                    
                    if (JSON.stringify(newState.match.odds) !== JSON.stringify(firstMatch.odds)) {
                        throw new Error('Match odds not properly initialized');
                    }
                    
                    if (JSON.stringify(newState.match.initialOdds) !== JSON.stringify(firstMatch.odds)) {
                        throw new Error('Initial odds not properly stored');
                    }
                    
                    unsubscribe();
                    element.remove();
                    resolve(`Auto-join successful: ${firstMatch.homeTeam} vs ${firstMatch.awayTeam}`);
                    
                } catch (error) {
                    unsubscribe();
                    element.remove();
                    reject(error);
                }
            }
        });
        
        // Mock setTimeout to execute immediately for testing
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback) => {
            callback();
            global.setTimeout = originalSetTimeout;
        };
        
        // Trigger auto-join by clicking join button
        const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
        if (!joinButton) {
            unsubscribe();
            element.remove();
            reject(new Error('Join button not found'));
            return;
        }
        
        joinButton.click();
        
        // Timeout after 2 seconds if no state change
        setTimeout(() => {
            unsubscribe();
            element.remove();
            reject(new Error('Auto-join did not complete within timeout'));
        }, 2000);
    });
});

// Additional Implementation Requirements

// Wallet Balance Display
verifier.verify('IMPL-1', 'Display wallet balance correctly', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    // Test with custom wallet amount
    const testWallet = 1500.75;
    const state = { ...stateManager.getState(), wallet: testWallet };
    const element = lobbyScreen.render(state);
    
    const walletBalance = element.querySelector('.wallet-balance');
    if (!walletBalance) {
        throw new Error('Wallet balance element not found');
    }
    
    if (walletBalance.textContent !== testWallet.toFixed(2)) {
        throw new Error(`Expected wallet display ${testWallet.toFixed(2)}, got ${walletBalance.textContent}`);
    }
    
    return `Wallet balance displayed correctly: $${walletBalance.textContent}`;
});

// Classic Mode Toggle
verifier.verify('IMPL-2', 'Classic mode toggle functionality', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    // Add to DOM for event testing
    document.body.appendChild(element);
    
    const checkbox = element.querySelector('#classic-mode-checkbox');
    if (!checkbox) {
        throw new Error('Classic mode checkbox not found');
    }
    
    // Test initial state
    if (checkbox.checked !== false) {
        throw new Error('Classic mode should start disabled');
    }
    
    // Test enabling classic mode
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    const updatedState = stateManager.getState();
    if (!updatedState.classicMode) {
        throw new Error('Classic mode not enabled in state');
    }
    
    // Test disabling classic mode
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    
    const finalState = stateManager.getState();
    if (finalState.classicMode) {
        throw new Error('Classic mode not disabled in state');
    }
    
    element.remove();
    return 'Classic mode toggle works correctly';
});

// Responsive Design
verifier.verify('IMPL-3', 'Responsive design for mobile devices', () => {
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
    
    if (!element.classList.contains('mobile-layout')) {
        throw new Error('Mobile layout class not added');
    }
    
    // Test desktop layout
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
    });
    
    lobbyScreen.handleResize();
    
    if (element.classList.contains('mobile-layout')) {
        throw new Error('Mobile layout class not removed for desktop');
    }
    
    element.remove();
    return 'Responsive design works correctly';
});

// Match Card Structure
verifier.verify('IMPL-4', 'Match cards display team names and odds correctly', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    const matches = lobbyScreen.getAvailableMatches();
    const matchCards = element.querySelectorAll('.match-card');
    
    if (matchCards.length !== matches.length) {
        throw new Error(`Expected ${matches.length} match cards, got ${matchCards.length}`);
    }
    
    // Verify first match card content
    const firstMatch = matches[0];
    const firstCard = element.querySelector(`[data-match-id="${firstMatch.id}"]`);
    
    if (!firstCard) {
        throw new Error('First match card not found');
    }
    
    const homeTeam = firstCard.querySelector('.home-team');
    const awayTeam = firstCard.querySelector('.away-team');
    const oddsValues = firstCard.querySelectorAll('.odds-value');
    
    if (homeTeam.textContent !== firstMatch.homeTeam) {
        throw new Error(`Home team mismatch: expected ${firstMatch.homeTeam}, got ${homeTeam.textContent}`);
    }
    
    if (awayTeam.textContent !== firstMatch.awayTeam) {
        throw new Error(`Away team mismatch: expected ${firstMatch.awayTeam}, got ${awayTeam.textContent}`);
    }
    
    if (oddsValues.length !== 3) {
        throw new Error(`Expected 3 odds values, got ${oddsValues.length}`);
    }
    
    if (oddsValues[0].textContent !== firstMatch.odds.home.toFixed(2)) {
        throw new Error(`Home odds mismatch: expected ${firstMatch.odds.home.toFixed(2)}, got ${oddsValues[0].textContent}`);
    }
    
    return 'Match cards display correct information';
});

// State Updates
verifier.verify('IMPL-5', 'State updates reflect in UI correctly', () => {
    const lobbyScreen = new LobbyScreen();
    const stateManager = new StateManager();
    
    lobbyScreen.initialize(stateManager);
    
    const state = stateManager.getState();
    const element = lobbyScreen.render(state);
    
    // Add to DOM for testing
    document.body.appendChild(element);
    
    // Update wallet
    const newWallet = 2500.50;
    stateManager.updateState({ wallet: newWallet });
    
    const walletBalance = element.querySelector('.wallet-balance');
    if (walletBalance.textContent !== newWallet.toFixed(2)) {
        throw new Error(`Wallet not updated: expected ${newWallet.toFixed(2)}, got ${walletBalance.textContent}`);
    }
    
    // Update classic mode
    stateManager.updateState({ classicMode: true });
    
    const checkbox = element.querySelector('#classic-mode-checkbox');
    if (!checkbox.checked) {
        throw new Error('Classic mode checkbox not updated');
    }
    
    element.remove();
    return 'State updates reflect correctly in UI';
});

// Run all verifications
console.log('Starting requirements verification...\n');

// Run synchronous verifications first
const syncVerifications = [
    () => verifier.verify('1.1', 'Initialize player with $1000 virtual currency', () => {
        const stateManager = new StateManager();
        const state = stateManager.getState();
        
        if (state.wallet !== 1000) {
            throw new Error(`Expected wallet to be 1000, got ${state.wallet}`);
        }
        
        return `Wallet initialized with $${state.wallet}`;
    }),
    
    () => verifier.verify('1.2', 'Display available simulated soccer matches', () => {
        const lobbyScreen = new LobbyScreen();
        const matches = lobbyScreen.getAvailableMatches();
        
        if (!Array.isArray(matches) || matches.length === 0) {
            throw new Error('No available matches found');
        }
        
        if (matches.length < 3 || matches.length > 6) {
            throw new Error(`Expected 3-6 matches, got ${matches.length}`);
        }
        
        matches.forEach((match, index) => {
            if (!match.homeTeam || !match.awayTeam) {
                throw new Error(`Match ${index} missing team names`);
            }
            if (!match.odds || !match.odds.home || !match.odds.draw || !match.odds.away) {
                throw new Error(`Match ${index} missing odds structure`);
            }
        });
        
        return `${matches.length} matches available with valid structure`;
    }),
    
    () => verifier.verify('1.3', 'Initialize matches with random teams and odds', () => {
        const lobbyScreen = new LobbyScreen();
        const matches = lobbyScreen.getAvailableMatches();
        
        const allTeams = [];
        matches.forEach(match => {
            allTeams.push(match.homeTeam, match.awayTeam);
        });
        const uniqueTeams = new Set(allTeams);
        
        if (uniqueTeams.size !== allTeams.length) {
            throw new Error('Teams are not unique across matches');
        }
        
        const baseOdds = { home: 1.85, draw: 3.50, away: 4.20 };
        const maxVariation = 0.5;
        
        matches.forEach((match, index) => {
            const { home, draw, away } = match.odds;
            
            if (Math.abs(home - baseOdds.home) > maxVariation) {
                throw new Error(`Match ${index} home odds ${home} too far from base ${baseOdds.home}`);
            }
            if (Math.abs(draw - baseOdds.draw) > maxVariation) {
                throw new Error(`Match ${index} draw odds ${draw} too far from base ${baseOdds.draw}`);
            }
            if (Math.abs(away - baseOdds.away) > maxVariation) {
                throw new Error(`Match ${index} away odds ${away} too far from base ${baseOdds.away}`);
            }
        });
        
        return `All matches have unique teams and odds within acceptable range`;
    })
];

// Run sync verifications
syncVerifications.forEach(fn => fn());

// Run async verification
await verifier.verifyAsync('1.5', 'Auto-join functionality transitions directly to match view', async () => {
    return new Promise((resolve, reject) => {
        const lobbyScreen = new LobbyScreen();
        const stateManager = new StateManager();
        
        lobbyScreen.initialize(stateManager);
        
        const state = stateManager.getState();
        const element = lobbyScreen.render(state);
        
        document.body.appendChild(element);
        
        const firstMatch = lobbyScreen.getAvailableMatches()[0];
        
        const unsubscribe = stateManager.subscribe((newState) => {
            if (newState.currentScreen === 'match') {
                try {
                    if (!newState.match.active) {
                        throw new Error('Match should be active after auto-join');
                    }
                    
                    if (newState.match.homeTeam !== firstMatch.homeTeam) {
                        throw new Error(`Expected home team ${firstMatch.homeTeam}, got ${newState.match.homeTeam}`);
                    }
                    
                    if (newState.match.awayTeam !== firstMatch.awayTeam) {
                        throw new Error(`Expected away team ${firstMatch.awayTeam}, got ${newState.match.awayTeam}`);
                    }
                    
                    unsubscribe();
                    element.remove();
                    resolve(`Auto-join successful: ${firstMatch.homeTeam} vs ${firstMatch.awayTeam}`);
                    
                } catch (error) {
                    unsubscribe();
                    element.remove();
                    reject(error);
                }
            }
        });
        
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback) => {
            callback();
            global.setTimeout = originalSetTimeout;
        };
        
        const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
        if (!joinButton) {
            unsubscribe();
            element.remove();
            reject(new Error('Join button not found'));
            return;
        }
        
        joinButton.click();
    });
});

// Print final summary
const allPassed = verifier.printSummary();

if (allPassed) {
    console.log('\n🎉 All requirements verified successfully!');
    console.log('LobbyScreen implementation is compliant with specifications.');
} else {
    console.log('\n⚠️  Some requirements failed verification.');
    console.log('Please review and fix the failing requirements.');
}

export { verifier };