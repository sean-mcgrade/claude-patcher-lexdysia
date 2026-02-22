const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');
let out = "";

// The key component from our earlier analysis is "Oz" - it's passed as the message renderer
// in several places. Let's find it.
const ozIdx = code.indexOf('function Oz(');
if (ozIdx !== -1) {
    out += "\n=== Oz component ===\n" + code.substring(ozIdx, ozIdx + 2000) + "\n";
}

// Also search for the main message list component J8H
const j8hIdx = code.indexOf('function J8H(');
if (j8hIdx !== -1) {
    out += "\n=== J8H component ===\n" + code.substring(j8hIdx, j8hIdx + 2000) + "\n";
}

// Search for the component that renders message content blocks by switching on type  
// In our earlier analysis, assistant messages have content arrays with {type:"text"} items
// The rendering component likely does something like: if(param.type==="text") ...
const textBlockPattern = 'param.type==="text"';
let si = 0;
for (let i = 0; i < 5; i++) {
    const idx = code.indexOf(textBlockPattern, si);
    if (idx !== -1) {
        out += `\n=== param.type==="text" match ${i} ===\n`;
        out += code.substring(idx - 300, idx + 500) + "\n";
        si = idx + textBlockPattern.length;
    } else break;
}

// Search for type==="text" combined with createElement  
const textTypePattern = '.type==="text"';
si = 0;
let count = 0;
while (count < 8) {
    const idx = code.indexOf(textTypePattern, si);
    if (idx === -1) break;
    const context = code.substring(idx - 200, idx + 300);
    if (context.includes('createElement')) {
        out += `\n=== .type==="text" + createElement match ${count} ===\n`;
        out += context + "\n";
        count++;
    }
    si = idx + textTypePattern.length;
}

fs.writeFileSync('Z:\\claude-patcher\\message-renderer-out.txt', out);
console.log(`Wrote ${out.length} chars to message-renderer-out.txt`);
