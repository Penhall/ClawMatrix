# Claude Code Integration

## Manual Install

1. Run `pnpm install`
2. Run `pnpm build`
3. Copy `integrations/claude-code/skill/SKILL.md` into `.claude/skills/clawmatrix/SKILL.md`
4. Replace `{{CLAW_BACKEND_COMMAND}}` with `node "<absolute-path-to-repo>/packages/cli/dist/index.js"`

## Automated Install

```bash
node scripts/setup-claude-code.mjs
```

This installs the rendered skill into `.claude/skills/clawmatrix/SKILL.md`.

## Troubleshooting

- If setup fails with a missing backend message, run `pnpm install` and `pnpm build`.
- If the skill exists but commands fail, verify that `packages/cli/dist/index.js` exists.
- If you need structured output for downstream processing, add `--json` to the subcommand.
