/**
 * BettingModal Tests
 * Tests all betting modal interfaces and user interactions
 */

import { BettingModal } from './BettingModal.js';

// Mock dependencies
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            match: {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                homeScore: 1,
                awayScore: 2,
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            },
            bets: {
                fullMatch: [
                    {
                        id: 'bet1',
                        type: 'fullMatch',
                        outcome: 'home',
                        stake: 50,
                        odds: 1.85,
                        status: 'won',
                        actualWinnings: 92.50,
                        powerUpApplied: false
                    },
                    {
                        id: 'bet2',
                        type: 'fullMatch',
                        outcome: 'away',
                        stake: 25,
                        odds: 4.20,
                        status: 'lost',
                        powerUpApplied: true
                    }
                ],
                actionBets: [
                    {
                        id: 'bet3',
                        type: 'actionBet',
                        outcome: 'Goal in next 5 minutes',
                        stake: 30,
                        odds: 2.50,
                        status: 'won',
                        actualWinnings: 75,
                        powerUpApplied: false
                    }
                ]
            },
            betAmountMemory: {
                fullMatch: 50,
                opportunity: 25
            }
        };
        this.subscribers = [];
    }

    getState() {
        return { ...this.state };
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.subscribers.forEach(callback => callback(this.state));
    }

    updateBetAmountMemory(type, amount) {
        this.state.betAmountMemory[type] = amount;
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }
}

class MockTimerManager {
    constructor() {
        this.countdownTime = 10;
        this.callbacks = {};
    }

    startCountdown(duration, callback) {
        this.countdownTime = duration;
        this.countdownCallback = callback;
        return { success: true };
    }

    stopCountdown() {
        this.countdownCallback = null;
        return { success: true };
    }

    getCountdownTime() {
        return this.countdownTime;
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Simulate countdown completion
    simulateTimeout() {
        if (this.countdownCallback) {
            this.countdownCallback();
        }
    }
}

class MockBettingManager {
    constructor() {
        this.bets = [];
    }

    placeBet(betData) {
        if (betData.stake <= 0) {
            return { success: false, error: 'Invalid bet amount' };
        }

        const bet = {
            id: `bet_${Date.now()}`,
            ...betData,
            status: 'pending',
            potentialWinnings: betData.stake * betData.odds,
            placedAt: Date.now()
        };

        this.bets.push(bet);
        return { success: true, bet };
    }

    getPendingBets(type) {
        return this.bets.filter(bet => bet.type === type && bet.status === 'pending');
    }
}

// Mock DOM environment
class MockDocument {
    constructor() {
        this.elements = new Map();
        this.head = { appendChild: () => {} };
        this.body = { appendChild: () => {} };
        this.eventListeners = new Map();
    }

    createElement(tagName) {
        const element = new MockElement(tagName);
        return element;
    }

    getElementById(id) {
        return this.elements.get(id) || null;
    }

    querySelector(selector) {
        // Simple mock implementation
        return this.elements.get(selector) || null;
    }

    querySelectorAll(selector) {
        // Return array of matching elements
        return Array.from(this.elements.values()).filter(el => 
            el.matches && el.matches(selector)
        );
    }

    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    // Simulate event dispatch
    dispatchEvent(event) {
        const listeners = this.eventListeners.get(event.type) || [];
        listeners.forEach(callback => callback(event));
    }
}

class MockElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.className = '';
        this.innerHTML = '';
        this.textContent = '';
        this.style = {};
        this.dataset = {};
        this.children = [];
        this.parentNode = null;
        this.eventListeners = new Map();
        this.attributes = new Map();
    }

    appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    }

    querySelector(selector) {
        // Simple mock - find by class or id
        return this.children.find(child => 
            child.className.includes(selector.replace('.', '')) ||
            child.id === selector.replace('#', '')
        ) || null;
    }

    querySelectorAll(selector) {
        return this.children.filter(child => 
            child.className.includes(selector.replace('.', '')) ||
            child.id === selector.replace('#', '')
        );
    }

    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    dispatchEvent(event) {
        const listeners = this.eventListeners.get(event.type) || [];
        listeners.forEach(callback => callback(event));
    }

    focus() {
        // Mock focus
    }

    select() {
        // Mock select
    }

    get classList() {
        return {
            add: (className) => {
                if (!this.className.includes(className)) {
                    this.className += ` ${className}`;
                }
            },
            remove: (className) => {
                this.className = this.className.replace(className, '').trim();
            },
            contains: (className) => this.className.includes(className),
            toggle: (className) => {
                if (this.classList.contains(className)) {
                    this.classList.remove(className);
                } else {
                    this.classList.add(className);
                }
            }
        };
    }

    setAttribute(name, value) {
        this.attributes.set(name, value);
    }

    getAttribute(name) {
        return this.attributes.get(name);
    }

    matches(selector) {
        return this.className.includes(selector.replace('.', '')) ||
               this.id === selector.replace('#', '');
    }
}

