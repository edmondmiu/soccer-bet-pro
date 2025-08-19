/**
 * Tests for Betting Modal Minimize Functionality
 * 
 * This test suite verifies the minimize/restore behavior of betting modals
 * according to requirements 1.1, 1.2, 1.3, 1.4, and 5.3.
 */

// Mock DOM elements and dependencies
const mockDOM = {
    elements: {},
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        style: {},
        innerHTML: '',
        textContent: '',
        onclick: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
        },
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        contains: jest.fn(() => false)
    }),
    getElementById: (id) => mockDOM.elements[id] || null,
    querySelector: (selector) => mockDOM.elements[selector] || null
};

// Mock global objects
global.document = mockDOM;
global.window = {
    MinimizedIndicator: class MockMinimizedIndicator {
        constructor() {
            this.isVisible = false;
            this.eventType = null;
            this.timeRemaining = 0;
            this.clickHandler = null;
        }
        
        show(eventType, timeRemaining) {
            this.isVisible = true;
            this.eventType = eventType;
            this.timeRemaining = timeRemaining;
        }
        
        hide() {
            this.isVisible = false;
        }
        
        updateTime(remaining) {
            this.timeRemaining = remaining;
        }
        
        setUrgent(urgent) {
            this.urgent = urgent;
        }
        
        onClick(handler) {
            this.clickHandler = handler;
        }
    },
    addEventToFeed: jest.fn()
};

// Mock timer functions
global.setTimeout = jest.fn((fn, delay) => {
    const id = Math.random();
    // Execute immediately for testing
    if (delay <= 100) {
        fn();
    }
    return id;
});
global.clearTimeout = jest.fn();
global.setInterval = jest.fn((fn, delay) => Math.random());
global.clearInterval = jest.fn();

// Mock console methods
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

// Mock Date.now for consistent timing
const mockNow = 1000000;
global.Date = {
    now: jest.fn(() => mockNow)
};

// Import modules after mocking
const gameState = require('../scripts/gameState.js');
const betting = require('../scripts/betting.js');

