#!/usr/bin/env node

/**
 * Simple test runner for BettingManager
 */

import { runTests } from './BettingManager.test.js';

console.log('🎯 Running BettingManager Tests...\n');

try {
    const results = runTests();
    
    if (results.failed === 0) {
        console.log('\n🎉 All tests passed successfully!');
        process.exit(0);
    } else {
        console.log(`\n❌ ${results.failed} test(s) failed`);
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
}