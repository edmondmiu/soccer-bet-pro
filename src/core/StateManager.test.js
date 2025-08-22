/**
 * Unit tests for StateManager
 */
import { StateManager } from './StateManager.js';

// Mock console methods to avoid test output noise
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      const state = stateManager.getState();
      
      expect(state.currentScreen).toBe('lobby');
      expect(state.wallet).toBe(1000);
      expect(state.classicMode).toBe(false);
      expect(state.match.active).toBe(false);
      expect(state.match.time).toBe(0);
      expect(state.match.odds).toEqual({ home: 1.85, draw: 3.50, away: 4.20 });
      expect(state.bets.fullMatch).toEqual([]);
      expect(state.bets.actionBets).toEqual([]);
      expect(state.powerUp.held).toBeNull();
      expect(state.betAmountMemory.fullMatch).toBe(25);
      expect(state.betAmountMemory.opportunity).toBe(25);
    });

    test('should setup validators correctly', () => {
      expect(stateManager.validators.size).toBeGreaterThan(0);
      expect(stateManager.validators.has('wallet')).toBe(true);
      expect(stateManager.validators.has('currentScreen')).toBe(true);
    });
  });

  describe('State Access', () => {
    test('getState should return immutable copy', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();
      
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different objects
      
      // Modifying returned state should not affect internal state
      state1.wallet = 500;
      expect(stateManager.getState().wallet).toBe(1000);
    });

    test('getStateSlice should return specific state parts', () => {
      const matchState = stateManager.getStateSlice('match');
      expect(matchState.active).toBe(false);
      expect(matchState.time).toBe(0);
      
      const wallet = stateManager.getStateSlice('wallet');
      expect(wallet).toBe(1000);
      
      const nonExistent = stateManager.getStateSlice('nonexistent.path');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('State Updates', () => {
    test('should update simple properties', () => {
      stateManager.updateState({ wallet: 750 });
      expect(stateManager.getState().wallet).toBe(750);
      
      stateManager.updateState({ currentScreen: 'match' });
      expect(stateManager.getState().currentScreen).toBe('match');
    });

    test('should update nested properties with dot notation', () => {
      stateManager.updateState({ 'match.time': 45 });
      expect(stateManager.getState().match.time).toBe(45);
      
      stateManager.updateState({ 'match.homeScore': 2 });
      expect(stateManager.getState().match.homeScore).toBe(2);
    });

    test('should merge object properties', () => {
      stateManager.updateState({
        match: {
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea'
        }
      });
      
      const match = stateManager.getState().match;
      expect(match.homeTeam).toBe('Arsenal');
      expect(match.awayTeam).toBe('Chelsea');
      expect(match.time).toBe(0); // Should preserve existing properties
    });

    test('should handle array updates', () => {
      const newBet = { id: '1', type: 'fullMatch', stake: 50 };
      stateManager.updateState({
        bets: {
          fullMatch: [newBet]
        }
      });
      
      expect(stateManager.getState().bets.fullMatch).toEqual([newBet]);
    });
  });

  describe('State Validation', () => {
    test('should validate wallet values', () => {
      expect(() => {
        stateManager.updateState({ wallet: -100 });
      }).toThrow('Wallet must be a non-negative number');
      
      expect(() => {
        stateManager.updateState({ wallet: 'invalid' });
      }).toThrow('Wallet must be a non-negative number');
    });

    test('should validate screen values', () => {
      expect(() => {
        stateManager.updateState({ currentScreen: 'invalid' });
      }).toThrow('Invalid screen: invalid');
      
      // Valid screens should work
      stateManager.updateState({ currentScreen: 'lobby' });
      stateManager.updateState({ currentScreen: 'match' });
    });

    test('should validate match time', () => {
      expect(() => {
        stateManager.updateState({ 'match.time': -5 });
      }).toThrow('Match time must be between 0 and 90 minutes');
      
      expect(() => {
        stateManager.updateState({ 'match.time': 95 });
      }).toThrow('Match time must be between 0 and 90 minutes');
      
      // Valid time should work
      stateManager.updateState({ 'match.time': 45 });
      expect(stateManager.getState().match.time).toBe(45);
    });

    test('should validate scores', () => {
      expect(() => {
        stateManager.updateState({ 'match.homeScore': -1 });
      }).toThrow('Home score must be a non-negative integer');
      
      expect(() => {
        stateManager.updateState({ 'match.awayScore': 2.5 });
      }).toThrow('Away score must be a non-negative integer');
    });

    test('should validate bet amount memory', () => {
      expect(() => {
        stateManager.updateState({ 'betAmountMemory.fullMatch': 0 });
      }).toThrow('Full match bet amount memory must be a positive number');
      
      expect(() => {
        stateManager.updateState({ 'betAmountMemory.opportunity': -10 });
      }).toThrow('Opportunity bet amount memory must be a positive number');
    });
  });

  describe('Observer Pattern', () => {
    test('should subscribe and notify observers', () => {
      const observer = jest.fn();
      const unsubscribe = stateManager.subscribe(observer);
      
      stateManager.updateState({ wallet: 800 });
      
      expect(observer).toHaveBeenCalledTimes(1);
      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({ wallet: 800 }),
        expect.objectContaining({ wallet: 1000 }),
        expect.objectContaining({ wallet: { from: 1000, to: 800 } })
      );
      
      unsubscribe();
      stateManager.updateState({ wallet: 700 });
      expect(observer).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
    });

    test('should handle multiple observers', () => {
      const observer1 = jest.fn();
      const observer2 = jest.fn();
      
      stateManager.subscribe(observer1);
      stateManager.subscribe(observer2);
      
      stateManager.updateState({ wallet: 600 });
      
      expect(observer1).toHaveBeenCalledTimes(1);
      expect(observer2).toHaveBeenCalledTimes(1);
    });

    test('should handle observer errors gracefully', () => {
      const errorObserver = jest.fn(() => {
        throw new Error('Observer error');
      });
      const normalObserver = jest.fn();
      
      stateManager.subscribe(errorObserver);
      stateManager.subscribe(normalObserver);
      
      stateManager.updateState({ wallet: 500 });
      
      expect(errorObserver).toHaveBeenCalled();
      expect(normalObserver).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Observer callback error:', expect.any(Error));
    });

    test('should not notify observers when no changes occur', () => {
      const observer = jest.fn();
      stateManager.subscribe(observer);
      
      // Update with same value
      stateManager.updateState({ wallet: 1000 });
      
      expect(observer).not.toHaveBeenCalled();
    });

    test('should detect nested changes correctly', () => {
      const observer = jest.fn();
      stateManager.subscribe(observer);
      
      stateManager.updateState({ 'match.time': 30 });
      
      expect(observer).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          'match.time': { from: 0, to: 30 }
        })
      );
    });
  });

  describe('Bet Amount Memory', () => {
    test('should get bet amount memory', () => {
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(25);
    });

    test('should update bet amount memory', () => {
      stateManager.updateBetAmountMemory('fullMatch', 100);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      
      stateManager.updateBetAmountMemory('opportunity', 50);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(50);
    });

    test('should validate bet amount memory updates', () => {
      expect(() => {
        stateManager.updateBetAmountMemory('invalid', 50);
      }).toThrow('Invalid bet type: invalid');
      
      expect(() => {
        stateManager.updateBetAmountMemory('fullMatch', -10);
      }).toThrow('Bet amount must be a positive number');
    });

    test('should maintain separate memory for each betting type', () => {
      // Update different amounts for each type
      stateManager.updateBetAmountMemory('fullMatch', 75);
      stateManager.updateBetAmountMemory('opportunity', 150);
      
      // Verify they are stored separately
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(75);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(150);
      
      // Update one type should not affect the other
      stateManager.updateBetAmountMemory('fullMatch', 200);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(200);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(150);
    });

    test('should persist bet amount memory between matches', () => {
      // Set custom bet amounts
      stateManager.updateBetAmountMemory('fullMatch', 80);
      stateManager.updateBetAmountMemory('opportunity', 120);
      
      // Simulate match activity
      stateManager.updateState({
        'match.active': true,
        'match.time': 45,
        'match.homeScore': 1
      });
      
      // Reset match (simulating end of match)
      stateManager.resetMatch();
      
      // Bet amount memory should persist
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(80);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(120);
      
      // Match data should be reset
      const state = stateManager.getState();
      expect(state.match.active).toBe(false);
      expect(state.match.time).toBe(0);
      expect(state.match.homeScore).toBe(0);
    });

    test('should provide fallback to default when memory is corrupted', () => {
      // Manually corrupt the bet amount memory
      stateManager.state.betAmountMemory.fullMatch = null;
      
      // Should fallback to default
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
      
      // Test with undefined
      stateManager.state.betAmountMemory.opportunity = undefined;
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(25);
    });

    test('should notify observers when bet amount memory changes', () => {
      const observer = jest.fn();
      stateManager.subscribe(observer);
      
      stateManager.updateBetAmountMemory('fullMatch', 90);
      
      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({
          betAmountMemory: expect.objectContaining({
            fullMatch: 90
          })
        }),
        expect.any(Object),
        expect.objectContaining({
          'betAmountMemory.fullMatch': { from: 25, to: 90 }
        })
      );
    });

    test('should validate bet amount memory on state updates', () => {
      // Test direct state update validation
      expect(() => {
        stateManager.updateState({
          'betAmountMemory.fullMatch': 0
        });
      }).toThrow('Full match bet amount memory must be a positive number');
      
      expect(() => {
        stateManager.updateState({
          'betAmountMemory.opportunity': -5
        });
      }).toThrow('Opportunity bet amount memory must be a positive number');
      
      expect(() => {
        stateManager.updateState({
          'betAmountMemory.fullMatch': 'invalid'
        });
      }).toThrow('Full match bet amount memory must be a positive number');
    });

    test('should handle edge cases for bet amount memory', () => {
      // Test very large amounts
      stateManager.updateBetAmountMemory('fullMatch', 999999);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(999999);
      
      // Test decimal amounts
      stateManager.updateBetAmountMemory('opportunity', 25.50);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(25.50);
      
      // Test minimum valid amount
      stateManager.updateBetAmountMemory('fullMatch', 0.01);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(0.01);
    });
  });

  describe('State Reset', () => {
    test('should reset to initial state while preserving wallet', () => {
      // Make some changes
      stateManager.updateState({
        wallet: 500,
        currentScreen: 'match',
        'match.time': 45,
        'match.homeScore': 2
      });
      
      stateManager.reset();
      
      const state = stateManager.getState();
      expect(state.wallet).toBe(500); // Wallet preserved
      expect(state.currentScreen).toBe('lobby');
      expect(state.match.time).toBe(0);
      expect(state.match.homeScore).toBe(0);
    });

    test('should reset match while preserving session data', () => {
      // Setup match and session data
      stateManager.updateState({
        wallet: 800,
        'betAmountMemory.fullMatch': 75,
        'match.time': 60,
        'match.homeScore': 1,
        'match.awayScore': 2
      });
      
      stateManager.resetMatch();
      
      const state = stateManager.getState();
      expect(state.wallet).toBe(800); // Session data preserved
      expect(state.betAmountMemory.fullMatch).toBe(75); // Session data preserved
      expect(state.match.time).toBe(0); // Match data reset
      expect(state.match.homeScore).toBe(0);
      expect(state.match.awayScore).toBe(0);
    });
  });

  describe('State Validation Check', () => {
    test('should validate current state', () => {
      expect(stateManager.isStateValid()).toBe(true);
      
      // Manually corrupt state to test validation
      stateManager.state.wallet = -100;
      expect(stateManager.isStateValid()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid observer callback', () => {
      expect(() => {
        stateManager.subscribe('not a function');
      }).toThrow('Observer callback must be a function');
    });

    test('should handle state update failures', () => {
      expect(() => {
        stateManager.updateState({ wallet: 'invalid' });
      }).toThrow();
      
      // State should remain unchanged after failed update
      expect(stateManager.getState().wallet).toBe(1000);
    });
  });
});