const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js';
const code = fs.readFileSync(cliPath, 'utf8');

const target = 'case"dark":return{';
const idx = code.indexOf(target);

if (idx !== -1) {
    console.log(code.substring(idx, idx + 800));
} else {
    console.log("Not found.");
}
