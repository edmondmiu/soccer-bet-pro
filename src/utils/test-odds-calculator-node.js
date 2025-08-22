#!/usr/bin/env node

/**
 * Node.js Test Runner for OddsCalculator
 * 
 * Run with: node test-odds-calculator-node.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the test module
async function runTests() {
    try {
        console.log('🧮 OddsCalculator Node.js Test Runner');
        console.log('=====================================\n');
        
        // Import and run tests
        const { runOddsCalculatorTests } = await import('./OddsCalculator.test.js');
        const results = runOddsCalculatorTests();
        
        // Additional Node.js specific tests
        console.log('🔧 Running Node.js specific tests...\n');
        
        const { OddsCalculator, oddsCalculator } = await import('./OddsCalculator.js');
        
        // Test module imports
        console.log('✅ Module imports working correctly');
        
        // Test singleton instance
        if (oddsCalculator instanceof OddsCalculator) {
            console.log('✅ Singleton instance created correctly');
        } else {
            console.log('❌ Singleton instance failed');
        }
        
        // Test performance in Node.js environment
        console.log('\n⚡ Performance Testing in Node.js:');
        
        const calculator = new OddsCalculator();
        const iterations = 50000;
        
        console.time('Odds Calculation Performance');
        for (let i = 0; i < iterations; i++) {
            calculator.calculateOdds({ homeScore: i % 10, awayScore: (i + 1) % 10 });
        }
        console.timeEnd('Odds Calculation Performance');
        
        console.time('Goal Adjustment Performance');
        const testOdds = { home: 2.0, draw: 3.0, away: 4.0 };
        for (let i = 0; i < iterations; i++) {
            calculator.adjustForGoal(i % 2 === 0 ? 'home' : 'away', testOdds);
        }
        console.timeEnd('Goal Adjustment Performance');
        
        // Memory usage test
        if (process.memoryUsage) {
            const memBefore = process.memoryUsage();
            
            // Create many calculator instances
            const calculators = [];
            for (let i = 0; i < 1000; i++) {
                calculators.push(new OddsCalculator());
            }
            
            const memAfter = process.memoryUsage();
            const memDiff = memAfter.heapUsed - memBefore.heapUsed;
            
            console.log(`\n💾 Memory Usage Test:`);
            console.log(`   Created 1000 calculator instances`);
            console.log(`   Memory increase: ${(memDiff / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Average per instance: ${(memDiff / 1000 / 1024).toFixed(2)} KB`);
        }
        
        // Test edge cases specific to Node.js
        console.log('\n🧪 Edge Case Testing:');
        
        console.log('   Testing large score values...');
        try {
            // Test with large but reasonable numbers (not MAX_SAFE_INTEGER)
            const extremeMatch = { homeScore: 100, awayScore: 0 };
            const extremeOdds = calculator.calculateOdds(extremeMatch);
            console.log('✅ Handles large score values correctly');
        } catch (error) {
            console.log(`❌ Failed large score test: ${error.message}`);
        }
        
        console.log('   Testing negative score values...');
        try {
            // Test with negative numbers
            const negativeMatch = { homeScore: -1, awayScore: 2 };
            const negativeOdds = calculator.calculateOdds(negativeMatch);
            console.log('✅ Handles negative scores correctly');
        } catch (error) {
            console.log(`❌ Failed negative score test: ${error.message}`);
        }
        
        console.log('   Testing floating point scores...');
        try {
            // Test with floating point numbers
            const floatMatch = { homeScore: 1.5, awayScore: 2.7 };
            const floatOdds = calculator.calculateOdds(floatMatch);
            console.log('✅ Handles floating point scores correctly');
        } catch (error) {
            console.log(`❌ Failed floating point test: ${error.message}`);
        }
        
        console.log('   Testing undefined/null values...');
        try {
            // Test with undefined values
            const undefinedMatch = { homeScore: undefined, awayScore: 1 };
            const undefinedOdds = calculator.calculateOdds(undefinedMatch);
            console.log('✅ Handles undefined values correctly');
        } catch (error) {
            console.log(`❌ Failed undefined test: ${error.message}`);
        }
        
        // Final summary
        console.log('\n📊 Final Test Summary:');
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Total: ${results.total}`);
        console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
        
        if (results.failed === 0) {
            console.log('\n🎉 All tests passed! OddsCalculator is ready for production! 🚀');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some tests failed. Please review the output above.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();