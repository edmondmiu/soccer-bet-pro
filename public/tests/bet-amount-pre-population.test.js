/**
 * Test Suite: Bet Amount Pre-population for Full Match Betting
 * 
 * This test suite verifies that the full match betting system correctly:
 * 1. Pre-populates the amount field with the last full match bet amount
 * 2. Stores new bet amounts in memory after successful bet placement
 * 3. Falls back to default $25 when no previous amount exists
 * 4. Validates that amount validation works with pre-populated values
 * 
 * Requirements tested: 3.1, 3.3, 3.5
 */

// Mock DOM elements
function setupMockDOM() {
    // Create inline bet slip elements
    const inlineBetSlip = document.createElement('div');
    inlineBetSlip.id = 'inline-bet-slip';
    inlineBetSlip.classList.add('hidden');
    document.body.appendChild(inlineBetSlip);
    
    const inlineStakeAmount = document.createElement('input');
    inlineStakeAmount.id = 'inline-stake-amount';
    inlineStakeAmount.type = 'number';
    document.body.appendChild(inlineStakeAmount);
    
    // Create full match bet buttons
    const homeBtn = document.createElement('button');
    homeBtn.id = 'full-match-btn-HOME';
    homeBtn.setAttribute('data-bet-type', 'full-match');
    homeBtn.setAttribute('data-outcome', 'HOME');
    document.body.appendChild(homeBtn);
    
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirm-inline-bet-btn';
    document.body.appendChild(confirmBtn);
}

