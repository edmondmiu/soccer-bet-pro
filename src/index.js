/**
 * Main entry point for the Soccer Betting Game
 * Exports all core modules and initializes the game
 */

// Core modules
export { GameController } from './core/GameController.js';
export { StateManager } from './core/StateManager.js';
export { EventManager } from './core/EventManager.js';

// Betting modules
export { BettingManager } from './betting/BettingManager.js';
export { FullMatchBetting } from './betting/FullMatchBetting.js';
export { ActionBetting } from './betting/ActionBetting.js';

// UI modules
export { UIManager } from './ui/UIManager.js';
export { LobbyScreen } from './ui/LobbyScreen.js';
export { MatchScreen } from './ui/MatchScreen.js';
export { BettingModal } from './ui/BettingModal.js';

// System modules
export { TimerManager } from './systems/TimerManager.js';
export { AudioManager } from './systems/AudioManager.js';
export { PowerUpManager } from './systems/PowerUpManager.js';

// Utility modules
export { OddsCalculator } from './utils/OddsCalculator.js';
export { EventGenerator } from './utils/EventGenerator.js';
export { Validator } from './utils/Validator.js';

// Game initialization
import { GameController } from './core/GameController.js';

/**
 * Initialize and start the game
 */
export async function initializeGame() {
    try {
        const gameController = new GameController();
        await gameController.initialize();
        
        // Make GameController available globally for UI interactions
        if (typeof window !== 'undefined') {
            window.gameController = gameController;
        }
        
        return gameController;
    } catch (error) {
        console.error('Failed to initialize game:', error);
        throw error;
    }
}

// Auto-initialize when loaded in browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initializeGame().catch(console.error);
    });
}