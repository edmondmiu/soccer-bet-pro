/**
 * Game Logic Module
 * 
 * This module contains the core game simulation logic for the Soccer Betting Game.
 * It handles real-time match progression, event processing, and dynamic timeline generation.
 * 
 * Key Responsibilities:
 * - Match lifecycle management (start, tick, end)
 * - Real-time event processing and timeline execution
 * - Dynamic odds calculation based on match state
 * - Match event generation (goals, fouls, action betting opportunities)
 * - Integration with state management for consistent data flow
 * 
 * Game Simulation Flow:
 * 1. startMatch() initializes match state and begins simulation
 * 2. tick() processes each 0.5-second game interval
 * 3. processMatchEvent() handles timeline events as they occur
 * 4. updateOdds() adjusts betting odds based on match progression
 * 5. endMatch() finalizes results and calculates winnings
 * 
 * Timeline Generation:
 * - Creates realistic match events with proper timing
 * - Generates action betting opportunities with multiple outcomes
 * - Balances event frequency for engaging gameplay
 * - Includes resolution events for action bet settlement
 * 
 * @module gameLogic
 * @requires gameState - For centralized state management
 * @requires utils - For utility functions and constants
 * @exports {Function} startMatch - Initializes and starts a match
 * @exports {Function} tick - Processes one game simulation step
 * @exports {Function} processMatchEvent - Handles individual match events
 * @exports {Function} endMatch - Finalizes match and calculates results
 * @exports {Function} updateOdds - Updates betting odds dynamically
 * @exports {Function} generateMatchTimeline - Creates match event timeline
 */

import { 
    getCurrentState, 
    updateState, 
    updateMatchState, 
    adjustWalletBalance,
    addBet,
    updatePowerUpState,
    updateCurrentActionBet
} from './gameState.js';

import { MOCK_MATCHES, formatMatchTime } from './utils.js';

// --- GAME SIMULATION VARIABLES ---

/**
 * Interval ID for the match timer
 * @type {number|null}
 */
let matchInterval = null;

// --- CORE GAME LOGIC FUNCTIONS ---

/**
 * Starts a new match with the provided match data
 * 
 * This function initializes a complete match simulation by:
 * 1. Validating the provided match data
 * 2. Clearing any existing match intervals
 * 3. Resetting match state with new team data
 * 4. Generating a realistic event timeline
 * 5. Starting the real-time simulation interval
 * 6. Switching to the match screen
 * 
 * The match runs in real-time with events processed every 0.5 seconds,
 * creating an engaging simulation experience. Error handling ensures
 * graceful failure if initialization problems occur.
 * 
 * @param {Object} matchData - Match data containing team information
 * @param {string} matchData.home - Home team name (required)
 * @param {string} matchData.away - Away team name (required)
 * @throws {Error} Logs errors but doesn't throw, shows user-friendly messages
 * @example
 * // Start a match between two teams
 * startMatch({
 *   home: 'Quantum Strikers',
 *   away: 'Celestial FC'
 * });
 */
export function startMatch(matchData) {
    try {
        // Validate match data
        if (!matchData || typeof matchData !== 'object') {
            console.error('Invalid match data:', matchData);
            if (window.addEventToFeed) {
                window.addEventToFeed("Failed to start match: Invalid match data", "text-red-400");
            }
            return;
        }
        
        if (!matchData.home || !matchData.away || typeof matchData.home !== 'string' || typeof matchData.away !== 'string') {
            console.error('Invalid team names in match data:', matchData);
            if (window.addEventToFeed) {
                window.addEventToFeed("Failed to start match: Invalid team names", "text-red-400");
            }
            return;
        }
        
        // Clear any existing interval
        if (matchInterval) {
            clearInterval(matchInterval);
            matchInterval = null;
        }
        
        resetMatchState(matchData);
        updateState({ currentScreen: 'match' });
        
        // Start match interval with error handling
        matchInterval = setInterval(() => {
            try {
                tick();
            } catch (tickError) {
                console.error('Error in match tick:', tickError);
                if (window.addEventToFeed) {
                    window.addEventToFeed("Match simulation error occurred", "text-red-400");
                }
                // Stop the interval on critical errors
                if (matchInterval) {
                    clearInterval(matchInterval);
                    matchInterval = null;
                }
            }
        }, 500);
        
        // Notify that match has started (for UI updates)
        try {
            if (window.render) {
                window.render();
            }
        } catch (renderError) {
            console.error('Error rendering after match start:', renderError);
        }
    } catch (error) {
        console.error('Error starting match:', error);
        if (window.addEventToFeed) {
            window.addEventToFeed("Failed to start match. Please try again.", "text-red-400");
        }
    }
}

