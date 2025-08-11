# Contributing to Soccer Bet Pro

Thank you for your interest in contributing to Soccer Bet Pro! This document provides guidelines and information for contributors.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Getting Started

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Git for version control
- Text editor or IDE
- Local web server (Python, Node.js, or PHP)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/[your-username]/soccer-bet-pro.git
   cd soccer-bet-pro
   ```

2. **Start Local Server**
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Node.js
   npx live-server
   
   # PHP
   php -S localhost:8000
   ```

3. **Open in Browser**
   Navigate to `http://localhost:8000`

## Code Style Guidelines

### JavaScript
- **ES6+ Features**: Use modern JavaScript syntax
- **Modular Design**: Keep functions focused and modules cohesive
- **JSDoc Comments**: Document all public functions
- **Error Handling**: Use try-catch blocks and validate inputs
- **Naming**: Use camelCase for variables and functions, PascalCase for classes

```javascript
/**
 * Calculates potential winnings for a bet
 * @param {number} stake - The bet amount
 * @param {number} odds - The betting odds
 * @returns {number} Potential winnings amount
 */
export function calculateWinnings(stake, odds) {
    if (!validateStake(stake, Infinity) || typeof odds !== 'number' || odds <= 0) {
        return 0;
    }
    return stake * odds;
}
```

### CSS
- **Tailwind First**: Use Tailwind classes when possible
- **Custom CSS**: Place in appropriate files (main.css, components.css, animations.css)
- **BEM Methodology**: For custom component classes
- **Mobile First**: Design for mobile, enhance for desktop

### HTML
- **Semantic Elements**: Use appropriate HTML5 semantic tags
- **Accessibility**: Include ARIA labels and proper form labels
- **Performance**: Minimize DOM depth and optimize loading

## Testing Requirements

### Before Submitting
1. **Manual Testing**: Complete the manual test checklist
2. **Automated Tests**: Run `test-functionality.html`
3. **Browser Testing**: Test in multiple browsers
4. **Mobile Testing**: Verify responsive design

### Test Checklist
- [ ] Game loads without console errors
- [ ] All betting functionality works
- [ ] UI animations and transitions work
- [ ] Match simulation runs correctly
- [ ] State management works properly
- [ ] Error handling prevents crashes

## Pull Request Process

### 1. Branch Naming
Use descriptive branch names:
- `feature/power-up-system`
- `fix/betting-validation-bug`
- `docs/update-readme`
- `refactor/state-management`

### 2. Commit Messages
Follow conventional commit format:
```
feat: add new power-up system
fix: resolve betting validation issue
docs: update API documentation
refactor: improve state management
test: add unit tests for betting module
```

### 3. PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Browser compatibility verified

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

### 4. Review Process
- All PRs require at least one review
- Address all review comments
- Ensure CI checks pass
- Squash commits before merging

## Issue Guidelines

### Bug Reports
Use the bug report template:
```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14]
- Device: [e.g. iPhone 15]

**Additional context**
Any other context about the problem
```

### Feature Requests
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives considered**
Alternative solutions considered

**Additional context**
Any other context or screenshots
```

## Module-Specific Guidelines

### Game State (gameState.js)
- Always validate state changes
- Use immutable updates
- Notify observers of changes
- Handle edge cases gracefully

### Game Logic (gameLogic.js)
- Keep simulation realistic
- Handle timing edge cases
- Validate match data
- Clean up intervals properly

### Betting System (betting.js)
- Validate all bet inputs
- Handle insufficient funds
- Calculate odds correctly
- Resolve bets accurately

### UI Rendering (ui.js)
- Check for DOM element existence
- Handle rendering errors gracefully
- Optimize DOM updates
- Maintain accessibility

### Event Handling (events.js)
- Use event delegation when possible
- Remove event listeners on cleanup
- Handle edge cases in user input
- Provide user feedback

## Performance Guidelines

### JavaScript
- Avoid global variables
- Clean up intervals and timeouts
- Use efficient DOM queries
- Minimize reflows and repaints

### CSS
- Use hardware acceleration for animations
- Minimize CSS complexity
- Optimize for mobile performance
- Use efficient selectors

## Security Guidelines

- Validate all user inputs
- Sanitize data before display
- Use HTTPS for external resources
- Follow OWASP guidelines

## Documentation

### Code Documentation
- JSDoc for all public functions
- Inline comments for complex logic
- README updates for new features
- API documentation for modules

### User Documentation
- Update README for user-facing changes
- Include setup instructions
- Provide troubleshooting guides
- Add screenshots for UI changes

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Code Review**: For implementation feedback
- **Documentation**: Check README and code comments

## Recognition

Contributors will be:
- Listed in the README contributors section
- Credited in release notes
- Invited to team discussions
- Recognized for significant contributions

Thank you for contributing to Soccer Bet Pro! 🚀⚽