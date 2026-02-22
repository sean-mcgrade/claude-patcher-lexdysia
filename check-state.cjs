const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const code = fs.readFileSync(cliPath, 'utf8');
console.log('File size:', code.length);

// Check if the old box pattern is there (needs patching)
const oldBox = code.indexOf('createElement(b,{flexDirection:"column"},wz.default.createElement(WO,null,_))');
console.log('Old E1q box pattern (unpatched):', oldBox);

// Check if blue bar patch is already applied
const newBox = code.indexOf('"#5588ff"');
console.log('Blue bar patch applied:', newBox !== -1 ? 'YES at ' + newBox : 'NO');

// Check if outer border patch applied
const outerBorder = code.indexOf('borderLeft:!0');
console.log('Outer border patch applied:', outerBorder !== -1 ? 'YES at ' + outerBorder : 'NO');

// Check bashMessageBackgroundColor for reference
const bash = code.indexOf('bashMessageBackgroundColor');
console.log('bashMessageBackgroundColor at:', bash);
if (bash !== -1) {
    console.log('Context:', code.substring(bash - 30, bash + 200));
}

// Check userMessageBackground for reference  
const userMsg = code.indexOf('userMessageBackground');
console.log('\nuserMessageBackground at:', userMsg);
if (userMsg !== -1) {
    console.log('Context:', code.substring(userMsg - 50, userMsg + 200));
}

// Find the E1q default case - that's where we want to add color
const e1qIdx = code.indexOf('function E1q(');
console.log('\nfunction E1q( at:', e1qIdx);
if (e1qIdx !== -1) {
    // Find the default case in E1q
    const e1qBody = code.substring(e1qIdx, e1qIdx + 4000);
    const defaultCaseIdx = e1qBody.lastIndexOf('default:{');
    if (defaultCaseIdx !== -1) {
        console.log('E1q default case:\n', e1qBody.substring(defaultCaseIdx, defaultCaseIdx + 800));
    }
}
