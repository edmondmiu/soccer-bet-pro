/**
 * BettingModal - Handles all betting modal interfaces
 * 
 * Provides:
 * - Action betting opportunity modal with countdown
 * - Bet slip modal with pre-populated amounts
 * - Match summary modal with comprehensive results
 * - Consistent styling and responsive behavior
 */

export class BettingModal {
    constructor(stateManager, timerManager, bettingManager) {
        this.stateManager = stateManager;
        this.timerManager = timerManager;
        this.bettingManager = bettingManager;
        
        this.activeModal = null;
        this.modalOverlay = null;
        this.countdownInterval = null;
        
        this.callbacks = {
            onModalShow: null,
            onModalHide: null,
            onBetPlaced: null,
            onSkip: null,
            onTimeout: null
        };

        this.initializeModalSystem();
    }

    /**
     * Initialize the modal system and base styles
     */
    initializeModalSystem() {
        // Only initialize if document is available (browser environment)
        if (typeof document === 'undefined') {
            return;
        }

        this.createModalOverlay();
        this.applyModalStyles();
        this.setupEventListeners();
    }

    /**
     * Create the modal overlay container
     */
    createModalOverlay() {
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.id = 'betting-modal-overlay';
        this.modalOverlay.className = 'modal-overlay hidden';
        document.body.appendChild(this.modalOverlay);
    }

