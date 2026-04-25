# ClawMatrix - Unified Integrations Design
**Data:** 2026-04-25  
**Status:** Proposto

---

## 1. Objetivo

Transformar o repositório do ClawMatrix em um pacote unificado de integração para **Claude Code** e **Codex**, sem remover seu papel atual como:

- engine TypeScript reutilizável
- CLI determinística (`claw`)

O novo resultado esperado é um repositório que:

- continua entregando `@claw/engine` e `@claw/cli`
- passa a incluir uma camada de integração para agentes
- pode ser instalado manualmente ou por script
- pode ser publicado no próprio repositório para instalação por terceiros

---

## 2. Decisões de Produto

| Decisão | Escolha |
|---|---|
| Papel do repositório | Package de integração, não apenas CLI |
| Modelo de entrega | Um pacote unificado para Claude Code + Codex |
| Backend operacional | A própria CLI `claw` compilada |
| Integração Claude Code | Skill + workflows + documentação + comandos |
| Integração Codex | Plugin local + skills + scripts + documentação |
| Instalação | Manual e por script |
| Publicação | Publicável no próprio repositório |
| Escopo desta fase | Sem MCP, sem marketplace, sem app UI |

---

## 3. Princípio Central

Toda a lógica TRIZ continua centralizada no código existente:

- `packages/engine`
- `packages/cli`

As integrações para agentes **não reimplementam** TRIZ, não duplicam heurísticas, e não passam a “responder por conta própria” fora do backend real.  
Claude Code e Codex passam a atuar como camadas de orquestração, instrução e workflow sobre a CLI compilada.

Consequência prática:

- contradições continuam sendo resolvidas por `claw matrix`
- IFR continua sendo gerado por `claw ifr`
- auditoria continua sendo executada por `claw audit`
- workflows continuam sendo executados por `claw solve`

---

## 4. Arquitetura Proposta

```text
User / Agent
  ├── Claude Code integration
  │     └── skill + docs + setup
  ├── Codex integration
  │     └── plugin + skills + setup
  └── shared runtime backend
        └── node packages/cli/dist/index.js
              ├── @claw/cli
              └── @claw/engine
```

### Regra de responsabilidade

- `@claw/engine`
  - lógica TRIZ
  - dados da matriz
  - IFR
  - auditoria

- `@claw/cli`
  - parsing de argumentos
  - formatação
  - `--json`
  - `--lang`

- integração Claude Code
  - decidir quando usar cada comando
  - orientar uso da CLI
  - fornecer workflows e exemplos

- integração Codex
  - expor skill/plugin local
  - orientar instalação e uso
  - preparar estrutura para futura expansão

---

## 5. Estrutura de Pastas

Estrutura alvo:

```text
ClawMatrix/
├── packages/
│   ├── engine/
│   └── cli/
├── integrations/
│   ├── claude-code/
│   │   ├── skill/
│   │   │   └── SKILL.md
│   │   ├── docs/
│   │   └── templates/
│   └── shared/
│       └── docs/
├── plugins/
│   └── clawmatrix/
│       ├── .codex-plugin/
│       │   └── plugin.json
│       ├── skills/
│       ├── scripts/
│       ├── assets/
│       ├── docs/
│       ├── .mcp.json              (opcional, não ativo nesta fase)
│       └── .app.json              (opcional, não ativo nesta fase)
├── scripts/
│   ├── setup-claude-code.*
│   ├── setup-codex.*
│   └── setup-integrations.*
└── docs/
    └── integrations/
```

### Observações

- A pasta `integrations/claude-code/` existe para documentação e skill específica da plataforma.
- A pasta `plugins/clawmatrix/` existe para o plugin local do Codex.
- A estrutura do plugin Codex já nasce pronta para crescer com `apps/` ou MCP depois, mas sem ativar isso agora.

---

## 6. Integração com Claude Code

O lado do Claude Code será entregue como uma **skill dedicada do ClawMatrix**.

### Conteúdo esperado

- `SKILL.md` com:
  - quando usar `matrix`, `concept`, `ifr`, `audit` e `solve`
  - como decidir entre texto formatado e `--json`
  - exemplos curtos de uso
  - guidance para transformar pedidos vagos em chamadas objetivas da CLI

- documentação complementar com:
  - instalação manual
  - instalação por script
  - troubleshooting

### Comportamento esperado

Quando um usuário pedir algo como:

- “quais princípios usar se eu quero melhorar velocidade sem perder confiabilidade?”
- “gere um IFR para autenticação sem senha”
- “audite este projeto”
- “me ajude a estruturar um problema usando TRIZ”

a skill deve orientar Claude Code a:

1. decidir o subcomando correto
2. executar a CLI compilada
3. preferir `--json` quando a saída precisar ser transformada programaticamente
4. usar a resposta da CLI como fonte da resposta ao usuário

### Fora de escopo nesta fase

- integração nativa por protocolo
- servidor MCP
- UI própria do Claude Code

---

## 7. Integração com Codex

O lado do Codex será entregue como um **plugin local publicável no repositório**.

### Conteúdo esperado

- `.codex-plugin/plugin.json`
- `skills/`
- `scripts/`
- `docs/`
- estrutura opcional preparada para:
  - `.mcp.json`
  - `.app.json`

