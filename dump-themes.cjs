const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const code = fs.readFileSync(cliPath, 'utf8');

// Themes: Mw7=["dark","light","light-daltonized","dark-daltonized","light-ansi","dark-ansi"]
// xG5=dark, uG5=light, mG5=light-daltonized, BG5=dark-daltonized, gG5=light-ansi, FG5=dark-ansi

const themes = [
    { name: 'dark (xG5)', varName: 'xG5' },
    { name: 'light (uG5)', varName: 'uG5' },
    { name: 'light-daltonized (mG5)', varName: 'mG5' },
    { name: 'dark-daltonized (BG5)', varName: 'BG5' },
    { name: 'light-ansi (gG5)', varName: 'gG5' },
    { name: 'dark-ansi (FG5)', varName: 'FG5' },
];

let out = '';
for (const { name, varName } of themes) {
    const startPattern = `${varName}={`;
    const startIdx = code.indexOf(startPattern, 2990000);
    if (startIdx === -1) { out += `${name}: NOT FOUND\n`; continue; }
    // Find the end of the object - find matching }
    let depth = 0;
    let i = startIdx + varName.length + 1; // point to {
    for (; i < code.length; i++) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}') { depth--; if (depth === 0) break; }
    }
    const obj = code.substring(startIdx + varName.length + 1, i); // contents of {}
    out += `\n=== ${name} ===\n${obj}\n`;
}

fs.writeFileSync('Z:\\claude-patcher\\all-themes-out.txt', out);
console.log(`Wrote ${out.length} chars`);
