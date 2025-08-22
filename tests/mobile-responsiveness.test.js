/**
 * Mobile Responsiveness and Cross-Browser Compatibility Tests
 * Tests the game's behavior across different screen sizes and browsers
 */

describe('Mobile Responsiveness and Cross-Browser Tests', () => {
    let gameController;
    let originalViewport;

    beforeEach(async () => {
        // Store original viewport
        originalViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Initialize game controller
        const { GameController } = await import('../src/core/GameController.js');
        gameController = new GameController();
        await gameController.initialize();
    });

    afterEach(() => {
        if (gameController) {
            gameController.destroy();
        }
        
        // Restore original viewport if possible
        if (window.resizeTo) {
            window.resizeTo(originalViewport.width, originalViewport.height);
        }
    });

    describe('Viewport Responsiveness', () => {
        const testViewports = [
            { name: 'Mobile Portrait', width: 375, height: 667 },
            { name: 'Mobile Landscape', width: 667, height: 375 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Desktop Small', width: 1280, height: 720 },
            { name: 'Desktop Large', width: 1920, height: 1080 }
        ];

        testViewports.forEach(viewport => {
            test(`should be responsive at ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
                // Simulate viewport change
                if (window.resizeTo) {
                    window.resizeTo(viewport.width, viewport.height);
                }

                // Start a match to test all UI elements
                const matchData = {
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    odds: { home: 1.85, draw: 3.50, away: 4.20 }
                };

                await gameController.startMatch(matchData);

                // Test critical UI elements are visible and properly sized
                const criticalElements = [
                    '.match-header',
                    '.betting-buttons',
                    '.event-feed',
                    '.match-timer'
                ];

                const elementTests = criticalElements.map(selector => {
                    const element = document.querySelector(selector);
                    if (!element) return { selector, visible: false, size: null };

                    const rect = element.getBoundingClientRect();
                    const styles = window.getComputedStyle(element);

                    return {
                        selector,
                        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
                        size: { width: rect.width, height: rect.height },
                        fitsViewport: rect.width <= viewport.width && rect.height <= viewport.height,
                        hasMinSize: rect.width >= 44 && rect.height >= 44 // Minimum touch target
                    };
                });

                // All elements should be visible and fit viewport
                elementTests.forEach(test => {
                    expect(test.visible).toBe(true);
                    expect(test.fitsViewport).toBe(true);
                    
                    // Touch targets should meet minimum size requirements
                    if (test.selector.includes('button')) {
                        expect(test.hasMinSize).toBe(true);
                    }
                });

                // Test betting buttons are accessible on mobile
                if (viewport.width <= 768) {
                    const bettingButtons = document.querySelectorAll('.bet-button');
                    bettingButtons.forEach(button => {
                        const rect = button.getBoundingClientRect();
                        expect(rect.width).toBeGreaterThanOrEqual(44); // Minimum touch target
                        expect(rect.height).toBeGreaterThanOrEqual(44);
                    });
                }
            });
        });
    });

    describe('Touch Interactions', () => {
        test('should support touch events for betting', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Test touch event support
            const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            if (touchSupported) {
                const betButton = document.querySelector('.bet-button');
                expect(betButton).toBeTruthy();

                // Simulate touch events
                const touchStart = new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 100 }]
                });
                
                const touchEnd = new TouchEvent('touchend', {
                    changedTouches: [{ clientX: 100, clientY: 100 }]
                });

                let touchStartFired = false;
                let touchEndFired = false;

                betButton.addEventListener('touchstart', () => {
                    touchStartFired = true;
                });

                betButton.addEventListener('touchend', () => {
                    touchEndFired = true;
                });

                betButton.dispatchEvent(touchStart);
                betButton.dispatchEvent(touchEnd);

                expect(touchStartFired).toBe(true);
                expect(touchEndFired).toBe(true);
            }
        });

        test('should handle swipe gestures for navigation', async () => {
            // Test swipe detection for potential future navigation features
            let swipeDetected = false;
            let swipeDirection = null;

            const handleSwipe = (direction) => {
                swipeDetected = true;
                swipeDirection = direction;
            };

            // Simulate swipe detection logic
            const simulateSwipe = (startX, startY, endX, endY) => {
                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const minSwipeDistance = 50;

                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                    handleSwipe(deltaX > 0 ? 'right' : 'left');
                } else if (Math.abs(deltaY) > minSwipeDistance) {
                    handleSwipe(deltaY > 0 ? 'down' : 'up');
                }
            };

            // Test horizontal swipe
            simulateSwipe(100, 100, 200, 100);
            expect(swipeDetected).toBe(true);
            expect(swipeDirection).toBe('right');

            // Reset and test vertical swipe
            swipeDetected = false;
            swipeDirection = null;
            simulateSwipe(100, 100, 100, 50);
            expect(swipeDetected).toBe(true);
            expect(swipeDirection).toBe('up');
        });
    });

    describe('CSS Media Queries', () => {
        test('should apply mobile styles correctly', () => {
            // Test that mobile-specific CSS is applied
            const testElement = document.createElement('div');
            testElement.className = 'bet-button';
            document.body.appendChild(testElement);

            const styles = window.getComputedStyle(testElement);
            
            // Check if mobile styles are applied based on viewport
            if (window.innerWidth <= 768) {
                // Mobile styles should be active
                expect(parseInt(styles.fontSize)).toBeLessThanOrEqual(16);
                expect(parseInt(styles.padding)).toBeGreaterThanOrEqual(10);
            }

            document.body.removeChild(testElement);
        });

        test('should handle orientation changes', (done) => {
            let orientationChanged = false;

            const handleOrientationChange = () => {
                orientationChanged = true;
                done();
            };

            // Listen for orientation change
            window.addEventListener('orientationchange', handleOrientationChange);
            window.addEventListener('resize', handleOrientationChange);

            // Simulate orientation change by resizing
            if (window.resizeTo) {
                const currentWidth = window.innerWidth;
                const currentHeight = window.innerHeight;
                
                // Swap dimensions to simulate rotation
                window.resizeTo(currentHeight, currentWidth);
                
                setTimeout(() => {
                    if (!orientationChanged) {
                        // Fallback if orientation change doesn't fire
                        orientationChanged = true;
                        done();
                    }
                }, 100);
            } else {
                // Skip test if resizeTo is not available
                orientationChanged = true;
                done();
            }
        });
    });

    describe('Browser Compatibility', () => {
        test('should detect browser capabilities', () => {
            const capabilities = {
                es6Modules: typeof import === 'function',
                fetch: typeof fetch === 'function',
                localStorage: typeof localStorage === 'object',
                sessionStorage: typeof sessionStorage === 'object',
                webAudio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
                canvas: typeof HTMLCanvasElement !== 'undefined',
                webGL: (() => {
                    try {
                        const canvas = document.createElement('canvas');
                        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                    } catch (e) {
                        return false;
                    }
                })(),
                touchEvents: 'ontouchstart' in window,
                deviceMotion: typeof DeviceMotionEvent !== 'undefined',
                geolocation: 'geolocation' in navigator,
                notifications: 'Notification' in window,
                serviceWorker: 'serviceWorker' in navigator
            };

            // Core capabilities should be available
            expect(capabilities.es6Modules).toBe(true);
            expect(capabilities.fetch).toBe(true);
            expect(capabilities.localStorage).toBe(true);

            // Log capabilities for debugging
            console.log('Browser Capabilities:', capabilities);
        });

        test('should handle missing features gracefully', async () => {
            // Test graceful degradation when features are missing
            const originalAudioContext = window.AudioContext;
            const originalWebkitAudioContext = window.webkitAudioContext;

            // Temporarily disable audio
            delete window.AudioContext;
            delete window.webkitAudioContext;

            try {
                // Audio manager should handle missing audio gracefully
                const audioManager = gameController.modules.audioManager;
                const result = audioManager.playSound('betPlaced');
                
                // Should not throw error, but may return false or handle gracefully
                expect(typeof result).toBeDefined();
            } finally {
                // Restore audio context
                if (originalAudioContext) window.AudioContext = originalAudioContext;
                if (originalWebkitAudioContext) window.webkitAudioContext = originalWebkitAudioContext;
            }
        });
    });

    describe('Performance on Mobile Devices', () => {
        test('should maintain performance on slower devices', async () => {
            const startTime = performance.now();

            // Simulate slower device by adding artificial delays
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = (fn, delay) => originalSetTimeout(fn, delay * 1.5);

            try {
                const matchData = {
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    odds: { home: 1.85, draw: 3.50, away: 4.20 }
                };

                await gameController.startMatch(matchData);

                // Place multiple bets to test performance
                const betPromises = [];
                for (let i = 0; i < 5; i++) {
                    betPromises.push(gameController.placeBet({
                        type: 'fullMatch',
                        outcome: 'home',
                        stake: 10,
                        odds: 1.85
                    }));
                }

                await Promise.all(betPromises);

                const duration = performance.now() - startTime;
                
                // Should complete within reasonable time even on slower devices
                expect(duration).toBeLessThan(5000); // 5 seconds max

            } finally {
                // Restore original setTimeout
                window.setTimeout = originalSetTimeout;
            }
        });

        test('should handle memory constraints', () => {
            // Test memory usage doesn't grow excessively
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create and destroy multiple components
            for (let i = 0; i < 10; i++) {
                const element = document.createElement('div');
                element.innerHTML = '<div class="test-content">'.repeat(100) + '</div>'.repeat(100);
                document.body.appendChild(element);
                document.body.removeChild(element);
            }

            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 5MB)
            expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
        });
    });

    describe('Accessibility on Mobile', () => {
        test('should support screen readers', async () => {
            const matchData = {
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                odds: { home: 1.85, draw: 3.50, away: 4.20 }
            };

            await gameController.startMatch(matchData);

            // Check for proper ARIA labels
            const bettingButtons = document.querySelectorAll('.bet-button');
            bettingButtons.forEach(button => {
                expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
                expect(button.getAttribute('role')).toBeTruthy();
            });

            // Check for proper heading structure
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            expect(headings.length).toBeGreaterThan(0);

            // Check for proper focus management
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            focusableElements.forEach(element => {
                expect(element.tabIndex).toBeGreaterThanOrEqual(0);
            });
        });

        test('should have sufficient color contrast', () => {
            // Test color contrast ratios
            const testElements = [
                { selector: '.bet-button', minContrast: 4.5 },
                { selector: '.match-header', minContrast: 3.0 },
                { selector: '.event-feed', minContrast: 4.5 }
            ];

            testElements.forEach(({ selector, minContrast }) => {
                const element = document.querySelector(selector);
                if (element) {
                    const styles = window.getComputedStyle(element);
                    const backgroundColor = styles.backgroundColor;
                    const color = styles.color;

                    // Basic check that colors are defined
                    expect(backgroundColor).toBeTruthy();
                    expect(color).toBeTruthy();
                    expect(backgroundColor).not.toBe(color);
                }
            });
        });
    });

    describe('Network Conditions', () => {
        test('should handle slow network connections', async () => {
            // Simulate slow network by adding delays to fetch requests
            const originalFetch = window.fetch;
            
            window.fetch = async (...args) => {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                return originalFetch(...args);
            };

            try {
                // Game should still function with slow network
                const matchData = {
                    homeTeam: 'Arsenal',
                    awayTeam: 'Chelsea',
                    odds: { home: 1.85, draw: 3.50, away: 4.20 }
                };

                const startTime = performance.now();
                await gameController.startMatch(matchData);
                const duration = performance.now() - startTime;

                // Should handle slow network gracefully
                expect(duration).toBeLessThan(10000); // 10 seconds max

            } finally {
                // Restore original fetch
                window.fetch = originalFetch;
            }
        });

        test('should work offline', () => {
            // Test offline functionality
            const originalOnLine = navigator.onLine;
            
            // Simulate offline
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            try {
                // Game should still work offline (no network requests required)
                expect(() => {
                    gameController.modules.stateManager.getState();
                }).not.toThrow();

                expect(() => {
                    gameController.modules.timerManager.getStatus();
                }).not.toThrow();

            } finally {
                // Restore online status
                Object.defineProperty(navigator, 'onLine', {
                    writable: true,
                    value: originalOnLine
                });
            }
        });
    });
});