const fs = require('fs');
const path = require('path');

console.log("Claude Code Color Patcher v39 - SCROLL GLITCH TYPO FIX");
console.log("==========================================================");

const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
const bakPath = cliPath + '.bak';
if (!fs.existsSync(bakPath)) { console.error('No backup!'); process.exit(1); }

let patched = fs.readFileSync(bakPath, 'utf8');
let patchCount = 0;

// ─────────────────────────────────────────────────────────────
// 1. INJECT RESIZE INTERCEPTOR (PROPER NEWLINE FIX)
// ─────────────────────────────────────────────────────────────
const RESIZE_INTERCEPTOR = `
// --- INK RESIZE GLITCH FIX ---
['on', 'addListener'].forEach(method => {
    if(!process.stdout[method]) return;
    const orig = process.stdout[method];
    process.stdout[method] = function(event, listener) {
        if (event === 'resize') return this;
        return orig.call(this, event, listener);
    };
});
const origProcessOn = process.on;
process.on = function(event, listener) {
    if (event === 'SIGWINCH') return this;
    return origProcessOn.call(this, event, listener);
};
// -----------------------------
`;

if (patched.startsWith('#!/usr/bin/env node')) {
    // FIX: Using actual newline character '\n' instead of escaped '\\n' string
    patched = patched.replace('#!/usr/bin/env node\n', '#!/usr/bin/env node\n' + RESIZE_INTERCEPTOR);
    console.log('✓  Resize Interceptor physically injected (Newline regex bug fixed).');
    patchCount++;
}

// ─────────────────────────────────────────────────────────────
// 2. SILENCE VERBOSE TOOL OUTPUTS (Terse Mode)
// ─────────────────────────────────────────────────────────────
const OLD_TOOL_OUTPUT = 'y=!O6&&!Z6&&(f6?EP.default.createElement(P8,{height:1},EP.default.createElement(f,{dimColor:!0},"Waiting for permission…")):NlY(n,z,D,K.id,H,{verbose:_,inProgressToolCallCount:j,isTranscriptMode:X},M))';
const NEW_TOOL_OUTPUT = 'y=!O6&&!Z6&&(f6?EP.default.createElement(P8,{height:1},EP.default.createElement(f,{dimColor:!0},"Waiting for permission…")):null)';

if (patched.includes(OLD_TOOL_OUTPUT)) {
    patched = patched.replace(OLD_TOOL_OUTPUT, NEW_TOOL_OUTPUT);
    console.log('✓  Tool Output silenced natively.');
    patchCount++;
}

// ─────────────────────────────────────────────────────────────
// COLOR AND COMPONENT CONFIGURATION
// ─────────────────────────────────────────────────────────────
const USER_BG_DARK = 'rgb(120,10,30)';   // Deep Crimson/Ruby
const USER_BG_LIGHT = 'rgb(20,40,100)';

const AI_BOX_BG = '#1F0E3D';      // Deep Indigo
const AI_BORDER_THEME = 'suggestion'; // Cyan

const TOOL_BOX_BG = '#1B1917';    // Espresso Charcoal
const TOOL_BORDER_THEME = 'bashBorder'; // Emerald

// Theme Patching
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

for (const [varName, userBg] of [['xG5', USER_BG_LIGHT], ['BG5', USER_BG_LIGHT], ['gG5', USER_BG_DARK], ['FG5', USER_BG_DARK]]) {
    patchTheme(varName, [
        ['clawd_body', 'rgb(0,255,180)'], // Cyan robot
        ['userMessageBackground', userBg],
        ['autoAccept', 'rgb(255,200,0)'], // GOLD
        ['bashBorder', 'rgb(0,255,100)'], // EMERALD
        ['suggestion', 'rgb(0,255,255)'], // CYAN
        ['success', 'rgb(50,255,100)'],   // GREEN
        ['claude', 'rgb(200,100,255)'],   // VIOLET
        ['warning', 'rgb(255,150,0)']     // ORANGE
    ]);
}

// Border/Layout Patches
const OLD_O = 'O=wz.default.createElement(b,{flexDirection:"column"},wz.default.createElement(WO,null,_))';
const NEW_O = `O=wz.default.createElement(b,{flexDirection:"column",borderStyle:"round",borderColor:"${AI_BORDER_THEME}",backgroundColor:"${AI_BOX_BG}",paddingX:2,paddingY:1},wz.default.createElement(WO,null,_))`;
if (patched.includes(OLD_O)) { patched = patched.replace(OLD_O, NEW_O); patchCount++; }

const OLD_DOT = 'wz.default.createElement(b,{minWidth:2},wz.default.createElement(f,{color:"text"},s9))';
const NEW_DOT = 'wz.default.createElement(b,{minWidth:2},wz.default.createElement(f,{color:"claude"},"\\u258c "))';
if (patched.includes(OLD_DOT)) { patched = patched.replace(OLD_DOT, NEW_DOT); patchCount++; }

const OLD_TOOL_BOX = 'U=EP.default.createElement(V,{flexDirection:h,justifyContent:B,marginTop:x,width:p},I)';
const NEW_TOOL_BOX = `U=EP.default.createElement(V,{flexDirection:h,justifyContent:B,marginTop:x,width:p,borderStyle:"single",borderColor:"${TOOL_BORDER_THEME}",backgroundColor:"${TOOL_BOX_BG}",paddingX:1,paddingLeft:2},I)`;
if (patched.includes(OLD_TOOL_BOX)) { patched = patched.replace(OLD_TOOL_BOX, NEW_TOOL_BOX); patchCount++; }

fs.writeFileSync(cliPath, patched, 'utf8');
console.log(`\n✅ Done. ${patchCount} UI modifications correctly applied! Zoom strictly defeated.`);
