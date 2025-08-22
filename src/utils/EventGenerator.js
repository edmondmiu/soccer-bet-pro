/**
 * EventGenerator - Generates realistic match events and timeline
 * Implements event distribution logic and spacing algorithms
 */

export class EventGenerator {
    constructor() {
        // Event distribution percentages
        this.EVENT_DISTRIBUTION = {
            GOALS: 0.20,        // 20% goals
            ACTION_BETS: 0.45,  // 45% action betting opportunities
            COMMENTARY: 0.35    // 35% commentary events
        };

        // Event spacing configuration (8-18 minutes apart)
        this.MIN_EVENT_SPACING = 8;
        this.MAX_EVENT_SPACING = 18;

        // Match duration in minutes
        this.MATCH_DURATION = 90;

        // Event type constants
        this.EVENT_TYPES = {
            GOAL: 'GOAL',
            ACTION_BET: 'ACTION_BET',
            COMMENTARY: 'COMMENTARY'
        };

        // Predefined event templates
        this.initializeEventTemplates();
    }

    /**
     * Generates a complete match timeline with realistic event distribution
     * @returns {Array} Array of match events sorted by time
     */
    generateMatchTimeline() {
        const events = [];
        const eventTimes = this.generateEventTimes();
        
        // Determine event types based on distribution
        const eventTypes = this.distributeEventTypes(eventTimes.length);
        
        // Generate events for each time slot
        eventTimes.forEach((time, index) => {
            const eventType = eventTypes[index];
            const event = this.generateEvent(eventType, time);
            if (event) {
                events.push(event);
            }
        });

        // Sort events by time
        events.sort((a, b) => a.time - b.time);
        
        console.log(`Generated ${events.length} events for match timeline:`, events);
        return events;
    }

    /**
     * Generates event times with proper spacing (8-18 minutes apart)
     * @returns {Array} Array of event times in minutes
     */
    generateEventTimes() {
        const times = [];
        let currentTime = this.getRandomSpacing(); // Start with random offset
        
        while (currentTime < this.MATCH_DURATION) {
            times.push(Math.round(currentTime));
            currentTime += this.getRandomSpacing();
        }
        
        return times;
    }

    /**
     * Gets a random spacing between events (8-18 minutes)
     * @returns {number} Random spacing in minutes
     */
    getRandomSpacing() {
        return this.MIN_EVENT_SPACING + 
               Math.random() * (this.MAX_EVENT_SPACING - this.MIN_EVENT_SPACING);
    }

    /**
     * Distributes event types based on the defined percentages
     * @param {number} totalEvents - Total number of events to distribute
     * @returns {Array} Array of event types
     */
    distributeEventTypes(totalEvents) {
        const types = [];
        
        // Calculate counts for each type
        const goalCount = Math.round(totalEvents * this.EVENT_DISTRIBUTION.GOALS);
        const actionBetCount = Math.round(totalEvents * this.EVENT_DISTRIBUTION.ACTION_BETS);
        const commentaryCount = totalEvents - goalCount - actionBetCount;
        
        // Add events to array
        for (let i = 0; i < goalCount; i++) {
            types.push(this.EVENT_TYPES.GOAL);
        }
        for (let i = 0; i < actionBetCount; i++) {
            types.push(this.EVENT_TYPES.ACTION_BET);
        }
        for (let i = 0; i < commentaryCount; i++) {
            types.push(this.EVENT_TYPES.COMMENTARY);
        }
        
        // Shuffle the array to randomize event order
        return this.shuffleArray(types);
    }

    /**
     * Generates a specific event based on type and time
     * @param {string} eventType - Type of event to generate
     * @param {number} time - Time in minutes when event occurs
     * @returns {Object} Generated event object
     */
    generateEvent(eventType, time) {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        switch (eventType) {
            case this.EVENT_TYPES.GOAL:
                return this.generateGoalEvent(eventId, time);
            case this.EVENT_TYPES.ACTION_BET:
                return this.generateActionBetEvent(eventId, time);
            case this.EVENT_TYPES.COMMENTARY:
                return this.generateCommentaryEvent(eventId, time);
            default:
                console.warn('Unknown event type:', eventType);
                return null;
        }
    }