// Test Suite
describe('BettingModal', () => {
    let bettingModal;
    let mockStateManager;
    let mockTimerManager;
    let mockBettingManager;
    let mockDocument;
    let originalDocument;

    beforeEach(() => {
        // Setup mocks
        mockStateManager = new MockStateManager();
        mockTimerManager = new MockTimerManager();
        mockBettingManager = new MockBettingManager();
        mockDocument = new MockDocument();

        // Mock global document
        originalDocument = global.document;
        global.document = mockDocument;
        global.window = { innerWidth: 1024 };

        // Create BettingModal instance
        bettingModal = new BettingModal(mockStateManager, mockTimerManager, mockBettingManager);
    });

    afterEach(() => {
        // Restore original document
        global.document = originalDocument;
        delete global.window;

        // Cleanup
        if (bettingModal) {
            bettingModal.cleanup();
        }
    });

    describe('Initialization', () => {
        test('should initialize with correct dependencies', () => {
            expect(bettingModal.stateManager).toBe(mockStateManager);
            expect(bettingModal.timerManager).toBe(mockTimerManager);
            expect(bettingModal.bettingManager).toBe(mockBettingManager);
        });

        test('should initialize modal system in browser environment', () => {
            expect(bettingModal.modalOverlay).toBeTruthy();
            expect(bettingModal.activeModal).toBeNull();
            expect(bettingModal.countdownInterval).toBeNull();
        });

        test('should handle non-browser environment gracefully', () => {
            global.document = undefined;
            const modal = new BettingModal(mockStateManager, mockTimerManager, mockBettingManager);
            expect(modal.modalOverlay).toBeNull();
        });
    });

    describe('Action Betting Modal', () => {
        const mockEventData = {
            id: 'event1',
            description: 'Corner kick for Arsenal - will it lead to a goal?',
            choices: [
                { id: 'choice1', description: 'Goal from corner', odds: 3.50, outcome: 'goal' },
                { id: 'choice2', description: 'No goal from corner', odds: 1.30, outcome: 'no_goal' },
                { id: 'choice3', description: 'Corner leads to card', odds: 5.00, outcome: 'card' }
            ]
        };

        test('should show action betting modal successfully', async () => {
            const result = await bettingModal.showActionBettingModal(mockEventData);
            
            expect(result.success).toBe(true);
            expect(bettingModal.isModalActive()).toBe(true);
            expect(bettingModal.getActiveModalType()).toBe('actionBetting');
        });

        test('should create modal with correct content', async () => {
            await bettingModal.showActionBettingModal(mockEventData);
            
            const modal = bettingModal.activeModal;
            expect(modal.innerHTML).toContain('⏸️ Game Paused - Betting Opportunity');
            expect(modal.innerHTML).toContain(mockEventData.description);
            expect(modal.innerHTML).toContain('Goal from corner');
            expect(modal.innerHTML).toContain('3.50');
        });

        test('should start countdown when modal opens', async () => {
            await bettingModal.showActionBettingModal(mockEventData);
            
            expect(mockTimerManager.countdownTime).toBe(10);
            expect(mockTimerManager.countdownCallback).toBeTruthy();
        });

        test('should handle modal callbacks', async () => {
            const callbacks = {
                onModalShow: jest.fn(),
                onModalHide: jest.fn()
            };
            bettingModal.setCallbacks(callbacks);

            await bettingModal.showActionBettingModal(mockEventData);
            expect(callbacks.onModalShow).toHaveBeenCalledWith(mockEventData);

            bettingModal.closeModal();
            expect(callbacks.onModalHide).toHaveBeenCalled();
        });

        test('should handle skip betting', async () => {
            const skipCallback = jest.fn();
            bettingModal.setCallbacks({ onSkip: skipCallback });

            await bettingModal.showActionBettingModal(mockEventData);
            bettingModal.skipBetting();

            expect(skipCallback).toHaveBeenCalled();
            expect(bettingModal.isModalActive()).toBe(false);
        });

        test('should handle timeout', async () => {
            const timeoutCallback = jest.fn();
            bettingModal.setCallbacks({ onTimeout: timeoutCallback });

            await bettingModal.showActionBettingModal(mockEventData);
            mockTimerManager.simulateTimeout();

            expect(timeoutCallback).toHaveBeenCalled();
            expect(bettingModal.isModalActive()).toBe(false);
        });
    });

    describe('Bet Slip Modal', () => {
        const mockChoice = {
            id: 'choice1',
            description: 'Goal from corner',
            odds: 3.50,
            outcome: 'goal'
        };

        const mockEventData = {
            id: 'event1',
            description: 'Corner kick event',
            choices: [mockChoice]
        };

        test('should show bet slip modal with pre-populated amount', () => {
            bettingModal.showBetSlipModal(mockChoice, mockEventData);
            
            expect(bettingModal.isModalActive()).toBe(true);
            expect(bettingModal.getActiveModalType()).toBe('betSlip');
            
            const modal = bettingModal.activeModal;
            expect(modal.innerHTML).toContain('Place Your Bet');
            expect(modal.innerHTML).toContain('Goal from corner');
            expect(modal.innerHTML).toContain('value="25"'); // Pre-populated amount
        });

        test('should calculate potential winnings correctly', () => {
            bettingModal.showBetSlipModal(mockChoice, mockEventData);
            
            const modal = bettingModal.activeModal;
            const expectedWinnings = 25 * 3.50; // amount * odds
            expect(modal.innerHTML).toContain(`$${expectedWinnings.toFixed(2)}`);
        });

        test('should generate quick amount buttons based on wallet', () => {
            bettingModal.showBetSlipModal(mockChoice, mockEventData);
            
            const modal = bettingModal.activeModal;
            expect(modal.innerHTML).toContain('data-amount="25"');
            expect(modal.innerHTML).toContain('data-amount="50"');
            expect(modal.innerHTML).toContain('data-amount="100"');
            expect(modal.innerHTML).toContain('data-amount="250"');
        });

        test('should place bet successfully', () => {
            const betPlacedCallback = jest.fn();
            bettingModal.setCallbacks({ onBetPlaced: betPlacedCallback });

            bettingModal.showBetSlipModal(mockChoice, mockEventData);
            bettingModal.placeBet(mockChoice, 50, mockEventData);

            expect(betPlacedCallback).toHaveBeenCalled();
            expect(mockStateManager.state.betAmountMemory.opportunity).toBe(50);
            expect(bettingModal.isModalActive()).toBe(false);
        });

        test('should handle bet placement errors', () => {
            // Mock console.error to avoid test output
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            bettingModal.showBetSlipModal(mockChoice, mockEventData);
            bettingModal.placeBet(mockChoice, 0, mockEventData); // Invalid amount

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Match Summary Modal', () => {
        const mockMatchData = {
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            homeScore: 1,
            awayScore: 2
        };

        test('should show match summary modal with results', () => {
            bettingModal.showMatchSummaryModal(mockMatchData);
            
            expect(bettingModal.isModalActive()).toBe(true);
            expect(bettingModal.getActiveModalType()).toBe('matchSummary');
            
            const modal = bettingModal.activeModal;
            expect(modal.innerHTML).toContain('🏆 Match Complete');
            expect(modal.innerHTML).toContain('Arsenal vs Chelsea');
            expect(modal.innerHTML).toContain('1 - 2');
        });

        test('should calculate betting summary correctly', () => {
            bettingModal.showMatchSummaryModal(mockMatchData);
            
            const modal = bettingModal.activeModal;
            
            // Total bets: 2 full match + 1 action bet = 3
            expect(modal.innerHTML).toContain('<div class="detail-value">3</div>');
            
            // Bets won: 2 (bet1 and bet3)
            expect(modal.innerHTML).toContain('<div class="detail-value won">2</div>');
            
            // Total staked: 50 + 25 + 30 = 105
            expect(modal.innerHTML).toContain('$105.00');
            
            // Total winnings: 92.50 + 75 = 167.50
            expect(modal.innerHTML).toContain('$167.50');
        });

        test('should show individual bet details', () => {
            bettingModal.showMatchSummaryModal(mockMatchData);
            
            const modal = bettingModal.activeModal;
            expect(modal.innerHTML).toContain('Arsenal Win');
            expect(modal.innerHTML).toContain('+$92.50');
            expect(modal.innerHTML).toContain('⭐ Power-up Applied');
            expect(modal.innerHTML).toContain('-$25.00');
        });

        test('should calculate net result correctly', () => {
            bettingModal.showMatchSummaryModal(mockMatchData);
            
            const modal = bettingModal.activeModal;
            // Net: 167.50 - 105 = +62.50
            expect(modal.innerHTML).toContain('+$62.50');
            expect(modal.innerHTML).toContain('🎉 Congratulations!');
        });

        test('should handle return to lobby', () => {
            bettingModal.showMatchSummaryModal(mockMatchData);
            
            // Simulate clicking return to lobby
            const modal = bettingModal.activeModal;
            const returnBtn = modal.querySelector('#return-to-lobby');
            
            if (returnBtn) {
                returnBtn.dispatchEvent(new Event('click'));
            }
            
            expect(mockStateManager.state.currentScreen).toBe('lobby');
            expect(bettingModal.isModalActive()).toBe(false);
        });
    });

    describe('Modal Management', () => {
        test('should close modal on overlay click', async () => {
            const mockEventData = {
                id: 'event1',
                description: 'Test event',
                choices: [{ id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }]
            };

            await bettingModal.showActionBettingModal(mockEventData);
            expect(bettingModal.isModalActive()).toBe(true);

            // Simulate overlay click
            const clickEvent = { target: bettingModal.modalOverlay, type: 'click' };
            bettingModal.modalOverlay.dispatchEvent(clickEvent);

            expect(bettingModal.isModalActive()).toBe(false);
        });

        test('should close modal on escape key', async () => {
            const mockEventData = {
                id: 'event1',
                description: 'Test event',
                choices: [{ id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }]
            };

            await bettingModal.showActionBettingModal(mockEventData);
            expect(bettingModal.isModalActive()).toBe(true);

            // Simulate escape key
            const escapeEvent = { key: 'Escape', type: 'keydown' };
            mockDocument.dispatchEvent(escapeEvent);

            expect(bettingModal.isModalActive()).toBe(false);
        });

        test('should stop countdown when modal closes', async () => {
            const mockEventData = {
                id: 'event1',
                description: 'Test event',
                choices: [{ id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }]
            };

            await bettingModal.showActionBettingModal(mockEventData);
            expect(bettingModal.countdownInterval).toBeTruthy();

            bettingModal.closeModal();
            expect(bettingModal.countdownInterval).toBeNull();
        });

        test('should replace existing modal when showing new one', async () => {
            const mockEventData = {
                id: 'event1',
                description: 'Test event',
                choices: [{ id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }]
            };

            // Show first modal
            await bettingModal.showActionBettingModal(mockEventData);
            const firstModal = bettingModal.activeModal;

            // Show second modal
            await bettingModal.showActionBettingModal(mockEventData);
            const secondModal = bettingModal.activeModal;

            expect(firstModal).not.toBe(secondModal);
            expect(bettingModal.isModalActive()).toBe(true);
        });
    });

    describe('Countdown Timer', () => {
        test('should start countdown with correct duration', () => {
            bettingModal.startCountdown(5);
            expect(bettingModal.countdownInterval).toBeTruthy();
        });

        test('should stop countdown', () => {
            bettingModal.startCountdown(5);
            expect(bettingModal.countdownInterval).toBeTruthy();

            bettingModal.stopCountdown();
            expect(bettingModal.countdownInterval).toBeNull();
        });

        test('should handle countdown completion', () => {
            const timeoutCallback = jest.fn();
            bettingModal.setCallbacks({ onTimeout: timeoutCallback });

            // Mock countdown elements
            const countdownSeconds = new MockElement('span');
            countdownSeconds.id = 'countdown-seconds';
            const countdownDisplay = new MockElement('div');
            countdownDisplay.id = 'countdown-display';
            
            mockDocument.elements.set('countdown-seconds', countdownSeconds);
            mockDocument.elements.set('countdown-display', countdownDisplay);

            bettingModal.startCountdown(1);
            
            // Simulate countdown completion
            setTimeout(() => {
                expect(timeoutCallback).toHaveBeenCalled();
            }, 1100);
        });
    });

    describe('Utility Methods', () => {
        test('should generate quick amount buttons correctly', () => {
            const buttons = bettingModal.generateQuickAmountButtons(1000);
            expect(buttons).toContain('data-amount="25"');
            expect(buttons).toContain('data-amount="50"');
            expect(buttons).toContain('data-amount="100"');
            expect(buttons).toContain('data-amount="250"');
        });

        test('should filter quick amounts based on wallet', () => {
            const buttons = bettingModal.generateQuickAmountButtons(75);
            expect(buttons).toContain('data-amount="25"');
            expect(buttons).toContain('data-amount="50"');
            expect(buttons).not.toContain('data-amount="100"');
            expect(buttons).not.toContain('data-amount="250"');
        });

        test('should get correct bet outcome labels', () => {
            const fullMatchBet = { type: 'fullMatch', outcome: 'home' };
            const actionBet = { type: 'actionBet', outcome: 'Goal scored' };

            expect(bettingModal.getBetOutcomeLabel(fullMatchBet)).toBe('Arsenal Win');
            expect(bettingModal.getBetOutcomeLabel(actionBet)).toBe('Goal scored');
        });

        test('should set and use callbacks correctly', () => {
            const callbacks = {
                onModalShow: jest.fn(),
                onBetPlaced: jest.fn()
            };

            bettingModal.setCallbacks(callbacks);
            expect(bettingModal.callbacks.onModalShow).toBe(callbacks.onModalShow);
            expect(bettingModal.callbacks.onBetPlaced).toBe(callbacks.onBetPlaced);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Remove document to simulate missing DOM
            global.document = undefined;
            
            const modal = new BettingModal(mockStateManager, mockTimerManager, mockBettingManager);
            expect(modal.modalOverlay).toBeNull();
            
            // Should not throw errors
            expect(() => modal.startCountdown(10)).not.toThrow();
            expect(() => modal.closeModal()).not.toThrow();
        });

        test('should handle bet placement errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const choice = { id: 'choice1', description: 'Test', odds: 2.0, outcome: 'test' };
            const eventData = { id: 'event1' };
            
            // This should trigger an error due to invalid amount
            bettingModal.placeBet(choice, -10, eventData);
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should handle cleanup safely', () => {
            expect(() => bettingModal.cleanup()).not.toThrow();
            
            // Should handle multiple cleanups
            expect(() => bettingModal.cleanup()).not.toThrow();
        });
    });

    describe('Responsive Design', () => {
        test('should handle mobile viewport', () => {
            global.window.innerWidth = 500;
            
            const modal = new BettingModal(mockStateManager, mockTimerManager, mockBettingManager);
            expect(modal).toBeTruthy();
        });

        test('should apply mobile styles in CSS', () => {
            const styles = bettingModal.modalOverlay.parentNode.querySelector('style');
            expect(styles).toBeTruthy();
        });
    });
});

// Integration Tests
describe('BettingModal Integration', () => {
    let bettingModal;
    let mockStateManager;
    let mockTimerManager;
    let mockBettingManager;

    beforeEach(() => {
        mockStateManager = new MockStateManager();
        mockTimerManager = new MockTimerManager();
        mockBettingManager = new MockBettingManager();
        
        global.document = new MockDocument();
        global.window = { innerWidth: 1024 };

        bettingModal = new BettingModal(mockStateManager, mockTimerManager, mockBettingManager);
    });

    afterEach(() => {
        delete global.document;
        delete global.window;
        bettingModal.cleanup();
    });

    test('should complete full action betting flow', async () => {
        const eventData = {
            id: 'event1',
            description: 'Test event',
            choices: [
                { id: 'choice1', description: 'Option 1', odds: 2.0, outcome: 'option1' }
            ]
        };

        // Show action betting modal
        await bettingModal.showActionBettingModal(eventData);
        expect(bettingModal.isModalActive()).toBe(true);

        // Select choice and show bet slip
        bettingModal.showBetSlipModal(eventData.choices[0], eventData);
        expect(bettingModal.getActiveModalType()).toBe('betSlip');

        // Place bet
        bettingModal.placeBet(eventData.choices[0], 50, eventData);
        expect(bettingModal.isModalActive()).toBe(false);
        expect(mockBettingManager.bets).toHaveLength(1);
    });

    test('should handle complete match summary flow', () => {
        const matchData = {
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            homeScore: 2,
            awayScore: 1
        };

        // Show match summary
        bettingModal.showMatchSummaryModal(matchData);
        expect(bettingModal.isModalActive()).toBe(true);
        expect(bettingModal.getActiveModalType()).toBe('matchSummary');

        // Return to lobby
        const modal = bettingModal.activeModal;
        const returnBtn = modal.querySelector('#return-to-lobby');
        if (returnBtn) {
            returnBtn.dispatchEvent(new Event('click'));
        }

        expect(mockStateManager.state.currentScreen).toBe('lobby');
        expect(bettingModal.isModalActive()).toBe(false);
    });
});

export { BettingModal };