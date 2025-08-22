/**
 * Simple test script for StateManager
 */
import { StateManager } from './StateManager.js';

// Simple test framework
class SimpleTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  test(name, fn) {
    try {
      fn();
      this.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`✗ ${name}: ${error.message}`);
      this.tests.push({ name, error: error.message });
    }
  }

  expect(actual) {
    return {
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
      toThrow: (expectedMessage) => {
        let threw = false;
        let actualMessage = '';
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (error) {
          threw = true;
          actualMessage = error.message;
        }
        if (!threw) {
          throw new Error('Expected function to throw an error');
        }
        if (expectedMessage && !actualMessage.includes(expectedMessage)) {
          throw new Error(`Expected error message to contain "${expectedMessage}", got "${actualMessage}"`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      }
    };
  }

  summary() {
    console.log(`\n=== Test Summary ===`);
    console.log(`Total: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    
    if (this.failed > 0) {
      console.log('\nFailed tests:');
      this.tests.forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
      });
    }
    
    return this.failed === 0;
  }
}

// Run tests
const test = new SimpleTest();

console.log('Running StateManager Tests...\n');

// Test 1: Initialization
test.test('should initialize with correct default state', () => {
  const stateManager = new StateManager();
  const state = stateManager.getState();
  
  test.expect(state.currentScreen).toBe('lobby');
  test.expect(state.wallet).toBe(1000);
  test.expect(state.classicMode).toBe(false);
  test.expect(state.match.active).toBe(false);
  test.expect(state.match.time).toBe(0);
  test.expect(state.betAmountMemory.fullMatch).toBe(25);
});

// Test 2: State Updates
test.test('should update simple properties', () => {
  const stateManager = new StateManager();
  stateManager.updateState({ wallet: 750 });
  test.expect(stateManager.getState().wallet).toBe(750);
});

// Test 3: Nested Updates
test.test('should update nested properties with dot notation', () => {
  const stateManager = new StateManager();
  stateManager.updateState({ 'match.time': 45 });
  test.expect(stateManager.getState().match.time).toBe(45);
});

// Test 4: Validation
test.test('should validate wallet values', () => {
  const stateManager = new StateManager();
  test.expect(() => {
    stateManager.updateState({ wallet: -100 });
  }).toThrow('Wallet must be a non-negative number');
});

// Test 5: Screen validation
test.test('should validate screen values', () => {
  const stateManager = new StateManager();
  test.expect(() => {
    stateManager.updateState({ currentScreen: 'invalid' });
  }).toThrow('Invalid screen');
});

// Test 6: Observer pattern
test.test('should notify observers on state change', () => {
  const stateManager = new StateManager();
  let notified = false;
  let receivedNewState = null;
  
  stateManager.subscribe((newState, oldState, changes) => {
    notified = true;
    receivedNewState = newState;
  });
  
  stateManager.updateState({ wallet: 800 });
  
  test.expect(notified).toBe(true);
  test.expect(receivedNewState.wallet).toBe(800);
});

// Test 7: Unsubscribe
test.test('should unsubscribe correctly', () => {
  const stateManager = new StateManager();
  let callCount = 0;
  
  const unsubscribe = stateManager.subscribe(() => {
    callCount++;
  });
  
  stateManager.updateState({ wallet: 800 });
  test.expect(callCount).toBe(1);
  
  unsubscribe();
  stateManager.updateState({ wallet: 700 });
  test.expect(callCount).toBe(1); // Should not increment
});

// Test 8: Bet amount memory
test.test('should get and update bet amount memory', () => {
  const stateManager = new StateManager();
  test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
  
  stateManager.updateBetAmountMemory('fullMatch', 100);
  test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
});

// Test 9: Bet amount validation
test.test('should validate bet amount memory', () => {
  const stateManager = new StateManager();
  test.expect(() => {
    stateManager.updateBetAmountMemory('invalid', 50);
  }).toThrow('Invalid bet type');
});

// Test 10: State reset
test.test('should reset while preserving wallet', () => {
  const stateManager = new StateManager();
  stateManager.updateState({ wallet: 500, currentScreen: 'match' });
  
  stateManager.reset();
  
  const state = stateManager.getState();
  test.expect(state.wallet).toBe(500);
  test.expect(state.currentScreen).toBe('lobby');
});

// Test 11: Match reset
test.test('should reset match while preserving session data', () => {
  const stateManager = new StateManager();
  stateManager.updateState({
    wallet: 800,
    'betAmountMemory.fullMatch': 75,
    'match.time': 60,
    'match.homeScore': 1
  });
  
  stateManager.resetMatch();
  
  const state = stateManager.getState();
  test.expect(state.wallet).toBe(800);
  test.expect(state.betAmountMemory.fullMatch).toBe(75);
  test.expect(state.match.time).toBe(0);
  test.expect(state.match.homeScore).toBe(0);
});

// Test 12: State validation check
test.test('should validate current state', () => {
  const stateManager = new StateManager();
  test.expect(stateManager.isStateValid()).toBe(true);
});

// Test 13: Validators setup
test.test('should setup validators correctly', () => {
  const stateManager = new StateManager();
  test.expect(stateManager.validators.size).toBeGreaterThan(0);
});

// Test 14: State slice access
test.test('should get state slices correctly', () => {
  const stateManager = new StateManager();
  const matchState = stateManager.getStateSlice('match');
  test.expect(matchState.active).toBe(false);
  
  const wallet = stateManager.getStateSlice('wallet');
  test.expect(wallet).toBe(1000);
});

// Test 15: Immutable state access
test.test('getState should return immutable copy', () => {
  const stateManager = new StateManager();
  const state1 = stateManager.getState();
  const state2 = stateManager.getState();
  
  // Modifying returned state should not affect internal state
  state1.wallet = 500;
  test.expect(stateManager.getState().wallet).toBe(1000);
});

// Show summary
const success = test.summary();

if (success) {
  console.log('\n🎉 All StateManager tests passed!');
} else {
  console.log('\n❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}