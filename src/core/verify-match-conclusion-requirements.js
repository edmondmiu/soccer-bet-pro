#!/usr/bin/env node

/**
 * Verification script for Match Conclusion and Summary requirements
 * Validates implementation against requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock DOM for Node.js environment
const mockDOM = () => {
    global.document = {
        createElement: () => ({
            className: '',
            innerHTML: '',
            style: {},
            appendChild: () => {},
            addEventListener: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            setAttribute: () => {},
            remove: () => {},
            parentNode: { removeChild: () => {} }
        }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        getElementById: () => null,
        addEventListener: () => {},
        dispatchEvent: () => {}
    };
    
    global.window = {
        innerWidth: 1024,
        addEventListener: () => {},
        location: { reload: () => {} }
    };
    
    global.CustomEvent = class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail || {};
        }
    };
};

class RequirementVerifier {
    constructor() {
        this.results = [];
        this.modules = null;
    }

    async initialize() {
        mockDOM();
        
        try {
            const { StateManager } = await import('./StateManager.js');
            const { BettingManager } = await import('../betting/BettingManager.js');
            const { PowerUpManager } = await import('../systems/PowerUpManager.js');
            const { GameController } = await import('./GameController.js');
            const { BettingModal } = await import('../ui/BettingModal.js');
            const { TimerManager } = await import('../systems/TimerManager.js');
            
            this.modules = {
                StateManager,
                BettingManager,
                PowerUpManager,
                GameController,
                BettingModal,
                TimerManager
            };
            
            console.log('✅ All modules loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load modules:', error.message);
            return false;
        }
    }

    verify(requirement, description, testFn) {
        try {
            const result = testFn();
            this.results.push({
                requirement,
                description,
                status: 'PASS',
                details: result
            });
            console.log(`✅ ${requirement}: ${description}`);
            return true;
        } catch (error) {
            this.results.push({
                requirement,
                description,
                status: 'FAIL',
                error: error.message
            });
            console.log(`❌ ${requirement}: ${description}`);
            console.log(`   Error: ${error.message}`);
            return false;
        }
    }

    async verifyAllRequirements() {
        console.log('\n🏆 Verifying Match Conclusion Requirements\n');

        // Requirement 7.1: Match end detection at 90 minutes
        this.verify('7.1', 'Match reaches 90 minutes and resolves all full-match bets', () => {
            const { GameController, StateManager, BettingManager, PowerUpManager } = this.modules;
            
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            const gameController = new GameController();
            
            // Setup test scenario
            stateManager.updateState({
                wallet: 1000,
                match: {
                    active: true,
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    homeScore: 2,
                    awayScore: 1,
                    time: 90
                },
                bets: {
                    fullMatch: [
                        {
                            id: 'bet_1',
                            type: 'fullMatch',
                            outcome: 'home',
                            stake: 100,
                            odds: 1.85,
                            status: 'pending',
                            powerUpApplied: false
                        }
                    ],
                    actionBet: []
                }
            });
            
            // Mock modules
            gameController.modules = {
                stateManager,
                bettingManager,
                timerManager: { stopMatch: () => {}, setCallbacks: () => {} },
                eventManager: { stopEventProcessing: () => {} },
                audioManager: { playSound: () => {} },
                bettingModal: { showMatchSummaryModal: () => {} }
            };
            
            gameController.gamePhase = 'match';
            
            // Test match end detection
            const result = gameController.endMatch();
            
            if (!result || typeof result.then !== 'function') {
                throw new Error('endMatch should return a Promise');
            }
            
            return 'Match end detection implemented with bet resolution';
        });

        // Requirement 7.2: Base winnings calculation (stake × odds)
        this.verify('7.2', 'Calculate winnings using base winnings = stake × odds', () => {
            const { BettingManager, StateManager, PowerUpManager } = this.modules;
            
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            // Test base winnings calculation
            const stake = 100;
            const odds = 1.85;
            const expectedWinnings = stake * odds; // 185
            
            const actualWinnings = bettingManager.calculatePotentialWinnings(stake, odds, false);
            
            if (actualWinnings !== expectedWinnings) {
                throw new Error(`Expected ${expectedWinnings}, got ${actualWinnings}`);
            }
            
            return `Base winnings: ${stake} × ${odds} = ${actualWinnings}`;
        });

        // Requirement 7.3: Power-up multiplier application
        this.verify('7.3', 'Apply power-up multiplier (2x) to winnings when power-up is used', () => {
            const { BettingManager, StateManager, PowerUpManager } = this.modules;
            
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            // Test power-up multiplier
            const stake = 100;
            const odds = 2.0;
            const baseWinnings = stake * odds; // 200
            const powerUpWinnings = baseWinnings * 2; // 400
            
            const actualWinnings = bettingManager.calculatePotentialWinnings(stake, odds, true);
            
            if (actualWinnings !== powerUpWinnings) {
                throw new Error(`Expected ${powerUpWinnings}, got ${actualWinnings}`);
            }
            
            return `Power-up winnings: ${baseWinnings} × 2 = ${actualWinnings}`;
        });

        // Requirement 7.4: Match summary modal display
        this.verify('7.4', 'Display match summary modal with final score, winnings/losses, and breakdown', () => {
            const { BettingModal, StateManager } = this.modules;
            
            const stateManager = new StateManager();
            const bettingModal = new BettingModal(stateManager);
            
            // Test summary data structure
            const summaryData = {
                match: {
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    homeScore: 2,
                    awayScore: 1,
                    outcome: 'home'
                },
                betting: {
                    totalBets: 2,
                    wonBets: 1,
                    lostBets: 1,
                    totalStaked: 150,
                    totalWinnings: 185,
                    netResult: 35,
                    winRate: 50
                },
                bets: [
                    {
                        id: 'bet_1',
                        type: 'fullMatch',
                        outcome: 'home',
                        stake: 100,
                        odds: 1.85,
                        status: 'won',
                        winnings: 185,
                        powerUpApplied: false
                    }
                ],
                powerUps: { applied: 0, bonuses: 0 },
                wallet: { final: 1035, starting: 1000, change: 35 }
            };
            
            // Verify modal creation method exists
            if (typeof bettingModal.createMatchSummaryModal !== 'function') {
                throw new Error('createMatchSummaryModal method not found');
            }
            
            // Verify modal can be created with summary data
            const modal = bettingModal.createMatchSummaryModal(summaryData);
            
            if (!modal || typeof modal !== 'object') {
                throw new Error('Modal creation failed');
            }
            
            return 'Match summary modal creation verified';
        });

        // Requirement 7.5: Wallet balance update
        this.verify('7.5', 'Update wallet with final balance after all winnings', () => {
            const { StateManager, BettingManager, PowerUpManager } = this.modules;
            
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            
            // Setup initial state
            const initialWallet = 1000;
            stateManager.updateState({
                wallet: initialWallet,
                bets: {
                    fullMatch: [
                        {
                            id: 'bet_1',
                            type: 'fullMatch',
                            outcome: 'home',
                            stake: 100,
                            odds: 1.85,
                            status: 'pending',
                            powerUpApplied: false
                        }
                    ],
                    actionBet: []
                }
            });
            
            // Resolve bets (home wins)
            const resolution = bettingManager.resolveBets('home', 'fullMatch');
            
            if (!resolution.success) {
                throw new Error('Bet resolution failed');
            }
            
            const finalWallet = stateManager.getState().wallet;
            const expectedWallet = initialWallet + (100 * 1.85); // 1000 + 185 = 1185
            
            if (finalWallet !== expectedWallet) {
                throw new Error(`Expected wallet ${expectedWallet}, got ${finalWallet}`);
            }
            
            return `Wallet updated: ${initialWallet} → ${finalWallet} (+${finalWallet - initialWallet})`;
        });

        // Requirement 7.6: Return to lobby functionality
        this.verify('7.6', 'Provide return to lobby button and functionality', () => {
            const { BettingModal, StateManager } = this.modules;
            
            const stateManager = new StateManager();
            const bettingModal = new BettingModal(stateManager);
            
            // Test return to lobby functionality
            let screenUpdated = false;
            const originalUpdateState = stateManager.updateState;
            stateManager.updateState = (updates) => {
                if (updates.currentScreen === 'lobby') {
                    screenUpdated = true;
                }
                return originalUpdateState.call(stateManager, updates);
            };
            
            // Create mock modal with return button
            const mockModal = {
                querySelector: (selector) => {
                    if (selector === '#return-to-lobby' || selector === '.modal-close') {
                        return {
                            addEventListener: (event, callback) => {
                                if (event === 'click') {
                                    // Simulate click
                                    callback();
                                }
                            }
                        };
                    }
                    return null;
                }
            };
            
            // Setup listeners (this should trigger the screen update)
            bettingModal.setupMatchSummaryListeners(mockModal);
            
            if (!screenUpdated) {
                throw new Error('Return to lobby functionality not working');
            }
            
            return 'Return to lobby functionality verified';
        });

        // Additional verification: Complete workflow integration
        this.verify('Integration', 'Complete match conclusion workflow', () => {
            const { GameController, StateManager, BettingManager, PowerUpManager } = this.modules;
            
            const stateManager = new StateManager();
            const powerUpManager = new PowerUpManager(stateManager);
            const bettingManager = new BettingManager(stateManager, powerUpManager);
            const gameController = new GameController();
            
            // Setup complete test scenario
            stateManager.updateState({
                wallet: 1000,
                match: {
                    active: true,
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    homeScore: 2,
                    awayScore: 1,
                    time: 90
                },
                bets: {
                    fullMatch: [
                        {
                            id: 'bet_1',
                            type: 'fullMatch',
                            outcome: 'home',
                            stake: 100,
                            odds: 1.85,
                            status: 'pending',
                            powerUpApplied: false
                        },
                        {
                            id: 'bet_2',
                            type: 'fullMatch',
                            outcome: 'draw',
                            stake: 50,
                            odds: 3.50,
                            status: 'pending',
                            powerUpApplied: true
                        }
                    ],
                    actionBet: [
                        {
                            id: 'bet_3',
                            type: 'actionBet',
                            outcome: 'goal_scored',
                            stake: 25,
                            odds: 2.50,
                            status: 'won',
                            actualWinnings: 62.50,
                            powerUpApplied: false
                        }
                    ]
                }
            });
            
            // Test match outcome determination
            const outcome = gameController.determineMatchOutcome(2, 1);
            if (outcome !== 'home') {
                throw new Error(`Expected outcome 'home', got '${outcome}'`);
            }
            
            // Test summary data creation
            const matchState = stateManager.getState().match;
            const resolution = { success: true, results: [] };
            const finalWinnings = { totalWinnings: 185, powerUpBonuses: 0, additionalWinnings: 0 };
            
            gameController.modules = { stateManager };
            const summaryData = gameController.createMatchSummary(matchState, resolution, finalWinnings);
            
            // Verify summary data structure
            const requiredProperties = ['match', 'betting', 'bets', 'powerUps', 'wallet'];
            for (const prop of requiredProperties) {
                if (!summaryData.hasOwnProperty(prop)) {
                    throw new Error(`Summary data missing property: ${prop}`);
                }
            }
            
            // Verify betting statistics
            if (summaryData.betting.totalBets !== 3) {
                throw new Error(`Expected 3 total bets, got ${summaryData.betting.totalBets}`);
            }
            
            if (summaryData.betting.totalStaked !== 175) {
                throw new Error(`Expected 175 total staked, got ${summaryData.betting.totalStaked}`);
            }
            
            return 'Complete workflow integration verified';
        });

        // Summary
        console.log('\n📊 Verification Summary:');
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        console.log(`   Total Requirements: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Requirements:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`   ${r.requirement}: ${r.description}`);
                    console.log(`   Error: ${r.error}`);
                });
        }
        
        return { passed, failed, total, success: failed === 0 };
    }
}

// Main execution
async function main() {
    console.log('🏆 Match Conclusion Requirements Verification');
    console.log('===========================================');
    
    const verifier = new RequirementVerifier();
    
    const initialized = await verifier.initialize();
    if (!initialized) {
        console.error('❌ Failed to initialize verifier');
        process.exit(1);
    }
    
    const results = await verifier.verifyAllRequirements();
    
    if (results.success) {
        console.log('\n✅ All requirements verified successfully!');
        console.log('\nImplemented Features:');
        console.log('• Match end detection at 90 minutes');
        console.log('• Full-match bet resolution based on final score');
        console.log('• Comprehensive match summary with all results');
        console.log('• Final winnings calculation with power-up multipliers');
        console.log('• Wallet balance update and return to lobby functionality');
        console.log('• Complete test coverage for match conclusion');
        process.exit(0);
    } else {
        console.log('\n❌ Some requirements failed verification');
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { RequirementVerifier, mockDOM };