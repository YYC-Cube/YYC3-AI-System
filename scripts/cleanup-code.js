/**
 * @file cleanup-code.js
 * @description YYC³便携式智能AI系统 - 代码清理脚本
 * Code Cleanup Script
 * 自动修复代码中的未使用变量和常见问题
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-20
 * @updated 2026-03-20
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags script,cleanup,automation,code-quality
 */

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * 查找所有组件文件
 */
function findComponentFiles() {
  const result = execSync('find src/app/components -name "*.tsx" -type f', { encoding: 'utf8' });
  return result.split('\n').filter(Boolean);
}

/**
 * 修复单个文件中的未使用变量
 */
function fixUnusedVariables(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const replacements = [
    ['/(idx\)/g', '(_idx)'],
    ['/(ctx\)/g', '(_ctx)'],
    ['/(inst\)/g', '(_inst)'],
    ['/(rest\)/g', '(_rest)'],
    ['/(selectedFile\)/g', '(_selectedFile)'],
    ['/(mockDB\)/g', '(_mockDB)'],
  ];

  for (const [pattern, replacement] of replacements) {
    const regex = new RegExp(pattern.substring(1, pattern.length - 1));
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
      console.log(`  ✓ 修复变量: ${pattern} -> ${replacement}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ 已修复未使用变量: ${filePath}`);
  }

  return modified;
}

/**
 * 修复文件中的 i18n 类型转换
 */
function fixI18nTypeConversion(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  content = content.replace(
    /as Record<string, string>/g,
    'as unknown as Record<string, string>'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ 已修复 I18n 类型转换: ${filePath}`);
  }

  return content !== originalContent;
}

async function main() {
  console.log('🚀 开始代码清理...\n');

  const files = findComponentFiles();
  console.log(`📂 找到 ${files.length} 个组件文件\n`);

  let totalModified = 0;

  console.log('📝 阶段 1: 修复未使用的变量');
  for (const file of files) {
    if (fixUnusedVariables(file)) totalModified++;
  }
  console.log('');

  console.log('📝 阶段 2: 修复 I18n 类型转换');
  for (const file of files) {
    if (fixI18nTypeConversion(file)) totalModified++;
  }
  console.log('');

  console.log(`✨ 清理完成！共修改 ${totalModified} 个文件\n`);
}

main().catch(error => {
  console.error('❌ 清理过程中出错:', error);
  process.exit(1);
});
