const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');
let out = "";

// Find the xR function definition
const xRPattern = 'function xR(';
const xrIdx = code.indexOf(xRPattern);
if (xrIdx !== -1) {
    out += "\n=== xR component (message renderer) ===\n";
    out += code.substring(xrIdx, xrIdx + 3000) + "\n";
} else {
    out += "xR function not found directly. Trying pattern...\n";
    // Try finding it in a different way: xR={...} or var xR=
    const alt1 = code.indexOf('var xR=');
    const alt2 = code.indexOf('let xR=');
    const alt3 = code.indexOf('const xR=');
    for (const [name, idx] of [['var xR', alt1], ['let xR', alt2], ['const xR', alt3]]) {
        if (idx !== -1) {
            out += `\n=== ${name} ===\n`;
            out += code.substring(idx, idx + 3000) + "\n";
        }
    }
}

// Also find what renders when message.type === "assistant" and content[0].type === "text"
// Look for the pattern that switches on content block types: "text", "tool_use", "thinking"
const blockSwitch = 'case"text":';
let si = 0;
let count = 0;
while (count < 5) {
    const idx = code.indexOf(blockSwitch, si);
    if (idx === -1) break;
    const context = code.substring(idx - 200, idx + 500);
    if (context.includes('createElement') && (context.includes('tool_use') || context.includes('thinking'))) {
        out += `\n=== case"text" block switch ${count} ===\n`;
        out += context + "\n";
        count++;
    }
    si = idx + blockSwitch.length;
}

// Search for "WO" component which renders markdown text - referenced in line 16 above
const woIdx = code.indexOf('function WO(');
if (woIdx !== -1) {
    out += "\n=== WO component (markdown text renderer) ===\n";
    out += code.substring(woIdx, woIdx + 2000) + "\n";
}

// Also find M3 component - referenced in vB
const m3Idx = code.indexOf('function M3(');
if (m3Idx !== -1) {
    out += "\n=== M3 component ===\n";
    out += code.substring(m3Idx, m3Idx + 2000) + "\n";
}

fs.writeFileSync('Z:\\claude-patcher\\xr-renderer-out.txt', out);
console.log(`Wrote ${out.length} chars`);
