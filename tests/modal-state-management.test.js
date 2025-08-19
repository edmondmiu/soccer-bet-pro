/**
 * Modal State Management Tests
 * 
 * Tests for the modal state management functionality in gameState.js
 * Covers modal visibility, minimization, restoration, and state persistence
 * 
 * Requirements tested:
 * - 1.3: Modal state tracking with minimized flag
 * - 1.4: Restore functionality with preserved state
 * - 4.4: State persistence during minimize/restore cycles
 * - 5.1: Integration with pause system
 * - 5.2: State management during modal operations
 */

// Mock DOM environment for testing
if (typeof window === 'undefined') {
    global.window = {};
    global.document = {
        getElementById: () => null,
        createElement: () => ({ 
            classList: { add: () => {}, remove: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {}
        })
    };
}

// Import the functions we're testing
import {
    getInitialState,
    getCurrentState,
    updateState,
    resetState,
    getModalState,
    updateModalState,
    setModalVisible,
    setModalMinimized,
    initializeModalState,
    resetModalState,
    isModalActive,
    getModalRemainingTime,
    isModalExpired,
    minimizeModal,
    restoreModal,
    closeModal
} from '../scripts/gameState.js';

describe('Modal State Management', () => {
    beforeEach(() => {
        // Reset state before each test
        resetState();
    });

    describe('Initial Modal State', () => {
        test('should have correct initial modal state structure', () => {
            const state = getCurrentState();
            
            expect(state.currentActionBet.modalState).toBeDefined();
            expect(state.currentActionBet.modalState.visible).toBe(false);
            expect(state.currentActionBet.modalState.minimized).toBe(false);
            expect(state.currentActionBet.modalState.startTime).toBe(null);
            expect(state.currentActionBet.modalState.duration).toBe(null);
            expect(state.currentActionBet.modalState.content).toBe(null);
            expect(state.currentActionBet.modalState.timerBar).toBe(null);
        });

        test('should return modal state copy via getModalState', () => {
            const modalState = getModalState();
            
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBe(null);
            expect(modalState.duration).toBe(null);
            expect(modalState.content).toBe(null);
            expect(modalState.timerBar).toBe(null);
        });
    });

    describe('Modal State Updates', () => {
        test('should update modal visibility', () => {
            setModalVisible(true);
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(true);
            expect(modalState.minimized).toBe(false);
        });

        test('should update modal minimized state', () => {
            setModalMinimized(true);
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(true);
        });

        test('should update partial modal state', () => {
            const startTime = Date.now();
            const duration = 10000;
            
            updateModalState({
                visible: true,
                startTime: startTime,
                duration: duration
            });
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(true);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBe(startTime);
            expect(modalState.duration).toBe(duration);
            expect(modalState.content).toBe(null);
        });

        test('should validate modal state updates', () => {
            // Test invalid visible value
            updateModalState({ visible: 'invalid' });
            const modalState1 = getModalState();
            expect(modalState1.visible).toBe(false); // Should remain unchanged
            
            // Test invalid minimized value
            updateModalState({ minimized: 'invalid' });
            const modalState2 = getModalState();
            expect(modalState2.minimized).toBe(false); // Should remain unchanged
            
            // Test invalid startTime value
            updateModalState({ startTime: 'invalid' });
            const modalState3 = getModalState();
            expect(modalState3.startTime).toBe(null); // Should remain unchanged
        });

        test('should handle null and undefined updates gracefully', () => {
            updateModalState(null);
            updateModalState(undefined);
            updateModalState({});
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(false);
        });
    });

    describe('Modal State Initialization', () => {
        test('should initialize modal state correctly', () => {
            const content = {
                title: 'Test Action Bet',
                description: 'Test betting opportunity',
                choices: [{ text: 'Option 1', odds: 2.0 }]
            };
            const duration = 10000;
            
            const beforeTime = Date.now();
            initializeModalState(content, duration);
            const afterTime = Date.now();
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(true);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBeGreaterThanOrEqual(beforeTime);
            expect(modalState.startTime).toBeLessThanOrEqual(afterTime);
            expect(modalState.duration).toBe(duration);
            expect(modalState.content).toEqual(content);
            expect(modalState.timerBar).toBe(null);
        });
    });

    describe('Modal State Reset', () => {
        test('should reset modal state to initial values', () => {
            // Set some modal state
            initializeModalState({ test: 'data' }, 5000);
            setModalMinimized(true);
            
            // Reset
            resetModalState();
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBe(null);
            expect(modalState.duration).toBe(null);
            expect(modalState.content).toBe(null);
            expect(modalState.timerBar).toBe(null);
        });
    });

    describe('Modal State Queries', () => {
        test('should correctly identify active modal states', () => {
            // Initially not active
            expect(isModalActive()).toBe(false);
            
            // Active when visible
            setModalVisible(true);
            expect(isModalActive()).toBe(true);
            
            // Active when minimized
            setModalVisible(false);
            setModalMinimized(true);
            expect(isModalActive()).toBe(true);
            
            // Not active when both false
            setModalMinimized(false);
            expect(isModalActive()).toBe(false);
        });

        test('should calculate remaining time correctly', () => {
            const duration = 10000; // 10 seconds
            const startTime = Date.now() - 3000; // Started 3 seconds ago
            
            updateModalState({
                startTime: startTime,
                duration: duration
            });
            
            const remaining = getModalRemainingTime();
            expect(remaining).toBeGreaterThan(6000); // Should be around 7 seconds
            expect(remaining).toBeLessThan(8000);
        });

        test('should return 0 remaining time for inactive modal', () => {
            expect(getModalRemainingTime()).toBe(0);
        });

        test('should return 0 remaining time for expired modal', () => {
            const startTime = Date.now() - 15000; // Started 15 seconds ago
            const duration = 10000; // 10 second duration
            
            updateModalState({
                startTime: startTime,
                duration: duration
            });
            
            expect(getModalRemainingTime()).toBe(0);
            expect(isModalExpired()).toBe(true);
        });

        test('should correctly identify expired modals', () => {
            // Not expired initially
            expect(isModalExpired()).toBe(true); // No timer set
            
            // Not expired when active
            initializeModalState({ test: 'data' }, 10000);
            expect(isModalExpired()).toBe(false);
            
            // Expired when time passed
            updateModalState({
                startTime: Date.now() - 15000,
                duration: 10000
            });
            expect(isModalExpired()).toBe(true);
        });
    });

    describe('Modal State Transitions', () => {
        test('should minimize modal correctly', () => {
            // Start with visible modal
            setModalVisible(true);
            
            minimizeModal();
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(true);
        });

        test('should restore modal correctly', () => {
            // Start with minimized modal
            setModalMinimized(true);
            
            restoreModal();
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(true);
            expect(modalState.minimized).toBe(false);
        });

        test('should close modal completely', () => {
            // Set up active modal
            initializeModalState({ test: 'data' }, 5000);
            setModalVisible(true);
            
            closeModal();
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBe(null);
            expect(modalState.duration).toBe(null);
            expect(modalState.content).toBe(null);
            expect(modalState.timerBar).toBe(null);
        });
    });

    describe('State Persistence', () => {
        test('should persist modal state during minimize/restore cycles', () => {
            const content = { title: 'Persistent Test' };
            const duration = 8000;
            
            // Initialize modal
            initializeModalState(content, duration);
            const originalStartTime = getModalState().startTime;
            
            // Minimize
            minimizeModal();
            let modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(true);
            expect(modalState.startTime).toBe(originalStartTime);
            expect(modalState.duration).toBe(duration);
            expect(modalState.content).toEqual(content);
            
            // Restore
            restoreModal();
            modalState = getModalState();
            expect(modalState.visible).toBe(true);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBe(originalStartTime);
            expect(modalState.duration).toBe(duration);
            expect(modalState.content).toEqual(content);
        });

        test('should maintain timer state during minimize/restore', () => {
            const duration = 10000;
            initializeModalState({ test: 'data' }, duration);
            
            // Wait a bit
            const delay = 100;
            const startTime = Date.now();
            
            setTimeout(() => {
                // Minimize
                minimizeModal();
                const remaining1 = getModalRemainingTime();
                
                setTimeout(() => {
                    // Restore
                    restoreModal();
                    const remaining2 = getModalRemainingTime();
                    
                    // Time should continue decreasing
                    expect(remaining2).toBeLessThan(remaining1);
                    expect(remaining2).toBeGreaterThan(0);
                }, delay);
            }, delay);
        });
    });

    describe('Integration with Game State', () => {
        test('should integrate with currentActionBet state', () => {
            const content = { betType: 'FOUL_OUTCOME' };
            initializeModalState(content, 5000);
            
            const fullState = getCurrentState();
            expect(fullState.currentActionBet.modalState.visible).toBe(true);
            expect(fullState.currentActionBet.modalState.content).toEqual(content);
        });

        test('should maintain state consistency during updates', () => {
            // Update modal state
            updateModalState({
                visible: true,
                minimized: false,
                startTime: Date.now(),
                duration: 5000
            });
            
            // Verify state is consistent
            const fullState = getCurrentState();
            const modalState = getModalState();
            
            expect(fullState.currentActionBet.modalState).toEqual(modalState);
        });

        test('should handle state reset correctly', () => {
            // Set up modal state
            initializeModalState({ test: 'data' }, 5000);
            
            // Reset entire game state
            resetState();
            
            const modalState = getModalState();
            expect(modalState.visible).toBe(false);
            expect(modalState.minimized).toBe(false);
            expect(modalState.startTime).toBe(null);
            expect(modalState.duration).toBe(null);
            expect(modalState.content).toBe(null);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid modal state updates gracefully', () => {
            const originalState = getModalState();
            
            // Try invalid updates
            updateModalState('invalid');
            updateModalState(123);
            updateModalState([]);
            
            // State should remain unchanged
            const newState = getModalState();
            expect(newState).toEqual(originalState);
        });

        test('should handle missing properties gracefully', () => {
            // This should not throw errors
            expect(() => {
                getModalRemainingTime();
                isModalExpired();
                isModalActive();
            }).not.toThrow();
        });
    });
});