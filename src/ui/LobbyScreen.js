/**
 * LobbyScreen - Match selection interface with wallet display and classic mode toggle
 * Handles match selection and auto-join functionality
 */
export class LobbyScreen {
    constructor() {
        this.stateManager = null;
        this.element = null;
        this.availableMatches = [];
        this.selectedMatch = null;
        this.callbacks = {};
        
        // Generate available matches
        this.generateAvailableMatches();
    }

    /**
     * Initialize the lobby screen with state manager
     */
    initialize(stateManager) {
        console.log('LobbyScreen: Initializing with stateManager:', stateManager);
        this.stateManager = stateManager;
        
        // Subscribe to state changes
        if (this.stateManager) {
            console.log('LobbyScreen: StateManager subscribe method:', typeof this.stateManager.subscribe);
            if (typeof this.stateManager.subscribe === 'function') {
                this.stateManager.subscribe((state) => {
                    this.handleStateChange(state);
                });
                console.log('LobbyScreen: Successfully subscribed to state changes');
            } else {
                console.error('LobbyScreen: StateManager.subscribe is not a function');
            }
        } else {
            console.error('LobbyScreen: No stateManager provided');
        }
    }

    /**
     * Set callback functions for lobby events
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Generate available matches for selection
     */
    generateAvailableMatches() {
        const teams = [
            'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United',
            'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
            'Crystal Palace', 'Fulham', 'Brentford', 'Wolves', 'Everton',
            'Nottingham Forest', 'Bournemouth', 'Sheffield United', 'Burnley', 'Luton'
        ];

        this.availableMatches = [];
        
        // Generate 3-5 random matches
        const numMatches = 3 + Math.floor(Math.random() * 3);
        const usedTeams = new Set();
        
        for (let i = 0; i < numMatches; i++) {
            let homeTeam, awayTeam;
            
            // Ensure unique teams
            do {
                homeTeam = teams[Math.floor(Math.random() * teams.length)];
            } while (usedTeams.has(homeTeam));
            usedTeams.add(homeTeam);
            
            do {
                awayTeam = teams[Math.floor(Math.random() * teams.length)];
            } while (usedTeams.has(awayTeam));
            usedTeams.add(awayTeam);
            
            // Generate realistic odds with some variation
            const baseOdds = { home: 1.85, draw: 3.50, away: 4.20 };
            const variation = 0.3;
            
            const match = {
                id: `match_${i + 1}`,
                homeTeam,
                awayTeam,
                odds: {
                    home: Math.max(1.20, baseOdds.home + (Math.random() - 0.5) * variation),
                    draw: Math.max(2.50, baseOdds.draw + (Math.random() - 0.5) * variation),
                    away: Math.max(1.20, baseOdds.away + (Math.random() - 0.5) * variation)
                },
                status: 'available',
                kickoff: this.generateKickoffTime()
            };
            
            // Round odds to 2 decimal places
            match.odds.home = Math.round(match.odds.home * 100) / 100;
            match.odds.draw = Math.round(match.odds.draw * 100) / 100;
            match.odds.away = Math.round(match.odds.away * 100) / 100;
            
            this.availableMatches.push(match);
        }
    }