// Clean up DOM elements
function cleanupMockDOM() {
    const elements = [
        'inline-bet-slip',
        'inline-stake-amount', 
        'full-match-btn-HOME',
        'confirm-inline-bet-btn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    });
}

// Test 1: Pre-populate with last full match amount
async function testPrePopulateWithLastAmount() {
    console.log('🧪 Test 1: Pre-populate with last full match amount');
    
    try {
        setupMockDOM();
        
        // Import required modules
        const { showInlineBetSlip } = await import('../scripts/betting.js');
        const { updateBetAmountMemory, getBetAmountMemory } = await import('../scripts/gameState.js');
        
        // Set up a previous bet amount
        const previousAmount = 50;
        updateBetAmountMemory('fullMatch', previousAmount);
        
        // Verify the amount was stored
        const storedAmount = getBetAmountMemory('fullMatch');
        if (storedAmount !== previousAmount) {
            throw new Error(`Expected stored amount ${previousAmount}, got ${storedAmount}`);
        }
        
        // Show inline bet slip
        showInlineBetSlip('HOME', 2.5);
        
        // Check that the amount field is pre-populated
        const stakeInput = document.getElementById('inline-stake-amount');
        const populatedValue = parseFloat(stakeInput.value);
        
        if (populatedValue !== previousAmount) {
            throw new Error(`Expected pre-populated value ${previousAmount}, got ${populatedValue}`);
        }
        
        // Check that the input is focused and selected
        if (document.activeElement !== stakeInput) {
            console.warn('Input field should be focused after showing bet slip');
        }
        
        console.log('✅ Test 1 passed: Amount field correctly pre-populated with last amount');
        return true;
        
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
        return false;
    } finally {
        cleanupMockDOM();
    }
}

// Test 2: Fallback to default when no previous amount exists
async function testFallbackToDefault() {
    console.log('🧪 Test 2: Fallback to default when no previous amount exists');
    
    try {
        setupMockDOM();
        
        // Import required modules
        const { showInlineBetSlip } = await import('../scripts/betting.js');
        const { resetBetAmountMemory, getDefaultBetAmount } = await import('../scripts/gameState.js');
        
        // Reset memory to ensure no previous amount
        resetBetAmountMemory();
        
        // Show inline bet slip
        showInlineBetSlip('HOME', 2.5);
        
        // Check that the amount field is pre-populated with default
        const stakeInput = document.getElementById('inline-stake-amount');
        const populatedValue = parseFloat(stakeInput.value);
        const defaultAmount = getDefaultBetAmount();
        
        if (populatedValue !== defaultAmount) {
            throw new Error(`Expected default value ${defaultAmount}, got ${populatedValue}`);
        }
        
        console.log('✅ Test 2 passed: Amount field correctly defaults to $25');
        return true;
        
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
        return false;
    } finally {
        cleanupMockDOM();
    }
}

// Test 3: Store amount in memory after successful bet
async function testStoreAmountAfterBet() {
    console.log('🧪 Test 3: Store amount in memory after successful bet');
    
    try {
        setupMockDOM();
        
        // Import required modules
        const { handleConfirmInlineBet } = await import('../scripts/events.js');
        const { updateState, getBetAmountMemory, adjustWalletBalance } = await import('../scripts/gameState.js');
        
        // Set up initial state with sufficient wallet balance
        adjustWalletBalance(1000); // Add $1000 to wallet
        updateState({
            currentBet: {
                type: 'full-match',
                outcome: 'HOME',
                odds: 2.5
            }
        });
        
        // Set a test amount in the input
        const testAmount = 75;
        const stakeInput = document.getElementById('inline-stake-amount');
        stakeInput.value = testAmount.toString();
        
        // Mock the placeBet function to return success
        const originalPlaceBet = window.placeBet;
        let betPlaced = false;
        window.placeBet = () => {
            betPlaced = true;
            return true;
        };
        
        // Mock hideInlineBetSlip
        window.hideInlineBetSlip = () => {};
        
        // Trigger bet confirmation
        handleConfirmInlineBet();
        
        // Restore original function
        window.placeBet = originalPlaceBet;
        
        // Check that bet was placed
        if (!betPlaced) {
            throw new Error('Bet was not placed');
        }
        
        // Check that amount was stored in memory
        const storedAmount = getBetAmountMemory('fullMatch');
        if (storedAmount !== testAmount) {
            throw new Error(`Expected stored amount ${testAmount}, got ${storedAmount}`);
        }
        
        console.log('✅ Test 3 passed: Bet amount correctly stored in memory after successful bet');
        return true;
        
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
        return false;
    } finally {
        cleanupMockDOM();
    }
}

// Test 4: Amount validation works with pre-populated values
async function testValidationWithPrePopulated() {
    console.log('🧪 Test 4: Amount validation works with pre-populated values');
    
    try {
        setupMockDOM();
        
        // Import required modules
        const { showInlineBetSlip } = await import('../scripts/betting.js');
        const { updateBetAmountMemory, validateBet } = await import('../scripts/gameState.js');
        
        // Set up a valid previous bet amount
        const validAmount = 25;
        updateBetAmountMemory('fullMatch', validAmount);
        
        // Show inline bet slip
        showInlineBetSlip('HOME', 2.5);
        
        // Get the pre-populated value
        const stakeInput = document.getElementById('inline-stake-amount');
        const populatedValue = parseFloat(stakeInput.value);
        
        // Validate the pre-populated amount
        const isValid = validateBet(populatedValue);
        
        if (!isValid) {
            throw new Error(`Pre-populated amount ${populatedValue} should be valid`);
        }
        
        console.log('✅ Test 4 passed: Pre-populated amount passes validation');
        return true;
        
    } catch (error) {
        console.error('❌ Test 4 failed:', error.message);
        return false;
    } finally {
        cleanupMockDOM();
    }
}

// Test 5: Error handling when memory retrieval fails
async function testErrorHandling() {
    console.log('🧪 Test 5: Error handling when memory retrieval fails');
    
    try {
        setupMockDOM();
        
        // Import required modules
        const { showInlineBetSlip } = await import('../scripts/betting.js');
        const { getDefaultBetAmount } = await import('../scripts/gameState.js');
        
        // Mock getBetAmountMemory to throw an error
        const originalGetBetAmountMemory = window.getBetAmountMemory;
        window.getBetAmountMemory = () => {
            throw new Error('Memory retrieval failed');
        };
        
        // Show inline bet slip
        showInlineBetSlip('HOME', 2.5);
        
        // Check that fallback to default works
        const stakeInput = document.getElementById('inline-stake-amount');
        const populatedValue = parseFloat(stakeInput.value);
        const defaultAmount = getDefaultBetAmount();
        
        if (populatedValue !== defaultAmount) {
            throw new Error(`Expected fallback to default ${defaultAmount}, got ${populatedValue}`);
        }
        
        // Restore original function
        window.getBetAmountMemory = originalGetBetAmountMemory;
        
        console.log('✅ Test 5 passed: Error handling works correctly with fallback to default');
        return true;
        
    } catch (error) {
        console.error('❌ Test 5 failed:', error.message);
        return false;
    } finally {
        cleanupMockDOM();
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Bet Amount Pre-population Tests');
    console.log('='.repeat(50));
    
    const tests = [
        testPrePopulateWithLastAmount,
        testFallbackToDefault,
        testStoreAmountAfterBet,
        testValidationWithPrePopulated,
        testErrorHandling
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const result = await test();
        if (result) {
            passed++;
        } else {
            failed++;
        }
        console.log(''); // Add spacing between tests
    }
    
    console.log('='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Bet amount pre-population is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
    return failed === 0;
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testPrePopulateWithLastAmount,
        testFallbackToDefault,
        testStoreAmountAfterBet,
        testValidationWithPrePopulated,
        testErrorHandling
    };
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    window.runBetAmountPrePopulationTests = runAllTests;
    
    // Run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        // DOM is already ready
        setTimeout(runAllTests, 100);
    }
}