/**
 * Integration tests for bet amount memory system
 * Tests the complete flow of bet amount memory across components
 */
import { StateManager } from './StateManager.js';
import { FullMatchBetting } from '../betting/FullMatchBetting.js';
import { ActionBetting } from '../betting/ActionBetting.js';

// Mock DOM environment
const mockDOM = () => {
  global.document = {
    createElement: jest.fn(() => ({
      className: '',
      innerHTML: '',
      style: {},
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      remove: jest.fn()
    })),
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    getElementById: jest.fn(() => null),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }
  };
};

describe('Bet Amount Memory Integration', () => {
  let stateManager;
  let fullMatchBetting;
  let actionBetting;

  beforeEach(() => {
    mockDOM();
    stateManager = new StateManager();
    fullMatchBetting = new FullMatchBetting(stateManager);
    actionBetting = new ActionBetting(stateManager);
  });

  describe('Full Match Betting Memory', () => {
    test('should pre-populate betting form with remembered amount', () => {
      // Set custom bet amount memory
      stateManager.updateBetAmountMemory('fullMatch', 75);
      
      // Initialize match
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Arsenal',
        'match.awayTeam': 'Chelsea'
      });
      
      // Show betting form
      fullMatchBetting.showBettingForm('home');
      
      // Verify the form uses remembered amount
      const rememberedAmount = stateManager.getBetAmountMemory('fullMatch');
      expect(rememberedAmount).toBe(75);
    });

    test('should update memory when bet is placed', () => {
      // Initialize match
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Arsenal',
        'match.awayTeam': 'Chelsea'
      });
      
      // Place bet with custom amount
      const betResult = fullMatchBetting.placeBet('home', 150);
      
      expect(betResult.success).toBe(true);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
    });

    test('should persist memory across multiple matches', () => {
      // First match - place bet
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Arsenal',
        'match.awayTeam': 'Chelsea'
      });
      
      fullMatchBetting.placeBet('home', 100);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      
      // End first match
      stateManager.resetMatch();
      
      // Start second match
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Liverpool',
        'match.awayTeam': 'Manchester City'
      });
      
      // Memory should persist
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      
      // Place another bet
      fullMatchBetting.placeBet('away', 200);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(200);
    });
  });

  describe('Action Betting Memory', () => {
    test('should pre-populate bet slip with remembered amount', () => {
      // Set custom bet amount memory
      stateManager.updateBetAmountMemory('opportunity', 60);
      
      // Verify pre-populated amount
      const prePopulatedAmount = actionBetting.getPrePopulatedAmount();
      expect(prePopulatedAmount).toBe(60);
    });

    test('should update memory when action bet is placed', () => {
      // Mock event data
      const eventData = {
        id: 'event1',
        description: 'Corner kick opportunity',
        choices: [
          { id: 'choice1', description: 'Goal from corner', odds: 3.5 },
          { id: 'choice2', description: 'No goal', odds: 1.3 }
        ]
      };
      
      // Show action betting modal
      actionBetting.showActionBettingModal(eventData);
      
      // Place bet with custom amount
      const betResult = actionBetting.placeBet('choice1', 80);
      
      expect(betResult.success).toBe(true);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(80);
    });

    test('should persist memory across multiple action betting opportunities', () => {
      const eventData1 = {
        id: 'event1',
        description: 'First opportunity',
        choices: [
          { id: 'choice1', description: 'Option A', odds: 2.0 },
          { id: 'choice2', description: 'Option B', odds: 1.8 }
        ]
      };
      
      const eventData2 = {
        id: 'event2',
        description: 'Second opportunity',
        choices: [
          { id: 'choice3', description: 'Option C', odds: 2.5 },
          { id: 'choice4', description: 'Option D', odds: 1.6 }
        ]
      };
      
      // First action bet
      actionBetting.showActionBettingModal(eventData1);
      actionBetting.placeBet('choice1', 90);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(90);
      
      // Second action bet should use updated memory
      actionBetting.showActionBettingModal(eventData2);
      const prePopulatedAmount = actionBetting.getPrePopulatedAmount();
      expect(prePopulatedAmount).toBe(90);
      
      // Place second bet with different amount
      actionBetting.placeBet('choice3', 120);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(120);
    });
  });

  describe('Separate Memory Management', () => {
    test('should maintain separate memory for each betting type', () => {
      // Set different amounts for each type
      stateManager.updateBetAmountMemory('fullMatch', 100);
      stateManager.updateBetAmountMemory('opportunity', 50);
      
      // Verify they are separate
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(50);
      
      // Update one should not affect the other
      stateManager.updateBetAmountMemory('fullMatch', 200);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(200);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(50);
    });

    test('should handle concurrent betting with separate memory', () => {
      // Initialize match
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Arsenal',
        'match.awayTeam': 'Chelsea'
      });
      
      // Place full match bet
      fullMatchBetting.placeBet('home', 150);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
      
      // Place action bet
      const eventData = {
        id: 'event1',
        description: 'Action opportunity',
        choices: [
          { id: 'choice1', description: 'Option A', odds: 2.0 }
        ]
      };
      
      actionBetting.showActionBettingModal(eventData);
      actionBetting.placeBet('choice1', 75);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
      
      // Verify both memories are maintained separately
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
    });
  });

  describe('Memory Persistence and Validation', () => {
    test('should persist memory through match resets', () => {
      // Set custom amounts
      stateManager.updateBetAmountMemory('fullMatch', 125);
      stateManager.updateBetAmountMemory('opportunity', 85);
      
      // Simulate match activity
      stateManager.updateState({
        'match.active': true,
        'match.time': 90,
        'match.homeScore': 2,
        'match.awayScore': 1
      });
      
      // Reset match
      stateManager.resetMatch();
      
      // Memory should persist
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(125);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(85);
      
      // Match data should be reset
      const state = stateManager.getState();
      expect(state.match.active).toBe(false);
      expect(state.match.time).toBe(0);
      expect(state.match.homeScore).toBe(0);
      expect(state.match.awayScore).toBe(0);
    });

    test('should validate bet amounts against wallet balance', () => {
      // Set wallet to low amount
      stateManager.updateState({ wallet: 50 });
      
      // Try to place bet larger than wallet
      const betResult = fullMatchBetting.placeBet('home', 100);
      
      expect(betResult.success).toBe(false);
      expect(betResult.error).toContain('Insufficient funds');
      
      // Memory should not be updated for failed bets
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25); // Default
    });

    test('should handle invalid bet amounts gracefully', () => {
      // Test invalid amounts
      expect(() => {
        stateManager.updateBetAmountMemory('fullMatch', 0);
      }).toThrow('Bet amount must be a positive number');
      
      expect(() => {
        stateManager.updateBetAmountMemory('opportunity', -10);
      }).toThrow('Bet amount must be a positive number');
      
      expect(() => {
        stateManager.updateBetAmountMemory('fullMatch', 'invalid');
      }).toThrow('Bet amount must be a positive number');
    });

    test('should provide fallback values for corrupted memory', () => {
      // Corrupt memory values
      stateManager.state.betAmountMemory.fullMatch = null;
      stateManager.state.betAmountMemory.opportunity = undefined;
      
      // Should fallback to defaults
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(25);
    });
  });

  describe('State Synchronization', () => {
    test('should notify observers when memory changes', () => {
      const observer = jest.fn();
      stateManager.subscribe(observer);
      
      // Update memory
      stateManager.updateBetAmountMemory('fullMatch', 175);
      
      // Verify observer was called with correct changes
      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({
          betAmountMemory: expect.objectContaining({
            fullMatch: 175
          })
        }),
        expect.any(Object),
        expect.objectContaining({
          'betAmountMemory.fullMatch': { from: 25, to: 175 }
        })
      );
    });

    test('should maintain memory consistency across state updates', () => {
      // Set initial memory
      stateManager.updateBetAmountMemory('fullMatch', 80);
      stateManager.updateBetAmountMemory('opportunity', 60);
      
      // Update other state properties
      stateManager.updateState({
        wallet: 500,
        'match.time': 45,
        'match.homeScore': 1
      });
      
      // Memory should remain unchanged
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(80);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(60);
    });
  });
});