    /**
     * Generate realistic kickoff time
     */
    generateKickoffTime() {
        const now = new Date();
        const minutes = Math.floor(Math.random() * 60) + 5; // 5-65 minutes from now
        const kickoff = new Date(now.getTime() + minutes * 60000);
        
        return kickoff.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    /**
     * Render the lobby screen
     */
    render(state = {}) {
        // Inject styles if not already present
        injectLobbyStyles();
        
        const element = document.createElement('div');
        element.className = 'lobby-screen';
        element.innerHTML = this.getHTML(state);
        
        this.element = element;
        this.setupEventListeners();
        
        return element;
    }

    /**
     * Get HTML content for lobby screen
     */
    getHTML(state) {
        const wallet = state.wallet || 1000;
        const classicMode = state.classicMode || false;
        
        return `
            <div class="lobby-container">
                <header class="lobby-header">
                    <h1 class="lobby-title">
                        <span class="title-icon">⚽</span>
                        Soccer Betting Game
                    </h1>
                    <div class="lobby-stats">
                        <div class="wallet-display">
                            <span class="wallet-label">Balance:</span>
                            <span class="wallet-amount">$<span class="wallet-balance">${wallet.toFixed(2)}</span></span>
                        </div>
                        <div class="classic-mode-toggle">
                            <label class="toggle-label">
                                <input type="checkbox" id="classic-mode-checkbox" ${classicMode ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                                <span class="toggle-text">Classic Mode</span>
                            </label>
                            <div class="classic-mode-info">
                                <span class="info-icon">ℹ️</span>
                                <span class="info-text">Disables power-up system</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="lobby-main">
                    <section class="matches-section">
                        <h2 class="section-title">Available Matches</h2>
                        <div class="matches-grid">
                            ${this.availableMatches.map(match => this.renderMatchCard(match)).join('')}
                        </div>
                    </section>

                    <section class="game-info">
                        <div class="info-card">
                            <h3 class="info-title">How to Play</h3>
                            <ul class="info-list">
                                <li><strong>Full Match Betting:</strong> Bet on match outcome anytime during the game</li>
                                <li><strong>Action Betting:</strong> Quick 10-second opportunities during match events</li>
                                <li><strong>Power-ups:</strong> Win action bets to earn 2x multipliers (disabled in Classic Mode)</li>
                                <li><strong>Match Duration:</strong> Each match lasts 90 simulated minutes</li>
                            </ul>
                        </div>
                    </section>
                </main>
            </div>
        `;
    }

    /**
     * Render individual match card
     */
    renderMatchCard(match) {
        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-header">
                    <div class="match-teams">
                        <span class="home-team">${match.homeTeam}</span>
                        <span class="vs">vs</span>
                        <span class="away-team">${match.awayTeam}</span>
                    </div>
                    <div class="match-kickoff">
                        <span class="kickoff-label">Kickoff:</span>
                        <span class="kickoff-time">${match.kickoff}</span>
                    </div>
                </div>
                
                <div class="match-odds">
                    <div class="odds-header">Match Odds</div>
                    <div class="odds-grid">
                        <div class="odds-item">
                            <span class="odds-label">Home</span>
                            <span class="odds-value">${match.odds.home.toFixed(2)}</span>
                        </div>
                        <div class="odds-item">
                            <span class="odds-label">Draw</span>
                            <span class="odds-value">${match.odds.draw.toFixed(2)}</span>
                        </div>
                        <div class="odds-item">
                            <span class="odds-label">Away</span>
                            <span class="odds-value">${match.odds.away.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="match-actions">
                    <button class="btn btn-primary join-match-btn" data-match-id="${match.id}">
                        Join Match
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for lobby interactions
     */
    setupEventListeners() {
        if (!this.element) return;

        // Classic mode toggle
        const classicModeCheckbox = this.element.querySelector('#classic-mode-checkbox');
        if (classicModeCheckbox) {
            classicModeCheckbox.addEventListener('change', (event) => {
                this.handleClassicModeToggle(event.target.checked);
            });
        }

        // Match selection buttons
        const joinButtons = this.element.querySelectorAll('.join-match-btn');
        joinButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const matchId = event.target.dataset.matchId;
                this.handleMatchSelection(matchId);
            });
        });

