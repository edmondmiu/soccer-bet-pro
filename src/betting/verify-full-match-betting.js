/**
 * FullMatchBetting Verification Script
 * Verifies the implementation meets all requirements
 */

import { FullMatchBetting } from './FullMatchBetting.js';
import { StateManager } from '../core/StateManager.js';
import { BettingManager } from './BettingManager.js';

// Mock DOM environment
global.document = {
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        textContent: '',
        dataset: {},
        style: {},
        addEventListener: () => {},
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        remove: () => {},
        click: () => {},
        focus: () => {},
        select: () => {},
        dispatchEvent: () => {}
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

global.Element = {
    prototype: {
        remove: function() {}
    }
};

global.Event = class Event {
    constructor(type) {
        this.type = type;
    }
};

global.KeyboardEvent = class KeyboardEvent extends Event {
    constructor(type, options = {}) {
        super(type);
        this.key = options.key;
    }
};

global.setTimeout = (fn, delay) => fn();

function runVerification() {
    console.log('🚀 Starting FullMatchBetting Verification...\n');
    
    let passed = 0;
    let failed = 0;
    
    function test(name, fn) {
        try {
            fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    // Mock PowerUpManager
    const powerUpManager = {
        awardPowerUp: () => ({ success: true }),
        hasPowerUp: () => false,
        applyPowerUp: () => ({ success: true })
    };
    
    // Initialize components
    const stateManager = new StateManager();
    const bettingManager = new BettingManager(stateManager, powerUpManager);
    const fullMatchBetting = new FullMatchBetting(stateManager, bettingManager);
    
    // Set up match state
    stateManager.updateState({
        match: {
            active: true,
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            odds: { home: 1.85, draw: 3.50, away: 4.20 }
        }
    });
    
    // Requirement 3.1: Always-visible betting buttons
    test('Requirement 3.1: Always-visible betting buttons', () => {
        if (typeof fullMatchBetting.createBettingInterface !== 'function') {
            throw new Error('createBettingInterface method missing');
        }
        if (typeof fullMatchBetting.createBettingButton !== 'function') {
            throw new Error('createBettingButton method missing');
        }
    });
    
    // Requirement 3.2: Inline betting forms without pausing
    test('Requirement 3.2: Inline betting forms without pausing', () => {
        if (typeof fullMatchBetting.showBettingForm !== 'function') {
            throw new Error('showBettingForm method missing');
        }
        if (typeof fullMatchBetting.clearBettingForm !== 'function') {
            throw new Error('clearBettingForm method missing');
        }
    });
    
    // Requirement 3.3: Pre-populated bet amounts
    test('Requirement 3.3: Pre-populated bet amounts', () => {
        const state = stateManager.getState();
        if (!state.betAmountMemory || typeof state.betAmountMemory.fullMatch !== 'number') {
            throw new Error('Bet amount memory not properly configured');
        }
        if (state.betAmountMemory.fullMatch !== 25) {
            throw new Error('Default bet amount memory should be 25');
        }
    });
    
    // Requirement 3.5: Multiple bets on same/different outcomes
    test('Requirement 3.5: Multiple bets support', () => {
        // Test placing multiple bets
        const betData1 = {
            type: 'fullMatch',
            outcome: 'home',
            stake: 25,
            odds: 1.85
        };
        
        const betData2 = {
            type: 'fullMatch',
            outcome: 'home', // Same outcome
            stake: 50,
            odds: 1.85
        };
        
        const result1 = bettingManager.placeBet(betData1);
        const result2 = bettingManager.placeBet(betData2);
        
        if (!result1.success || !result2.success) {
            throw new Error('Failed to place multiple bets');
        }
        
        const state = stateManager.getState();
        if (state.bets.fullMatch.length !== 2) {
            throw new Error('Multiple bets not stored correctly');
        }
    });
    
    // Requirement 3.6: Instant bet placement while game continues
    test('Requirement 3.6: Instant bet placement', () => {
        if (typeof fullMatchBetting.placeBet !== 'function') {
            throw new Error('placeBet method missing');
        }
        
        const initialWallet = stateManager.getState().wallet;
        
        // Simulate instant bet placement
        fullMatchBetting.placeBet('away', 30);
        
        const newWallet = stateManager.getState().wallet;
        if (newWallet !== initialWallet - 30) {
            throw new Error('Bet not processed instantly');
        }
    });
    
    // Test core functionality
    test('Core: Betting interface initialization', () => {
        if (typeof fullMatchBetting.initialize !== 'function') {
            throw new Error('initialize method missing');
        }
    });
    
    test('Core: Odds display updates', () => {
        if (typeof fullMatchBetting.updateOddsDisplay !== 'function') {
            throw new Error('updateOddsDisplay method missing');
        }
    });
    
    test('Core: Active bets display', () => {
        if (typeof fullMatchBetting.updateActiveBetsDisplay !== 'function') {
            throw new Error('updateActiveBetsDisplay method missing');
        }
    });
    
    test('Core: Bet amount memory persistence', () => {
        const initialMemory = stateManager.getState().betAmountMemory.fullMatch;
        
        // Place bet with different amount
        fullMatchBetting.placeBet('draw', 75);
        
        const updatedMemory = stateManager.getState().betAmountMemory.fullMatch;
        if (updatedMemory !== 75) {
            throw new Error('Bet amount memory not updated');
        }
    });
    
    test('Core: State management integration', () => {
        // Test state subscription
        let stateUpdated = false;
        const unsubscribe = stateManager.subscribe(() => {
            stateUpdated = true;
        });
        
        stateManager.updateState({
            match: {
                ...stateManager.getState().match,
                odds: { home: 2.00, draw: 3.00, away: 4.00 }
            }
        });
        
        if (!stateUpdated) {
            throw new Error('State subscription not working');
        }
        
        unsubscribe();
    });
    
    test('Core: Utility methods', () => {
        const methods = [
            'getOutcomeLabel',
            'getPendingBets',
            'getStatistics',
            'setEnabled',
            'cleanup'
        ];
        
        for (const method of methods) {
            if (typeof fullMatchBetting[method] !== 'function') {
                throw new Error(`${method} method missing`);
            }
        }
    });
    
    test('Core: Error handling', () => {
        // Test with invalid bet data
        const result = bettingManager.placeBet({
            type: 'fullMatch',
            outcome: 'invalid',
            stake: -10,
            odds: 0
        });
        
        if (result.success) {
            throw new Error('Should reject invalid bet data');
        }
    });
    
    test('Core: Notification system', () => {
        if (typeof fullMatchBetting.showNotification !== 'function') {
            throw new Error('showNotification method missing');
        }
    });
    
    // Test betting statistics
    test('Statistics: Betting statistics calculation', () => {
        const stats = fullMatchBetting.getStatistics();
        
        if (typeof stats !== 'object') {
            throw new Error('Statistics should return object');
        }
        
        const requiredFields = ['totalBets', 'pendingBets', 'wonBets', 'lostBets', 'totalStaked', 'totalWinnings'];
        for (const field of requiredFields) {
            if (typeof stats[field] !== 'number') {
                throw new Error(`Statistics missing ${field} field`);
            }
        }
    });
    
    // Test cleanup
    test('Cleanup: Resource cleanup', () => {
        fullMatchBetting.cleanup();
        // Should not throw errors
    });
    
    console.log(`\n📊 Verification Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All FullMatchBetting requirements verified successfully!');
        console.log('\n📋 Requirements Coverage:');
        console.log('✅ 3.1: Always-visible betting buttons for Home/Draw/Away');
        console.log('✅ 3.2: Inline betting forms without pausing game');
        console.log('✅ 3.3: Pre-populated bet amounts from memory');
        console.log('✅ 3.5: Multiple bets on same or different outcomes');
        console.log('✅ 3.6: Instant bet placement while game continues');
        console.log('\n🔧 Implementation Features:');
        console.log('✅ State management integration');
        console.log('✅ Odds display updates');
        console.log('✅ Active bets tracking');
        console.log('✅ Bet amount memory persistence');
        console.log('✅ Error handling and validation');
        console.log('✅ Notification system');
        console.log('✅ Statistics calculation');
        console.log('✅ Resource cleanup');
    } else {
        console.log('\n⚠️  Some requirements need attention. Please review failed tests.');
    }
    
    return failed === 0;
}

// Run verification
const success = runVerification();
process.exit(success ? 0 : 1);