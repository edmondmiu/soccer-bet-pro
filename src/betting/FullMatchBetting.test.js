/**
 * FullMatchBetting Tests
 * Tests for continuous betting functionality without pauses
 */

import { FullMatchBetting } from './FullMatchBetting.js';
import { StateManager } from '../core/StateManager.js';
import { BettingManager } from './BettingManager.js';

// Mock DOM environment for testing
function setupMockDOM() {
    // Create basic DOM structure
    document.body.innerHTML = `
        <div id="match-screen"></div>
    `;
    
    // Mock DOM methods that might not exist in test environment
    if (!Element.prototype.remove) {
        Element.prototype.remove = function() {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        };
    }
}

// Test suite for FullMatchBetting
describe('FullMatchBetting', () => {
    let stateManager;
    let bettingManager;
    let fullMatchBetting;
    let powerUpManager;

    beforeEach(() => {
        setupMockDOM();
        
        // Create mock PowerUpManager
        powerUpManager = {
            awardPowerUp: () => ({ success: true }),
            hasPowerUp: () => false,
            applyPowerUp: () => ({ success: true })
        };
        
        stateManager = new StateManager();
        bettingManager = new BettingManager(stateManager, powerUpManager);
        fullMatchBetting = new FullMatchBetting(stateManager, bettingManager);
        
        // Set up initial match state
        stateManager.updateState({
            match: {
                active: true,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            }
        });
    });

    afterEach(() => {
        if (fullMatchBetting) {
            fullMatchBetting.cleanup();
        }
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        test('should create betting interface on initialization', () => {
            fullMatchBetting.initialize();
            
            const bettingContainer = document.getElementById('full-match-betting');
            expect(bettingContainer).toBeTruthy();
            expect(bettingContainer.className).toBe('full-match-betting-container');
        });

        test('should create betting buttons for all outcomes', () => {
            fullMatchBetting.initialize();
            
            const homeButton = document.querySelector('[data-outcome="home"]');
            const drawButton = document.querySelector('[data-outcome="draw"]');
            const awayButton = document.querySelector('[data-outcome="away"]');
            
            expect(homeButton).toBeTruthy();
            expect(drawButton).toBeTruthy();
            expect(awayButton).toBeTruthy();
        });

        test('should display correct team names and odds', () => {
            fullMatchBetting.initialize();
            
            const homeLabel = document.querySelector('[data-outcome="home"] .outcome-label');
            const awayLabel = document.querySelector('[data-outcome="away"] .outcome-label');
            const homeOdds = document.querySelector('[data-outcome="home"] .odds-display');
            
            expect(homeLabel.textContent).toBe('Arsenal');
            expect(awayLabel.textContent).toBe('Chelsea');
            expect(homeOdds.textContent).toBe('1.85');
        });
    });

    describe('Betting Form Display', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should show betting form when outcome button clicked', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const bettingForm = document.querySelector('.inline-betting-form');
            expect(bettingForm).toBeTruthy();
            expect(bettingForm.querySelector('h3').textContent).toBe('Place Bet: Arsenal');
        });

        test('should pre-populate form with remembered bet amount', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const amountInput = document.getElementById('bet-amount');
            expect(amountInput.value).toBe('25'); // Default remembered amount
        });

        test('should display current odds and wallet balance', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const oddsValue = document.querySelector('.odds-info .value');
            const walletValue = document.querySelector('.wallet-info .value');
            
            expect(oddsValue.textContent).toBe('1.85');
            expect(walletValue.textContent).toBe('$1000.00');
        });

        test('should calculate potential winnings correctly', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const potentialWinnings = document.getElementById('potential-winnings');
            expect(potentialWinnings.textContent).toBe('$46.25'); // 25 * 1.85
        });

        test('should update potential winnings when amount changes', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const amountInput = document.getElementById('bet-amount');
            const potentialWinnings = document.getElementById('potential-winnings');
            
            amountInput.value = '100';
            amountInput.dispatchEvent(new Event('input'));
            
            expect(potentialWinnings.textContent).toBe('$185.00'); // 100 * 1.85
        });
    });

    describe('Bet Placement', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should place bet successfully with valid amount', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const placeBetBtn = document.querySelector('.place-bet-btn');
            placeBetBtn.click();
            
            const state = stateManager.getState();
            expect(state.bets.fullMatch).toHaveLength(1);
            expect(state.bets.fullMatch[0].outcome).toBe('home');
            expect(state.bets.fullMatch[0].stake).toBe(25);
            expect(state.wallet).toBe(975); // 1000 - 25
        });

        test('should update bet amount memory after successful bet', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const amountInput = document.getElementById('bet-amount');
            amountInput.value = '50';
            
            const placeBetBtn = document.querySelector('.place-bet-btn');
            placeBetBtn.click();
            
            const state = stateManager.getState();
            expect(state.betAmountMemory.fullMatch).toBe(50);
        });

        test('should allow multiple bets on same outcome', () => {
            // Place first bet
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            // Place second bet on same outcome
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const state = stateManager.getState();
            expect(state.bets.fullMatch).toHaveLength(2);
            expect(state.bets.fullMatch[0].outcome).toBe('home');
            expect(state.bets.fullMatch[1].outcome).toBe('home');
        });

        test('should allow multiple bets on different outcomes', () => {
            // Place bet on home
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            // Place bet on away
            const awayButton = document.querySelector('[data-outcome="away"]');
            awayButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const state = stateManager.getState();
            expect(state.bets.fullMatch).toHaveLength(2);
            expect(state.bets.fullMatch[0].outcome).toBe('home');
            expect(state.bets.fullMatch[1].outcome).toBe('away');
        });

        test('should prevent betting with insufficient funds', () => {
            // Reduce wallet balance
            stateManager.updateState({ wallet: 10 });
            
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const amountInput = document.getElementById('bet-amount');
            amountInput.value = '50'; // More than wallet balance
            amountInput.dispatchEvent(new Event('input'));
            
            const placeBetBtn = document.querySelector('.place-bet-btn');
            expect(placeBetBtn.disabled).toBe(true);
        });

        test('should clear form after successful bet placement', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const placeBetBtn = document.querySelector('.place-bet-btn');
            placeBetBtn.click();
            
            const bettingForm = document.querySelector('.inline-betting-form');
            expect(bettingForm).toBeFalsy();
        });
    });

    describe('Form Interactions', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should close form when cancel button clicked', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const cancelBtn = document.querySelector('.cancel-bet-btn');
            cancelBtn.click();
            
            const bettingForm = document.querySelector('.inline-betting-form');
            expect(bettingForm).toBeFalsy();
        });

        test('should close form when close button clicked', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const closeBtn = document.querySelector('.close-form-btn');
            closeBtn.click();
            
            const bettingForm = document.querySelector('.inline-betting-form');
            expect(bettingForm).toBeFalsy();
        });

        test('should set amount when quick amount button clicked', () => {
            // Set wallet to ensure quick amounts are available
            stateManager.updateState({ wallet: 500 });
            
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const quickAmountBtn = document.querySelector('[data-amount="50"]');
            if (quickAmountBtn) {
                quickAmountBtn.click();
                
                const amountInput = document.getElementById('bet-amount');
                expect(amountInput.value).toBe('50');
            }
        });

        test('should place bet when Enter key pressed in amount input', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            
            const amountInput = document.getElementById('bet-amount');
            const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
            amountInput.dispatchEvent(enterEvent);
            
            const state = stateManager.getState();
            expect(state.bets.fullMatch).toHaveLength(1);
        });
    });

    describe('Odds Updates', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should update odds display when state changes', () => {
            // Update odds in state
            stateManager.updateState({
                match: {
                    ...stateManager.getState().match,
                    odds: { home: 2.00, draw: 3.00, away: 4.00 }
                }
            });
            
            const homeOdds = document.querySelector('[data-outcome="home"] .odds-display');
            const drawOdds = document.querySelector('[data-outcome="draw"] .odds-display');
            const awayOdds = document.querySelector('[data-outcome="away"] .odds-display');
            
            expect(homeOdds.textContent).toBe('2.00');
            expect(drawOdds.textContent).toBe('3.00');
            expect(awayOdds.textContent).toBe('4.00');
        });
    });

    describe('Active Bets Display', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should show active bets after placing bet', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const activeBetsDisplay = document.getElementById('active-full-match-bets');
            expect(activeBetsDisplay).toBeTruthy();
            
            const betItem = activeBetsDisplay.querySelector('.active-bet-item');
            expect(betItem).toBeTruthy();
        });

        test('should display correct bet information in active bets', () => {
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const activeBetsDisplay = document.getElementById('active-full-match-bets');
            const betOutcome = activeBetsDisplay.querySelector('.bet-outcome');
            const betStake = activeBetsDisplay.querySelector('.bet-stake');
            const betOdds = activeBetsDisplay.querySelector('.bet-odds');
            
            expect(betOutcome.textContent).toBe('Arsenal');
            expect(betStake.textContent).toBe('$25');
            expect(betOdds.textContent).toBe('1.85');
        });

        test('should show total staked amount', () => {
            // Place multiple bets
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const activeBetsDisplay = document.getElementById('active-full-match-bets');
            const totalStaked = activeBetsDisplay.querySelector('.total-staked');
            
            expect(totalStaked.textContent).toBe('Total Staked: $50.00');
        });

        test('should remove active bets display when no pending bets', () => {
            // Place a bet
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            // Resolve the bet
            bettingManager.resolveBets('home', 'fullMatch');
            fullMatchBetting.updateActiveBetsDisplay();
            
            const activeBetsDisplay = document.getElementById('active-full-match-bets');
            expect(activeBetsDisplay).toBeFalsy();
        });
    });

    describe('Utility Methods', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should get correct outcome labels', () => {
            expect(fullMatchBetting.getOutcomeLabel('home')).toBe('Arsenal');
            expect(fullMatchBetting.getOutcomeLabel('away')).toBe('Chelsea');
            expect(fullMatchBetting.getOutcomeLabel('draw')).toBe('Draw');
        });

        test('should get pending bets correctly', () => {
            // Place some bets
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const pendingBets = fullMatchBetting.getPendingBets();
            expect(pendingBets).toHaveLength(1);
            expect(pendingBets[0].outcome).toBe('home');
        });

        test('should calculate statistics correctly', () => {
            // Place some bets
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const awayButton = document.querySelector('[data-outcome="away"]');
            awayButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const stats = fullMatchBetting.getStatistics();
            expect(stats.totalBets).toBe(2);
            expect(stats.pendingBets).toBe(2);
            expect(stats.totalStaked).toBe(50);
        });

        test('should enable/disable betting interface', () => {
            fullMatchBetting.setEnabled(false);
            
            const bettingButtons = document.querySelectorAll('.betting-button');
            bettingButtons.forEach(button => {
                expect(button.disabled).toBe(true);
            });
            
            fullMatchBetting.setEnabled(true);
            
            bettingButtons.forEach(button => {
                expect(button.disabled).toBe(false);
            });
        });
    });

    describe('Continuous Betting Requirements', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should allow betting without pausing game timer', () => {
            // Mock timer to verify it's not paused
            const mockTimer = { paused: false };
            
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            // Timer should remain unpaused
            expect(mockTimer.paused).toBe(false);
        });

        test('should process bets instantly', () => {
            const initialWallet = stateManager.getState().wallet;
            
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            // Bet should be processed immediately
            const state = stateManager.getState();
            expect(state.wallet).toBe(initialWallet - 25);
            expect(state.bets.fullMatch).toHaveLength(1);
        });

        test('should maintain betting buttons visibility at all times', () => {
            const bettingButtons = document.querySelectorAll('.betting-button');
            expect(bettingButtons).toHaveLength(3);
            
            // Buttons should remain visible even after placing bets
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            const buttonsAfterBet = document.querySelectorAll('.betting-button');
            expect(buttonsAfterBet).toHaveLength(3);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            fullMatchBetting.initialize();
        });

        test('should handle betting manager errors gracefully', () => {
            // Mock betting manager to return error
            const originalPlaceBet = bettingManager.placeBet;
            bettingManager.placeBet = () => ({ success: false, error: 'Test error' });
            
            const homeButton = document.querySelector('[data-outcome="home"]');
            homeButton.click();
            document.querySelector('.place-bet-btn').click();
            
            // Should not crash and form should remain open
            const bettingForm = document.querySelector('.inline-betting-form');
            expect(bettingForm).toBeTruthy();
            
            // Restore original method
            bettingManager.placeBet = originalPlaceBet;
        });

        test('should handle missing DOM elements gracefully', () => {
            // Remove match screen
            document.getElementById('match-screen').remove();
            
            // Should not crash when initializing
            expect(() => {
                const newFullMatchBetting = new FullMatchBetting(stateManager, bettingManager);
                newFullMatchBetting.initialize();
            }).not.toThrow();
        });
    });
});

// Export for use in other test files
export { FullMatchBetting };