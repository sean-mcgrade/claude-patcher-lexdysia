#!/usr/bin/env node
/**
 * Claude Code CLI v2.1.71 — Surgical AST + String Patch
 * ======================================================
 * PATCH VERSION: 3.1.0
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
 *   Level 2 (AST): Content-block switch (nsY) — null "tool_use",
 *                  "tool_result" cases at the RENDERER level
 *   Level 3 (Str): Leaf functions — null i3, M8, RAq, ZC4, HC4,
 *                  lAq, MD, O7q, K7q, DAq
 *
 * v3.1.0: Maroney Red user messages
 *   - User wrapper Box gets backgroundColor:#5c0000
 *   - f26 default case bypasses fAq (cyan borders) → renders user
 *     text directly with Maroney Red background via PO markdown renderer
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
const parser = require('@babel/parser');
const _traverse = require('@babel/traverse');
const t = require('@babel/types');

const traverse = _traverse.default || _traverse;

// ── Version ────────────────────────────────────────────────────────
const PATCH_VERSION = '3.1.0';
const PATCH_DATE = new Date().toISOString().split('T')[0];
const PATCH_LABEL = `claude-ast-patch v${PATCH_VERSION} (${PATCH_DATE})`;

// ── Config ─────────────────────────────────────────────────────────
const CLI_PATH = path.join(
  process.env.USERPROFILE,
  'AppData', 'Local', 'mcp-bin', 'node_modules',
  '@anthropic-ai', 'claude-code', 'cli.js'
);
const BACKUP_PATH = CLI_PATH + '.bak';

if (!fs.existsSync(CLI_PATH)) {
  console.error('[FAIL] cli.js not found at:\n  ' + CLI_PATH);
  process.exit(1);
}

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
  // The consequent is an array of statements.
  // If first item is a BlockStatement, insert after its "{"
  if (switchCase.consequent.length > 0 &&
      t.isBlockStatement(switchCase.consequent[0])) {
    // Insert after the opening brace
    return switchCase.consequent[0].start + 1;
  }
  // If no block, insert after the case test colon.
  // The case test ends at switchCase.test.end, then there's ":"
  // But in practice, minified code wraps cases in blocks.
  // Fallback: insert right at the start of consequent[0]
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
    // Unique signature: has both "grouped_tool_use" AND "collapsed_read_search"
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

// ── Level 2: Content-block switch (nsY) ────────────────────────────
console.log('  -- Level 2: Content-block switch --');

let level2Found = false;
traverse(ast, {
  SwitchStatement(nodePath) {
    if (level2Found) return;
    const values = getSwitchCaseValues(nodePath.node);
    // Unique signature: has "tool_use" AND "text" AND "thinking" AND "tool_result"
    // This uniquely identifies the content block renderer (nsY)
    if (values.has('tool_use') &&
        values.has('text') &&
        values.has('thinking') &&
        values.has('tool_result')) {
      // Verify it's inside a function (not a data-processing switch)
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
    // Match: X.type === "summary"
    if (t.isBinaryExpression(test) &&
        test.operator === '===' &&
        t.isStringLiteral(test.right) &&
        test.right.value === 'summary' &&
        t.isMemberExpression(test.left) &&
        t.isIdentifier(test.left.property) &&
        test.left.property.name === 'type') {
      // Verify this is in a rendering context (near createElement calls)
      const consequent = nodePath.node.consequent;
      // Check that the consequent is a block with content
      if (t.isBlockStatement(consequent) && consequent.body.length > 0) {
        // Look for "searchCount" or "readCount" identifiers in the body
        // (these are props of the summary object used by iV1)
        const bodyStr = code.substring(consequent.start, consequent.end);
        if (bodyStr.includes('searchCount') || bodyStr.includes('readCount')) {
          summaryFound = true;
          const offset = consequent.start + 1; // after "{"
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
  // Check if already applied: search must be ABSENT and replacement PRESENT.
  // We check for search first — if it's still there, the patch hasn't been applied
  // even if replacement happens to be a substring of the original code.
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

// i3: tool error renderer (called 22x across codebase)
// Returns: createElement(M8, null, Box(errorText, moreLines))
stringPatch(
  'i3: tool error renderer -> null',
  'function i3(A){let q=Y6(16),{result:K,verbose:Y}=A',
  'function i3(A){return null;let q=Y6(16),{result:K,verbose:Y}=A'
);

// M8: bracket wrapper (renders the "  ⎿  " gutter prefix)
stringPatch(
  'M8: bracket wrapper -> null',
  'function M8(A){let q=Y6(8),{children:K,height:Y}=A',
  'function M8(A){return null;let q=Y6(8),{children:K,height:Y}=A'
);

// RAq: error bracket wrapper (isError variant of M8)
stringPatch(
  'RAq: error bracket -> null',
  'function RAq(A){let q=Y6(7),{children:K,isError:Y}=A',
  'function RAq(A){return null;let q=Y6(7),{children:K,isError:Y}=A'
);

// ZC4: tool_use content block renderer (● bullet + tool label)
stringPatch(
  'ZC4: tool_use renderer -> null',
  'function ZC4(A){let q=Y6(57),{param:K',
  'function ZC4(A){return null;let q=Y6(57),{param:K'
);

// HC4: tool_result content block renderer
stringPatch(
  'HC4: tool_result renderer -> null',
  'function HC4(A){let q=Y6(28),{param:K,message:Y,lookups:z',
  'function HC4(A){return null;let q=Y6(28),{param:K,message:Y,lookups:z'
);

// lAq: attachment renderer (file read summaries, directory listings)
stringPatch(
  'lAq: attachment renderer -> null',
  'function lAq({attachment:A,addMargin:q,verbose:K,isTranscriptMode:Y}){if(Z7()',
  'function lAq({attachment:A,addMargin:q,verbose:K,isTranscriptMode:Y}){return null;if(Z7()'
);

// MD: dimColor tool summary wrapper
stringPatch(
  'MD: tool summary wrapper -> null',
  'function MD(A){let q=Y6(4),{dimColor:K,children:Y,color:z}=A',
  'function MD(A){return null;let q=Y6(4),{dimColor:K,children:Y,color:z}=A'
);

// O7q: collapsed read/search summary
stringPatch(
  'O7q: collapsed read/search -> null',
  'function O7q({message:A,inProgressToolUseIDs:q,shouldAnimate:K,verbose:Y,tools:z,lookups:w,isActiveGroup:_}){',
  'function O7q({message:A,inProgressToolUseIDs:q,shouldAnimate:K,verbose:Y,tools:z,lookups:w,isActiveGroup:_}){return null;'
);

// K7q: grouped tool use renderer
stringPatch(
  'K7q: grouped tool use -> null',
  'function K7q({message:A,tools:q,lookups:K,inProgressToolUseIDs:Y,shouldAnimate:z}){',
  'function K7q({message:A,tools:q,lookups:K,inProgressToolUseIDs:Y,shouldAnimate:z}){return null;'
);

// DAq: disable shouldShowDot bullet on text blocks
stringPatch(
  'DAq: shouldShowDot -> false',
  'H=z&&dY.default.createElement(m,{minWidth:2},dY.default.createElement(T,{color:"text"},B9))',
  'H=false&&dY.default.createElement(m,{minWidth:2},dY.default.createElement(T,{color:"text"},B9))'
);

// CF: text content renderer with error support
// Wraps in M8, so already caught. But null it directly for safety.
stringPatch(
  'CF: text content renderer -> null for errors',
  'function CF(A){let q=Y6(10),{content:K,verbose:Y,isError:z,isWarning:w,linkifyUrls:_}=A',
  'function CF(A){if(A.isError||A.isWarning)return null;let q=Y6(10),{content:K,verbose:Y,isError:z,isWarning:w,linkifyUrls:_}=A'
);

// ═════════════════════════════════════════════════════════════════
// CONSTRAINT 2: CYAN BORDERS & MARONEY RED + USER MESSAGE STYLING
// ═════════════════════════════════════════════════════════════════
console.log('\n  -- Cyan Borders & Maroney Red --');

stringPatch(
  'Vw: cyan border on assistant wrapper',
  'borderStyle:"round",borderColor:j,borderLeft:!1,borderRight:!1,borderBottom:!1,marginTop:1',
  'borderStyle:"round",borderColor:"#00E5FF",borderLeft:!1,borderRight:!1,borderBottom:!1,marginTop:1'
);

// fAq may have been previously patched with different styles.
// Handle all known states: clean, partial (Maroney Red applied), and target.
const FAQ_CLEAN    = 'dF8.default.createElement(m,{flexDirection:"column",marginTop:w,paddingRight:1},_)';
const FAQ_PARTIAL  = 'dF8.default.createElement(m,{flexDirection:"column",marginTop:w,backgroundColor:"#5c0000",paddingRight:1,marginBottom:0},_)';
const FAQ_PARTIAL2 = 'dF8.default.createElement(m,{flexDirection:"column",marginTop:w,backgroundColor:"#5c0000",paddingRight:1},_)';
const FAQ_TARGET   = 'dF8.default.createElement(m,{flexDirection:"column",marginTop:w,borderStyle:"round",borderColor:"#00E5FF",paddingX:1,paddingY:0},_)';
if (code.includes(FAQ_TARGET)) {
  console.log('  [SKIP] fAq: cyan borders');
} else if (code.includes(FAQ_PARTIAL)) {
  stringPatch('fAq: assistant text -> cyan borders (from partial)', FAQ_PARTIAL, FAQ_TARGET);
} else if (code.includes(FAQ_PARTIAL2)) {
  stringPatch('fAq: assistant text -> cyan borders (from partial2)', FAQ_PARTIAL2, FAQ_TARGET);
} else {
  stringPatch('fAq: assistant text -> cyan borders', FAQ_CLEAN, FAQ_TARGET);
}

stringPatch(
  'Prompt: Maroney Red background',
  'borderColor:n9(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,width:"100%",borderText:',
  'borderColor:n9(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,backgroundColor:"#5c0000",width:"100%",borderText:'
);

// v3.1.0 — Patch A: User message wrapper gets Maroney Red background
// Targets the case"user" wrapper Box in the message-list switch
stringPatch(
  'User wrapper: Maroney Red background',
  'o5.createElement(m,{flexDirection:"column",width:"100%"},y)',
  'o5.createElement(m,{flexDirection:"column",width:"100%",backgroundColor:"#5c0000",paddingX:1},y)'
);

// v3.1.0 — Patch B: f26 default case bypasses fAq (which has cyan borders)
// Renders user text directly with Maroney Red background + PO markdown renderer
stringPatch(
  'f26: user text -> Maroney Red (bypass fAq)',
  '$=ZO.createElement(fAq,{addMargin:K,param:Y})',
  '$=ZO.createElement(m,{flexDirection:"column",marginTop:K?1:0,backgroundColor:"#5c0000",paddingX:1,paddingBottom:1},ZO.createElement(PO,null,Y.text))'
);

// ═════════════════════════════════════════════════════════════════
// CONSTRAINT 3: DASHBOARD UNCAP
// ═════════════════════════════════════════════════════════════════
console.log('\n  -- Dashboard Uncap --');

stringPatch(
  'StatusLine: remove wrap:"wrap"',
  'wrap:"wrap",flexShrink:0},Q$6.createElement(CK,null,w)',
  'flexShrink:0},Q$6.createElement(CK,null,w)'
);

stringPatch(
  'StatusLine: flexShrink:0 on outer Box',
  'Q$6.createElement(m,{paddingX:V,gap:2},',
  'Q$6.createElement(m,{paddingX:V,gap:2,flexShrink:0},'
);

stringPatch(
  'Footer: flexShrink -> 0',
  'flexShrink:A6},K6,z6',
  'flexShrink:0},K6,z6'
);

stringPatch(
  'StatusLine: remove dimColor',
  'createElement(T,{dimColor:!0,flexShrink:0},Q$6.createElement(CK,null,w)',
  'createElement(T,{flexShrink:0},Q$6.createElement(CK,null,w)'
);

stringPatch(
  'R59: truncate flexShrink -> 0',
  'truncate:{flexGrow:0,flexShrink:1,flexDirection:"row",textWrap:"truncate"}',
  'truncate:{flexGrow:0,flexShrink:0,flexDirection:"row",textWrap:"truncate"}'
);

stringPatch(
  'Footer: flexShrink:0 on bottom border',
  'borderColor:n9(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0',
  'borderColor:n9(),borderStyle:"round",borderLeft:!1,borderRight:!1,borderBottom:!0,flexShrink:0'
);

// ── Inject version marker into cli.js ─────────────────────────────
// Appended as a trailing comment so it doesn't affect execution.
// Readable with: grep "PATCH_VERSION" cli.js
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
  `Target: cli.js v2.1.71`,
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

  Version check:
    grep PATCH_VERSION cli.js
    cat cli.js.patch-version

  Restart Claude Code to activate.
  Revert: copy cli.js.bak -> cli.js
  ================================================
`);
