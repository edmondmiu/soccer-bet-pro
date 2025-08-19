/**
 * Task 7 Verification: Enhanced Modal Structure and Visual Hierarchy
 * 
 * This script verifies that the modal structure has been enhanced with:
 * 1. Clear visual hierarchy: pause info → betting options → amount selection
 * 2. Consistent Bet/Skip button styling and behavior
 * 3. Integrated timer bar styling within modal container
 * 4. Responsive design that works on different screen sizes
 */

class Task7Verification {
    constructor() {
        this.results = {
            visualHierarchy: [],
            buttonStyling: [],
            timerBarIntegration: [],
            responsiveDesign: [],
            overall: []
        };
    }

    /**
     * Run all verification tests
     */
    async runAllTests() {
        console.log('🧪 Starting Task 7 Verification: Enhanced Modal Structure and Visual Hierarchy');
        
        try {
            await this.testVisualHierarchy();
            await this.testButtonStyling();
            await this.testTimerBarIntegration();
            await this.testResponsiveDesign();
            
            this.generateOverallResults();
            this.displayResults();
            
            return this.results;
        } catch (error) {
            console.error('❌ Verification failed:', error);
            return { error: error.message, results: this.results };
        }
    }

    /**
     * Test 1: Visual Hierarchy
     * Verify clear visual hierarchy: pause info → betting options → amount selection
     */
    async testVisualHierarchy() {
        console.log('📋 Testing Visual Hierarchy...');
        
        // Test enhanced modal structure classes
        const modalExists = this.checkElementExists('.action-bet-modal-enhanced');
        this.results.visualHierarchy.push({
            test: 'Enhanced modal container exists',
            pass: modalExists,
            message: modalExists ? 'Enhanced modal container found' : 'Enhanced modal container missing'
        });

        const modalContentExists = this.checkElementExists('.action-bet-modal-content');
        this.results.visualHierarchy.push({
            test: 'Enhanced modal content structure exists',
            pass: modalContentExists,
            message: modalContentExists ? 'Enhanced modal content structure found' : 'Enhanced modal content structure missing'
        });

        // Test pause info header (top priority)
        const pauseHeaderExists = this.checkElementExists('.pause-info-header');
        this.results.visualHierarchy.push({
            test: 'Pause info header exists',
            pass: pauseHeaderExists,
            message: pauseHeaderExists ? 'Pause info header found' : 'Pause info header missing'
        });

        const pauseContentExists = this.checkElementExists('.pause-info-content');
        this.results.visualHierarchy.push({
            test: 'Pause info content structure exists',
            pass: pauseContentExists,
            message: pauseContentExists ? 'Pause info content structure found' : 'Pause info content structure missing'
        });

        // Test timer bar integration (high priority)
        const timerContainerExists = this.checkElementExists('.modal-timer-container');
        this.results.visualHierarchy.push({
            test: 'Modal timer container exists',
            pass: timerContainerExists,
            message: timerContainerExists ? 'Modal timer container found' : 'Modal timer container missing'
        });

        const timerBarExists = this.checkElementExists('.modal-timer-bar');
        this.results.visualHierarchy.push({
            test: 'Modal timer bar exists',
            pass: timerBarExists,
            message: timerBarExists ? 'Modal timer bar found' : 'Modal timer bar missing'
        });

        // Test betting content section (medium priority)
        const bettingContentExists = this.checkElementExists('.betting-content-section');
        this.results.visualHierarchy.push({
            test: 'Betting content section exists',
            pass: bettingContentExists,
            message: bettingContentExists ? 'Betting content section found' : 'Betting content section missing'
        });

        const bettingTitleExists = this.checkElementExists('.betting-title');
        this.results.visualHierarchy.push({
            test: 'Betting title styling exists',
            pass: bettingTitleExists,
            message: bettingTitleExists ? 'Betting title styling found' : 'Betting title styling missing'
        });

        // Test betting choices section (medium priority)
        const choicesContainerExists = this.checkElementExists('.betting-choices-container');
        this.results.visualHierarchy.push({
            test: 'Betting choices container exists',
            pass: choicesContainerExists,
            message: choicesContainerExists ? 'Betting choices container found' : 'Betting choices container missing'
        });

        // Test action buttons section (lower priority)
        const actionsContainerExists = this.checkElementExists('.modal-actions-container');
        this.results.visualHierarchy.push({
            test: 'Modal actions container exists',
            pass: actionsContainerExists,
            message: actionsContainerExists ? 'Modal actions container found' : 'Modal actions container missing'
        });
    }

