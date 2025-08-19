/**
 * Test Suite: Task 6 - Action Bet Amount Pre-population
 * 
 * This test suite verifies that action betting pre-populates with the last opportunity amount,
 * stores amounts in memory separately from full match bets, and includes proper validation
 * and error handling for pre-populated amounts.
 * 
 * Requirements tested:
 * - 3.2: Store opportunity bet amounts separately from full match bets
 * - 3.4: Pre-populate opportunity betting forms with last amount
 * - 3.6: Validate and handle errors for pre-populated amounts
 */

// Mock DOM elements for testing
function setupMockDOM() {
    // Create action bet slip modal elements
    const actionSlipAmount = document.createElement('input');
    actionSlipAmount.id = 'action-slip-amount';
    actionSlipAmount.type = 'number';
    document.body.appendChild(actionSlipAmount);
    
    const actionSlipTitle = document.createElement('h2');
    actionSlipTitle.id = 'action-slip-title';
    document.body.appendChild(actionSlipTitle);
    
    const actionSlipDescription = document.createElement('p');
    actionSlipDescription.id = 'action-slip-description';
    document.body.appendChild(actionSlipDescription);
    
    const actionBetSlipModal = document.createElement('div');
    actionBetSlipModal.id = 'action-bet-slip-modal';
    actionBetSlipModal.className = 'hidden';
    document.body.appendChild(actionBetSlipModal);
    
    // Create inline bet slip elements for full match betting
    const inlineStakeAmount = document.createElement('input');
    inlineStakeAmount.id = 'inline-stake-amount';
    inlineStakeAmount.type = 'number';
    document.body.appendChild(inlineStakeAmount);
    
    const inlineBetSlip = document.createElement('div');
    inlineBetSlip.id = 'inline-bet-slip';
    inlineBetSlip.className = 'hidden';
    document.body.appendChild(inlineBetSlip);
}

function cleanupMockDOM() {
    const elements = [
        'action-slip-amount',
        'action-slip-title', 
        'action-slip-description',
        'action-bet-slip-modal',
        'inline-stake-amount',
        'inline-bet-slip'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    });
}

// Test 1: Verify action bet slip pre-populates with last opportunity amount
function testActionBetAmountPrePopulation() {
    console.log('Test 1: Action bet amount pre-population');
    
    try {
        setupMockDOM();
        
        // Import the betting module
        import('./betting.js').then(betting => {
            // Import gameState functions
            import('./gameState.js').then(gameState => {
                // Reset state to ensure clean test
                gameState.resetState();
                
                // Set a previous opportunity bet amount
                gameState.updateBetAmountMemory('opportunity', 50);
                
                // Show action bet slip
                betting.showActionBetSlip('action', 'Yellow Card', 2.5, 'FOUL_OUTCOME');
                
                // Verify amount field is pre-populated
                const amountInput = document.getElementById('action-slip-amount');
                const expectedAmount = '50';
                
                if (amountInput.value === expectedAmount) {
                    console.log('✅ Action bet amount pre-population: PASSED');
                    console.log(`   Expected: ${expectedAmount}, Got: ${amountInput.value}`);
                } else {
                    console.error('❌ Action bet amount pre-population: FAILED');
                    console.error(`   Expected: ${expectedAmount}, Got: ${amountInput.value}`);
                }
                
                cleanupMockDOM();
            });
        });
    } catch (error) {
        console.error('❌ Test 1 failed with error:', error);
        cleanupMockDOM();
    }
}

// Test 2: Verify opportunity bets use separate memory from full match bets
function testSeparateMemoryForBetTypes() {
    console.log('Test 2: Separate memory for bet types');
    
    try {
        setupMockDOM();
        
        import('./gameState.js').then(gameState => {
            // Reset state
            gameState.resetState();
            
            // Set different amounts for different bet types
            gameState.updateBetAmountMemory('fullMatch', 100);
            gameState.updateBetAmountMemory('opportunity', 75);
            
            // Verify they are stored separately
            const fullMatchAmount = gameState.getBetAmountMemory('fullMatch');
            const opportunityAmount = gameState.getBetAmountMemory('opportunity');
            
            if (fullMatchAmount === 100 && opportunityAmount === 75) {
                console.log('✅ Separate memory for bet types: PASSED');
                console.log(`   Full match: ${fullMatchAmount}, Opportunity: ${opportunityAmount}`);
            } else {
                console.error('❌ Separate memory for bet types: FAILED');
                console.error(`   Full match: ${fullMatchAmount}, Opportunity: ${opportunityAmount}`);
            }
            
            cleanupMockDOM();
        });
    } catch (error) {
        console.error('❌ Test 2 failed with error:', error);
        cleanupMockDOM();
    }
}

