const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');

const regex = /"[^"]*(?i:markdown)[^"]*"/g;
let found = 0;
while ((match = regex.exec(code)) !== null) {
    if (found > 30) break;
    const str = match[0];
    if (str.length < 50) {
        // print a small context
        console.log(`\nMatch: ${str}`);
        console.log(code.substring(Math.max(0, match.index - 80), match.index + 200));
        found++;
    }
}
