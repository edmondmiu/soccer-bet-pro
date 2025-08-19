/**
 * Test suite for bet amount memory system
 * Tests the bet amount memory functionality in gameState.js
 */

// Import the functions we need to test
import { 
    getInitialState,
    getCurrentState,
    resetState,
    getDefaultBetAmount,
    validateBetAmount,
    getBetAmountMemory,
    updateBetAmountMemory,
    getBetAmountMemoryState,
    resetBetAmountMemory
} from '../scripts/gameState.js';

// Test suite
describe('Bet Amount Memory System', () => {
    
    beforeEach(() => {
        // Reset state before each test
        resetState();
    });

    describe('getDefaultBetAmount', () => {
        test('should return $25 as default amount', () => {
            expect(getDefaultBetAmount()).toBe(25.00);
        });
    });

    describe('validateBetAmount', () => {
        test('should validate positive numbers', () => {
            expect(validateBetAmount(25)).toBe(true);
            expect(validateBetAmount(100.50)).toBe(true);
            expect(validateBetAmount(1)).toBe(true);
        });

        test('should reject negative numbers', () => {
            expect(validateBetAmount(-1)).toBe(false);
            expect(validateBetAmount(-25.50)).toBe(false);
        });

        test('should reject non-numbers', () => {
            expect(validateBetAmount('25')).toBe(false);
            expect(validateBetAmount(null)).toBe(false);
            expect(validateBetAmount(undefined)).toBe(false);
            expect(validateBetAmount({})).toBe(false);
        });

        test('should reject NaN', () => {
            expect(validateBetAmount(NaN)).toBe(false);
        });

        test('should reject extremely large amounts', () => {
            expect(validateBetAmount(10001)).toBe(false);
            expect(validateBetAmount(999999)).toBe(false);
        });

        test('should accept reasonable large amounts', () => {
            expect(validateBetAmount(1000)).toBe(true);
            expect(validateBetAmount(5000)).toBe(true);
        });
    });

    describe('getBetAmountMemory', () => {
        test('should return default amount for initial state', () => {
            expect(getBetAmountMemory('fullMatch')).toBe(25.00);
            expect(getBetAmountMemory('opportunity')).toBe(25.00);
        });

        test('should return default for invalid bet types', () => {
            expect(getBetAmountMemory('invalid')).toBe(25.00);
            expect(getBetAmountMemory('')).toBe(25.00);
            expect(getBetAmountMemory(null)).toBe(25.00);
        });

        test('should return stored amounts after updates', () => {
            updateBetAmountMemory('fullMatch', 50);
            updateBetAmountMemory('opportunity', 75);
            
            expect(getBetAmountMemory('fullMatch')).toBe(50);
            expect(getBetAmountMemory('opportunity')).toBe(75);
        });
    });

    describe('updateBetAmountMemory', () => {
        test('should update full match bet amount', () => {
            updateBetAmountMemory('fullMatch', 100);
            expect(getBetAmountMemory('fullMatch')).toBe(100);
            expect(getBetAmountMemory('opportunity')).toBe(25); // Should not change
        });

        test('should update opportunity bet amount', () => {
            updateBetAmountMemory('opportunity', 150);
            expect(getBetAmountMemory('opportunity')).toBe(150);
            expect(getBetAmountMemory('fullMatch')).toBe(25); // Should not change
        });

        test('should update lastUpdated timestamp', () => {
            const beforeUpdate = Date.now();
            updateBetAmountMemory('fullMatch', 50);
            const afterUpdate = Date.now();
            
            const memory = getBetAmountMemoryState();
            expect(memory.lastUpdated).toBeGreaterThanOrEqual(beforeUpdate);
            expect(memory.lastUpdated).toBeLessThanOrEqual(afterUpdate);
        });

        test('should reject invalid bet types', () => {
            updateBetAmountMemory('invalid', 50);
            expect(getBetAmountMemory('fullMatch')).toBe(25); // Should remain default
            expect(getBetAmountMemory('opportunity')).toBe(25); // Should remain default
        });

        test('should reject invalid amounts', () => {
            updateBetAmountMemory('fullMatch', -50);
            updateBetAmountMemory('opportunity', 'invalid');
            
            expect(getBetAmountMemory('fullMatch')).toBe(25); // Should remain default
            expect(getBetAmountMemory('opportunity')).toBe(25); // Should remain default
        });
    });

    describe('getBetAmountMemoryState', () => {
        test('should return initial memory state', () => {
            const memory = getBetAmountMemoryState();
            expect(memory.fullMatch).toBe(25.00);
            expect(memory.opportunity).toBe(25.00);
            expect(memory.lastUpdated).toBe(null);
        });

        test('should return updated memory state', () => {
            updateBetAmountMemory('fullMatch', 75);
            const memory = getBetAmountMemoryState();
            
            expect(memory.fullMatch).toBe(75);
            expect(memory.opportunity).toBe(25);
            expect(memory.lastUpdated).toBeGreaterThan(0);
        });

        test('should return a copy (not reference)', () => {
            const memory1 = getBetAmountMemoryState();
            const memory2 = getBetAmountMemoryState();
            
            expect(memory1).not.toBe(memory2); // Different objects
            expect(memory1).toEqual(memory2); // Same content
        });
    });

    describe('resetBetAmountMemory', () => {
        test('should reset memory to defaults', () => {
            // First update some values
            updateBetAmountMemory('fullMatch', 100);
            updateBetAmountMemory('opportunity', 200);
            
            // Verify they were updated
            expect(getBetAmountMemory('fullMatch')).toBe(100);
            expect(getBetAmountMemory('opportunity')).toBe(200);
            
            // Reset and verify defaults
            resetBetAmountMemory();
            expect(getBetAmountMemory('fullMatch')).toBe(25);
            expect(getBetAmountMemory('opportunity')).toBe(25);
        });

        test('should update lastUpdated timestamp on reset', () => {
            const beforeReset = Date.now();
            resetBetAmountMemory();
            const afterReset = Date.now();
            
            const memory = getBetAmountMemoryState();
            expect(memory.lastUpdated).toBeGreaterThanOrEqual(beforeReset);
            expect(memory.lastUpdated).toBeLessThanOrEqual(afterReset);
        });
    });

    describe('Integration with game state', () => {
        test('should be included in initial state', () => {
            const initialState = getInitialState();
            expect(initialState.betAmountMemory).toBeDefined();
            expect(initialState.betAmountMemory.fullMatch).toBe(25.00);
            expect(initialState.betAmountMemory.opportunity).toBe(25.00);
            expect(initialState.betAmountMemory.lastUpdated).toBe(null);
        });

        test('should persist in current state after updates', () => {
            updateBetAmountMemory('fullMatch', 150);
            
            const currentState = getCurrentState();
            expect(currentState.betAmountMemory.fullMatch).toBe(150);
            expect(currentState.betAmountMemory.opportunity).toBe(25);
            expect(currentState.betAmountMemory.lastUpdated).toBeGreaterThan(0);
        });

        test('should reset with full state reset', () => {
            updateBetAmountMemory('fullMatch', 200);
            expect(getBetAmountMemory('fullMatch')).toBe(200);
            
            resetState();
            expect(getBetAmountMemory('fullMatch')).toBe(25);
        });
    });
});