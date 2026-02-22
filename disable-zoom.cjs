const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.env.LOCALAPPDATA, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json');
const bakPath = settingsPath + '.bak';

if (!fs.existsSync(settingsPath)) {
    console.error('Windows Terminal settings file not found!');
    process.exit(1);
}

// Backup current settings
fs.copyFileSync(settingsPath, bakPath);
console.log('Backed up Windows Terminal settings to:', bakPath);

// Strip BOM if present
let raw = fs.readFileSync(settingsPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
}

const settings = JSON.parse(raw);

// Ensure actions or keybindings array exists
const targetArray = settings.actions || settings.keybindings || [];

// The bindings we want to unbind to completely kill terminal zoom
const unbinds = [
    { "command": "unbound", "keys": "ctrl+=" },
    { "command": "unbound", "keys": "ctrl+-" },
    { "command": "unbound", "keys": "ctrl+0" },
    { "command": "unbound", "keys": "ctrl+numpad_plus" },
    { "command": "unbound", "keys": "ctrl+numpad_minus" },
    { "command": "unbound", "keys": "ctrl+numpad_0" },
    { "command": "unbound", "keys": "ctrl+wheelUp" },
    { "command": "unbound", "keys": "ctrl+wheelDown" }
];

let added = 0;
for (const unbind of unbinds) {
    const exists = targetArray.some(binding => binding.keys === unbind.keys && binding.command === "unbound");
    if (!exists) {
        targetArray.push(unbind);
        added++;
    }
}

if (settings.actions) {
    settings.actions = targetArray;
} else {
    settings.keybindings = targetArray;
}

const outJSON = JSON.stringify(settings, null, 2);

fs.writeFileSync(settingsPath, outJSON, 'utf8');
console.log(`Successfully disabled terminal zoom! Added ${added} unbind commands.`);
