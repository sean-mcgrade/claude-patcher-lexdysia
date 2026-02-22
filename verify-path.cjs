const fs = require('fs');
const path = require('path');

// Check ALL possible claude cli.js locations
const candidates = [
    path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'),
    path.join(process.env.USERPROFILE, '.local', 'bin', 'claude.js'),
    path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'),
    path.join(process.env.LOCALAPPDATA, 'Programs', 'claude-code', 'cli.js'),
];

let out = '';
for (const p of candidates) {
    const exists = fs.existsSync(p);
    out += `\n${p}\n  exists: ${exists}\n`;
    if (exists) {
        const stat = fs.statSync(p);
        const code = fs.readFileSync(p, 'utf8');
        out += `  size: ${stat.size}\n`;
        out += `  violet patched: ${code.includes('rgb(140,90,230)')}\n`;
        out += `  bak exists: ${fs.existsSync(p + '.bak')}\n`;
        // Also check where claude.exe/claude.cmd points
    }
}

// Check PATH for claude
const { execSync } = require('child_process');
try {
    const whereClaude = execSync('where claude 2>&1', { encoding: 'utf8' });
    out += `\nwhere claude:\n${whereClaude}\n`;
} catch (e) {
    out += `\nwhere claude error: ${e.message}\n`;
}

// Check the package.json to find actual entrypoint
const pkgPath = path.join(process.env.LOCALAPPDATA, 'mcp-bin', 'node_modules', '@anthropic-ai', 'claude-code', 'package.json');
if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    out += `\npackage.json bin: ${JSON.stringify(pkg.bin)}\n`;
    out += `package.json main: ${pkg.main}\n`;
    out += `package.json version: ${pkg.version}\n`;
}

fs.writeFileSync('Z:\\claude-patcher\\verify-path.txt', out);
