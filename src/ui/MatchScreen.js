/**
 * MatchScreen - Main match interface with live updates and betting controls
 * Displays live match timer, score, team information, continuous betting buttons,
 * event feed, wallet tracking, and power-up display with real-time state updates
 */
export class MatchScreen {
    constructor() {
        this.element = null;
        this.stateManager = null;
        this.fullMatchBetting = null;
        this.eventFeedContainer = null;
        this.walletDisplay = null;
        this.powerUpDisplay = null;
        this.timerDisplay = null;
        this.scoreDisplay = null;
        this.teamDisplay = null;
        this.oddsDisplay = null;
        this.betsDisplay = null;
        this.isInitialized = false;
        this.callbacks = {};
    }

    /**
     * Initialize the match screen with dependencies
     * @param {Object} dependencies - Required dependencies
     */
    initialize(dependencies = {}) {
        this.stateManager = dependencies.stateManager;
        this.fullMatchBetting = dependencies.fullMatchBetting;
        this.isInitialized = true;
    }

    /**
     * Set callback functions for match screen events
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Render match screen with complete interface
     * @param {Object} state - Current game state
     * @returns {HTMLElement} Match screen element
     */
    render(state = {}) {
        if (!state.match) {
            console.error('MatchScreen: No match data provided');
            return this.createErrorScreen();
        }

        this.element = document.createElement('div');
        this.element.id = 'match-screen';
        this.element.className = 'match-screen';

        // Create main layout structure
        this.element.innerHTML = `
            <div class="match-header">
                <div class="match-info">
                    <div class="team-display">
                        <span class="home-team">${state.match.homeTeam || 'Home'}</span>
                        <span class="match-score">${state.match.homeScore} - ${state.match.awayScore}</span>
                        <span class="away-team">${state.match.awayTeam || 'Away'}</span>
                    </div>
                    <div class="match-timer">${Math.floor(state.match.time)}'</div>
                </div>
                <div class="match-status">
                    <div class="wallet-section">
                        <span class="wallet-label">Balance:</span>
                        <span class="wallet-balance">$${state.wallet?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div class="power-up-section">
                        ${this.renderPowerUpDisplay(state.powerUp)}
                    </div>
                </div>
            </div>

            <div class="match-content">
                <div class="betting-section">
                    <h3>Match Outcome Betting</h3>
                    <div class="betting-buttons-container">
                        ${this.renderBettingButtons(state)}
                    </div>
                    <div class="betting-form-container" id="betting-form-container"></div>
                </div>

                <div class="match-stats">
                    <div class="current-bets">
                        <h4>Your Bets</h4>
                        <div class="bets-display" id="bets-display">
                            ${this.renderCurrentBets(state.bets)}
                        </div>
                    </div>
                </div>

                <div class="event-feed-section">
                    <h4>Match Events</h4>
                    <div class="event-feed" id="event-feed">
                        ${this.renderEventFeed(state.match.eventFeed)}
                    </div>
                </div>
            </div>
        `;

        // Cache important elements
        this.cacheElements();

        // Setup event listeners
        this.setupEventListeners();

        // Apply styles
        this.applyStyles();

        return this.element;
    }

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        if (!this.element) return;

