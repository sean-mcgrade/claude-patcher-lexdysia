#!/usr/bin/env node
/**
 * Claude Code CLI v2.1.81+ — Surgical AST + String Patch
 * =======================================================
 * PATCH VERSION: 3.2.0
 *
 * Hybrid approach:
 *   1. Parse AST to find switch statement positions by structural signature
 *   2. Inject `return null;` via surgical byte-offset string splicing
 *   3. Apply string patches for leaf components, borders, dashboard
 *
 * NO full code regeneration — preserves original formatting perfectly.
 *
 * Defense-in-depth levels:
 *   Level 1 (AST): Message-type switch — null "grouped_tool_use",
 *                  "collapsed_read_search" cases at the MAPPING level
 *   Level 2 (AST): Content-block switch — null "tool_use",
 *                  "tool_result" cases at the RENDERER level
 *   Level 3 (Str): Leaf functions — null aK, q1, Uk4, xk4,
 *                  ps4, VM, _t4, ss4, bg
 *
 * v3.2.0: Remap for CLI v2.1.81+
 *   - All minified names remapped (Y6→z6, i3→aK, M8→q1, etc.)
 *   - RAq removed (error bracket merged/eliminated in new build)
 *   - DAq removed (shouldShowDot now inline in Uk4, caught by null)
 *   - User messages use backgroundColor:"userMessageBackground" theme var
 *   - Prompt border function n9()→tF()
 *   - CLI path auto-detected via glob
 *
 * v3.1.0: Maroney Red user messages
 *   - User wrapper Box gets backgroundColor:#5c0000
 *   - Cyan borders on assistant text wrapper
 *
 * This ensures:
 *   - Tool output is eliminated before wrapper Boxes are created (no ghost gaps)
 *   - Error text is eliminated at the renderer level (no stderr leaks through React)
 *   - Belt-and-suspenders leaf nulling catches any remaining paths
 *
 * Usage:
 *   cd %USERPROFILE% && npm install @babel/parser @babel/traverse @babel/types
 *   node claude-ast-patch.cjs
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('fs').existsSync(path.join(process.env.USERPROFILE, 'node_modules', 'glob'))
  ? require('glob')
  : { globSync: null };
const parser = require('@babel/parser');
const _traverse = require('@babel/traverse');
const t = require('@babel/types');

const traverse = _traverse.default || _traverse;

// ── Version ────────────────────────────────────────────────────────
const PATCH_VERSION = '3.2.0';
const PATCH_DATE = new Date().toISOString().split('T')[0];
const PATCH_LABEL = `claude-ast-patch v${PATCH_VERSION} (${PATCH_DATE})`;

// ── Config: Auto-detect CLI path ──────────────────────────────────
function findCliJs() {
  const candidates = [
    // npx cache (current known location)
    path.join(process.env.USERPROFILE, 'AppData', 'Local', 'npm-cache', '_npx'),
    // mcp-bin (legacy location)
    path.join(process.env.USERPROFILE, 'AppData', 'Local', 'mcp-bin'),
  ];

  for (const base of candidates) {
    if (!fs.existsSync(base)) continue;
    // Walk to find cli.js
    const target = path.join('@anthropic-ai', 'claude-code', 'cli.js');
    try {
      const found = findFileRecursive(base, target, 5);
      if (found) return found;
    } catch {}
  }
  return null;
}

function findFileRecursive(dir, target, maxDepth) {
  if (maxDepth <= 0) return null;
  const candidate = path.join(dir, target);
  if (fs.existsSync(candidate)) return candidate;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === '.cache' || entry.name === '.git') continue;
      const result = findFileRecursive(path.join(dir, entry.name), target, maxDepth - 1);
      if (result) return result;
    }
  } catch {}
  return null;
}

const CLI_PATH = findCliJs();
if (!CLI_PATH) {
  console.error('[FAIL] cli.js not found. Searched npx cache and mcp-bin.');
  console.error('       Set CLI_PATH env var to override.');
  process.exit(1);
}
console.log(`[found] ${CLI_PATH}`);

const BACKUP_PATH = CLI_PATH + '.bak';

// ── Step 1: Restore from backup ────────────────────────────────────
if (fs.existsSync(BACKUP_PATH)) {
  console.log('[restore] Restoring original from cli.js.bak');
  fs.copyFileSync(BACKUP_PATH, CLI_PATH);
} else {
  console.log('[backup] Creating cli.js.bak');
  fs.copyFileSync(CLI_PATH, BACKUP_PATH);
}

let code = fs.readFileSync(CLI_PATH, 'utf8');
const originalSize = code.length;

// ── Detect CLI version ────────────────────────────────────────────
const pkgPath = CLI_PATH.replace('cli.js', 'package.json');
let cliVersion = 'unknown';
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  cliVersion = pkg.version || 'unknown';
} catch {}
console.log(`[version] Claude Code CLI v${cliVersion}`);

// ── Step 2: AST Analysis ──────────────────────────────────────────
console.log('\n  Parsing cli.js AST...');
const startTime = Date.now();

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: [
    'importMeta', 'dynamicImport', 'classProperties',
    'classPrivateProperties', 'classPrivateMethods',
    'optionalChaining', 'nullishCoalescingOperator',
    'topLevelAwait',
  ],
  errorRecovery: true,
});

console.log(`  Parsed in ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);

// ── Collect surgical insertions ────────────────────────────────────
// Each insertion: { offset: number, text: string, label: string }
// Applied from LAST to FIRST so offsets stay valid.
const insertions = [];

/**
 * Collect case test string values from a SwitchStatement node
 */
