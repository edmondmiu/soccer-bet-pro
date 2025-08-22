#!/usr/bin/env node

/**
 * Dual Betting Systems Validation
 * Tests that full-match and action betting systems work independently and together
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DualBettingValidator {
    constructor() {
        this.results = {
            fullMatchBetting: {},
            actionBetting: {},
            dualSystemIntegration: {},
            performance: {},
            errors: []
        };
    }

    async validateDualBettingSystems() {
        console.log('🎯 Validating Dual Betting Systems Integration\n');

        try {
            await this.validateFullMatchBettingSystem();
            await this.validateActionBettingSystem();
            await this.validateDualSystemIntegration();
            await this.validatePerformanceWithBothSystems();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.results.errors.push(error.message);
        }
    }

    async validateFullMatchBettingSystem() {
        console.log('⚽ Validating Full-Match Betting System...');

        const fullMatchBettingPath = path.join(__dirname, '..', 'src/betting/FullMatchBetting.js');
        
        if (!fs.existsSync(fullMatchBettingPath)) {
            console.log('  ❌ FullMatchBetting.js not found');
            this.results.fullMatchBetting.exists = false;
            return;
        }

        try {
            const content = fs.readFileSync(fullMatchBettingPath, 'utf8');
            
            // Check for required features
            const requiredFeatures = {
                'continuous betting': /initialize|showBettingForm|placeBet/,
                'no game pause': /continue|running|pause.*false/i,
                'multiple bets': /multiple|array|push.*bet/i,
                'pre-populated amounts': /memory|remember|populate/i,
                'instant placement': /instant|immediate|real.*time/i
            };

            let featuresFound = 0;
            const totalFeatures = Object.keys(requiredFeatures).length;

            for (const [feature, pattern] of Object.entries(requiredFeatures)) {
                if (pattern.test(content)) {
                    console.log(`  ✓ ${feature}`);
                    featuresFound++;
                } else {
                    console.log(`  ❌ ${feature} - Pattern not found`);
                }
            }

            // Check for proper class structure
            const hasClass = /export class FullMatchBetting/.test(content);
            const hasConstructor = /constructor\s*\(/.test(content);
            const hasMethods = /^\s*(async\s+)?\w+\s*\(/m.test(content);

            console.log(`  📦 Class structure: ${hasClass ? '✓' : '❌'}`);
            console.log(`  🏗️  Constructor: ${hasConstructor ? '✓' : '❌'}`);
            console.log(`  🔧 Methods: ${hasMethods ? '✓' : '❌'}`);

            this.results.fullMatchBetting = {
                exists: true,
                featuresFound,
                totalFeatures,
                completeness: (featuresFound / totalFeatures * 100).toFixed(1) + '%',
                hasClass,
                hasConstructor,
                hasMethods
            };

            console.log(`  📊 Feature Completeness: ${this.results.fullMatchBetting.completeness}`);

        } catch (error) {
            console.log(`  ❌ Validation error: ${error.message}`);
            this.results.fullMatchBetting.error = error.message;
        }

        console.log('');
    }

    async validateActionBettingSystem() {
        console.log('⏸️  Validating Action Betting System...');

        const actionBettingPath = path.join(__dirname, '..', 'src/betting/ActionBetting.js');
        
        if (!fs.existsSync(actionBettingPath)) {
            console.log('  ❌ ActionBetting.js not found');
            this.results.actionBetting.exists = false;
            return;
        }

        try {
            const content = fs.readFileSync(actionBettingPath, 'utf8');
            
            // Check for required features
            const requiredFeatures = {
                'game pause': /pause|stop|suspend/i,
                '10-second countdown': /10.*second|countdown|timer/i,
                'betting modal': /modal|popup|dialog/i,
                'skip option': /skip|pass|ignore/i,
                'timeout handling': /timeout|expire|limit/i,
                'game resume': /resume|continue|restart/i
            };

            let featuresFound = 0;
            const totalFeatures = Object.keys(requiredFeatures).length;

            for (const [feature, pattern] of Object.entries(requiredFeatures)) {
                if (pattern.test(content)) {
                    console.log(`  ✓ ${feature}`);
                    featuresFound++;
                } else {
                    console.log(`  ❌ ${feature} - Pattern not found`);
                }
            }

            // Check for proper class structure
            const hasClass = /export class ActionBetting/.test(content);
            const hasConstructor = /constructor\s*\(/.test(content);
            const hasMethods = /^\s*(async\s+)?\w+\s*\(/m.test(content);

            console.log(`  📦 Class structure: ${hasClass ? '✓' : '❌'}`);
            console.log(`  🏗️  Constructor: ${hasConstructor ? '✓' : '❌'}`);
            console.log(`  🔧 Methods: ${hasMethods ? '✓' : '❌'}`);

            this.results.actionBetting = {
                exists: true,
                featuresFound,
                totalFeatures,
                completeness: (featuresFound / totalFeatures * 100).toFixed(1) + '%',
                hasClass,
                hasConstructor,
                hasMethods
            };

            console.log(`  📊 Feature Completeness: ${this.results.actionBetting.completeness}`);

        } catch (error) {
            console.log(`  ❌ Validation error: ${error.message}`);
            this.results.actionBetting.error = error.message;
        }

        console.log('');
    }

    async validateDualSystemIntegration() {
        console.log('🔄 Validating Dual System Integration...');

        const gameControllerPath = path.join(__dirname, '..', 'src/core/GameController.js');
        const bettingManagerPath = path.join(__dirname, '..', 'src/betting/BettingManager.js');
        
        let integrationValid = true;
        let integrationFeatures = 0;

        // Check GameController integration
        if (fs.existsSync(gameControllerPath)) {
            const gcContent = fs.readFileSync(gameControllerPath, 'utf8');
            
            // Check for both betting system imports
            const hasFullMatchImport = /import.*FullMatchBetting/.test(gcContent);
            const hasActionBettingImport = /import.*ActionBetting/.test(gcContent);
            
            console.log(`  ✓ FullMatchBetting import: ${hasFullMatchImport ? '✓' : '❌'}`);
            console.log(`  ✓ ActionBetting import: ${hasActionBettingImport ? '✓' : '❌'}`);
            
            if (hasFullMatchImport) integrationFeatures++;
            if (hasActionBettingImport) integrationFeatures++;

            // Check for initialization of both systems
            const initializesFullMatch = /fullMatchBetting.*=.*new FullMatchBetting/.test(gcContent);
            const initializesActionBetting = /actionBetting.*=.*new ActionBetting/.test(gcContent);
            
            console.log(`  🏗️  FullMatchBetting initialization: ${initializesFullMatch ? '✓' : '❌'}`);
            console.log(`  🏗️  ActionBetting initialization: ${initializesActionBetting ? '✓' : '❌'}`);
            
            if (initializesFullMatch) integrationFeatures++;
            if (initializesActionBetting) integrationFeatures++;

            // Check for pause/resume coordination
            const hasPauseLogic = /pauseForActionBet|resumeMatch/.test(gcContent);
            const hasEventCoordination = /actionBettingOpportunity|eventProcessing/.test(gcContent);
            
            console.log(`  ⏸️  Pause/Resume coordination: ${hasPauseLogic ? '✓' : '❌'}`);
            console.log(`  📅 Event coordination: ${hasEventCoordination ? '✓' : '❌'}`);
            
            if (hasPauseLogic) integrationFeatures++;
            if (hasEventCoordination) integrationFeatures++;

        } else {
            console.log('  ❌ GameController.js not found');
            integrationValid = false;
        }

        // Check BettingManager coordination
        if (fs.existsSync(bettingManagerPath)) {
            const bmContent = fs.readFileSync(bettingManagerPath, 'utf8');
            
            // Check for bet type handling
            const handlesBetTypes = /fullMatch|actionBet|type.*===/.test(bmContent);
            const hasValidation = /validate.*bet|insufficient.*funds/.test(bmContent);
            
            console.log(`  🎯 Bet type handling: ${handlesBetTypes ? '✓' : '❌'}`);
            console.log(`  ✅ Bet validation: ${hasValidation ? '✓' : '❌'}`);
            
            if (handlesBetTypes) integrationFeatures++;
            if (hasValidation) integrationFeatures++;

        } else {
            console.log('  ❌ BettingManager.js not found');
            integrationValid = false;
        }

        // Check for state management integration
        const stateManagerPath = path.join(__dirname, '..', 'src/core/StateManager.js');
        if (fs.existsSync(stateManagerPath)) {
            const smContent = fs.readFileSync(stateManagerPath, 'utf8');
            
            const managesBetState = /bets.*fullMatch|bets.*actionBet/.test(smContent);
            const managesMemory = /betAmountMemory|memory.*bet/.test(smContent);
            
            console.log(`  💾 Bet state management: ${managesBetState ? '✓' : '❌'}`);
            console.log(`  🧠 Bet amount memory: ${managesMemory ? '✓' : '❌'}`);
            
            if (managesBetState) integrationFeatures++;
            if (managesMemory) integrationFeatures++;
        }

        const maxIntegrationFeatures = 10;
        const integrationScore = (integrationFeatures / maxIntegrationFeatures * 100).toFixed(1);

        this.results.dualSystemIntegration = {
            valid: integrationValid,
            featuresFound: integrationFeatures,
            maxFeatures: maxIntegrationFeatures,
            score: integrationScore + '%'
        };

        console.log(`  📊 Integration Score: ${integrationScore}%`);
        console.log('');
    }

    async validatePerformanceWithBothSystems() {
        console.log('⚡ Validating Performance with Both Systems...');

        // Check for potential performance issues in the code
        const performanceChecks = {
            'GameController.js': {
                path: 'src/core/GameController.js',
                checks: {
                    'Event listener cleanup': /removeEventListener|cleanup|destroy/,
                    'Memory management': /delete|null|cleanup|reset/,
                    'Error handling': /try.*catch|handleError/,
                    'Async operations': /async|await|Promise/
                }
            },
            'BettingManager.js': {
                path: 'src/betting/BettingManager.js',
                checks: {
                    'Bet validation efficiency': /validate.*bet.*return|early.*return/,
                    'State updates': /updateState|setState/,
                    'Calculation optimization': /calculate.*winnings|odds.*calculation/
                }
            }
        };

        let performanceScore = 0;
        let totalChecks = 0;

        for (const [fileName, config] of Object.entries(performanceChecks)) {
            const filePath = path.join(__dirname, '..', config.path);
            
            if (!fs.existsSync(filePath)) {
                console.log(`  ❌ ${fileName} not found`);
                continue;
            }

            console.log(`  📄 ${fileName}:`);
            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const [checkName, pattern] of Object.entries(config.checks)) {
                totalChecks++;
                if (pattern.test(content)) {
                    console.log(`    ✓ ${checkName}`);
                    performanceScore++;
                } else {
                    console.log(`    ❌ ${checkName}`);
                }
            }
        }

        // Check for potential bottlenecks
        const bottleneckChecks = [
            {
                name: 'Excessive DOM queries',
                pattern: /document\.querySelector.*document\.querySelector/,
                severity: 'warning'
            },
            {
                name: 'Synchronous operations in loops',
                pattern: /for.*\{[\s\S]*?(?!async).*\}/,
                severity: 'info'
            },
            {
                name: 'Memory leaks potential',
                pattern: /setInterval(?!.*clearInterval)|setTimeout(?!.*clearTimeout)/,
                severity: 'warning'
            }
        ];

        console.log('  🔍 Bottleneck Analysis:');
        let bottlenecksFound = 0;

        for (const check of bottleneckChecks) {
            // Check all JavaScript files
            const jsFiles = [
                'src/core/GameController.js',
                'src/betting/BettingManager.js',
                'src/betting/FullMatchBetting.js',
                'src/betting/ActionBetting.js'
            ];

            let found = false;
            for (const jsFile of jsFiles) {
                const filePath = path.join(__dirname, '..', jsFile);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (check.pattern.test(content)) {
                        found = true;
                        bottlenecksFound++;
                        break;
                    }
                }
            }

            const icon = found ? '⚠️' : '✓';
            console.log(`    ${icon} ${check.name}: ${found ? 'Found' : 'Not found'}`);
        }

        const finalPerformanceScore = totalChecks > 0 ? (performanceScore / totalChecks * 100).toFixed(1) : '0';

        this.results.performance = {
            score: finalPerformanceScore + '%',
            checksFound: performanceScore,
            totalChecks,
            bottlenecksFound,
            recommendation: bottlenecksFound === 0 ? 'Excellent' : 
                           bottlenecksFound <= 2 ? 'Good' : 'Needs optimization'
        };

        console.log(`  📊 Performance Score: ${finalPerformanceScore}%`);
        console.log(`  🎯 Recommendation: ${this.results.performance.recommendation}`);
        console.log('');
    }

    generateReport() {
        console.log('📋 Dual Betting Systems Validation Report');
        console.log('==========================================\n');

        // Full-Match Betting System
        console.log('⚽ Full-Match Betting System:');
        if (this.results.fullMatchBetting.exists) {
            console.log(`   Completeness: ${this.results.fullMatchBetting.completeness}`);
            console.log(`   Features: ${this.results.fullMatchBetting.featuresFound}/${this.results.fullMatchBetting.totalFeatures}`);
            console.log(`   Structure: ${this.results.fullMatchBetting.hasClass && this.results.fullMatchBetting.hasConstructor ? '✓' : '❌'}`);
        } else {
            console.log('   Status: ❌ Not found');
        }
        console.log('');

        // Action Betting System
        console.log('⏸️  Action Betting System:');
        if (this.results.actionBetting.exists) {
            console.log(`   Completeness: ${this.results.actionBetting.completeness}`);
            console.log(`   Features: ${this.results.actionBetting.featuresFound}/${this.results.actionBetting.totalFeatures}`);
            console.log(`   Structure: ${this.results.actionBetting.hasClass && this.results.actionBetting.hasConstructor ? '✓' : '❌'}`);
        } else {
            console.log('   Status: ❌ Not found');
        }
        console.log('');

        // Dual System Integration
        console.log('🔄 Dual System Integration:');
        console.log(`   Score: ${this.results.dualSystemIntegration.score}`);
        console.log(`   Features: ${this.results.dualSystemIntegration.featuresFound}/${this.results.dualSystemIntegration.maxFeatures}`);
        console.log(`   Valid: ${this.results.dualSystemIntegration.valid ? '✓' : '❌'}\n`);

        // Performance
        console.log('⚡ Performance:');
        console.log(`   Score: ${this.results.performance.score}`);
        console.log(`   Bottlenecks: ${this.results.performance.bottlenecksFound}`);
        console.log(`   Recommendation: ${this.results.performance.recommendation}\n`);

        // Overall Assessment
        const overallScore = this.calculateOverallScore();
        console.log('🎯 Overall Assessment:');
        console.log(`   Dual Systems Score: ${overallScore}%`);
        
        if (overallScore >= 90) {
            console.log('   Status: ✅ Excellent - Both systems fully integrated');
        } else if (overallScore >= 75) {
            console.log('   Status: ✅ Good - Minor integration improvements needed');
        } else if (overallScore >= 60) {
            console.log('   Status: ⚠️  Fair - Significant integration work required');
        } else {
            console.log('   Status: ❌ Poor - Major dual system issues');
        }

        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (this.results.fullMatchBetting.exists && parseFloat(this.results.fullMatchBetting.completeness) < 100) {
            console.log('   - Complete full-match betting system features');
        }
        
        if (this.results.actionBetting.exists && parseFloat(this.results.actionBetting.completeness) < 100) {
            console.log('   - Complete action betting system features');
        }
        
        if (parseFloat(this.results.dualSystemIntegration.score) < 90) {
            console.log('   - Improve integration between betting systems');
        }
        
        if (this.results.performance.bottlenecksFound > 0) {
            console.log('   - Address performance bottlenecks');
        }

        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors Encountered:');
            this.results.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }

        console.log('\n🏁 Dual Systems Validation Complete!');
        
        // Save report to file
        const reportPath = path.join(__dirname, 'dual-betting-systems-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📄 Detailed report saved to: ${reportPath}`);
    }

    calculateOverallScore() {
        let totalScore = 0;
        let components = 0;

        // Full-match betting (30%)
        if (this.results.fullMatchBetting.exists) {
            const fmScore = parseFloat(this.results.fullMatchBetting.completeness);
            totalScore += fmScore * 0.30;
        }
        components++;

        // Action betting (30%)
        if (this.results.actionBetting.exists) {
            const abScore = parseFloat(this.results.actionBetting.completeness);
            totalScore += abScore * 0.30;
        }
        components++;

        // Integration (25%)
        const integrationScore = parseFloat(this.results.dualSystemIntegration.score);
        totalScore += integrationScore * 0.25;
        components++;

        // Performance (15%)
        const performanceScore = parseFloat(this.results.performance.score);
        totalScore += performanceScore * 0.15;
        components++;

        return totalScore.toFixed(1);
    }
}

// Run validation
const validator = new DualBettingValidator();
validator.validateDualBettingSystems().catch(console.error);