        // Match card hover effects (for desktop)
        const matchCards = this.element.querySelectorAll('.match-card');
        matchCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });

        // Keyboard navigation
        this.element.addEventListener('keydown', (event) => {
            this.handleKeyboardNavigation(event);
        });
    }

    /**
     * Handle classic mode toggle
     */
    handleClassicModeToggle(enabled) {
        if (this.stateManager) {
            this.stateManager.updateState({
                classicMode: enabled
            });
        }
        
        // Show notification about classic mode change
        const message = enabled 
            ? 'Classic Mode enabled - Power-ups disabled' 
            : 'Classic Mode disabled - Power-ups enabled';
        
        if (window.uiManager) {
            window.uiManager.showNotification(message, 'info', 'Mode Changed');
        }
    }

    /**
     * Handle match selection and auto-join
     */
    handleMatchSelection(matchId) {
        const match = this.availableMatches.find(m => m.id === matchId);
        if (!match) {
            console.error('Match not found:', matchId);
            return;
        }

        this.selectedMatch = match;
        
        // Show loading state
        if (window.uiManager) {
            window.uiManager.showLoading('Joining match...');
        }

        // Simulate brief loading delay for better UX
        setTimeout(() => {
            this.joinMatch(match);
        }, 800);
    }

    /**
     * Join selected match and initialize match state
     */
    joinMatch(match) {
        if (!this.stateManager) {
            console.error('StateManager not available');
            return;
        }

        try {
            // Start the match through GameController
            if (window.gameController && typeof window.gameController.startMatch === 'function') {
                console.log('LobbyScreen: Starting match through GameController:', match);
                window.gameController.startMatch(match);
            } else {
                console.error('GameController not available or startMatch method missing');
                
                // Fallback: just update state (for backwards compatibility)
                this.stateManager.updateState({
                    currentScreen: 'match',
                    'match.active': true,
                    'match.time': 0,
                    'match.homeTeam': match.homeTeam,
                    'match.awayTeam': match.awayTeam,
                    'match.homeScore': 0,
                    'match.awayScore': 0,
                    'match.odds': match.odds,
                    'match.initialOdds': { ...match.odds },
                    'match.timeline': []
                });
            }

            // Hide loading state
            if (window.uiManager) {
                window.uiManager.hideLoading();
                window.uiManager.showNotification(
                    `Joined ${match.homeTeam} vs ${match.awayTeam}`,
                    'success',
                    'Match Joined'
                );
            }

        } catch (error) {
            console.error('Failed to join match:', error);
            
            if (window.uiManager) {
                window.uiManager.hideLoading();
                window.uiManager.showNotification(
                    'Failed to join match. Please try again.',
                    'error',
                    'Join Failed'
                );
            }
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        const focusableElements = this.element.querySelectorAll(
            'button, input, [tabindex]:not([tabindex="-1"])'
        );
        
        if (event.key === 'Enter' && event.target.classList.contains('match-card')) {
            const joinButton = event.target.querySelector('.join-match-btn');
            if (joinButton) {
                joinButton.click();
            }
        }
    }

    /**
     * Update lobby screen with new state
     */
    update(state) {
        if (!this.element) return;

        // Update wallet display
        const walletElement = this.element.querySelector('.wallet-balance');
        if (walletElement && state.wallet !== undefined) {
            walletElement.textContent = state.wallet.toFixed(2);
        }

        // Update classic mode toggle
        const classicModeCheckbox = this.element.querySelector('#classic-mode-checkbox');
        if (classicModeCheckbox && state.classicMode !== undefined) {
            classicModeCheckbox.checked = state.classicMode;
        }
    }

    /**
     * Handle state changes from StateManager
     */
    handleStateChange(state) {
        // Only update if we're still on the lobby screen
        if (state.currentScreen === 'lobby') {
            this.update(state);
        }
    }

    /**
     * Handle window resize for responsive design
     */
    handleResize() {
        // Adjust layout for mobile/desktop
        if (this.element) {
            const isMobile = window.innerWidth <= 768;
            this.element.classList.toggle('mobile-layout', isMobile);
        }
    }

    /**
     * Get available matches (for testing)
     */
    getAvailableMatches() {
        return [...this.availableMatches];
    }

    /**
     * Refresh available matches
     */
    refreshMatches() {
        this.generateAvailableMatches();
        
        if (this.element && this.stateManager) {
            const state = this.stateManager.getState();
            const newElement = this.render(state);
            this.element.replaceWith(newElement);
            this.element = newElement;
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        this.stateManager = null;
        this.selectedMatch = null;
        this.availableMatches = [];
    }
}

// Apply lobby-specific styles
const lobbyStyles = `
    /* Lobby Screen Styles */
    .lobby-screen {
        min-height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #e2e8f0;
        padding: 0;
    }

    .lobby-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    /* Header Styles */
    .lobby-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 30px 20px;
        background: rgba(15, 23, 42, 0.8);
        border-radius: 16px;
        border: 2px solid rgba(5, 150, 105, 0.3);
        backdrop-filter: blur(10px);
    }

    .lobby-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 20px 0;
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .title-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 10px;
    }

    .lobby-stats {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        flex-wrap: wrap;
    }

    /* Wallet Display */
    .wallet-display {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .wallet-label {
        color: #94a3b8;
    }

    .wallet-amount {
        color: #10b981;
        font-size: 1.4rem;
        font-weight: 700;
    }

    /* Classic Mode Toggle */
    .classic-mode-toggle {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        font-weight: 600;
    }

    .toggle-label input[type="checkbox"] {
        display: none;
    }

    .toggle-slider {
        width: 50px;
        height: 26px;
        background: #475569;
        border-radius: 13px;
        position: relative;
        transition: all 0.3s ease;
        border: 2px solid #64748b;
    }

    .toggle-slider::before {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #e2e8f0;
        top: 2px;
        left: 2px;
        transition: all 0.3s ease;
    }

    .toggle-label input:checked + .toggle-slider {
        background: #059669;
        border-color: #10b981;
    }

    .toggle-label input:checked + .toggle-slider::before {
        transform: translateX(24px);
        background: #ffffff;
    }

    .classic-mode-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
        color: #94a3b8;
    }

    /* Main Content */
    .lobby-main {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 30px;
        align-items: start;
    }

    .section-title {
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 20px;
        color: #ffffff;
    }

    /* Matches Grid */
    .matches-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }

    .match-card {
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid rgba(71, 85, 105, 0.5);
        border-radius: 12px;
        padding: 20px;
        transition: all 0.3s ease;
        cursor: pointer;
        backdrop-filter: blur(10px);
    }

    .match-card:hover,
    .match-card.hovered {
        border-color: #10b981;
        box-shadow: 0 8px 25px rgba(5, 150, 105, 0.2);
        transform: translateY(-2px);
    }

    .match-header {
        margin-bottom: 16px;
    }

    .match-teams {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .home-team,
    .away-team {
        color: #ffffff;
    }

    .vs {
        color: #94a3b8;
        font-weight: 400;
    }

    .match-kickoff {
        text-align: center;
        font-size: 0.9rem;
        color: #94a3b8;
    }

    .kickoff-time {
        color: #10b981;
        font-weight: 600;
    }

    /* Match Odds */
    .match-odds {
        margin-bottom: 20px;
    }

    .odds-header {
        text-align: center;
        font-weight: 600;
        margin-bottom: 12px;
        color: #e2e8f0;
    }

    .odds-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }

    .odds-item {
        text-align: center;
        padding: 8px;
        background: rgba(71, 85, 105, 0.3);
        border-radius: 6px;
        border: 1px solid rgba(100, 116, 139, 0.5);
    }

    .odds-label {
        display: block;
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 2px;
    }

    .odds-value {
        display: block;
        font-weight: 700;
        color: #10b981;
        font-size: 1.1rem;
    }

    /* Match Actions */
    .match-actions {
        text-align: center;
    }

    .join-match-btn {
        width: 100%;
        padding: 12px 20px;
        font-size: 1rem;
        font-weight: 600;
    }

    /* Game Info */
    .info-card {
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid rgba(71, 85, 105, 0.5);
        border-radius: 12px;
        padding: 24px;
        backdrop-filter: blur(10px);
        position: sticky;
        top: 20px;
    }

    .info-title {
        font-size: 1.4rem;
        font-weight: 600;
        margin-bottom: 16px;
        color: #ffffff;
    }

    .info-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .info-list li {
        margin-bottom: 12px;
        padding-left: 16px;
        position: relative;
        line-height: 1.5;
        color: #e2e8f0;
    }

    .info-list li::before {
        content: '⚽';
        position: absolute;
        left: 0;
        color: #10b981;
    }

    .info-list strong {
        color: #ffffff;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .lobby-container {
            padding: 16px;
        }

        .lobby-header {
            padding: 20px 16px;
            margin-bottom: 24px;
        }

        .lobby-title {
            font-size: 2rem;
        }

        .title-icon {
            font-size: 2.5rem;
        }

        .lobby-stats {
            gap: 20px;
        }

        .lobby-main {
            grid-template-columns: 1fr;
            gap: 20px;
        }

        .matches-grid {
            grid-template-columns: 1fr;
        }

        .match-card {
            padding: 16px;
        }

        .section-title {
            font-size: 1.5rem;
        }

        .info-card {
            position: static;
        }

        /* Touch-friendly interactions */
        .match-card {
            touch-action: manipulation;
        }

        .match-card:active {
            transform: scale(0.98);
        }

        .join-match-btn {
            padding: 16px 20px;
            font-size: 1.1rem;
            min-height: 48px;
        }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .match-card {
            border-width: 3px;
        }

        .odds-item {
            border-width: 2px;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .match-card,
        .toggle-slider,
        .toggle-slider::before {
            transition: none;
        }
    }

    /* Focus styles for accessibility */
    .join-match-btn:focus,
    .toggle-label:focus-within {
        outline: 2px solid #10b981;
        outline-offset: 2px;
    }

    .match-card:focus {
        outline: 2px solid #10b981;
        outline-offset: 4px;
    }
`;

// Function to inject styles when needed
function injectLobbyStyles() {
    if (typeof document !== 'undefined' && !document.getElementById('lobby-screen-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'lobby-screen-styles';
        styleElement.textContent = lobbyStyles;
        document.head.appendChild(styleElement);
    }
}

// Export singleton instance
export const lobbyScreen = new LobbyScreen();