### Função do plugin

O plugin deve:

- ensinar quando usar a CLI do ClawMatrix
- fornecer workflows orientados a problema
- facilitar instalação local
- manter a integração consistente com o comportamento já descrito para Claude Code

### Regras do plugin

- não duplicar lógica TRIZ
- não inventar respostas sem chamar o backend quando a operação exigir cálculo/heurística reais
- depender de uma CLI compilada e disponível no ambiente local

---

## 8. Backend Compartilhado

O backend compartilhado para ambas as integrações será:

```bash
node packages/cli/dist/index.js
```

ou equivalente resolvido pelo script de setup.

### Contrato mínimo

As integrações assumem que estes comandos existem e permanecem estáveis:

- `matrix`
- `concept`
- `ifr`
- `audit`
- `solve`

As integrações também assumem que estes flags existem:

- `--json`
- `--lang`
- `--no-color`

Qualquer quebra neste contrato exige atualização simultânea da camada de integração.

---

## 9. Instalação

### 9.1 Instalação manual

O repositório deve documentar:

- como instalar a skill do lado Claude Code
- como instalar o plugin local do lado Codex
- como apontar corretamente para o backend `claw`

### Regras

- evitar caminhos absolutos hardcoded
- preferir resolução relativa ao root do repositório
- se a plataforma exigir caminho local, isso deve ser materializado por script de setup

### 9.2 Instalação por script

O repositório deve oferecer script(s) de setup que:

1. validem pré-requisitos
2. validem que a CLI já foi buildada
3. instalem/configurem os artefatos locais de Claude Code e Codex
4. exibam mensagens de sucesso e erro de forma explícita

### Pré-requisitos mínimos

- Node.js
- pnpm
- dependências instaladas
- build concluído com sucesso

### Comandos esperados antes do setup

```bash
pnpm install
pnpm build
```

---

## 10. Resolução de Caminhos

Este é o risco operacional principal do projeto.

### Problema

A integração para agentes depende de localizar corretamente a CLI compilada, mas:

- o repositório pode estar em qualquer diretório
- o ambiente local do usuário pode ser diferente
- Claude Code e Codex podem exigir instalação em locais distintos

### Decisão

O design deve tratar resolução de caminhos como responsabilidade explícita dos scripts de setup.

### Regra

- manifests e docs não devem depender de caminhos pessoais da máquina do autor
- scripts de setup podem calcular e gravar referências locais conforme necessário
- quando o backend não for encontrado, a integração deve falhar de forma clara e instrutiva

### Fallback obrigatório

Se a CLI compilada não existir:

- não simular resposta
- não tentar substituir a lógica por prompt
- instruir exatamente o que executar, por exemplo:

```bash
pnpm install
pnpm build
```

---

## 11. Estratégia de Conteúdo

### 11.1 Claude Code

A skill deve cobrir:

- quando usar cada subcomando
- quando preferir `--json`
- como interpretar saídas
- exemplos rápidos
- heurísticas de escolha entre:
  - `matrix`
  - `solve`
  - `ifr`
  - `audit`
  - `concept`

### 11.2 Codex

O plugin deve cobrir:

- manifesto mínimo
- skill(s) para workflows
- scripts de instalação
- docs específicas da integração

### 11.3 Documentação compartilhada

Documentação comum deve ficar separada do README principal do projeto para não misturar:

- “como usar o ClawMatrix”
- “como instalar ClawMatrix em agentes”

---

## 12. Testes

### 12.1 Núcleo

Os testes atuais continuam onde já estão:

- engine
- CLI

Não haverá duplicação de testes TRIZ na camada de integração.

### 12.2 Testes da integração

Adicionar verificações leves para:

- existência de arquivos obrigatórios
- validade mínima de manifests
- funcionamento esperado dos scripts de setup
- resolução correta do backend compilado
- consistência da documentação essencial

### O que validar

- `plugin.json` existe e contém os campos obrigatórios
- a skill do Claude Code existe
- o setup falha corretamente quando `dist/` não existe
- o setup detecta corretamente o backend quando o build existe

---

## 13. Fora do Escopo

Não faz parte desta entrega:

- marketplace
- servidor MCP
- app UI
- integração nativa por API em vez da CLI
- duplicação da lógica do engine em prompt

Esses pontos podem ser adicionados depois, mas não entram na primeira versão do pacote unificado.

---

## 14. Resultado Esperado

Após esta entrega, o repositório deve poder ser descrito corretamente como:

- uma ferramenta CLI/engine de TRIZ
- um pacote unificado de integração para Claude Code e Codex
- instalável manualmente
- instalável por script
- publicável diretamente a partir do próprio repositório

---

## 15. Critérios de Sucesso

Esta fase será considerada concluída quando:

1. existir uma skill dedicada para Claude Code no repositório
2. existir um plugin local do Codex no repositório
3. ambos usarem a CLI compilada como backend real
4. existir documentação manual de instalação e uso
5. existir setup automatizado por script
6. a integração falhar de forma clara quando a CLI não estiver buildada
7. o repositório continue preservando `@claw/engine` e `@claw/cli` como núcleo funcional
