const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js.bak');
const code = fs.readFileSync(cliPath, 'utf8');

// Get the FULL E1q default case to understand the surrounding structure
const e1qIdx = code.indexOf('function E1q(');
if (e1qIdx !== -1) {
    const body = code.substring(e1qIdx, e1qIdx + 5000);
    const defaultIdx = body.lastIndexOf('default:{');
    if (defaultIdx !== -1) {
        // Show from default: to end of function
        process.stdout.write('=== E1q default case (full) ===\n');
        process.stdout.write(body.substring(defaultIdx, defaultIdx + 2000) + '\n');
    }
}

// Also show the outer wrapper pattern with full context
const outerPat = 'wz.default.createElement(b,{alignItems:"flex-start",flexDirection:"row",justifyContent:"space-between",marginTop:$,width:"100%"},J)';
const outerIdx = code.indexOf(outerPat);
if (outerIdx !== -1) {
    process.stdout.write('\n=== Outer wrapper FULL context (500 chars around) ===\n');
    process.stdout.write(code.substring(outerIdx - 500, outerIdx + outerPat.length + 200) + '\n');
}
