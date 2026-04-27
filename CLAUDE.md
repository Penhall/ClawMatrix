# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project

ClawMatrix — TRIZ CLI tool implementing the Altshuller Contradiction Matrix (39×39).

## Architecture

pnpm monorepo with two packages:
- `@claw/engine` — pure TypeScript logic (no I/O except analyzeProject)
- `@claw/cli` — Commander.js CLI, binary `claw`

## Commands

```
pnpm test          # run all tests (engine + cli E2E + integration checks)
pnpm build         # build both packages
pnpm typecheck     # TypeScript check
pnpm setup:claude-code
pnpm setup:codex
```

## Local Claude Skill

After running `pnpm setup:claude-code`, the project-local skill is installed at `.claude/skills/clawmatrix/SKILL.md`.
Use that skill whenever the task is best served by `claw matrix`, `claw concept`, `claw ifr`, `claw audit`, or `claw solve`.

## Key invariant

`packages/engine/src/data/matrix.json` must have exactly 1521 cells. Matrix integrity tests run before build and fail if violated.

## Test runner

Vitest. Engine tests are pure unit tests. CLI tests are E2E subprocess tests via execSync + tsx. Integration tests use the Node built-in test runner.
