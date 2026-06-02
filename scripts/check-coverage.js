/**
 * @file check-coverage.js
 * @description YYC³便携式智能AI系统 - 覆盖率阈值检查脚本
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @status stable
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

// 覆盖率阈值配置
const THRESHOLDS = {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
};

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function checkCoverage(coveragePath) {
  try {
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const { total } = coverageData;

    console.log('\n📊 Coverage Report:');
    console.log('═'.repeat(60));

    let allPassed = true;

    // 检查各项指标
    const metrics = [
      { name: 'Lines', value: total.lines.pct, threshold: THRESHOLDS.lines },
      { name: 'Functions', value: total.functions.pct, threshold: THRESHOLDS.functions },
      { name: 'Branches', value: total.branches.pct, threshold: THRESHOLDS.branches },
      { name: 'Statements', value: total.statements.pct, threshold: THRESHOLDS.statements },
    ];

    metrics.forEach((metric) => {
      const passed = metric.value >= metric.threshold;
      const color = passed ? colors.green : colors.red;
      const symbol = passed ? '✓' : '✗';

      console.log(
        `${symbol} ${metric.name.padEnd(12)}: ${color}${metric.value.toFixed(2)}%${colors.reset} (threshold: ${metric.threshold}%)`
      );

      if (!passed) {
        allPassed = false;
      }
    });

    console.log('═'.repeat(60));

    if (allPassed) {
      console.log(`\n${colors.green}✅ All coverage thresholds passed!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}❌ Coverage thresholds not met!${colors.reset}\n`);
      console.log(`${colors.yellow}Please improve test coverage to meet the minimum thresholds.${colors.reset}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error reading coverage data:${colors.reset}`, error.message);
    console.error(`\n${colors.yellow}Make sure to generate coverage report first:${colors.reset}`);
    console.error('  pnpm run test:coverage\n');
    process.exit(1);
  }
}

// 从命令行参数获取覆盖率报告路径
const coveragePath = process.argv[2] || path.join(process.cwd(), 'coverage', 'coverage-summary.json');

// 执行检查
checkCoverage(coveragePath);