/**
 * Processes one game tick representing 0.5 seconds of real match time
 * 
 * This is the heart of the match simulation, called every 500ms during active matches.
 * Each tick advances the match time by 1 minute and processes any scheduled events.
 * 
 * Tick Processing Steps:
 * 1. Increment match time by 1 minute
 * 2. Process any timeline events scheduled for current time
 * 3. Update betting odds every 5 minutes
 * 4. Check for match completion (90 minutes)
 * 5. Update UI displays (time, score)
 * 
 * Error Handling:
 * - Individual event processing errors don't stop the match
 * - Critical errors stop the simulation and notify the user
 * - UI update errors are logged but don't affect game logic
 * 
 * @throws {Error} Critical errors stop the match interval
 * @see processMatchEvent For individual event handling
 * @see updateOdds For odds calculation logic
 * @see endMatch For match completion handling
 */
export function tick() {
    try {
        const state = getCurrentState();
        
        if (!state || !state.match) {
            console.error('Invalid state in tick function');
            return;
        }
        
        const newTime = state.match.time + 1;
        
        // Update match time with validation
        if (typeof newTime !== 'number' || newTime < 0) {
            console.error('Invalid time calculation:', newTime);
            return;
        }
        
        updateMatchState({ time: newTime });
        
        // Process any events scheduled for this time
        try {
            if (Array.isArray(state.match.timeline)) {
                const eventsToProcess = state.match.timeline.filter(event => event && event.time === newTime);
                eventsToProcess.forEach(event => {
                    try {
                        processMatchEvent(event);
                    } catch (eventError) {
                        console.error('Error processing match event:', eventError, event);
                    }
                });
            }
        } catch (timelineError) {
            console.error('Error processing match timeline:', timelineError);
        }

        // Update odds every 5 game minutes
        try {
            if (newTime % 5 === 0) {
                updateOdds();
            }
        } catch (oddsError) {
            console.error('Error updating odds:', oddsError);
        }

        // End match at 90 minutes
        if (newTime >= 90) {
            try {
                endMatch();
            } catch (endError) {
                console.error('Error ending match:', endError);
            }
        }
        
        // Update UI time and score display
        try {
            if (window.renderMatchTimeAndScore) {
                window.renderMatchTimeAndScore();
            }
        } catch (renderError) {
            console.error('Error rendering match time and score:', renderError);
        }
    } catch (error) {
        console.error('Critical error in tick function:', error);
        // Stop the match on critical errors
        if (matchInterval) {
            clearInterval(matchInterval);
            matchInterval = null;
        }
        if (window.addEventToFeed) {
            window.addEventToFeed("Match simulation stopped due to error", "text-red-400");
        }
    }
}

/**
 * Processes a match event and updates game state accordingly
 * @param {Object} event - The match event to process
 * @param {number} event.time - Time when event occurs
 * @param {string} event.type - Type of event (GOAL, MULTI_CHOICE_ACTION_BET, RESOLUTION, etc.)
 * @param {string} event.description - Event description for display
 * @param {string} [event.team] - Team involved in the event (HOME/AWAY)
 * @param {string} [event.betType] - Type of bet for betting events
 * @param {string} [event.result] - Result for resolution events
 */
export function processMatchEvent(event) {
    const state = getCurrentState();
    
    // Add event to feed for display
    if (window.addEventToFeed) {
        window.addEventToFeed(event.description);
    }
    
    switch(event.type) {
        case 'GOAL':
            // Update score based on which team scored
            if (event.team === 'HOME') {
                updateMatchState({ homeScore: state.match.homeScore + 1 });
            } else if (event.team === 'AWAY') {
                updateMatchState({ awayScore: state.match.awayScore + 1 });
            }
            break;
            
        case 'MULTI_CHOICE_ACTION_BET':
            // Show action betting modal if not in classic mode and no active action bet
            if (!state.classicMode && !state.currentActionBet.active) {
                if (window.showMultiChoiceActionBet) {
                    window.showMultiChoiceActionBet(event);
                }
            }
            break;
            
        case 'RESOLUTION':
            // Resolve any pending action bets
            if (window.resolveBets) {
                window.resolveBets(event.betType, event.result);
            }
            break;
            
        default:
            // Handle other event types (COMMENTARY, KICK_OFF, etc.)
            break;
    }
}

