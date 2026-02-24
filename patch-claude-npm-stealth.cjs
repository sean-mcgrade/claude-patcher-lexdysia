const fs = require('fs');
const path = require('path');

console.log("Claude Code Color Patcher v72-STEALTH - ZERO VERBOSITY MODE");
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
// 3. SILENCE FILE EDIT OUTPUTS (Added/Removed lines)
// ─────────────────────────────────────────────────────────────
const originalLength = patched.length;

// A. Hide the "+54 added, -10 removed" text headers
patched = patched.replace(/K\.linesAdded>0&&/g, 'false&&');
patched = patched.replace(/K\.linesRemoved>0&&/g, 'false&&');
patched = patched.replace(/W\.stats\.linesAdded>0&&/g, 'false&&');
patched = patched.replace(/W\.stats\.linesRemoved>0&&/g, 'false&&');
patched = patched.replace(/K\.insertions\)Y=h8/g, 'false)Y=h8');
patched = patched.replace(/K\.deletions\)z=h8/g, 'false)z=h8');

// B. Hide the actual CODE blocks (git diff hunks) that print underneath during Edits!
const OLD_HUNKS = '{stats:{filesCount:A.stats.filesChanged,linesAdded:A.stats.linesAdded,linesRemoved:A.stats.linesRemoved},files:q,hunks:K,loading:!1}';
const NEW_HUNKS = '{stats:{filesCount:A.stats.filesChanged,linesAdded:A.stats.linesAdded,linesRemoved:A.stats.linesRemoved},files:q,hunks:new Map(),loading:!1}';
if (patched.includes(OLD_HUNKS)) {
    patched = patched.replace(OLD_HUNKS, NEW_HUNKS);
    console.log('✓  File Hunk (Code Diffs) silenced natively.');
    patchCount++;
}

// B2. Silence new V2.1.50 'nn4' Diff Component
const OLD_HUNKS_2 = 'hunks:v,isLargeFile:V?.isLargeFile';
const NEW_HUNKS_2 = 'hunks:[],isLargeFile:V?.isLargeFile';
if (patched.includes(OLD_HUNKS_2)) {
    patched = patched.replace(OLD_HUNKS_2, NEW_HUNKS_2);
    console.log('✓  File Hunk V2 (nn4 Diffs) silenced natively.');
    patchCount++;
}

// C. Brand the Start-Up header with the Patch Version
patched = patched.replace(/Claude Code v/g, 'Claude Code Patch 55: v');
const OLD_VERSION = /VERSION:"2\.1\.50"/g;
const NEW_VERSION = 'VERSION:"Patch 72-STEALTH: v2.1.50"';
patched = patched.replace(OLD_VERSION, NEW_VERSION);
console.log('✓  Startup Version Banner Branded (Globally injected).');
patchCount++;

if (patched.length !== originalLength || patched.includes('false&&')) {
    console.log('✓  File Modification diff counts silenced natively.');
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

// AST STEALTH HACK: Entirely remove Tool Invocations and Errors from the Render Map!
// By filtering them out before Ink parses them, Claude runs identically in the background but draws exactly 0 pixels for tools.
const OLD_MAP = 'A.message.content.map((G,T)=>F5.createElement(jiY,{key:T,param:G,addMargin:K,tools:Y,commands:z,verbose:w,inProgressToolUseIDs:_,progressMessagesForMessage:$,shouldAnimate:H,shouldShowDot:O,width:j,inProgressToolCallCount:_.size,isTranscriptMode:D,lookups:q,onOpenRateLimitOptions:X,thinkingBlockId:`${A.uuid}:${T}`,lastThinkingBlockId:W}))';
const NEW_MAP = 'A.message.content.filter(G=>G.type!=="tool_use"&&G.type!=="tool_result").map((G,T)=>F5.createElement(jiY,{key:T,param:G,addMargin:K,tools:Y,commands:z,verbose:w,inProgressToolUseIDs:_,progressMessagesForMessage:$,shouldAnimate:H,shouldShowDot:O,width:j,inProgressToolCallCount:_.size,isTranscriptMode:D,lookups:q,onOpenRateLimitOptions:X,thinkingBlockId:`${A.uuid}:${T}`,lastThinkingBlockId:W}))';
if (patched.includes(OLD_MAP)) {
    patched = patched.replace(OLD_MAP, NEW_MAP);
    console.log('✓  Stealth Mode Activated. All Tools and Errors eradicated from screen.');
    patchCount++;
}

fs.writeFileSync(cliPath, patched, 'utf8');
console.log(`\n✅ Done. ${patchCount} UI modifications correctly applied! Zoom strictly defeated.`);
