---
name: clawmatrix
description: Use ClawMatrix for TRIZ contradiction mapping, IFR framing, principle lookup, stack audits, and guided solve workflows.
---

# ClawMatrix

Use this skill when the user asks for:
- TRIZ principles for a contradiction between two engineering parameters
- a principle explanation by id
- an IFR statement
- a codebase or stack audit for hidden contradictions
- a five-step TRIZ workflow for a concrete system/problem pair

Route contradiction lookups through `claw matrix` behavior exposed by the compiled backend command below.

## Runtime Contract

All authoritative answers must come from the compiled ClawMatrix CLI:

```bash
{{CLAW_BACKEND_COMMAND}}
```

If the backend command fails because the build is missing, stop and instruct the user to run:

```bash
pnpm install
pnpm build
```

## Command Routing

Contradiction lookup:

```bash
{{CLAW_BACKEND_COMMAND}} matrix --improve <id> --worsen <id> --lang <pt|en>
```

Principle lookup:

```bash
{{CLAW_BACKEND_COMMAND}} concept --principle <id> --lang <pt|en>
```

IFR generation:

```bash
{{CLAW_BACKEND_COMMAND}} ifr --goal "<goal>" --lang <pt|en>
```

Project audit:

```bash
{{CLAW_BACKEND_COMMAND}} audit --dir <path> --lang <pt|en>
```

Guided solve flow:

```bash
{{CLAW_BACKEND_COMMAND}} solve --system "<system>" --problem "<problem>" --lang <pt|en>
```

## Output Rules

- Prefer formatted text for direct human answers.
- Prefer `--json` when the response will be transformed, summarized, or cross-referenced programmatically.
- Preserve `--lang en` when the user asked for English output.
- Add `--no-color` when the command output will be embedded verbatim into another tool response.
