/**
 * Game Logic Pause Integration Tests
 * 
 * Tests the integration between the pause system and game logic tick system.
 * Verifies that game state is preserved during pause and resumes correctly.
 */

import { tick, startMatch, processMatchEvent } from '../scripts/gameLogic.js';
import { getCurrentState, updateState, resetState, updatePauseState } from '../scripts/gameState.js';
import { pauseManager } from '../scripts/pauseManager.js';

/**
 * Simple test framework for browser-based testing
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Game Logic Pause Integration Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                // Reset state before each test
                resetState();
                
                // Set up a basic match state for testing
                updateState({
                    match: {
                        active: true,
                        time: 10,
                        homeScore: 1,
                        awayScore: 0,
                        homeTeam: 'Test Home',
                        awayTeam: 'Test Away',
                        timeline: [
                            { time: 15, type: 'GOAL', team: 'HOME', description: 'Test goal' },
                            { time: 20, type: 'COMMENTARY', description: 'Test commentary' }
                        ],
                        odds: { home: 1.85, draw: 3.50, away: 4.20 },
                        initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
                        initialWallet: 1000.00
                    }
                });
                
                await testFn();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.error(`❌ ${name}: ${error.message}`);
                this.failed++;
            } finally {
                // Clean up any timeouts
                if (pauseManager.currentTimeoutId) {
                    clearTimeout(pauseManager.currentTimeoutId);
                    pauseManager.currentTimeoutId = null;
                }
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }

    assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message}\nExpected: true\nActual: ${condition}`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message}\nExpected: false\nActual: ${condition}`);
        }
    }
}

// Mock window functions that might be called during tests
if (typeof window === 'undefined') {
    global.window = {
        addEventToFeed: () => {},
        renderMatchTimeAndScore: () => {},
        render: () => {},
        showMultiChoiceActionBet: () => {},
        resolveBets: () => {},
        renderOdds: () => {},
        renderEndGameSummary: () => {},
        triggerWinAnimation: () => {}
    };
}

// Mock DOM elements
if (typeof document === 'undefined') {
    global.document = {
        getElementById: () => ({
            textContent: '',
            innerHTML: '',
            classList: { remove: () => {} }
        })
    };
}

const runner = new TestRunner();
// Test: tick should process normally when game is not paused
runner.test('tick should process normally when game is not paused', () => {
    const initialState = getCurrentState();
    const initialTime = initialState.match.time;
    
    // Ensure game is not paused
    runner.assertFalse(initialState.pause.active, 'Game should not be paused initially');
    
    // Call tick
    tick();
    
    // Verify time advanced
    const newState = getCurrentState();
    runner.assertEqual(newState.match.time, initialTime + 1, 'Time should advance by 1');
});

// Test: tick should skip processing when game is paused
runner.test('tick should skip processing when game is paused', () => {
    const initialState = getCurrentState();
    const initialTime = initialState.match.time;
    const initialScore = { home: initialState.match.homeScore, away: initialState.match.awayScore };
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Verify game is paused
    const pausedState = getCurrentState();
    runner.assertTrue(pausedState.pause.active, 'Game should be paused');
    
    // Call tick
    tick();
    
    // Verify state was preserved (no changes)
    const afterTickState = getCurrentState();
    runner.assertEqual(afterTickState.match.time, initialTime, 'Time should not advance during pause');
    runner.assertEqual(afterTickState.match.homeScore, initialScore.home, 'Home score should not change during pause');
    runner.assertEqual(afterTickState.match.awayScore, initialScore.away, 'Away score should not change during pause');
});

// Test: tick should resume processing after game is unpaused
runner.test('tick should resume processing after game is unpaused', () => {
    const initialState = getCurrentState();
    const initialTime = initialState.match.time;
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick while paused - should not advance
    tick();
    let pausedState = getCurrentState();
    runner.assertEqual(pausedState.match.time, initialTime, 'Time should not advance while paused');
    
    // Resume the game
    pauseManager.resumeGame();
    
    // Call tick after resume - should advance
    tick();
    const resumedState = getCurrentState();
    runner.assertEqual(resumedState.match.time, initialTime + 1, 'Time should advance after resume');
});

// Test: timeline events should not be processed during pause
runner.test('timeline events should not be processed during pause', () => {
    // Set up state where an event should trigger at current time
    updateState({
        match: {
            ...getCurrentState().match,
            time: 14, // One tick before the goal event at time 15
            timeline: [
                { time: 15, type: 'GOAL', team: 'HOME', description: 'Test goal' }
            ]
        }
    });
    
    const initialScore = getCurrentState().match.homeScore;
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick - this would normally advance time to 15 and trigger the goal
    tick();
    
    // Verify time didn't advance and goal didn't happen
    const pausedState = getCurrentState();
    runner.assertEqual(pausedState.match.time, 14, 'Time should not advance during pause');
    runner.assertEqual(pausedState.match.homeScore, initialScore, 'Score should not change during pause');
});

// Test: events should process normally after resume
runner.test('events should process normally after resume', () => {
    // Set up state where an event should trigger
    updateState({
        match: {
            ...getCurrentState().match,
            time: 14,
            timeline: [
                { time: 15, type: 'GOAL', team: 'HOME', description: 'Test goal' }
            ]
        }
    });
    
    const initialScore = getCurrentState().match.homeScore;
    
    // Pause and tick (no processing)
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    tick();
    
    // Resume and tick (should process)
    pauseManager.resumeGame();
    tick();
    
    // Verify event was processed
    const resumedState = getCurrentState();
    runner.assertEqual(resumedState.match.time, 15, 'Time should advance to 15 after resume');
    runner.assertEqual(resumedState.match.homeScore, initialScore + 1, 'Goal should have been scored after resume');
});

// Test: odds should not update during pause
runner.test('odds should not update during pause', () => {
    // Set up state where odds would normally update (every 5 minutes)
    updateState({
        match: {
            ...getCurrentState().match,
            time: 19, // One tick before time 20 (divisible by 5)
            homeScore: 2,
            awayScore: 0
        }
    });
    
    const initialOdds = getCurrentState().match.odds;
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick - would normally advance to time 20 and update odds
    tick();
    
    // Verify odds didn't change
    const pausedState = getCurrentState();
    runner.assertEqual(pausedState.match.odds, initialOdds, 'Odds should not change during pause');
});

// Test: odds should update normally after resume
runner.test('odds should update normally after resume', () => {
    // Set up state for odds update
    updateState({
        match: {
            ...getCurrentState().match,
            time: 19,
            homeScore: 2,
            awayScore: 0
        }
    });
    
    const initialOdds = JSON.parse(JSON.stringify(getCurrentState().match.odds));
    
    // Pause, tick, resume, tick
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    tick();
    pauseManager.resumeGame();
    tick();
    
    // Verify odds were updated after resume
    const resumedState = getCurrentState();
    runner.assertEqual(resumedState.match.time, 20, 'Time should advance to 20 after resume');
    
    // Check that odds changed (they should be different due to score difference)
    const oddsChanged = JSON.stringify(resumedState.match.odds) !== JSON.stringify(initialOdds);
    runner.assertTrue(oddsChanged, 'Odds should have changed after resume');
});

// Test: match should not end during pause even at 90 minutes
runner.test('match should not end during pause even at 90 minutes', () => {
    // Set up state at 89 minutes
    updateState({
        match: {
            ...getCurrentState().match,
            time: 89,
            active: true
        }
    });
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick - would normally advance to 90 and end match
    tick();
    
    // Verify match is still active and time didn't advance
    const pausedState = getCurrentState();
    runner.assertEqual(pausedState.match.time, 89, 'Time should not advance during pause');
    runner.assertTrue(pausedState.match.active, 'Match should still be active during pause');
});

// Test: match should end normally after resume at 90 minutes
runner.test('match should end normally after resume at 90 minutes', () => {
    // Set up state at 89 minutes
    updateState({
        match: {
            ...getCurrentState().match,
            time: 89,
            active: true
        }
    });
    
    // Pause, tick, resume, tick
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    tick();
    pauseManager.resumeGame();
    tick();
    
    // Verify match ended
    const resumedState = getCurrentState();
    runner.assertEqual(resumedState.match.time, 90, 'Time should advance to 90 after resume');
    runner.assertFalse(resumedState.match.active, 'Match should end at 90 minutes');
});

// Test: renderMatchTimeAndScore should still be called during pause
runner.test('renderMatchTimeAndScore should still be called during pause', () => {
    let renderCalled = false;
    if (typeof window !== 'undefined') {
        window.renderMatchTimeAndScore = () => {
            renderCalled = true;
        };
    } else {
        global.window.renderMatchTimeAndScore = () => {
            renderCalled = true;
        };
    }
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick
    tick();
    
    // Verify render was called even during pause
    runner.assertTrue(renderCalled, 'renderMatchTimeAndScore should be called during pause');
});

// Test: render errors during pause should not crash the game
runner.test('render errors during pause should not crash the game', () => {
    // Set up a render function that throws an error
    if (typeof window !== 'undefined') {
        window.renderMatchTimeAndScore = () => {
            throw new Error('Render error');
        };
    } else {
        global.window.renderMatchTimeAndScore = () => {
            throw new Error('Render error');
        };
    }
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick - should not throw despite render error
    let errorThrown = false;
    try {
        tick();
    } catch (error) {
        errorThrown = true;
    }
    runner.assertFalse(errorThrown, 'tick() should not throw error even when render fails');
});

// Test: all match state should be preserved during pause
runner.test('all match state should be preserved during pause', () => {
    const initialState = getCurrentState();
    const matchState = {
        time: initialState.match.time,
        homeScore: initialState.match.homeScore,
        awayScore: initialState.match.awayScore,
        homeTeam: initialState.match.homeTeam,
        awayTeam: initialState.match.awayTeam,
        odds: { ...initialState.match.odds },
        active: initialState.match.active
    };
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick multiple times
    tick();
    tick();
    tick();
    
    // Verify all state is preserved
    const pausedState = getCurrentState();
    runner.assertEqual(pausedState.match.time, matchState.time, 'Time should be preserved');
    runner.assertEqual(pausedState.match.homeScore, matchState.homeScore, 'Home score should be preserved');
    runner.assertEqual(pausedState.match.awayScore, matchState.awayScore, 'Away score should be preserved');
    runner.assertEqual(pausedState.match.homeTeam, matchState.homeTeam, 'Home team should be preserved');
    runner.assertEqual(pausedState.match.awayTeam, matchState.awayTeam, 'Away team should be preserved');
    runner.assertEqual(pausedState.match.odds, matchState.odds, 'Odds should be preserved');
    runner.assertEqual(pausedState.match.active, matchState.active, 'Active state should be preserved');
});

// Test: state should resume correctly from exact pause point
runner.test('state should resume correctly from exact pause point', () => {
    const initialTime = getCurrentState().match.time;
    
    // Pause the game
    pauseManager.pauseGame('BETTING_OPPORTUNITY');
    
    // Call tick multiple times during pause
    tick();
    tick();
    tick();
    
    // Resume the game
    pauseManager.resumeGame();
    
    // Call tick once after resume
    tick();
    
    // Verify time advanced by exactly 1 from the pause point
    const resumedState = getCurrentState();
    runner.assertEqual(resumedState.match.time, initialTime + 1, 'Time should advance by exactly 1 from pause point');
});

// Run all tests
runner.run().then(success => {
    if (!success) {
        process.exit(1);
    }
});