const fs = require('fs');
const c = fs.readFileSync(process.env.LOCALAPPDATA + '/mcp-bin/node_modules/@anthropic-ai/claude-code/cli.js.bak', 'utf8');
const oldY = 'y=!O6&&!Z6&&(f6?EP.default.createElement(P8,{height:1},EP.default.createElement(f,{dimColor:!0},"Waiting for permission…")):NlY(n,z,D,K.id,H,{verbose:_,inProgressToolCallCount:j,isTranscriptMode:X},M))';
console.log(c.includes(oldY));
