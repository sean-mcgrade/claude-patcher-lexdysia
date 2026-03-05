# Claude TweakCC Configuration — SeanWhite

This repository holds the TweakCC TrueColor configuration for Claude Code on the SeanWhite machine.

## What's Here

- **config.json** — TweakCC v4.0.3 configuration file containing:
  - 8 custom themes (Dark, Light, Dark ANSI, Light ANSI, Dark Daltonized, Light Daltonized, Monochrome, ClearView)
  - Custom thinking verbs and animation styles
  - User message display formatting
  - Input pattern highlighters (file paths, env vars, URLs, IPs, git branches)
  - Toolset definitions (Code, Research, Review)
  - Claude Code v2.1.50 (Patch 72-STEALTH) compatibility
  - Opus 4.6 Beta model routing support

## History

This repo previously contained `claude-patcher-lexdysia` — a set of 60+ Node.js scripts that manually patched Claude Code binaries and CLI files to inject dyslexia-friendly colors and fix rendering glitches. That approach went through 73 patch iterations before being fully replaced by TweakCC, which accomplishes the same goals cleanly through a single JSON configuration.

The legacy patcher was purged on 2026-03-05.

## Phase 1 — UI Overhaul

- TweakCC integrated and configured
- Windows Terminal TrueColor rendering fixed
- Beta Opus 4.6 model routing configured
- ClearView theme set as default (high-contrast, dyslexia-optimized)
