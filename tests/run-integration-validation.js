#!/usr/bin/env node

/**
 * Integration Validation Runner
 * Validates the complete game integration without browser dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IntegrationValidator {
    constructor() {
        this.results = {
            moduleStructure: {},
            dependencies: {},
            exports: {},
            integration: {},
            errors: []
        };
    }

    async validateIntegration() {
        console.log('🚀 Starting Soccer Betting Game Integration Validation\n');

        try {
            await this.validateModuleStructure();
            await this.validateDependencies();
            await this.validateExports();
            await this.validateGameController();
            await this.validateCompleteFlow();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.results.errors.push(error.message);
        }
    }

    async validateModuleStructure() {
        console.log('📁 Validating Module Structure...');
        
        const expectedStructure = {
            'src/core': ['GameController.js', 'StateManager.js', 'EventManager.js'],
            'src/betting': ['BettingManager.js', 'FullMatchBetting.js', 'ActionBetting.js'],
            'src/ui': ['UIManager.js', 'LobbyScreen.js', 'MatchScreen.js', 'BettingModal.js'],
            'src/systems': ['TimerManager.js', 'AudioManager.js', 'PowerUpManager.js'],
            'src/utils': ['OddsCalculator.js', 'EventGenerator.js', 'Validator.js', 'ErrorHandler.js']
        };

        let allModulesExist = true;
        let totalModules = 0;
        let existingModules = 0;

        for (const [dir, files] of Object.entries(expectedStructure)) {
            const dirPath = path.join(__dirname, '..', dir);
            
            if (!fs.existsSync(dirPath)) {
                console.log(`  ❌ Directory missing: ${dir}`);
                allModulesExist = false;
                continue;
            }

            console.log(`  📂 ${dir}/`);
            
            for (const file of files) {
                totalModules++;
                const filePath = path.join(dirPath, file);
                
                if (fs.existsSync(filePath)) {
                    console.log(`    ✓ ${file}`);
                    existingModules++;
                } else {
                    console.log(`    ❌ ${file} - Missing`);
                    allModulesExist = false;
                }
            }
        }

        this.results.moduleStructure = {
            allModulesExist,
            totalModules,
            existingModules,
            completeness: (existingModules / totalModules * 100).toFixed(1) + '%'
        };

        console.log(`  📊 Module Completeness: ${this.results.moduleStructure.completeness}\n`);
    }

    async validateDependencies() {
        console.log('🔗 Validating Module Dependencies...');

        const coreModules = [
            'src/core/GameController.js',
            'src/core/StateManager.js',
            'src/core/EventManager.js'
        ];

        let dependenciesValid = true;

        for (const modulePath of coreModules) {
            const fullPath = path.join(__dirname, '..', modulePath);
            
            if (!fs.existsSync(fullPath)) {
                console.log(`  ❌ ${modulePath} - File not found`);
                dependenciesValid = false;
                continue;
            }

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for ES6 module syntax
                const hasExports = content.includes('export');
                const hasImports = content.includes('import');
                
                console.log(`  ✓ ${path.basename(modulePath)} - Exports: ${hasExports}, Imports: ${hasImports}`);
                
                // Check for class definitions
                const hasClass = /export class \w+/.test(content);
                if (hasClass) {
                    console.log(`    📦 Contains class definition`);
                }

            } catch (error) {
                console.log(`  ❌ ${modulePath} - Read error: ${error.message}`);
                dependenciesValid = false;
            }
        }

        this.results.dependencies = { valid: dependenciesValid };
        console.log('');
    }

    async validateExports() {
        console.log('📤 Validating Module Exports...');

        const moduleExports = {
            'GameController': 'src/core/GameController.js',
            'StateManager': 'src/core/StateManager.js',
            'EventManager': 'src/core/EventManager.js',
            'BettingManager': 'src/betting/BettingManager.js',
            'UIManager': 'src/ui/UIManager.js',
            'TimerManager': 'src/systems/TimerManager.js'
        };

        let exportsValid = true;

        for (const [className, filePath] of Object.entries(moduleExports)) {
            const fullPath = path.join(__dirname, '..', filePath);
            
            if (!fs.existsSync(fullPath)) {
                console.log(`  ❌ ${className} - File not found: ${filePath}`);
                exportsValid = false;
                continue;
            }

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for proper export
                const exportPattern = new RegExp(`export class ${className}`);
                const hasExport = exportPattern.test(content);
                
                if (hasExport) {
                    console.log(`  ✓ ${className} - Properly exported`);
                } else {
                    console.log(`  ❌ ${className} - Export not found`);
                    exportsValid = false;
                }

            } catch (error) {
                console.log(`  ❌ ${className} - Validation error: ${error.message}`);
                exportsValid = false;
            }
        }

        this.results.exports = { valid: exportsValid };
        console.log('');
    }

    async validateGameController() {
        console.log('🎮 Validating GameController Integration...');

        const gameControllerPath = path.join(__dirname, '..', 'src/core/GameController.js');
        
        if (!fs.existsSync(gameControllerPath)) {
            console.log('  ❌ GameController.js not found');
            this.results.integration.gameController = false;
            return;
        }

        try {
            const content = fs.readFileSync(gameControllerPath, 'utf8');
            
            // Check for required methods
            const requiredMethods = [
                'initialize',
                'startMatch',
                'pauseForActionBet',
                'resumeMatch',
                'endMatch',
                'placeBet',
                'handleError'
            ];

            let methodsFound = 0;
            
            for (const method of requiredMethods) {
                const methodPattern = new RegExp(`${method}\\s*\\(`);
                if (methodPattern.test(content)) {
                    console.log(`  ✓ Method: ${method}`);
                    methodsFound++;
                } else {
                    console.log(`  ❌ Method missing: ${method}`);
                }
            }

            // Check for module imports
            const expectedImports = [
                'StateManager',
                'EventManager',
                'BettingManager',
                'UIManager',
                'TimerManager'
            ];

            let importsFound = 0;
            
            for (const importName of expectedImports) {
                if (content.includes(importName)) {
                    console.log(`  ✓ Import: ${importName}`);
                    importsFound++;
                } else {
                    console.log(`  ❌ Import missing: ${importName}`);
                }
            }

            const integrationScore = ((methodsFound + importsFound) / (requiredMethods.length + expectedImports.length)) * 100;
            
            this.results.integration.gameController = {
                methodsFound,
                importsFound,
                score: integrationScore.toFixed(1) + '%'
            };

            console.log(`  📊 Integration Score: ${integrationScore.toFixed(1)}%`);

        } catch (error) {
            console.log(`  ❌ Validation error: ${error.message}`);
            this.results.integration.gameController = false;
        }

        console.log('');
    }

    async validateCompleteFlow() {
        console.log('🔄 Validating Complete Game Flow...');

        // Check for main entry point
        const indexPath = path.join(__dirname, '..', 'src/index.js');
        const htmlPath = path.join(__dirname, '..', 'index.html');

        let flowValid = true;

        // Validate index.js
        if (fs.existsSync(indexPath)) {
            console.log('  ✓ Main entry point (src/index.js) exists');
            
            const content = fs.readFileSync(indexPath, 'utf8');
            if (content.includes('GameController')) {
                console.log('  ✓ GameController imported in entry point');
            } else {
                console.log('  ❌ GameController not imported in entry point');
                flowValid = false;
            }
        } else {
            console.log('  ❌ Main entry point (src/index.js) missing');
            flowValid = false;
        }

        // Validate HTML file
        if (fs.existsSync(htmlPath)) {
            console.log('  ✓ Main HTML file exists');
            
            const content = fs.readFileSync(htmlPath, 'utf8');
            if (content.includes('type="module"')) {
                console.log('  ✓ ES6 modules enabled in HTML');
            } else {
                console.log('  ❌ ES6 modules not enabled in HTML');
                flowValid = false;
            }
        } else {
            console.log('  ❌ Main HTML file missing');
            flowValid = false;
        }

        // Check for CSS
        const cssPath = path.join(__dirname, '..', 'styles/main.css');
        if (fs.existsSync(cssPath)) {
            console.log('  ✓ Main CSS file exists');
        } else {
            console.log('  ❌ Main CSS file missing');
        }

        // Validate test files
        const testFiles = [
            'tests/end-to-end-game-flow.test.js',
            'tests/integration-test-runner.html',
            'tests/mobile-responsiveness.test.js',
            'tests/session-continuity.test.js'
        ];

        let testsExist = 0;
        for (const testFile of testFiles) {
            const testPath = path.join(__dirname, '..', testFile);
            if (fs.existsSync(testPath)) {
                console.log(`  ✓ Test file: ${path.basename(testFile)}`);
                testsExist++;
            } else {
                console.log(`  ❌ Test file missing: ${path.basename(testFile)}`);
            }
        }

        this.results.integration.completeFlow = {
            valid: flowValid,
            testsExist,
            totalTests: testFiles.length,
            testCoverage: (testsExist / testFiles.length * 100).toFixed(1) + '%'
        };

        console.log(`  📊 Test Coverage: ${this.results.integration.completeFlow.testCoverage}`);
        console.log('');
    }

    generateReport() {
        console.log('📋 Integration Validation Report');
        console.log('================================\n');

        // Module Structure
        console.log('📁 Module Structure:');
        console.log(`   Completeness: ${this.results.moduleStructure.completeness}`);
        console.log(`   Modules: ${this.results.moduleStructure.existingModules}/${this.results.moduleStructure.totalModules}\n`);

        // Dependencies
        console.log('🔗 Dependencies:');
        console.log(`   Valid: ${this.results.dependencies.valid ? '✓' : '❌'}\n`);

        // Exports
        console.log('📤 Exports:');
        console.log(`   Valid: ${this.results.exports.valid ? '✓' : '❌'}\n`);

        // GameController Integration
        console.log('🎮 GameController Integration:');
        if (this.results.integration.gameController) {
            console.log(`   Score: ${this.results.integration.gameController.score}`);
            console.log(`   Methods: ${this.results.integration.gameController.methodsFound}`);
            console.log(`   Imports: ${this.results.integration.gameController.importsFound}\n`);
        } else {
            console.log('   Status: ❌ Failed\n');
        }

        // Complete Flow
        console.log('🔄 Complete Flow:');
        console.log(`   Valid: ${this.results.integration.completeFlow.valid ? '✓' : '❌'}`);
        console.log(`   Test Coverage: ${this.results.integration.completeFlow.testCoverage}\n`);

        // Overall Assessment
        const overallScore = this.calculateOverallScore();
        console.log('🎯 Overall Assessment:');
        console.log(`   Integration Score: ${overallScore}%`);
        
        if (overallScore >= 90) {
            console.log('   Status: ✅ Excellent - Ready for production');
        } else if (overallScore >= 75) {
            console.log('   Status: ✅ Good - Minor issues to address');
        } else if (overallScore >= 60) {
            console.log('   Status: ⚠️  Fair - Several issues need attention');
        } else {
            console.log('   Status: ❌ Poor - Major integration issues');
        }

        // Errors
        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors Encountered:');
            this.results.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }

        console.log('\n🏁 Validation Complete!');
        
        // Save report to file
        const reportPath = path.join(__dirname, 'integration-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📄 Detailed report saved to: ${reportPath}`);
    }

    calculateOverallScore() {
        let totalScore = 0;
        let components = 0;

        // Module structure (25%)
        const moduleScore = parseFloat(this.results.moduleStructure.completeness);
        totalScore += moduleScore * 0.25;
        components++;

        // Dependencies (15%)
        totalScore += (this.results.dependencies.valid ? 100 : 0) * 0.15;
        components++;

        // Exports (15%)
        totalScore += (this.results.exports.valid ? 100 : 0) * 0.15;
        components++;

        // GameController integration (30%)
        if (this.results.integration.gameController && this.results.integration.gameController.score) {
            const gcScore = parseFloat(this.results.integration.gameController.score);
            totalScore += gcScore * 0.30;
        }
        components++;

        // Complete flow (15%)
        const flowScore = this.results.integration.completeFlow.valid ? 100 : 0;
        const testScore = parseFloat(this.results.integration.completeFlow.testCoverage);
        totalScore += ((flowScore + testScore) / 2) * 0.15;
        components++;

        return totalScore.toFixed(1);
    }
}

// Run validation
const validator = new IntegrationValidator();
validator.validateIntegration().catch(console.error);