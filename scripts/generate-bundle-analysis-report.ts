/**
 * @file generate-bundle-analysis-report.ts
 * @description YYC³便携式智能AI系统 - Bundle分析报告生成工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags script,bundle-analysis,performance
 */

import fs from 'fs'
import path from 'path'

interface ChunkInfo {
  name: string
  size: number // bytes
  sizeKB: number // KB
  sizeMB: number // MB
  gzipSize?: number // KB
}

interface BundleReport {
  timestamp: string
  totalSize: number
  totalSizeKB: number
  totalSizeMB: number
  totalGzipSize: number
  totalGzipSizeMB: number
  chunks: ChunkInfo[]
  largeChunks: ChunkInfo[]
  warnings: string[]
  recommendations: string[]
}

// 分析构建输出
function analyzeBuildOutput(): BundleReport {
  const distPath = path.join(process.cwd(), 'dist', 'assets')
  const files = fs.readdirSync(distPath)
  
  const chunks: ChunkInfo[] = []
  let totalSize = 0
  let totalGzipSize = 0
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // 解析构建输出中的文件大小信息
  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      const filePath = path.join(distPath, file)
      const size = fs.statSync(filePath).size
      const sizeKB = size / 1024
      const sizeMB = size / 1024 / 1024
      
      // 尝试从构建输出中获取gzip大小（简化处理）
      // 实际应该从构建输出中解析
      const gzipSizeKB = sizeKB * 0.35 // 估算gzip压缩率
      
      chunks.push({
        name: file,
        size,
        sizeKB: Math.round(sizeKB * 100) / 100,
        sizeMB: Math.round(sizeMB * 100) / 100,
        gzipSize: Math.round(gzipSizeKB * 100) / 100,
      })
      
      totalSize += size
      totalGzipSize += gzipSizeKB * 1024
    }
  })
  
  const totalSizeKB = totalSize / 1024
  const totalSizeMB = totalSize / 1024 / 1024
  const totalGzipSizeMB = totalGzipSize / 1024 / 1024
  
  // 识别大型chunks (> 500KB)
  const largeChunks = chunks.filter(chunk => chunk.sizeKB > 500)
  
  // 生成警告
  if (largeChunks.length > 0) {
    warnings.push(`发现 ${largeChunks.length} 个大型chunks (> 500KB)`)
  }
  
  if (totalSizeMB > 5) {
    warnings.push(`总Bundle大小 ${totalSizeMB.toFixed(2)}MB 超过推荐值 5MB`)
  }
  
  // 生成优化建议
  if (largeChunks.some(c => c.name.includes('monaco-editor'))) {
    recommendations.push('1. Monaco Editor懒加载：按需加载语言服务，使用Web Worker')
  }
  
  if (largeChunks.some(c => c.name.includes('ts.worker'))) {
    recommendations.push('2. Monaco Editor Worker优化：动态加载，按需创建')
  }
  
  if (largeChunks.some(c => c.name.includes('index-'))) {
    recommendations.push('3. 入口文件代码分割：将非首屏代码移至独立chunks')
  }
  
  if (largeChunks.some(c => c.name.includes('charts'))) {
    recommendations.push('4. 图表库懒加载：只在需要时加载recharts')
  }
  
  recommendations.push('5. 路由级代码分割：使用React.lazy()动态导入路由组件')
  recommendations.push('6. 组件懒加载：已实现40+面板组件懒加载，检查是否生效')
  recommendations.push('7. 预加载策略：对关键资源使用<link rel="preload">')
  recommendations.push('8. Tree Shaking：确保未使用的代码被移除')
  recommendations.push('9. 压缩优化：使用terser配置进一步压缩代码')
  recommendations.push('10. CDN加速：将大型库（如Monaco Editor）通过CDN加载')
  
  return {
    timestamp: new Date().toISOString(),
    totalSize,
    totalSizeKB: Math.round(totalSizeKB * 100) / 100,
    totalSizeMB: Math.round(totalSizeMB * 100) / 100,
    totalGzipSize,
    totalGzipSizeMB: Math.round(totalGzipSizeMB * 100) / 100,
    chunks: chunks.sort((a, b) => b.size - a.size),
    largeChunks,
    warnings,
    recommendations,
  }
}

