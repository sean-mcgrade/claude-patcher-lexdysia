const fs = require('fs');
const c = fs.readFileSync('C:/Users/mcgra/AppData/Local/mcp-bin/node_modules/@anthropic-ai/claude-code/cli.js.bak', 'utf8');

let out = "--- Tool Wrapper (T1q) ---\n";
const t1qPat = 'U=EP.default.createElement(V,{flexDirection:h,justifyContent:B,marginTop:x,width:p},I)';
const t1qIdx = c.indexOf(t1qPat);
out += t1qIdx + ": " + c.substring(t1qIdx - 50, t1qIdx + 150) + "\n\n";

out += "--- User Msg wrapper (userMessageBackground) ---\n";
let si = 0;
for (let i = 0; i < 8; i++) {
    const idx = c.indexOf(':"userMessageBackground"', si);
    if (idx === -1) break;
    out += c.substring(idx - 150, idx + 50) + "\n";
    si = idx + 10;
}

fs.writeFileSync('z:/claude-patcher/find-experimental.txt', out);
