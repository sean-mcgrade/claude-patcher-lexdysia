// === SIGWINCH TERMINAL RESIZE PATCH ===
//
// PURPOSE:
// Prevents the "multiple Claudes" duplication bug on Windows Terminal.
// When the terminal window is resized, three systems fight each other:
//   1. ConPTY re-emits its entire buffer (Windows architecture flaw)
//   2. Ink (Claude Code's React-based TUI) triggers a full re-render
//   3. Windows Terminal does its own text reflow
// This patch kills #2 by intercepting all resize/SIGWINCH listeners.
//
// HOW TO APPLY:
// Insert this block at the TOP of cli.js (after the shebang line),
// BEFORE the Anthropic copyright comment.
//
// TRADE-OFF:
// After resize, layout stays at old width until new content arrives.
// This is preferable to the entire UI duplicating itself.
//
// APPLIES TO: Claude Code cli.js (tested on v2.1.50, Patch 72-STEALTH)
// RELATED: https://github.com/anthropics/claude-code/issues/6481
//          https://github.com/microsoft/terminal/issues/15976
//
// LAST VERIFIED: 2026-03-09
// =============================================

// --- INK RESIZE GLITCH FIX ---
// Block stdout resize events (prevents Ink's handleResize from firing)
['on', 'addListener'].forEach(method => {
    if(!process.stdout[method]) return;
    const orig = process.stdout[method];
    process.stdout[method] = function(event, listener) {
        if (event === 'resize') return this;
        return orig.call(this, event, listener);
    };
});

// Block SIGWINCH signal handler registration
const origProcessOn = process.on;
process.on = function(event, listener) {
    if (event === 'SIGWINCH') return this;
    return origProcessOn.call(this, event, listener);
};
// -----------------------------
