/**
 * GameController - Main game orchestrator that manages the complete game flow
 * Coordinates between all modules and handles match lifecycle management
 */

import { StateManager } from './StateManager.js';
import { EventManager } from './EventManager.js';
import { UIManager } from '../ui/UIManager.js';
import { BettingManager } from '../betting/BettingManager.js';
import { FullMatchBetting } from '../betting/FullMatchBetting.js';
import { ActionBetting } from '../betting/ActionBetting.js';
import { TimerManager } from '../systems/TimerManager.js';
import { PowerUpManager } from '../systems/PowerUpManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { LobbyScreen } from '../ui/LobbyScreen.js';
import { MatchScreen } from '../ui/MatchScreen.js';
import { BettingModal } from '../ui/BettingModal.js';
import { OddsCalculator } from '../utils/OddsCalculator.js';

export class GameController {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.currentMatch = null;
        this.gamePhase = 'lobby'; // 'lobby', 'match', 'paused', 'ended'
        this.errorRecoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        
        // Event listeners storage for cleanup
        this.eventListeners = new Map();
        
        // Module initialization order (dependencies first)
        this.initializationOrder = [
            'stateManager',
            'timerManager',
            'audioManager',
            'powerUpManager',
            'oddsCalculator',
            'bettingManager',
            'eventManager',
            'fullMatchBetting',
            'actionBetting',
            'uiManager',
            'lobbyScreen',
            'matchScreen',
            'bettingModal'
        ];
    }

    /**
     * Initialize the game controller and all modules
     */
    async initialize() {
        try {
            console.log('GameController: Starting initialization...');
            
            // Initialize modules in dependency order
            await this.initializeModules();
            
            // Setup inter-module connections
            this.setupModuleConnections();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            
            this.isInitialized = true;
            this.gamePhase = 'lobby';
            
            console.log('GameController: Initialization complete');
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Show initial screen
            this.showLobby();
            
            return { success: true };
        } catch (error) {
            console.error('GameController initialization failed:', error);
            return this.handleError('initialization', error);
        }
    }

    /**
     * Initialize all game modules in correct order
     */
    async initializeModules() {
        // Core modules
        this.modules.stateManager = new StateManager();
        this.modules.timerManager = new TimerManager();
        this.modules.audioManager = new AudioManager();
        this.modules.powerUpManager = new PowerUpManager(this.modules.stateManager);
        this.modules.oddsCalculator = new OddsCalculator();
        
        // Betting modules
        this.modules.bettingManager = new BettingManager(
            this.modules.stateManager, 
            this.modules.powerUpManager
        );
        
        this.modules.eventManager = new EventManager(this.modules.stateManager);
        
        this.modules.fullMatchBetting = new FullMatchBetting(
            this.modules.stateManager,
            this.modules.bettingManager,
            this.modules.audioManager
        );
        
        this.modules.actionBetting = new ActionBetting(
            this.modules.stateManager,
            this.modules.timerManager,
            this.modules.bettingManager
        );
        
        // Set up ActionBetting callbacks to connect to UI
        this.modules.actionBetting.setCallbacks({
            onModalShow: (eventData) => {
                this.showActionBettingModal(eventData);
            },
            onModalHide: () => {
                this.hideActionBettingModal();
            },
            onCountdownUpdate: (timeLeft) => {
                this.updateActionBettingCountdown(timeLeft);
            },
            onGameResume: () => {
                this.resumeFromActionBet();
            }
        });
        
        // UI modules
        this.modules.uiManager = new UIManager();
        this.modules.lobbyScreen = new LobbyScreen();
        this.modules.matchScreen = new MatchScreen();
        this.modules.bettingModal = new BettingModal(
            this.modules.stateManager,
            this.modules.timerManager,
            this.modules.bettingManager
        );
        
        console.log('GameController: All modules initialized');
    }

    /**
     * Setup connections between modules
     */
    setupModuleConnections() {
        // Initialize UI Manager with state manager
        this.modules.uiManager.initialize(this.modules.stateManager);
        
        // Initialize screens with state manager
        this.modules.lobbyScreen.initialize(this.modules.stateManager);
        this.modules.matchScreen.initialize({ 
            stateManager: this.modules.stateManager,
            fullMatchBetting: this.modules.fullMatchBetting 
        });
        
        // Register screens with UI Manager
        this.modules.uiManager.registerScreen('lobby', this.modules.lobbyScreen);
        this.modules.uiManager.registerScreen('match', this.modules.matchScreen);
        
        // Start UI rendering now that screens are registered
        this.modules.uiManager.startRendering();
        
        // Setup timer callbacks
        this.modules.timerManager.setCallbacks({
            onMatchTimeUpdate: (time) => {
                this.modules.stateManager.updateState({ 'match.time': time });
                
                // Check for match end at 90 minutes
                if (time >= 90) {
                    console.log(`GameController: Match time reached ${time}, gamePhase: ${this.gamePhase}`);
                    if (this.gamePhase === 'match' || this.gamePhase === 'paused') {
                        console.log(`GameController: Ending match now`);
                        this.endMatch();
                    } else {
                        console.log(`GameController: Cannot end match - not in active phase`);
                    }
                }
            },
            onCountdownUpdate: (remaining) => {
                this.triggerEvent('countdownUpdate', { remaining });
            },
            onCountdownComplete: () => {
                this.triggerEvent('countdownComplete');
            }
        });
        
        console.log('GameController: Module connections established');
    }

    /**
     * Setup event listeners for game events
     */
    setupEventListeners() {
        // Action betting events
        this.addEventListener('game:actionBettingOpportunity', (event) => {
            this.handleActionBettingOpportunity(event.detail);
        });
        
        this.addEventListener('game:actionBetResolution', (event) => {
            this.handleActionBetResolution(event.detail);
        });
        
        // Goal events
        this.addEventListener('game:goal', (event) => {
            this.handleGoalEvent(event.detail);
        });
        
        // Match events
        this.addEventListener('matchStart', () => {
            this.handleMatchStart();
        });
        
        this.addEventListener('matchEnd', () => {
            this.handleMatchEnd();
        });
        
        // Betting events
        this.addEventListener('betPlaced', (event) => {
            this.handleBetPlaced(event.detail);
        });
        
        // Power-up events
        this.addEventListener('powerUpAwarded', (event) => {
            this.handlePowerUpAwarded(event.detail);
        });
        
        // Error events
        this.addEventListener('gameError', (event) => {
            this.handleError('runtime', event.detail);
        });
        
        console.log('GameController: Event listeners setup complete');
    }

    /**
     * Initialize UI and show initial screen
     */
    initializeUI() {
        // Setup lobby screen callbacks
        this.modules.lobbyScreen.setCallbacks({
            onMatchSelect: (matchData) => this.startMatch(matchData),
            onClassicModeToggle: (enabled) => this.toggleClassicMode(enabled)
        });
        
        // Setup match screen callbacks
        this.modules.matchScreen.setCallbacks({
            onReturnToLobby: () => this.returnToLobby(),
            onBetPlace: (betData) => this.placeBet(betData)
        });

        // Setup betting modal callbacks
        this.modules.bettingModal.setCallbacks({
            onModalHide: () => {
                // Resume match if it was paused for betting
                if (this.gamePhase === 'paused') {
                    this.resumeMatch();
                }
            },
            onBetPlaced: (bet, choice) => {
                // Handle bet placed from modal
                this.triggerEvent('betPlaced', { bet, choice });
            },
            onSkip: () => {
                // Handle skipped betting opportunity
                if (this.gamePhase === 'paused') {
                    this.resumeMatch();
                }
            },
            onTimeout: () => {
                // Handle betting timeout
                if (this.gamePhase === 'paused') {
                    this.resumeMatch();
                }
            }
        });
        
        console.log('GameController: UI initialization complete');
    }

    /**
     * Hide the loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('GameController: Loading screen hidden');
        }
    }

    /**
     * Start a new match
     */
    async startMatch(matchData) {
        try {
            console.log('GameController: Starting match...', matchData);
            
            if (this.gamePhase !== 'lobby') {
                throw new Error('Cannot start match - not in lobby phase');
            }
            
            this.gamePhase = 'match';
            this.currentMatch = matchData;
            
            // Reset match-specific state
            this.modules.stateManager.resetMatch();
            
            // Update state with match data
            this.modules.stateManager.updateState({
                currentScreen: 'match',
                match: {
                    active: true,
                    time: 0,
                    homeTeam: matchData.homeTeam,
                    awayTeam: matchData.awayTeam,
                    homeScore: 0,
                    awayScore: 0,
                    odds: matchData.odds || { home: 1.85, draw: 3.50, away: 4.20 },
                    initialOdds: matchData.odds || { home: 1.85, draw: 3.50, away: 4.20 }
                }
            });
            
            // Generate match timeline
            this.modules.eventManager.generateTimeline();
            
            // Start match timer
            this.modules.timerManager.startMatch();
            
            // Start event processing
            this.modules.eventManager.startEventProcessing();
            
            // Initialize betting systems
            this.modules.fullMatchBetting.initialize();
            this.modules.actionBetting.initialize();
            
            // Play match start sound
            this.modules.audioManager.playSound('matchStart');
            
            // Show notification
            this.modules.uiManager.showNotification(
                `Match started: ${matchData.homeTeam} vs ${matchData.awayTeam}`,
                'success',
                'Match Started'
            );
            
            this.triggerEvent('matchStart', { matchData });
            
            console.log('GameController: Match started successfully');
            
            return { success: true };
        } catch (error) {
            console.error('GameController: Match start failed:', error);
            return this.handleError('matchStart', error);
        }
    }

    /**
     * Pause the match for action betting
     */
    pauseForActionBet(eventData) {
        try {
            console.log('GameController: Pausing for action bet...', eventData);
            
            if (this.gamePhase !== 'match') {
                throw new Error('Cannot pause - not in match phase');
            }
            
            this.gamePhase = 'paused';
            
            // Pause match timer
            this.modules.timerManager.pauseTimer();
            
            // Show action betting modal
            this.modules.actionBetting.showActionBettingModal(eventData);
            
            // Play pause sound
            this.modules.audioManager.playSound('gamePaused');
            
            this.triggerEvent('matchPaused', { eventData });
            
            return { success: true };
        } catch (error) {
            console.error('GameController: Pause failed:', error);
            return this.handleError('pause', error);
        }
    }

    /**
     * Resume the match after action betting
     */
    resumeMatch() {
        try {
            console.log('GameController: Resuming match...');
            
            if (this.gamePhase !== 'paused') {
                throw new Error('Cannot resume - not in paused phase');
            }
            
            console.log('GameController: Setting gamePhase back to match');
            this.gamePhase = 'match';
            
            // Resume match timer
            this.modules.timerManager.resumeTimer();
            
            // Play resume sound
            this.modules.audioManager.playSound('gameResumed');
            
            this.triggerEvent('matchResumed');
            
            return { success: true };
        } catch (error) {
            console.error('GameController: Resume failed:', error);
            return this.handleError('resume', error);
        }
    }

    /**
     * Show action betting modal
     */
    showActionBettingModal(eventData) {
        try {
            console.log('GameController: Showing action betting modal with data:', eventData);
            
            const modal = document.getElementById('betting-modal');
            const title = document.getElementById('modal-title');
            const content = document.querySelector('.modal-content .betting-options');
            
            if (modal && title) {
                title.textContent = eventData.description;
                
                // Create betting options
                if (content) {
                    content.innerHTML = '';
                    
                    // Check if eventData has choices, if not create default ones
                    const choices = eventData.choices || eventData.data?.choices || [
                        { outcome: 'Goal', odds: 2.5 },
                        { outcome: 'Save', odds: 1.8 },
                        { outcome: 'Miss', odds: 3.2 }
                    ];
                    
                    console.log('GameController: Creating betting options:', choices);
                    
                    // Create stake input section
                    const stakeSection = document.createElement('div');
                    stakeSection.className = 'stake-section';
                    stakeSection.innerHTML = `
                        <label for="action-stake">Bet Amount:</label>
                        <input type="number" id="action-stake" min="1" max="1000" value="25" step="1">
                    `;
                    content.appendChild(stakeSection);
                    
                    // Create betting options
                    choices.forEach((choice, index) => {
                        const button = document.createElement('button');
                        button.className = 'bet-option';
                        button.textContent = `${choice.outcome} (${choice.odds}x)`;
                        button.onclick = () => {
                            const stakeInput = document.getElementById('action-stake');
                            const stake = parseInt(stakeInput.value) || 25;
                            this.handleActionBetChoice(eventData, choice, stake);
                        };
                        content.appendChild(button);
                    });
                }
                
                modal.classList.remove('hidden');
                
                // Ensure modal is visible
                modal.style.display = 'flex';
                modal.style.opacity = '1';
                modal.style.pointerEvents = 'auto';
                
                console.log('GameController: Action betting modal shown');
            }
        } catch (error) {
            console.error('GameController: Failed to show action betting modal:', error);
        }
    }
    
    /**
     * Hide action betting modal
     */
    hideActionBettingModal() {
        try {
            const modal = document.getElementById('betting-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
                console.log('GameController: Action betting modal hidden');
            }
        } catch (error) {
            console.error('GameController: Failed to hide action betting modal:', error);
        }
    }
    
    /**
     * Update action betting countdown
     */
    updateActionBettingCountdown(timeLeft) {
        try {
            const countdownElement = document.getElementById('countdown-timer');
            if (countdownElement) {
                countdownElement.textContent = `${Math.ceil(timeLeft)}s`;
            }
        } catch (error) {
            console.error('GameController: Failed to update countdown:', error);
        }
    }
    
    /**
     * Handle action bet choice
     */
    handleActionBetChoice(eventData, choice, stake = 25) {
        try {
            console.log('GameController: Action bet choice made:', choice, 'Stake:', stake);
            
            // Validate stake amount
            if (stake < 1 || stake > 1000) {
                alert('Please enter a stake between $1 and $1000');
                return;
            }
            
            // Place the bet through ActionBetting system
            this.modules.actionBetting.placeBetDirect(choice, stake);
            
            // Hide modal
            this.hideActionBettingModal();
            
        } catch (error) {
            console.error('GameController: Failed to handle action bet choice:', error);
        }
    }
    
    /**
     * Resume from action betting
     */
    resumeFromActionBet() {
        try {
            console.log('GameController: Resuming from action bet');
            
            if (this.gamePhase !== 'paused') {
                console.warn('GameController: Cannot resume - not in paused phase');
                return;
            }
            
            this.gamePhase = 'match';
            
            // Resume match timer
            this.modules.timerManager.resumeTimer();
            
            // Play resume sound
            this.modules.audioManager.playSound('gameResumed');
            
            this.triggerEvent('matchResumed');
            
            console.log('GameController: Successfully resumed from action bet');
            
        } catch (error) {
            console.error('GameController: Failed to resume from action bet:', error);
        }
    }

    /**
     * End the current match
     */
    async endMatch() {
        try {
            console.log('GameController: Ending match...');
            
            if (this.gamePhase !== 'match' && this.gamePhase !== 'paused') {
                throw new Error('Cannot end match - not in active phase');
            }
            
            this.gamePhase = 'ended';
            
            // Stop timers and event processing
            this.modules.timerManager.stopMatch();
            this.modules.eventManager.stopEventProcessing();
            
            // Get final match state
            const matchState = this.modules.stateManager.getState().match;
            const outcome = this.determineMatchOutcome(matchState.homeScore, matchState.awayScore);
            
            // Resolve all full-match bets based on final score
            const resolution = this.modules.bettingManager.resolveBets(outcome, 'fullMatch');
            
            // Calculate final winnings with power-up multipliers
            const finalWinnings = this.calculateFinalWinnings(resolution);
            
            // Update wallet balance with final winnings
            const currentState = this.modules.stateManager.getState();
            this.modules.stateManager.updateState({
                'match.active': false,
                wallet: currentState.wallet + finalWinnings.additionalWinnings
            });
            
            // Play match end sound
            this.modules.audioManager.playSound('matchEnd');
            
            // Create comprehensive match summary
            const summaryData = this.createMatchSummary(matchState, resolution, finalWinnings);
            
            // Show match summary modal
            await this.showMatchSummary(summaryData);
            
            this.triggerEvent('matchEnd', { outcome, resolution, summaryData });
            
            console.log('GameController: Match ended successfully');
            
            return { success: true, outcome, resolution, summaryData };
        } catch (error) {
            console.error('GameController: Match end failed:', error);
            return this.handleError('matchEnd', error);
        }
    }

    /**
     * Place a bet through the betting manager
     */
    async placeBet(betData) {
        try {
            console.log('GameController: Placing bet...', betData);
            
            const result = this.modules.bettingManager.placeBet(betData);
            
            if (result.success) {
                // Update bet amount memory
                this.modules.stateManager.updateBetAmountMemory(
                    betData.type === 'fullMatch' ? 'fullMatch' : 'opportunity',
                    betData.stake
                );
                
                // Play bet placed sound
                this.modules.audioManager.playSound('betPlaced');
                
                // Show notification
                this.modules.uiManager.showNotification(
                    `Bet placed: $${betData.stake} on ${betData.outcome}`,
                    'success',
                    'Bet Placed'
                );
                
                this.triggerEvent('betPlaced', { bet: result.bet });
            } else {
                // Show error notification
                this.modules.uiManager.showNotification(
                    result.error,
                    'error',
                    'Bet Failed'
                );
            }
            
            return result;
        } catch (error) {
            console.error('GameController: Bet placement failed:', error);
            return this.handleError('betPlacement', error);
        }
    }

    /**
     * Show the lobby screen
     */
    showLobby() {
        try {
            this.gamePhase = 'lobby';
            this.modules.stateManager.updateState({ currentScreen: 'lobby' });
            console.log('GameController: Showing lobby');
        } catch (error) {
            console.error('GameController: Show lobby failed:', error);
            this.handleError('showLobby', error);
        }
    }

    /**
     * Return to lobby from match
     */
    returnToLobby() {
        try {
            console.log('GameController: Returning to lobby...');
            
            // Clean up current match
            if (this.gamePhase === 'match' || this.gamePhase === 'paused') {
                this.modules.timerManager.stopMatch();
                this.modules.eventManager.stopEventProcessing();
            }
            
            // Reset modules
            this.modules.eventManager.reset();
            this.modules.timerManager.reset();
            this.modules.fullMatchBetting.reset();
            this.modules.actionBetting.reset();
            
            this.currentMatch = null;
            this.showLobby();
            
            return { success: true };
        } catch (error) {
            console.error('GameController: Return to lobby failed:', error);
            return this.handleError('returnToLobby', error);
        }
    }

    /**
     * Toggle classic mode
     */
    toggleClassicMode(enabled) {
        try {
            this.modules.stateManager.updateState({ classicMode: enabled });
            
            this.modules.uiManager.showNotification(
                `Classic mode ${enabled ? 'enabled' : 'disabled'}`,
                'info',
                'Settings Updated'
            );
            
            console.log(`GameController: Classic mode ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('GameController: Classic mode toggle failed:', error);
            this.handleError('classicModeToggle', error);
        }
    }

    /**
     * Handle action betting opportunity
     */
    handleActionBettingOpportunity(eventData) {
        try {
            console.log('GameController: Handling action betting opportunity...', eventData);
            this.pauseForActionBet(eventData.eventData);
        } catch (error) {
            console.error('GameController: Action betting opportunity handling failed:', error);
            this.handleError('actionBettingOpportunity', error);
        }
    }

    /**
     * Handle action bet resolution
     */
    handleActionBetResolution(eventData) {
        try {
            console.log('GameController: Handling action bet resolution...', eventData);
            
            const resolution = this.modules.bettingManager.resolveBets(
                eventData.winningOutcome,
                'actionBet',
                eventData.originalEvent.id
            );
            
            if (resolution.success && resolution.results.length > 0) {
                // Check for power-up awards
                const wonBets = resolution.results.filter(r => r.won);
                wonBets.forEach(() => {
                    const powerUpResult = this.modules.powerUpManager.awardPowerUp();
                    if (powerUpResult.success) {
                        this.handlePowerUpAwarded(powerUpResult);
                    }
                });
                
                // Show resolution notification
                const totalWinnings = resolution.totalWinnings;
                if (totalWinnings > 0) {
                    this.modules.uiManager.showNotification(
                        `Action bet won! +$${totalWinnings.toFixed(2)}`,
                        'success',
                        'Bet Won!'
                    );
                    this.modules.audioManager.playSound('betWon');
                } else {
                    this.modules.uiManager.showNotification(
                        'Action bet lost',
                        'warning',
                        'Bet Lost'
                    );
                    this.modules.audioManager.playSound('betLost');
                }
            }
        } catch (error) {
            console.error('GameController: Action bet resolution handling failed:', error);
            this.handleError('actionBetResolution', error);
        }
    }

    /**
     * Handle goal events
     */
    handleGoalEvent(eventData) {
        try {
            console.log('GameController: Handling goal event...', eventData);
            
            // Play goal sound
            this.modules.audioManager.playSound('goal');
            
            // Show goal notification
            this.modules.uiManager.showNotification(
                `GOAL! ${eventData.team} scores! ${eventData.newScore}`,
                'success',
                'GOAL!'
            );
        } catch (error) {
            console.error('GameController: Goal event handling failed:', error);
            this.handleError('goalEvent', error);
        }
    }

    /**
     * Handle match start
     */
    handleMatchStart() {
        try {
            console.log('GameController: Match start event handled');
            // Additional match start logic if needed
        } catch (error) {
            console.error('GameController: Match start handling failed:', error);
            this.handleError('matchStartEvent', error);
        }
    }

    /**
     * Handle match end
     */
    handleMatchEnd() {
        try {
            console.log('GameController: Match end event handled');
            // Additional match end logic if needed
        } catch (error) {
            console.error('GameController: Match end handling failed:', error);
            this.handleError('matchEndEvent', error);
        }
    }

    /**
     * Handle bet placed
     */
    handleBetPlaced(eventData) {
        try {
            console.log('GameController: Bet placed event handled', eventData);
            // Additional bet placed logic if needed
        } catch (error) {
            console.error('GameController: Bet placed handling failed:', error);
            this.handleError('betPlacedEvent', error);
        }
    }

    /**
     * Handle power-up awarded
     */
    handlePowerUpAwarded(eventData) {
        try {
            console.log('GameController: Power-up awarded...', eventData);
            
            this.modules.audioManager.playSound('powerUpAwarded');
            
            this.modules.uiManager.showNotification(
                '⭐ POWER-UP AWARDED: 2x Winnings Multiplier!',
                'success',
                'Power-Up!'
            );
            
            this.triggerEvent('powerUpAwarded', eventData);
        } catch (error) {
            console.error('GameController: Power-up award handling failed:', error);
            this.handleError('powerUpAwarded', error);
        }
    }

    /**
     * Calculate final winnings with power-up multipliers
     */
    calculateFinalWinnings(resolution) {
        let totalWinnings = 0;
        let powerUpBonuses = 0;
        let additionalWinnings = 0;
        
        if (resolution.success && resolution.results) {
            resolution.results.forEach(result => {
                if (result.won) {
                    totalWinnings += result.winnings;
                    
                    // Check if power-up was applied for additional bonus calculation
                    const state = this.modules.stateManager.getState();
                    const allBets = [...(state.bets.fullMatch || []), ...(state.bets.actionBet || [])];
                    const bet = allBets.find(b => b.id === result.betId);
                    
                    if (bet && bet.powerUpApplied) {
                        // Power-up doubles the winnings, so bonus is the base winnings
                        const baseWinnings = bet.stake * bet.odds;
                        powerUpBonuses += baseWinnings;
                    }
                }
            });
        }
        
        return {
            totalWinnings,
            powerUpBonuses,
            additionalWinnings: 0 // Already included in resolution
        };
    }

    /**
     * Create comprehensive match summary data
     */
    createMatchSummary(matchState, resolution, finalWinnings) {
        const state = this.modules.stateManager.getState();
        const stats = this.modules.bettingManager.getBetStatistics();
        
        // Get all bets for detailed breakdown
        const allBets = [...(state.bets.fullMatch || []), ...(state.bets.actionBet || [])];
        const resolvedBets = allBets.filter(bet => bet.status !== 'pending');
        const wonBets = allBets.filter(bet => bet.status === 'won');
        const lostBets = allBets.filter(bet => bet.status === 'lost');
        
        // Calculate net profit/loss
        const totalStaked = allBets.reduce((sum, bet) => sum + bet.stake, 0);
        const totalWinnings = wonBets.reduce((sum, bet) => sum + (bet.actualWinnings || 0), 0);
        const netResult = totalWinnings - totalStaked;
        
        return {
            match: {
                homeTeam: matchState.homeTeam,
                awayTeam: matchState.awayTeam,
                homeScore: matchState.homeScore,
                awayScore: matchState.awayScore,
                finalTime: matchState.time,
                outcome: this.determineMatchOutcome(matchState.homeScore, matchState.awayScore)
            },
            betting: {
                totalBets: allBets.length,
                resolvedBets: resolvedBets.length,
                wonBets: wonBets.length,
                lostBets: lostBets.length,
                totalStaked,
                totalWinnings,
                netResult,
                winRate: resolvedBets.length > 0 ? ((wonBets.length / resolvedBets.length) * 100).toFixed(1) : 0
            },
            bets: allBets.map(bet => ({
                id: bet.id,
                type: bet.type,
                outcome: bet.outcome,
                stake: bet.stake,
                odds: bet.odds,
                status: bet.status,
                winnings: bet.actualWinnings || 0,
                powerUpApplied: bet.powerUpApplied,
                placedAt: bet.placedAt,
                resolvedAt: bet.resolvedAt
            })),
            powerUps: {
                bonuses: finalWinnings.powerUpBonuses,
                applied: allBets.filter(bet => bet.powerUpApplied).length
            },
            wallet: {
                final: state.wallet,
                starting: 1000, // Default starting amount
                change: state.wallet - 1000
            },
            resolution
        };
    }

    /**
     * Show match summary modal
     */
    async showMatchSummary(summaryData) {
        try {
            // Show summary modal through betting modal component
            this.modules.bettingModal.showMatchSummaryModal(summaryData);
            
            console.log('GameController: Match summary shown');
        } catch (error) {
            console.error('GameController: Show match summary failed:', error);
            this.handleError('showMatchSummary', error);
        }
    }

    /**
     * Determine match outcome based on final score
     */
    determineMatchOutcome(homeScore, awayScore) {
        if (homeScore > awayScore) return 'home';
        if (awayScore > homeScore) return 'away';
        return 'draw';
    }

    /**
     * Add event listener with cleanup tracking
     */
    addEventListener(eventType, handler) {
        if (typeof document !== 'undefined') {
            document.addEventListener(eventType, handler);
            
            if (!this.eventListeners.has(eventType)) {
                this.eventListeners.set(eventType, []);
            }
            this.eventListeners.get(eventType).push(handler);
        }
    }

    /**
     * Trigger custom event
     */
    triggerEvent(eventType, data = {}) {
        if (typeof document !== 'undefined') {
            const event = new CustomEvent(eventType, { detail: data });
            document.dispatchEvent(event);
        }
    }

    /**
     * Comprehensive error handling and recovery
     */
    handleError(context, error) {
        console.error(`GameController Error [${context}]:`, error);
        
        this.errorRecoveryAttempts++;
        
        // Show user-friendly error message
        if (this.modules.uiManager) {
            this.modules.uiManager.showNotification(
                `An error occurred: ${error.message || 'Unknown error'}`,
                'error',
                'Game Error'
            );
        }
        
        // Attempt recovery based on context
        const recoveryResult = this.attemptRecovery(context, error);
        
        // If recovery fails and we've exceeded max attempts, reset game
        if (!recoveryResult && this.errorRecoveryAttempts >= this.maxRecoveryAttempts) {
            console.warn('GameController: Max recovery attempts reached, resetting game...');
            this.resetGame();
        }
        
        return { success: false, error: error.message, recovered: recoveryResult };
    }

    /**
     * Attempt error recovery based on context
     */
    attemptRecovery(context, error) {
        try {
            switch (context) {
                case 'matchStart':
                case 'matchEnd':
                    // Return to lobby on match lifecycle errors
                    this.returnToLobby();
                    return true;
                    
                case 'pause':
                case 'resume':
                    // Force resume on timer errors
                    if (this.gamePhase === 'paused') {
                        this.gamePhase = 'match';
                        this.modules.timerManager.resumeTimer();
                    }
                    return true;
                    
                case 'betPlacement':
                    // No recovery needed for bet placement errors
                    return true;
                    
                case 'initialization':
                    // Cannot recover from initialization errors
                    return false;
                    
                default:
                    // Generic recovery - try to continue
                    return true;
            }
        } catch (recoveryError) {
            console.error('GameController: Recovery attempt failed:', recoveryError);
            return false;
        }
    }

    /**
     * Reset the entire game to initial state
     */
    resetGame() {
        try {
            console.log('GameController: Resetting game...');
            
            // Stop all timers and processes
            if (this.modules.timerManager) {
                this.modules.timerManager.reset();
            }
            
            if (this.modules.eventManager) {
                this.modules.eventManager.reset();
            }
            
            // Reset state
            if (this.modules.stateManager) {
                this.modules.stateManager.reset();
            }
            
            // Reset betting systems
            if (this.modules.fullMatchBetting) {
                this.modules.fullMatchBetting.reset();
            }
            
            if (this.modules.actionBetting) {
                this.modules.actionBetting.reset();
            }
            
            // Clear notifications
            if (this.modules.uiManager) {
                this.modules.uiManager.clearNotifications();
            }
            
            // Reset game state
            this.gamePhase = 'lobby';
            this.currentMatch = null;
            this.errorRecoveryAttempts = 0;
            
            // Show lobby
            this.showLobby();
            
            console.log('GameController: Game reset complete');
        } catch (error) {
            console.error('GameController: Game reset failed:', error);
            // Last resort - reload page
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        }
    }

    /**
     * Get current game status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            gamePhase: this.gamePhase,
            currentMatch: this.currentMatch,
            errorRecoveryAttempts: this.errorRecoveryAttempts,
            modules: Object.keys(this.modules),
            timerStatus: this.modules.timerManager?.getStatus(),
            state: this.modules.stateManager?.getState()
        };
    }

    /**
     * Cleanup resources and event listeners
     */
    destroy() {
        try {
            console.log('GameController: Destroying...');
            
            // Remove all event listeners
            this.eventListeners.forEach((handlers, eventType) => {
                handlers.forEach(handler => {
                    if (typeof document !== 'undefined') {
                        document.removeEventListener(eventType, handler);
                    }
                });
            });
            this.eventListeners.clear();
            
            // Cleanup modules
            Object.values(this.modules).forEach(module => {
                if (module && typeof module.destroy === 'function') {
                    module.destroy();
                }
            });
            
            // Reset properties
            this.modules = {};
            this.isInitialized = false;
            this.currentMatch = null;
            this.gamePhase = 'lobby';
            
            console.log('GameController: Destroyed successfully');
        } catch (error) {
            console.error('GameController: Destroy failed:', error);
        }
    }
}

// Export singleton instance
export const gameController = new GameController();