function getSwitchCaseValues(switchNode) {
  const values = new Set();
  for (const c of switchNode.cases) {
    if (c.test && t.isStringLiteral(c.test)) {
      values.add(c.test.value);
    }
  }
  return values;
}

/**
 * Find the insertion offset for a switch case.
 * Cases look like: case"tool_use":{let G;...}
 * The consequent[0] is a BlockStatement. We insert after its opening "{".
 */
function getCaseInsertOffset(switchCase) {
  if (switchCase.consequent.length > 0 &&
      t.isBlockStatement(switchCase.consequent[0])) {
    return switchCase.consequent[0].start + 1;
  }
  if (switchCase.consequent.length > 0) {
    return switchCase.consequent[0].start;
  }
  return null;
}

/**
 * Check if insertion point already has "return null" nearby
 */
function isAlreadyPatched(offset) {
  const snippet = code.substring(offset, offset + 15);
  return snippet.includes('return null');
}

// ── Level 1: Message-type switch ───────────────────────────────────
console.log('  -- Level 1: Message-type switch --');

let level1Found = false;
traverse(ast, {
  SwitchStatement(nodePath) {
    if (level1Found) return;
    const values = getSwitchCaseValues(nodePath.node);
    if (values.has('grouped_tool_use') &&
        values.has('collapsed_read_search') &&
        values.has('assistant')) {
      level1Found = true;

      for (const c of nodePath.node.cases) {
        if (!c.test || !t.isStringLiteral(c.test)) continue;
        const val = c.test.value;

        if (val === 'grouped_tool_use' || val === 'collapsed_read_search') {
          const offset = getCaseInsertOffset(c);
          if (offset === null) {
            console.log(`  [WARN] ${val}: could not find insertion point`);
            continue;
          }
          if (isAlreadyPatched(offset)) {
            console.log(`  [SKIP] Message: ${val} -- already patched`);
            continue;
          }
          insertions.push({
            offset,
            text: 'return null;',
            label: `Message: ${val} -> null`,
          });
        }
      }
    }
  },
});
if (!level1Found) console.log('  [WARN] Message-type switch not found');

// ── Level 2: Content-block switch ──────────────────────────────────
console.log('  -- Level 2: Content-block switch --');

let level2Found = false;
traverse(ast, {
  SwitchStatement(nodePath) {
    if (level2Found) return;
    const values = getSwitchCaseValues(nodePath.node);
    if (values.has('tool_use') &&
        values.has('text') &&
        values.has('thinking') &&
        values.has('tool_result')) {
      const funcParent = nodePath.findParent(p =>
        t.isFunctionDeclaration(p.node) ||
        t.isFunctionExpression(p.node) ||
        t.isArrowFunctionExpression(p.node)
      );
      if (!funcParent) return;

      level2Found = true;

      for (const c of nodePath.node.cases) {
        if (!c.test || !t.isStringLiteral(c.test)) continue;
        const val = c.test.value;

        if (val === 'tool_use' || val === 'tool_result') {
          const offset = getCaseInsertOffset(c);
          if (offset === null) {
            console.log(`  [WARN] ${val}: could not find insertion point`);
            continue;
          }
          if (isAlreadyPatched(offset)) {
            console.log(`  [SKIP] Content: ${val} -- already patched`);
            continue;
          }
          insertions.push({
            offset,
            text: 'return null;',
            label: `Content: ${val} -> null`,
          });
        }
      }
    }
  },
});
if (!level2Found) console.log('  [WARN] Content-block switch not found');

// ── Level 2b: Summary rows (if Z.type==="summary") ────────────────
console.log('  -- Level 2b: Summary rows --');

