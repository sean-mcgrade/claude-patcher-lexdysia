const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');
let out = "";

// Get more of E1q - it's long, get 4000 chars
const e1qIdx = code.indexOf('function E1q(');
if (e1qIdx !== -1) {
    out += "\n=== E1q FULL (assistant text block renderer) ===\n";
    out += code.substring(e1qIdx, e1qIdx + 4000) + "\n";
}

fs.writeFileSync('Z:\\claude-patcher\\e1q-full.txt', out);
console.log(`Wrote ${out.length} chars`);
