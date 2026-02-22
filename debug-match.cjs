const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js.bak';
const code = fs.readFileSync(cliPath, 'utf8');

const exactOld = 'createElement(b,{flexDirection:"column"},';
let searchStart = 0;
while (true) {
    const idx = code.indexOf(exactOld, searchStart);
    if (idx === -1) break;

    const afterBox = code.substring(idx + exactOld.length, idx + exactOld.length + 100);
    if (afterBox.includes('createElement(WO,null,')) {
        console.log(`Match at ${idx}:`);
        const before = code.substring(Math.max(0, idx - 1000), idx);
        console.log("Contains 'addMargin':", before.includes('addMargin'));
        console.log("Contains 'color:\"text\"':", before.includes('color:"text"'));
        console.log("Contains 'shouldShowDot':", before.includes('shouldShowDot'));
        console.log("Contains 'minWidth:2':", before.includes('minWidth:2'));
        console.log("Contains 's9':", before.includes('s9'));
        // Print last 300 chars before
        console.log("Last 300 chars before:", before.slice(-300));
        break;
    }
    searchStart = idx + exactOld.length;
}
