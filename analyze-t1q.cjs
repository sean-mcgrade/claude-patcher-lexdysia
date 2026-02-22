const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js.bak'), 'utf8');

let out = '';

// T1q - tool use block renderer - find the dot rendering
const t1qIdx = code.indexOf('function T1q(');
const body = code.substring(t1qIdx, t1qIdx + 6000);

// Find all color: references in T1q
let si = 0, count = 0;
while (count < 15) {
    const idx = body.indexOf('color:', si);
    if (idx === -1) break;
    out += `\ncolor: at T1q+${idx}: ${body.substring(idx, idx + 80)}\n`;
    si = idx + 6;
    count++;
}

// Also find the dot character in T1q
const bulletIdx = body.indexOf('\u25cf');
const squareIdx = body.indexOf('squareSmall');
out += `\n● in T1q: ${bulletIdx}\n`;
out += `squareSmall in T1q: ${squareIdx}\n`;
if (squareIdx !== -1) out += body.substring(squareIdx - 50, squareIdx + 200) + '\n';

// Find how the "Bash(...)" header line is colored
// The green dot before "Bash(echo...)" - look for "Bash" string rendering
const bashLabelIdx = code.indexOf('"Bash"');
out += `\n"Bash" label at: ${bashLabelIdx}\n`;
if (bashLabelIdx !== -1) out += code.substring(bashLabelIdx - 200, bashLabelIdx + 300) + '\n';

// Find the running spinner / in-progress indicator color
// From xR: shouldAnimate is true when running
const spinnerColorIdx = code.indexOf('color:"claudeBlue_FOR_SYSTEM');
out += `\nclaudeBlue usage: ${spinnerColorIdx}\n`;

// Find autoAccept color usage - purple rgb(135,0,255) is autoAccept
// autoAccept is used for permission prompts
const autoAcceptColorIdx = code.indexOf('color:"autoAccept"');
out += `\ncolor:"autoAccept" usages:\n`;
let si2 = 0, c2 = 0;
while (c2 < 5) {
    const idx = code.indexOf('color:"autoAccept"', si2);
    if (idx === -1) break;
    out += `  at ${idx}: ${code.substring(idx - 50, idx + 150)}\n`;
    si2 = idx + 18;
    c2++;
}

// THE KEY: what colour is the green ● before Bash() tool calls?
// From the screenshot those bullets are GREEN - likely "success" color
// Let's find what renders the tool use header with the dot
const toolHeaderPat = 'shouldShowDot:J';
const thIdx = code.indexOf(toolHeaderPat, 9070000);
out += `\nshouldShowDot:J in E1q area at: ${thIdx}\n`;

// In T1q, the dot's color - look for it near the leading createElement calls 
// shouldShowDot:J in T1q  
const t1qDot = body.indexOf('shouldShowDot');
out += `\nshouldShowDot in T1q body at +${t1qDot}\n`;
out += body.substring(t1qDot, t1qDot + 500) + '\n';

fs.writeFileSync('Z:\\claude-patcher\\t1q-analysis.txt', out);
