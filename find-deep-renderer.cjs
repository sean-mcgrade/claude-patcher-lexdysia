const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');
let out = "";

// Match 0 from previous: the text block renderer that maps content items
// Let's find it with more context - search for the unique string "O.text!==null"
const searchStr = 'O.text!==null';
const idx = code.indexOf(searchStr);
if (idx !== -1) {
    out += "\n=== TEXT BLOCK RENDERER (wide context) ===\n";
    out += code.substring(idx - 600, idx + 1500) + "\n";
}

// Also find the vB component (the content renderer referenced)
const vBPattern = 'function vB(';
const vbIdx = code.indexOf(vBPattern);
if (vbIdx !== -1) {
    out += "\n=== vB component ===\n";
    out += code.substring(vbIdx, vbIdx + 1500) + "\n";
} else {
    // Try without parens
    const vBPattern2 = 'function vB{';
    const vbIdx2 = code.indexOf(vBPattern2);
    if (vbIdx2 !== -1) {
        out += "\n=== vB component (alt) ===\n";
        out += code.substring(vbIdx2, vbIdx2 + 1500) + "\n";
    }
}

// Find the Oz component - the main message dispatcher
const ozPattern = '{message:';
let si = 0;
let count = 0;
while (count < 10) {
    const idx2 = code.indexOf(ozPattern, si);
    if (idx2 === -1) break;
    const context = code.substring(idx2 - 100, idx2 + 300);
    if (context.includes('addMargin') && context.includes('shouldShowDot') && context.includes('createElement')) {
        out += `\n=== Message dispatcher (Oz) match ${count} ===\n`;
        out += code.substring(idx2 - 300, idx2 + 2000) + "\n";
        count++;
    }
    si = idx2 + ozPattern.length;
}

fs.writeFileSync('Z:\\claude-patcher\\deep-renderer-out.txt', out);
console.log(`Wrote ${out.length} chars`);
