const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const code = fs.readFileSync(cliPath, 'utf8');

// The theme objects are near offset 2995000-3005000
// Let's find the theme variable names - they end right after the theme object definitions

// Widen the search: look for the code that picks between themes
// The pattern would be something like: A===0?wG5:A===1?uG5:A===2?...
// Let's look just before the first userMessageBackground
const firstThemeIdx = 2995816;
// Look backward from there to find where this theme object starts
const objStart = code.lastIndexOf('{autoAccept:', firstThemeIdx);
console.log('First theme object starts at:', objStart);
console.log('First theme starts with:', code.substring(objStart - 20, objStart + 100));

// Now look at ALL the theme object starts
let si = 2990000;
let count = 0;
while (count < 10) {
    const idx = code.indexOf('{autoAccept:', si);
    if (idx === -1 || idx > 3010000) break;
    // Find the var name before this object
    const before = code.substring(idx - 30, idx);
    console.log(`\nTheme #${count} at ${idx}: prev chars: "${before.substring(before.length - 20)}"`);
    // Show start of theme
    console.log('Theme start:', code.substring(idx, idx + 150));
    si = idx + 12;
    count++;
}

// Find the function that returns the theme based on settings
const themePickerPatterns = ['A===0?', 'K===0?', 'q===0?', 'w===0?'];
for (const pat of themePickerPatterns) {
    let si2 = 3000000;
    while (true) {
        const idx = code.indexOf(pat, si2);
        if (idx === -1 || idx > 3020000) break;
        const ctx = code.substring(idx - 50, idx + 400);
        if (ctx.includes('G5')) {
            console.log(`\nTheme picker (${pat}) at ${idx}:`);
            console.log(ctx);
        }
        si2 = idx + pat.length;
    }
}
