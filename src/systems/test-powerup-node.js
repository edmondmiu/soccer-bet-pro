#!/usr/bin/env node

/**
 * Node.js test runner for PowerUpManager
 * 
 * This script runs all PowerUpManager tests in a Node.js environment
 * and provides detailed output about test results.
 */

import { PowerUpManagerTests } from './PowerUpManager.test.js';

console.log('🎮 PowerUpManager Node.js Test Runner');
console.log('=====================================\n');

console.log('📋 Requirements Being Tested:');
console.log('- 5.1: 80% probability power-up award on action bet wins');
console.log('- 5.2: Display power-up award message and UI button');
console.log('- 5.3: Apply 2x multiplier to full-match bet winnings');
console.log('- 5.4: Single power-up holding limitation');
console.log('- 5.6: Classic mode disables all power-up mechanics\n');

// Run all tests
const success = PowerUpManagerTests.runAllTests();

// Exit with appropriate code
process.exit(success ? 0 : 1);