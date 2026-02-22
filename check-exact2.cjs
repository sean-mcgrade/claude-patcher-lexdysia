const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js.bak');
const code = fs.readFileSync(cliPath, 'utf8');

// Get exact start of each theme object
for (const varName of ['xG5', 'BG5', 'gG5', 'FG5']) {
    const idx = code.indexOf(`${varName}={`, 2990000);
    if (idx !== -1) {
        process.stdout.write(`\n${varName} start exact:\n`);
        process.stdout.write(JSON.stringify(code.substring(idx, idx + 80)) + '\n');
    }
}

// Also check gG5 and FG5 userMessageBackground - get more context to disambiguate
const gG5idx = code.indexOf('gG5={', 2990000);
const fG5idx = code.indexOf('FG5={', 2990000);
if (gG5idx !== -1) {
    const chunk = code.substring(gG5idx, gG5idx + 2000);
    const uMsgIdx = chunk.indexOf('userMessageBackground');
    process.stdout.write('\ngG5 full userMsg context:\n');
    process.stdout.write(JSON.stringify(chunk.substring(uMsgIdx - 20, uMsgIdx + 120)) + '\n');
}
if (fG5idx !== -1) {
    const chunk = code.substring(fG5idx, fG5idx + 2000);
    const uMsgIdx = chunk.indexOf('userMessageBackground');
    process.stdout.write('\nFG5 full userMsg context:\n');
    process.stdout.write(JSON.stringify(chunk.substring(uMsgIdx - 20, uMsgIdx + 120)) + '\n');
}
