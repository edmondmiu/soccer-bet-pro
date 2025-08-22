#!/usr/bin/env node

/**
 * AudioManager Requirements Verification
 * 
 * Verifies that the AudioManager implementation meets all requirements
 * from the specification document.
 */

// Mock Web Audio API for Node.js
global.AudioContext = class MockAudioContext {
    constructor() {
        this.currentTime = 0;
        this.state = 'running';
        this.destination = {};
    }
    createOscillator() {
        return {
            type: 'sine',
            frequency: { setValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {}
        };
    }
    createGain() {
        return {
            gain: {
                setValueAtTime: () => {},
                linearRampToValueAtTime: () => {},
                exponentialRampToValueAtTime: () => {}
            },
            connect: () => {}
        };
    }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
};

global.document = {
    addEventListener: () => {},
    dispatchEvent: () => {}
};

import { AudioManager } from './AudioManager.js';

console.log('🔊 AudioManager Requirements Verification');
console.log('==========================================\n');

let passed = 0;
let failed = 0;

function verify(requirement, testFn) {
    try {
        testFn();
        console.log(`✅ ${requirement}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${requirement}`);
        console.log(`   Error: ${error.message}\n`);
        failed++;
    }
}

// Requirement 9.7: Audio feedback for key game events
console.log('📋 Requirement 9.7: Audio feedback for key game events\n');

verify('WHEN key game events occur THEN the system SHALL provide audio feedback', () => {
    const audioManager = new AudioManager();
    
    // Test that AudioManager can be created and initialized
    if (!audioManager) throw new Error('AudioManager not created');
    
    // Test that it has methods for key game events
    const requiredMethods = [
        'playBetPlaced', 'playBetWin', 'playBetLoss', 'playPowerUpAwarded',
        'playGoal', 'playActionBettingOpportunity', 'playCountdownTick',
        'playMatchStart', 'playMatchEnd'
    ];
    
    requiredMethods.forEach(method => {
        if (typeof audioManager[method] !== 'function') {
            throw new Error(`Missing required method: ${method}`);
        }
    });
    
    audioManager.destroy();
});

verify('Audio feedback SHALL support bet placement events', () => {
    const audioManager = new AudioManager();
    
    // Should have bet-related sounds
    if (!audioManager.soundConfig.betPlaced) throw new Error('Missing betPlaced sound');
    if (!audioManager.soundConfig.betWin) throw new Error('Missing betWin sound');
    if (!audioManager.soundConfig.betLoss) throw new Error('Missing betLoss sound');
    
    // Should not throw when playing bet sounds
    audioManager.playBetPlaced();
    audioManager.playBetWin();
    audioManager.playBetLoss();
    
    audioManager.destroy();
});

verify('Audio feedback SHALL support power-up events', () => {
    const audioManager = new AudioManager();
    
    if (!audioManager.soundConfig.powerUpAwarded) throw new Error('Missing powerUpAwarded sound');
    
    // Should not throw when playing power-up sound
    audioManager.playPowerUpAwarded();
    
    audioManager.destroy();
});

verify('Audio feedback SHALL support goal events', () => {
    const audioManager = new AudioManager();
    
    if (!audioManager.soundConfig.goal) throw new Error('Missing goal sound');
    
    // Should not throw when playing goal sound
    audioManager.playGoal();
    
    audioManager.destroy();
});

verify('Audio feedback SHALL support action betting events', () => {
    const audioManager = new AudioManager();
    
    if (!audioManager.soundConfig.actionBettingOpportunity) {
        throw new Error('Missing actionBettingOpportunity sound');
    }
    if (!audioManager.soundConfig.countdownTick) {
        throw new Error('Missing countdownTick sound');
    }
    if (!audioManager.soundConfig.countdownWarning) {
        throw new Error('Missing countdownWarning sound');
    }
    
    // Should not throw when playing action betting sounds
    audioManager.playActionBettingOpportunity();
    audioManager.playCountdownTick();
    audioManager.playCountdownWarning();
    
    audioManager.destroy();
});

verify('Audio feedback SHALL support match events', () => {
    const audioManager = new AudioManager();
    
    if (!audioManager.soundConfig.matchStart) throw new Error('Missing matchStart sound');
    if (!audioManager.soundConfig.matchEnd) throw new Error('Missing matchEnd sound');
    
    // Should not throw when playing match sounds
    audioManager.playMatchStart();
    audioManager.playMatchEnd();
    
    audioManager.destroy();
});

verify('Audio system SHALL provide volume control', () => {
    const audioManager = new AudioManager();
    
    // Should have volume control methods
    if (typeof audioManager.setVolume !== 'function') {
        throw new Error('Missing setVolume method');
    }
    if (typeof audioManager.getVolume !== 'function') {
        throw new Error('Missing getVolume method');
    }
    
    // Should accept valid volume values
    audioManager.setVolume(0);
    if (audioManager.getVolume() !== 0) throw new Error('Volume not set to 0');
    
    audioManager.setVolume(0.5);
    if (audioManager.getVolume() !== 0.5) throw new Error('Volume not set to 0.5');
    
    audioManager.setVolume(1);
    if (audioManager.getVolume() !== 1) throw new Error('Volume not set to 1');
    
    audioManager.destroy();
});

verify('Audio system SHALL provide mute functionality', () => {
    const audioManager = new AudioManager();
    
    // Should have mute control methods
    if (typeof audioManager.mute !== 'function') {
        throw new Error('Missing mute method');
    }
    if (typeof audioManager.isMuted !== 'function') {
        throw new Error('Missing isMuted method');
    }
    if (typeof audioManager.toggleMute !== 'function') {
        throw new Error('Missing toggleMute method');
    }
    
    // Should control mute state
    audioManager.mute(true);
    if (!audioManager.isMuted()) throw new Error('Mute not working');
    
    audioManager.mute(false);
    if (audioManager.isMuted()) throw new Error('Unmute not working');
    
    audioManager.toggleMute();
    if (!audioManager.isMuted()) throw new Error('Toggle mute not working');
    
    audioManager.destroy();
});

verify('Audio system SHALL provide fallback for audio loading failures', () => {
    // Test with no AudioContext available
    const originalAudioContext = global.AudioContext;
    delete global.AudioContext;
    delete global.webkitAudioContext;
    
    const audioManager = new AudioManager();
    
    // Should not throw errors even without audio support
    audioManager.playSound('betPlaced');
    audioManager.setVolume(0.5);
    audioManager.mute(true);
    
    // Should report not initialized but still function
    if (audioManager.isInitialized()) {
        throw new Error('Should not be initialized without AudioContext');
    }
    
    // Restore AudioContext
    global.AudioContext = originalAudioContext;
    
    audioManager.destroy();
});

verify('Audio system SHALL use simple tones or basic audio files for prototype', () => {
    const audioManager = new AudioManager();
    
    // Should use Web Audio API with simple tones (not external files)
    if (!audioManager.soundConfig) throw new Error('Missing sound configuration');
    
    // All sounds should have frequency, duration, and type (indicating tones)
    Object.values(audioManager.soundConfig).forEach(config => {
        if (typeof config.frequency !== 'number') {
            throw new Error('Sound config missing frequency (not using tones)');
        }
        if (typeof config.duration !== 'number') {
            throw new Error('Sound config missing duration');
        }
        if (typeof config.type !== 'string') {
            throw new Error('Sound config missing type');
        }
    });
    
    audioManager.destroy();
});

verify('Audio system SHALL handle errors gracefully', () => {
    const audioManager = new AudioManager();
    
    // Should handle invalid sound events
    audioManager.playSound('invalidEvent'); // Should not throw
    
    // Should handle invalid volume values
    try {
        audioManager.setVolume(-1);
        throw new Error('Should have thrown for invalid volume');
    } catch (error) {
        if (!error.message.includes('Volume must be a number between 0 and 1')) {
            throw new Error('Wrong error message for invalid volume');
        }
    }
    
    audioManager.destroy();
});

// Additional implementation quality checks
console.log('\n📋 Implementation Quality Checks\n');

verify('AudioManager SHALL be properly modularized', () => {
    const audioManager = new AudioManager();
    
    // Should be a class with proper methods
    if (typeof AudioManager !== 'function') {
        throw new Error('AudioManager should be a class');
    }
    
    // Should have proper initialization
    if (typeof audioManager.initializeAudio !== 'function') {
        throw new Error('Missing initializeAudio method');
    }
    
    // Should have proper cleanup
    if (typeof audioManager.destroy !== 'function') {
        throw new Error('Missing destroy method');
    }
    
    audioManager.destroy();
});

verify('AudioManager SHALL provide comprehensive status information', () => {
    const audioManager = new AudioManager();
    
    const status = audioManager.getStatus();
    
    const requiredStatusFields = ['initialized', 'muted', 'volume', 'contextState', 'supportedEvents'];
    requiredStatusFields.forEach(field => {
        if (!(field in status)) {
            throw new Error(`Missing status field: ${field}`);
        }
    });
    
    if (!Array.isArray(status.supportedEvents)) {
        throw new Error('supportedEvents should be an array');
    }
    
    audioManager.destroy();
});

verify('AudioManager SHALL support testing and debugging', () => {
    const audioManager = new AudioManager();
    
    // Should have test functionality
    if (typeof audioManager.testAllSounds !== 'function') {
        throw new Error('Missing testAllSounds method');
    }
    
    // Should not throw when testing
    audioManager.testAllSounds();
    
    audioManager.destroy();
});

// Summary
console.log('\n==========================================');
console.log(`Verification Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.log('\n❌ Requirements verification failed');
    console.log('Please address the failed requirements before proceeding.\n');
    process.exit(1);
} else {
    console.log('\n✅ All requirements verified successfully!');
    console.log('\n📊 AudioManager Implementation Summary:');
    
    const audioManager = new AudioManager();
    const status = audioManager.getStatus();
    
    console.log(`  • Sound Events: ${status.supportedEvents.length}`);
    console.log(`  • Volume Control: ✓`);
    console.log(`  • Mute Functionality: ✓`);
    console.log(`  • Error Handling: ✓`);
    console.log(`  • Graceful Fallback: ✓`);
    console.log(`  • Simple Tones: ✓`);
    console.log(`  • Testing Support: ✓`);
    
    console.log('\n🎯 Integration Points:');
    console.log('  • BettingManager: playBetPlaced(), playBetWin(), playBetLoss()');
    console.log('  • PowerUpManager: playPowerUpAwarded()');
    console.log('  • ActionBetting: playActionBettingOpportunity(), playCountdownTick()');
    console.log('  • EventManager: playGoal()');
    console.log('  • GameController: playMatchStart(), playMatchEnd()');
    
    console.log('\n🚀 AudioManager is ready for integration with the game system!');
    
    audioManager.destroy();
}

console.log();