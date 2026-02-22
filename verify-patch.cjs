const fs = require('fs');
const cliPath = 'C:\\Users\\mcgra\\AppData\\Local\\mcp-bin\\node_modules\\@anthropic-ai\\claude-code\\cli.js';
const code = fs.readFileSync(cliPath, 'utf8');

// Check 1: Did the aiTextBackground key get added to themes?
const themeKeyCheck = code.indexOf('aiTextBackground');
console.log(`aiTextBackground found in cli.js: ${themeKeyCheck !== -1} (at ${themeKeyCheck})`);

if (themeKeyCheck !== -1) {
    console.log("Context:", code.substring(themeKeyCheck - 50, themeKeyCheck + 100));
}

// Check 2: Did the Box patch apply?
const boxCheck = code.indexOf('backgroundColor:"aiTextBackground"');
console.log(`\nBox backgroundColor patch found: ${boxCheck !== -1} (at ${boxCheck})`);

if (boxCheck !== -1) {
    console.log("Context:", code.substring(boxCheck - 100, boxCheck + 100));
}

// Check 3: How does the existing bashMessageBackgroundColor work?
const bashBgIdx = code.indexOf('backgroundColor:"bashMessageBackgroundColor"');
console.log(`\nbashMessageBackgroundColor usage (at ${bashBgIdx}):`);
if (bashBgIdx !== -1) {
    console.log("Context:", code.substring(bashBgIdx - 50, bashBgIdx + 150));
}

// Check 4: How does userMessageBackground work?
const userBgIdx = code.indexOf('backgroundColor:"userMessageBackground"');
console.log(`\nuserMessageBackground usage (at ${userBgIdx}):`);
if (userBgIdx !== -1) {
    console.log("Context:", code.substring(userBgIdx - 50, userBgIdx + 150));
}
