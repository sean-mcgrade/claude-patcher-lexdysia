const fs = require('fs');
const path = require('path');
const cliPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js.bak');
const code = fs.readFileSync(cliPath, 'utf8');

// Find the splash screen / header rendering - look for "Claude Code" text being rendered
// and also look for how the response prefix (●) is rendered with color

// Search for the dot/bullet that appears before AI responses
// From the screenshot: "● Running a self-test" - the green ● bullet
const bulletPatterns = [
    'squareSmallFilled',
    'i6.squareSmallFilled',
    's9',  // s9 was the dot variable in E1q
    'shouldShowDot',
];

for (const pat of bulletPatterns) {
    const idx = code.indexOf(pat);
    if (idx !== -1) {
        process.stdout.write(`\n--- ${pat} at ${idx} ---\n`);
        process.stdout.write(code.substring(idx - 100, idx + 300) + '\n');
    }
}

// Look for the "●" character itself
const dotIdx = code.indexOf('\u25cf'); // ●
process.stdout.write(`\n● char at: ${dotIdx}\n`);
if (dotIdx !== -1) process.stdout.write(code.substring(dotIdx - 100, dotIdx + 200) + '\n');

// Look for the color on the response prefix dot - should have color:"claude" or similar
// From screenshot the green dots before bash blocks

// Find the big splash logo rendering
const splashPatterns = ['▟█▙', 'claudeLogo', 'logoArt', '\\u25df'];
for (const pat of splashPatterns) {
    const idx = code.indexOf(pat);
    if (idx !== -1) {
        process.stdout.write(`\n--- splash ${pat} at ${idx} ---\n`);
        process.stdout.write(code.substring(idx - 200, idx + 400) + '\n');
        break;
    }
}

// Find "Opus" rendering - that's in the header area shown in screenshot
const opusIdx = code.indexOf('"Opus"');
if (opusIdx !== -1) {
    process.stdout.write(`\n--- "Opus" at ${opusIdx} ---\n`);
    process.stdout.write(code.substring(opusIdx - 300, opusIdx + 300) + '\n');
}

// Find the model/header row that shows "Claude Code v2.1.50 / Opus 4.6"  
const headerModelIdx = code.indexOf('claudeBlue_FOR_SYSTEM_SPINNER');
if (headerModelIdx !== -1) {
    process.stdout.write(`\n--- claudeBlue_FOR_SYSTEM_SPINNER usage at ${headerModelIdx} ---\n`);
    process.stdout.write(code.substring(headerModelIdx - 200, headerModelIdx + 300) + '\n');
}
