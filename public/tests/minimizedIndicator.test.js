/**
 * Unit tests for MinimizedIndicator component
 * Tests display, time updates, urgency effects, and user interactions
 */

// Mock DOM environment for Node.js testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const MinimizedIndicator = require('../scripts/minimizedIndicator.js');

describe('MinimizedIndicator', () => {
    let indicator;

    beforeEach(() => {
        // Clear any existing indicators
        const existingIndicators = document.querySelectorAll('.minimized-indicator');
        existingIndicators.forEach(el => el.remove());
        
        // Create fresh indicator
        indicator = new MinimizedIndicator();
    });

    afterEach(() => {
        if (indicator) {
            indicator.destroy();
        }
    });

    describe('Initialization', () => {
        test('should create indicator element with correct structure', () => {
            expect(indicator.element).toBeTruthy();
            expect(indicator.element.className).toBe('minimized-indicator');
            expect(indicator.timeElement).toBeTruthy();
            expect(indicator.eventTypeElement).toBeTruthy();
        });

        test('should start hidden', () => {
            expect(indicator.isVisible).toBe(false);
            expect(indicator.element.style.display).toBe('none');
        });

        test('should be positioned in top-right corner by default', () => {
            const styles = indicator.element.style;
            expect(styles.position).toBe('fixed');
            expect(styles.top).toBe('20px');
            expect(styles.right).toBe('20px');
            expect(styles.zIndex).toBe('1000');
        });
    });

    describe('show() method', () => {
        test('should display indicator with event type and time', () => {
            indicator.show('CORNER_OUTCOME', 10);

            expect(indicator.isVisible).toBe(true);
            expect(indicator.eventType).toBe('CORNER_OUTCOME');
            expect(indicator.timeRemaining).toBe(10);
            expect(indicator.eventTypeElement.textContent).toBe('Corner Kick');
            expect(indicator.timeElement.textContent).toBe('10s');
        });

        test('should make element visible', () => {
            indicator.show('GOAL_ATTEMPT', 8);
            expect(indicator.element.style.display).toBe('block');
        });

        test('should format different event types correctly', () => {
            const testCases = [
                ['CORNER_OUTCOME', 'Corner Kick'],
                ['GOAL_ATTEMPT', 'Goal Attempt'],
                ['PENALTY', 'Penalty'],
                ['FREE_KICK', 'Free Kick'],
                ['UNKNOWN_EVENT', 'Unknown Event']
            ];

            testCases.forEach(([eventType, expected]) => {
                indicator.show(eventType, 10);
                expect(indicator.eventTypeElement.textContent).toBe(expected);
            });
        });
    });

    describe('updateTime() method', () => {
        beforeEach(() => {
            indicator.show('CORNER_OUTCOME', 10);
        });

        test('should update time remaining display', () => {
            indicator.updateTime(7);
            expect(indicator.timeRemaining).toBe(7);
            expect(indicator.timeElement.textContent).toBe('7s');
        });

        test('should round up fractional seconds', () => {
            indicator.updateTime(3.2);
            expect(indicator.timeElement.textContent).toBe('4s');
            
            indicator.updateTime(3.8);
            expect(indicator.timeElement.textContent).toBe('4s');
        });

        test('should handle zero time', () => {
            indicator.updateTime(0);
            expect(indicator.timeElement.textContent).toBe('0s');
        });
    });

    describe('hide() method', () => {
        beforeEach(() => {
            indicator.show('CORNER_OUTCOME', 10);
        });

        test('should hide the indicator', () => {
            indicator.hide();
            expect(indicator.isVisible).toBe(false);
        });

        test('should set opacity to 0', () => {
            indicator.hide();
            expect(indicator.element.style.opacity).toBe('0');
        });

        test('should not error when called on already hidden indicator', () => {
            indicator.hide();
            expect(() => indicator.hide()).not.toThrow();
        });
    });

    describe('Urgency effects', () => {
        test('should not be urgent initially', () => {
            indicator.show('CORNER_OUTCOME', 10);
            expect(indicator.isUrgent).toBe(false);
            expect(indicator.element.classList.contains('urgent')).toBe(false);
        });

        test('should become urgent when time <= 5 seconds', () => {
            indicator.show('CORNER_OUTCOME', 10);
            indicator.updateTime(5);
            expect(indicator.isUrgent).toBe(true);
            expect(indicator.element.classList.contains('urgent')).toBe(true);
        });

        test('should apply urgent effects when becoming urgent', () => {
            indicator.show('CORNER_OUTCOME', 10);
            indicator.updateTime(4);
            
            expect(indicator.element.classList.contains('urgent')).toBe(true);
            // Check that urgent style was added to document
            const urgentStyle = document.getElementById('minimized-indicator-urgent-style');
            expect(urgentStyle).toBeTruthy();
        });

        test('should remove urgent effects when no longer urgent', () => {
            indicator.show('CORNER_OUTCOME', 4); // Start urgent
            expect(indicator.isUrgent).toBe(true);
            
            indicator.updateTime(8); // No longer urgent
            expect(indicator.isUrgent).toBe(false);
            expect(indicator.element.classList.contains('urgent')).toBe(false);
        });

        test('should trigger urgent effects at exactly 5 seconds', () => {
            indicator.show('CORNER_OUTCOME', 6);
            expect(indicator.isUrgent).toBe(false);
            
            indicator.updateTime(5);
            expect(indicator.isUrgent).toBe(true);
        });
    });

    describe('Click handling', () => {
        test('should call onClick callback when clicked', () => {
            const mockCallback = jest.fn();
            indicator.onClick(mockCallback);
            indicator.show('CORNER_OUTCOME', 10);

            // Simulate click
            indicator.element.click();
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should not error when clicked without callback', () => {
            indicator.show('CORNER_OUTCOME', 10);
            expect(() => indicator.element.click()).not.toThrow();
        });
    });

    describe('Positioning', () => {
        test('should allow custom positioning', () => {
            indicator.position(100, 50);
            
            expect(indicator.element.style.left).toBe('100px');
            expect(indicator.element.style.top).toBe('50px');
            expect(indicator.element.style.right).toBe('auto');
        });

        test('should maintain positioning after show', () => {
            indicator.position(200, 100);
            indicator.show('CORNER_OUTCOME', 10);
            
            expect(indicator.element.style.left).toBe('200px');
            expect(indicator.element.style.top).toBe('100px');
        });
    });

    describe('Getters', () => {
        test('should return correct visibility state', () => {
            expect(indicator.isShowing()).toBe(false);
            
            indicator.show('CORNER_OUTCOME', 10);
            expect(indicator.isShowing()).toBe(true);
            
            indicator.hide();
            expect(indicator.isShowing()).toBe(false);
        });

        test('should return correct time remaining', () => {
            indicator.show('CORNER_OUTCOME', 10);
            expect(indicator.getTimeRemaining()).toBe(10);
            
            indicator.updateTime(7);
            expect(indicator.getTimeRemaining()).toBe(7);
        });

        test('should return correct event type', () => {
            indicator.show('PENALTY', 10);
            expect(indicator.getEventType()).toBe('PENALTY');
        });
    });

    describe('Event type formatting', () => {
        test('should format known event types', () => {
            const testCases = [
                'CORNER_OUTCOME',
                'GOAL_ATTEMPT', 
                'PENALTY',
                'FREE_KICK',
                'YELLOW_CARD',
                'RED_CARD',
                'SUBSTITUTION',
                'OFFSIDE',
                'FOUL'
            ];

            testCases.forEach(eventType => {
                const formatted = indicator.formatEventType(eventType);
                expect(formatted).toBeTruthy();
                expect(formatted).not.toContain('_');
                expect(formatted[0]).toBe(formatted[0].toUpperCase());
            });
        });

        test('should format unknown event types', () => {
            const result = indicator.formatEventType('CUSTOM_EVENT_TYPE');
            expect(result).toBe('Custom Event Type');
        });
    });

    describe('Destroy', () => {
        test('should remove element from DOM', () => {
            const element = indicator.element;
            expect(document.body.contains(element)).toBe(true);
            
            indicator.destroy();
            expect(document.body.contains(element)).toBe(false);
        });

        test('should clean up urgent styles', () => {
            indicator.show('CORNER_OUTCOME', 4); // Make urgent
            expect(document.getElementById('minimized-indicator-urgent-style')).toBeTruthy();
            
            indicator.destroy();
            expect(document.getElementById('minimized-indicator-urgent-style')).toBeFalsy();
        });

        test('should reset all properties', () => {
            indicator.show('CORNER_OUTCOME', 10);
            indicator.destroy();
            
            expect(indicator.element).toBe(null);
            expect(indicator.timeElement).toBe(null);
            expect(indicator.eventTypeElement).toBe(null);
            expect(indicator.onClickCallback).toBe(null);
            expect(indicator.isVisible).toBe(false);
        });
    });

    describe('Edge cases', () => {
        test('should handle rapid time updates', () => {
            indicator.show('CORNER_OUTCOME', 10);
            
            for (let i = 10; i >= 0; i -= 0.1) {
                expect(() => indicator.updateTime(i)).not.toThrow();
            }
        });

        test('should handle negative time values', () => {
            indicator.show('CORNER_OUTCOME', 10);
            indicator.updateTime(-1);
            
            expect(indicator.timeElement.textContent).toBe('0s');
        });

        test('should handle very large time values', () => {
            indicator.show('CORNER_OUTCOME', 999999);
            expect(indicator.timeElement.textContent).toBe('999999s');
        });

        test('should handle empty event type', () => {
            indicator.show('', 10);
            expect(indicator.eventTypeElement.textContent).toBe('');
        });
    });
});