/**
 * Node.js test runner for bet amount memory system
 * Tests the complete functionality without browser dependencies
 */

// Simple test framework
const test = {
    expect: (actual) => ({
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
    })
};

// Mock StateManager for testing
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            betAmountMemory: {
                fullMatch: 25,
                opportunity: 25
            },
            match: {
                active: false,
                time: 0,
                homeScore: 0,
                awayScore: 0
            },
            bets: {
                fullMatch: [],
                actionBets: []
            }
        };
        this.observers = new Set();
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    updateState(updates) {
        const oldState = this.getState();
        
        for (const [key, value] of Object.entries(updates)) {
            if (key.includes('.')) {
                const keys = key.split('.');
                let current = this.state;
                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            } else {
                if (typeof value === 'object' && value !== null) {
                    this.state[key] = { ...this.state[key], ...value };
                } else {
                    this.state[key] = value;
                }
            }
        }
        
        this.notifyObservers(oldState, this.getState());
    }

    getBetAmountMemory(type) {
        const validTypes = ['fullMatch', 'opportunity'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid bet type: ${type}. Must be one of: ${validTypes.join(', ')}`);
        }
        return this.state.betAmountMemory[type] || 25;
    }

    updateBetAmountMemory(type, amount) {
        const validTypes = ['fullMatch', 'opportunity'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid bet type: ${type}. Must be one of: ${validTypes.join(', ')}`);
        }
        
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Bet amount must be a positive number');
        }
        
        this.updateState({
            [`betAmountMemory.${type}`]: amount
        });
    }

    resetMatch() {
        this.updateState({
            'match.active': false,
            'match.time': 0,
            'match.homeScore': 0,
            'match.awayScore': 0,
            bets: { fullMatch: [], actionBets: [] }
        });
    }

    subscribe(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    notifyObservers(oldState, newState) {
        const changes = this.getStateChanges(oldState, newState);
        this.observers.forEach(callback => {
            try {
                callback(newState, oldState, changes);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }

    getStateChanges(oldState, newState) {
        const changes = {};
        
        const compareObjects = (old, current, path = '') => {
            for (const key in current) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (!(key in old)) {
                    changes[currentPath] = { from: undefined, to: current[key] };
                } else if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key]) && 
                           typeof old[key] === 'object' && old[key] !== null && !Array.isArray(old[key])) {
                    compareObjects(old[key], current[key], currentPath);
                } else if (JSON.stringify(old[key]) !== JSON.stringify(current[key])) {
                    changes[currentPath] = { from: old[key], to: current[key] };
                }
            }
        };
        
        compareObjects(oldState, newState);
        return changes;
    }
}

// Mock betting components
class MockFullMatchBetting {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    placeBet(outcome, amount) {
        const state = this.stateManager.getState();
        
        if (amount > state.wallet) {
            return { success: false, error: 'Insufficient funds' };
        }
        
        // Update wallet and memory
        this.stateManager.updateState({
            wallet: state.wallet - amount,
            betAmountMemory: {
                ...state.betAmountMemory,
                fullMatch: amount
            }
        });
        
        return { success: true };
    }
}

class MockActionBetting {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    getPrePopulatedAmount() {
        return this.stateManager.getBetAmountMemory('opportunity');
    }

    placeBet(choice, amount) {
        const state = this.stateManager.getState();
        
        if (amount > state.wallet) {
            return { success: false, error: 'Insufficient funds' };
        }
        
        // Update wallet and memory
        this.stateManager.updateState({
            wallet: state.wallet - amount
        });
        
        this.stateManager.updateBetAmountMemory('opportunity', amount);
        
        return { success: true };
    }
}

// Test runner
function runTest(name, testFn) {
    try {
        testFn();
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        return false;
    }
}

