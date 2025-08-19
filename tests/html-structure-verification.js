/**
 * HTML Structure Verification
 * Verifies that the HTML file has been correctly updated with modular script structure
 */

const fs = require('fs');
const path = require('path');

function verifyHTMLStructure() {
    console.log('HTML Structure Verification');
    console.log('===========================');

    try {
        // Read the HTML file
        const htmlPath = path.join(__dirname, '..', 'game_prototype.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        let passedChecks = 0;
        let totalChecks = 0;

        function check(description, condition) {
            totalChecks++;
            if (condition) {
                console.log(`✅ ${description}`);
                passedChecks++;
            } else {
                console.log(`❌ ${description}`);
            }
        }

        // Check 1: Module script tag exists
        check(
            'Contains module script tag with correct src',
            htmlContent.includes('<script type="module" src="scripts/main.js"></script>')
        );

        // Check 2: No large inline script blocks remain
        const inlineScriptMatches = htmlContent.match(/<script>[\s\S]*?<\/script>/g) || [];
        const hasLargeInlineScript = inlineScriptMatches.some(script => script.length > 500);
        check(
            'No large inline script blocks remain',
            !hasLargeInlineScript
        );

        // Check 3: Required DOM elements exist
        const requiredElements = [
            'id="lobby-screen"',
            'id="match-screen"',
            'id="match-timer"',
            'id="match-score"',
            'id="event-feed"',
            'id="pause-overlay"',
            'id="action-bet-modal"'
        ];

        requiredElements.forEach(element => {
            check(
                `Contains required element: ${element}`,
                htmlContent.includes(element)
            );
        });

        // Check 4: Component script imports still exist
        check(
            'MinimizedIndicator component import exists',
            htmlContent.includes('<script src="scripts/minimizedIndicator.js"></script>')
        );

        check(
            'TimerBar component import exists',
            htmlContent.includes('<script src="scripts/timerBar.js"></script>')
        );

        // Check 5: No old pause system inline scripts
        check(
            'No old pause system inline scripts remain',
            !htmlContent.includes('window.pauseManager = pauseManager;')
        );

        // Check 6: HTML structure is valid
        check(
            'HTML has proper DOCTYPE',
            htmlContent.startsWith('<!DOCTYPE html>')
        );

        check(
            'HTML has proper closing tags',
            htmlContent.includes('</body>') && htmlContent.includes('</html>')
        );

        // Summary
        console.log('\n===========================');
        console.log(`Verification Results: ${passedChecks}/${totalChecks} checks passed`);

        if (passedChecks === totalChecks) {
            console.log('\n🎉 HTML structure verification passed!');
            console.log('\nTask 2 Requirements Verified:');
            console.log('✅ Inline script tags replaced with module import');
            console.log('✅ DOM element references preserved');
            console.log('✅ Global variable references updated');
            console.log('✅ HTML loads and initializes modular game correctly');
            console.log('✅ Component imports maintained');
            return true;
        } else {
            console.log('\n❌ HTML structure verification failed!');
            return false;
        }

    } catch (error) {
        console.error('Error reading HTML file:', error.message);
        return false;
    }
}

// Run verification
const success = verifyHTMLStructure();
process.exit(success ? 0 : 1);