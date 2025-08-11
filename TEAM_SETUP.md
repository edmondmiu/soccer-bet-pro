# Team Setup Guide - Soccer Bet Pro

## Quick Start for New Team Members

### 1. Repository Access
- **GitHub Repository**: https://github.com/edmondmiu/soccer-bet-pro
- **Live Demo**: https://soccer-bet-pro.web.app
- **Firebase Console**: https://console.firebase.google.com/project/soccer-bet-pro

### 2. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/edmondmiu/soccer-bet-pro.git
cd soccer-bet-pro

# Start local development server (choose one)
python3 -m http.server 8000
# OR
npx live-server
# OR
php -S localhost:8000

# Open in browser
open http://localhost:8000
```

### 3. Development Workflow

#### For Feature Development:
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes
# ... code changes ...

# 3. Test locally
open http://localhost:8000/test-functionality.html

# 4. Commit and push
git add .
git commit -m "feat: describe your feature"
git push origin feature/your-feature-name

# 5. Create Pull Request on GitHub
```

#### For Bug Fixes:
```bash
# 1. Create bug fix branch
git checkout -b fix/bug-description

# 2. Fix the issue
# ... code changes ...

# 3. Test the fix
# Verify the bug is resolved

# 4. Commit and push
git add .
git commit -m "fix: describe the bug fix"
git push origin fix/bug-description

# 5. Create Pull Request on GitHub
```

## Project Structure Overview

```
soccer-bet-pro/
├── 📁 scripts/           # JavaScript modules
│   ├── main.js          # Application entry point
│   ├── gameState.js     # State management
│   ├── gameLogic.js     # Game simulation
│   ├── betting.js       # Betting system
│   ├── ui.js           # UI rendering
│   ├── events.js       # Event handling
│   └── utils.js        # Utility functions
├── 📁 styles/           # CSS files
│   ├── main.css        # Base styles
│   ├── components.css  # Component styles
│   └── animations.css  # Animations
├── 📁 public/          # Firebase hosting files
├── 📁 .github/         # GitHub templates & workflows
├── index.html          # Main game file
├── README.md           # Project documentation
├── CONTRIBUTING.md     # Contribution guidelines
└── firebase.json       # Firebase configuration
```

## Team Roles & Responsibilities

### Project Lead
- Code review and approval
- Firebase deployment management
- Architecture decisions
- Release management

### Frontend Developers
- UI/UX implementation
- Component development
- Responsive design
- Browser compatibility

### Game Logic Developers
- Match simulation logic
- Betting system features
- Game mechanics
- Performance optimization

### QA/Testing
- Manual testing execution
- Bug reporting and verification
- Test case development
- Cross-browser testing

## Communication Channels

### GitHub
- **Issues**: Bug reports and feature requests
- **Pull Requests**: Code review and discussion
- **Discussions**: General project discussion
- **Projects**: Task management and planning

### Development Standards

#### Code Quality
- ✅ All functions must have JSDoc comments
- ✅ Error handling for all user inputs
- ✅ Mobile-first responsive design
- ✅ Browser compatibility (Chrome 80+, Firefox 75+, Safari 13+)

#### Testing Requirements
- ✅ Manual testing checklist completion
- ✅ Automated test framework validation
- ✅ No console errors
- ✅ Cross-browser verification

#### Git Workflow
- ✅ Feature branches for all changes
- ✅ Descriptive commit messages
- ✅ Pull request reviews required
- ✅ Clean commit history

## Firebase Setup for Team Members

### For Deployment Access (Team Leads Only)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set project
firebase use soccer-bet-pro

# Deploy changes
firebase deploy --only hosting
```

### Environment Variables
For GitHub Actions deployment, the following secrets need to be set:
- `FIREBASE_TOKEN`: Firebase CI token for automated deployment

## Testing Strategy

### Manual Testing Checklist
Located in `test-functionality.html` - run this for every change:
- [ ] Game loads without errors
- [ ] Lobby displays matches correctly
- [ ] Match simulation works
- [ ] Betting system functions
- [ ] UI animations work
- [ ] Mobile responsiveness

### Automated Testing
- GitHub Actions runs deployment tests
- Firebase hosting preview for pull requests
- Automated file structure validation

## Troubleshooting Common Issues

### Local Development
```bash
# If modules don't load
# Make sure you're using a local server, not file:// protocol

# If styles don't apply
# Check that CSS files are loading correctly
# Verify Tailwind CDN is accessible

# If Firebase deployment fails
# Check Firebase CLI is logged in
# Verify project permissions
```

### Git Issues
```bash
# If push is rejected
git pull origin main
git rebase main
git push origin your-branch-name

# If merge conflicts
git status
# Resolve conflicts in files
git add .
git commit -m "resolve merge conflicts"
```

## Resources

### Documentation
- [Project README](README.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Testing Report](TESTING_REPORT.md)

### External Resources
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [JavaScript ES6+ Features](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

### Tools
- **Code Editor**: VS Code recommended with extensions:
  - Live Server
  - Prettier
  - ESLint
  - Tailwind CSS IntelliSense

## Getting Help

1. **Check Documentation**: README and CONTRIBUTING files
2. **Search Issues**: Look for similar problems on GitHub
3. **Create Issue**: Use issue templates for bugs/features
4. **Ask in Discussions**: For general questions
5. **Code Review**: Request review in pull requests

Welcome to the Soccer Bet Pro team! 🚀⚽