    /**
     * Generates a goal event
     * @param {string} id - Event ID
     * @param {number} time - Event time in minutes
     * @returns {Object} Goal event object
     */
    generateGoalEvent(id, time) {
        const team = Math.random() < 0.5 ? 'home' : 'away';
        const player = this.getRandomPlayer();
        
        return {
            id,
            type: this.EVENT_TYPES.GOAL,
            time,
            description: `⚽ GOAL! ${player} scores for the ${team} team!`,
            data: {
                team,
                player,
                goalType: this.getRandomGoalType()
            }
        };
    }

    /**
     * Generates an action betting event
     * @param {string} id - Event ID
     * @param {number} time - Event time in minutes
     * @returns {Object} Action betting event object
     */
    generateActionBetEvent(id, time) {
        const template = this.getRandomActionBetTemplate();
        
        return {
            id,
            type: this.EVENT_TYPES.ACTION_BET,
            time,
            description: template.description,
            data: {
                choices: template.choices,
                category: template.category
            }
        };
    }

    /**
     * Generates a commentary event
     * @param {string} id - Event ID
     * @param {number} time - Event time in minutes
     * @returns {Object} Commentary event object
     */
    generateCommentaryEvent(id, time) {
        const template = this.getRandomCommentaryTemplate();
        
        return {
            id,
            type: this.EVENT_TYPES.COMMENTARY,
            time,
            description: template.description,
            data: {
                category: template.category,
                intensity: template.intensity
            }
        };
    }

    /**
     * Initializes event templates for different types of events
     */
    initializeEventTemplates() {
        this.actionBetTemplates = [
            {
                category: 'corner',
                description: 'Corner kick awarded! Will it result in a goal?',
                choices: [
                    { outcome: 'goal', description: 'Goal from corner', odds: 4.5 },
                    { outcome: 'shot', description: 'Shot on target', odds: 2.8 },
                    { outcome: 'cleared', description: 'Corner cleared safely', odds: 1.6 }
                ]
            },
            {
                category: 'freekick',
                description: 'Free kick in dangerous position! What happens next?',
                choices: [
                    { outcome: 'goal', description: 'Direct free kick goal', odds: 5.2 },
                    { outcome: 'wall', description: 'Hits the wall', odds: 2.1 },
                    { outcome: 'save', description: 'Goalkeeper saves', odds: 2.4 }
                ]
            },
            {
                category: 'attack',
                description: 'Dangerous attack developing! How does it end?',
                choices: [
                    { outcome: 'goal', description: 'Goal scored!', odds: 3.8 },
                    { outcome: 'save', description: 'Great save by keeper', odds: 2.2 },
                    { outcome: 'miss', description: 'Shot goes wide', odds: 2.0 }
                ]
            },
            {
                category: 'penalty',
                description: 'PENALTY! What will be the outcome?',
                choices: [
                    { outcome: 'goal', description: 'Penalty scored', odds: 1.4 },
                    { outcome: 'save', description: 'Penalty saved!', odds: 4.8 },
                    { outcome: 'miss', description: 'Penalty missed!', odds: 6.2 }
                ]
            },
            {
                category: 'card',
                description: 'Referee reaches for his pocket! What card?',
                choices: [
                    { outcome: 'yellow', description: 'Yellow card shown', odds: 1.8 },
                    { outcome: 'red', description: 'Red card!', odds: 4.5 },
                    { outcome: 'warning', description: 'Just a warning', odds: 2.3 }
                ]
            }
        ];

        this.commentaryTemplates = [
            {
                category: 'possession',
                description: 'Good passing move in midfield',
                intensity: 'low'
            },
            {
                category: 'defense',
                description: 'Solid defensive work to break up the attack',
                intensity: 'medium'
            },
            {
                category: 'crowd',
                description: 'The crowd is getting behind their team!',
                intensity: 'medium'
            },
            {
                category: 'weather',
                description: 'Playing conditions remain good for football',
                intensity: 'low'
            },
            {
                category: 'substitution',
                description: 'The manager is considering a tactical change',
                intensity: 'medium'
            },
            {
                category: 'pressure',
                description: 'Building pressure as we approach the final third',
                intensity: 'high'
            },
            {
                category: 'tempo',
                description: 'The pace of the game is picking up now',
                intensity: 'medium'
            },
            {
                category: 'tactics',
                description: 'Interesting tactical battle developing',
                intensity: 'low'
            }
        ];

        this.playerNames = [
            'Rodriguez', 'Silva', 'Johnson', 'Martinez', 'Anderson', 'Wilson',
            'Garcia', 'Brown', 'Davis', 'Miller', 'Taylor', 'Thomas',
            'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore'
        ];

        this.goalTypes = [
            'header', 'right_foot', 'left_foot', 'volley', 'tap_in', 'long_shot'
        ];
    }

