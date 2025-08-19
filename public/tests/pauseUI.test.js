/**
 * Test suite for PauseUI class
 * Tests UI state transitions, display logic, and DOM manipulation
 */

// Mock DOM environment for testing
function setupMockDOM() {
    // Create basic DOM structure
    document.body.innerHTML = `
        <div id="app-container" class="max-w-md mx-auto min-h-screen bg-gray-800">
            <div id="match-screen" class="flex-grow flex flex-col h-screen">
                <div>Match content</div>
            </div>
        </div>
    `;
}

function cleanupMockDOM() {
    document.body.innerHTML = '';
    // Remove any added styles
    const styleElement = document.getElementById('pause-ui-styles');
    if (styleElement) {
        styleElement.remove();
    }
}

// Test suite
describe('PauseUI', () => {
    let pauseUI;

    beforeEach(() => {
        setupMockDOM();
        pauseUI = new PauseUI();
    });

    afterEach(() => {
        if (pauseUI) {
            pauseUI.destroy();
        }
        cleanupMockDOM();
    });

    describe('Initialization', () => {
        test('should create overlay element on initialization', () => {
            expect(pauseUI.overlay).toBeTruthy();
            expect(pauseUI.overlay.id).toBe('pause-overlay');
            expect(pauseUI.overlay.classList.contains('pause-overlay')).toBe(true);
            expect(pauseUI.overlay.classList.contains('hidden')).toBe(true);
        });

        test('should append overlay to app container', () => {
            const appContainer = document.getElementById('app-container');
            expect(appContainer.contains(pauseUI.overlay)).toBe(true);
        });

        test('should add CSS styles to document head', () => {
            const styleElement = document.getElementById('pause-ui-styles');
            expect(styleElement).toBeTruthy();
            expect(styleElement.tagName).toBe('STYLE');
        });

        test('should initialize with isVisible as false', () => {
            expect(pauseUI.isVisible).toBe(false);
            expect(pauseUI.isOverlayVisible()).toBe(false);
        });
    });

    describe('showPauseOverlay()', () => {
        test('should show overlay with default reason and message', () => {
            pauseUI.showPauseOverlay();
            
            expect(pauseUI.overlay.classList.contains('hidden')).toBe(false);
            expect(pauseUI.isVisible).toBe(true);
            
            const reasonElement = pauseUI.overlay.querySelector('.pause-reason');
            const messageElement = pauseUI.overlay.querySelector('.pause-waiting-text');
            
            expect(reasonElement.textContent).toBe('Betting in Progress');
            expect(messageElement.textContent).toBe('Waiting for players...');
        });

        test('should show overlay with custom reason and message', () => {
            const customReason = 'Custom Pause Reason';
            const customMessage = 'Custom waiting message';
            
            pauseUI.showPauseOverlay(customReason, customMessage);
            
            const reasonElement = pauseUI.overlay.querySelector('.pause-reason');
            const messageElement = pauseUI.overlay.querySelector('.pause-waiting-text');
            
            expect(reasonElement.textContent).toBe(customReason);
            expect(messageElement.textContent).toBe(customMessage);
        });

        test('should add visible class after requestAnimationFrame', (done) => {
            pauseUI.showPauseOverlay();
            
            // Initially should not have visible class
            expect(pauseUI.overlay.classList.contains('visible')).toBe(false);
            
            // After requestAnimationFrame, should have visible class
            requestAnimationFrame(() => {
                expect(pauseUI.overlay.classList.contains('visible')).toBe(true);
                done();
            });
        });

        test('should dim game area when showing overlay', () => {
            const matchScreen = document.getElementById('match-screen');
            
            pauseUI.showPauseOverlay();
            
            expect(matchScreen.style.filter).toBe('brightness(0.3)');
            expect(matchScreen.style.pointerEvents).toBe('none');
        });

        test('should handle missing overlay gracefully', () => {
            pauseUI.overlay = null;
            
            // Should not throw error
            expect(() => {
                pauseUI.showPauseOverlay();
            }).not.toThrow();
        });
    });

    describe('hidePauseOverlay()', () => {
        beforeEach(() => {
            pauseUI.showPauseOverlay();
            // Wait for show animation
            return new Promise(resolve => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });

        test('should hide overlay and update visibility state', () => {
            pauseUI.hidePauseOverlay();
            
            expect(pauseUI.overlay.classList.contains('visible')).toBe(false);
            expect(pauseUI.isVisible).toBe(false);
        });

        test('should add hidden class after transition delay', (done) => {
            pauseUI.hidePauseOverlay();
            
            // Should not have hidden class immediately
            expect(pauseUI.overlay.classList.contains('hidden')).toBe(false);
            
            // Should have hidden class after transition
            setTimeout(() => {
                expect(pauseUI.overlay.classList.contains('hidden')).toBe(true);
                done();
            }, 350); // Slightly longer than 300ms transition
        });

        test('should restore game area when hiding overlay', () => {
            const matchScreen = document.getElementById('match-screen');
            
            pauseUI.hidePauseOverlay();
            
            expect(matchScreen.style.filter).toBe('');
            expect(matchScreen.style.pointerEvents).toBe('');
        });

        test('should handle already hidden overlay gracefully', () => {
            pauseUI.hidePauseOverlay(); // Hide once
            
            // Should not throw error when hiding again
            expect(() => {
                pauseUI.hidePauseOverlay();
            }).not.toThrow();
        });

        test('should handle missing overlay gracefully', () => {
            pauseUI.overlay = null;
            
            // Should not throw error
            expect(() => {
                pauseUI.hidePauseOverlay();
            }).not.toThrow();
        });
    });

    describe('updateMessage()', () => {
        test('should update message when overlay is visible', () => {
            pauseUI.showPauseOverlay();
            const newMessage = 'Updated waiting message';
            
            pauseUI.updateMessage(newMessage);
            
            const messageElement = pauseUI.overlay.querySelector('.pause-waiting-text');
            expect(messageElement.textContent).toBe(newMessage);
        });

        test('should not update message when overlay is hidden', () => {
            const originalMessage = 'Original message';
            pauseUI.showPauseOverlay('Reason', originalMessage);
            pauseUI.hidePauseOverlay();
            
            pauseUI.updateMessage('New message');
            
            const messageElement = pauseUI.overlay.querySelector('.pause-waiting-text');
            expect(messageElement.textContent).toBe(originalMessage);
        });

        test('should handle missing overlay gracefully', () => {
            pauseUI.overlay = null;
            
            expect(() => {
                pauseUI.updateMessage('Test message');
            }).not.toThrow();
        });
    });

    describe('updateReason()', () => {
        test('should update reason when overlay is visible', () => {
            pauseUI.showPauseOverlay();
            const newReason = 'Updated pause reason';
            
            pauseUI.updateReason(newReason);
            
            const reasonElement = pauseUI.overlay.querySelector('.pause-reason');
            expect(reasonElement.textContent).toBe(newReason);
        });

        test('should not update reason when overlay is hidden', () => {
            const originalReason = 'Original reason';
            pauseUI.showPauseOverlay(originalReason);
            pauseUI.hidePauseOverlay();
            
            pauseUI.updateReason('New reason');
            
            const reasonElement = pauseUI.overlay.querySelector('.pause-reason');
            expect(reasonElement.textContent).toBe(originalReason);
        });

        test('should handle missing overlay gracefully', () => {
            pauseUI.overlay = null;
            
            expect(() => {
                pauseUI.updateReason('Test reason');
            }).not.toThrow();
        });
    });

    describe('Game Area Manipulation', () => {
        test('dimGameArea should apply correct styles', () => {
            const matchScreen = document.getElementById('match-screen');
            
            pauseUI.dimGameArea();
            
            expect(matchScreen.style.filter).toBe('brightness(0.3)');
            expect(matchScreen.style.pointerEvents).toBe('none');
        });

        test('restoreGameArea should remove styles', () => {
            const matchScreen = document.getElementById('match-screen');
            
            // First dim the area
            pauseUI.dimGameArea();
            expect(matchScreen.style.filter).toBe('brightness(0.3)');
            
            // Then restore it
            pauseUI.restoreGameArea();
            expect(matchScreen.style.filter).toBe('');
            expect(matchScreen.style.pointerEvents).toBe('');
        });

        test('should handle missing match screen gracefully', () => {
            // Remove match screen
            const matchScreen = document.getElementById('match-screen');
            matchScreen.remove();
            
            expect(() => {
                pauseUI.dimGameArea();
                pauseUI.restoreGameArea();
            }).not.toThrow();
        });
    });

    describe('State Management', () => {
        test('isOverlayVisible should return correct state', () => {
            expect(pauseUI.isOverlayVisible()).toBe(false);
            
            pauseUI.showPauseOverlay();
            expect(pauseUI.isOverlayVisible()).toBe(true);
            
            pauseUI.hidePauseOverlay();
            expect(pauseUI.isOverlayVisible()).toBe(false);
        });
    });

    describe('Cleanup', () => {
        test('destroy should remove overlay from DOM', () => {
            const appContainer = document.getElementById('app-container');
            expect(appContainer.contains(pauseUI.overlay)).toBe(true);
            
            pauseUI.destroy();
            
            expect(appContainer.contains(pauseUI.overlay)).toBe(false);
        });

        test('destroy should remove styles from document', () => {
            expect(document.getElementById('pause-ui-styles')).toBeTruthy();
            
            pauseUI.destroy();
            
            expect(document.getElementById('pause-ui-styles')).toBeFalsy();
        });

        test('destroy should reset internal state', () => {
            pauseUI.destroy();
            
            expect(pauseUI.overlay).toBe(null);
            expect(pauseUI.isVisible).toBe(false);
        });

        test('destroy should handle missing elements gracefully', () => {
            // Remove overlay manually
            pauseUI.overlay.remove();
            
            expect(() => {
                pauseUI.destroy();
            }).not.toThrow();
        });
    });

    describe('CSS Styles', () => {
        test('should not add duplicate styles', () => {
            // Create another PauseUI instance
            const pauseUI2 = new PauseUI();
            
            const styleElements = document.querySelectorAll('#pause-ui-styles');
            expect(styleElements.length).toBe(1);
            
            pauseUI2.destroy();
        });

        test('should create overlay with correct structure', () => {
            const overlay = pauseUI.overlay;
            
            expect(overlay.querySelector('.pause-backdrop')).toBeTruthy();
            expect(overlay.querySelector('.pause-content')).toBeTruthy();
            expect(overlay.querySelector('.pause-icon')).toBeTruthy();
            expect(overlay.querySelector('.pause-title')).toBeTruthy();
            expect(overlay.querySelector('.pause-reason')).toBeTruthy();
            expect(overlay.querySelector('.pause-status')).toBeTruthy();
            expect(overlay.querySelector('.pause-spinner')).toBeTruthy();
            expect(overlay.querySelector('.pause-waiting-text')).toBeTruthy();
        });

        test('should have correct initial content', () => {
            const titleElement = pauseUI.overlay.querySelector('.pause-title');
            const iconElement = pauseUI.overlay.querySelector('.pause-icon');
            
            expect(titleElement.textContent).toBe('Game Paused');
            expect(iconElement.textContent).toBe('⏸️');
        });
    });

    describe('Edge Cases', () => {
        test('should handle app container not existing', () => {
            // Remove app container
            document.getElementById('app-container').remove();
            
            // Create new PauseUI
            const newPauseUI = new PauseUI();
            
            // Should append to body instead
            expect(document.body.contains(newPauseUI.overlay)).toBe(true);
            
            newPauseUI.destroy();
        });

        test('should handle rapid show/hide calls', () => {
            expect(() => {
                pauseUI.showPauseOverlay();
                pauseUI.hidePauseOverlay();
                pauseUI.showPauseOverlay();
                pauseUI.hidePauseOverlay();
            }).not.toThrow();
        });

        test('should handle empty string parameters', () => {
            pauseUI.showPauseOverlay('', '');
            
            const reasonElement = pauseUI.overlay.querySelector('.pause-reason');
            const messageElement = pauseUI.overlay.querySelector('.pause-waiting-text');
            
            expect(reasonElement.textContent).toBe('');
            expect(messageElement.textContent).toBe('');
        });
    });
});

// Export test suite for browser testing
if (typeof window !== 'undefined') {
    window.PauseUITests = {
        setupMockDOM,
        cleanupMockDOM
    };
}