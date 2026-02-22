const fs = require('fs');
const code = fs.readFileSync('C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js', 'utf8');
// M3 is at 3119392
fs.writeFileSync('Z:\\claude-patcher\\M3-body.txt', code.substring(3119385, 3119385 + 1200));
console.log('done');
