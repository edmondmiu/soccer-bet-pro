/**
 * Node.js test runner for BettingManager
 * Runs tests in Node.js environment to verify functionality
 */

// Mock DOM globals for Node.js environment
global.window = {};
global.document = {};

// Import the test module
import { runTests } from './BettingManager.test.js';

console.log('🎯 Running BettingManager Tests in Node.js Environment\n');
console.log('=' .repeat(60));

try {
    const results = runTests();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    
    if (results.failed === 0) {
        console.log(`🎉 SUCCESS: All ${results.passed} tests passed!`);
        console.log('✅ BettingManager implementation is working correctly');
        process.exit(0);
    } else {
        console.log(`⚠️  PARTIAL SUCCESS: ${results.passed} passed, ${results.failed} failed`);
        console.log('❌ Some tests failed - review implementation');
        process.exit(1);
    }
} catch (error) {
    console.error('💥 TEST EXECUTION FAILED:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
}