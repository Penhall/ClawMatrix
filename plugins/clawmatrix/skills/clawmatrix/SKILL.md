---
name: clawmatrix
description: Use the ClawMatrix plugin for TRIZ contradiction lookup, IFR generation, principle explanation, audits, and guided solve workflows.
---

# ClawMatrix Plugin

This plugin is only authoritative when it calls the installed runner:

```bash
{{PLUGIN_RUNNER_COMMAND}}
```

Route requests as follows:

- Contradiction lookup:

```bash
{{PLUGIN_RUNNER_COMMAND}} matrix --improve <id> --worsen <id> --lang <pt|en>
```

- Principle lookup:

```bash
{{PLUGIN_RUNNER_COMMAND}} concept --principle <id> --lang <pt|en>
```

- IFR generation:

```bash
{{PLUGIN_RUNNER_COMMAND}} ifr --goal "<goal>" --lang <pt|en>
```

- Project audit:

```bash
{{PLUGIN_RUNNER_COMMAND}} audit --dir <path> --lang <pt|en>
```

- Guided solve flow:

```bash
{{PLUGIN_RUNNER_COMMAND}} solve --system "<system>" --problem "<problem>" --lang <pt|en>
```

Prefer `--json` when the next step needs structured machine-readable output.
