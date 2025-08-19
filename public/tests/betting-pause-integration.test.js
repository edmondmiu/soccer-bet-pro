/**
 * Integration Tests for Betting-Pause System
 * 
 * Tests the integration between the betting system and pause functionality,
 * ensuring that betting events properly trigger game pauses and resumes.
 * 
 * Requirements tested:
 * - 1.1: Game pauses when betting events occur
 * - 1.5: Betting decisions trigger resume
 * - 5.4: Integration with betting system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM elements and functions
const mockDOM = {
    getElementById: vi.fn(),
    createElement: vi.fn(),
    body: { appendChild: vi.fn() },
    head: { appendChild: vi.fn() }
};

// Mock window object
const mockWindow = {
    addEventToFeed: vi.fn(),
    render: vi.fn()
};

// Setup global mocks
global.document = mockDOM;
global.window = mockWindow;
global.setTimeout = vi.fn();
global.clearTimeout = vi.fn();

// Mock modules
vi.mock('../scripts/gameState.js', () => ({
    getCurrentState: vi.fn(() => ({
        currentActionBet: { active: false, details: null, timeoutId: null },
        pause: { active: false, reason: null, startTime: null, timeoutId: null },
        wallet: 100,
        bets: { fullMatch: [], actionBets: [] }
    })),
    updateState: vi.fn(),
    updateCurrentActionBet: vi.fn(),
    updatePauseState: vi.fn(),
    getPauseState: vi.fn(() => ({ active: false, reason: null, startTime: null, timeoutId: null })),
    adjustWalletBalance: vi.fn(),
    addBet: vi.fn(),
    getWalletBalance: vi.fn(() => 100),
    getBettingState: vi.fn(() => ({ fullMatch: [], actionBets: [] }))
}));

vi.mock('../scripts/utils.js', () => ({
    validateStake: vi.fn(() => true),
    generateId: vi.fn(() => 'test-id-123')
}));

// Mock PauseManager
const mockPauseManager = {
    pauseGame: vi.fn(() => true),
    resumeGame: vi.fn(() => Promise.resolve(true)),
    isPaused: vi.fn(() => false)
};

vi.mock('../scripts/pauseManager.js', () => ({
    pauseManager: mockPauseManager
}));

// Import the betting module after mocks are set up
import { 
    showMultiChoiceActionBet, 
    hideActionBet, 
    placeBet, 
    handleBettingDecision 
} from '../scripts/betting.js';

describe('Betting-Pause Integration Tests', () => {
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        
        // Setup default DOM element mocks
        const mockElement = {
            textContent: '',
            innerHTML: '',
            classList: {
                add: vi.fn(),
                remove: vi.fn()
            },
            appendChild: vi.fn(),
            onclick: null,
            offsetWidth: 100
        };
        
        mockDOM.getElementById.mockReturnValue(mockElement);
        mockDOM.createElement.mockReturnValue(mockElement);
        
        // Reset timeout mock
        global.setTimeout.mockImplementation((callback, delay) => {
            return 'timeout-id-123';
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('showMultiChoiceActionBet Integration', () => {
        it('should pause game before showing betting interface (Requirement 1.1)', () => {
            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [
                    { text: 'Yellow Card', odds: 2.5 },
                    { text: 'Red Card', odds: 8.0 }
                ]
            };

            showMultiChoiceActionBet(testEvent);

            // Verify pause was triggered with correct parameters
            expect(mockPauseManager.pauseGame).toHaveBeenCalledWith('BETTING_OPPORTUNITY', 15000);
            expect(mockPauseManager.pauseGame).toHaveBeenCalledTimes(1);
        });

        it('should continue with betting interface even if pause fails', () => {
            // Mock pause failure
            mockPauseManager.pauseGame.mockReturnValue(false);
            
            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            // Should not throw error
            expect(() => showMultiChoiceActionBet(testEvent)).not.toThrow();
            
            // Should still show betting interface
            expect(mockDOM.getElementById).toHaveBeenCalledWith('action-bet-modal');
        });

        it('should create skip button that triggers resume', () => {
            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            const mockChoicesContainer = {
                innerHTML: '',
                appendChild: vi.fn()
            };
            
            mockDOM.getElementById.mockImplementation((id) => {
                if (id === 'action-bet-choices') return mockChoicesContainer;
                return { textContent: '', classList: { add: vi.fn(), remove: vi.fn() } };
            });

            showMultiChoiceActionBet(testEvent);

            // Verify skip button was created and added
            expect(mockChoicesContainer.appendChild).toHaveBeenCalledTimes(2); // 1 choice + 1 skip button
        });

        it('should set timeout that triggers resume on expiry', () => {
            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            showMultiChoiceActionBet(testEvent);

            // Verify timeout was set
            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
        });
    });

    describe('Betting Decision Handling', () => {
        it('should resume game when bet is placed (Requirement 1.5)', async () => {
            mockPauseManager.isPaused.mockReturnValue(true);

            const success = placeBet('action', 'Yellow Card', 2.5, 10, 'FOUL_OUTCOME');

            expect(success).toBe(true);
            expect(mockPauseManager.resumeGame).toHaveBeenCalledWith(true, 3);
        });

        it('should resume game when betting decision is handled', async () => {
            mockPauseManager.isPaused.mockReturnValue(true);

            handleBettingDecision(true);

            expect(mockPauseManager.resumeGame).toHaveBeenCalledWith(true, 3);
        });

        it('should resume game even when bet is cancelled', async () => {
            mockPauseManager.isPaused.mockReturnValue(true);

            handleBettingDecision(false);

            expect(mockPauseManager.resumeGame).toHaveBeenCalledWith(true, 3);
        });

        it('should not attempt resume if game is not paused', async () => {
            mockPauseManager.isPaused.mockReturnValue(false);

            handleBettingDecision(true);

            expect(mockPauseManager.resumeGame).not.toHaveBeenCalled();
        });
    });

    describe('Timeout Scenarios', () => {
        it('should handle timeout by hiding bet and resuming game', () => {
            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            // Mock timeout callback execution
            let timeoutCallback;
            global.setTimeout.mockImplementation((callback, delay) => {
                timeoutCallback = callback;
                return 'timeout-id-123';
            });

            mockPauseManager.isPaused.mockReturnValue(true);

            showMultiChoiceActionBet(testEvent);

            // Execute the timeout callback
            timeoutCallback();

            // Verify resume was called
            expect(mockPauseManager.resumeGame).toHaveBeenCalledWith(true, 3);
        });

        it('should clear timeout when action bet is hidden manually', () => {
            // Setup mock state with active action bet
            const { getCurrentState } = require('../scripts/gameState.js');
            getCurrentState.mockReturnValue({
                currentActionBet: { 
                    active: true, 
                    details: { description: 'Test event' }, 
                    timeoutId: 'timeout-123' 
                }
            });

            hideActionBet(false);

            expect(global.clearTimeout).toHaveBeenCalledWith('timeout-123');
        });
    });

    describe('Error Handling', () => {
        it('should handle pause manager errors gracefully', () => {
            mockPauseManager.pauseGame.mockImplementation(() => {
                throw new Error('Pause failed');
            });

            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            // Should not throw error
            expect(() => showMultiChoiceActionBet(testEvent)).not.toThrow();
        });

        it('should handle resume errors gracefully', async () => {
            mockPauseManager.isPaused.mockReturnValue(true);
            mockPauseManager.resumeGame.mockRejectedValue(new Error('Resume failed'));

            // Should not throw error
            await expect(handleBettingDecision(true)).resolves.not.toThrow();
        });
    });

    describe('State Management Integration', () => {
        it('should update action bet state when showing betting interface', () => {
            const { updateCurrentActionBet } = require('../scripts/gameState.js');
            
            const testEvent = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            showMultiChoiceActionBet(testEvent);

            expect(updateCurrentActionBet).toHaveBeenCalledWith({
                active: true,
                details: testEvent,
                timeoutId: null
            });
        });

        it('should clear bet state when handling betting decision', () => {
            const { updateState } = require('../scripts/gameState.js');

            handleBettingDecision(true);

            expect(updateState).toHaveBeenCalledWith({ currentBet: null });
        });
    });

    describe('UI Integration', () => {
        it('should hide bet slip modal when handling betting decision', () => {
            const mockModal = {
                classList: { add: vi.fn() }
            };
            
            mockDOM.getElementById.mockImplementation((id) => {
                if (id === 'action-bet-slip-modal') return mockModal;
                return null;
            });

            handleBettingDecision(true);

            expect(mockModal.classList.add).toHaveBeenCalledWith('hidden');
        });

        it('should update modal content with event details', () => {
            const mockTitleElement = { textContent: '' };
            const mockDescriptionElement = { textContent: '' };
            
            mockDOM.getElementById.mockImplementation((id) => {
                if (id === 'action-bet-title') return mockTitleElement;
                if (id === 'action-bet-main-description') return mockDescriptionElement;
                return { classList: { add: vi.fn(), remove: vi.fn() }, innerHTML: '', appendChild: vi.fn() };
            });

            const testEvent = {
                description: 'Crunching tackle near the box!',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };

            showMultiChoiceActionBet(testEvent);

            expect(mockTitleElement.textContent).toBe('⚡ Foul Event! ⚡');
            expect(mockDescriptionElement.textContent).toBe('Crunching tackle near the box!');
        });
    });
});