        this.timerDisplay = this.element.querySelector('.match-timer');
        this.scoreDisplay = this.element.querySelector('.match-score');
        this.teamDisplay = {
            home: this.element.querySelector('.home-team'),
            away: this.element.querySelector('.away-team')
        };
        this.walletDisplay = this.element.querySelector('.wallet-balance');
        this.powerUpDisplay = this.element.querySelector('.power-up-section');
        this.eventFeedContainer = this.element.querySelector('#event-feed');
        this.betsDisplay = this.element.querySelector('#bets-display');
        this.bettingFormContainer = this.element.querySelector('#betting-form-container');
        this.oddsDisplay = {
            home: this.element.querySelector('.odds-home'),
            draw: this.element.querySelector('.odds-draw'),
            away: this.element.querySelector('.odds-away')
        };
    }

    /**
     * Setup event listeners for betting buttons and interactions
     */
    setupEventListeners() {
        if (!this.element) return;

        // Betting button clicks
        const bettingButtons = this.element.querySelectorAll('.betting-button');
        bettingButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const outcome = e.currentTarget.dataset.outcome;
                this.showBettingForm(outcome);
            });
        });

        // Power-up button click
        const powerUpButton = this.element.querySelector('.power-up-button');
        if (powerUpButton) {
            powerUpButton.addEventListener('click', () => {
                this.handlePowerUpUse();
            });
        }
    }

    /**
     * Render betting buttons for match outcomes
     * @param {Object} state - Current game state
     * @returns {string} HTML for betting buttons
     */
    renderBettingButtons(state) {
        const odds = state.match?.odds || { home: 1.85, draw: 3.50, away: 4.20 };
        const homeTeam = state.match?.homeTeam || 'Home';
        const awayTeam = state.match?.awayTeam || 'Away';

        return `
            <button class="betting-button btn-primary" data-outcome="home">
                <div class="betting-button-content">
                    <span class="outcome-label">${homeTeam}</span>
                    <span class="odds-display odds-home">${odds.home.toFixed(2)}</span>
                </div>
            </button>
            <button class="betting-button btn-primary" data-outcome="draw">
                <div class="betting-button-content">
                    <span class="outcome-label">Draw</span>
                    <span class="odds-display odds-draw">${odds.draw.toFixed(2)}</span>
                </div>
            </button>
            <button class="betting-button btn-primary" data-outcome="away">
                <div class="betting-button-content">
                    <span class="outcome-label">${awayTeam}</span>
                    <span class="odds-display odds-away">${odds.away.toFixed(2)}</span>
                </div>
            </button>
        `;
    }

    /**
     * Render power-up display section
     * @param {Object} powerUp - Power-up state
     * @returns {string} HTML for power-up display
     */
    renderPowerUpDisplay(powerUp) {
        if (!powerUp?.held) {
            return '<div class="power-up-empty">No Power-Up</div>';
        }

        return `
            <div class="power-up-active">
                <button class="power-up-button btn-primary">
                    ⭐ Use Power-Up (2x)
                </button>
            </div>
        `;
    }

    /**
     * Render current bets display
     * @param {Object} bets - Current bets state
     * @returns {string} HTML for bets display
     */
    renderCurrentBets(bets) {
        if (!bets || (!bets.fullMatch?.length && !bets.actionBets?.length)) {
            return '<div class="no-bets">No active bets</div>';
        }

        let html = '';

        // Full match bets
        if (bets.fullMatch?.length) {
            html += '<div class="bet-category"><h5>Full Match Bets</h5>';
            bets.fullMatch.forEach(bet => {
                html += this.renderBetItem(bet);
            });
            html += '</div>';
        }

        // Action bets
        if (bets.actionBets?.length) {
            html += '<div class="bet-category"><h5>Action Bets</h5>';
            bets.actionBets.forEach(bet => {
                html += this.renderBetItem(bet);
            });
            html += '</div>';
        }

        return html;
    }

    /**
     * Render individual bet item
     * @param {Object} bet - Bet data
     * @returns {string} HTML for bet item
     */
    renderBetItem(bet) {
        const statusClass = bet.status === 'won' ? 'bet-won' : 
                           bet.status === 'lost' ? 'bet-lost' : 'bet-pending';
        
        const powerUpIndicator = bet.powerUpApplied ? ' ⭐' : '';
        
        return `
            <div class="bet-item ${statusClass}">
                <div class="bet-info">
                    <span class="bet-outcome">${bet.outcome}${powerUpIndicator}</span>
                    <span class="bet-stake">$${bet.stake.toFixed(2)}</span>
                </div>
                <div class="bet-details">
                    <span class="bet-odds">${bet.odds.toFixed(2)}</span>
                    <span class="bet-potential">$${bet.potentialWinnings.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render event feed
     * @param {Array} eventFeed - Match events that have actually occurred
     * @returns {string} HTML for event feed
     */
    renderEventFeed(eventFeed = []) {
        if (!eventFeed.length) {
            return '<div class="no-events">Match starting soon...</div>';
        }

        // Show last 10 events, most recent first
        const recentEvents = eventFeed.slice(-10).reverse();
        
        return recentEvents.map(event => {
            const eventClass = this.getEventClass(event.type);
            return `
                <div class="event-item ${eventClass}">
                    <div class="event-time">${Math.floor(event.time)}'</div>
                    <div class="event-description">${event.description}</div>
                    ${event.outcome ? `<div class="event-outcome">${event.outcome}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Get CSS class for event type
     * @param {string} eventType - Type of event
     * @returns {string} CSS class name
     */
    getEventClass(eventType) {
        switch (eventType) {
            case 'GOAL': return 'event-goal';
            case 'ACTION_BET': return 'event-action-bet';
            case 'RESOLUTION': return 'event-resolution';
            case 'COMMENTARY': return 'event-commentary';
            default: return 'event-default';
        }
    }

    /**
     * Show betting form for selected outcome
     * @param {string} outcome - Selected outcome
     */
    showBettingForm(outcome) {
        if (!this.stateManager || !this.bettingFormContainer) return;

        const state = this.stateManager.getState();
        const odds = state.match.odds[outcome];
        const rememberedAmount = state.betAmountMemory.fullMatch;

        // Create betting form
        const form = document.createElement('div');
        form.className = 'betting-form active';
        form.innerHTML = `
            <div class="betting-form-header">
                <h4>Bet on ${this.getOutcomeLabel(outcome, state)}</h4>
                <button class="close-form-btn" type="button">×</button>
            </div>
            <div class="betting-form-content">
                <div class="bet-details">
                    <span>Odds: ${odds.toFixed(2)}</span>
                </div>
                <div class="bet-amount-section">
                    <label for="bet-amount">Bet Amount:</label>
                    <input type="number" id="bet-amount" value="${rememberedAmount}" min="1" max="${state.wallet}" step="0.01">
                </div>
                <div class="potential-winnings">
                    Potential Winnings: $<span id="potential-winnings">${(rememberedAmount * odds).toFixed(2)}</span>
                </div>
                <div class="betting-form-actions">
                    <button class="place-bet-btn btn-primary" data-outcome="${outcome}">Place Bet</button>
                    <button class="cancel-bet-btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;

        // Clear existing form and add new one
        this.bettingFormContainer.innerHTML = '';
        this.bettingFormContainer.appendChild(form);

        // Setup form event listeners
        this.setupBettingFormListeners(form, outcome, odds);

        // Focus on amount input
        const amountInput = form.querySelector('#bet-amount');
        amountInput.focus();
        amountInput.select();
    }

    /**
     * Setup event listeners for betting form
     * @param {HTMLElement} form - Betting form element
     * @param {string} outcome - Selected outcome
     * @param {number} odds - Current odds
     */
    setupBettingFormListeners(form, outcome, odds) {
        const amountInput = form.querySelector('#bet-amount');
        const potentialWinningsSpan = form.querySelector('#potential-winnings');
        const placeBetBtn = form.querySelector('.place-bet-btn');
        const cancelBtn = form.querySelector('.cancel-bet-btn');
        const closeBtn = form.querySelector('.close-form-btn');

        // Update potential winnings on amount change
        amountInput.addEventListener('input', () => {
            const amount = parseFloat(amountInput.value) || 0;
            potentialWinningsSpan.textContent = (amount * odds).toFixed(2);
        });

        // Place bet
        placeBetBtn.addEventListener('click', () => {
            this.handleBetPlacement(outcome, parseFloat(amountInput.value));
        });

        // Cancel/close form
        [cancelBtn, closeBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeBettingForm();
            });
        });

        // Enter key to place bet
        amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleBetPlacement(outcome, parseFloat(amountInput.value));
            }
        });
    }

    /**
     * Handle bet placement
     * @param {string} outcome - Selected outcome
     * @param {number} amount - Bet amount
     */
    handleBetPlacement(outcome, amount) {
        if (!this.stateManager || !this.fullMatchBetting) return;

        try {
            // Validate amount
            if (!amount || amount <= 0) {
                throw new Error('Please enter a valid bet amount');
            }

            const state = this.stateManager.getState();
            if (amount > state.wallet) {
                throw new Error('Insufficient funds');
            }

            // Place bet through FullMatchBetting
            this.fullMatchBetting.placeBet(outcome, amount);

            // Close form
            this.closeBettingForm();

            // Show success notification (if UIManager available)
            if (window.uiManager) {
                window.uiManager.showNotification(
                    `Bet placed: $${amount.toFixed(2)} on ${this.getOutcomeLabel(outcome, state)}`,
                    'success'
                );
            }

        } catch (error) {
            console.error('Bet placement failed:', error);
            
            // Show error notification
            if (window.uiManager) {
                window.uiManager.showNotification(error.message, 'error');
            }
        }
    }

    /**
     * Close betting form
     */
    closeBettingForm() {
        if (this.bettingFormContainer) {
            this.bettingFormContainer.innerHTML = '';
        }
    }

    /**
     * Handle power-up usage
     */
    handlePowerUpUse() {
        if (!this.stateManager) return;

        const state = this.stateManager.getState();
        if (!state.powerUp?.held) return;

        // Show power-up application interface or apply to next bet
        if (window.uiManager) {
            window.uiManager.showNotification(
                'Power-up ready! Your next full-match bet will have 2x winnings multiplier.',
                'info'
            );
        }
    }

    /**
     * Get outcome label for display
     * @param {string} outcome - Outcome key
     * @param {Object} state - Current state
     * @returns {string} Display label
     */
    getOutcomeLabel(outcome, state) {
        switch (outcome) {
            case 'home': return state.match?.homeTeam || 'Home';
            case 'away': return state.match?.awayTeam || 'Away';
            case 'draw': return 'Draw';
            default: return outcome;
        }
    }

    /**
     * Update screen with new state data
     * @param {Object} state - New state data
     */
    update(state) {
        if (!this.element || !state) return;

        // Update timer
        if (state.match?.time !== undefined) {
            this.updateTimer(state.match.time);
        }

        // Update score
        if (state.match?.homeScore !== undefined || state.match?.awayScore !== undefined) {
            this.updateScore(state.match.homeScore, state.match.awayScore);
        }

        // Update wallet
        if (state.wallet !== undefined) {
            this.updateWallet(state.wallet);
        }

        // Update odds
        if (state.match?.odds) {
            this.updateOdds(state.match.odds);
        }

        // Update power-up display
        if (state.powerUp !== undefined) {
            this.updatePowerUpDisplay(state.powerUp);
        }

        // Update bets display
        if (state.bets) {
            this.updateBetsDisplay(state.bets);
        }

        // Update event feed
        if (state.match?.eventFeed) {
            this.updateEventFeed(state.match.eventFeed);
        }
    }

    /**
     * Update match timer display
     * @param {number} time - Current match time in minutes
     */
    updateTimer(time) {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = `${Math.floor(time)}'`;
        }
    }

    /**
     * Update score display
     * @param {number} homeScore - Home team score
     * @param {number} awayScore - Away team score
     */
    updateScore(homeScore, awayScore) {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `${homeScore} - ${awayScore}`;
        }
    }

    /**
     * Update wallet display
     * @param {number} balance - Current wallet balance
     */
    updateWallet(balance) {
        if (this.walletDisplay) {
            this.walletDisplay.textContent = `$${balance.toFixed(2)}`;
        }
    }

    /**
     * Update odds display
     * @param {Object} odds - Current odds
     */
    updateOdds(odds) {
        if (this.oddsDisplay.home) {
            this.oddsDisplay.home.textContent = odds.home.toFixed(2);
        }
        if (this.oddsDisplay.draw) {
            this.oddsDisplay.draw.textContent = odds.draw.toFixed(2);
        }
        if (this.oddsDisplay.away) {
            this.oddsDisplay.away.textContent = odds.away.toFixed(2);
        }
    }

    /**
     * Update power-up display
     * @param {Object} powerUp - Power-up state
     */
    updatePowerUpDisplay(powerUp) {
        if (this.powerUpDisplay) {
            this.powerUpDisplay.innerHTML = this.renderPowerUpDisplay(powerUp);
            
            // Re-setup power-up button listener
            const powerUpButton = this.powerUpDisplay.querySelector('.power-up-button');
            if (powerUpButton) {
                powerUpButton.addEventListener('click', () => {
                    this.handlePowerUpUse();
                });
            }
        }
    }

    /**
     * Update bets display
     * @param {Object} bets - Current bets
     */
    updateBetsDisplay(bets) {
        if (this.betsDisplay) {
            this.betsDisplay.innerHTML = this.renderCurrentBets(bets);
        }
    }

    /**
     * Update event feed
     * @param {Array} eventFeed - Match events that have actually occurred
     */
    updateEventFeed(eventFeed) {
        if (this.eventFeedContainer) {
            this.eventFeedContainer.innerHTML = this.renderEventFeed(eventFeed);
            
            // Auto-scroll to latest event
            this.eventFeedContainer.scrollTop = 0;
        }
    }

    /**
     * Create error screen when match data is missing
     * @returns {HTMLElement} Error screen element
     */
    createErrorScreen() {
        const errorElement = document.createElement('div');
        errorElement.className = 'match-screen error-screen';
        errorElement.innerHTML = `
            <div class="error-content">
                <h2>Match Not Available</h2>
                <p>Unable to load match data. Please return to lobby and try again.</p>
                <button class="btn-primary" onclick="window.location.reload()">Reload</button>
            </div>
        `;
        return errorElement;
    }

    /**
     * Handle window resize for responsive updates
     */
    handleResize() {
        // Adjust layout for mobile if needed
        if (this.element && typeof window !== 'undefined' && window.innerWidth <= 768) {
            this.element.classList.add('mobile-layout');
        } else if (this.element && typeof window !== 'undefined') {
            this.element.classList.remove('mobile-layout');
        }
    }

    /**
     * Apply CSS styles for the match screen
     */
    applyStyles() {
        if (document.getElementById('match-screen-styles')) return;

        const style = document.createElement('style');
        style.id = 'match-screen-styles';
        style.textContent = `
            /* Match Screen Styles */
            .match-screen {
                min-height: 100vh;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #e2e8f0;
                padding: 20px;
            }

            .match-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(51, 65, 85, 0.3);
                border: 2px solid #475569;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                backdrop-filter: blur(4px);
            }

            .match-info {
                text-align: center;
            }

            .team-display {
                display: flex;
                align-items: center;
                gap: 20px;
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .home-team, .away-team {
                min-width: 120px;
                color: #10b981;
            }

            .match-score {
                font-size: 32px;
                font-weight: 700;
                color: #ffffff;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                padding: 8px 16px;
                border-radius: 8px;
                border: 2px solid #34d399;
            }

            .match-timer {
                font-size: 20px;
                font-weight: 600;
                color: #34d399;
                background: rgba(5, 150, 105, 0.1);
                padding: 8px 16px;
                border-radius: 6px;
                border: 1px solid #059669;
            }

            .match-status {
                display: flex;
                flex-direction: column;
                gap: 12px;
                align-items: flex-end;
            }

            .wallet-section {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 18px;
                font-weight: 600;
            }

            .wallet-label {
                color: #94a3b8;
            }

            .wallet-balance {
                color: #10b981;
                background: rgba(16, 185, 129, 0.1);
                padding: 4px 12px;
                border-radius: 6px;
                border: 1px solid #059669;
            }

            .power-up-section {
                min-height: 40px;
            }

            .power-up-empty {
                color: #64748b;
                font-size: 14px;
                font-style: italic;
            }

            .power-up-button {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border: 2px solid #34d399;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 0 20px rgba(5, 150, 105, 0.5);
                transition: all 0.2s ease;
            }

            .power-up-button:hover {
                box-shadow: 0 0 30px rgba(5, 150, 105, 0.7);
                transform: translateY(-2px);
            }

            .match-content {
                display: grid;
                grid-template-columns: 1fr 300px;
                gap: 24px;
            }

            .betting-section {
                background: rgba(51, 65, 85, 0.3);
                border: 2px solid #475569;
                border-radius: 12px;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .betting-section h3 {
                margin: 0 0 16px 0;
                color: #10b981;
                font-size: 20px;
            }

            .betting-buttons-container {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
            }

            .betting-button {
                flex: 1;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border: 2px solid #34d399;
                color: white;
                padding: 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }

            .betting-button:hover {
                background: linear-gradient(135deg, #047857 0%, #059669 100%);
                box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
                transform: translateY(-2px);
            }

            .betting-button-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }

            .outcome-label {
                font-weight: 600;
                font-size: 16px;
            }

            .odds-display {
                font-size: 18px;
                font-weight: 700;
                color: #34d399;
            }

            .betting-form-container {
                min-height: 200px;
            }

            .betting-form {
                background: rgba(15, 23, 42, 0.8);
                border: 2px solid #059669;
                border-radius: 8px;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .betting-form-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .betting-form-header h4 {
                margin: 0;
                color: #10b981;
            }

            .close-form-btn {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-form-btn:hover {
                color: #e2e8f0;
            }

            .betting-form-content {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .bet-details {
                color: #94a3b8;
                font-weight: 600;
            }

            .bet-amount-section label {
                display: block;
                margin-bottom: 8px;
                color: #e2e8f0;
                font-weight: 600;
            }

            .bet-amount-section input {
                width: 100%;
                padding: 12px;
                border: 2px solid #475569;
                border-radius: 6px;
                background: rgba(15, 23, 42, 0.8);
                color: #e2e8f0;
                font-size: 16px;
            }

            .bet-amount-section input:focus {
                outline: none;
                border-color: #10b981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .potential-winnings {
                color: #10b981;
                font-weight: 600;
                font-size: 18px;
            }

            .betting-form-actions {
                display: flex;
                gap: 12px;
            }

            .match-stats {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .current-bets, .event-feed-section {
                background: rgba(51, 65, 85, 0.3);
                border: 2px solid #475569;
                border-radius: 12px;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .current-bets h4, .event-feed-section h4 {
                margin: 0 0 16px 0;
                color: #10b981;
                font-size: 18px;
            }

            .no-bets, .no-events {
                color: #64748b;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }

            .bet-category h5 {
                margin: 0 0 12px 0;
                color: #94a3b8;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .bet-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 6px;
                border: 1px solid #475569;
                background: rgba(15, 23, 42, 0.5);
            }

            .bet-item.bet-won {
                border-color: #059669;
                background: rgba(5, 150, 105, 0.1);
            }

            .bet-item.bet-lost {
                border-color: #dc2626;
                background: rgba(220, 38, 38, 0.1);
            }

            .bet-info, .bet-details {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .bet-outcome {
                font-weight: 600;
                color: #e2e8f0;
            }

            .bet-stake, .bet-odds {
                color: #94a3b8;
                font-size: 14px;
            }

            .bet-potential {
                color: #10b981;
                font-weight: 600;
            }

            .event-feed {
                max-height: 400px;
                overflow-y: auto;
            }

            .event-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 6px;
                border-left: 4px solid #475569;
                background: rgba(15, 23, 42, 0.5);
            }

            .event-item.event-goal {
                border-left-color: #10b981;
                background: rgba(16, 185, 129, 0.1);
            }

            .event-item.event-action-bet {
                border-left-color: #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }

            .event-item.event-resolution {
                border-left-color: #f59e0b;
                background: rgba(245, 158, 11, 0.1);
            }

            .event-time {
                font-weight: 600;
                color: #10b981;
                min-width: 40px;
            }

            .event-description {
                flex: 1;
                color: #e2e8f0;
            }

            .event-outcome {
                font-weight: 600;
                color: #34d399;
            }

            .error-screen {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }

            .error-content {
                text-align: center;
                background: rgba(51, 65, 85, 0.3);
                border: 2px solid #dc2626;
                border-radius: 12px;
                padding: 40px;
                backdrop-filter: blur(4px);
            }

            .error-content h2 {
                color: #dc2626;
                margin-bottom: 16px;
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .match-screen {
                    padding: 16px;
                }

                .match-header {
                    flex-direction: column;
                    gap: 16px;
                    text-align: center;
                }

                .team-display {
                    flex-direction: column;
                    gap: 8px;
                    font-size: 20px;
                }

                .match-score {
                    font-size: 28px;
                }

                .match-content {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .betting-buttons-container {
                    flex-direction: column;
                }

                .betting-form-actions {
                    flex-direction: column;
                }

                .match-status {
                    align-items: center;
                }
            }

            /* Touch-friendly interactions */
            @media (hover: none) and (pointer: coarse) {
                .betting-button:hover {
                    transform: none;
                }

                .betting-button:active {
                    transform: scale(0.98);
                }

                .power-up-button:hover {
                    transform: none;
                }

                .power-up-button:active {
                    transform: scale(0.98);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Cleanup resources when screen is destroyed
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.stateManager = null;
        this.fullMatchBetting = null;
        this.eventFeedContainer = null;
        this.walletDisplay = null;
        this.powerUpDisplay = null;
        this.timerDisplay = null;
        this.scoreDisplay = null;
        this.teamDisplay = null;
        this.oddsDisplay = null;
        this.betsDisplay = null;
        this.isInitialized = false;
    }
}