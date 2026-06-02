const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const outPath = path.join(process.cwd(), 'vitest_output.txt');
try {
  const result = execSync('./node_modules/.bin/vitest run --reporter=verbose 2>&1', {
    timeout: 180000,
    encoding: 'utf-8',
    cwd: '/Volumes/Development/yyc3-77/YYC3-Portable-Intelligent-AI-System'
  });
  fs.writeFileSync(outPath, result);
  console.log('Wrote results to ' + outPath + ' (' + result.length + ' chars)');
} catch(e) {
  const output = (e.stdout || '') + '\n' + (e.stderr || '');
  fs.writeFileSync(outPath, output);
  console.log('Wrote error results to ' + outPath + ' (' + output.length + ' chars)');
}
