/**
 * Node.js Test for Task 6: Action Bet Amount Pre-population
 * 
 * This test verifies the implementation without requiring a browser environment.
 */

// Mock DOM environment for Node.js testing
global.document = {
    getElementById: function(id) {
        return {
            value: '',
            textContent: '',
            classList: {
                add: function() {},
                remove: function() {},
                toggle: function() {}
            },
            focus: function() {},
            select: function() {}
        };
    },
    createElement: function() {
        return {
            id: '',
            className: '',
            innerHTML: '',
            appendChild: function() {},
            remove: function() {}
        };
    },
    body: {
        appendChild: function() {}
    }
};

global.window = {
    addEventToFeed: function() {},
    render: function() {}
};

// Import modules using dynamic import
async function runTests() {
    try {
        console.log('=== Task 6: Action Bet Amount Pre-population Tests ===');
        console.log('');

        // Import gameState module
        const gameStateModule = await import('../scripts/gameState.js');
        const {
            resetState,
            updateBetAmountMemory,
            getBetAmountMemory,
            getDefaultBetAmount,
            validateBetAmount,
            updateState
        } = gameStateModule;

        // Import betting module
        const bettingModule = await import('../scripts/betting.js');
        const { placeBet } = bettingModule;

        // Test 1: Verify separate memory storage for bet types
        console.log('Test 1: Separate memory storage for bet types');
        try {
            resetState();
            
            // Set different amounts for different bet types
            updateBetAmountMemory('fullMatch', 100);
            updateBetAmountMemory('opportunity', 75);
            
            // Verify they are stored separately
            const fullMatchAmount = getBetAmountMemory('fullMatch');
            const opportunityAmount = getBetAmountMemory('opportunity');
            
            if (fullMatchAmount === 100 && opportunityAmount === 75) {
                console.log('✅ Separate memory for bet types: PASSED');
                console.log(`   Full match: ${fullMatchAmount}, Opportunity: ${opportunityAmount}`);
            } else {
                console.log('❌ Separate memory for bet types: FAILED');
                console.log(`   Full match: ${fullMatchAmount}, Opportunity: ${opportunityAmount}`);
            }
        } catch (error) {
            console.log('❌ Test 1 failed with error:', error.message);
        }

        // Test 2: Verify bet amount storage when placing action bets
        console.log('\nTest 2: Bet amount storage when placing action bets');
        try {
            resetState();
            updateState({ wallet: 1000 });
            
            // Place an action bet
            const success = placeBet('action', 'Red Card', 5.0, 30, 'FOUL_OUTCOME');
            
            if (success) {
                // Verify the amount was stored in opportunity memory
                const storedAmount = getBetAmountMemory('opportunity');
                
                if (storedAmount === 30) {
                    console.log('✅ Action bet amount storage: PASSED');
                    console.log(`   Stored amount: ${storedAmount}`);
                } else {
                    console.log('❌ Action bet amount storage: FAILED');
                    console.log(`   Expected: 30, Got: ${storedAmount}`);
                }
            } else {
                console.log('❌ Action bet amount storage: FAILED - bet placement failed');
            }
        } catch (error) {
            console.log('❌ Test 2 failed with error:', error.message);
        }

        // Test 3: Verify full match bet amount storage
        console.log('\nTest 3: Full match bet amount storage');
        try {
            resetState();
            updateState({ wallet: 1000 });
            
            // Place a full match bet
            const success = placeBet('full-match', 'HOME', 2.5, 50);
            
            if (success) {
                // Verify the amount was stored in fullMatch memory
                const storedAmount = getBetAmountMemory('fullMatch');
                
                if (storedAmount === 50) {
                    console.log('✅ Full match bet amount storage: PASSED');
                    console.log(`   Stored amount: ${storedAmount}`);
                } else {
                    console.log('❌ Full match bet amount storage: FAILED');
                    console.log(`   Expected: 50, Got: ${storedAmount}`);
                }
            } else {
                console.log('❌ Full match bet amount storage: FAILED - bet placement failed');
            }
        } catch (error) {
            console.log('❌ Test 3 failed with error:', error.message);
        }

        // Test 4: Verify validation of bet amounts
        console.log('\nTest 4: Validation of bet amounts');
        try {
            const testCases = [
                { amount: -10, expected: false, description: 'negative amount' },
                { amount: 0, expected: false, description: 'zero amount' },
                { amount: 'invalid', expected: false, description: 'string amount' },
                { amount: null, expected: false, description: 'null amount' },
                { amount: undefined, expected: false, description: 'undefined amount' },
                { amount: 15000, expected: false, description: 'excessive amount' },
                { amount: 1, expected: true, description: 'valid small amount' },
                { amount: 25, expected: true, description: 'valid default amount' },
                { amount: 100, expected: true, description: 'valid medium amount' },
                { amount: 500, expected: true, description: 'valid large amount' }
            ];
            
            let passedTests = 0;
            
            testCases.forEach(testCase => {
                const isValid = validateBetAmount(testCase.amount);
                
                if (isValid === testCase.expected) {
                    console.log(`   ✅ Correctly validated ${testCase.description}: ${testCase.amount} -> ${isValid}`);
                    passedTests++;
                } else {
                    console.log(`   ❌ Incorrectly validated ${testCase.description}: ${testCase.amount} -> ${isValid} (expected ${testCase.expected})`);
                }
            });
            
            if (passedTests === testCases.length) {
                console.log('✅ Validation of bet amounts: PASSED');
            } else {
                console.log('❌ Validation of bet amounts: FAILED');
                console.log(`   ${passedTests}/${testCases.length} tests passed`);
            }
        } catch (error) {
            console.log('❌ Test 4 failed with error:', error.message);
        }

        // Test 5: Verify error handling for invalid bet types
        console.log('\nTest 5: Error handling for invalid bet types');
        try {
            resetState();
            
            // Test invalid bet type for getBetAmountMemory
            const invalidAmount = getBetAmountMemory('invalid');
            const defaultAmount = getDefaultBetAmount();
            
            if (invalidAmount === defaultAmount) {
                console.log('✅ Error handling for invalid bet type: PASSED');
                console.log(`   Returned default amount: ${invalidAmount}`);
            } else {
                console.log('❌ Error handling for invalid bet type: FAILED');
                console.log(`   Expected: ${defaultAmount}, Got: ${invalidAmount}`);
            }
            
            // Test invalid bet type for updateBetAmountMemory
            updateBetAmountMemory('invalid', 100);
            const unchangedAmount = getBetAmountMemory('fullMatch');
            
            if (unchangedAmount === defaultAmount) {
                console.log('✅ Error handling for invalid update: PASSED');
                console.log(`   Memory unchanged: ${unchangedAmount}`);
            } else {
                console.log('❌ Error handling for invalid update: FAILED');
                console.log(`   Memory was modified: ${unchangedAmount}`);
            }
        } catch (error) {
            console.log('❌ Test 5 failed with error:', error.message);
        }

        // Test 6: Verify memory persistence across multiple operations
        console.log('\nTest 6: Memory persistence across multiple operations');
        try {
            resetState();
            updateState({ wallet: 1000 });
            
            // Place multiple bets of different types
            placeBet('full-match', 'HOME', 2.5, 80);
            placeBet('action', 'Yellow Card', 3.0, 45, 'FOUL_OUTCOME');
            placeBet('full-match', 'DRAW', 3.2, 120);
            placeBet('action', 'Corner', 2.8, 35, 'CORNER_OUTCOME');
            
            // Verify final stored amounts
            const finalFullMatch = getBetAmountMemory('fullMatch');
            const finalOpportunity = getBetAmountMemory('opportunity');
            
            if (finalFullMatch === 120 && finalOpportunity === 35) {
                console.log('✅ Memory persistence across multiple operations: PASSED');
                console.log(`   Final full match: ${finalFullMatch}, Final opportunity: ${finalOpportunity}`);
            } else {
                console.log('❌ Memory persistence across multiple operations: FAILED');
                console.log(`   Expected full match: 120, Got: ${finalFullMatch}`);
                console.log(`   Expected opportunity: 35, Got: ${finalOpportunity}`);
            }
        } catch (error) {
            console.log('❌ Test 6 failed with error:', error.message);
        }

        console.log('\n=== All Task 6 Tests Completed ===');
        
    } catch (error) {
        console.error('Failed to run tests:', error);
    }
}

// Run tests
runTests();