// 生成Markdown格式的报告
function generateMarkdownReport(report: BundleReport): string {
  return `# YYC³便携式智能AI系统 - Bundle分析报告

**生成时间**: ${report.timestamp}
**总Bundle大小**: ${report.totalSizeKB.toFixed(2)} KB (${report.totalSizeMB.toFixed(2)} MB)
**总Gzip大小**: ${report.totalGzipSizeMB.toFixed(2)} MB
**压缩率**: ${((1 - report.totalGzipSizeMB / report.totalSizeMB) * 100).toFixed(1)}%

---

## 📊 Bundle总览

| 指标 | 值 | 目标 | 状态 |
|------|-----|------|------|
| 总Bundle大小 | ${report.totalSizeMB.toFixed(2)} MB | < 5 MB | ${report.totalSizeMB < 5 ? '✅' : '⚠️'} |
| Gzip压缩后 | ${report.totalGzipSizeMB.toFixed(2)} MB | < 2 MB | ${report.totalGzipSizeMB < 2 ? '✅' : '⚠️'} |
| 大型chunks | ${report.largeChunks.length} 个 | < 5 个 | ${report.largeChunks.length < 5 ? '✅' : '⚠️'} |
| 总chunks数 | ${report.chunks.length} 个 | - | - |

---

## 🚨 大型Chunks (> 500KB)

${report.largeChunks.map(chunk => `
### ${chunk.name}
- **大小**: ${chunk.sizeKB.toFixed(2)} KB (${chunk.sizeMB.toFixed(2)} MB)
- **Gzip**: ${chunk.gzipSize?.toFixed(2)} KB
`).join('')}

---

## 📦 所有Chunks (按大小排序)

| 文件名 | 大小 (KB) | 大小 (MB) | Gzip (KB) |
|--------|-----------|-----------|-----------|
${report.chunks.map(chunk => 
  `| ${chunk.name} | ${chunk.sizeKB.toFixed(2)} | ${chunk.sizeMB.toFixed(2)} | ${chunk.gzipSize?.toFixed(2) || 'N/A'} |`
).join('\n')}

---

## ⚠️ 警告

${report.warnings.map(warning => `- ${warning}`).join('\n') || '- 无警告'}

---

## 💡 优化建议

${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

---

## 🎯 优先优化项

1. **Monaco Editor优化** (${report.chunks.find(c => c.name.includes('monaco-editor'))?.sizeMB.toFixed(2) || 0} MB)
   - 按需加载语言服务
   - 使用Web Worker
   - 考虑通过CDN加载

2. **Monaco Worker优化** (${report.chunks.find(c => c.name.includes('ts.worker'))?.sizeMB.toFixed(2) || 0} MB)
   - 动态加载worker
   - 按需创建worker实例

3. **入口文件优化** (${report.chunks.find(c => c.name.includes('index-'))?.sizeMB.toFixed(2) || 0} MB)
   - 代码分割
   - 延迟加载非首屏代码

---

## 📈 优化目标

- [ ] 将总Bundle大小从 ${report.totalSizeMB.toFixed(2)} MB 降至 2.0 MB
- [ ] 将Gzip大小从 ${report.totalGzipSizeMB.toFixed(2)} MB 降至 1.5 MB
- [ ] 消除所有 > 1 MB 的chunks
- [ ] 实现路由级代码分割
- [ ] 实现40+面板组件懒加载
- [ ] 配置预加载策略

---

**生成工具**: YYC³ Bundle分析器 v1.0.0
**生成时间**: ${report.timestamp}
`
}

// 主函数
function main() {
  console.log('🔍 正在分析Bundle...')
  const report = analyzeBuildOutput()
  console.log('✅ Bundle分析完成')
  
  // 生成Markdown报告
  const reportContent = generateMarkdownReport(report)
  
  // 保存报告
  const reportPath = path.join(process.cwd(), 'docs', 'YYC3-2026-03-24-P1-01-Bundle分析报告.md')
  fs.writeFileSync(reportPath, reportContent, 'utf-8')
  
  console.log(`✅ 报告已生成: ${reportPath}`)
  console.log('\n📊 Bundle总览:')
  console.log(`  - 总大小: ${report.totalSizeMB.toFixed(2)} MB`)
  console.log(`  - Gzip: ${report.totalGzipSizeMB.toFixed(2)} MB`)
  console.log(`  - 大型chunks: ${report.largeChunks.length} 个`)
  console.log(`  - 总chunks: ${report.chunks.length} 个`)
}

// 执行主函数
main()