    /**
     * Apply CSS styles for modal system
     */
    applyModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(4px);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }

            .modal-overlay.show {
                opacity: 1;
            }

            .modal-overlay.hidden {
                display: none;
            }

            .betting-modal {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 2px solid #059669;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s ease-in-out;
            }

            .modal-overlay.show .betting-modal {
                transform: scale(1) translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners for modal system
     */
    setupEventListeners() {
        // Close modal on overlay click
        this.modalOverlay.addEventListener('click', (event) => {
            if (event.target === this.modalOverlay) {
                this.closeModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    /**
     * Shows match summary modal with comprehensive results
     */
    showMatchSummaryModal(summaryData) {
        const modal = this.createMatchSummaryModal(summaryData);
        this.showModal(modal);
    }

    /**
     * Alternative method name for compatibility
     */
    showMatchSummary(summaryData) {
        this.showMatchSummaryModal(summaryData);
    }

    /**
     * Creates match summary modal element
     */
    createMatchSummaryModal(summaryData) {
        // Handle both old and new data formats for compatibility
        const isNewFormat = summaryData.match && summaryData.betting;
        
        let match, betting, bets, powerUps, wallet;
        
        if (isNewFormat) {
            ({ match, betting, bets, powerUps, wallet } = summaryData);
        } else {
            // Legacy format - extract from state
            const matchData = summaryData;
            const state = this.stateManager.getState();
            const allBets = [...(state.bets.fullMatch || []), ...(state.bets.actionBet || [])];
            const wonBets = allBets.filter(bet => bet.status === 'won');
            const totalStaked = allBets.reduce((sum, bet) => sum + bet.stake, 0);
            const totalWinnings = wonBets.reduce((sum, bet) => sum + (bet.actualWinnings || 0), 0);
            
            match = {
                homeTeam: matchData.homeTeam || state.match.homeTeam,
                awayTeam: matchData.awayTeam || state.match.awayTeam,
                homeScore: matchData.homeScore || state.match.homeScore,
                awayScore: matchData.awayScore || state.match.awayScore,
                outcome: this.determineOutcome(state.match.homeScore, state.match.awayScore)
            };
            
            betting = {
                totalBets: allBets.length,
                wonBets: wonBets.length,
                lostBets: allBets.filter(bet => bet.status === 'lost').length,
                totalStaked,
                totalWinnings,
                netResult: totalWinnings - totalStaked,
                winRate: allBets.length > 0 ? ((wonBets.length / allBets.length) * 100).toFixed(1) : 0
            };
            
            bets = allBets;
            powerUps = { applied: allBets.filter(bet => bet.powerUpApplied).length, bonuses: 0 };
            wallet = { final: state.wallet, starting: 1000, change: state.wallet - 1000 };
        }

        const modal = document.createElement('div');
        modal.className = 'betting-modal match-summary-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">🏆 Match Complete</h2>
                <button class="modal-close" type="button">&times;</button>
            </div>
            <div class="modal-body">
                <div class="match-summary">
                    <div class="team-names">
                        ${match.homeTeam} vs ${match.awayTeam}
                    </div>
                    <div class="final-score">
                        ${match.homeScore} - ${match.awayScore}
                    </div>
                    <div class="match-outcome">
                        ${this.getMatchOutcomeText(match.outcome, match)}
                    </div>
                </div>

                <div class="summary-section">
                    <h4>📊 Betting Summary</h4>
                    <div class="bet-details">
                        <div class="detail-item">
                            <div class="detail-label">Total Bets Placed</div>
                            <div class="detail-value">${betting.totalBets}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Bets Won</div>
                            <div class="detail-value won">${betting.wonBets}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Win Rate</div>
                            <div class="detail-value">${betting.winRate}%</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Staked</div>
                            <div class="detail-value">$${betting.totalStaked.toFixed(2)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Winnings</div>
                            <div class="detail-value won">$${betting.totalWinnings.toFixed(2)}</div>
                        </div>
                        ${powerUps.applied > 0 ? `
                            <div class="detail-item">
                                <div class="detail-label">⭐ Power-up Bonuses</div>
                                <div class="detail-value highlight">$${powerUps.bonuses.toFixed(2)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${bets.length > 0 ? `
                    <div class="summary-section">
                        <h4>📋 Bet Details</h4>
                        <div class="bet-list">
                            ${bets.map(bet => `
                                <div class="bet-summary-item">
                                    <div class="bet-info">
                                        <div class="bet-outcome">${this.getBetOutcomeLabel(bet)}</div>
                                        <div class="bet-details-text">
                                            $${bet.stake.toFixed(2)} @ ${bet.odds.toFixed(2)}
                                            ${bet.powerUpApplied ? ' ⭐ Power-up Applied' : ''}
                                        </div>
                                    </div>
                                    <div class="bet-result ${bet.status}">
                                        ${bet.status === 'won' ? `+$${(bet.actualWinnings || bet.winnings || 0).toFixed(2)}` : 
                                          bet.status === 'lost' ? `-$${bet.stake.toFixed(2)}` : 'Pending'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="wallet-summary">
                    <div class="wallet-item">
                        <div class="wallet-label">Starting Wallet</div>
                        <div class="wallet-value">$${wallet.starting.toFixed(2)}</div>
                    </div>
                    <div class="wallet-item">
                        <div class="wallet-label">Final Wallet</div>
                        <div class="wallet-value">$${wallet.final.toFixed(2)}</div>
                    </div>
                    <div class="wallet-item total">
                        <div class="wallet-label">Net Change</div>
                        <div class="wallet-value ${wallet.change >= 0 ? 'won' : 'lost'}">
                            ${wallet.change >= 0 ? '+' : ''}$${wallet.change.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div class="total-summary">
                    <div class="summary-message">
                        ${betting.netResult >= 0 ? '🎉 Congratulations!' : '💪 Better luck next time!'}
                    </div>
                    <div class="net-result-label">Net Result</div>
                    <div class="net-result-amount ${betting.netResult >= 0 ? 'won' : 'lost'}">
                        ${betting.netResult >= 0 ? '+' : ''}$${betting.netResult.toFixed(2)}
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" id="return-to-lobby">
                        Return to Lobby
                    </button>
                </div>
            </div>
        `;

        this.setupMatchSummaryListeners(modal);
        this.applyMatchSummaryStyles();
        return modal;
    }

    /**
     * Setup event listeners for match summary modal
     */
    setupMatchSummaryListeners(modal) {
        const returnBtn = modal.querySelector('#return-to-lobby');
        const closeBtn = modal.querySelector('.modal-close');

        // Return to lobby button
        returnBtn.addEventListener('click', () => {
            this.closeModal();
            // Transition to lobby screen
            this.stateManager.updateState({ currentScreen: 'lobby' });
        });

        // Close button (same as return to lobby)
        closeBtn.addEventListener('click', () => {
            this.closeModal();
            this.stateManager.updateState({ currentScreen: 'lobby' });
        });
    }

    /**
     * Apply additional styles for match summary modal
     */
    applyMatchSummaryStyles() {
        // Only apply if not already applied
        if (document.getElementById('match-summary-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'match-summary-styles';
        style.textContent = `
            .match-summary-modal .modal-body {
                padding: 24px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .match-summary {
                text-align: center;
                margin-bottom: 24px;
                padding: 20px;
                background: rgba(5, 150, 105, 0.1);
                border: 1px solid #059669;
                border-radius: 8px;
            }

            .team-names {
                font-size: 20px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 8px;
            }

            .final-score {
                font-size: 32px;
                font-weight: 700;
                color: #10b981;
                margin-bottom: 8px;
            }

            .match-outcome {
                font-size: 16px;
                color: #e2e8f0;
                opacity: 0.9;
            }

            .summary-section {
                margin-bottom: 20px;
                padding: 16px;
                background: rgba(51, 65, 85, 0.3);
                border-radius: 8px;
                border: 1px solid #475569;
            }

            .summary-section h4 {
                margin: 0 0 16px 0;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
            }

            .bet-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
            }

            .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(15, 23, 42, 0.5);
                border-radius: 6px;
                border: 1px solid #334155;
            }

            .detail-label {
                color: #e2e8f0;
                font-size: 14px;
            }

            .detail-value {
                color: #ffffff;
                font-weight: 600;
                font-size: 14px;
            }

            .detail-value.won {
                color: #10b981;
            }

            .detail-value.highlight {
                color: #fbbf24;
            }

            .bet-list {
                max-height: 200px;
                overflow-y: auto;
            }

            .bet-summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                margin-bottom: 8px;
                background: rgba(15, 23, 42, 0.5);
                border-radius: 6px;
                border: 1px solid #334155;
            }

            .bet-info {
                flex: 1;
            }

            .bet-outcome {
                color: #ffffff;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .bet-details-text {
                font-size: 14px;
                color: #94a3b8;
            }

            .bet-result {
                font-weight: 600;
                font-size: 14px;
                padding: 4px 8px;
                border-radius: 4px;
                min-width: 80px;
                text-align: center;
            }

            .bet-result.won {
                color: #10b981;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid #10b981;
            }

            .bet-result.lost {
                color: #ef4444;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
            }

            .wallet-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                margin-bottom: 20px;
                padding: 16px;
                background: rgba(51, 65, 85, 0.3);
                border-radius: 8px;
                border: 1px solid #475569;
            }

            .wallet-item {
                text-align: center;
                padding: 12px;
                background: rgba(15, 23, 42, 0.5);
                border-radius: 6px;
                border: 1px solid #334155;
            }

            .wallet-item.total {
                border-color: #059669;
                background: rgba(5, 150, 105, 0.1);
            }

            .wallet-label {
                color: #e2e8f0;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .wallet-value {
                color: #ffffff;
                font-weight: 600;
                font-size: 16px;
            }

            .wallet-value.won {
                color: #10b981;
            }

            .wallet-value.lost {
                color: #ef4444;
            }

            .total-summary {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
                border: 2px solid #059669;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .summary-message {
                font-size: 18px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 12px;
            }

            .net-result-label {
                font-size: 16px;
                color: #e2e8f0;
                opacity: 0.9;
                margin-bottom: 8px;
            }

            .net-result-amount {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .net-result-amount.won {
                color: #10b981;
            }

            .net-result-amount.lost {
                color: #ef4444;
            }

            .modal-btn {
                padding: 12px 24px;
                border: 2px solid;
                border-radius: 8px;
                background: transparent;
                color: #ffffff;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
                font-size: 16px;
                min-width: 120px;
            }

            .modal-btn-primary {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border-color: #34d399;
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }

            .modal-btn-primary:hover {
                background: linear-gradient(135deg, #047857 0%, #059669 100%);
                box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
                transform: translateY(-2px);
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .match-summary-modal .modal-body {
                    padding: 16px;
                }

                .bet-details {
                    grid-template-columns: 1fr;
                }

                .wallet-summary {
                    grid-template-columns: 1fr;
                }

                .bet-summary-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }

                .bet-result {
                    align-self: flex-end;
                }

                .final-score {
                    font-size: 24px;
                }

                .net-result-amount {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Get match outcome text for display
     */
    getMatchOutcomeText(outcome, match) {
        switch (outcome) {
            case 'home':
                return `${match.homeTeam} Wins!`;
            case 'away':
                return `${match.awayTeam} Wins!`;
            case 'draw':
                return 'Match Drawn';
            default:
                return 'Match Complete';
        }
    }

    /**
     * Determine match outcome from scores
     */
    determineOutcome(homeScore, awayScore) {
        if (homeScore > awayScore) return 'home';
        if (awayScore > homeScore) return 'away';
        return 'draw';
    }

    /**
     * Gets human-readable label for bet outcome
     */
    getBetOutcomeLabel(bet) {
        const state = this.stateManager.getState();
        
        if (bet.type === 'fullMatch') {
            switch (bet.outcome) {
                case 'home': return `${state.match.homeTeam || 'Home'} Win`;
                case 'away': return `${state.match.awayTeam || 'Away'} Win`;
                case 'draw': return 'Draw';
                default: return bet.outcome;
            }
        } else {
            return bet.outcome || 'Action Bet';
        }
    }

    /**
     * Shows a modal
     */
    showModal(modal) {
        // Clear any existing modal
        this.closeModal();

        this.activeModal = modal;
        this.modalOverlay.appendChild(modal);
        this.modalOverlay.classList.remove('hidden');
        
        // Trigger show animation
        setTimeout(() => {
            this.modalOverlay.classList.add('show');
        }, 50);
    }

    /**
     * Closes the active modal
     */
    closeModal() {
        if (!this.activeModal) return;

        // Trigger hide animation
        this.modalOverlay.classList.remove('show');
        
        setTimeout(() => {
            if (this.modalOverlay) {
                this.modalOverlay.classList.add('hidden');
                this.modalOverlay.innerHTML = '';
            }
            this.activeModal = null;
            
            // Notify callback
            if (this.callbacks.onModalHide) {
                this.callbacks.onModalHide();
            }
        }, 300);
    }

    /**
     * Sets callback functions for modal events
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Checks if a modal is currently active
     */
    isModalActive() {
        return this.activeModal !== null;
    }

    /**
     * Cleanup method to remove event listeners and DOM elements
     */
    cleanup() {
        this.closeModal();
        
        if (this.modalOverlay && this.modalOverlay.parentNode) {
            this.modalOverlay.parentNode.removeChild(this.modalOverlay);
        }
        
        this.activeModal = null;
        this.modalOverlay = null;
    }
}

export default BettingModal;