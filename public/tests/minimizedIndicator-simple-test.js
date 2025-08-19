/**
 * Simple Node.js test for MinimizedIndicator component
 * Tests core functionality without external test framework
 */

// Mock DOM environment for Node.js testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const MinimizedIndicator = require('../scripts/minimizedIndicator.js');

// Simple test framework
let testCount = 0;
let passCount = 0;

function test(description, testFn) {
    testCount++;
    try {
        testFn();
        console.log(`✓ ${description}`);
        passCount++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected truthy value, got ${actual}`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected falsy value, got ${actual}`);
            }
        },
        toContain: (expected) => {
            if (!actual.includes(expected)) {
                throw new Error(`Expected "${actual}" to contain "${expected}"`);
            }
        }
    };
}

// Run tests
console.log('Running MinimizedIndicator tests...\n');

// Test initialization
test('should create indicator element with correct structure', () => {
    const indicator = new MinimizedIndicator();
    expect(indicator.element).toBeTruthy();
    expect(indicator.element.className).toBe('minimized-indicator');
    expect(indicator.timeElement).toBeTruthy();
    expect(indicator.eventTypeElement).toBeTruthy();
    indicator.destroy();
});

test('should start hidden', () => {
    const indicator = new MinimizedIndicator();
    expect(indicator.isVisible).toBe(false);
    expect(indicator.element.style.display).toBe('none');
    indicator.destroy();
});

// Test show functionality
test('should display indicator with event type and time', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    
    expect(indicator.isVisible).toBe(true);
    expect(indicator.eventType).toBe('CORNER_OUTCOME');
    expect(indicator.timeRemaining).toBe(10);
    expect(indicator.eventTypeElement.textContent).toBe('Corner Kick');
    expect(indicator.timeElement.textContent).toBe('10s');
    indicator.destroy();
});

// Test time updates
test('should update time remaining display', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    indicator.updateTime(7);
    
    expect(indicator.timeRemaining).toBe(7);
    expect(indicator.timeElement.textContent).toBe('7s');
    indicator.destroy();
});

test('should round up fractional seconds', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    indicator.updateTime(3.2);
    
    expect(indicator.timeElement.textContent).toBe('4s');
    indicator.destroy();
});

// Test urgency effects
test('should not be urgent initially', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    
    expect(indicator.isUrgent).toBe(false);
    expect(indicator.element.classList.contains('urgent')).toBe(false);
    indicator.destroy();
});

test('should become urgent when time <= 5 seconds', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    indicator.updateTime(5);
    
    expect(indicator.isUrgent).toBe(true);
    expect(indicator.element.classList.contains('urgent')).toBe(true);
    indicator.destroy();
});

// Test hide functionality
test('should hide the indicator', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    indicator.hide();
    
    expect(indicator.isVisible).toBe(false);
    indicator.destroy();
});

// Test positioning
test('should allow custom positioning', () => {
    const indicator = new MinimizedIndicator();
    indicator.position(100, 50);
    
    expect(indicator.element.style.left).toBe('100px');
    expect(indicator.element.style.top).toBe('50px');
    indicator.destroy();
});

// Test getters
test('should return correct visibility state', () => {
    const indicator = new MinimizedIndicator();
    expect(indicator.isShowing()).toBe(false);
    
    indicator.show('CORNER_OUTCOME', 10);
    expect(indicator.isShowing()).toBe(true);
    
    indicator.hide();
    expect(indicator.isShowing()).toBe(false);
    indicator.destroy();
});

test('should return correct time remaining', () => {
    const indicator = new MinimizedIndicator();
    indicator.show('CORNER_OUTCOME', 10);
    expect(indicator.getTimeRemaining()).toBe(10);
    
    indicator.updateTime(7);
    expect(indicator.getTimeRemaining()).toBe(7);
    indicator.destroy();
});

// Test event type formatting
test('should format known event types', () => {
    const indicator = new MinimizedIndicator();
    const formatted = indicator.formatEventType('CORNER_OUTCOME');
    expect(formatted).toBe('Corner Kick');
    indicator.destroy();
});

test('should format unknown event types', () => {
    const indicator = new MinimizedIndicator();
    const result = indicator.formatEventType('CUSTOM_EVENT_TYPE');
    expect(result).toBe('Custom Event Type');
    indicator.destroy();
});

// Test destroy
test('should clean up when destroyed', () => {
    const indicator = new MinimizedIndicator();
    const element = indicator.element;
    expect(document.body.contains(element)).toBe(true);
    
    indicator.destroy();
    expect(document.body.contains(element)).toBe(false);
    expect(indicator.element).toBe(null);
});

// Test click handling
test('should handle click events', () => {
    const indicator = new MinimizedIndicator();
    let clicked = false;
    
    indicator.onClick(() => {
        clicked = true;
    });
    
    indicator.show('CORNER_OUTCOME', 10);
    indicator.element.click();
    
    expect(clicked).toBe(true);
    indicator.destroy();
});

// Summary
console.log(`\nTest Results: ${passCount}/${testCount} tests passed`);

if (passCount === testCount) {
    console.log('✓ All tests passed!');
    process.exit(0);
} else {
    console.log('✗ Some tests failed');
    process.exit(1);
}