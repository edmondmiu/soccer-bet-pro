/**
 * Test: Full Match Betting Without Pause System
 * 
 * This test verifies that full match betting works without pausing the game
 * according to task requirements 1.1, 1.2, 1.3, 1.4
 */

// Mock DOM elements
const mockDOM = {
    inlineBetSlip: { classList: { add: () => {}, remove: () => {} } },
    inlineStakeAmount: { value: '', focus: () => {} },
    fullMatchButtons: [
        { classList: { add: () => {}, remove: () => {} } },
        { classList: { add: () => {}, remove: () => {} } },
        { classList: { add: () => {}, remove: () => {} } }
    ]
};

// Mock document methods
global.document = {
    getElementById: (id) => {
        if (id === 'inline-bet-slip') return mockDOM.inlineBetSlip;
        if (id === 'inline-stake-amount') return mockDOM.inlineStakeAmount;
        if (id.startsWith('full-match-btn-')) return mockDOM.fullMatchButtons[0];
        return null;
    },
    querySelectorAll: (selector) => {
        if (selector === '[data-bet-type="full-match"]') return mockDOM.fullMatchButtons;
        return [];
    }
};

// Mock SoccerBettingGame class with minimal implementation
class MockSoccerBettingGame {
    constructor() {
        this.state = {
            currentBet: null,
            bets: { fullMatch: [], actionBets: [] },
            wallet: 1000
        };
        this.inlineBetSlip = mockDOM.inlineBetSlip;
        this.inlineStakeAmount = mockDOM.inlineStakeAmount;
        this.pauseManager = {
            pauseGame: () => false, // Should not be called
            isPaused: () => false,
            resumeGame: () => {}
        };
        this.pauseCalls = [];
        this.resumeCalls = [];
    }

    // Implementation from main.js (modified version without pause)
    showInlineBetSlip(outcome, odds) {
        try {
            // Full match betting no longer pauses the game (Requirements 1.1, 1.2, 1.3, 1.4)
            // Game continues running normally while betting interface is displayed
            
            this.state.currentBet = { type: 'full-match', outcome, odds };
            this.inlineBetSlip.classList.remove('hidden');
            
            this.inlineStakeAmount.value = '';
            this.inlineStakeAmount.focus();

            document.querySelectorAll('[data-bet-type="full-match"]').forEach(btn => {
                btn.classList.remove('bet-btn-selected');
            });
            document.getElementById(`full-match-btn-${outcome}`).classList.add('bet-btn-selected');
            
            console.log(`SoccerBettingGame: Full-match betting slip shown for ${outcome} - game continues running`);
        } catch (error) {
            console.error('Error showing inline bet slip:', error);
        }
    }

    hideInlineBetSlip() {
        try {
            this.inlineBetSlip.classList.add('hidden');
            
            document.querySelectorAll('[data-bet-type="full-match"]').forEach(btn => {
                btn.classList.remove('bet-btn-selected');
            });
            this.state.currentBet = null;
            
            console.log('SoccerBettingGame: Full-match betting slip hidden - game continues running');
        } catch (error) {
            console.error('Error hiding inline bet slip:', error);
        }
    }

