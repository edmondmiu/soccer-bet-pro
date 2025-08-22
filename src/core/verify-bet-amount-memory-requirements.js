/**
 * Verification script for bet amount memory system requirements
 * Validates implementation against Requirements 8.2 and 8.4
 */

// Import the StateManager to test
import { StateManager } from './StateManager.js';
import { FullMatchBetting } from '../betting/FullMatchBetting.js';
import { ActionBetting } from '../betting/ActionBetting.js';

// Mock DOM environment for testing
const mockDOM = () => {
  global.document = {
    createElement: () => ({
      className: '',
      innerHTML: '',
      style: {},
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      setAttribute: () => {},
      getAttribute: () => null,
      remove: () => {}
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };
};

/**
 * Verification framework
 */
class RequirementVerifier {
  constructor() {
    this.results = [];
    this.currentRequirement = null;
  }

  requirement(id, description) {
    this.currentRequirement = { id, description, tests: [] };
    console.log(`\n📋 Verifying Requirement ${id}: ${description}`);
    return this;
  }

  test(description, testFn) {
    try {
      testFn();
      this.currentRequirement.tests.push({ description, status: 'PASS', error: null });
      console.log(`  ✅ ${description}`);
    } catch (error) {
      this.currentRequirement.tests.push({ description, status: 'FAIL', error: error.message });
      console.log(`  ❌ ${description}: ${error.message}`);
    }
    return this;
  }

  complete() {
    this.results.push(this.currentRequirement);
    const passed = this.currentRequirement.tests.filter(t => t.status === 'PASS').length;
    const total = this.currentRequirement.tests.length;
    
    if (passed === total) {
      console.log(`  🎉 Requirement ${this.currentRequirement.id} VERIFIED (${passed}/${total} tests passed)`);
    } else {
      console.log(`  ⚠️  Requirement ${this.currentRequirement.id} INCOMPLETE (${passed}/${total} tests passed)`);
    }
    
    this.currentRequirement = null;
    return this;
  }

  summary() {
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('========================');
    
    let totalRequirements = 0;
    let passedRequirements = 0;
    let totalTests = 0;
    let passedTests = 0;

    this.results.forEach(req => {
      totalRequirements++;
      const reqPassed = req.tests.filter(t => t.status === 'PASS').length;
      const reqTotal = req.tests.length;
      
      totalTests += reqTotal;
      passedTests += reqPassed;
      
      if (reqPassed === reqTotal) {
        passedRequirements++;
        console.log(`✅ ${req.id}: ${req.description} (${reqPassed}/${reqTotal})`);
      } else {
        console.log(`❌ ${req.id}: ${req.description} (${reqPassed}/${reqTotal})`);
        req.tests.filter(t => t.status === 'FAIL').forEach(test => {
          console.log(`   - FAILED: ${test.description} - ${test.error}`);
        });
      }
    });

    console.log(`\nOverall: ${passedRequirements}/${totalRequirements} requirements verified`);
    console.log(`Tests: ${passedTests}/${totalTests} passed`);
    
    return passedRequirements === totalRequirements;
  }
}

/**
 * Helper functions for testing
 */
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toContain: (expected) => {
    if (!actual.includes(expected)) {
      throw new Error(`Expected "${actual}" to contain "${expected}"`);
    }
  },
  toThrow: (expectedMessage) => {
    try {
      actual();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
      }
    }
  }
});

/**
 * Mock BettingManager for testing
 */
class MockBettingManager {
  placeBet(betData) {
    // Simple validation
    if (betData.stake <= 0) {
      return { success: false, error: 'Invalid bet amount' };
    }
    
    return {
      success: true,
      bet: {
        id: `bet_${Date.now()}`,
        ...betData,
        potentialWinnings: betData.stake * betData.odds,
        status: 'pending',
        placedAt: Date.now()
      }
    };
  }
}

/**
 * Mock TimerManager for testing
 */