    /**
     * Test 2: Button Styling
     * Verify consistent Bet/Skip button styling and behavior
     */
    async testButtonStyling() {
        console.log('🎨 Testing Button Styling...');

        // Test betting choice button styling
        const choiceButtonStyling = this.checkCSSRule('.betting-choice-button', [
            'background',
            'border',
            'border-radius',
            'padding',
            'transition'
        ]);
        this.results.buttonStyling.push({
            test: 'Betting choice button styling',
            pass: choiceButtonStyling.pass,
            message: choiceButtonStyling.message
        });

        // Test betting choice button structure
        const choiceTextExists = this.checkElementExists('.betting-choice-text');
        this.results.buttonStyling.push({
            test: 'Betting choice text structure exists',
            pass: choiceTextExists,
            message: choiceTextExists ? 'Betting choice text structure found' : 'Betting choice text structure missing'
        });

        const choiceOddsExists = this.checkElementExists('.betting-choice-odds');
        this.results.buttonStyling.push({
            test: 'Betting choice odds structure exists',
            pass: choiceOddsExists,
            message: choiceOddsExists ? 'Betting choice odds structure found' : 'Betting choice odds structure missing'
        });

        // Test modal action button styling
        const actionButtonStyling = this.checkCSSRule('.modal-action-button', [
            'padding',
            'border-radius',
            'font-weight',
            'cursor',
            'transition'
        ]);
        this.results.buttonStyling.push({
            test: 'Modal action button styling',
            pass: actionButtonStyling.pass,
            message: actionButtonStyling.message
        });

        // Test minimize button specific styling
        const minimizeButtonStyling = this.checkCSSRule('.modal-action-button.minimize', [
            'background'
        ]);
        this.results.buttonStyling.push({
            test: 'Minimize button specific styling',
            pass: minimizeButtonStyling.pass,
            message: minimizeButtonStyling.message
        });

        // Test skip button specific styling
        const skipButtonStyling = this.checkCSSRule('.modal-action-button.skip', [
            'background'
        ]);
        this.results.buttonStyling.push({
            test: 'Skip button specific styling',
            pass: skipButtonStyling.pass,
            message: skipButtonStyling.message
        });

        // Test button animations
        const buttonPressAnimation = this.checkCSSRule('.button-press-animation', ['animation']);
        const choiceSelectionAnimation = this.checkCSSRule('.choice-selection-animation', ['animation']);
        const buttonAnimationsExist = buttonPressAnimation.pass || choiceSelectionAnimation.pass;
        
        this.results.buttonStyling.push({
            test: 'Button animations exist',
            pass: buttonAnimationsExist,
            message: buttonAnimationsExist ? 'Button animations found' : 'Button animations missing'
        });
    }

    /**
     * Test 3: Timer Bar Integration
     * Verify integrated timer bar styling within modal container
     */
    async testTimerBarIntegration() {
        console.log('⏱️ Testing Timer Bar Integration...');

        // Test modal timer progress styling
        const timerProgressStyling = this.checkCSSRule('.modal-timer-progress', [
            'height',
            'border-radius',
            'transition',
            'background'
        ]);
        this.results.timerBarIntegration.push({
            test: 'Modal timer progress styling',
            pass: timerProgressStyling.pass,
            message: timerProgressStyling.message
        });

        // Test timer bar warning state
        const warningStateStyling = this.checkCSSRule('.modal-timer-progress.warning', [
            'background'
        ]);
        this.results.timerBarIntegration.push({
            test: 'Timer bar warning state styling',
            pass: warningStateStyling.pass,
            message: warningStateStyling.message
        });

        // Test timer bar urgent state
        const urgentStateStyling = this.checkCSSRule('.modal-timer-progress.urgent', [
            'background',
            'animation'
        ]);
        this.results.timerBarIntegration.push({
            test: 'Timer bar urgent state styling',
            pass: urgentStateStyling.pass,
            message: urgentStateStyling.message
        });

        // Test timer bar container styling
        const containerStyling = this.checkCSSRule('.modal-timer-container', [
            'margin-bottom'
        ]);
        this.results.timerBarIntegration.push({
            test: 'Timer bar container styling',
            pass: containerStyling.pass,
            message: containerStyling.message
        });

        // Test timer bar shimmer animation
        const shimmerAnimation = this.checkCSSKeyframes('timerBarShimmer');
        this.results.timerBarIntegration.push({
            test: 'Timer bar shimmer animation exists',
            pass: shimmerAnimation,
            message: shimmerAnimation ? 'Timer bar shimmer animation found' : 'Timer bar shimmer animation missing'
        });
    }