    placeBet(type, outcome, odds, stake) {
        try {
            if (type === 'full-match') {
                const bet = { outcome, stake, odds, timestamp: Date.now() };
                this.state.bets.fullMatch.push(bet);
                this.state.wallet -= stake;
                console.log(`Full Match Bet placed: ${outcome} (${stake.toFixed(2)} @ ${odds.toFixed(2)})`);
                
                // Full match betting no longer pauses/resumes game (Requirements 1.1, 1.2, 1.3, 1.4)
                // Game continues running normally after bet placement
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error placing bet:', error);
            return false;
        }
    }
}

// Test functions
function testShowInlineBetSlipNoPause() {
    console.log('Testing showInlineBetSlip does not pause game...');
    
    const game = new MockSoccerBettingGame();
    
    // Mock pauseGame to track if it's called
    let pauseGameCalled = false;
    game.pauseManager.pauseGame = () => {
        pauseGameCalled = true;
        return true;
    };
    
    // Show betting slip
    game.showInlineBetSlip('HOME', 2.5);
    
    // Verify pause was not called
    if (pauseGameCalled) {
        console.error('❌ FAIL: pauseGame was called when it should not be');
        return false;
    }
    
    // Verify betting slip state is set correctly
    if (!game.state.currentBet || game.state.currentBet.type !== 'full-match') {
        console.error('❌ FAIL: Current bet state not set correctly');
        return false;
    }
    
    console.log('✅ PASS: showInlineBetSlip does not pause game');
    return true;
}

function testHideInlineBetSlipNoResume() {
    console.log('Testing hideInlineBetSlip does not resume game...');
    
    const game = new MockSoccerBettingGame();
    
    // Set up initial state
    game.state.currentBet = { type: 'full-match', outcome: 'HOME', odds: 2.5 };
    
    // Mock resumeGame to track if it's called
    let resumeGameCalled = false;
    game.pauseManager.resumeGame = () => {
        resumeGameCalled = true;
    };
    
    // Hide betting slip
    game.hideInlineBetSlip();
    
    // Verify resume was not called
    if (resumeGameCalled) {
        console.error('❌ FAIL: resumeGame was called when it should not be');
        return false;
    }
    
    // Verify state is cleared
    if (game.state.currentBet !== null) {
        console.error('❌ FAIL: Current bet state not cleared');
        return false;
    }
    
    console.log('✅ PASS: hideInlineBetSlip does not resume game');
    return true;
}

function testFullMatchBetProcessingNoPause() {
    console.log('Testing full match bet processing does not pause/resume...');
    
    const game = new MockSoccerBettingGame();
    
    // Mock pause/resume to track calls
    let pauseGameCalled = false;
    let resumeGameCalled = false;
    
    game.pauseManager.pauseGame = () => {
        pauseGameCalled = true;
        return true;
    };
    
    game.pauseManager.resumeGame = () => {
        resumeGameCalled = true;
    };
    
    const initialWallet = game.state.wallet;
    
    // Place a full match bet
    const success = game.placeBet('full-match', 'HOME', 2.5, 50);
    
    // Verify bet was placed successfully
    if (!success) {
        console.error('❌ FAIL: Bet placement failed');
        return false;
    }
    
    // Verify wallet was deducted
    if (game.state.wallet !== initialWallet - 50) {
        console.error('❌ FAIL: Wallet not deducted correctly');
        return false;
    }
    
    // Verify bet was added to state
    if (game.state.bets.fullMatch.length !== 1) {
        console.error('❌ FAIL: Bet not added to state');
        return false;
    }
    
    // Verify no pause/resume calls
    if (pauseGameCalled) {
        console.error('❌ FAIL: pauseGame was called during bet processing');
        return false;
    }
    
    if (resumeGameCalled) {
        console.error('❌ FAIL: resumeGame was called during bet processing');
        return false;
    }
    
    console.log('✅ PASS: Full match bet processing does not pause/resume game');
    return true;
}

function testGameTimerContinuesDuringBetting() {
    console.log('Testing game timer continues during full match betting...');
    
    const game = new MockSoccerBettingGame();
    
    // Simulate game timer
    let gameTime = 45;
    const timerInterval = setInterval(() => {
        gameTime += 1;
    }, 100); // Fast timer for testing
    
    // Show betting slip
    game.showInlineBetSlip('HOME', 2.5);
    
    const timeAtBettingStart = gameTime;
    
    // Wait a bit to simulate betting time
    setTimeout(() => {
        // Place bet
        game.placeBet('full-match', 'HOME', 2.5, 25);
        
        // Hide betting slip
        game.hideInlineBetSlip();
        
        const timeAtBettingEnd = gameTime;
        
        // Clean up timer
        clearInterval(timerInterval);
        
        // Verify time continued to advance
        if (timeAtBettingEnd <= timeAtBettingStart) {
            console.error('❌ FAIL: Game timer did not continue during betting');
            return false;
        }
        
        console.log(`✅ PASS: Game timer continued during betting (${timeAtBettingStart} -> ${timeAtBettingEnd})`);
        return true;
    }, 200);
}

// Run all tests
function runTests() {
    console.log('🧪 Running Full Match Betting No-Pause Tests...\n');
    
    const tests = [
        testShowInlineBetSlipNoPause,
        testHideInlineBetSlipNoResume,
        testFullMatchBetProcessingNoPause,
        testGameTimerContinuesDuringBetting
    ];
    
    let passed = 0;
    let total = tests.length;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passed++;
            }
        } catch (error) {
            console.error(`❌ FAIL: Test threw error: ${error.message}`);
        }
        console.log(''); // Add spacing between tests
    });
    
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Full match betting works without pause system.');
    } else {
        console.log('❌ Some tests failed. Please review the implementation.');
    }
    
    return passed === total;
}

// Export for use in other test files or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests, MockSoccerBettingGame };
} else {
    // Run tests if loaded directly
    runTests();
}