let summaryFound = false;
traverse(ast, {
  IfStatement(nodePath) {
    if (summaryFound) return;
    const test = nodePath.node.test;
    if (t.isBinaryExpression(test) &&
        test.operator === '===' &&
        t.isStringLiteral(test.right) &&
        test.right.value === 'summary' &&
        t.isMemberExpression(test.left) &&
        t.isIdentifier(test.left.property) &&
        test.left.property.name === 'type') {
      const consequent = nodePath.node.consequent;
      if (t.isBlockStatement(consequent) && consequent.body.length > 0) {
        const bodyStr = code.substring(consequent.start, consequent.end);
        if (bodyStr.includes('searchCount') || bodyStr.includes('readCount')) {
          summaryFound = true;
          const offset = consequent.start + 1;
          if (isAlreadyPatched(offset)) {
            console.log('  [SKIP] Summary rows -- already patched');
          } else {
            insertions.push({
              offset,
              text: 'return null;',
              label: 'Summary rows -> null',
            });
          }
        }
      }
    }
  },
});
if (!summaryFound) console.log('  [WARN] Summary rows not found via AST');

// ── Apply AST insertions (reverse order to preserve offsets) ──────
insertions.sort((a, b) => b.offset - a.offset);

let astPatches = 0;
for (const ins of insertions) {
  code = code.substring(0, ins.offset) + ins.text + code.substring(ins.offset);
  astPatches++;
  console.log(`  [OK]   ${ins.label}`);
}

// ── Step 3: String Patches ────────────────────────────────────────
let strPatches = 0;

function stringPatch(label, search, replacement) {
  const searchIdx = code.indexOf(search);
  if (searchIdx === -1) {
    if (code.includes(replacement)) {
      console.log(`  [SKIP] ${label}`);
    } else {
      console.log(`  [WARN] ${label} -- pattern not found`);
    }
    return;
  }
  code = code.split(search).join(replacement);
  strPatches++;
  console.log(`  [OK]   ${label}`);
}

// ═════════════════════════════════════════════════════════════════
// LEVEL 3: LEAF COMPONENT NULL-OUTS (belt-and-suspenders)
// ═════════════════════════════════════════════════════════════════
console.log('\n  -- Level 3: Leaf components --');

// aK (was i3): tool error renderer
// Returns: createElement(q1, null, Box(errorText, moreLines))
stringPatch(
  'aK: tool error renderer -> null',
  'function aK(A){let q=z6(16),{result:K,verbose:_}=A',
  'function aK(A){return null;let q=z6(16),{result:K,verbose:_}=A'
);

// q1 (was M8): bracket wrapper (renders the "  ⎿  " gutter prefix)
stringPatch(
  'q1: bracket wrapper -> null',
  'function q1(A){let q=z6(8),{children:K,height:_}=A',
  'function q1(A){return null;let q=z6(8),{children:K,height:_}=A'
);

// RAq: REMOVED in v2.1.81+ (error bracket merged/eliminated)
// No replacement needed — error rendering caught by bg (CF) patch below

// Uk4 (was ZC4): tool_use content block renderer (● bullet + tool label)
stringPatch(
  'Uk4: tool_use renderer -> null',
  'function Uk4(A){let q=z6(70),{param:K',
  'function Uk4(A){return null;let q=z6(70),{param:K'
);

// xk4 (was HC4): tool_result content block renderer
stringPatch(
  'xk4: tool_result renderer -> null',
  'function xk4(A){let q=z6(28),{param:K,message:_,lookups:Y',
  'function xk4(A){return null;let q=z6(28),{param:K,message:_,lookups:Y'
);

// ps4 (was lAq): attachment renderer (file read summaries, directory listings)
stringPatch(
  'ps4: attachment renderer -> null',
  'function ps4({attachment:A,addMargin:q,verbose:K,isTranscriptMode:_}){',
  'function ps4({attachment:A,addMargin:q,verbose:K,isTranscriptMode:_}){return null;'
);

// VM (was MD): dimColor tool summary wrapper
stringPatch(
  'VM: tool summary wrapper -> null',
  'function VM(A){let q=z6(7),{dimColor:K,children:_,color:Y}=A',
  'function VM(A){return null;let q=z6(7),{dimColor:K,children:_,color:Y}=A'
);

// _t4 (was O7q): collapsed read/search summary
stringPatch(
  '_t4: collapsed read/search -> null',
  'function _t4({message:A,inProgressToolUseIDs:q,shouldAnimate:K,verbose:_,tools:Y,lookups:z,isActiveGroup:w}){',
  'function _t4({message:A,inProgressToolUseIDs:q,shouldAnimate:K,verbose:_,tools:Y,lookups:z,isActiveGroup:w}){return null;'
);

// ss4 (was K7q): grouped tool use renderer
stringPatch(
  'ss4: grouped tool use -> null',
  'function ss4({message:A,tools:q,lookups:K,inProgressToolUseIDs:_,shouldAnimate:Y}){',
  'function ss4({message:A,tools:q,lookups:K,inProgressToolUseIDs:_,shouldAnimate:Y}){return null;'
);

// DAq: REMOVED — shouldShowDot is now inline in Uk4 (which we null entirely)

