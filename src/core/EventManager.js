/**
 * EventManager - Manages match timeline generation and event processing
 * Coordinates match events and handles event distribution logic
 */

import { EventGenerator } from '../utils/EventGenerator.js';

export class EventManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.eventGenerator = new EventGenerator();
        this.currentEventIndex = 0;
        this.eventProcessingTimer = null;
        this.resolutionTimers = new Map(); // Track action bet resolution timers
        
        // Event type constants
        this.EVENT_TYPES = {
            GOAL: 'GOAL',
            ACTION_BET: 'ACTION_BET',
            COMMENTARY: 'COMMENTARY',
            RESOLUTION: 'RESOLUTION'
        };
    }

    /**
     * Generates a complete match timeline with realistic event distribution
     * @returns {Array} Array of match events
     */
    generateTimeline() {
        const timeline = this.eventGenerator.generateMatchTimeline();
        
        // Update state with the generated timeline
        this.stateManager.updateState({
            match: {
                ...this.stateManager.getState().match,
                timeline: timeline
            }
        });

        this.currentEventIndex = 0;
        return timeline;
    }

    /**
     * Starts processing events based on match timer
     */
    startEventProcessing() {
        if (this.eventProcessingTimer) {
            clearInterval(this.eventProcessingTimer);
        }

        // Check for events every second
        this.eventProcessingTimer = setInterval(() => {
            this.checkForEvents();
        }, 1000);
    }

    /**
     * Stops event processing
     */
    stopEventProcessing() {
        if (this.eventProcessingTimer) {
            clearInterval(this.eventProcessingTimer);
            this.eventProcessingTimer = null;
        }

        // Clear any pending resolution timers
        this.resolutionTimers.forEach(timer => clearTimeout(timer));
        this.resolutionTimers.clear();
    }

    /**
     * Checks if any events should be triggered at current match time
     */
    checkForEvents() {
        const state = this.stateManager.getState();
        const currentTime = state.match.time;
        const timeline = state.match.timeline;

        // Process all events that should have occurred by now
        while (this.currentEventIndex < timeline.length) {
            const event = timeline[this.currentEventIndex];
            
            if (event.time <= currentTime) {
                console.log(`EventManager: Processing event at ${event.time}min (current time: ${currentTime.toFixed(2)}min)`);
                this.processEvent(event);
                this.currentEventIndex++;
            } else {
                break; // No more events to process yet
            }
        }
    }

    /**
     * Processes a single match event
     * @param {Object} event - The event to process
     */
    processEvent(event) {
        console.log(`Processing event at ${event.time}min:`, event);

        switch (event.type) {
            case this.EVENT_TYPES.GOAL:
                this.processGoalEvent(event);
                break;
            case this.EVENT_TYPES.ACTION_BET:
                this.processActionBetEvent(event);
                break;
            case this.EVENT_TYPES.COMMENTARY:
                this.processCommentaryEvent(event);
                break;
            case this.EVENT_TYPES.RESOLUTION:
                this.processResolutionEvent(event);
                break;
            default:
                console.warn('Unknown event type:', event.type);
        }

        // Add event to match feed (except for action bet events, which are added when processed)
        if (event.type !== this.EVENT_TYPES.ACTION_BET) {
            this.addToEventFeed(event);
        }
    }

    /**
     * Processes a goal event - updates score and odds
     * @param {Object} event - Goal event data
     */
    processGoalEvent(event) {
        const state = this.stateManager.getState();
        const match = state.match;
        
        // Store previous score for comparison
        const previousScore = `${match.homeScore}-${match.awayScore}`;
        
        // Update score
        const newMatch = { ...match };
        if (event.data.team === 'home') {
            newMatch.homeScore += 1;
        } else if (event.data.team === 'away') {
            newMatch.awayScore += 1;
        }

        const newScore = `${newMatch.homeScore}-${newMatch.awayScore}`;

        // Update odds based on new score
        const previousOdds = { ...match.odds };
        newMatch.odds = this.calculateNewOdds(newMatch.homeScore, newMatch.awayScore);

        // Update state with new score and odds
        this.stateManager.updateState({ match: newMatch });

        // Create enhanced goal event for feed
        const goalFeedEntry = {
            ...event,
            description: `⚽ GOAL! ${event.data.player} scores for ${event.data.team}! (${newScore})`,
            data: {
                ...event.data,
                previousScore,
                newScore,
                previousOdds,
                newOdds: newMatch.odds,
                scoringTeam: event.data.team
            }
        };

        // Add goal event to feed
        this.addToEventFeed(goalFeedEntry);

        // Trigger goal celebration event with enhanced data
        this.triggerEvent('goal', {
            team: event.data.team,
            player: event.data.player,
            time: event.time,
            previousScore,
            newScore,
            previousOdds,
            newOdds: newMatch.odds,
            goalType: event.data.goalType
        });

        console.log(`Goal scored! ${event.data.team} team. Score: ${newScore}. Odds updated.`);
    }

    /**
     * Processes an action betting event - triggers pause and betting opportunity
     * @param {Object} event - Action betting event data
     */
    processActionBetEvent(event) {
        // Add action bet event to feed with betting opportunity indicator
        const actionBetFeedEntry = {
            ...event,
            description: `🎯 ${event.description}`,
            data: {
                ...event.data,
                isBettingOpportunity: true
            }
        };
        this.addToEventFeed(actionBetFeedEntry);

        // Trigger action betting opportunity
        this.triggerEvent('actionBettingOpportunity', {
            eventData: event,
            choices: event.data.choices,
            description: event.description
        });

        // Schedule resolution of this action bet in 4 minutes
        this.scheduleActionBetResolution(event);
    }

    /**
     * Processes a commentary event - adds atmosphere without betting impact
     * @param {Object} event - Commentary event data
     */
    processCommentaryEvent(event) {
        // Add commentary icon to make it visually distinct
        const commentaryFeedEntry = {
            ...event,
            description: `💬 ${event.description}`
        };

        // Trigger commentary event for UI updates
        this.triggerEvent('commentary', {
            description: event.description,
            time: event.time,
            category: event.data.category,
            intensity: event.data.intensity
        });
    }

    /**
     * Schedules resolution of an action bet 4 minutes after the event
     * @param {Object} actionBetEvent - The original action betting event
     */
    scheduleActionBetResolution(actionBetEvent) {
        // Calculate resolution time (4 minutes after event)
        const resolutionTime = actionBetEvent.time + 4;
        
        // Create resolution event and add to timeline
        const resolutionEvent = {
            id: `resolution_${actionBetEvent.id}`,
            type: this.EVENT_TYPES.RESOLUTION,
            time: resolutionTime,
            description: `Resolving: ${actionBetEvent.description}`,
            data: {
                originalEventId: actionBetEvent.id,
                originalEvent: actionBetEvent,
                resolutionType: 'actionBet'
            }
        };

        // Add resolution event to timeline
        this.scheduleEvent(resolutionEvent, resolutionTime);
        
        console.log(`Scheduled action bet resolution for event ${actionBetEvent.id} at ${resolutionTime} minutes`);
    }

    /**
     * Processes a resolution event - resolves action bets and processes payouts
     * @param {Object} resolutionEvent - Resolution event data
     */
    processResolutionEvent(resolutionEvent) {
        const originalEvent = resolutionEvent.data?.originalEvent;
        
        if (resolutionEvent.data?.resolutionType === 'actionBet' && originalEvent) {
            this.resolveActionBet(originalEvent, resolutionEvent);
        } else {
            console.warn('Resolution event missing required data:', resolutionEvent);
        }
    }

    /**
     * Resolves an action bet by determining the outcome and processing payouts
     * @param {Object} actionBetEvent - The original action betting event
     * @param {Object} resolutionEvent - The resolution event
     */
    resolveActionBet(actionBetEvent, resolutionEvent) {
        // Randomly determine outcome from available choices
        const choices = actionBetEvent.data.choices;
        const winningChoice = choices[Math.floor(Math.random() * choices.length)];

        // Update resolution event with outcome
        const updatedResolutionEvent = {
            ...resolutionEvent,
            description: `✅ ${winningChoice.description}`,
            data: {
                ...resolutionEvent.data,
                winningOutcome: winningChoice.outcome,
                winningChoice: winningChoice,
                resolved: true
            }
        };

        // Trigger resolution event for betting system to process payouts
        this.triggerEvent('actionBetResolution', {
            originalEvent: actionBetEvent,
            resolution: updatedResolutionEvent,
            winningOutcome: winningChoice.outcome,
            eventId: actionBetEvent.id
        });

        // Add resolution to event feed with outcome
        this.addToEventFeed(updatedResolutionEvent);
        
        console.log(`Action bet resolved for event ${actionBetEvent.id}: ${winningChoice.outcome}`);
    }

    /**
     * Manually schedules an event at a specific time
     * @param {Object} event - Event to schedule
     * @param {number} time - Match time in minutes
     */
    scheduleEvent(event, time) {
        const state = this.stateManager.getState();
        const timeline = [...state.match.timeline];
        
        // Add event to timeline and sort by time
        const scheduledEvent = { ...event, time };
        timeline.push(scheduledEvent);
        timeline.sort((a, b) => a.time - b.time);

        this.stateManager.updateState({
            match: {
                ...state.match,
                timeline: timeline
            }
        });
    }

    /**
     * Calculates new odds based on current score
     * @param {number} homeScore - Home team score
     * @param {number} awayScore - Away team score
     * @returns {Object} New odds object
     */
    calculateNewOdds(homeScore, awayScore) {
        const scoreDiff = homeScore - awayScore;
        
        // Base odds
        let homeOdds = 1.85;
        let drawOdds = 3.50;
        let awayOdds = 4.20;

        // Adjust odds based on score difference
        if (scoreDiff > 0) {
            // Home team leading
            homeOdds = Math.max(1.20, homeOdds - (scoreDiff * 0.3));
            drawOdds = Math.min(5.00, drawOdds + (scoreDiff * 0.4));
            awayOdds = Math.min(8.00, awayOdds + (scoreDiff * 0.6));
        } else if (scoreDiff < 0) {
            // Away team leading
            const absScoreDiff = Math.abs(scoreDiff);
            awayOdds = Math.max(1.20, awayOdds - (absScoreDiff * 0.3));
            drawOdds = Math.min(5.00, drawOdds + (absScoreDiff * 0.4));
            homeOdds = Math.min(8.00, homeOdds + (absScoreDiff * 0.6));
        }

        return {
            home: Math.round(homeOdds * 100) / 100,
            draw: Math.round(drawOdds * 100) / 100,
            away: Math.round(awayOdds * 100) / 100
        };
    }

    /**
     * Adds an event to the match event feed
     * @param {Object} event - Event to add to feed
     */
    addToEventFeed(event) {
        const state = this.stateManager.getState();
        const eventFeed = state.match.eventFeed || [];
        
        const feedEntry = {
            id: event.id,
            time: event.time,
            type: event.type,
            description: event.description,
            data: event.data || {},
            timestamp: Date.now()
        };

        this.stateManager.updateState({
            match: {
                ...state.match,
                eventFeed: [feedEntry, ...eventFeed].slice(0, 20) // Keep last 20 events
            }
        });
    }

    /**
     * Triggers a custom event for other modules to listen to
     * @param {string} eventType - Type of event to trigger
     * @param {Object} eventData - Data to pass with the event
     */
    triggerEvent(eventType, eventData) {
        const customEvent = new CustomEvent(`game:${eventType}`, {
            detail: eventData
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * Gets the next upcoming event
     * @returns {Object|null} Next event or null if no more events
     */
    getNextEvent() {
        const state = this.stateManager.getState();
        const timeline = state.match.timeline;
        
        if (this.currentEventIndex < timeline.length) {
            return timeline[this.currentEventIndex];
        }
        return null;
    }

    /**
     * Gets all events of a specific type
     * @param {string} eventType - Type of events to retrieve
     * @returns {Array} Array of events of the specified type
     */
    getEventsByType(eventType) {
        const state = this.stateManager.getState();
        const timeline = state.match.timeline;
        
        return timeline.filter(event => event.type === eventType);
    }

    /**
     * Gets all pending action bet resolutions
     * @returns {Array} Array of pending resolution events
     */
    getPendingResolutions() {
        const state = this.stateManager.getState();
        const timeline = state.match.timeline;
        const currentTime = state.match.time;
        
        return timeline.filter(event => 
            event.type === this.EVENT_TYPES.RESOLUTION && 
            event.time > currentTime &&
            !event.data.resolved
        );
    }

    /**
     * Gets all resolved action bet events
     * @returns {Array} Array of resolved events
     */
    getResolvedEvents() {
        const state = this.stateManager.getState();
        const timeline = state.match.timeline;
        
        return timeline.filter(event => 
            event.type === this.EVENT_TYPES.RESOLUTION && 
            event.data.resolved
        );
    }

    /**
     * Gets resolution statistics
     * @returns {Object} Resolution statistics
     */
    getResolutionStatistics() {
        const state = this.stateManager.getState();
        const timeline = state.match.timeline;
        
        const actionBetEvents = timeline.filter(event => event.type === this.EVENT_TYPES.ACTION_BET);
        const resolutionEvents = timeline.filter(event => event.type === this.EVENT_TYPES.RESOLUTION);
        const resolvedEvents = resolutionEvents.filter(event => event.data.resolved);
        const pendingResolutions = resolutionEvents.filter(event => !event.data.resolved);
        
        return {
            totalActionBets: actionBetEvents.length,
            totalResolutions: resolutionEvents.length,
            resolvedCount: resolvedEvents.length,
            pendingCount: pendingResolutions.length,
            resolutionRate: actionBetEvents.length > 0 
                ? ((resolvedEvents.length / actionBetEvents.length) * 100).toFixed(1)
                : 0
        };
    }

    /**
     * Forces resolution of a specific action bet (for testing)
     * @param {string} eventId - ID of the action bet event to resolve
     * @param {string} [outcome] - Specific outcome to force (optional)
     * @returns {Object} Resolution result
     */
    forceResolution(eventId, outcome = null) {
        const state = this.stateManager.getState();
        const timeline = state.match.timeline;
        
        // Find the original action bet event
        const actionBetEvent = timeline.find(event => 
            event.type === this.EVENT_TYPES.ACTION_BET && event.id === eventId
        );
        
        if (!actionBetEvent) {
            return { success: false, error: 'Action bet event not found' };
        }

        // Find or create resolution event
        let resolutionEvent = timeline.find(event => 
            event.type === this.EVENT_TYPES.RESOLUTION && 
            event.data.originalEventId === eventId
        );

        if (!resolutionEvent) {
            resolutionEvent = {
                id: `resolution_${eventId}`,
                type: this.EVENT_TYPES.RESOLUTION,
                time: actionBetEvent.time + 4,
                description: `Resolving: ${actionBetEvent.description}`,
                data: {
                    originalEventId: eventId,
                    originalEvent: actionBetEvent,
                    resolutionType: 'actionBet'
                }
            };
        }

        // Force specific outcome if provided
        if (outcome) {
            const choice = actionBetEvent.data.choices.find(c => c.outcome === outcome);
            if (!choice) {
                return { success: false, error: 'Invalid outcome specified' };
            }
            
            // Override random selection
            const originalResolve = this.resolveActionBet;
            this.resolveActionBet = (actionEvent, resEvent) => {
                const winningChoice = choice;
                const updatedResolutionEvent = {
                    ...resEvent,
                    description: `✅ ${winningChoice.description} (Forced)`,
                    data: {
                        ...resEvent.data,
                        winningOutcome: winningChoice.outcome,
                        winningChoice: winningChoice,
                        resolved: true,
                        forced: true
                    }
                };

                this.triggerEvent('actionBetResolution', {
                    originalEvent: actionEvent,
                    resolution: updatedResolutionEvent,
                    winningOutcome: winningChoice.outcome,
                    eventId: actionEvent.id
                });

                this.addToEventFeed(updatedResolutionEvent);
            };
            
            // Process resolution
            this.processResolutionEvent(resolutionEvent);
            
            // Restore original method
            this.resolveActionBet = originalResolve;
        } else {
            // Process normal resolution
            this.processResolutionEvent(resolutionEvent);
        }

        return { success: true, eventId, outcome };
    }

    /**
     * Resets the event manager for a new match
     */
    reset() {
        this.stopEventProcessing();
        this.currentEventIndex = 0;
        this.resolutionTimers.clear();
    }
}