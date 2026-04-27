# ClawMatrix Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retomar o ClawMatrix a partir do ponto real do projeto: código quase completo na worktree `feature/clawmatrix-impl`, faltando fechar o gap funcional de `--lang`, revalidar fora do sandbox e integrar em `master`.

**Architecture:** O `master` continua como branch documental. A implementação vive na worktree `E:\PROJETOS\ClawMatrix\.worktrees\feature\clawmatrix-impl` e já contém monorepo, engine, CLI, testes e CI. A retomada deve partir dessa worktree, completar os gaps restantes e só então integrar no tronco principal.

**Tech Stack:** Git worktrees · pnpm · TypeScript 5.x · Vitest 2.x · Commander.js 12 · chalk 5 · GitHub Actions

---

## Current Snapshot

- `master` (`cff869b`) contém só documentação e setup mínimo; não há `package.json` nem `packages/` no root atual.
- `feature/clawmatrix-impl` (`54d4002`) contém a implementação completa de `@claw/engine` e `@claw/cli`.
- A worktree de feature está limpa: sem mudanças locais pendentes.
- Validações já confirmadas nesta revisão:
  - `packages/engine` e `packages/cli` passam em `tsc --noEmit`.
  - `node packages/cli/dist/index.js matrix --improve 10 --worsen 17` funciona.
  - `node packages/cli/dist/index.js concept --principle 1` funciona.
  - `node packages/cli/dist/index.js ifr --goal "..."` funciona.
  - `node packages/cli/dist/index.js audit --dir packages/engine/tests/fixtures/nextjs-prisma` funciona.
- Limitação desta sessão: `pnpm`, `vitest` e `tsx` falharam no sandbox com `spawn EPERM`, então a suíte completa ainda precisa ser rerodada em shell normal.
- Gap funcional confirmado contra a spec:
  - `--lang <pt|en>` existe em [packages/cli/src/index.ts](E:/PROJETOS/ClawMatrix/.worktrees/feature/clawmatrix-impl/packages/cli/src/index.ts:17), mas não é aplicado em [packages/cli/src/format.ts](E:/PROJETOS/ClawMatrix/.worktrees/feature/clawmatrix-impl/packages/cli/src/format.ts:1) nem no engine. `--lang en` hoje continua emitindo descrições em PT.
- Gap de cobertura:
  - [packages/cli/tests/e2e.test.ts](E:/PROJETOS/ClawMatrix/.worktrees/feature/clawmatrix-impl/packages/cli/tests/e2e.test.ts:1) cobre `help`, `matrix`, `concept` e `ifr`, mas não cobre `audit`, `solve` nem `--lang en`.

---

## File Map For Resume

```
E:\PROJETOS\ClawMatrix\.worktrees\feature\clawmatrix-impl\
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .github/workflows/ci.yml
├── packages/
│   ├── engine/
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── solver.ts
│   │   │   ├── ifr.ts
│   │   │   ├── audit.ts
│   │   │   ├── index.ts
│   │   │   └── data/principles/index.ts
│   │   └── tests/
│   │       ├── matrix.test.ts
│   │       ├── solver.test.ts
│   │       ├── ifr.test.ts
│   │       └── audit.test.ts
│   └── cli/
│       ├── src/
│       │   ├── index.ts
│       │   ├── format.ts
│       │   └── commands/
│       │       ├── matrix.ts
│       │       ├── concept.ts
│       │       ├── ifr.ts
│       │       ├── audit.ts
│       │       └── solve.ts
│       └── tests/e2e.test.ts
└── CLAUDE.md
```

---

## Task 1: Reabrir A Worktree Certa E Validar O Baseline