/**
 * Ends the current match and processes final results
 * Calculates winnings, updates wallet, and shows match end modal
 */
export function endMatch() {
    const state = getCurrentState();
    
    // Clear the match interval
    if (matchInterval) {
        clearInterval(matchInterval);
        matchInterval = null;
    }
    
    // Clear any active action bet timeouts
    if (state.currentActionBet.timeoutId) {
        clearTimeout(state.currentActionBet.timeoutId);
        updateCurrentActionBet({ timeoutId: null });
    }
    
    // Mark match as inactive
    updateMatchState({ active: false });
    
    // Add final whistle event to feed
    if (window.addEventToFeed) {
        window.addEventToFeed("The referee blows the final whistle. Full Time!");
    }
    
    // Determine final match outcome
    let finalOutcome;
    if (state.match.homeScore > state.match.awayScore) {
        finalOutcome = 'HOME';
    } else if (state.match.homeScore < state.match.awayScore) {
        finalOutcome = 'AWAY';
    } else {
        finalOutcome = 'DRAW';
    }

    // Calculate total winnings from full match bets
    let totalWinnings = 0;
    const updatedFullMatchBets = state.bets.fullMatch.map(bet => {
        const won = bet.outcome === finalOutcome;
        if (won) {
            totalWinnings += bet.stake * bet.odds;
        }
        return { ...bet, status: won ? 'WON' : 'LOST' };
    });

    // Apply power-up multiplier if active
    let resultMessage;
    if (totalWinnings > 0) {
        if (state.powerUp.applied) {
            const originalWinnings = totalWinnings;
            totalWinnings *= 2;
            resultMessage = `YOU WON! Your 2x Power-Up turned $${originalWinnings.toFixed(2)} into $${totalWinnings.toFixed(2)}!`;
        } else {
            resultMessage = `Congratulations! You won a total of $${totalWinnings.toFixed(2)}!`;
        }
        adjustWalletBalance(totalWinnings);
    } else {
        resultMessage = "None of your full match bets won. Better luck next time.";
    }
    
    // Update bet statuses in state
    updateState({
        bets: {
            ...state.bets,
            fullMatch: updatedFullMatchBets
        }
    });
    
    // Update match end modal content
    if (document.getElementById('match-end-score')) {
        document.getElementById('match-end-score').textContent = `Final Score: ${state.match.homeScore} - ${state.match.awayScore}`;
    }
    if (document.getElementById('match-end-winnings')) {
        document.getElementById('match-end-winnings').innerHTML = resultMessage;
    }
    
    // Render end game summary
    if (window.renderEndGameSummary) {
        window.renderEndGameSummary(finalOutcome);
    }
    
    // Trigger win animation if profitable
    const updatedState = getCurrentState();
    if (updatedState.wallet > state.match.initialWallet) {
        if (window.triggerWinAnimation) {
            window.triggerWinAnimation();
        }
    }

    // Show match end modal
    const matchEndModal = document.getElementById('match-end-modal');
    if (matchEndModal) {
        matchEndModal.classList.remove('hidden');
    }
}

/**
 * Updates betting odds based on current match state
 * Odds change dynamically based on score and time progression
 */
