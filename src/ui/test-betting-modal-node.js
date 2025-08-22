/**
 * BettingModal Node.js Test Runner
 * Runs BettingModal tests in Node.js environment
 */

// Mock DOM environment for Node.js - must be set before importing
global.document = {
    createElement: (tag) => ({
        tagName: tag,
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        children: [],
        parentNode: null,
        appendChild: function(child) {
            this.children.push(child);
            child.parentNode = this;
            return child;
        },
        removeChild: function(child) {
            const index = this.children.indexOf(child);
            if (index > -1) {
                this.children.splice(index, 1);
                child.parentNode = null;
            }
            return child;
        },
        querySelector: function(selector) {
            return this.children.find(child => 
                child.className.includes(selector.replace('.', '')) ||
                child.id === selector.replace('#', '')
            ) || null;
        },
        querySelectorAll: function(selector) {
            return this.children.filter(child => 
                child.className.includes(selector.replace('.', '')) ||
                child.id === selector.replace('#', '')
            );
        },
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() {},
        focus: function() {},
        select: function() {},
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
        },
        setAttribute: function(name, value) {
            this[name] = value;
        },
        getAttribute: function(name) {
            return this[name];
        }
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    head: { appendChild: () => {} },
    body: { appendChild: () => {} }
};

global.window = {
    innerWidth: 1024,
    addEventListener: () => {},
    removeEventListener: () => {}
};

// Import modules after setting up global mocks
import BettingModal from './BettingModal.js';

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
                    }
                ],
                actionBets: [
                    {
                        id: 'bet2',
                        type: 'actionBet',
                        outcome: 'Goal scored',
                        stake: 25,
                        odds: 2.50,
                        status: 'won',
                        actualWinnings: 62.50,
                        powerUpApplied: true
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

    getAllBets() {
        return this.bets;
    }
}

// Test runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0
        };
    }

    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async run() {
        console.log('🎯 Starting BettingModal Node.js Tests...\n');

        for (const test of this.tests) {
            this.results.total++;
            try {
                const result = await test.testFunction();
                if (result) {
                    this.results.passed++;
                    console.log(`✅ ${test.name}`);
                } else {
                    this.results.failed++;
                    console.log(`❌ ${test.name} - Test returned false`);
                }
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name} - ${error.message}`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        const successRate = this.results.total > 0 ? 
            Math.round((this.results.passed / this.results.total) * 100) : 0;

        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${successRate}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above for details.');
        }
    }
}

// Initialize test environment
function createTestEnvironment() {
    const stateManager = new MockStateManager();
    const timerManager = new MockTimerManager();
    const bettingManager = new MockBettingManager();
    const bettingModal = new BettingModal(stateManager, timerManager, bettingManager);

    return { stateManager, timerManager, bettingManager, bettingModal };
}

// Test suite
const runner = new TestRunner();

// Initialization Tests
runner.test('BettingModal initializes with dependencies', () => {
    const { stateManager, timerManager, bettingManager, bettingModal } = createTestEnvironment();
    
    return bettingModal.stateManager === stateManager &&
           bettingModal.timerManager === timerManager &&
           bettingModal.bettingManager === bettingManager;
});

runner.test('Initial modal state is correct', () => {
    const { bettingModal } = createTestEnvironment();
    
    return bettingModal.activeModal === null &&
           bettingModal.countdownInterval === null &&
           !bettingModal.isModalActive();
});

runner.test('Callbacks object is initialized', () => {
    const { bettingModal } = createTestEnvironment();
    
    return typeof bettingModal.callbacks === 'object' &&
           bettingModal.callbacks.hasOwnProperty('onModalShow');
});

// Action Betting Modal Tests
runner.test('Action betting modal shows successfully', async () => {
    const { bettingModal } = createTestEnvironment();
    
    const eventData = {
        id: 'event1',
        description: 'Test event',
        choices: [
            { id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }
        ]
    };

    const result = await bettingModal.showActionBettingModal(eventData);
    return result.success && bettingModal.isModalActive();
});

runner.test('Modal type is correctly identified', async () => {
    const { bettingModal } = createTestEnvironment();
    
    const eventData = {
        id: 'event1',
        description: 'Test event',
        choices: [
            { id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }
        ]
    };

    await bettingModal.showActionBettingModal(eventData);
    return bettingModal.getActiveModalType() === 'actionBetting';
});

runner.test('Modal contains correct content', async () => {
    const { bettingModal } = createTestEnvironment();
    
    const eventData = {
        id: 'event1',
        description: 'Corner kick for Arsenal',
        choices: [
            { id: 'choice1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' }
        ]
    };

    await bettingModal.showActionBettingModal(eventData);
    const modal = bettingModal.activeModal;
    
    return modal.innerHTML.includes('⏸️ Game Paused - Betting Opportunity') &&
           modal.innerHTML.includes(eventData.description) &&
           modal.innerHTML.includes('Goal from corner');
});

runner.test('Skip betting works correctly', async () => {
    const { bettingModal } = createTestEnvironment();
    
    const eventData = {
        id: 'event1',
        description: 'Test event',
        choices: [
            { id: 'choice1', description: 'Test choice', odds: 2.0, outcome: 'test' }
        ]
    };

    await bettingModal.showActionBettingModal(eventData);
    bettingModal.skipBetting();
    
    return !bettingModal.isModalActive();
});

// Bet Slip Modal Tests
runner.test('Bet slip modal shows with pre-populated amount', () => {
    const { bettingModal } = createTestEnvironment();
    
    const choice = {
        id: 'choice1',
        description: 'Goal from corner',
        odds: 3.50,
        outcome: 'goal'
    };

    const eventData = {
        id: 'event1',
        description: 'Corner kick event',
        choices: [choice]
    };

    bettingModal.showBetSlipModal(choice, eventData);
    const modal = bettingModal.activeModal;
    
    return bettingModal.isModalActive() &&
           bettingModal.getActiveModalType() === 'betSlip' &&
           modal.innerHTML.includes('value="25"');
});

runner.test('Potential winnings calculated correctly', () => {
    const { bettingModal } = createTestEnvironment();
    
    const choice = {
        id: 'choice1',
        description: 'Goal from corner',
        odds: 3.50,
        outcome: 'goal'
    };

    const eventData = {
        id: 'event1',
        description: 'Corner kick event',
        choices: [choice]
    };

    bettingModal.showBetSlipModal(choice, eventData);
    const modal = bettingModal.activeModal;
    const expectedWinnings = 25 * 3.50;
    
    return modal.innerHTML.includes(`$${expectedWinnings.toFixed(2)}`);
});

runner.test('Bet placement works', () => {
    const { bettingModal, bettingManager } = createTestEnvironment();
    
    const choice = {
        id: 'choice1',
        description: 'Goal from corner',
        odds: 3.50,
        outcome: 'goal'
    };

    const eventData = {
        id: 'event1',
        description: 'Corner kick event',
        choices: [choice]
    };

    const initialBetCount = bettingManager.getAllBets().length;
    bettingModal.showBetSlipModal(choice, eventData);
    bettingModal.placeBet(choice, 50, eventData);
    
    return bettingManager.getAllBets().length > initialBetCount &&
           !bettingModal.isModalActive();
});

// Match Summary Modal Tests
runner.test('Match summary modal shows correctly', () => {
    const { bettingModal } = createTestEnvironment();
    
    const matchData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 1,
        awayScore: 2
    };

    bettingModal.showMatchSummaryModal(matchData);
    const modal = bettingModal.activeModal;
    
    return bettingModal.isModalActive() &&
           bettingModal.getActiveModalType() === 'matchSummary' &&
           modal.innerHTML.includes('🏆 Match Complete') &&
           modal.innerHTML.includes('Arsenal vs Chelsea');
});

runner.test('Final score displayed correctly', () => {
    const { bettingModal } = createTestEnvironment();
    
    const matchData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 1,
        awayScore: 2
    };

    bettingModal.showMatchSummaryModal(matchData);
    const modal = bettingModal.activeModal;
    
    return modal.innerHTML.includes('1 - 2');
});

runner.test('Betting summary calculated', () => {
    const { bettingModal } = createTestEnvironment();
    
    const matchData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 1,
        awayScore: 2
    };

    bettingModal.showMatchSummaryModal(matchData);
    const modal = bettingModal.activeModal;
    
    return modal.innerHTML.includes('Total Bets Placed') &&
           modal.innerHTML.includes('Total Winnings');
});

// Modal Management Tests
runner.test('Modal closes correctly', () => {
    const { bettingModal } = createTestEnvironment();
    
    const matchData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 1,
        awayScore: 2
    };

    bettingModal.showMatchSummaryModal(matchData);
    bettingModal.closeModal();
    
    return !bettingModal.isModalActive() &&
           bettingModal.activeModal === null;
});

runner.test('Countdown timer starts and stops', () => {
    const { bettingModal } = createTestEnvironment();
    
    bettingModal.startCountdown(5);
    const hasInterval = bettingModal.countdownInterval !== null;
    bettingModal.stopCountdown();
    const intervalCleared = bettingModal.countdownInterval === null;
    
    return hasInterval && intervalCleared;
});

runner.test('Callbacks can be set and retrieved', () => {
    const { bettingModal } = createTestEnvironment();
    
    const testCallback = () => {};
    bettingModal.setCallbacks({ onModalShow: testCallback });
    
    return bettingModal.callbacks.onModalShow === testCallback;
});

runner.test('Quick amount buttons filter by wallet', () => {
    const { bettingModal } = createTestEnvironment();
    
    const buttons = bettingModal.generateQuickAmountButtons(75);
    
    return buttons.includes('data-amount="25"') &&
           buttons.includes('data-amount="50"') &&
           !buttons.includes('data-amount="100"');
});

runner.test('Bet outcome labels are correct', () => {
    const { bettingModal } = createTestEnvironment();
    
    const fullMatchBet = { type: 'fullMatch', outcome: 'home' };
    const actionBet = { type: 'actionBet', outcome: 'Goal scored' };
    
    return bettingModal.getBetOutcomeLabel(fullMatchBet) === 'Arsenal Win' &&
           bettingModal.getBetOutcomeLabel(actionBet) === 'Goal scored';
});

runner.test('Cleanup works without errors', () => {
    const { bettingModal } = createTestEnvironment();
    
    try {
        bettingModal.cleanup();
        // Should handle multiple cleanups
        bettingModal.cleanup();
        return true;
    } catch (error) {
        return false;
    }
});

// Integration Tests
runner.test('Complete action betting flow', async () => {
    const { bettingModal, bettingManager } = createTestEnvironment();
    
    const eventData = {
        id: 'event1',
        description: 'Test event',
        choices: [
            { id: 'choice1', description: 'Option 1', odds: 2.0, outcome: 'option1' }
        ]
    };

    // Show action betting modal
    await bettingModal.showActionBettingModal(eventData);
    if (!bettingModal.isModalActive()) return false;

    // Show bet slip
    bettingModal.showBetSlipModal(eventData.choices[0], eventData);
    if (bettingModal.getActiveModalType() !== 'betSlip') return false;

    // Place bet
    const initialBetCount = bettingManager.getAllBets().length;
    bettingModal.placeBet(eventData.choices[0], 50, eventData);
    
    return bettingManager.getAllBets().length > initialBetCount &&
           !bettingModal.isModalActive();
});

runner.test('Complete match summary flow', () => {
    const { bettingModal, stateManager } = createTestEnvironment();
    
    const matchData = {
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 2,
        awayScore: 1
    };

    // Show match summary
    bettingModal.showMatchSummaryModal(matchData);
    if (!bettingModal.isModalActive()) return false;
    if (bettingModal.getActiveModalType() !== 'matchSummary') return false;

    // Simulate return to lobby (would normally be triggered by button click)
    bettingModal.closeModal();
    stateManager.updateState({ currentScreen: 'lobby' });

    return stateManager.getState().currentScreen === 'lobby' &&
           !bettingModal.isModalActive();
});

// Run all tests
runner.run().catch(console.error);