**Files:**
- Review: `E:\PROJETOS\ClawMatrix\.worktrees\feature\clawmatrix-impl\`

- [ ] **Step 1: Entrar na worktree de implementação**

```powershell
Set-Location E:\PROJETOS\ClawMatrix\.worktrees\feature\clawmatrix-impl
```

- [ ] **Step 2: Confirmar branch, limpeza e divergência de `master`**

```powershell
git status --short
git log --oneline --decorate -n 5
git log --oneline master..HEAD
```

Expected:
- `git status --short` sem saída
- HEAD em `feature/clawmatrix-impl`
- histórico contendo commits de engine, CLI, E2E e CI

- [ ] **Step 3: Confirmar que a implementação presente é a base da retomada**

```powershell
Get-ChildItem package.json, pnpm-workspace.yaml, packages, .github\workflows\ci.yml
```

Expected:
- monorepo presente
- `packages\engine` e `packages\cli` presentes
- workflow de CI presente

---

## Task 2: Fechar O Gap De `--lang`

**Files:**
- Modify: `packages/engine/src/types.ts`
- Modify: `packages/engine/src/data/principles/index.ts`
- Modify: `packages/engine/src/solver.ts`
- Modify: `packages/engine/src/ifr.ts`
- Modify: `packages/engine/src/audit.ts`
- Modify: `packages/cli/src/format.ts`
- Modify: `packages/cli/src/commands/concept.ts`
- Modify: `packages/cli/src/commands/matrix.ts`
- Modify: `packages/cli/src/commands/ifr.ts`
- Modify: `packages/cli/src/commands/audit.ts`
- Modify: `packages/cli/src/commands/solve.ts`

- [ ] **Step 1: Escrever testes que falham para `--lang en`**

Add to `packages/cli/tests/e2e.test.ts`:

```ts
it('concept --lang en renders English description text', () => {
  const { exitCode, stdout } = run('--lang en concept --principle 1');
  expect(exitCode).toBe(0);
  expect(stdout).toContain('Divide an object into independent parts');
});

it('ifr --lang en renders English labels and statement', () => {
  const { exitCode, stdout } = run('--lang en ifr --goal "test goal"');
  expect(exitCode).toBe(0);
  expect(stdout).toContain('Ideal Final Result (IFR)');
  expect(stdout).toContain('The system achieves');
});
```

- [ ] **Step 2: Fazer o engine carregar descrições bilíngues**

Use shape like this in `packages/engine/src/types.ts`:

```ts
export interface BilingualText {
  pt: string;
  en: string;
}

export interface Principle {
  id: number;
  name: string;
  description: BilingualText;
  examples?: BilingualText[];
}
```

- [ ] **Step 3: Migrar `principles/index.ts` para armazenar `description.pt` e `description.en`**

Example:

```ts
{
  id: 1,
  name: 'Segmentation',
  description: {
    pt: 'Divida o objeto em partes independentes; torne o objeto seccionável; aumente o grau de fragmentação.',
    en: 'Divide an object into independent parts; make it sectional; increase the degree of fragmentation.',
  },
}
```

- [ ] **Step 4: Tornar IFR e mensagens derivadas dependentes do idioma**

In `packages/engine/src/ifr.ts`, return bilingual text instead of PT-only strings:

```ts
return {
  goal,
  statement: {
    pt: `O sistema alcança "${goal}" usando apenas os recursos já existentes, sem custo, complexidade ou danos adicionais — o problema se resolve por si mesmo.`,
    en: `The system achieves "${goal}" using only existing resources, with no extra cost, complexity, or harm — the problem resolves itself.`,
  },
  resources: [
    {
      pt: 'Recursos internos: subprodutos, energia residual, propriedades inexploradas dos componentes atuais',
      en: 'Internal resources: by-products, residual energy, unexplored properties of current components',
    },
  ],
};
```

- [ ] **Step 5: Fazer `format.ts` renderizar `pt` ou `en` com base em `opts.lang`**

Introduce a helper:

```ts
function t(text: string | { pt: string; en: string }, lang: 'pt' | 'en'): string {
  return typeof text === 'string' ? text : text[lang];
}
```

Then update all renderers to use `t(...)` for:
- headers
- labels
- principle descriptions
- IFR statement/resources
- audit messages
- solve step text

- [ ] **Step 6: Passar `lang` até os outputs que hoje montam texto em PT**

Adjust command handlers to keep using:

```ts
const globalOpts = cmd.parent!.opts() as OutputOpts;
```

But ensure downstream renderers use `globalOpts.lang` everywhere.

- [ ] **Step 7: Rodar os testes focados**

```powershell
pnpm.cmd --filter @claw/cli test -- --runInBand
```

Expected:
- os testes novos falham antes da implementação
- passam depois da implementação

- [ ] **Step 8: Commit**

```powershell
git add packages/engine/src/types.ts packages/engine/src/data/principles/index.ts packages/engine/src/solver.ts packages/engine/src/ifr.ts packages/engine/src/audit.ts packages/cli/src/format.ts packages/cli/src/commands packages/cli/tests/e2e.test.ts
git commit -m "feat(cli): implement language-aware output for pt and en"
```

---

## Task 3: Fechar As Lacunas De Cobertura E Validação

**Files:**
- Modify: `packages/cli/tests/e2e.test.ts`
- Modify: `packages/engine/tests/ifr.test.ts`
- Modify: `packages/engine/tests/audit.test.ts`

- [ ] **Step 1: Adicionar E2E para `audit` e `solve`**

Append:

```ts
it('audit fixture exits 0 and reports Next.js + Prisma', () => {
  const { exitCode, stdout } = run('audit --dir ../engine/tests/fixtures/nextjs-prisma');
  expect(exitCode).toBe(0);
  expect(stdout).toContain('Next.js');
  expect(stdout).toContain('Prisma');
});

