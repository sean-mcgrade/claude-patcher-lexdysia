const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const code = fs.readFileSync(cliPath, 'utf8');

const checks = [
    { label: 'xG5 pastel yellow', needle: 'userMessageBackground:"rgb(255,248,214)",bashMessageBackgroundColor:"rgb(250, 245, 250)",memoryBackgroundColor:"rgb(230, 245, 250)",rate_limit_fill:"rgb(87,105,247)"' },
    { label: 'xG5 violet claude', needle: 'xG5={autoAccept:"rgb(135,0,255)",bashBorder:"rgb(255,0,135)",claude:"rgb(140,90,230)"' },
    { label: 'BG5 pastel yellow', needle: 'userMessageBackground:"rgb(255,248,214)",bashMessageBackgroundColor:"rgb(250, 245, 250)",memoryBackgroundColor:"rgb(230, 245, 250)",rate_limit_fill:"rgb(51,102,255)"' },
    { label: 'BG5 violet claude', needle: 'BG5={autoAccept:"rgb(135,0,255)",bashBorder:"rgb(0,102,204)",claude:"rgb(140,90,230)"' },
    { label: 'gG5 warm amber dark user', needle: 'userMessageBackground:"rgb(72,58,30)",bashMessageBackgroundColor:"rgb(65, 60, 65)",memoryBackgroundColor:"rgb(55, 65, 70)",rate_limit_fill:"rgb(177,185,249)"' },
    { label: 'gG5 violet claude', needle: 'gG5={autoAccept:"rgb(175,135,255)",bashBorder:"rgb(253,93,177)",claude:"rgb(175,140,255)"' },
    { label: 'FG5 warm amber dark user', needle: 'userMessageBackground:"rgb(72,58,30)",bashMessageBackgroundColor:"rgb(65, 60, 65)",memoryBackgroundColor:"rgb(55, 65, 70)",rate_limit_fill:"rgb(153,204,255)"' },
    { label: 'FG5 violet claude', needle: 'FG5={autoAccept:"rgb(175,135,255)",bashBorder:"rgb(51,153,255)",claude:"rgb(175,140,255)"' },
    { label: 'E1q left bar #7b7bff', needle: '"#7b7bff"' },
    { label: 'E1q left border #334488', needle: '"#334488"' },
    // Confirm OLD values are gone
    { label: 'OLD xG5 grey user (should be ABSENT)', needle: 'userMessageBackground:"rgb(240, 240, 240)"', expectAbsent: true },
    { label: 'OLD E1q column box (should be ABSENT)', needle: 'O=wz.default.createElement(b,{flexDirection:"column"},wz.default.createElement(WO,null,_))', expectAbsent: true },
];

let pass = 0, fail = 0;
for (const { label, needle, expectAbsent } of checks) {
    const found = code.includes(needle);
    const ok = expectAbsent ? !found : found;
    console.log(`${ok ? '✅' : '❌'} ${label}: ${found ? 'PRESENT' : 'ABSENT'}`);
    if (ok) pass++; else fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
