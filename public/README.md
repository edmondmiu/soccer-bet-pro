# Soccer Bet Pro - Game Prototype

A modular soccer betting game prototype that simulates live matches with real-time betting opportunities.

## Project Structure

```
game-prototype/
├── index.html                 # Main HTML file with game interface
├── README.md                  # This documentation file
├── styles/
│   ├── main.css              # Base styles and layout
│   ├── components.css        # Component-specific styles
│   └── animations.css        # Animations and transitions
├── scripts/
│   ├── main.js              # Application entry point and initialization
│   ├── gameState.js         # Centralized state management
│   ├── gameLogic.js         # Core game simulation logic
│   ├── betting.js           # Betting system and power-ups
│   ├── ui.js                # UI rendering and DOM manipulation
│   ├── events.js            # Event handling and user interactions
│   └── utils.js             # Utility functions and constants
└── assets/                   # Future assets (images, sounds, etc.)
```

## Features

### Core Gameplay
- **Live Match Simulation**: Real-time soccer match simulation with dynamic events
- **Multiple Betting Types**: Full match outcome betting (1X2) and live action bets
- **Power-Up System**: Special abilities that enhance betting opportunities
- **Classic Mode**: Toggle between standard and classic betting experiences
- **Real-time Odds**: Dynamic odds that change based on match events

### User Interface
- **Responsive Design**: Mobile-first design optimized for various screen sizes
- **Live Event Feed**: Real-time match events and betting opportunities
- **Interactive Dashboard**: Track wallet balance, active bets, and potential winnings
- **Modal System**: Intuitive betting slips and action bet interfaces

## How to Run

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Running the Game
1. **Local Development**: Simply open `index.html` in your web browser
2. **Live Server** (recommended for development):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have live-server installed)
   npx live-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. Navigate to `http://localhost:8000` in your browser

### Game Controls
- **Lobby**: Select a match to join from the available options
- **Match Screen**: 
  - Place full match bets using the 1X2 buttons
  - Respond to action bets when they appear during the match
  - Use power-ups when available
  - Toggle Classic Mode for different betting experience
  - Monitor your bets in the sticky bet history section

## Development

### Module Architecture
The game follows a modular architecture with clear separation of concerns:

- **gameState.js**: Manages all application state using observer pattern
- **gameLogic.js**: Handles match simulation, timeline generation, and odds calculation
- **betting.js**: Manages all betting functionality including validation and resolution
- **ui.js**: Handles all DOM manipulation and rendering
- **events.js**: Manages user interactions and event listeners
- **utils.js**: Provides utility functions and constants
- **main.js**: Application entry point that initializes all modules

### State Management
The game uses a centralized state management system:
```javascript
// Get current state
const state = getCurrentState();

// Update state
updateState({ wallet: 950 });

// Subscribe to state changes
subscribeToStateChanges((newState) => {
    // Handle state changes
});
```

### Adding New Features
1. **New Betting Types**: Add logic to `betting.js` and UI components to `ui.js`
2. **Match Events**: Extend the timeline generation in `gameLogic.js`
3. **UI Components**: Add new components to `ui.js` and styles to appropriate CSS files
4. **Game Modes**: Extend state management in `gameState.js`

### Code Style
- **ES6+ JavaScript**: Modern JavaScript features and syntax
- **Modular Design**: Each module has a specific responsibility
- **JSDoc Comments**: All public functions are documented
- **Error Handling**: Comprehensive error handling throughout
- **State Immutability**: State updates use immutable patterns

## Testing

### Manual Testing Checklist
- [ ] Lobby loads correctly with available matches
- [ ] Match selection transitions to match screen
- [ ] Full match betting works (Home/Draw/Away)
- [ ] Action bets appear and function correctly
- [ ] Power-ups are awarded and can be used
- [ ] Classic mode toggle works
- [ ] Wallet balance updates correctly
- [ ] Bet history displays active bets
- [ ] Match ends properly with bet resolution
- [ ] Return to lobby functionality works
- [ ] Reset prototype button works

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Technical Details

### Dependencies
- **Tailwind CSS**: Utility-first CSS framework (loaded via CDN)
- **Google Fonts**: Inter font family for typography
- **No JavaScript frameworks**: Vanilla JavaScript for maximum compatibility

### Performance Considerations
- **Modular Loading**: JavaScript modules loaded efficiently
- **Event Delegation**: Efficient event handling
- **State Management**: Optimized state updates and rendering
- **CSS Animations**: Hardware-accelerated animations

### Browser Storage
- Game state is maintained in memory during session
- No persistent storage (resets on page reload)
- Reset functionality available in lobby

## Troubleshooting

### Common Issues
1. **Game doesn't load**: Check browser console for JavaScript errors
2. **Styles not applied**: Ensure CSS files are loading correctly
3. **Betting not working**: Check wallet balance and bet validation
4. **Match not progressing**: Verify game logic module is loaded

### Debug Mode
Open browser developer tools (F12) to:
- View console logs for game events
- Inspect network requests for resource loading
- Monitor state changes in real-time
- Debug JavaScript execution

## Future Enhancements

### Planned Features
- **Persistent Storage**: Save game progress between sessions
- **Multiple Sports**: Extend beyond soccer to other sports
- **Multiplayer**: Real-time betting with other players
- **Advanced Statistics**: Detailed betting history and analytics
- **Sound Effects**: Audio feedback for game events
- **Tournaments**: Multi-match tournament mode

### Technical Improvements
- **Unit Tests**: Comprehensive test suite
- **Build Process**: Webpack/Vite build optimization
- **TypeScript**: Type safety for better development experience
- **PWA Features**: Offline support and app-like experience

## Contributing

### Development Setup
1. Clone or download the project
2. Open in your preferred code editor
3. Use a local server for development
4. Follow the existing code style and architecture

### Code Guidelines
- Maintain modular architecture
- Add JSDoc comments for new functions
- Update this README for significant changes
- Test thoroughly before committing changes

## License

This is a prototype project for demonstration purposes.