it('solve exits 0 and prints TRIZ workflow', () => {
  const { exitCode, stdout } = run('solve --system "API Gateway" --problem "latencia alta e confiabilidade baixa"');
  expect(exitCode).toBe(0);
  expect(stdout).toContain('Workflow TRIZ');
});
```

- [ ] **Step 2: Adicionar testes unitários de idioma no engine onde houver textos bilíngues**

Example in `packages/engine/tests/ifr.test.ts`:

```ts
it('returns English IFR text when formatter selects en', () => {
  const result = generateIFR('test goal');
  expect(result.statement.en).toContain('The system achieves');
  expect(result.statement.pt).toContain('O sistema alcança');
});
```

- [ ] **Step 3: Executar typecheck, testes e build completos**

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

Expected:
- zero erros
- `packages\engine\dist` e `packages\cli\dist` atualizados

- [ ] **Step 4: Smoke test do artefato compilado**

```powershell
node packages\cli\dist\index.js --lang en concept --principle 1
node packages\cli\dist\index.js --lang en ifr --goal "authenticate without passwords"
node packages\cli\dist\index.js audit --dir packages\engine\tests\fixtures\nextjs-prisma
node packages\cli\dist\index.js solve --system "API Gateway" --problem "high latency and low reliability"
```

Expected:
- comandos saem com código `0`
- outputs em EN quando `--lang en`
- `audit` e `solve` funcionando por artefato compilado

- [ ] **Step 5: Commit**

```powershell
git add packages/cli/tests/e2e.test.ts packages/engine/tests/ifr.test.ts packages/engine/tests/audit.test.ts packages/engine/dist packages/cli/dist
git commit -m "test(cli): extend resume coverage for audit solve and lang"
```

---

## Task 4: Integrar Em `master`

**Files:**
- Modify: `CLAUDE.md` if needed after final state review

- [ ] **Step 1: Voltar ao repositório principal**

```powershell
Set-Location E:\PROJETOS\ClawMatrix
git checkout master
git pull --ff-only origin master
```

- [ ] **Step 2: Integrar a branch de feature**

Prefer fast-forward if possible:

```powershell
git merge --ff-only feature/clawmatrix-impl
```

Fallback if `master` moved:

```powershell
git merge --no-ff feature/clawmatrix-impl
```

- [ ] **Step 3: Validar que o root agora contém o código**

```powershell
Get-ChildItem package.json, pnpm-workspace.yaml, packages, .github\workflows\ci.yml
```

Expected:
- root passa a refletir o conteúdo da worktree de feature

---

## Task 5: Publicar E Fechar O Loop

**Files:**
- Review: `.github/workflows/ci.yml`
- Review: `CLAUDE.md`

- [ ] **Step 1: Rodar a validação final em `master`**

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

- [ ] **Step 2: Push**

```powershell
git push origin master
```

- [ ] **Step 3: Confirmar CI**

Check:
- workflow `CI` disparado
- etapa `Type check` verde
- etapa `Run tests` verde

- [ ] **Step 4: Encerrar a worktree quando não for mais necessária**

```powershell
git worktree remove .worktrees/feature/clawmatrix-impl
git branch -d feature/clawmatrix-impl
```

Only run after:
- merge concluído
- push concluído
- CI verde

---

## Resume Recommendation

1. Retomar pela worktree `feature/clawmatrix-impl`, não pelo `master`.
2. Tratar `--lang` como o único gap funcional confirmado contra a spec.
3. Expandir cobertura de `audit`, `solve` e `--lang en` antes do merge.
4. Só integrar em `master` depois de `pnpm.cmd typecheck`, `pnpm.cmd test` e `pnpm.cmd build` verdes fora do sandbox.