    /**
     * Gets a random action betting template
     * @returns {Object} Random action betting template
     */
    getRandomActionBetTemplate() {
        return this.actionBetTemplates[
            Math.floor(Math.random() * this.actionBetTemplates.length)
        ];
    }

    /**
     * Gets a random commentary template
     * @returns {Object} Random commentary template
     */
    getRandomCommentaryTemplate() {
        return this.commentaryTemplates[
            Math.floor(Math.random() * this.commentaryTemplates.length)
        ];
    }

    /**
     * Gets a random player name
     * @returns {string} Random player name
     */
    getRandomPlayer() {
        return this.playerNames[
            Math.floor(Math.random() * this.playerNames.length)
        ];
    }

    /**
     * Gets a random goal type
     * @returns {string} Random goal type
     */
    getRandomGoalType() {
        return this.goalTypes[
            Math.floor(Math.random() * this.goalTypes.length)
        ];
    }

    /**
     * Shuffles an array using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Validates event distribution percentages
     * @returns {boolean} True if distribution is valid
     */
    validateDistribution() {
        const total = this.EVENT_DISTRIBUTION.GOALS + 
                     this.EVENT_DISTRIBUTION.ACTION_BETS + 
                     this.EVENT_DISTRIBUTION.COMMENTARY;
        
        return Math.abs(total - 1.0) < 0.001; // Allow for floating point precision
    }

    /**
     * Gets statistics about generated events
     * @param {Array} events - Array of events to analyze
     * @returns {Object} Event statistics
     */
    getEventStatistics(events) {
        const stats = {
            total: events.length,
            goals: 0,
            actionBets: 0,
            commentary: 0,
            averageSpacing: 0,
            spacings: []
        };

        // Count event types
        events.forEach(event => {
            switch (event.type) {
                case this.EVENT_TYPES.GOAL:
                    stats.goals++;
                    break;
                case this.EVENT_TYPES.ACTION_BET:
                    stats.actionBets++;
                    break;
                case this.EVENT_TYPES.COMMENTARY:
                    stats.commentary++;
                    break;
            }
        });

        // Calculate spacing statistics
        for (let i = 1; i < events.length; i++) {
            const spacing = events[i].time - events[i-1].time;
            stats.spacings.push(spacing);
        }

        if (stats.spacings.length > 0) {
            stats.averageSpacing = stats.spacings.reduce((a, b) => a + b, 0) / stats.spacings.length;
            stats.minSpacing = Math.min(...stats.spacings);
            stats.maxSpacing = Math.max(...stats.spacings);
        }

        // Calculate percentages
        stats.goalPercentage = (stats.goals / stats.total * 100).toFixed(1);
        stats.actionBetPercentage = (stats.actionBets / stats.total * 100).toFixed(1);
        stats.commentaryPercentage = (stats.commentary / stats.total * 100).toFixed(1);

        return stats;
    }
}