describe('Betting Modal Minimize Functionality', () => {
    let mockActionBetModal, mockTimerBar, mockChoicesContainer;
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock DOM elements
        mockActionBetModal = mockDOM.createElement('div');
        mockActionBetModal.id = 'action-bet-modal';
        mockActionBetModal._minimizeHandler = null;
        
        mockTimerBar = mockDOM.createElement('div');
        mockTimerBar.id = 'action-bet-timer-bar';
        
        mockChoicesContainer = mockDOM.createElement('div');
        mockChoicesContainer.id = 'action-bet-choices';
        
        // Set up DOM element references
        mockDOM.elements['action-bet-modal'] = mockActionBetModal;
        mockDOM.elements['action-bet-timer-bar'] = mockTimerBar;
        mockDOM.elements['action-bet-choices'] = mockChoicesContainer;
        mockDOM.elements['action-bet-title'] = mockDOM.createElement('h2');
        mockDOM.elements['action-bet-main-description'] = mockDOM.createElement('p');
        
        // Reset game state
        gameState.resetState();
        
        // Mock pause manager
        global.pauseManager = {
            pauseGame: jest.fn(() => true),
            isPaused: jest.fn(() => true)
        };
    });

    describe('Modal Minimize Behavior', () => {
        test('should minimize modal instead of closing when clicking outside (Requirement 1.1)', () => {
            // Arrange
            const event = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [
                    { text: 'Yellow Card', odds: 2.5 },
                    { text: 'Red Card', odds: 8.0 }
                ]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            
            // Verify modal is shown
            expect(mockActionBetModal.classList.remove).toHaveBeenCalledWith('hidden');
            
            // Simulate click outside modal
            const clickEvent = { target: mockActionBetModal };
            mockActionBetModal.addEventListener.mock.calls[0][1](clickEvent);
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.modalState.minimized).toBe(true);
            expect(state.currentActionBet.modalState.visible).toBe(false);
            expect(mockActionBetModal.classList.add).toHaveBeenCalledWith('hidden');
        });

        test('should minimize modal when minimize button is clicked (Requirement 1.2)', () => {
            // Arrange
            const event = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            
            // Find and click minimize button
            const minimizeButton = mockChoicesContainer.appendChild.mock.calls
                .find(call => call[0].textContent === 'Minimize')[0];
            minimizeButton.onclick();
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.modalState.minimized).toBe(true);
            expect(state.currentActionBet.modalState.visible).toBe(false);
        });

        test('should show minimized indicator when modal is minimized (Requirement 1.3)', () => {
            // Arrange
            const event = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            betting.minimizeActionBet();
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.minimizedIndicator).toBeTruthy();
            expect(state.currentActionBet.minimizedIndicator.isVisible).toBe(true);
            expect(state.currentActionBet.minimizedIndicator.eventType).toBe('FOUL_OUTCOME');
        });

        test('should restore modal when minimized indicator is clicked (Requirement 1.4)', () => {
            // Arrange
            const event = {
                description: 'Test foul event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            betting.minimizeActionBet();
            
            // Get the minimized indicator and simulate click
            const state = gameState.getCurrentState();
            const indicator = state.currentActionBet.minimizedIndicator;
            indicator.clickHandler();
            
            // Assert
            const updatedState = gameState.getCurrentState();
            expect(updatedState.currentActionBet.modalState.minimized).toBe(false);
            expect(updatedState.currentActionBet.modalState.visible).toBe(true);
            expect(mockActionBetModal.classList.remove).toHaveBeenCalledWith('hidden');
        });
    });

    describe('Modal State Preservation', () => {
        test('should preserve modal content when minimized and restored', () => {
            // Arrange
            const event = {
                description: 'Complex foul event with multiple choices',
                betType: 'FOUL_OUTCOME',
                choices: [
                    { text: 'Yellow Card', odds: 2.5 },
                    { text: 'Red Card', odds: 8.0 },
                    { text: 'Warning', odds: 1.5 }
                ]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            const initialState = gameState.getCurrentState();
            
            betting.minimizeActionBet();
            betting.restoreActionBet();
            
            // Assert
            const restoredState = gameState.getCurrentState();
            expect(restoredState.currentActionBet.details).toEqual(initialState.currentActionBet.details);
            expect(restoredState.currentActionBet.active).toBe(true);
        });

        test('should preserve timer state when minimized and restored', () => {
            // Arrange
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            const initialState = gameState.getCurrentState();
            
            // Simulate some time passing
            global.Date.now = jest.fn(() => mockNow + 3000); // 3 seconds later
            
            betting.minimizeActionBet();
            betting.restoreActionBet();
            
            // Assert
            const restoredState = gameState.getCurrentState();
            expect(restoredState.currentActionBet.modalState.startTime).toBe(initialState.currentActionBet.modalState.startTime);
            expect(restoredState.currentActionBet.modalState.duration).toBe(initialState.currentActionBet.modalState.duration);
        });
    });

    describe('Timer Integration', () => {
        test('should update minimized indicator time display', () => {
            // Arrange
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            betting.minimizeActionBet();
            
            // Simulate time update interval
            const updateInterval = global.setInterval.mock.calls[0][0];
            global.Date.now = jest.fn(() => mockNow + 2000); // 2 seconds later
            updateInterval();
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.minimizedIndicator.timeRemaining).toBe(8); // 10 - 2 = 8 seconds
        });

        test('should make indicator urgent when less than 5 seconds remain', () => {
            // Arrange
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            betting.minimizeActionBet();
            
            // Simulate time passing to urgent threshold
            const updateInterval = global.setInterval.mock.calls[0][0];
            global.Date.now = jest.fn(() => mockNow + 6000); // 6 seconds later (4 remaining)
            updateInterval();
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.minimizedIndicator.urgent).toBe(true);
        });

        test('should auto-hide when timer expires while minimized', () => {
            // Arrange
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            betting.minimizeActionBet();
            
            // Simulate timer expiration
            const updateInterval = global.setInterval.mock.calls[0][0];
            global.Date.now = jest.fn(() => mockNow + 11000); // 11 seconds later (expired)
            updateInterval();
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.active).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Arrange
            mockDOM.elements['action-bet-modal'] = null;
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act & Assert - should not throw
            expect(() => {
                betting.showMultiChoiceActionBet(event);
                betting.minimizeActionBet();
            }).not.toThrow();
        });

        test('should handle multiple minimize calls gracefully', () => {
            // Arrange
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            betting.minimizeActionBet();
            betting.minimizeActionBet(); // Second call should be safe
            
            // Assert
            const state = gameState.getCurrentState();
            expect(state.currentActionBet.modalState.minimized).toBe(true);
        });

        test('should handle restore without minimize gracefully', () => {
            // Act & Assert - should not throw
            expect(() => {
                betting.restoreActionBet();
            }).not.toThrow();
        });
    });

    describe('Integration with Pause System', () => {
        test('should maintain pause state when modal is minimized (Requirement 5.3)', () => {
            // Arrange
            const event = {
                description: 'Test event',
                betType: 'FOUL_OUTCOME',
                choices: [{ text: 'Yellow Card', odds: 2.5 }]
            };
            
            // Act
            betting.showMultiChoiceActionBet(event);
            expect(global.pauseManager.pauseGame).toHaveBeenCalledWith('BETTING_OPPORTUNITY', 15000);
            
            betting.minimizeActionBet();
            
            // Assert - pause should still be active
            expect(global.pauseManager.isPaused()).toBe(true);
        });
    });
});