/**
 * FullMatchBetting Integration Test
 * Tests integration with StateManager and BettingManager
 */

import { FullMatchBetting } from './FullMatchBetting.js';
import { StateManager } from '../core/StateManager.js';
import { BettingManager } from './BettingManager.js';

// Mock DOM for testing
function setupTestDOM() {
    document.body.innerHTML = `
        <div id="match-screen">
            <div id="match-info">
                <h2>Match: Arsenal vs Chelsea</h2>
                <div id="score">0 - 0</div>
                <div id="timer">0:00</div>
            </div>
        </div>
    `;
}

describe('FullMatchBetting Integration', () => {
    let stateManager;
    let bettingManager;
    let fullMatchBetting;
    let powerUpManager;

    beforeEach(() => {
        setupTestDOM();
        
        // Mock PowerUpManager
        powerUpManager = {
            awardPowerUp: () => ({ success: true }),
            hasPowerUp: () => false,
            applyPowerUp: () => ({ success: true })
        };
        
        stateManager = new StateManager();
        bettingManager = new BettingManager(stateManager, powerUpManager);
        fullMatchBetting = new FullMatchBetting(stateManager, bettingManager);
        
        // Initialize match state
        stateManager.updateState({
            currentScreen: 'match',
            match: {
                active: true,
                time: 15,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 0,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                initialOdds: { home: 1.85, draw: 3.50, away: 4.20 }
            }
        });
    });

    afterEach(() => {
        if (fullMatchBetting) {
            fullMatchBetting.cleanup();
        }
        document.body.innerHTML = '';
    });

    test('should integrate with StateManager for state updates', () => {
        fullMatchBetting.initialize();
        
        // Place a bet
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        document.querySelector('.place-bet-btn').click();
        
        // Verify state was updated
        const state = stateManager.getState();
        expect(state.bets.fullMatch).toHaveLength(1);
        expect(state.wallet).toBe(975); // 1000 - 25
        expect(state.betAmountMemory.fullMatch).toBe(25);
    });

    test('should integrate with BettingManager for bet validation', () => {
        fullMatchBetting.initialize();
        
        // Try to place bet with insufficient funds
        stateManager.updateState({ wallet: 10 });
        
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        
        const amountInput = document.getElementById('bet-amount');
        amountInput.value = '50';
        amountInput.dispatchEvent(new Event('input'));
        
        const placeBetBtn = document.querySelector('.place-bet-btn');
        expect(placeBetBtn.disabled).toBe(true);
    });

    test('should respond to state changes from external sources', () => {
        fullMatchBetting.initialize();
        
        // External odds update (e.g., from goal event)
        stateManager.updateState({
            match: {
                ...stateManager.getState().match,
                odds: { home: 2.50, draw: 3.20, away: 3.80 }
            }
        });
        
        // Verify odds display updated
        const homeOdds = document.querySelector('[data-outcome="home"] .odds-display');
        expect(homeOdds.textContent).toBe('2.50');
    });

    test('should handle multiple concurrent bets correctly', () => {
        fullMatchBetting.initialize();
        
        // Place multiple bets quickly
        const homeButton = document.querySelector('[data-outcome="home"]');
        const drawButton = document.querySelector('[data-outcome="draw"]');
        const awayButton = document.querySelector('[data-outcome="away"]');
        
        // Bet on home
        homeButton.click();
        document.querySelector('.place-bet-btn').click();
        
        // Bet on draw
        drawButton.click();
        document.querySelector('.place-bet-btn').click();
        
        // Bet on away
        awayButton.click();
        document.querySelector('.place-bet-btn').click();
        
        const state = stateManager.getState();
        expect(state.bets.fullMatch).toHaveLength(3);
        expect(state.wallet).toBe(925); // 1000 - (25 * 3)
        
        // Verify all outcomes are represented
        const outcomes = state.bets.fullMatch.map(bet => bet.outcome);
        expect(outcomes).toContain('home');
        expect(outcomes).toContain('draw');
        expect(outcomes).toContain('away');
    });

    test('should maintain bet amount memory across multiple bets', () => {
        fullMatchBetting.initialize();
        
        // Place bet with custom amount
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        
        const amountInput = document.getElementById('bet-amount');
        amountInput.value = '75';
        document.querySelector('.place-bet-btn').click();
        
        // Place another bet - should remember the amount
        const drawButton = document.querySelector('[data-outcome="draw"]');
        drawButton.click();
        
        const newAmountInput = document.getElementById('bet-amount');
        expect(newAmountInput.value).toBe('75');
    });

    test('should work with BettingManager bet resolution', () => {
        fullMatchBetting.initialize();
        
        // Place some bets
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        document.querySelector('.place-bet-btn').click();
        
        const drawButton = document.querySelector('[data-outcome="draw"]');
        drawButton.click();
        document.querySelector('.place-bet-btn').click();
        
        // Resolve bets (home wins)
        const result = bettingManager.resolveBets('home', 'fullMatch');
        
        expect(result.success).toBe(true);
        expect(result.resolvedBets).toBe(2);
        
        // Check final state
        const state = stateManager.getState();
        const homeBet = state.bets.fullMatch.find(bet => bet.outcome === 'home');
        const drawBet = state.bets.fullMatch.find(bet => bet.outcome === 'draw');
        
        expect(homeBet.status).toBe('won');
        expect(drawBet.status).toBe('lost');
        
        // Wallet should include winnings from home bet
        const expectedWinnings = 25 * 1.85; // stake * odds
        expect(state.wallet).toBe(950 + expectedWinnings); // 1000 - 50 + winnings
    });

    test('should handle power-up integration', () => {
        fullMatchBetting.initialize();
        
        // Mock power-up in state
        stateManager.updateState({
            powerUp: {
                held: { id: 'power1', type: '2x_multiplier' },
                applied: false
            }
        });
        
        // Place a bet
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        document.querySelector('.place-bet-btn').click();
        
        const state = stateManager.getState();
        const bet = state.bets.fullMatch[0];
        
        // Apply power-up to the bet
        const result = bettingManager.applyPowerUp(bet.id);
        expect(result.success).toBe(true);
        
        // Verify power-up was applied
        const updatedState = stateManager.getState();
        const updatedBet = updatedState.bets.fullMatch[0];
        expect(updatedBet.powerUpApplied).toBe(true);
        expect(updatedBet.potentialWinnings).toBe(25 * 1.85 * 2); // doubled
    });

    test('should update active bets display when bets are resolved', () => {
        fullMatchBetting.initialize();
        
        // Place a bet
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        document.querySelector('.place-bet-btn').click();
        
        // Verify active bets display exists
        let activeBetsDisplay = document.getElementById('active-full-match-bets');
        expect(activeBetsDisplay).toBeTruthy();
        
        // Resolve the bet
        bettingManager.resolveBets('home', 'fullMatch');
        fullMatchBetting.updateActiveBetsDisplay();
        
        // Active bets display should be removed
        activeBetsDisplay = document.getElementById('active-full-match-bets');
        expect(activeBetsDisplay).toBeFalsy();
    });

    test('should handle team name updates from state', () => {
        fullMatchBetting.initialize();
        
        // Update team names
        stateManager.updateState({
            match: {
                ...stateManager.getState().match,
                homeTeam: 'Manchester United',
                awayTeam: 'Liverpool'
            }
        });
        
        fullMatchBetting.updateBettingInterface();
        
        // Verify button labels updated
        const homeLabel = document.querySelector('[data-outcome="home"] .outcome-label');
        const awayLabel = document.querySelector('[data-outcome="away"] .outcome-label');
        
        expect(homeLabel.textContent).toBe('Manchester United');
        expect(awayLabel.textContent).toBe('Liverpool');
    });

    test('should maintain betting functionality during match progression', () => {
        fullMatchBetting.initialize();
        
        // Simulate match progression with multiple events
        for (let minute = 15; minute <= 45; minute += 10) {
            // Update match time
            stateManager.updateState({
                match: {
                    ...stateManager.getState().match,
                    time: minute
                }
            });
            
            // Place a bet during the match
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
        }
        
        const state = stateManager.getState();
        expect(state.bets.fullMatch).toHaveLength(4); // 4 bets placed
        expect(state.match.time).toBe(45); // Match progressed
    });

    test('should handle edge case of zero wallet balance', () => {
        fullMatchBetting.initialize();
        
        // Set wallet to very low amount
        stateManager.updateState({ wallet: 0 });
        
        const homeButton = document.querySelector('[data-outcome="home"]');
        homeButton.click();
        
        // All betting should be disabled
        const placeBetBtn = document.querySelector('.place-bet-btn');
        expect(placeBetBtn.disabled).toBe(true);
        
        const amountInput = document.getElementById('bet-amount');
        expect(parseInt(amountInput.max)).toBe(0);
    });
});

console.log('FullMatchBetting integration tests completed');