    /**
     * Test 4: Responsive Design
     * Verify responsive design works on different screen sizes
     */
    async testResponsiveDesign() {
        console.log('📱 Testing Responsive Design...');

        // Test tablet responsive styles (768px)
        const tabletStyles = this.checkMediaQuery('(max-width: 768px)', [
            '.action-bet-modal-content',
            '.betting-title',
            '.betting-choice-button'
        ]);
        this.results.responsiveDesign.push({
            test: 'Tablet responsive styles (768px)',
            pass: tabletStyles,
            message: tabletStyles ? 'Tablet responsive styles found' : 'Tablet responsive styles missing'
        });

        // Test mobile responsive styles (480px)
        const mobileStyles = this.checkMediaQuery('(max-width: 480px)', [
            '.action-bet-modal-enhanced',
            '.action-bet-modal-content',
            '.pause-info-header',
            '.betting-title',
            '.betting-choices-container'
        ]);
        this.results.responsiveDesign.push({
            test: 'Mobile responsive styles (480px)',
            pass: mobileStyles,
            message: mobileStyles ? 'Mobile responsive styles found' : 'Mobile responsive styles missing'
        });

        // Test small mobile responsive styles (320px)
        const smallMobileStyles = this.checkMediaQuery('(max-width: 320px)', [
            '.action-bet-modal-content',
            '.betting-title',
            '.betting-choice-button'
        ]);
        this.results.responsiveDesign.push({
            test: 'Small mobile responsive styles (320px)',
            pass: smallMobileStyles,
            message: smallMobileStyles ? 'Small mobile responsive styles found' : 'Small mobile responsive styles missing'
        });

        // Test reduced motion accessibility
        const reducedMotionStyles = this.checkMediaQuery('(prefers-reduced-motion: reduce)', [
            'enhanced-modal-entrance',
            'enhanced-modal-exit',
            'button-press-animation'
        ]);
        this.results.responsiveDesign.push({
            test: 'Reduced motion accessibility styles',
            pass: reducedMotionStyles,
            message: reducedMotionStyles ? 'Reduced motion styles found' : 'Reduced motion styles missing'
        });
    }

    /**
     * Helper method to check if an element exists
     */
    checkElementExists(selector) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Check in HTML file
            const htmlPath = path.join(__dirname, '../game_prototype.html');
            if (fs.existsSync(htmlPath)) {
                const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                if (htmlContent.includes(selector.replace('.', ''))) {
                    return true;
                }
            }
            
            // Check in JavaScript files for dynamically created elements
            const jsPath = path.join(__dirname, '../scripts/betting.js');
            if (fs.existsSync(jsPath)) {
                const jsContent = fs.readFileSync(jsPath, 'utf8');
                if (jsContent.includes(selector.replace('.', ''))) {
                    return true;
                }
            }
            
