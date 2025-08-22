/**
 * LobbyScreen Tests
 * Tests for lobby functionality and match selection
 */

import { LobbyScreen } from './LobbyScreen.js';
import { StateManager } from '../core/StateManager.js';

describe('LobbyScreen', () => {
    let lobbyScreen;
    let stateManager;
    let mockUIManager;

    beforeEach(() => {
        // Create fresh instances
        lobbyScreen = new LobbyScreen();
        stateManager = new StateManager();
        
        // Mock UIManager
        mockUIManager = {
            showNotification: jest.fn(),
            showLoading: jest.fn(),
            hideLoading: jest.fn()
        };
        window.uiManager = mockUIManager;

        // Setup DOM
        document.body.innerHTML = '<div id="app"></div>';
        
        // Initialize lobby screen
        lobbyScreen.initialize(stateManager);
    });

    afterEach(() => {
        lobbyScreen.destroy();
        delete window.uiManager;
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        test('should initialize with default state', () => {
            expect(lobbyScreen.stateManager).toBe(stateManager);
            expect(lobbyScreen.availableMatches).toHaveLength(expect.any(Number));
            expect(lobbyScreen.availableMatches.length).toBeGreaterThanOrEqual(3);
            expect(lobbyScreen.availableMatches.length).toBeLessThanOrEqual(6);
        });

        test('should generate available matches with unique teams', () => {
            const matches = lobbyScreen.getAvailableMatches();
            const allTeams = [];
            
            matches.forEach(match => {
                allTeams.push(match.homeTeam, match.awayTeam);
            });
            
            const uniqueTeams = new Set(allTeams);
            expect(uniqueTeams.size).toBe(allTeams.length);
        });

        test('should generate matches with valid odds structure', () => {
            const matches = lobbyScreen.getAvailableMatches();
            
            matches.forEach(match => {
                expect(match.odds).toHaveProperty('home');
                expect(match.odds).toHaveProperty('draw');
                expect(match.odds).toHaveProperty('away');
                
                expect(typeof match.odds.home).toBe('number');
                expect(typeof match.odds.draw).toBe('number');
                expect(typeof match.odds.away).toBe('number');
                
                expect(match.odds.home).toBeGreaterThan(1);
                expect(match.odds.draw).toBeGreaterThan(1);
                expect(match.odds.away).toBeGreaterThan(1);
            });
        });
    });

    describe('Rendering', () => {
        test('should render lobby screen with correct structure', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            
            expect(element.classList.contains('lobby-screen')).toBe(true);
            expect(element.querySelector('.lobby-header')).toBeTruthy();
            expect(element.querySelector('.lobby-title')).toBeTruthy();
            expect(element.querySelector('.wallet-display')).toBeTruthy();
            expect(element.querySelector('.classic-mode-toggle')).toBeTruthy();
            expect(element.querySelector('.matches-section')).toBeTruthy();
            expect(element.querySelector('.game-info')).toBeTruthy();
        });

        test('should display wallet balance correctly', () => {
            const state = { ...stateManager.getState(), wallet: 1500.75 };
            const element = lobbyScreen.render(state);
            
            const walletBalance = element.querySelector('.wallet-balance');
            expect(walletBalance.textContent).toBe('1500.75');
        });

        test('should display classic mode toggle correctly', () => {
            const state = { ...stateManager.getState(), classicMode: true };
            const element = lobbyScreen.render(state);
            
            const checkbox = element.querySelector('#classic-mode-checkbox');
            expect(checkbox.checked).toBe(true);
        });

        test('should render all available matches', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            
            const matchCards = element.querySelectorAll('.match-card');
            expect(matchCards.length).toBe(lobbyScreen.availableMatches.length);
        });

        test('should render match cards with correct information', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            
            const firstMatch = lobbyScreen.availableMatches[0];
            const firstCard = element.querySelector(`[data-match-id="${firstMatch.id}"]`);
            
            expect(firstCard.querySelector('.home-team').textContent).toBe(firstMatch.homeTeam);
            expect(firstCard.querySelector('.away-team').textContent).toBe(firstMatch.awayTeam);
            expect(firstCard.querySelector('.kickoff-time').textContent).toBe(firstMatch.kickoff);
            
            const oddsValues = firstCard.querySelectorAll('.odds-value');
            expect(oddsValues[0].textContent).toBe(firstMatch.odds.home.toFixed(2));
            expect(oddsValues[1].textContent).toBe(firstMatch.odds.draw.toFixed(2));
            expect(oddsValues[2].textContent).toBe(firstMatch.odds.away.toFixed(2));
        });
    });

    describe('Classic Mode Toggle', () => {
        test('should handle classic mode toggle', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const checkbox = element.querySelector('#classic-mode-checkbox');
            
            // Simulate toggle
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
            
            const updatedState = stateManager.getState();
            expect(updatedState.classicMode).toBe(true);
            expect(mockUIManager.showNotification).toHaveBeenCalledWith(
                'Classic Mode enabled - Power-ups disabled',
                'info',
                'Mode Changed'
            );
        });

        test('should handle classic mode disable', () => {
            // Start with classic mode enabled
            stateManager.updateState({ classicMode: true });
            
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const checkbox = element.querySelector('#classic-mode-checkbox');
            
            // Simulate toggle off
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
            
            const updatedState = stateManager.getState();
            expect(updatedState.classicMode).toBe(false);
            expect(mockUIManager.showNotification).toHaveBeenCalledWith(
                'Classic Mode disabled - Power-ups enabled',
                'info',
                'Mode Changed'
            );
        });
    });

    describe('Match Selection', () => {
        test('should handle match selection', (done) => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const firstMatch = lobbyScreen.availableMatches[0];
            const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
            
            // Mock setTimeout to control timing
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = (callback, delay) => {
                expect(delay).toBe(800);
                callback();
                global.setTimeout = originalSetTimeout;
                done();
            };
            
            joinButton.click();
            
            expect(mockUIManager.showLoading).toHaveBeenCalledWith('Joining match...');
        });

        test('should update state when joining match', (done) => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const firstMatch = lobbyScreen.availableMatches[0];
            const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
            
            // Subscribe to state changes
            stateManager.subscribe((newState) => {
                if (newState.currentScreen === 'match') {
                    expect(newState.match.active).toBe(true);
                    expect(newState.match.homeTeam).toBe(firstMatch.homeTeam);
                    expect(newState.match.awayTeam).toBe(firstMatch.awayTeam);
                    expect(newState.match.odds).toEqual(firstMatch.odds);
                    expect(newState.match.initialOdds).toEqual(firstMatch.odds);
                    
                    expect(mockUIManager.hideLoading).toHaveBeenCalled();
                    expect(mockUIManager.showNotification).toHaveBeenCalledWith(
                        `Joined ${firstMatch.homeTeam} vs ${firstMatch.awayTeam}`,
                        'success',
                        'Match Joined'
                    );
                    
                    done();
                }
            });
            
            // Mock setTimeout to execute immediately
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = (callback) => {
                callback();
                global.setTimeout = originalSetTimeout;
            };
            
            joinButton.click();
        });

        test('should handle invalid match selection', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            // Simulate clicking with invalid match ID
            lobbyScreen.handleMatchSelection('invalid-match-id');
            
            // Should not update state or show loading
            expect(mockUIManager.showLoading).not.toHaveBeenCalled();
        });
    });

    describe('State Updates', () => {
        test('should update wallet display when state changes', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            // Update wallet
            stateManager.updateState({ wallet: 2500.50 });
            
            const walletBalance = element.querySelector('.wallet-balance');
            expect(walletBalance.textContent).toBe('2500.50');
        });

        test('should update classic mode toggle when state changes', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            // Update classic mode
            stateManager.updateState({ classicMode: true });
            
            const checkbox = element.querySelector('#classic-mode-checkbox');
            expect(checkbox.checked).toBe(true);
        });

        test('should only update when on lobby screen', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const updateSpy = jest.spyOn(lobbyScreen, 'update');
            
            // Update state while on match screen
            stateManager.updateState({ currentScreen: 'match', wallet: 1500 });
            
            expect(updateSpy).not.toHaveBeenCalled();
            
            updateSpy.mockRestore();
        });
    });

    describe('Responsive Design', () => {
        test('should handle window resize', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            // Mock window width for mobile
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600
            });
            
            lobbyScreen.handleResize();
            
            expect(element.classList.contains('mobile-layout')).toBe(true);
            
            // Mock window width for desktop
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1200
            });
            
            lobbyScreen.handleResize();
            
            expect(element.classList.contains('mobile-layout')).toBe(false);
        });
    });

    describe('Keyboard Navigation', () => {
        test('should handle Enter key on match card', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const firstMatchCard = element.querySelector('.match-card');
            const joinButton = firstMatchCard.querySelector('.join-match-btn');
            const clickSpy = jest.spyOn(joinButton, 'click');
            
            // Simulate Enter key on match card
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            Object.defineProperty(enterEvent, 'target', {
                value: firstMatchCard,
                enumerable: true
            });
            
            element.dispatchEvent(enterEvent);
            
            expect(clickSpy).toHaveBeenCalled();
            
            clickSpy.mockRestore();
        });
    });

    describe('Match Generation', () => {
        test('should generate realistic kickoff times', () => {
            const matches = lobbyScreen.getAvailableMatches();
            
            matches.forEach(match => {
                expect(match.kickoff).toMatch(/^\d{2}:\d{2}$/);
            });
        });

        test('should refresh matches', () => {
            const originalMatches = lobbyScreen.getAvailableMatches();
            
            lobbyScreen.refreshMatches();
            
            const newMatches = lobbyScreen.getAvailableMatches();
            
            // Should have same number of matches but potentially different teams
            expect(newMatches.length).toBeGreaterThanOrEqual(3);
            expect(newMatches.length).toBeLessThanOrEqual(6);
            
            // Each match should have valid structure
            newMatches.forEach(match => {
                expect(match).toHaveProperty('id');
                expect(match).toHaveProperty('homeTeam');
                expect(match).toHaveProperty('awayTeam');
                expect(match).toHaveProperty('odds');
                expect(match).toHaveProperty('kickoff');
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle state manager errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Create lobby without state manager
            const lobbyWithoutState = new LobbyScreen();
            
            // Should not throw when trying to join match
            expect(() => {
                lobbyWithoutState.joinMatch(lobbyScreen.availableMatches[0]);
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith('StateManager not available');
            
            consoleSpy.mockRestore();
        });

        test('should handle state update errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Mock state manager to throw error
            const errorStateManager = {
                updateState: jest.fn(() => {
                    throw new Error('State update failed');
                })
            };
            
            lobbyScreen.stateManager = errorStateManager;
            
            const match = lobbyScreen.availableMatches[0];
            lobbyScreen.joinMatch(match);
            
            expect(mockUIManager.hideLoading).toHaveBeenCalled();
            expect(mockUIManager.showNotification).toHaveBeenCalledWith(
                'Failed to join match. Please try again.',
                'error',
                'Join Failed'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources on destroy', () => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            expect(document.body.contains(element)).toBe(true);
            
            lobbyScreen.destroy();
            
            expect(lobbyScreen.element).toBeNull();
            expect(lobbyScreen.stateManager).toBeNull();
            expect(lobbyScreen.selectedMatch).toBeNull();
            expect(lobbyScreen.availableMatches).toEqual([]);
        });
    });

    describe('Requirements Validation', () => {
        test('should meet requirement 1.1 - Initialize with $1000 virtual currency', () => {
            const state = stateManager.getState();
            expect(state.wallet).toBe(1000);
        });

        test('should meet requirement 1.2 - Show available simulated matches', () => {
            const matches = lobbyScreen.getAvailableMatches();
            expect(matches.length).toBeGreaterThan(0);
            
            matches.forEach(match => {
                expect(match.homeTeam).toBeTruthy();
                expect(match.awayTeam).toBeTruthy();
                expect(match.odds).toBeTruthy();
            });
        });

        test('should meet requirement 1.3 - Initialize with correct odds', () => {
            const matches = lobbyScreen.getAvailableMatches();
            
            matches.forEach(match => {
                // Odds should be around the base values with variation
                expect(match.odds.home).toBeGreaterThan(1.0);
                expect(match.odds.draw).toBeGreaterThan(2.0);
                expect(match.odds.away).toBeGreaterThan(1.0);
            });
        });

        test('should meet requirement 1.5 - Auto-join functionality', (done) => {
            const state = stateManager.getState();
            const element = lobbyScreen.render(state);
            document.body.appendChild(element);
            
            const firstMatch = lobbyScreen.availableMatches[0];
            
            // Subscribe to state changes to verify auto-join
            stateManager.subscribe((newState) => {
                if (newState.currentScreen === 'match') {
                    expect(newState.match.active).toBe(true);
                    expect(newState.match.homeTeam).toBe(firstMatch.homeTeam);
                    expect(newState.match.awayTeam).toBe(firstMatch.awayTeam);
                    done();
                }
            });
            
            // Mock setTimeout to execute immediately
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = (callback) => {
                callback();
                global.setTimeout = originalSetTimeout;
            };
            
            // Trigger match selection
            const joinButton = element.querySelector(`[data-match-id="${firstMatch.id}"] .join-match-btn`);
            joinButton.click();
        });
    });
});