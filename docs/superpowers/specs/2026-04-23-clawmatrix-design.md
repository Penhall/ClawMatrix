# ClawMatrix — Design Spec
**Data:** 2026-04-23  
**Status:** Aprovado

---

## 1. Objetivo

Construir o **ClawMatrix**, uma ferramenta CLI que implementa a metodologia TRIZ (Theory of Inventive Problem Solving) de Genrich Altshuller. O ClawMatrix permite resolver contradições de engenharia, gerar declarações de Resultado Final Ideal (IFR) e auditar repositórios em busca de contradições latentes, usando a Matriz de Altshuller (39 parâmetros × 39 parâmetros = 1521 células) e os 40 Princípios Inventivos.

**Fonte de dados de referência:** `Antropocosmist/useful-skills` → `triz-engineering-solver.md`

---

## 2. Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Modo de integração | CLI puro (`claw`) | Sem servidor MCP — uso direto no terminal |
| Estrutura | CLI + Engine separados (pnpm workspaces) | Engine reutilizável e testável sem I/O |
| Completude da matriz | 1521 células (todas), vazias como `[]` | Fidelidade à matriz original de Altshuller |
| Idioma dos outputs | Bilíngue: nome/ID em EN, descrições em PT | Terminologia TRIZ reconhecível + usabilidade |
| Test runner | Vitest | Rápido, native ESM, sem configuração extra |

---

## 3. Arquitetura

```
Terminal
  └─► @claw/cli  (Commander.js — formatação, cores, I/O)
        └─► @claw/engine  (lógica pura — sem I/O)
              └─► data/matrix.json + data/principles/
```

### Princípio de design aplicado
**Princípio TRIZ #1 — Segmentação:** cada módulo tem uma única responsabilidade e interface bem definida. O engine não conhece o CLI; o CLI não conhece os dados brutos.

---

## 4. Estrutura de Pastas

```
ClawMatrix/
├── packages/
│   ├── engine/                  ← @claw/engine
│   │   ├── src/
│   │   │   ├── data/
│   │   │   │   ├── matrix.json          (39×39, 1521 células)
│   │   │   │   └── principles/
│   │   │   │       ├── index.ts         (40 princípios: EN name + PT desc)
│   │   │   │       └── [01–40].ts
│   │   │   ├── types.ts
│   │   │   ├── solver.ts                (lookupMatrix, solveContradiction)
│   │   │   ├── ifr.ts                   (generateIFR)
│   │   │   ├── audit.ts                 (analyzeProject)
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── matrix.test.ts
│   │       └── audit.test.ts
│   │
│   └── cli/                     ← @claw/cli
│       └── src/
│           ├── commands/
│           │   ├── solve.ts
│           │   ├── matrix.ts
│           │   ├── ifr.ts
│           │   ├── audit.ts
│           │   └── concept.ts
│           └── index.ts         (entry-point: bin "claw")
│
├── package.json                 (pnpm workspaces root)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 5. Engine API

### Tipos centrais

```typescript
type ParameterId = number; // 1–39

interface Principle {
  id: number;           // 1–40
  name: string;         // EN: "Segmentation"
  description: string;  // PT: "Divida o objeto em partes independentes"
  examples?: string[];  // PT: exemplos aplicados ao stack detectado
}

interface MatrixCell {
  improving: ParameterId;
  worsening: ParameterId;
  principles: number[]; // [] se sem dados
}

interface ContradictionResult {
  improving: { id: number; name: string };
  worsening: { id: number; name: string };
  principles: Principle[];
}

interface IFRResult {
  goal: string;
  statement: string;    // PT
  resources: string[];  // PT
}

interface DetectedStack {
  runtime?: string;   // "Node.js 20"
  framework?: string; // "Next.js 14"
  orm?: string;       // "Prisma"
  language?: string;  // "TypeScript" | "C#" | "Python"
}

interface DetectedContradiction {
  improving: ParameterId;
  worsening: ParameterId;
  source: string; // arquivo que originou a detecção, ex: "schema.prisma"
}

interface SolveReport {
  system: string;
  problem: string;
  ifr: IFRResult;
  contradiction: ContradictionResult;
  steps: string[]; // PT: os 5 passos do workflow TRIZ
}