class MockTimerManager {
  constructor() {
    this.callbacks = {};
  }
  
  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }
  
  pauseTimer() {}
  resumeTimer() {}
  startCountdown(duration, callback) {
    setTimeout(callback, 100); // Quick timeout for testing
  }
  stopCountdown() {}
  getCountdownTime() { return 5; }
  getStatus() { return { paused: false }; }
}

/**
 * Run all requirement verifications
 */
function runVerification() {
  console.log('🧠 BET AMOUNT MEMORY SYSTEM VERIFICATION');
  console.log('=========================================');
  
  mockDOM();
  const verifier = new RequirementVerifier();

  // Requirement 8.2: Persist bet amount memory for next match
  verifier
    .requirement('8.2', 'WHEN starting a new match THEN the system SHALL persist bet amount memory for the next match')
    .test('StateManager initializes with default bet amount memory', () => {
      const stateManager = new StateManager();
      const state = stateManager.getState();
      
      expect(state.betAmountMemory).toEqual({
        fullMatch: 25,
        opportunity: 25
      });
    })
    .test('Bet amount memory persists through match reset', () => {
      const stateManager = new StateManager();
      
      // Set custom bet amounts
      stateManager.updateBetAmountMemory('fullMatch', 100);
      stateManager.updateBetAmountMemory('opportunity', 75);
      
      // Simulate match activity
      stateManager.updateState({
        'match.active': true,
        'match.time': 45,
        'match.homeScore': 1,
        'match.awayScore': 0
      });
      
      // Reset match (simulating end of match and starting new one)
      stateManager.resetMatch();
      
      // Bet amount memory should persist
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
      
      // Match data should be reset
      const state = stateManager.getState();
      expect(state.match.active).toBe(false);
      expect(state.match.time).toBe(0);
      expect(state.match.homeScore).toBe(0);
      expect(state.match.awayScore).toBe(0);
    })
    .test('Bet amount memory persists through multiple match cycles', () => {
      const stateManager = new StateManager();
      
      // First match
      stateManager.updateBetAmountMemory('fullMatch', 80);
      stateManager.updateState({ 'match.active': true, 'match.time': 90 });
      stateManager.resetMatch();
      
      // Second match
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(80);
      stateManager.updateBetAmountMemory('fullMatch', 120);
      stateManager.updateState({ 'match.active': true, 'match.time': 90 });
      stateManager.resetMatch();
      
      // Third match
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(120);
    })
    .test('Full match betting updates and persists memory', () => {
      const stateManager = new StateManager();
      const bettingManager = new MockBettingManager();
      const fullMatchBetting = new FullMatchBetting(stateManager, bettingManager);
      
      // Initialize match
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Arsenal',
        'match.awayTeam': 'Chelsea'
      });
      
      // Place bet
      const result = fullMatchBetting.placeBet('home', 150);
      expect(result.success).toBe(true);
      
      // Memory should be updated
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
      
      // Reset match and verify persistence
      stateManager.resetMatch();
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
    })
    .test('Action betting updates and persists memory', () => {
      const stateManager = new StateManager();
      const timerManager = new MockTimerManager();
      const bettingManager = new MockBettingManager();
      const actionBetting = new ActionBetting(stateManager, timerManager, bettingManager);
      
      // Place action bet
      const eventData = {
        id: 'event1',
        description: 'Test event',
        choices: [{ id: 'choice1', description: 'Option A', odds: 2.0, outcome: 'test' }]
      };
      
      actionBetting.showActionBettingModal(eventData);
      const result = actionBetting.placeBet('choice1', 90);
      expect(result.success).toBe(true);
      
      // Memory should be updated
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(90);
      
      // Reset match and verify persistence
      stateManager.resetMatch();
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(90);
    })
    .complete();

  // Requirement 8.4: Maintain separate bet amount memory for each betting type
  verifier
    .requirement('8.4', 'WHEN managing state THEN the system SHALL maintain separate bet amount memory for each betting type')
    .test('StateManager provides separate memory for fullMatch and opportunity', () => {
      const stateManager = new StateManager();
      
      // Verify separate memory exists
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(25);
      
      // Verify they can be set independently
      stateManager.updateBetAmountMemory('fullMatch', 100);
      stateManager.updateBetAmountMemory('opportunity', 50);
      
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(50);
    })
    .test('Updating one betting type memory does not affect the other', () => {
      const stateManager = new StateManager();
      
      // Set initial different values
      stateManager.updateBetAmountMemory('fullMatch', 150);
      stateManager.updateBetAmountMemory('opportunity', 75);
      
      // Update only fullMatch
      stateManager.updateBetAmountMemory('fullMatch', 200);
      
      // Verify only fullMatch changed
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(200);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
      
      // Update only opportunity
      stateManager.updateBetAmountMemory('opportunity', 125);
      
      // Verify only opportunity changed
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(200);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(125);
    })
    .test('Full match and action betting use separate memory systems', () => {
      const stateManager = new StateManager();
      const bettingManager = new MockBettingManager();
      const timerManager = new MockTimerManager();
      
      const fullMatchBetting = new FullMatchBetting(stateManager, bettingManager);
      const actionBetting = new ActionBetting(stateManager, timerManager, bettingManager);
      
      // Initialize match
      stateManager.updateState({
        'match.active': true,
        'match.homeTeam': 'Arsenal',
        'match.awayTeam': 'Chelsea'
      });
      
      // Place full match bet
      fullMatchBetting.placeBet('home', 180);
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(180);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(25); // Should remain default
      
      // Place action bet
      const eventData = {
        id: 'event1',
        description: 'Test event',
        choices: [{ id: 'choice1', description: 'Option A', odds: 2.0, outcome: 'test' }]
      };
      
      actionBetting.showActionBettingModal(eventData);
      actionBetting.placeBet('choice1', 60);
      
      // Verify separate memory
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(180);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(60);
    })
    .test('Memory validation enforces separate type constraints', () => {
      const stateManager = new StateManager();
      
      // Test invalid betting type
      expect(() => {
        stateManager.getBetAmountMemory('invalid');
      }).toThrow('Invalid bet type');
      
      expect(() => {
        stateManager.updateBetAmountMemory('invalid', 50);
      }).toThrow('Invalid bet type');
      
      // Test valid types work independently
      stateManager.updateBetAmountMemory('fullMatch', 100);
      stateManager.updateBetAmountMemory('opportunity', 200);
      
      expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
      expect(stateManager.getBetAmountMemory('opportunity')).toBe(200);
    })
    .test('State structure maintains separate memory objects', () => {
      const stateManager = new StateManager();
      const state = stateManager.getState();
      
      // Verify structure
      expect(typeof state.betAmountMemory).toBe('object');
      expect(state.betAmountMemory.hasOwnProperty('fullMatch')).toBe(true);
      expect(state.betAmountMemory.hasOwnProperty('opportunity')).toBe(true);
      
      // Verify they are separate properties
      stateManager.updateState({
        'betAmountMemory.fullMatch': 300
      });
      
      const updatedState = stateManager.getState();
      expect(updatedState.betAmountMemory.fullMatch).toBe(300);
      expect(updatedState.betAmountMemory.opportunity).toBe(25); // Should remain unchanged
    })
    .test('Observer notifications work for separate memory types', () => {
      const stateManager = new StateManager();
      let fullMatchNotifications = 0;
      let opportunityNotifications = 0;
      
      stateManager.subscribe((newState, oldState, changes) => {
        if (changes['betAmountMemory.fullMatch']) {
          fullMatchNotifications++;
        }
        if (changes['betAmountMemory.opportunity']) {
          opportunityNotifications++;
        }
      });
      
      // Update fullMatch memory
      stateManager.updateBetAmountMemory('fullMatch', 150);
      expect(fullMatchNotifications).toBe(1);
      expect(opportunityNotifications).toBe(0);
      
      // Update opportunity memory
      stateManager.updateBetAmountMemory('opportunity', 75);
      expect(fullMatchNotifications).toBe(1);
      expect(opportunityNotifications).toBe(1);
    })
    .complete();

  return verifier.summary();
}

// Run verification if this file is executed directly
if (typeof window === 'undefined') {
  runVerification();
}

export { runVerification };