// bg (was CF): text content renderer with error support
// Wraps in q1, so already caught. But null it directly for safety.
stringPatch(
  'bg: text content renderer -> null for errors',
  'function bg(A){let q=z6(11),{content:K,verbose:_,isError:Y,isWarning:z,linkifyUrls:w}=A',
  'function bg(A){if(A.isError||A.isWarning)return null;let q=z6(11),{content:K,verbose:_,isError:Y,isWarning:z,linkifyUrls:w}=A'
);

// ═════════════════════════════════════════════════════════════════
// CONSTRAINT 2: CYAN BORDERS & MARONEY RED + USER MESSAGE STYLING
// ═════════════════════════════════════════════════════════════════
console.log('\n  -- Cyan Borders & Maroney Red --');

// Vw: cyan border on assistant message wrapper (SAME pattern as v2.1.71)
stringPatch(
  'Vw: cyan border on assistant wrapper',
  'borderStyle:"round",borderColor:j,borderLeft:!1,borderRight:!1,borderBottom:!1,marginTop:1',
  'borderStyle:"round",borderColor:"#00E5FF",borderLeft:!1,borderRight:!1,borderBottom:!1,marginTop:1'
);

// User messages: Maroney Red background
// v2.1.81+ uses theme var "userMessageBackground" instead of hardcoded color
stringPatch(
  'User msg: Maroney Red background',
  'backgroundColor:"userMessageBackground",paddingRight:1',
  'backgroundColor:"#5c0000",paddingRight:1'
);

// Prompt border: Maroney Red background
// n9() changed to tF() in v2.1.81+
stringPatch(
  'Prompt: Maroney Red background',
  'borderColor:tF(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,width:"100%",borderText:',
  'borderColor:tF(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,backgroundColor:"#5c0000",width:"100%",borderText:'
);

// ═════════════════════════════════════════════════════════════════
// CONSTRAINT 3: DASHBOARD UNCAP
// ═════════════════════════════════════════════════════════════════
console.log('\n  -- Dashboard Uncap --');

// StatusLine: add flexShrink:0 on outer Box
stringPatch(
  'StatusLine: flexShrink:0 on outer Box',
  'paddingX:k,gap:2}',
  'paddingX:k,gap:2,flexShrink:0}'
);

// StatusLine: remove dimColor on status text
stringPatch(
  'StatusLine: remove dimColor',
  'dimColor:!0,wrap:"truncate"},c26.createElement(MK,null,w)',
  'wrap:"truncate"},c26.createElement(MK,null,w)'
);

// R59: truncate flexShrink -> 0
stringPatch(
  'R59: truncate flexShrink -> 0',
  'truncate:{flexGrow:0,flexShrink:1,flexDirection:"row",textWrap:"truncate"}',
  'truncate:{flexGrow:0,flexShrink:0,flexDirection:"row",textWrap:"truncate"}'
);

// Footer: flexShrink:0 on bottom border
stringPatch(
  'Footer: flexShrink:0 on bottom border',
  'borderColor:tF(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,width:"100%"',
  'borderColor:tF(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,flexShrink:0,width:"100%"'
);

// Footer: flexShrink -> 0 on input area
stringPatch(
  'Footer: input flexShrink -> 0',
  'flexGrow:1,flexShrink:1,onClick:V9',
  'flexGrow:1,flexShrink:0,onClick:V9'
);

// ── Inject version marker into cli.js ─────────────────────────────
code += `\n;//${PATCH_LABEL}|ast:${astPatches}|str:${strPatches}\n`;

// ── Write result ──────────────────────────────────────────────────
const totalPatches = astPatches + strPatches;
if (totalPatches === 0) {
  console.error('\n  [FAIL] No patches applied.');
  process.exit(1);
}

fs.writeFileSync(CLI_PATH, code, 'utf8');

// ── Write sidecar version file ────────────────────────────────────
const versionFile = CLI_PATH.replace('cli.js', 'cli.js.patch-version');
fs.writeFileSync(versionFile, [
  PATCH_LABEL,
  `Target: cli.js v${cliVersion}`,
  `AST patches: ${astPatches}`,
  `String patches: ${strPatches}`,
  `Total: ${totalPatches}`,
  `Delta: ${code.length - originalSize} bytes`,
  `Applied: ${new Date().toISOString()}`,
  '',
].join('\n'), 'utf8');

const delta = code.length - originalSize;
console.log(`
  ================================================
  ${PATCH_LABEL}
  ${astPatches} AST patches + ${strPatches} string patches = ${totalPatches} total
  ${originalSize} -> ${code.length} bytes (${delta >= 0 ? '+' : ''}${delta})
  CLI: v${cliVersion}

  Version check:
    grep PATCH_VERSION cli.js
    cat cli.js.patch-version

  Restart Claude Code to activate.
  Revert: copy cli.js.bak -> cli.js
  ================================================
`);