// Test 3: Verify bet amount storage when placing action bets
function testActionBetAmountStorage() {
    console.log('Test 3: Action bet amount storage');
    
    try {
        setupMockDOM();
        
        import('./betting.js').then(betting => {
            import('./gameState.js').then(gameState => {
                // Reset state and set initial wallet
                gameState.resetState();
                gameState.updateState({ wallet: 1000 });
                
                // Place an action bet
                const success = betting.placeBet('action', 'Red Card', 5.0, 30, 'FOUL_OUTCOME');
                
                if (success) {
                    // Verify the amount was stored in opportunity memory
                    const storedAmount = gameState.getBetAmountMemory('opportunity');
                    
                    if (storedAmount === 30) {
                        console.log('✅ Action bet amount storage: PASSED');
                        console.log(`   Stored amount: ${storedAmount}`);
                    } else {
                        console.error('❌ Action bet amount storage: FAILED');
                        console.error(`   Expected: 30, Got: ${storedAmount}`);
                    }
                } else {
                    console.error('❌ Action bet amount storage: FAILED - bet placement failed');
                }
                
                cleanupMockDOM();
            });
        });
    } catch (error) {
        console.error('❌ Test 3 failed with error:', error);
        cleanupMockDOM();
    }
}

// Test 4: Verify error handling for invalid pre-populated amounts
function testErrorHandlingForPrePopulation() {
    console.log('Test 4: Error handling for pre-populated amounts');
    
    try {
        setupMockDOM();
        
        import('./betting.js').then(betting => {
            import('./gameState.js').then(gameState => {
                // Reset state
                gameState.resetState();
                
                // Corrupt the bet amount memory to test error handling
                gameState.updateState({
                    betAmountMemory: {
                        fullMatch: 'invalid',
                        opportunity: null,
                        lastUpdated: Date.now()
                    }
                });
                
                // Show action bet slip - should fallback to default
                betting.showActionBetSlip('action', 'Yellow Card', 2.5, 'FOUL_OUTCOME');
                
                // Verify fallback to default amount
                const amountInput = document.getElementById('action-slip-amount');
                const expectedDefault = '25'; // Default amount
                
                if (amountInput.value === expectedDefault) {
                    console.log('✅ Error handling for pre-populated amounts: PASSED');
                    console.log(`   Fallback to default: ${amountInput.value}`);
                } else {
                    console.error('❌ Error handling for pre-populated amounts: FAILED');
                    console.error(`   Expected: ${expectedDefault}, Got: ${amountInput.value}`);
                }
                
                cleanupMockDOM();
            });
        });
    } catch (error) {
        console.error('❌ Test 4 failed with error:', error);
        cleanupMockDOM();
    }
}

// Test 5: Verify validation of pre-populated amounts
function testValidationOfPrePopulatedAmounts() {
    console.log('Test 5: Validation of pre-populated amounts');
    
    try {
        import('./gameState.js').then(gameState => {
            // Test various invalid amounts
            const testCases = [
                { amount: -10, description: 'negative amount' },
                { amount: 0, description: 'zero amount' },
                { amount: 'invalid', description: 'string amount' },
                { amount: null, description: 'null amount' },
                { amount: undefined, description: 'undefined amount' },
                { amount: 15000, description: 'excessive amount' }
            ];
            
            let passedTests = 0;
            
            testCases.forEach(testCase => {
                const isValid = gameState.validateBetAmount(testCase.amount);
                
                if (!isValid) {
                    console.log(`   ✅ Correctly rejected ${testCase.description}: ${testCase.amount}`);
                    passedTests++;
                } else {
                    console.error(`   ❌ Incorrectly accepted ${testCase.description}: ${testCase.amount}`);
                }
            });
            
            // Test valid amounts
            const validAmounts = [1, 25, 50, 100, 500];
            validAmounts.forEach(amount => {
                const isValid = gameState.validateBetAmount(amount);
                
                if (isValid) {
                    console.log(`   ✅ Correctly accepted valid amount: ${amount}`);
                    passedTests++;
                } else {
                    console.error(`   ❌ Incorrectly rejected valid amount: ${amount}`);
                }
            });
            
            if (passedTests === testCases.length + validAmounts.length) {
                console.log('✅ Validation of pre-populated amounts: PASSED');
            } else {
                console.error('❌ Validation of pre-populated amounts: FAILED');
            }
        });
    } catch (error) {
        console.error('❌ Test 5 failed with error:', error);
    }
}

// Run all tests
function runAllTests() {
    console.log('=== Task 6: Action Bet Amount Pre-population Tests ===');
    console.log('');
    
    // Run tests with delays to avoid conflicts
    testActionBetAmountPrePopulation();
    
    setTimeout(() => {
        testSeparateMemoryForBetTypes();
    }, 100);
    
    setTimeout(() => {
        testActionBetAmountStorage();
    }, 200);
    
    setTimeout(() => {
        testErrorHandlingForPrePopulation();
    }, 300);
    
    setTimeout(() => {
        testValidationOfPrePopulatedAmounts();
    }, 400);
    
    setTimeout(() => {
        console.log('');
        console.log('=== All Task 6 Tests Completed ===');
    }, 500);
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testActionBetAmountPrePopulation,
        testSeparateMemoryForBetTypes,
        testActionBetAmountStorage,
        testErrorHandlingForPrePopulation,
        testValidationOfPrePopulatedAmounts,
        runAllTests
    };
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        runAllTests();
    }
}