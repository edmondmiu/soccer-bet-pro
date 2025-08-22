/**
 * EventGenerator Tests
 * Tests for realistic match timeline creation and event distribution
 */

import { EventGenerator } from './EventGenerator.js';

describe('EventGenerator', () => {
    let eventGenerator;

    beforeEach(() => {
        eventGenerator = new EventGenerator();
    });

    describe('Event Distribution Configuration', () => {
        test('should have correct event distribution percentages', () => {
            expect(eventGenerator.EVENT_DISTRIBUTION.GOALS).toBe(0.20);
            expect(eventGenerator.EVENT_DISTRIBUTION.ACTION_BETS).toBe(0.45);
            expect(eventGenerator.EVENT_DISTRIBUTION.COMMENTARY).toBe(0.35);
        });

        test('should have valid distribution that sums to 1.0', () => {
            expect(eventGenerator.validateDistribution()).toBe(true);
        });

        test('should have correct spacing configuration', () => {
            expect(eventGenerator.MIN_EVENT_SPACING).toBe(8);
            expect(eventGenerator.MAX_EVENT_SPACING).toBe(18);
        });

        test('should have correct match duration', () => {
            expect(eventGenerator.MATCH_DURATION).toBe(90);
        });
    });

    describe('Event Time Generation', () => {
        test('should generate event times within match duration', () => {
            const times = eventGenerator.generateEventTimes();
            
            times.forEach(time => {
                expect(time).toBeGreaterThanOrEqual(0);
                expect(time).toBeLessThan(90);
            });
        });

        test('should generate events with proper spacing', () => {
            const times = eventGenerator.generateEventTimes();
            
            for (let i = 1; i < times.length; i++) {
                const spacing = times[i] - times[i-1];
                expect(spacing).toBeGreaterThanOrEqual(8);
                expect(spacing).toBeLessThanOrEqual(18);
            }
        });

        test('should generate reasonable number of events', () => {
            const times = eventGenerator.generateEventTimes();
            
            // With 8-18 minute spacing, should have roughly 5-11 events in 90 minutes
            expect(times.length).toBeGreaterThanOrEqual(3);
            expect(times.length).toBeLessThanOrEqual(15);
        });

        test('should generate different event times on multiple calls', () => {
            const times1 = eventGenerator.generateEventTimes();
            const times2 = eventGenerator.generateEventTimes();
            
            // Should be different (very unlikely to be identical)
            expect(times1).not.toEqual(times2);
        });
    });

    describe('Event Type Distribution', () => {
        test('should distribute event types according to percentages', () => {
            const totalEvents = 20;
            const types = eventGenerator.distributeEventTypes(totalEvents);
            
            expect(types).toHaveLength(totalEvents);
            
            const goalCount = types.filter(type => type === 'GOAL').length;
            const actionBetCount = types.filter(type => type === 'ACTION_BET').length;
            const commentaryCount = types.filter(type => type === 'COMMENTARY').length;
            
            // Allow for rounding differences
            expect(goalCount).toBeCloseTo(totalEvents * 0.20, 0);
            expect(actionBetCount).toBeCloseTo(totalEvents * 0.45, 0);
            expect(commentaryCount).toBeCloseTo(totalEvents * 0.35, 0);
        });

        test('should randomize event type order', () => {
            const types1 = eventGenerator.distributeEventTypes(10);
            const types2 = eventGenerator.distributeEventTypes(10);
            
            // Should be different order (very unlikely to be identical)
            expect(types1).not.toEqual(types2);
        });

        test('should handle edge case of very few events', () => {
            const types = eventGenerator.distributeEventTypes(3);
            
            expect(types).toHaveLength(3);
            expect(types.every(type => 
                ['GOAL', 'ACTION_BET', 'COMMENTARY'].includes(type)
            )).toBe(true);
        });
    });

    describe('Timeline Generation', () => {
        test('should generate complete match timeline', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            
            expect(Array.isArray(timeline)).toBe(true);
            expect(timeline.length).toBeGreaterThan(0);
        });

        test('should generate events with proper structure', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            
            timeline.forEach(event => {
                expect(event).toHaveProperty('id');
                expect(event).toHaveProperty('type');
                expect(event).toHaveProperty('time');
                expect(event).toHaveProperty('description');
                expect(event).toHaveProperty('data');
                
                expect(typeof event.id).toBe('string');
                expect(typeof event.type).toBe('string');
                expect(typeof event.time).toBe('number');
                expect(typeof event.description).toBe('string');
                expect(typeof event.data).toBe('object');
            });
        });

        test('should sort events by time', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            
            for (let i = 1; i < timeline.length; i++) {
                expect(timeline[i].time).toBeGreaterThanOrEqual(timeline[i-1].time);
            }
        });

        test('should generate events of all types', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            
            const types = timeline.map(event => event.type);
            const uniqueTypes = [...new Set(types)];
            
            // Should have at least 2 different types in a reasonable timeline
            expect(uniqueTypes.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Goal Event Generation', () => {
        test('should generate valid goal events', () => {
            const goalEvent = eventGenerator.generateGoalEvent('test_id', 25);
            
            expect(goalEvent.id).toBe('test_id');
            expect(goalEvent.type).toBe('GOAL');
            expect(goalEvent.time).toBe(25);
            expect(goalEvent.description).toContain('GOAL!');
            expect(goalEvent.data).toHaveProperty('team');
            expect(goalEvent.data).toHaveProperty('player');
            expect(goalEvent.data).toHaveProperty('goalType');
            
            expect(['home', 'away']).toContain(goalEvent.data.team);
            expect(typeof goalEvent.data.player).toBe('string');
        });

        test('should generate different goal events', () => {
            const goal1 = eventGenerator.generateGoalEvent('id1', 25);
            const goal2 = eventGenerator.generateGoalEvent('id2', 45);
            
            // Should have different players or teams (very likely)
            expect(goal1.data.player !== goal2.data.player || 
                   goal1.data.team !== goal2.data.team).toBe(true);
        });
    });

    describe('Action Bet Event Generation', () => {
        test('should generate valid action bet events', () => {
            const actionBetEvent = eventGenerator.generateActionBetEvent('test_id', 30);
            
            expect(actionBetEvent.id).toBe('test_id');
            expect(actionBetEvent.type).toBe('ACTION_BET');
            expect(actionBetEvent.time).toBe(30);
            expect(typeof actionBetEvent.description).toBe('string');
            expect(actionBetEvent.data).toHaveProperty('choices');
            expect(actionBetEvent.data).toHaveProperty('category');
            
            expect(Array.isArray(actionBetEvent.data.choices)).toBe(true);
            expect(actionBetEvent.data.choices.length).toBeGreaterThan(0);
        });

        test('should generate choices with proper structure', () => {
            const actionBetEvent = eventGenerator.generateActionBetEvent('test_id', 30);
            
            actionBetEvent.data.choices.forEach(choice => {
                expect(choice).toHaveProperty('outcome');
                expect(choice).toHaveProperty('description');
                expect(choice).toHaveProperty('odds');
                
                expect(typeof choice.outcome).toBe('string');
                expect(typeof choice.description).toBe('string');
                expect(typeof choice.odds).toBe('number');
                expect(choice.odds).toBeGreaterThan(1);
            });
        });

        test('should use predefined action bet templates', () => {
            const actionBetEvent = eventGenerator.generateActionBetEvent('test_id', 30);
            
            const validCategories = ['corner', 'freekick', 'attack', 'penalty', 'card'];
            expect(validCategories).toContain(actionBetEvent.data.category);
        });
    });

    describe('Commentary Event Generation', () => {
        test('should generate valid commentary events', () => {
            const commentaryEvent = eventGenerator.generateCommentaryEvent('test_id', 20);
            
            expect(commentaryEvent.id).toBe('test_id');
            expect(commentaryEvent.type).toBe('COMMENTARY');
            expect(commentaryEvent.time).toBe(20);
            expect(typeof commentaryEvent.description).toBe('string');
            expect(commentaryEvent.data).toHaveProperty('category');
            expect(commentaryEvent.data).toHaveProperty('intensity');
        });

        test('should use predefined commentary templates', () => {
            const commentaryEvent = eventGenerator.generateCommentaryEvent('test_id', 20);
            
            const validCategories = [
                'possession', 'defense', 'crowd', 'weather', 
                'substitution', 'pressure', 'tempo', 'tactics'
            ];
            expect(validCategories).toContain(commentaryEvent.data.category);
            
            const validIntensities = ['low', 'medium', 'high'];
            expect(validIntensities).toContain(commentaryEvent.data.intensity);
        });
    });

    describe('Random Spacing Generation', () => {
        test('should generate spacing within defined range', () => {
            for (let i = 0; i < 100; i++) {
                const spacing = eventGenerator.getRandomSpacing();
                expect(spacing).toBeGreaterThanOrEqual(8);
                expect(spacing).toBeLessThanOrEqual(18);
            }
        });

        test('should generate different spacing values', () => {
            const spacings = [];
            for (let i = 0; i < 10; i++) {
                spacings.push(eventGenerator.getRandomSpacing());
            }
            
            // Should have some variation (very unlikely to all be the same)
            const uniqueSpacings = [...new Set(spacings.map(s => Math.floor(s)))];
            expect(uniqueSpacings.length).toBeGreaterThan(1);
        });
    });

    describe('Utility Methods', () => {
        test('should shuffle arrays properly', () => {
            const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const shuffled = eventGenerator.shuffleArray(original);
            
            expect(shuffled).toHaveLength(original.length);
            expect(shuffled.sort()).toEqual(original.sort());
            
            // Should be different order (very unlikely to be the same)
            expect(shuffled).not.toEqual(original);
        });

        test('should get random player names', () => {
            const player1 = eventGenerator.getRandomPlayer();
            const player2 = eventGenerator.getRandomPlayer();
            
            expect(typeof player1).toBe('string');
            expect(typeof player2).toBe('string');
            expect(player1.length).toBeGreaterThan(0);
        });

        test('should get random goal types', () => {
            const goalType = eventGenerator.getRandomGoalType();
            
            const validTypes = ['header', 'right_foot', 'left_foot', 'volley', 'tap_in', 'long_shot'];
            expect(validTypes).toContain(goalType);
        });
    });

    describe('Event Statistics', () => {
        test('should calculate correct event statistics', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            const stats = eventGenerator.getEventStatistics(timeline);
            
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('goals');
            expect(stats).toHaveProperty('actionBets');
            expect(stats).toHaveProperty('commentary');
            expect(stats).toHaveProperty('averageSpacing');
            expect(stats).toHaveProperty('goalPercentage');
            expect(stats).toHaveProperty('actionBetPercentage');
            expect(stats).toHaveProperty('commentaryPercentage');
            
            expect(stats.total).toBe(timeline.length);
            expect(stats.goals + stats.actionBets + stats.commentary).toBe(stats.total);
        });

        test('should calculate spacing statistics', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            const stats = eventGenerator.getEventStatistics(timeline);
            
            if (timeline.length > 1) {
                expect(stats.averageSpacing).toBeGreaterThan(0);
                expect(stats.minSpacing).toBeGreaterThanOrEqual(0);
                expect(stats.maxSpacing).toBeGreaterThan(stats.minSpacing);
                expect(stats.spacings).toHaveLength(timeline.length - 1);
            }
        });

        test('should calculate percentages correctly', () => {
            const timeline = eventGenerator.generateMatchTimeline();
            const stats = eventGenerator.getEventStatistics(timeline);
            
            const totalPercentage = parseFloat(stats.goalPercentage) + 
                                  parseFloat(stats.actionBetPercentage) + 
                                  parseFloat(stats.commentaryPercentage);
            
            expect(totalPercentage).toBeCloseTo(100, 0);
        });
    });

    describe('Template Validation', () => {
        test('should have valid action bet templates', () => {
            expect(eventGenerator.actionBetTemplates).toBeDefined();
            expect(Array.isArray(eventGenerator.actionBetTemplates)).toBe(true);
            expect(eventGenerator.actionBetTemplates.length).toBeGreaterThan(0);
            
            eventGenerator.actionBetTemplates.forEach(template => {
                expect(template).toHaveProperty('category');
                expect(template).toHaveProperty('description');
                expect(template).toHaveProperty('choices');
                expect(Array.isArray(template.choices)).toBe(true);
                expect(template.choices.length).toBeGreaterThan(0);
            });
        });

        test('should have valid commentary templates', () => {
            expect(eventGenerator.commentaryTemplates).toBeDefined();
            expect(Array.isArray(eventGenerator.commentaryTemplates)).toBe(true);
            expect(eventGenerator.commentaryTemplates.length).toBeGreaterThan(0);
            
            eventGenerator.commentaryTemplates.forEach(template => {
                expect(template).toHaveProperty('category');
                expect(template).toHaveProperty('description');
                expect(template).toHaveProperty('intensity');
            });
        });

        test('should have player names and goal types', () => {
            expect(Array.isArray(eventGenerator.playerNames)).toBe(true);
            expect(eventGenerator.playerNames.length).toBeGreaterThan(0);
            
            expect(Array.isArray(eventGenerator.goalTypes)).toBe(true);
            expect(eventGenerator.goalTypes.length).toBeGreaterThan(0);
        });
    });
});

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
    console.log('EventGenerator tests defined. Run with a test runner like Jest.');
}