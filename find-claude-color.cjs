const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js.bak');
const code = fs.readFileSync(cliPath, 'utf8');

// Find every usage of color:"claude" or color:'claude'
let si = 0, count = 0;
while (count < 20) {
    const idx = code.indexOf('color:"claude"', si);
    if (idx === -1) break;
    process.stdout.write(`\n--- color:"claude" #${count} at ${idx} ---\n`);
    process.stdout.write(code.substring(idx - 200, idx + 300) + '\n');
    si = idx + 14;
    count++;
}
process.stdout.write(`\nTotal color:"claude" usages: ${count}\n`);

// Also find claudeShimmer usage
si = 0; count = 0;
while (count < 5) {
    const idx = code.indexOf('color:"claudeShimmer"', si);
    if (idx === -1) break;
    process.stdout.write(`\n--- color:"claudeShimmer" #${count} at ${idx} ---\n`);
    process.stdout.write(code.substring(idx - 150, idx + 200) + '\n');
    si = idx + 21;
    count++;
}
process.stdout.write(`Total color:"claudeShimmer" usages: ${count}\n`);

// Find the "Claude Code" title text rendered in the UI
const titleIdx = code.indexOf('"Claude Code"');
if (titleIdx !== -1) {
    process.stdout.write(`\n--- "Claude Code" string at ${titleIdx} ---\n`);
    process.stdout.write(code.substring(titleIdx - 200, titleIdx + 200) + '\n');
}
