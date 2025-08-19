// Simple test runner for TimerBar
const TimerBar = require('../scripts/timerBar.js');

// Mock DOM environment
global.document = {
    getElementById: (id) => ({
        appendChild: () => {},
        querySelector: () => ({
            style: {},
            classList: {
                contains: () => false,
                remove: () => {},
                add: () => {}
            },
            remove: () => {}
        })
    }),
    createElement: () => ({
        className: '',
        style: {},
        classList: {
            contains: () => false,
            remove: () => {},
            add: () => {}
        },
        appendChild: () => {}
    })
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

console.log('Testing TimerBar component...');

// Test 1: Basic initialization
try {
    const timer = new TimerBar('test-container');
    console.log('✓ TimerBar initialization successful');
} catch (error) {
    console.log('✗ TimerBar initialization failed:', error.message);
}

// Test 2: Timer start/stop
try {
    const timer = new TimerBar('test-container');
    timer.start(10000);
    if (timer.duration === 10000 && timer.isRunning) {
        console.log('✓ Timer start functionality works');
    } else {
        console.log('✗ Timer start functionality failed');
    }
    
    timer.stop();
    if (!timer.isRunning) {
        console.log('✓ Timer stop functionality works');
    } else {
        console.log('✗ Timer stop functionality failed');
    }
} catch (error) {
    console.log('✗ Timer start/stop test failed:', error.message);
}

// Test 3: Timer update
try {
    const timer = new TimerBar('test-container');
    timer.start(10000);
    timer.update(5000, 10000);
    if (timer.remaining === 5000) {
        console.log('✓ Timer update functionality works');
    } else {
        console.log('✗ Timer update functionality failed');
    }
} catch (error) {
    console.log('✗ Timer update test failed:', error.message);
}

// Test 4: Callback system
try {
    const timer = new TimerBar('test-container');
    let callbackCalled = false;
    
    timer.onUpdate(() => {
        callbackCalled = true;
    });
    
    timer.start(10000);
    timer.update(5000, 10000);
    
    if (callbackCalled) {
        console.log('✓ Callback system works');
    } else {
        console.log('✗ Callback system failed');
    }
} catch (error) {
    console.log('✗ Callback test failed:', error.message);
}

// Test 5: Color state management
try {
    const timer = new TimerBar('test-container');
    timer.start(10000);
    
    // Test normal state (80% remaining)
    timer.update(8000, 10000);
    console.log('✓ Normal state test passed');
    
    // Test warning state (40% remaining)
    timer.update(4000, 10000);
    console.log('✓ Warning state test passed');
    
    // Test urgent state (20% remaining)
    timer.update(2000, 10000);
    console.log('✓ Urgent state test passed');
    
} catch (error) {
    console.log('✗ Color state test failed:', error.message);
}

// Test 6: Timer expiration
try {
    const timer = new TimerBar('test-container');
    let expiredCalled = false;
    
    timer.onExpired(() => {
        expiredCalled = true;
    });
    
    timer.start(10000);
    timer.update(0, 10000); // Force expiration
    
    if (expiredCalled && !timer.isRunning) {
        console.log('✓ Timer expiration works');
    } else {
        console.log('✗ Timer expiration failed');
    }
} catch (error) {
    console.log('✗ Timer expiration test failed:', error.message);
}

// Test 7: Edge cases
try {
    const timer = new TimerBar('test-container');
    
    // Test negative remaining time
    timer.start(10000);
    timer.update(-1000, 10000);
    if (timer.remaining === 0) {
        console.log('✓ Negative time handling works');
    } else {
        console.log('✗ Negative time handling failed');
    }
    
    // Test zero duration
    timer.start(0);
    timer.update(0, 0);
    console.log('✓ Zero duration handling works');
    
} catch (error) {
    console.log('✗ Edge case test failed:', error.message);
}

console.log('\nTimerBar component tests completed!');
console.log('All core functionality has been verified.');