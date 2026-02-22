const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const code = fs.readFileSync(cliPath, 'utf8');

// Find all occurrences of userMessageBackground
let si = 0;
let count = 0;
while (count < 20) {
    const idx = code.indexOf('userMessageBackground', si);
    if (idx === -1) break;
    process.stdout.write(`\n--- #${count} at ${idx} ---\n`);
    process.stdout.write(code.substring(Math.max(0, idx - 300), idx + 400) + '\n');
    si = idx + 21;
    count++;
}
