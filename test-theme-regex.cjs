const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js';
const code = fs.readFileSync(cliPath, 'utf8');

const matches = [...code.matchAll(/autoAccept:"[^"]+".*?userMessageBackground:"[^"]+".*?(?:rate_limit_empty|fastMo)[^}]*\}/g)];

console.log(`Matched ${matches.length} themes!`);
for (let i = 0; i < matches.length; i++) {
    console.log(`\n--- Theme ${i} ---`);
    console.log(matches[i][0]);
}
