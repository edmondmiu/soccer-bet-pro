#!/usr/bin/env node

/**
 * Event Resolution Requirements Verification
 * Verifies implementation against task requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

// Mock DOM environment for Node.js
global.document = {
    dispatchEvent: () => {},
    addEventListener: () => {}
};
global.CustomEvent = function(type, options) {
    this.type = type;
    this.detail = options?.detail;
};

import { EventManager } from './EventManager.js';
import { BettingManager } from '../betting/BettingManager.js';

// Mock StateManager
class MockStateManager {
    constructor() {
        this.state = {
            wallet: 1000,
            match: {
                time: 0,
                homeScore: 0,
                awayScore: 0,
                odds: { home: 1.85, draw: 3.50, away: 4.20 },
                timeline: [],
                eventFeed: []
            },
            bets: {
                fullMatch: [],
                actionBet: []
            },
            powerUp: { held: null, applied: false }
        };
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    updateState(updates) {
        if (updates.match) {
            this.state.match = { ...this.state.match, ...updates.match };
        }
        if (updates.bets) {
            this.state.bets = { ...this.state.bets, ...updates.bets };
        }
        if (updates.wallet !== undefined) {
            this.state.wallet = updates.wallet;
        }
    }

    subscribe() {}
}

// Mock PowerUpManager
class MockPowerUpManager {
    awardPowerUp() {
        return { success: true, powerUp: { type: '2x_multiplier' } };
    }
}

class RequirementsVerifier {
    constructor() {
        this.results = [];
        this.setupTest();
    }

    setupTest() {
        this.mockStateManager = new MockStateManager();
        this.mockPowerUpManager = new MockPowerUpManager();
        this.eventManager = new EventManager(this.mockStateManager);
        this.bettingManager = new BettingManager(this.mockStateManager, this.mockPowerUpManager);
    }

    verify(requirement, description, testFn) {
        try {
            const result = testFn();
            if (result) {
                this.results.push({
                    requirement,
                    description,
                    status: 'PASS',
                    details: typeof result === 'string' ? result : 'Requirement satisfied'
                });
                console.log(`✅ ${requirement}: ${description}`);
            } else {
                throw new Error('Test returned false');
            }
        } catch (error) {
            this.results.push({
                requirement,
                description,
                status: 'FAIL',
                details: error.message
            });
            console.log(`❌ ${requirement}: ${description}`);
            console.log(`   Error: ${error.message}`);
        }
    }

    async runVerification() {
        console.log('🔍 Verifying Event Resolution System Requirements...\n');

        // Requirement 6.1: Action bet resolution logic 4 minutes after events
        this.verify('6.1', 'Action bet resolution logic 4 minutes after events', () => {
            const actionBetEvent = {
                id: 'test_action_bet',
                type: 'ACTION_BET',
                time: 30,
                description: 'Corner kick opportunity',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Goal from corner', odds: 4.5 },
                        { outcome: 'cleared', description: 'Corner cleared', odds: 1.6 }
                    ]
                }
            };

            // Test scheduling resolution
            this.eventManager.scheduleActionBetResolution(actionBetEvent);
            
            const state = this.mockStateManager.getState();
            const resolutionEvent = state.match.timeline.find(event => 
                event.type === 'RESOLUTION' && 
                event.data.originalEventId === actionBetEvent.id
            );

            if (!resolutionEvent) {
                throw new Error('Resolution event not scheduled');
            }

            if (resolutionEvent.time !== 34) { // 30 + 4 minutes
                throw new Error(`Resolution scheduled at ${resolutionEvent.time} minutes, expected 34`);
            }

            return 'Action bet resolution correctly scheduled 4 minutes after event';
        });

        // Requirement 6.2: Outcome determination and payout processing
        this.verify('6.2', 'Outcome determination and payout processing', () => {
            // Place a bet first
            const betData = {
                type: 'actionBet',
                outcome: 'goal',
                stake: 100,
                odds: 4.5,
                eventId: 'payout_test'
            };

            const betResult = this.bettingManager.placeBet(betData);
            if (!betResult.success) {
                throw new Error('Failed to place test bet');
            }

            // Create action bet event
            const actionBetEvent = {
                id: 'payout_test',
                type: 'ACTION_BET',
                time: 45,
                description: 'Penalty kick',
                data: {
                    choices: [
                        { outcome: 'goal', description: 'Penalty scored', odds: 4.5 },
                        { outcome: 'save', description: 'Penalty saved', odds: 2.0 }
                    ]
                }
            };

            const resolutionEvent = {
                id: 'resolution_payout_test',
                type: 'RESOLUTION',
                time: 49,
                data: {
                    originalEventId: 'payout_test',
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            // Track resolution events
            let resolutionTriggered = false;
            let resolutionData = null;
            
            this.eventManager.triggerEvent = (eventType, data) => {
                if (eventType === 'actionBetResolution') {
                    resolutionTriggered = true;
                    resolutionData = data;
                }
            };

            // Process resolution
            this.eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

            if (!resolutionTriggered) {
                throw new Error('Resolution event not triggered');
            }

            if (!resolutionData.winningOutcome) {
                throw new Error('No winning outcome determined');
            }

            // Verify outcome is valid
            const validOutcomes = actionBetEvent.data.choices.map(c => c.outcome);
            if (!validOutcomes.includes(resolutionData.winningOutcome)) {
                throw new Error('Invalid outcome determined');
            }

            // Test payout processing
            const payoutResult = this.bettingManager.resolveBets(
                resolutionData.winningOutcome, 
                'actionBet', 
                'payout_test'
            );

            if (!payoutResult.success) {
                throw new Error('Payout processing failed');
            }

            return 'Outcome determination and payout processing working correctly';
        });

        // Requirement 6.3: Goal event processing with score and odds updates
        this.verify('6.3', 'Goal event processing with score and odds updates', () => {
            // Reset state for clean test
            this.setupTest();
            
            const initialState = this.mockStateManager.getState();
            const initialOdds = { ...initialState.match.odds };

            const goalEvent = {
                id: 'test_goal',
                type: 'GOAL',
                time: 25,
                description: 'Goal!',
                data: { 
                    team: 'home', 
                    player: 'Test Player',
                    goalType: 'header'
                }
            };

            this.eventManager.processGoalEvent(goalEvent);
            
            const newState = this.mockStateManager.getState();
            
            // Verify score update
            if (newState.match.homeScore !== 1) {
                throw new Error(`Home score not updated, expected 1, got ${newState.match.homeScore}`);
            }

            if (newState.match.awayScore !== 0) {
                throw new Error(`Away score incorrect, expected 0, got ${newState.match.awayScore}`);
            }

            // Verify odds update
            if (newState.match.odds.home >= initialOdds.home) {
                throw new Error('Home odds should decrease after home team scores');
            }

            if (newState.match.odds.away <= initialOdds.away) {
                throw new Error('Away odds should increase after home team scores');
            }

            return 'Goal events correctly update score and recalculate odds';
        });

        // Requirement 6.4: Event feed updates with results
        this.verify('6.4', 'Event feed updates with results', () => {
            this.setupTest();

            // Test action bet event feed update
            const actionBetEvent = {
                id: 'feed_test_action',
                type: 'ACTION_BET',
                time: 40,
                description: 'Free kick opportunity',
                data: {
                    choices: [{ outcome: 'goal', description: 'Direct goal', odds: 5.0 }]
                }
            };

            this.eventManager.processActionBetEvent(actionBetEvent);

            let state = this.mockStateManager.getState();
            let feedEntry = state.match.eventFeed.find(entry => entry.id === actionBetEvent.id);

            if (!feedEntry) {
                throw new Error('Action bet event not added to feed');
            }

            if (!feedEntry.description.includes('🎯')) {
                throw new Error('Action bet event missing betting indicator');
            }

            // Test goal event feed update
            const goalEvent = {
                id: 'feed_test_goal',
                type: 'GOAL',
                time: 50,
                description: 'Goal!',
                data: { team: 'away', player: 'Away Player' }
            };

            this.eventManager.processGoalEvent(goalEvent);

            state = this.mockStateManager.getState();
            feedEntry = state.match.eventFeed.find(entry => entry.id === goalEvent.id);

            if (!feedEntry) {
                throw new Error('Goal event not added to feed');
            }

            if (!feedEntry.description.includes('⚽')) {
                throw new Error('Goal event missing goal indicator');
            }

            if (!feedEntry.description.includes('(0-1)')) {
                throw new Error('Goal event missing score update');
            }

            // Test resolution event feed update
            const resolutionEvent = {
                id: 'resolution_feed_test',
                type: 'RESOLUTION',
                time: 44,
                data: {
                    originalEventId: 'feed_test_action',
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };

            this.eventManager.resolveActionBet(actionBetEvent, resolutionEvent);

            state = this.mockStateManager.getState();
            feedEntry = state.match.eventFeed.find(entry => entry.id === resolutionEvent.id);

            if (!feedEntry) {
                throw new Error('Resolution event not added to feed');
            }

            if (!feedEntry.description.includes('✅')) {
                throw new Error('Resolution event missing resolution indicator');
            }

            return 'Event feed correctly updated with all event types and results';
        });

        // Requirement 6.5: Commentary event display without betting impact
        this.verify('6.5', 'Commentary event display without betting impact', () => {
            this.setupTest();

            const initialState = this.mockStateManager.getState();
            
            const commentaryEvent = {
                id: 'commentary_test',
                type: 'COMMENTARY',
                time: 35,
                description: 'Good passing move in midfield',
                data: { 
                    category: 'possession',
                    intensity: 'medium'
                }
            };

            // Track commentary events
            let commentaryTriggered = false;
            let commentaryData = null;
            
            this.eventManager.triggerEvent = (eventType, data) => {
                if (eventType === 'commentary') {
                    commentaryTriggered = true;
                    commentaryData = data;
                }
            };

            this.eventManager.processCommentaryEvent(commentaryEvent);

            // Verify commentary event was triggered
            if (!commentaryTriggered) {
                throw new Error('Commentary event not triggered');
            }

            if (!commentaryData || commentaryData.description !== commentaryEvent.description) {
                throw new Error('Commentary data not properly passed');
            }

            // Verify no betting impact (match state unchanged)
            const newState = this.mockStateManager.getState();
            
            if (newState.match.homeScore !== initialState.match.homeScore) {
                throw new Error('Commentary event affected home score');
            }

            if (newState.match.awayScore !== initialState.match.awayScore) {
                throw new Error('Commentary event affected away score');
            }

            if (JSON.stringify(newState.match.odds) !== JSON.stringify(initialState.match.odds)) {
                throw new Error('Commentary event affected odds');
            }

            if (newState.wallet !== initialState.wallet) {
                throw new Error('Commentary event affected wallet');
            }

            return 'Commentary events display correctly without affecting betting or match state';
        });

        // Additional verification: Resolution timing accuracy
        this.verify('TIMING', 'Resolution timing accuracy and event processing order', () => {
            this.setupTest();

            // Create timeline with events at different times
            const timeline = [
                { id: 'event1', type: 'GOAL', time: 15, data: { team: 'home', player: 'Player1' } },
                { id: 'event2', type: 'ACTION_BET', time: 25, data: { choices: [] } },
                { id: 'event3', type: 'RESOLUTION', time: 29, data: { resolutionType: 'actionBet' } },
                { id: 'event4', type: 'COMMENTARY', time: 35, data: { category: 'possession' } }
            ];

            this.mockStateManager.updateState({
                match: {
                    ...this.mockStateManager.getState().match,
                    timeline: timeline,
                    time: 40 // Current match time
                }
            });

            const processedOrder = [];
            const originalProcessEvent = this.eventManager.processEvent;
            this.eventManager.processEvent = function(event) {
                processedOrder.push(event.time);
                return originalProcessEvent.call(this, event);
            };

            this.eventManager.checkForEvents();

            // Verify all events processed in correct order
            if (processedOrder.length !== 4) {
                throw new Error(`Expected 4 events processed, got ${processedOrder.length}`);
            }

            const expectedOrder = [15, 25, 29, 35];
            for (let i = 0; i < expectedOrder.length; i++) {
                if (processedOrder[i] !== expectedOrder[i]) {
                    throw new Error(`Event processing order incorrect at index ${i}: expected ${expectedOrder[i]}, got ${processedOrder[i]}`);
                }
            }

            return 'Events processed in correct chronological order';
        });

        // Summary
        console.log('\n📊 Requirements Verification Summary:');
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`   Total Requirements: ${this.results.length}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Some requirements not met. See details above.');
            return false;
        } else {
            console.log('\n✅ All event resolution requirements verified successfully!');
            return true;
        }
    }
}

// Run verification
async function runVerification() {
    const verifier = new RequirementsVerifier();
    const success = await verifier.runVerification();
    
    if (!success) {
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runVerification();
} else {
    // Also run if imported as main module
    runVerification();
}

export { RequirementsVerifier };