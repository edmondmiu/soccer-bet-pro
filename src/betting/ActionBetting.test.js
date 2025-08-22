/**
 * ActionBetting Tests
 * Tests for time-limited betting opportunities with pause/resume functionality
 */

import { ActionBetting } from './ActionBetting.js';

// Mock dependencies
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            betAmountMemory: {
                opportunity: 25
            }
        };
    }

    getState() {
        return { ...this.state };
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
    }

    getBetAmountMemory(type) {
        return this.state.betAmountMemory[type] || 25;
    }

    updateBetAmountMemory(type, amount) {
        this.state.betAmountMemory[type] = amount;
    }
}

class MockTimerManager {
    constructor() {
        this.isPaused = false;
        this.countdownTime = 0;
        this.callbacks = {};
        this.countdownCallback = null;
    }

    pauseTimer() {
        this.isPaused = true;
    }

    resumeTimer() {
        this.isPaused = false;
    }

    startCountdown(duration, callback) {
        this.countdownTime = duration;
        this.countdownCallback = callback;
        
        // Simulate countdown
        setTimeout(() => {
            if (this.callbacks.onCountdownUpdate) {
                this.callbacks.onCountdownUpdate(duration / 2);
            }
        }, 50);
    }

    stopCountdown() {
        this.countdownTime = 0;
        this.countdownCallback = null;
    }

    getCountdownTime() {
        return this.countdownTime;
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    getStatus() {
        return {
            match: { isPaused: this.isPaused },
            countdown: { remainingTime: this.countdownTime }
        };
    }

    // Test helper to simulate countdown completion
    simulateCountdownComplete() {
        if (this.countdownCallback) {
            this.countdownCallback();
        }
        if (this.callbacks.onCountdownComplete) {
            this.callbacks.onCountdownComplete();
        }
    }
}

class MockBettingManager {
    constructor() {
        this.bets = [];
        this.shouldFail = false;
    }

    placeBet(betData) {
        if (this.shouldFail) {
            return { success: false, error: 'Insufficient funds' };
        }

        const bet = {
            id: `bet_${Date.now()}`,
            ...betData,
            placedAt: Date.now()
        };
        
        this.bets.push(bet);
        return { success: true, bet };
    }

