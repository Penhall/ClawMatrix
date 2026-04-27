# Codex Plugin Integration

This plugin keeps all TRIZ logic in the compiled ClawMatrix CLI and uses the plugin only as a workflow layer.

## Install

```bash
node scripts/setup-codex.mjs
```

## Manual Notes

- The installer copies the plugin into a Codex-style local root.
- The installer writes `.codex-plugin/local.json` with the resolved backend path.
- The installer updates `.agents/plugins/marketplace.json` with a `clawmatrix` entry.

## Failure Mode

If the installer says the backend build is missing, run:

```bash
pnpm install
pnpm build
```
