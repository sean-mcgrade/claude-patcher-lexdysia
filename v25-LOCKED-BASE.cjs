const fs = require('fs');
const path = require('path');

console.log("Claude Code Color Patcher v25 - COLORED BORDERS");
console.log("==================================================");

const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const bakPath = cliPath + '.bak';
if (!fs.existsSync(bakPath)) { console.error('No backup!'); process.exit(1); }

let patched = fs.readFileSync(bakPath, 'utf8');
let patchCount = 0;

// ─────────────────────────────────────────────────────────────
// SAFE THEME PATCHING
// ─────────────────────────────────────────────────────────────
function patchTheme(varName, replacements) {
    const startIdx = patched.indexOf(`${varName}={`, 2990000);
    if (startIdx === -1) return;
    let depth = 0, i = startIdx + varName.length + 1;
    for (; i < patched.length; i++) {
        if (patched[i] === '{') depth++;
        else if (patched[i] === '}') { if (--depth === 0) break; }
    }
    const endIdx = i + 1;
    let obj = patched.substring(startIdx, endIdx);
    for (const [key, newVal] of replacements) {
        const keyPattern = `${key}:"`;
        const kIdx = obj.indexOf(keyPattern);
        if (kIdx === -1) continue;
        const valStart = kIdx + keyPattern.length;
        const valEnd = obj.indexOf('"', valStart);
        obj = obj.substring(0, valStart) + newVal + obj.substring(valEnd);
    }
    patched = patched.substring(0, startIdx) + obj + patched.substring(endIdx);
    patchCount++;
}

// User messages background
const USER_BG_DARK = 'rgb(240,210,100)';
const USER_BG_LIGHT = 'rgb(20,40,100)';

for (const [varName, userBg] of [['xG5', USER_BG_LIGHT], ['BG5', USER_BG_LIGHT], ['gG5', USER_BG_DARK], ['FG5', USER_BG_DARK]]) {
    patchTheme(varName, [
        ['clawd_body', 'rgb(0,255,180)'], // Cyan robot
        ['userMessageBackground', userBg],
        ['autoAccept', 'rgb(255,200,0)'], // GOLD
        ['bashBorder', 'rgb(0,255,100)'], // EMERALD (We will use this for tool borders)
        ['suggestion', 'rgb(0,255,255)'], // CYAN (We will use this for AI borders)
        ['success', 'rgb(50,255,100)'],   // Bright GREEN
        ['claude', 'rgb(200,100,255)'],   // VIOLET
        ['warning', 'rgb(255,150,0)']     // ORANGE
    ]);
}

// ─────────────────────────────────────────────────────────────
// UI COMPONENT CARDS: PROPERLY COLORED BORDERS
// To make sure ink colors the borders, we use references to the THEME
// keys we just patched. 
// "suggestion" = Cyan. "bashBorder" = Emerald.
// ─────────────────────────────────────────────────────────────

// 1. AI Text Block (E1q) -> Chat Bubble
const OLD_O = 'O=wz.default.createElement(b,{flexDirection:"column"},wz.default.createElement(WO,null,_))';
// Using borderColor:"suggestion" mapped to our bright Cyan.
const NEW_O = 'O=wz.default.createElement(b,{flexDirection:"column",borderStyle:"round",borderColor:"suggestion",backgroundColor:"#0A1930",paddingX:2,paddingY:1},wz.default.createElement(WO,null,_))';

if (patched.includes(OLD_O)) {
    patched = patched.replace(OLD_O, NEW_O);
    console.log('✓  AI text block: Added Colored Border (CYAN), navy background, padding.');
    patchCount++;
}

// 2. AI Dot -> Purple Bar ▌
const OLD_DOT = 'wz.default.createElement(b,{minWidth:2},wz.default.createElement(f,{color:"text"},s9))';
const NEW_DOT = 'wz.default.createElement(b,{minWidth:2},wz.default.createElement(f,{color:"claude"},"\u258c "))';
if (patched.includes(OLD_DOT)) {
    patched = patched.replace(OLD_DOT, NEW_DOT);
    console.log('✓  AI indicator: Swapped dot for Purple ▌ bar (mapped to claude color).');
    patchCount++;
}

// 3. Tool Use Wrapper (T1q: Bash, Memory, etc)
const OLD_TOOL_BOX = 'U=EP.default.createElement(V,{flexDirection:h,justifyContent:B,marginTop:x,width:p},I)';
// Using borderColor:"bashBorder" mapped to our bright Emerald.
const NEW_TOOL_BOX = 'U=EP.default.createElement(V,{flexDirection:h,justifyContent:B,marginTop:x,width:p,borderStyle:"single",borderColor:"bashBorder",backgroundColor:"#0A2918",paddingX:1,paddingLeft:2},I)';

if (patched.includes(OLD_TOOL_BOX)) {
    patched = patched.replace(OLD_TOOL_BOX, NEW_TOOL_BOX);
    console.log('✓  Tool Use block: Added Colored Border (EMERALD), dark emerald background.');
    patchCount++;
}

// Write the result
fs.writeFileSync(cliPath, patched, 'utf8');
console.log(`\n✅ Done. ${patchCount} UI modifications applied. Colored Theme Borders ready!`);
