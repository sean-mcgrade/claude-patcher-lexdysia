const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const code = fs.readFileSync(cliPath, 'utf8');

// Find all theme definitions - look for patterns like {autoAccept:... userMessageBackground:...}
// The theme object structure from earlier analysis
const themeMatches = [];
let si = 0;
while (true) {
    const idx = code.indexOf('userMessageBackground', si);
    if (idx === -1) break;
    themeMatches.push({ idx, ctx: code.substring(idx - 200, idx + 300) });
    si = idx + 21;
}

console.log(`Found ${themeMatches.length} userMessageBackground occurrences:`);
for (let i = 0; i < themeMatches.length; i++) {
    console.log(`\n--- #${i} at ${themeMatches[i].idx} ---`);
    console.log(themeMatches[i].ctx);
}

// Check the actual theme object content
const darkIdx = code.indexOf('"dark"');
if (darkIdx !== -1) {
    // Find nearby color definition
    let si2 = Math.max(0, darkIdx - 2000);
    while (si2 < darkIdx + 1000) {
        const ci = code.indexOf('background:', si2);
        if (ci === -1 || ci > darkIdx + 2000) break;
        si2 = ci + 1;
    }
}

// Find where theme colors for light/dark are defined
const lightThemeIdx = code.indexOf('"light":{');
const darkThemeIdx = code.indexOf('"dark":{');
console.log('\nlight theme at:', lightThemeIdx);
console.log('dark theme at:', darkThemeIdx);
if (lightThemeIdx !== -1) {
    console.log('Light theme context:', code.substring(lightThemeIdx - 50, lightThemeIdx + 500));
}
if (darkThemeIdx !== -1) {
    console.log('Dark theme context:', code.substring(darkThemeIdx - 50, darkThemeIdx + 500));
}