export function updateOdds() {
    const state = getCurrentState();
    
    if (!state.match.active) return;
    
    const { time, homeScore, awayScore, odds, initialOdds } = state.match;
    // Calculate time factor (0.0 at start, 1.0 at 90 minutes)
    // This creates progressive odds changes as the match progresses
    const timeFactor = time / 90;

    // Create new odds object to avoid direct mutation of state
    // This maintains immutability principles for predictable state management
    const newOdds = { ...odds };

    if (homeScore > awayScore) {
        // Home team is winning - decrease home odds (more likely), increase others
        // The winning team's odds decrease more aggressively as time progresses
        newOdds.home = Math.max(1.05, initialOdds.home - (initialOdds.home - 1.05) * timeFactor * 1.5);
        newOdds.draw = initialOdds.draw + 2 * timeFactor; // Draw becomes less likely
        newOdds.away = initialOdds.away + 3 * timeFactor; // Away win becomes much less likely
    } else if (awayScore > homeScore) {
        // Away team is winning - decrease away odds (more likely), increase others
        // Mirror logic of home team winning scenario
        newOdds.away = Math.max(1.05, initialOdds.away - (initialOdds.away - 1.05) * timeFactor * 1.5);
        newOdds.draw = initialOdds.draw + 2 * timeFactor; // Draw becomes less likely
        newOdds.home = initialOdds.home + 3 * timeFactor; // Home win becomes much less likely
    } else {
        // Match is tied - draw becomes more likely as time runs out
        // Both teams' win odds decrease slightly, draw odds decrease significantly
        newOdds.home = initialOdds.home - (initialOdds.home * 0.1 * timeFactor);
        newOdds.away = initialOdds.away - (initialOdds.away * 0.1 * timeFactor);
        // Draw odds decrease as it becomes more likely (lower odds = higher probability)
        newOdds.draw = Math.max(1.5, initialOdds.draw - (initialOdds.draw - 1.5) * timeFactor);
    }
    
    // Update odds in state
    updateMatchState({ odds: newOdds });
    
    // Update odds display in UI
    if (window.renderOdds) {
        window.renderOdds();
    }
}

/**
 * Generates a realistic timeline of events for a match
 * 
 * This function creates a dynamic, engaging match experience by generating
 * a variety of events with realistic timing and frequency. The algorithm
 * balances entertainment value with believable soccer match flow.
 * 
 * Event Generation Strategy:
 * - Events are spaced 8-18 minutes apart for realistic pacing
 * - 20% chance of goals (distributed between teams)
 * - 45% chance of action betting opportunities (fouls with outcomes)
 * - 35% chance of commentary events (near misses, saves, etc.)
 * - Action bets include resolution events 4 minutes later
 * 
 * Event Types Generated:
 * - KICK_OFF: Match start event
 * - GOAL: Scoring events with team attribution
 * - MULTI_CHOICE_ACTION_BET: Interactive betting opportunities
 * - RESOLUTION: Action bet outcome determination
 * - COMMENTARY: Atmospheric match events
 * 
 * @param {Object} matchData - Match data containing team information
 * @param {string} matchData.home - Home team name for event descriptions
 * @param {string} matchData.away - Away team name for event descriptions
 * @returns {Array<Object>} Array of match events sorted chronologically
 * @returns {number} returns[].time - Event time in match minutes
 * @returns {string} returns[].type - Event type identifier
 * @returns {string} returns[].description - Human-readable event description
 * @returns {string} [returns[].team] - Team involved (for goals)
 * @returns {string} [returns[].betType] - Bet type (for action bets)
 * @returns {Array} [returns[].choices] - Available bet choices
 * @example
 * // Generate timeline for a match
 * const timeline = generateMatchTimeline({
 *   home: 'Team A',
 *   away: 'Team B'
 * });
 * // Returns events like:
 * // [{ time: 1, type: 'KICK_OFF', description: 'The match has kicked off!' }]
 */
