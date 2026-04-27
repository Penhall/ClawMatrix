# Agent Integrations

ClawMatrix ships two agent-facing integration layers:

- Claude Code skill: project-local skill rendered into `.claude/skills/clawmatrix/`
- Codex plugin: local plugin rendered into a Codex-style plugin root with marketplace metadata

## Prerequisites

```bash
pnpm install
pnpm build
```

Both installers fail intentionally when `packages/cli/dist/index.js` is missing.

## Manual Install

### Claude Code

1. Copy `integrations/claude-code/skill/SKILL.md` into `.claude/skills/clawmatrix/SKILL.md`
2. Replace `{{CLAW_BACKEND_COMMAND}}` with `node "<repo-root>/packages/cli/dist/index.js"`

### Codex

1. Copy `plugins/clawmatrix/` into your local plugin root as `plugins/clawmatrix/`
2. Create `.codex-plugin/local.json` with `repoRoot` and `backendPath`
3. Add a `clawmatrix` entry to `.agents/plugins/marketplace.json`

## Automated Install

```bash
pnpm setup:claude-code
pnpm setup:codex
pnpm setup:integrations
```

## Command Map

- `matrix`: contradiction lookup between improving and worsening parameters
- `concept`: explanation of one TRIZ principle by id
- `ifr`: ideal final result framing for one goal
- `audit`: stack-aware contradiction hints for a local project
- `solve`: five-step workflow for a named system and problem
