# ClawMatrix

[English](./README.md) | [Português (Brasil)](./README.pt-BR.md)

ClawMatrix é uma CLI em TypeScript para aplicar TRIZ (Theory of Inventive Problem Solving) em fluxos de engenharia e software.

Ela combina:
- a matriz de contradições de Altshuller com 39 x 39 parâmetros
- os 40 princípios inventivos
- geração de IFR (Ideal Final Result / Resultado Final Ideal)
- auditoria de repositórios para identificar contradições latentes e recursos ociosos

O projeto é organizado como um monorepo com pnpm:
- `@claw/engine`: lógica pura e dados
- `@claw/cli`: interface de terminal construída com Commander.js

## O Que O Projeto Faz

O ClawMatrix ajuda em cinco cenários comuns:

1. Explorar uma contradição técnica usando a matriz.
   Exemplo: melhorar velocidade sem degradar confiabilidade.

2. Explicar um princípio TRIZ.
   Útil quando você já conhece o ID do princípio e quer uma explicação curta.

3. Gerar uma declaração de IFR.
   Útil em ideação, revisão de arquitetura e workshops de solução.

4. Auditar um repositório.
   Detecta sinais de stack e aponta contradições prováveis, como rotas Next.js sem cache, índices Prisma ausentes e variáveis de ambiente não usadas.

5. Executar um workflow TRIZ guiado de 5 passos.
   Útil para transformar um problema vago em uma contradição estruturada com princípios sugeridos.

## Comandos Principais

```text
claw <command> [options]

Comandos
  matrix   --improve <id> --worsen <id>
  concept  --principle <id>
  ifr      --goal <desc>
  audit    [--dir <path>]
  solve    --system <desc> --problem <desc>

Flags globais
  --json
  --no-color
  --lang <pt|en>
```

## Casos De Uso

### 1. Consultar a matriz de contradições

```bash
node packages/cli/dist/index.js matrix --improve 10 --worsen 17
```

Essa consulta representa:
- melhorando `#10 Force`
- piorando `#17 Temperature`

### 2. Explicar um princípio

```bash
node packages/cli/dist/index.js concept --principle 1
node packages/cli/dist/index.js --lang en concept --principle 28
```

### 3. Gerar um IFR

```bash
node packages/cli/dist/index.js ifr --goal "autenticar usuarios sem armazenar senha"
node packages/cli/dist/index.js --lang en ifr --goal "authenticate without passwords"
```

### 4. Auditar um projeto

```bash
node packages/cli/dist/index.js audit --dir .
node packages/cli/dist/index.js --lang en audit --dir packages/engine/tests/fixtures/nextjs-prisma
```

Heurísticas atuais:
- detecção de Next.js via `package.json`
- detecção de Prisma via `schema.prisma`
- detecção de `.csproj`, `pom.xml`, `requirements.txt` e `pyproject.toml`
- rotas de API sem cache explícito
- relações Prisma sem `@@index` explícito
- variáveis não utilizadas em `.env`

### 5. Executar o workflow TRIZ completo

```bash
node packages/cli/dist/index.js solve --system "API Gateway" --problem "latencia alta e confiabilidade baixa"
node packages/cli/dist/index.js --lang en solve --system "API Gateway" --problem "high latency and low reliability"
```

## Instalação

### Pré-requisitos

- Node.js 20+
- pnpm 9+

### Instalar dependências

```bash
pnpm install
```

### Build do monorepo

```bash
pnpm build
```

### Rodar a CLI compilada

```bash
node packages/cli/dist/index.js --help
```

## Fluxo De Desenvolvimento

### Typecheck

```bash
pnpm typecheck
```

### Testes

```bash
pnpm test
```

### Build

```bash
pnpm build
```

### Rodar direto do source

Isso é útil durante o desenvolvimento:

```bash
pnpm exec tsx packages/cli/src/index.ts --help
pnpm exec tsx packages/cli/src/index.ts matrix --improve 10 --worsen 17
```

## API Do Engine

O engine é exportado por `packages/engine/src/index.ts`.

Principais exports:
- `lookupMatrix(improving, worsening, lang?)`
- `explainPrinciple(id, stack?, lang?)`
- `generateIFR(goal, lang?)`
- `solveContradiction(system, problem, lang?)`
- `analyzeProject(rootDir, lang?)`

Exemplo:

```ts
import { lookupMatrix, generateIFR } from '@claw/engine';

const contradiction = lookupMatrix(10, 17, 'en');
const ifr = generateIFR('authenticate without passwords', 'en');

console.log(contradiction.principles.map((p) => p.name));
console.log(ifr.statement);
```

## Estrutura Do Projeto

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

## Notas De Design

- O engine é intencionalmente leve em I/O. Só `analyzeProject` acessa o filesystem.
- A CLI cuida de formatação, cores, seleção de idioma e saída no terminal.
- A saída suporta `pt` e `en`.
- `--json` está disponível para automação e integração com agentes.

## Status De Validação

O projeto atualmente inclui:
- testes unitários do engine
- testes E2E da CLI
- workflow de CI em `.github/workflows/ci.yml`

Comandos locais de verificação:

```bash
pnpm typecheck
pnpm test
pnpm build
```
