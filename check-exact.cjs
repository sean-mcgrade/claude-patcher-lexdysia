const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js.bak');
const code = fs.readFileSync(cliPath, 'utf8');

// Get the EXACT byte sequence around each userMessageBackground for gG5 and FG5
// gG5 userMessageBackground is rgb(55, 55, 55) - first occurrence
const gG5idx = code.indexOf('gG5={');
if (gG5idx !== -1) {
    const chunk = code.substring(gG5idx, gG5idx + 2000);
    const userMsgIdx = chunk.indexOf('userMessageBackground');
    if (userMsgIdx !== -1) {
        process.stdout.write('\ngG5 userMessageBackground exact:\n');
        process.stdout.write(JSON.stringify(chunk.substring(userMsgIdx - 5, userMsgIdx + 60)) + '\n');
    }
}

const fG5idx = code.indexOf('FG5={');
if (fG5idx !== -1) {
    const chunk = code.substring(fG5idx, fG5idx + 2000);
    const userMsgIdx = chunk.indexOf('userMessageBackground');
    if (userMsgIdx !== -1) {
        process.stdout.write('\nFG5 userMessageBackground exact:\n');
        process.stdout.write(JSON.stringify(chunk.substring(userMsgIdx - 5, userMsgIdx + 60)) + '\n');
    }
}

const xG5idx = code.indexOf('xG5={');
if (xG5idx !== -1) {
    const chunk = code.substring(xG5idx, xG5idx + 2000);
    const userMsgIdx = chunk.indexOf('userMessageBackground');
    if (userMsgIdx !== -1) {
        process.stdout.write('\nxG5 userMessageBackground exact:\n');
        process.stdout.write(JSON.stringify(chunk.substring(userMsgIdx - 5, userMsgIdx + 80)) + '\n');
    }
}

const bG5idx = code.indexOf('BG5={');
if (bG5idx !== -1) {
    const chunk = code.substring(bG5idx, bG5idx + 2000);
    const userMsgIdx = chunk.indexOf('userMessageBackground');
    if (userMsgIdx !== -1) {
        process.stdout.write('\nBG5 userMessageBackground exact:\n');
        process.stdout.write(JSON.stringify(chunk.substring(userMsgIdx - 5, userMsgIdx + 80)) + '\n');
    }
}

// Also check the E1q exact patterns
const e1qPat1 = code.indexOf('O=wz.default.createElement(b,{flexDirection:"column"},wz.default.createElement(WO,null,_))');
process.stdout.write('\nOLD_BOX found: ' + (e1qPat1 !== -1 ? 'YES at ' + e1qPat1 : 'NO') + '\n');

const e1qOuter = code.indexOf('wz.default.createElement(b,{alignItems:"flex-start",flexDirection:"row",justifyContent:"space-between",marginTop:$,width:"100%"},J)');
process.stdout.write('OLD_OUTER found: ' + (e1qOuter !== -1 ? 'YES at ' + e1qOuter : 'NO') + '\n');
