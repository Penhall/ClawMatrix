# ClawMatrix

ClawMatrix is a TypeScript CLI for applying TRIZ (Theory of Inventive Problem Solving) in software and engineering workflows.

It combines:
- the Altshuller contradiction matrix with 39 x 39 parameters
- the 40 inventive principles
- IFR (Ideal Final Result) generation
- repository auditing for latent contradictions and idle resources

The project is organized as a pnpm monorepo:
- `@claw/engine`: pure logic and data
- `@claw/cli`: terminal interface built with Commander.js

## What It Does

ClawMatrix helps in five common scenarios:

1. Explore a technical contradiction with the matrix:
   Example: improve speed without harming reliability.

2. Explain a TRIZ principle:
   Useful when you already know the principle ID and want a concise explanation.

3. Generate an IFR statement:
   Useful during ideation, architecture review, or design workshops.

4. Audit a repository:
   Detects stack signals and flags likely contradictions such as uncached Next.js routes, missing Prisma indexes, and unused environment variables.

5. Run a guided 5-step TRIZ workflow:
   Good for turning a vague engineering problem into a structured contradiction + principle shortlist.

## Main Commands

```text
claw <command> [options]

Commands
  matrix   --improve <id> --worsen <id>
  concept  --principle <id>
  ifr      --goal <desc>
  audit    [--dir <path>]
  solve    --system <desc> --problem <desc>

Global flags
  --json
  --no-color
  --lang <pt|en>
```

## Example Use Cases

### 1. Query the contradiction matrix

```bash
node packages/cli/dist/index.js matrix --improve 10 --worsen 17
```

This queries:
- improving `#10 Force`
- worsening `#17 Temperature`

### 2. Explain a principle

```bash
node packages/cli/dist/index.js concept --principle 1
node packages/cli/dist/index.js --lang en concept --principle 28
```

### 3. Generate an IFR

```bash
node packages/cli/dist/index.js ifr --goal "autenticar usuarios sem armazenar senha"
node packages/cli/dist/index.js --lang en ifr --goal "authenticate without passwords"
```

### 4. Audit a project

```bash
node packages/cli/dist/index.js audit --dir .
node packages/cli/dist/index.js --lang en audit --dir packages/engine/tests/fixtures/nextjs-prisma
```

Current heuristics include:
- Next.js detection from `package.json`
- Prisma detection from `schema.prisma`
- `.csproj`, `pom.xml`, `requirements.txt`, `pyproject.toml`
- uncached API routes
- Prisma relations without explicit `@@index`
- unused variables in `.env`

### 5. Run the full TRIZ workflow

```bash
node packages/cli/dist/index.js solve --system "API Gateway" --problem "latencia alta e confiabilidade baixa"
node packages/cli/dist/index.js --lang en solve --system "API Gateway" --problem "high latency and low reliability"
```

## Installation

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install dependencies

```bash
pnpm install
```

### Build the monorepo

```bash
pnpm build
```

### Run the compiled CLI

```bash
node packages/cli/dist/index.js --help
```

## Development Workflow

### Typecheck

```bash
pnpm typecheck
```

### Test

```bash
pnpm test
```

### Build

```bash
pnpm build
```

### Run directly from source

This is convenient during development:

```bash
pnpm exec tsx packages/cli/src/index.ts --help
pnpm exec tsx packages/cli/src/index.ts matrix --improve 10 --worsen 17
```

## Engine API

The engine is exported from `packages/engine/src/index.ts`.

Main exports:
- `lookupMatrix(improving, worsening, lang?)`
- `explainPrinciple(id, stack?, lang?)`
- `generateIFR(goal, lang?)`
- `solveContradiction(system, problem, lang?)`
- `analyzeProject(rootDir, lang?)`

Example:

```ts
import { lookupMatrix, generateIFR } from '@claw/engine';

const contradiction = lookupMatrix(10, 17, 'en');
const ifr = generateIFR('authenticate without passwords', 'en');

console.log(contradiction.principles.map((p) => p.name));
console.log(ifr.statement);
```

## Project Structure

```text
ClawMatrix/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── packages/
│   ├── engine/
│   │   ├── src/
│   │   │   ├── audit.ts
│   │   │   ├── ifr.ts
│   │   │   ├── solver.ts
│   │   │   ├── types.ts
│   │   │   └── data/
│   │   │       ├── matrix.json
│   │   │       └── principles/
│   │   └── tests/
│   └── cli/
│       ├── src/
│       │   ├── index.ts
│       │   ├── format.ts
│       │   └── commands/
│       └── tests/
└── scripts/
```

## Design Notes

- The engine is intentionally I/O-light. Only `analyzeProject` touches the filesystem.
- The CLI handles formatting, colors, language selection, and terminal output.
- Output supports `pt` and `en`.
- `--json` is available for automation and agent tooling.

## Validation Status

The project currently includes:
- engine unit tests
- CLI E2E tests
- CI workflow in `.github/workflows/ci.yml`

Local verification commands:

```bash
pnpm typecheck
pnpm test
pnpm build
```