    setShouldFail(shouldFail) {
        this.shouldFail = shouldFail;
    }
}

// Test suite
describe('ActionBetting', () => {
    let actionBetting;
    let mockStateManager;
    let mockTimerManager;
    let mockBettingManager;
    let callbackResults;

    beforeEach(() => {
        mockStateManager = new MockStateManager();
        mockTimerManager = new MockTimerManager();
        mockBettingManager = new MockBettingManager();
        
        actionBetting = new ActionBetting(
            mockStateManager,
            mockTimerManager,
            mockBettingManager
        );

        callbackResults = {
            modalShow: null,
            modalHide: null,
            countdownUpdate: null,
            betPlaced: null,
            timeout: null,
            skip: null
        };

        // Set up callbacks to capture events
        actionBetting.setCallbacks({
            onModalShow: (event) => { callbackResults.modalShow = event; },
            onModalHide: () => { callbackResults.modalHide = true; },
            onCountdownUpdate: (time) => { callbackResults.countdownUpdate = time; },
            onBetPlaced: (bet, choice) => { callbackResults.betPlaced = { bet, choice }; },
            onTimeout: (event) => { callbackResults.timeout = event; },
            onSkip: (event) => { callbackResults.skip = event; }
        });
    });

    describe('showActionBettingModal', () => {
        const sampleEvent = {
            id: 'event_1',
            description: 'Corner kick for Home Team',
            choices: [
                { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' },
                { id: 'choice_2', description: 'No goal', odds: 1.3, outcome: 'no_goal' }
            ]
        };

        test('should show modal and pause timer', async () => {
            const result = await actionBetting.showActionBettingModal(sampleEvent);

            expect(result.success).toBe(true);
            expect(actionBetting.isModalActive()).toBe(true);
            expect(mockTimerManager.isPaused).toBe(true);
            expect(callbackResults.modalShow).toEqual(sampleEvent);
            expect(actionBetting.getCurrentEvent()).toEqual(sampleEvent);
        });

        test('should start countdown timer', async () => {
            await actionBetting.showActionBettingModal(sampleEvent);

            expect(mockTimerManager.countdownTime).toBe(10);
            expect(mockTimerManager.countdownCallback).toBeTruthy();
        });

        test('should reject if modal already open', async () => {
            await actionBetting.showActionBettingModal(sampleEvent);
            const result = await actionBetting.showActionBettingModal(sampleEvent);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Modal already open');
        });

        test('should handle countdown updates', async () => {
            await actionBetting.showActionBettingModal(sampleEvent);
            
            // Wait for countdown update callback
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(callbackResults.countdownUpdate).toBe(5); // Half of 10 seconds
        });
    });

    describe('placeBet', () => {
        const sampleEvent = {
            id: 'event_1',
            description: 'Corner kick for Home Team',
            choices: [
                { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' },
                { id: 'choice_2', description: 'No goal', odds: 1.3, outcome: 'no_goal' }
            ]
        };

        beforeEach(async () => {
            await actionBetting.showActionBettingModal(sampleEvent);
        });

        test('should place bet successfully', () => {
            const result = actionBetting.placeBet('choice_1', 50);

            expect(result.success).toBe(true);
            expect(result.bet).toBeTruthy();
            expect(result.bet.type).toBe('actionBet');
            expect(result.bet.outcome).toBe('goal');
            expect(result.bet.stake).toBe(50);
            expect(result.bet.odds).toBe(3.5);
            expect(result.bet.eventId).toBe('event_1');
        });

        test('should update bet amount memory', () => {
            actionBetting.placeBet('choice_1', 75);

            expect(mockStateManager.getBetAmountMemory('opportunity')).toBe(75);
        });

        test('should close modal after placing bet', () => {
            actionBetting.placeBet('choice_1', 50);

            expect(actionBetting.isModalActive()).toBe(false);
            expect(callbackResults.modalHide).toBe(true);
        });

        test('should notify bet placed callback', () => {
            actionBetting.placeBet('choice_1', 50);

            expect(callbackResults.betPlaced).toBeTruthy();
            expect(callbackResults.betPlaced.bet.outcome).toBe('goal');
            expect(callbackResults.betPlaced.choice.description).toBe('Goal from corner');
        });

        test('should reject invalid choice', () => {
            const result = actionBetting.placeBet('invalid_choice', 50);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid choice selected');
        });

        test('should handle betting manager failure', () => {
            mockBettingManager.setShouldFail(true);
            const result = actionBetting.placeBet('choice_1', 50);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Insufficient funds');
        });

        test('should reject bet when no modal is open', () => {
            actionBetting.closeModal();
            const result = actionBetting.placeBet('choice_1', 50);

            expect(result.success).toBe(false);
            expect(result.error).toBe('No active betting opportunity');
        });
    });

    describe('skipBetting', () => {
        const sampleEvent = {
            id: 'event_1',
            description: 'Corner kick for Home Team',
            choices: [
                { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' }
            ]
        };

        test('should skip betting successfully', async () => {
            await actionBetting.showActionBettingModal(sampleEvent);
            const result = actionBetting.skipBetting();

            expect(result.success).toBe(true);
            expect(actionBetting.isModalActive()).toBe(false);
            expect(callbackResults.skip).toEqual(sampleEvent);
            expect(callbackResults.modalHide).toBe(true);
        });

        test('should reject skip when no modal is open', () => {
            const result = actionBetting.skipBetting();

            expect(result.success).toBe(false);
            expect(result.error).toBe('No active betting opportunity to skip');
        });
    });

    describe('timeout handling', () => {
        const sampleEvent = {
            id: 'event_1',
            description: 'Corner kick for Home Team',
            choices: [
                { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' }
            ]
        };

        test('should handle timeout correctly', async () => {
            await actionBetting.showActionBettingModal(sampleEvent);
            
            // Simulate countdown completion
            mockTimerManager.simulateCountdownComplete();

            expect(actionBetting.isModalActive()).toBe(false);
            expect(callbackResults.timeout).toEqual(sampleEvent);
            expect(callbackResults.modalHide).toBe(true);
        });
    });

    describe('closeModal', () => {
        const sampleEvent = {
            id: 'event_1',
            description: 'Corner kick for Home Team',
            choices: [
                { id: 'choice_1', description: 'Goal from corner', odds: 3.5, outcome: 'goal' }
            ]
        };

        test('should close modal and start resume countdown', async () => {
            await actionBetting.showActionBettingModal(sampleEvent);
            actionBetting.closeModal();

            expect(actionBetting.isModalActive()).toBe(false);
            expect(actionBetting.getCurrentEvent()).toBe(null);
            expect(callbackResults.modalHide).toBe(true);
            expect(mockTimerManager.countdownTime).toBe(3); // Resume countdown
        });

        test('should handle close when modal not open', () => {
            // Should not throw error
            actionBetting.closeModal();
            expect(actionBetting.isModalActive()).toBe(false);
        });
    });

    describe('utility methods', () => {
        test('getPrePopulatedAmount should return memory amount', () => {
            mockStateManager.updateBetAmountMemory('opportunity', 100);
            expect(actionBetting.getPrePopulatedAmount()).toBe(100);
        });

        test('validateChoice should validate correctly', async () => {
            const sampleEvent = {
                id: 'event_1',
                description: 'Test event',
                choices: [
                    { id: 'choice_1', description: 'Option 1', odds: 2.0, outcome: 'option1' }
                ]
            };

            await actionBetting.showActionBettingModal(sampleEvent);

            const validResult = actionBetting.validateChoice('choice_1');
            expect(validResult.valid).toBe(true);
            expect(validResult.choice.description).toBe('Option 1');

            const invalidResult = actionBetting.validateChoice('invalid');
            expect(invalidResult.valid).toBe(false);
            expect(invalidResult.error).toBe('Invalid choice selected');
        });

        test('getStatus should return comprehensive status', async () => {
            const sampleEvent = {
                id: 'event_1',
                description: 'Test event',
                choices: []
            };

            await actionBetting.showActionBettingModal(sampleEvent);
            const status = actionBetting.getStatus();

            expect(status.isModalOpen).toBe(true);
            expect(status.currentEvent).toEqual(sampleEvent);
            expect(status.remainingTime).toBe(10);
            expect(status.prePopulatedAmount).toBe(25);
            expect(status.timerStatus).toBeTruthy();
        });
    });

    describe('error handling', () => {
        test('forceClose should handle emergency situations', async () => {
            const sampleEvent = {
                id: 'event_1',
                description: 'Test event',
                choices: []
            };

            await actionBetting.showActionBettingModal(sampleEvent);
            actionBetting.forceClose();

            expect(actionBetting.isModalActive()).toBe(false);
            expect(mockTimerManager.isPaused).toBe(false);
            expect(callbackResults.modalHide).toBe(true);
        });

        test('reset should clear all state', async () => {
            const sampleEvent = {
                id: 'event_1',
                description: 'Test event',
                choices: []
            };

            await actionBetting.showActionBettingModal(sampleEvent);
            actionBetting.reset();

            expect(actionBetting.isModalActive()).toBe(false);
            expect(actionBetting.getCurrentEvent()).toBe(null);
        });
    });

    describe('integration with TimerManager', () => {
        test('should coordinate pause/resume correctly', async () => {
            const sampleEvent = {
                id: 'event_1',
                description: 'Test event',
                choices: [
                    { id: 'choice_1', description: 'Option 1', odds: 2.0, outcome: 'option1' }
                ]
            };

            // Show modal - should pause
            await actionBetting.showActionBettingModal(sampleEvent);
            expect(mockTimerManager.isPaused).toBe(true);

            // Place bet - should start resume countdown
            actionBetting.placeBet('choice_1', 25);
            expect(mockTimerManager.countdownTime).toBe(3);

            // Simulate resume countdown completion
            mockTimerManager.simulateCountdownComplete();
            expect(mockTimerManager.isPaused).toBe(false);
        });
    });
});

// Test runner for browser environment
if (typeof window !== 'undefined') {
    // Browser test runner
    window.runActionBettingTests = async () => {
        console.log('Running ActionBetting tests...');
        
        try {
            // Import test framework or use simple assertions
            const results = {
                passed: 0,
                failed: 0,
                errors: []
            };

            // Run basic functionality tests
            const mockStateManager = new MockStateManager();
            const mockTimerManager = new MockTimerManager();
            const mockBettingManager = new MockBettingManager();
            
            const actionBetting = new ActionBetting(
                mockStateManager,
                mockTimerManager,
                mockBettingManager
            );

            // Test 1: Modal show/hide
            const sampleEvent = {
                id: 'event_1',
                description: 'Test event',
                choices: [
                    { id: 'choice_1', description: 'Option 1', odds: 2.0, outcome: 'option1' }
                ]
            };

            const showResult = await actionBetting.showActionBettingModal(sampleEvent);
            if (showResult.success && actionBetting.isModalActive()) {
                results.passed++;
                console.log('✓ Modal show test passed');
            } else {
                results.failed++;
                results.errors.push('Modal show test failed');
                console.log('✗ Modal show test failed');
            }

            // Test 2: Bet placement
            const betResult = actionBetting.placeBet('choice_1', 50);
            if (betResult.success && !actionBetting.isModalActive()) {
                results.passed++;
                console.log('✓ Bet placement test passed');
            } else {
                results.failed++;
                results.errors.push('Bet placement test failed');
                console.log('✗ Bet placement test failed');
            }

            console.log(`\nActionBetting Tests Complete:`);
            console.log(`Passed: ${results.passed}`);
            console.log(`Failed: ${results.failed}`);
            
            if (results.errors.length > 0) {
                console.log('Errors:', results.errors);
            }

            return results;
        } catch (error) {
            console.error('Test runner error:', error);
            return { passed: 0, failed: 1, errors: [error.message] };
        }
    };
}

export { ActionBetting };