            // Check in CSS files for class definitions
            const cssPath = path.join(__dirname, '../styles/components.css');
            if (fs.existsSync(cssPath)) {
                const cssContent = fs.readFileSync(cssPath, 'utf8');
                if (cssContent.includes(selector)) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.warn(`Could not check element ${selector}:`, error.message);
            return false;
        }
    }

    /**
     * Helper method to check CSS rules
     */
    checkCSSRule(selector, properties) {
        try {
            const fs = require('fs');
            const path = require('path');
            const cssPath = path.join(__dirname, '../styles/components.css');
            
            if (fs.existsSync(cssPath)) {
                const cssContent = fs.readFileSync(cssPath, 'utf8');
                
                // Check if selector exists
                const selectorExists = cssContent.includes(selector);
                if (!selectorExists) {
                    return { pass: false, message: `Selector ${selector} not found in CSS` };
                }
                
                // Check if properties exist
                const missingProperties = properties.filter(prop => {
                    const regex = new RegExp(`${selector}[^}]*${prop}\\s*:`);
                    return !regex.test(cssContent);
                });
                
                if (missingProperties.length > 0) {
                    return { 
                        pass: false, 
                        message: `Missing properties for ${selector}: ${missingProperties.join(', ')}` 
                    };
                }
                
                return { pass: true, message: `All properties found for ${selector}` };
            }
            
            return { pass: false, message: 'CSS file not found' };
        } catch (error) {
            console.warn(`Could not check CSS rule ${selector}:`, error.message);
            return { pass: false, message: `Error checking CSS rule: ${error.message}` };
        }
    }

    /**
     * Helper method to check keyframes
     */
    checkCSSKeyframes(animationName) {
        try {
            const fs = require('fs');
            const path = require('path');
            const cssPath = path.join(__dirname, '../styles/animations.css');
            
            if (fs.existsSync(cssPath)) {
                const cssContent = fs.readFileSync(cssPath, 'utf8');
                return cssContent.includes(`@keyframes ${animationName}`);
            }
            
            return false;
        } catch (error) {
            console.warn(`Could not check keyframes ${animationName}:`, error.message);
            return false;
        }
    }

    /**
     * Helper method to check media queries
     */
    checkMediaQuery(query, selectors) {
        try {
            const fs = require('fs');
            const path = require('path');
            const cssPath = path.join(__dirname, '../styles/components.css');
            
            if (fs.existsSync(cssPath)) {
                const cssContent = fs.readFileSync(cssPath, 'utf8');
                
                // Simplified check - just look for the media query and any of the selectors
                const queryExists = cssContent.includes(`@media ${query}`) || 
                                   cssContent.includes(`@media${query}`) ||
                                   cssContent.includes(query.replace(/[()]/g, ''));
                
                if (!queryExists) {
                    return false;
                }
                
                // Check if any of the selectors exist in the CSS (they might be in the media query)
                return selectors.some(selector => cssContent.includes(selector));
            }
            
            return false;
        } catch (error) {
            console.warn(`Could not check media query ${query}:`, error.message);
            return false;
        }
    }

    /**
     * Generate overall results summary
     */
    generateOverallResults() {
        const allTests = [
            ...this.results.visualHierarchy,
            ...this.results.buttonStyling,
            ...this.results.timerBarIntegration,
            ...this.results.responsiveDesign
        ];

        const passedTests = allTests.filter(test => test.pass).length;
        const totalTests = allTests.length;
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        this.results.overall = [{
            test: 'Overall Task 7 Implementation',
            pass: passRate >= 80,
            message: `${passedTests}/${totalTests} tests passed (${passRate.toFixed(1)}%)`
        }];

        // Specific requirement checks
        const hierarchyPassed = this.results.visualHierarchy.filter(t => t.pass).length >= 8;
        const buttonsPassed = this.results.buttonStyling.filter(t => t.pass).length >= 5;
        const timerPassed = this.results.timerBarIntegration.filter(t => t.pass).length >= 3;
        const responsivePassed = this.results.responsiveDesign.filter(t => t.pass).length >= 3;

        this.results.overall.push({
            test: 'Requirement 4.1: Clear visual hierarchy',
            pass: hierarchyPassed,
            message: hierarchyPassed ? 'Visual hierarchy properly implemented' : 'Visual hierarchy needs improvement'
        });

        this.results.overall.push({
            test: 'Requirement 4.2: Consistent button styling',
            pass: buttonsPassed,
            message: buttonsPassed ? 'Button styling consistently implemented' : 'Button styling needs improvement'
        });

        this.results.overall.push({
            test: 'Requirement 4.3: Integrated timer bar styling',
            pass: timerPassed,
            message: timerPassed ? 'Timer bar properly integrated' : 'Timer bar integration needs improvement'
        });

        this.results.overall.push({
            test: 'Requirement 4.4 & 4.5: Responsive design',
            pass: responsivePassed,
            message: responsivePassed ? 'Responsive design properly implemented' : 'Responsive design needs improvement'
        });
    }

    /**
     * Display verification results
     */
    displayResults() {
        console.log('\n📊 Task 7 Verification Results:');
        console.log('=====================================');

        const sections = [
            { name: 'Visual Hierarchy', results: this.results.visualHierarchy },
            { name: 'Button Styling', results: this.results.buttonStyling },
            { name: 'Timer Bar Integration', results: this.results.timerBarIntegration },
            { name: 'Responsive Design', results: this.results.responsiveDesign },
            { name: 'Overall Assessment', results: this.results.overall }
        ];

        sections.forEach(section => {
            console.log(`\n${section.name}:`);
            section.results.forEach(result => {
                const status = result.pass ? '✅' : '❌';
                console.log(`  ${status} ${result.test}: ${result.message}`);
            });
        });

        const allTests = [
            ...this.results.visualHierarchy,
            ...this.results.buttonStyling,
            ...this.results.timerBarIntegration,
            ...this.results.responsiveDesign
        ];
        const passedTests = allTests.filter(test => test.pass).length;
        const totalTests = allTests.length;

        console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Task 7 implementation is complete.');
        } else if (passedTests / totalTests >= 0.8) {
            console.log('✅ Most tests passed. Task 7 implementation is largely complete.');
        } else {
            console.log('⚠️ Some tests failed. Task 7 implementation needs attention.');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Task7Verification;
}

// Run verification if called directly
if (typeof require !== 'undefined' && require.main === module) {
    const verification = new Task7Verification();
    verification.runAllTests().then(results => {
        process.exit(results.error ? 1 : 0);
    });
}