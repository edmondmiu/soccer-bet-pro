# 🚀 Deployment Guide

## 🏠 Local Development

### Option 1: Python Server (Recommended)
```bash
# Start local server on port 8000
python3 -m http.server 8000

# Or if you have Python 2
python -m http.server 8000

# Then open: http://localhost:8000
```

### Option 2: Using npm scripts
```bash
# Install dependencies (optional)
npm install

# Start server
npm start

# Start with live reload (if live-server is installed)
npm run dev

# Run tests
npm run test
```

### Option 3: Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click on `game_prototype.html`
3. Select "Open with Live Server"

## 🔥 Firebase Hosting

### Initial Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init hosting
```

### Deploy to Firebase
```bash
# Deploy to Firebase Hosting
firebase deploy

# Deploy with custom project
firebase deploy --project your-project-id

# Preview before deploy
firebase hosting:channel:deploy preview
```

### Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Enable Hosting in the console
4. Update `.firebaserc` with your project ID

## 📱 Access URLs

### Local Development
- **Main Game**: http://localhost:8000/game_prototype.html
- **Integration Tests**: http://localhost:8000/tests/betting-pause-complete-integration.html
- **Navigation**: http://localhost:8000/index.html

### Firebase Hosting
- **Main Game**: https://your-project.web.app/
- **Integration Tests**: https://your-project.web.app/test
- **Direct Game**: https://your-project.web.app/game_prototype.html

## 🧪 Testing the Deployment

### Local Testing Checklist
- [ ] Game loads without errors
- [ ] Betting modals appear during match
- [ ] Pause system activates
- [ ] Timer bars show correctly
- [ ] Minimized indicators work
- [ ] All JavaScript modules load

### Firebase Testing Checklist
- [ ] HTTPS works correctly
- [ ] All static assets load
- [ ] JavaScript modules work with CORS
- [ ] Mobile responsiveness
- [ ] Performance is acceptable

## 🔧 Troubleshooting

### Common Issues

**CORS Errors (Local)**
- Use a proper HTTP server, not file:// protocol
- Python server or live-server recommended

**Module Loading Issues**
- Check file paths are correct
- Ensure proper MIME types for .js files
- Verify all script files exist

**Firebase Deploy Issues**
- Check firebase.json configuration
- Verify project permissions
- Ensure all files are included (not ignored)

**Mobile Issues**
- Test viewport meta tag
- Check touch interactions
- Verify responsive CSS

## 📊 Performance Tips

### Local Development
- Use browser dev tools to monitor performance
- Check Network tab for loading issues
- Monitor Console for JavaScript errors

### Firebase Hosting
- Enable compression in firebase.json
- Optimize images and assets
- Use CDN for external libraries
- Monitor Firebase Hosting metrics

## 🔒 Security Considerations

### Local Development
- Only accessible on local network
- No HTTPS by default
- Good for development only

### Firebase Hosting
- Automatic HTTPS
- Global CDN
- DDoS protection
- Suitable for production demos