# Integration Troubleshooting

## Missing Build Artifact

Symptom:

- setup scripts fail before writing files
- error mentions `packages/cli/dist/index.js`

Fix:

```bash
pnpm install
pnpm build
```

## Wrong Language Output

Symptom:

- the user explicitly asked for English output
- the integration response is still in Portuguese

Fix:

- preserve `--lang en` in the command
- use `--json` only when the next processing step needs structured output

## Embedded Output Has ANSI Noise

Symptom:

- copied command output contains escape sequences

Fix:

```bash
node "<backend>" --no-color <subcommand> ...
```
