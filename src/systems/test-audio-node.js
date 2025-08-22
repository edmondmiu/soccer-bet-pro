#!/usr/bin/env node

/**
 * AudioManager Node.js Test Runner
 * 
 * Runs AudioManager tests in Node.js environment with mocked Web Audio API
 */

// Mock Web Audio API for Node.js environment
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

    resume() {
        return Promise.resolve();
    }

    close() {
        return Promise.resolve();
    }
};

// Mock DOM for event listeners
global.document = {
    addEventListener: () => {},
    dispatchEvent: () => {}
};

// Mock console methods to capture output
const originalConsole = { ...console };
const logs = [];

console.log = (...args) => {
    logs.push({ type: 'log', args });
    originalConsole.log(...args);
};

console.warn = (...args) => {
    logs.push({ type: 'warn', args });
    originalConsole.warn(...args);
};

console.error = (...args) => {
    logs.push({ type: 'error', args });
    originalConsole.error(...args);
};

// Import and test AudioManager
import { AudioManager } from './AudioManager.js';

async function runTests() {
    console.log('🔊 AudioManager Node.js Test Runner');
    console.log('=====================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, testFn) {
        try {
            testFn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (error) {
            console.error(`✗ ${name}: ${error.message}`);
            failed++;
        }
    }

    function asyncTest(name, testFn) {
        return testFn()
            .then(() => {
                console.log(`✓ ${name}`);
                passed++;
            })
            .catch(error => {
                console.error(`✗ ${name}: ${error.message}`);
                failed++;
            });
    }

    // Test 1: Basic Initialization
    test('AudioManager initializes correctly', () => {
        const audioManager = new AudioManager();
        // In Node.js environment, AudioManager should not initialize but should still function
        if (audioManager.getVolume() !== 0.7) throw new Error('Default volume incorrect');
        if (audioManager.isMuted()) throw new Error('Should not be muted by default');
        audioManager.destroy();
    });

    // Test 2: Sound Configuration
    test('All required sound events are configured', () => {
        const audioManager = new AudioManager();
        const requiredEvents = [
            'betPlaced', 'betWin', 'betLoss', 'powerUpAwarded',
            'actionBettingOpportunity', 'countdownTick', 'countdownWarning',
            'goal', 'matchStart', 'matchEnd'
        ];

        requiredEvents.forEach(event => {
            if (!audioManager.soundConfig[event]) {
                throw new Error(`Missing sound configuration for ${event}`);
            }
        });
        audioManager.destroy();
    });

    // Test 3: Volume Control
    test('Volume control works correctly', () => {
        const audioManager = new AudioManager();
        
        audioManager.setVolume(0.5);
        if (audioManager.getVolume() !== 0.5) throw new Error('Volume not set correctly');
        
        audioManager.setVolume(0);
        if (audioManager.getVolume() !== 0) throw new Error('Volume not set to 0');
        
        audioManager.setVolume(1);
        if (audioManager.getVolume() !== 1) throw new Error('Volume not set to 1');
        
        audioManager.destroy();
    });

    // Test 4: Volume Validation
    test('Volume validation rejects invalid values', () => {
        const audioManager = new AudioManager();
        
        const invalidValues = [-0.1, 1.1, 'invalid', null, undefined];
        invalidValues.forEach(value => {
            try {
                audioManager.setVolume(value);
                throw new Error(`Should have rejected volume value: ${value}`);
            } catch (error) {
                if (!error.message.includes('Volume must be a number between 0 and 1')) {
                    throw new Error(`Wrong error message for ${value}: ${error.message}`);
                }
            }
        });
        
        audioManager.destroy();
    });

    // Test 5: Mute Functionality
    test('Mute functionality works correctly', () => {
        const audioManager = new AudioManager();
        
        if (audioManager.isMuted()) throw new Error('Should not be muted initially');
        
        audioManager.mute(true);
        if (!audioManager.isMuted()) throw new Error('Should be muted after mute(true)');
        
        audioManager.mute(false);
        if (audioManager.isMuted()) throw new Error('Should not be muted after mute(false)');
        
        const toggleResult = audioManager.toggleMute();
        if (!toggleResult || !audioManager.isMuted()) throw new Error('Toggle mute failed');
        
        audioManager.destroy();
    });

    // Test 6: Sound Playback (No Errors)
    test('Sound playback does not throw errors', () => {
        const audioManager = new AudioManager();
        
        // Test all sound events
        Object.keys(audioManager.soundConfig).forEach(eventType => {
            audioManager.playSound(eventType);
        });
        
        // Test convenience methods
        audioManager.playBetPlaced();
        audioManager.playBetWin();
        audioManager.playBetLoss();
        audioManager.playPowerUpAwarded();
        audioManager.playActionBettingOpportunity();
        audioManager.playCountdownTick();
        audioManager.playCountdownWarning();
        audioManager.playGoal();
        audioManager.playMatchStart();
        audioManager.playMatchEnd();
        
        audioManager.destroy();
    });

    // Test 7: Invalid Sound Events
    test('Invalid sound events are handled gracefully', () => {
        const audioManager = new AudioManager();
        
        // Clear previous logs
        logs.length = 0;
        
        audioManager.playSound('invalidEvent');
        
        // Check if warning was logged
        const warnings = logs.filter(log => log.type === 'warn');
        if (warnings.length === 0) {
            throw new Error('Should have logged warning for invalid sound event');
        }
        
        audioManager.destroy();
    });

    // Test 8: Status Information
    test('Status information is comprehensive', () => {
        const audioManager = new AudioManager();
        const status = audioManager.getStatus();
        
        const requiredProperties = ['initialized', 'muted', 'volume', 'contextState', 'supportedEvents'];
        requiredProperties.forEach(prop => {
            if (!(prop in status)) throw new Error(`Missing status property: ${prop}`);
        });
        
        if (!Array.isArray(status.supportedEvents)) throw new Error('supportedEvents should be array');
        if (status.supportedEvents.length === 0) throw new Error('supportedEvents should not be empty');
        
        audioManager.destroy();
    });

    // Test 9: Cleanup and Destruction
    test('Cleanup works correctly', () => {
        const audioManager = new AudioManager();
        
        audioManager.destroy();
        
        if (audioManager.audioContext !== null) throw new Error('Audio context not cleaned up');
        if (audioManager.initialized) throw new Error('Should not be initialized after destroy');
    });

    // Test 10: Error Handling with No Audio Context
    test('Handles missing Web Audio API gracefully', () => {
        // Temporarily remove AudioContext
        const originalAudioContext = global.AudioContext;
        delete global.AudioContext;
        delete global.webkitAudioContext;
        
        const audioManager = new AudioManager();
        
        if (audioManager.isInitialized()) throw new Error('Should not be initialized without AudioContext');
        
        // Should not throw errors
        audioManager.playSound('betPlaced');
        audioManager.setVolume(0.5);
        audioManager.mute(true);
        
        // Restore AudioContext
        global.AudioContext = originalAudioContext;
        
        audioManager.destroy();
    });

    // Test 11: Test All Sounds Function
    test('testAllSounds function works', () => {
        const audioManager = new AudioManager();
        
        // Should not throw
        audioManager.testAllSounds();
        
        audioManager.destroy();
    });

    // Test 12: Muted Playback Prevention
    test('Muted playback is prevented', () => {
        const audioManager = new AudioManager();
        
        // Mock the generateTone method to track calls
        let toneCalls = 0;
        const originalGenerateTone = audioManager.generateTone;
        audioManager.generateTone = () => {
            toneCalls++;
            originalGenerateTone.call(audioManager, ...arguments);
        };
        
        // Play sound normally
        audioManager.playSound('betPlaced');
        const normalCalls = toneCalls;
        
        // Mute and play sound
        audioManager.mute(true);
        audioManager.playSound('betPlaced');
        
        if (toneCalls !== normalCalls) {
            throw new Error('Sound should not play when muted');
        }
        
        audioManager.destroy();
    });

    // Summary
    console.log('\n=====================================');
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        
        // Test integration with other modules
        console.log('\n🔗 Testing Integration Requirements...');
        
        const audioManager = new AudioManager();
        
        // Verify all required events from requirements are supported
        const requiredGameEvents = [
            'betPlaced', 'betWin', 'betLoss', 'powerUpAwarded',
            'goal', 'actionBettingOpportunity', 'countdownTick',
            'matchStart', 'matchEnd'
        ];
        
        console.log('Required game events:');
        requiredGameEvents.forEach(event => {
            if (audioManager.soundConfig[event]) {
                console.log(`  ✓ ${event}`);
            } else {
                console.log(`  ✗ ${event} - MISSING`);
                failed++;
            }
        });
        
        console.log('\n📊 AudioManager Features:');
        console.log(`  • Sound Events: ${Object.keys(audioManager.soundConfig).length}`);
        console.log(`  • Volume Control: ✓`);
        console.log(`  • Mute Functionality: ✓`);
        console.log(`  • Error Handling: ✓`);
        console.log(`  • Graceful Fallback: ✓`);
        
        audioManager.destroy();
        
        if (failed === 0) {
            console.log('\n🎉 AudioManager implementation complete and ready for integration!');
        }
    }
}

// Run tests
runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});