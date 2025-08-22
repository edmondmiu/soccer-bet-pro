/**
 * MatchScreen Tests
 * Tests for main match interface with live updates and betting controls
 */

import { MatchScreen } from './MatchScreen.js';

// Mock dependencies
class MockStateManager {
    constructor() {
        this.state = {
            currentScreen: 'match',
            wallet: 1000,
            classicMode: false,
            match: {
                active: true,
                time: 45,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 1,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
                timeline: [
                    {
                        id: '1',
                        type: 'GOAL',
                        time: 23,
                        description: 'Arsenal scores! Great shot by Smith.',
                        data: { team: 'home', player: 'Smith' }
                    },
                    {
                        id: '2',
                        type: 'ACTION_BET',
                        time: 35,
                        description: 'Corner kick opportunity',
                        data: { choices: [] }
                    }
                ]
            },
            bets: {
                fullMatch: [
                    {
                        id: 'bet1',
                        type: 'fullMatch',
                        outcome: 'home',
                        stake: 50,
                        odds: 1.85,
                        potentialWinnings: 92.50,
                        status: 'pending',
                        placedAt: Date.now(),
                        powerUpApplied: false
                    }
                ],
                actionBets: []
            },
            powerUp: {
                held: {
                    id: 'power1',
                    type: '2x_multiplier',
                    description: '2x Winnings Multiplier',
                    awardedAt: Date.now()
                },
                applied: false
            },
            betAmountMemory: {
                fullMatch: 25,
                opportunity: 25
            }
        };
        this.observers = new Set();
    }

    getState() {
        return { ...this.state };
    }

    subscribe(callback) {
        this.observers.add(callback);
    }

    unsubscribe(callback) {
        this.observers.delete(callback);
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.observers.forEach(callback => callback(this.state));
    }
}

class MockFullMatchBetting {
    constructor() {
        this.bets = [];
    }

    placeBet(outcome, amount) {
        if (amount <= 0) {
            throw new Error('Invalid bet amount');
        }
        
        const bet = {
            id: `bet_${Date.now()}`,
            outcome,
            amount,
            timestamp: Date.now()
        };
        
        this.bets.push(bet);
        return bet;
    }

    getBets() {
        return [...this.bets];
    }
}

// Test utilities
function createMockDOM() {
    // Create basic DOM structure
    document.body.innerHTML = '<div id="app"></div>';
}

function cleanupDOM() {
    document.body.innerHTML = '';
    // Remove any added styles
    const styles = document.querySelectorAll('style[id*="match-screen"]');
    styles.forEach(style => style.remove());
}