export function generateMatchTimeline(matchData) {
    let timeline = [];
    
    // Add kick-off event
    timeline.push({ 
        time: 1, 
        type: 'KICK_OFF', 
        description: 'The match has kicked off!' 
    });

    // Generate random event times throughout the match
    // Events are spaced 8-18 minutes apart for realistic match pacing
    let eventTimes = new Set();
    for (let time = 5; time < 90; time += (Math.floor(Math.random() * 10) + 8)) {
        if (time > 88) break; // Prevent events too close to full time
        eventTimes.add(time);
    }
    
    // Create events for each time slot with weighted probabilities
    // This creates a balanced mix of goals, action bets, and commentary
    Array.from(eventTimes).sort((a, b) => a - b).forEach(time => {
        const rand = Math.random();
        
        if (rand < 0.20) {
            // 20% chance of goal - the most exciting and impactful events
            const team = Math.random() > 0.5 ? 'HOME' : 'AWAY';
            const teamName = team === 'HOME' ? matchData.home : matchData.away;
            timeline.push({ 
                time, 
                type: 'GOAL', 
                team, 
                description: `GOAL! A stunning strike for the ${teamName}!` 
            });
        } else if (rand < 0.65) {
            // 45% chance of action betting opportunity (foul scenario)
            // These create interactive betting moments during the match
            const foulOutcomes = [
                { result: 'Yellow Card', text: 'The ref shows a Yellow Card!', odds: 2.5 },
                { result: 'Red Card', text: 'It\'s a RED CARD! The player is off!', odds: 8.0 },
                { result: 'Warning', text: 'The referee gives a stern warning.', odds: 1.5 },
            ];
            
            // Determine the actual outcome using weighted probabilities
            // This creates realistic referee decision distribution
            const outcomeRand = Math.random();
            let chosenOutcome;
            if (outcomeRand < 0.6) {
                chosenOutcome = foulOutcomes[0]; // Yellow Card - 60% (most common)
            } else if (outcomeRand < 0.9) {
                chosenOutcome = foulOutcomes[2]; // Warning - 30% (second most common)
            } else {
                chosenOutcome = foulOutcomes[1]; // Red Card - 10% (rare but high impact)
            }

            // Add the action betting event
            timeline.push({
                time,
                type: 'MULTI_CHOICE_ACTION_BET',
                betType: 'FOUL_OUTCOME',
                description: 'Crunching tackle near the box! What will the ref do?',
                choices: [
                    { text: 'Yellow Card', odds: 2.5 },
                    { text: 'Red Card', odds: 8.0 },
                    { text: 'Warning', odds: 1.5 },
                ],
            });
            
            // Add the resolution event a few seconds later
            timeline.push({ 
                time: time + 4, 
                type: 'RESOLUTION', 
                betType: 'FOUL_OUTCOME', 
                result: chosenOutcome.result, 
                description: chosenOutcome.text 
            });
        } else {
            // 35% chance of general commentary event
            const eventTypes = [
                'A great save by the keeper!', 
                'The shot goes just wide!', 
                'A crunching tackle in midfield.', 
                'A promising attack breaks down.'
            ];
            timeline.push({ 
                time, 
                type: 'COMMENTARY', 
                description: eventTypes[Math.floor(Math.random() * eventTypes.length)] 
            });
        }
    });
    
    // Sort timeline by time and return
    return timeline.sort((a, b) => a.time - b.time);
}

// --- HELPER FUNCTIONS ---

/**
 * Resets match state for a new game
 * @param {Object} matchData - Match data containing team information
 * @private
 */
function resetMatchState(matchData) {
    const state = getCurrentState();
    
    // Reset match state
    updateMatchState({
        active: true,
        time: 0,
        homeScore: 0,
        awayScore: 0,
        homeTeam: matchData.home,
        awayTeam: matchData.away,
        timeline: generateMatchTimeline(matchData),
        odds: { home: 1.85, draw: 3.50, away: 4.20 },
        initialOdds: { home: 1.85, draw: 3.50, away: 4.20 },
        initialWallet: state.wallet,
    });
    
    // Reset betting state
    updateState({
        bets: { fullMatch: [], actionBets: [] }
    });
    
    // Reset power-up state
    updatePowerUpState({ held: null, applied: false });
    
    // Clear UI elements
    const eventFeed = document.getElementById('event-feed');
    if (eventFeed) {
        eventFeed.innerHTML = '';
    }
    
    const matchTimer = document.getElementById('match-timer');
    if (matchTimer) {
        matchTimer.textContent = '00:00';
    }
    
    const matchScore = document.getElementById('match-score');
    if (matchScore) {
        matchScore.textContent = '0 - 0';
    }
}

/**
 * Returns to the lobby screen and cleans up match state
 */
export function backToLobby() {
    // Clear match interval
    if (matchInterval) {
        clearInterval(matchInterval);
        matchInterval = null;
    }
    
    // Clear any active action bet timeouts
    const state = getCurrentState();
    if (state.currentActionBet.timeoutId) {
        clearTimeout(state.currentActionBet.timeoutId);
        updateCurrentActionBet({ timeoutId: null });
    }
    
    // Update screen to lobby
    updateState({ currentScreen: 'lobby' });
    
    // Trigger UI update
    if (window.render) {
        window.render();
    }
}

/**
 * Gets the current match interval ID (for external cleanup if needed)
 * @returns {number|null} Current match interval ID
 */
export function getMatchInterval() {
    return matchInterval;
}

/**
 * Clears the match interval (for external cleanup)
 */
export function clearMatchInterval() {
    if (matchInterval) {
        clearInterval(matchInterval);
        matchInterval = null;
    }
}