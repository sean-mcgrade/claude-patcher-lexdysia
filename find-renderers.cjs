const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');

let out = "";

const userMsgIdx = code.indexOf('"No content found in user prompt message"');
if (userMsgIdx !== -1) {
    out += "\n=== User Message Renderer ===\n" + code.substring(userMsgIdx - 300, userMsgIdx + 800) + "\n";
}

const assistKeywords = [
    'type==="assistant"',
    'return{type:"assistant"',
    'type:"assistant"',
    'level==="warning"',
    'tool_use_id'
];

for (const kw of assistKeywords) {
    let start = 0;
    for (let i = 0; i < 3; i++) {
        const idx = code.indexOf(kw, start);
        if (idx !== -1) {
            out += `\n=== Found: ${kw} (${i}) ===\n`;
            out += code.substring(idx - 200, idx + 1000) + "\n";
            start = idx + kw.length;
        } else break;
    }
}

fs.writeFileSync('Z:\\claude-patcher\\renderers-out.txt', out);
