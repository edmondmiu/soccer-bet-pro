# Soccer Bet Pro - Game Prototype

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosted-orange?logo=firebase)](https://soccer-bet-pro.web.app)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Tailwind-blue?logo=css3)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modular soccer betting game prototype that simulates live matches with real-time betting opportunities.

🎮 **[Play Live Demo](https://soccer-bet-pro.web.app)** | 🧪 **[Run Tests](https://soccer-bet-pro.web.app/test-functionality.html)**

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

## Team Collaboration

### Getting Started for Team Members

1. **Clone the repository:**
   ```bash
   git clone https://github.com/[your-username]/soccer-bet-pro.git
   cd soccer-bet-pro
   ```

2. **Set up local development:**
   ```bash
   # Start local server (choose one)
   python3 -m http.server 8000
   # OR
   npx live-server
   # OR
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code guidelines below

3. **Test your changes:**
   - Run the game locally
   - Use the test framework at `/test-functionality.html`
   - Verify all manual test checklist items

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

### Firebase Deployment (Team Leads Only)

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy to preview channel for testing
firebase hosting:channel:deploy preview
```

## Contributing

### Code Guidelines
- **Modular Architecture**: Maintain clear separation of concerns
- **JSDoc Comments**: Document all public functions
- **Error Handling**: Add comprehensive error handling for new features
- **Testing**: Update test cases for new functionality
- **Code Style**: Follow existing ES6+ patterns and naming conventions

### File Structure Rules
- **Scripts**: All JavaScript modules go in `/scripts/`
- **Styles**: CSS files organized in `/styles/` by purpose
- **Assets**: Images, sounds, etc. in `/assets/`
- **Documentation**: Keep README and docs updated

### Pull Request Guidelines
1. **Clear Description**: Explain what your PR does and why
2. **Test Results**: Include testing evidence
3. **Breaking Changes**: Clearly mark any breaking changes
4. **Screenshots**: Include UI changes screenshots if applicable

### Issue Reporting
When reporting bugs or requesting features:
- Use the issue templates
- Include browser and OS information
- Provide steps to reproduce
- Include console errors if applicable

## Team Resources

- **Live Demo**: https://soccer-bet-pro.web.app
- **Firebase Console**: https://console.firebase.google.com/project/soccer-bet-pro
- **Test Framework**: https://soccer-bet-pro.web.app/test-functionality.html
- **Project Board**: [GitHub Projects](../../projects)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Team

- **Project Lead**: [Your Name]
- **Contributors**: See [Contributors](../../graphs/contributors)