// Test Suite
describe('MatchScreen', () => {
    let matchScreen;
    let mockStateManager;
    let mockFullMatchBetting;

    beforeEach(() => {
        createMockDOM();
        matchScreen = new MatchScreen();
        mockStateManager = new MockStateManager();
        mockFullMatchBetting = new MockFullMatchBetting();
        
        matchScreen.initialize({
            stateManager: mockStateManager,
            fullMatchBetting: mockFullMatchBetting
        });
    });

    afterEach(() => {
        if (matchScreen) {
            matchScreen.destroy();
        }
        cleanupDOM();
    });

    describe('Initialization', () => {
        test('should initialize with correct dependencies', () => {
            expect(matchScreen.stateManager).toBe(mockStateManager);
            expect(matchScreen.fullMatchBetting).toBe(mockFullMatchBetting);
            expect(matchScreen.isInitialized).toBe(true);
        });

        test('should initialize without dependencies', () => {
            const newMatchScreen = new MatchScreen();
            expect(newMatchScreen.isInitialized).toBe(false);
            expect(newMatchScreen.stateManager).toBeNull();
            expect(newMatchScreen.fullMatchBetting).toBeNull();
        });
    });

    describe('Rendering', () => {
        test('should render match screen with complete interface', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            expect(element).toBeTruthy();
            expect(element.id).toBe('match-screen');
            expect(element.className).toBe('match-screen');

            // Check main sections exist
            expect(element.querySelector('.match-header')).toBeTruthy();
            expect(element.querySelector('.match-content')).toBeTruthy();
            expect(element.querySelector('.betting-section')).toBeTruthy();
            expect(element.querySelector('.event-feed-section')).toBeTruthy();
        });

        test('should display team names and score correctly', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeTeam = element.querySelector('.home-team');
            const awayTeam = element.querySelector('.away-team');
            const score = element.querySelector('.match-score');

            expect(homeTeam.textContent).toBe('Arsenal');
            expect(awayTeam.textContent).toBe('Chelsea');
            expect(score.textContent).toBe('1 - 0');
        });

        test('should display match timer correctly', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const timer = element.querySelector('.match-timer');
            expect(timer.textContent).toBe('45\'');
        });

        test('should display wallet balance correctly', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const wallet = element.querySelector('.wallet-balance');
            expect(wallet.textContent).toBe('$1000.00');
        });

        test('should render betting buttons with correct odds', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeOdds = element.querySelector('.odds-home');
            const drawOdds = element.querySelector('.odds-draw');
            const awayOdds = element.querySelector('.odds-away');

            expect(homeOdds.textContent).toBe('1.85');
            expect(drawOdds.textContent).toBe('3.50');
            expect(awayOdds.textContent).toBe('4.20');
        });

        test('should render power-up display when power-up is held', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const powerUpButton = element.querySelector('.power-up-button');
            expect(powerUpButton).toBeTruthy();
            expect(powerUpButton.textContent).toContain('Use Power-Up');
        });

        test('should render empty power-up display when no power-up', () => {
            const state = mockStateManager.getState();
            state.powerUp.held = null;
            const element = matchScreen.render(state);

            const powerUpEmpty = element.querySelector('.power-up-empty');
            expect(powerUpEmpty).toBeTruthy();
            expect(powerUpEmpty.textContent).toBe('No Power-Up');
        });

        test('should render error screen when no match data', () => {
            const element = matchScreen.render({});

            expect(element.className).toContain('error-screen');
            expect(element.textContent).toContain('Match Not Available');
        });
    });

    describe('Current Bets Display', () => {
        test('should render current bets correctly', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const betsDisplay = element.querySelector('#bets-display');
            expect(betsDisplay).toBeTruthy();

            const betItems = betsDisplay.querySelectorAll('.bet-item');
            expect(betItems.length).toBe(1);

            const betItem = betItems[0];
            expect(betItem.textContent).toContain('home');
            expect(betItem.textContent).toContain('$50.00');
            expect(betItem.textContent).toContain('$92.50');
        });

        test('should show no bets message when no bets exist', () => {
            const state = mockStateManager.getState();
            state.bets.fullMatch = [];
            state.bets.actionBets = [];
            const element = matchScreen.render(state);

            const noBets = element.querySelector('.no-bets');
            expect(noBets).toBeTruthy();
            expect(noBets.textContent).toBe('No active bets');
        });

        test('should display power-up indicator on bets', () => {
            const state = mockStateManager.getState();
            state.bets.fullMatch[0].powerUpApplied = true;
            const element = matchScreen.render(state);

            const betItem = element.querySelector('.bet-item');
            expect(betItem.textContent).toContain('⭐');
        });
    });

    describe('Event Feed', () => {
        test('should render event feed correctly', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const eventFeed = element.querySelector('#event-feed');
            expect(eventFeed).toBeTruthy();

            const eventItems = eventFeed.querySelectorAll('.event-item');
            expect(eventItems.length).toBe(2);

            // Events should be in reverse order (most recent first)
            const firstEvent = eventItems[0];
            expect(firstEvent.textContent).toContain('35\'');
            expect(firstEvent.textContent).toContain('Corner kick opportunity');
        });

        test('should show no events message when timeline is empty', () => {
            const state = mockStateManager.getState();
            state.match.timeline = [];
            const element = matchScreen.render(state);

            const noEvents = element.querySelector('.no-events');
            expect(noEvents).toBeTruthy();
            expect(noEvents.textContent).toBe('Match starting soon...');
        });

        test('should apply correct CSS classes for event types', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const eventItems = element.querySelectorAll('.event-item');
            
            // Check goal event class
            const goalEvent = Array.from(eventItems).find(item => 
                item.textContent.includes('Arsenal scores')
            );
            expect(goalEvent.className).toContain('event-goal');

            // Check action bet event class
            const actionBetEvent = Array.from(eventItems).find(item => 
                item.textContent.includes('Corner kick')
            );
            expect(actionBetEvent.className).toContain('event-action-bet');
        });
    });

    describe('Betting Form', () => {
        test('should show betting form when betting button clicked', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const bettingForm = element.querySelector('.betting-form');
            expect(bettingForm).toBeTruthy();
            expect(bettingForm.textContent).toContain('Bet on Arsenal');
        });

        test('should pre-populate bet amount from memory', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const amountInput = element.querySelector('#bet-amount');
            expect(amountInput.value).toBe('25');
        });

        test('should calculate potential winnings correctly', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const potentialWinnings = element.querySelector('#potential-winnings');
            expect(potentialWinnings.textContent).toBe('46.25'); // 25 * 1.85
        });

        test('should update potential winnings when amount changes', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const amountInput = element.querySelector('#bet-amount');
            const potentialWinnings = element.querySelector('#potential-winnings');

            // Change amount
            amountInput.value = '100';
            amountInput.dispatchEvent(new Event('input'));

            expect(potentialWinnings.textContent).toBe('185.00'); // 100 * 1.85
        });

        test('should close betting form when cancel clicked', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            let bettingForm = element.querySelector('.betting-form');
            expect(bettingForm).toBeTruthy();

            const cancelButton = element.querySelector('.cancel-bet-btn');
            cancelButton.click();

            bettingForm = element.querySelector('.betting-form');
            expect(bettingForm).toBeFalsy();
        });

        test('should close betting form when close button clicked', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const closeButton = element.querySelector('.close-form-btn');
            closeButton.click();

            const bettingForm = element.querySelector('.betting-form');
            expect(bettingForm).toBeFalsy();
        });
    });

    describe('Bet Placement', () => {
        test('should place bet successfully with valid amount', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const amountInput = element.querySelector('#bet-amount');
            amountInput.value = '50';

            const placeBetButton = element.querySelector('.place-bet-btn');
            placeBetButton.click();

            // Check that bet was placed
            const bets = mockFullMatchBetting.getBets();
            expect(bets.length).toBe(1);
            expect(bets[0].outcome).toBe('home');
            expect(bets[0].amount).toBe(50);
        });

        test('should handle invalid bet amount', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const amountInput = element.querySelector('#bet-amount');
            amountInput.value = '0';

            const placeBetButton = element.querySelector('.place-bet-btn');
            
            // Should not throw error, but should handle gracefully
            expect(() => placeBetButton.click()).not.toThrow();
        });

        test('should place bet when Enter key pressed in amount input', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const homeButton = element.querySelector('[data-outcome="home"]');
            homeButton.click();

            const amountInput = element.querySelector('#bet-amount');
            amountInput.value = '75';

            const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
            amountInput.dispatchEvent(enterEvent);

            const bets = mockFullMatchBetting.getBets();
            expect(bets.length).toBe(1);
            expect(bets[0].amount).toBe(75);
        });
    });

    describe('State Updates', () => {
        test('should update timer display when time changes', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            matchScreen.updateTimer(67);

            const timer = element.querySelector('.match-timer');
            expect(timer.textContent).toBe('67\'');
        });

        test('should update score display when score changes', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            matchScreen.updateScore(2, 1);

            const score = element.querySelector('.match-score');
            expect(score.textContent).toBe('2 - 1');
        });

        test('should update wallet display when balance changes', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            matchScreen.updateWallet(750.50);

            const wallet = element.querySelector('.wallet-balance');
            expect(wallet.textContent).toBe('$750.50');
        });

        test('should update odds display when odds change', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const newOdds = { home: 1.50, draw: 4.00, away: 5.00 };
            matchScreen.updateOdds(newOdds);

            const homeOdds = element.querySelector('.odds-home');
            const drawOdds = element.querySelector('.odds-draw');
            const awayOdds = element.querySelector('.odds-away');

            expect(homeOdds.textContent).toBe('1.50');
            expect(drawOdds.textContent).toBe('4.00');
            expect(awayOdds.textContent).toBe('5.00');
        });

        test('should update complete state through update method', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const newState = {
                ...state,
                match: {
                    ...state.match,
                    time: 78,
                    homeScore: 3,
                    awayScore: 1,
                    odds: { home: 1.20, draw: 6.00, away: 8.00 }
                },
                wallet: 1250
            };

            matchScreen.update(newState);

            // Check all updates applied
            expect(element.querySelector('.match-timer').textContent).toBe('78\'');
            expect(element.querySelector('.match-score').textContent).toBe('3 - 1');
            expect(element.querySelector('.wallet-balance').textContent).toBe('$1250.00');
            expect(element.querySelector('.odds-home').textContent).toBe('1.20');
        });
    });

    describe('Power-Up Functionality', () => {
        test('should handle power-up button click', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            const powerUpButton = element.querySelector('.power-up-button');
            
            // Should not throw error
            expect(() => powerUpButton.click()).not.toThrow();
        });

        test('should update power-up display when power-up state changes', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            // Remove power-up
            matchScreen.updatePowerUpDisplay({ held: null, applied: false });

            const powerUpEmpty = element.querySelector('.power-up-empty');
            expect(powerUpEmpty).toBeTruthy();
            expect(powerUpEmpty.textContent).toBe('No Power-Up');
        });
    });

    describe('Responsive Design', () => {
        test('should handle window resize', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });

            matchScreen.handleResize();

            expect(element.className).toContain('mobile-layout');
        });

        test('should remove mobile layout on desktop viewport', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);

            // Set mobile first
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });
            matchScreen.handleResize();

            // Then desktop
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1200
            });
            matchScreen.handleResize();

            expect(element.className).not.toContain('mobile-layout');
        });
    });

    describe('Utility Methods', () => {
        test('should get correct outcome labels', () => {
            const state = mockStateManager.getState();
            
            expect(matchScreen.getOutcomeLabel('home', state)).toBe('Arsenal');
            expect(matchScreen.getOutcomeLabel('away', state)).toBe('Chelsea');
            expect(matchScreen.getOutcomeLabel('draw', state)).toBe('Draw');
            expect(matchScreen.getOutcomeLabel('unknown', state)).toBe('unknown');
        });

        test('should get correct event CSS classes', () => {
            expect(matchScreen.getEventClass('GOAL')).toBe('event-goal');
            expect(matchScreen.getEventClass('ACTION_BET')).toBe('event-action-bet');
            expect(matchScreen.getEventClass('RESOLUTION')).toBe('event-resolution');
            expect(matchScreen.getEventClass('COMMENTARY')).toBe('event-commentary');
            expect(matchScreen.getEventClass('UNKNOWN')).toBe('event-default');
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources when destroyed', () => {
            const state = mockStateManager.getState();
            const element = matchScreen.render(state);
            
            document.body.appendChild(element);

            matchScreen.destroy();

            expect(matchScreen.element).toBeNull();
            expect(matchScreen.stateManager).toBeNull();
            expect(matchScreen.fullMatchBetting).toBeNull();
            expect(matchScreen.isInitialized).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing dependencies gracefully', () => {
            const uninitializedScreen = new MatchScreen();
            const state = mockStateManager.getState();

            // Should not throw errors
            expect(() => uninitializedScreen.render(state)).not.toThrow();
            expect(() => uninitializedScreen.update(state)).not.toThrow();
            expect(() => uninitializedScreen.updateTimer(45)).not.toThrow();
        });

        test('should handle missing DOM elements gracefully', () => {
            const state = mockStateManager.getState();
            matchScreen.render(state);

            // Clear cached elements
            matchScreen.timerDisplay = null;
            matchScreen.scoreDisplay = null;
            matchScreen.walletDisplay = null;

            // Should not throw errors
            expect(() => matchScreen.updateTimer(45)).not.toThrow();
            expect(() => matchScreen.updateScore(2, 1)).not.toThrow();
            expect(() => matchScreen.updateWallet(500)).not.toThrow();
        });
    });
});

// Export for use in other test files
export { MockStateManager, MockFullMatchBetting };