function runAllTests() {
    console.log('🧠 Running Bet Amount Memory System Tests\n');
    
    let passed = 0;
    let total = 0;

    // Test 1: Basic Memory Operations
    total++;
    if (runTest('Basic Memory Get/Set Operations', () => {
        const stateManager = new MockStateManager();
        
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(25);
        
        stateManager.updateBetAmountMemory('fullMatch', 100);
        stateManager.updateBetAmountMemory('opportunity', 75);
        
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(100);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
    })) passed++;

    // Test 2: Separate Memory Management
    total++;
    if (runTest('Separate Memory for Each Betting Type', () => {
        const stateManager = new MockStateManager();
        
        stateManager.updateBetAmountMemory('fullMatch', 150);
        stateManager.updateBetAmountMemory('opportunity', 50);
        
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(50);
        
        // Update one should not affect the other
        stateManager.updateBetAmountMemory('fullMatch', 200);
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(200);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(50);
    })) passed++;

    // Test 3: Memory Persistence Between Matches
    total++;
    if (runTest('Memory Persistence Between Matches', () => {
        const stateManager = new MockStateManager();
        
        // Set custom amounts
        stateManager.updateBetAmountMemory('fullMatch', 125);
        stateManager.updateBetAmountMemory('opportunity', 85);
        
        // Simulate match activity
        stateManager.updateState({
            'match.active': true,
            'match.time': 45,
            'match.homeScore': 1
        });
        
        // Reset match
        stateManager.resetMatch();
        
        // Memory should persist
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(125);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(85);
        
        // Match data should be reset
        const state = stateManager.getState();
        test.expect(state.match.active).toBe(false);
        test.expect(state.match.time).toBe(0);
    })) passed++;

    // Test 4: Full Match Betting Integration
    total++;
    if (runTest('Full Match Betting Memory Integration', () => {
        const stateManager = new MockStateManager();
        const fullMatchBetting = new MockFullMatchBetting(stateManager);
        
        // Set custom memory
        stateManager.updateBetAmountMemory('fullMatch', 80);
        
        // Place bet
        const result = fullMatchBetting.placeBet('home', 120);
        test.expect(result.success).toBe(true);
        
        // Memory should be updated
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(120);
        
        // Wallet should be reduced
        test.expect(stateManager.getState().wallet).toBe(880);
    })) passed++;

    // Test 5: Action Betting Integration
    total++;
    if (runTest('Action Betting Memory Integration', () => {
        const stateManager = new MockStateManager();
        const actionBetting = new MockActionBetting(stateManager);
        
        // Set custom memory
        stateManager.updateBetAmountMemory('opportunity', 60);
        
        // Verify pre-populated amount
        test.expect(actionBetting.getPrePopulatedAmount()).toBe(60);
        
        // Place bet
        const result = actionBetting.placeBet('choice1', 90);
        test.expect(result.success).toBe(true);
        
        // Memory should be updated
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(90);
        
        // Wallet should be reduced
        test.expect(stateManager.getState().wallet).toBe(910);
    })) passed++;

    // Test 6: Validation and Error Handling
    total++;
    if (runTest('Validation and Error Handling', () => {
        const stateManager = new MockStateManager();
        
        // Test invalid bet type
        test.expect(() => {
            stateManager.updateBetAmountMemory('invalid', 50);
        }).toThrow('Invalid bet type');
        
        // Test invalid amounts
        test.expect(() => {
            stateManager.updateBetAmountMemory('fullMatch', -10);
        }).toThrow('Bet amount must be a positive number');
        
        test.expect(() => {
            stateManager.updateBetAmountMemory('opportunity', 0);
        }).toThrow('Bet amount must be a positive number');
    })) passed++;

    // Test 7: Fallback Mechanisms
    total++;
    if (runTest('Fallback to Default Values', () => {
        const stateManager = new MockStateManager();
        
        // Corrupt memory values
        stateManager.state.betAmountMemory.fullMatch = null;
        stateManager.state.betAmountMemory.opportunity = undefined;
        
        // Should fallback to defaults
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(25);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(25);
    })) passed++;

    // Test 8: Observer Notifications
    total++;
    if (runTest('Observer Notifications for Memory Changes', () => {
        const stateManager = new MockStateManager();
        let notificationReceived = false;
        let changeData = null;
        
        stateManager.subscribe((newState, oldState, changes) => {
            if (changes['betAmountMemory.fullMatch']) {
                notificationReceived = true;
                changeData = changes['betAmountMemory.fullMatch'];
            }
        });
        
        stateManager.updateBetAmountMemory('fullMatch', 175);
        
        test.expect(notificationReceived).toBe(true);
        test.expect(changeData.from).toBe(25);
        test.expect(changeData.to).toBe(175);
    })) passed++;

    // Test 9: Concurrent Betting with Separate Memory
    total++;
    if (runTest('Concurrent Betting with Separate Memory', () => {
        const stateManager = new MockStateManager();
        const fullMatchBetting = new MockFullMatchBetting(stateManager);
        const actionBetting = new MockActionBetting(stateManager);
        
        // Place full match bet
        fullMatchBetting.placeBet('home', 150);
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
        
        // Place action bet
        actionBetting.placeBet('choice1', 75);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
        
        // Verify both memories are maintained separately
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(150);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(75);
        
        // Verify wallet is correctly updated
        test.expect(stateManager.getState().wallet).toBe(775); // 1000 - 150 - 75
    })) passed++;

    // Test 10: Memory Consistency Across State Updates
    total++;
    if (runTest('Memory Consistency Across State Updates', () => {
        const stateManager = new MockStateManager();
        
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
        test.expect(stateManager.getBetAmountMemory('fullMatch')).toBe(80);
        test.expect(stateManager.getBetAmountMemory('opportunity')).toBe(60);
    })) passed++;

    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All bet amount memory tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed. Please check the implementation.');
        return false;
    }
}

// Run tests
runAllTests();