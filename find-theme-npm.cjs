const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js';
const code = fs.readFileSync(cliPath, 'utf8');

const target = 'userMessageBackground';
const idx = code.indexOf(target);

if (idx !== -1) {
    // Print 500 characters before and 500 after
    console.log(code.substring(idx - 500, idx + 500));
} else {
    console.log("Not found.");
}