interface AuditResult {
  stack: DetectedStack;
  contradictions: DetectedContradiction[];
  idleResources: string[];
  suggestions: ContradictionResult[];
}
```

### Funções públicas (todas pure, sem I/O exceto `analyzeProject`)

```typescript
lookupMatrix(improving: number, worsening: number): ContradictionResult
solveContradiction(system: string, problem: string): SolveReport
generateIFR(goal: string): IFRResult
explainPrinciple(id: number, stack?: DetectedStack): Principle
analyzeProject(rootDir: string): Promise<AuditResult>
```

### Formato matrix.json

```json
{
  "parameters": [
    { "id": 1, "name": "Weight of moving object" },
    ...
  ],
  "cells": [
    { "improving": 10, "worsening": 17, "principles": [35, 2, 40, 11] },
    { "improving": 1,  "worsening": 2,  "principles": [] },
    ...
  ]
}
```

**Invariante:** `cells.length === 1521`. Quebrar essa invariante falha o build.

---

## 6. Comandos CLI

```
claw <command> [options]

  solve    --system <desc> --problem <desc>   Workflow TRIZ de 5 passos
  matrix   --improve <id> --worsen <id>       Consulta a matriz 39×39
  ifr      --goal <desc>                      Gera declaração de IFR
  audit    [--dir <path>]                     Analisa repositório local
  concept  --principle <id>                   Explica um princípio

Flags globais (disponíveis em todos os comandos):
  --json        Saída JSON pura (para scripts/agentes — suprime cores e formatação)
  --no-color    Desativa cores ANSI mantendo formatação de texto
  --lang <pt|en> Força idioma das descrições (padrão: pt)
```

### Saída bilíngue
- Nome e ID do princípio: inglês (`#35 Parameter Changes`)
- Descrição, sugestões, recursos ociosos: português
- Flag `--json` sempre disponível para consumo programático pelo Claude Code

### Exemplo de output `claw matrix --improve 10 --worsen 17`

```
Contradição Técnica
  Melhorando : #10 Force
  Piorando   : #17 Temperature

Princípios sugeridos:
  #35 Parameter Changes
      Altere estado físico, concentração, flexibilidade ou temperatura.

  #2  Taking Out / Extraction
      Separe a parte problemática do objeto.

  #40 Composite Materials
      Substitua materiais homogêneos por compósitos.

  #11 Beforehand Cushioning
      Compense a baixa confiabilidade com preparo antecipado.
```

---

## 7. Comando `audit` — Detecção de Stack

O comando `claw audit` analisa o repositório onde for executado (`--dir` ou `cwd`). Detecção automática de stack:

| Arquivo detectado | Stack inferido |
|---|---|
| `package.json` com `"next"` | Next.js |
| `schema.prisma` | Prisma ORM |
| `*.csproj` | .NET / C# |
| `pom.xml` | Java / Maven |
| `requirements.txt` / `pyproject.toml` | Python |

**Contradições detectadas:** baseadas em heurísticas por stack (ex: rotas Next.js sem cache → Velocidade↑ ↔ Confiabilidade↓).  
**Recursos ociosos:** relações Prisma sem índice, rotas de API sem cache, variáveis de ambiente não utilizadas.

---

## 8. Testes

### Pirâmide
1. **Unidade (engine)** — pure functions, sem mock, 20+ casos
2. **Integração** — CLI→engine→data, verifica `--json` output
3. **E2E** — subprocess CLI, verifica stdout formatado

### Testes críticos de integridade

```typescript
it("matriz tem exatamente 1521 células")
it("toda célula tem improving e worsening em 1–39")
it("nenhum par (i,w) duplicado")
it("todos os IDs de princípios referenciados existem nos 40")
it("Force↑ + Temperature↓ → [35, 2, 40, 11]")  // caso do master prompt
```

### Gate de integridade
Os testes da matriz rodam **antes** do build. Matriz inválida = build falha.

### Runner
```
Vitest + c8 coverage
pnpm test          → vitest run
pnpm test:watch    → vitest watch
pnpm test:coverage → vitest run --coverage
```

---

## 9. Toolchain & Setup

```
Node.js  ≥ 20
pnpm     ≥ 9
TypeScript 5.x
Vitest   ^2.x
Commander.js ^12.x
chalk    ^5.x   (cores no terminal)
```

**Instalação global:**
```bash
npm install -g @claw/cli
claw --help
```

---

## 10. Fora do escopo (v1)

- Servidor MCP
- Interface web ou GUI
- Integração com LLM (outputs são determinísticos)
- Su-Field Analysis automatizada (Seção 4 do TRIZ)
- Internationalization além de PT/EN
