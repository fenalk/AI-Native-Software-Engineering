# AI-Native-Software-Engineering


## Workspace

Monorepo gerenciado com [pnpm workspaces](https://pnpm.io/workspaces).

```
.
├── apps/
│   ├── web/   # React + Vite
│   └── api/   # NestJS
├── package.json
└── pnpm-workspace.yaml
```

### Pré-requisitos

- Node.js >= 20
- pnpm >= 10

```bash
pnpm install
```

### Comandos (na raiz)

| Comando | Descrição |
|---|---|
| `pnpm dev` | Sobe web e API em paralelo |
| `pnpm dev:web` | Sobe apenas o app React (Vite) |
| `pnpm dev:api` | Sobe apenas a API NestJS em modo watch |
| `pnpm build` | Builda os dois apps |
| `pnpm build:web` | Builda apenas o app React |
| `pnpm build:api` | Builda apenas a API |
| `pnpm preview:web` | Pré-visualiza o build do app React |
| `pnpm start:api` | Executa a API buildada em produção |
| `pnpm lint` | Roda o lint em todos os apps |
| `pnpm test` | Roda os testes em todos os apps |

Atalhos para rodar qualquer comando em um app específico sem trocar de diretório:

```bash
# equivale a: cd apps/web && pnpm <comando>
pnpm web <comando>

# equivale a: cd apps/api && pnpm <comando>
pnpm api <comando>
```

Exemplos:

```bash
pnpm web add axios
pnpm api add @nestjs/config
pnpm web build
pnpm api test
```

### Portas padrão

- Web (Vite): <http://localhost:5173>
- API (NestJS): <http://localhost:3000>

## Contagem de código (cloc)

Contagem feita com [cloc](https://github.com/AlDanial/cloc) 1.86 sobre o código-fonte
versionado de `apps/web/src`, `apps/api/src` e `apps/api/test`. **Não entram na
contagem** `node_modules`, lockfiles (`pnpm-lock.yaml`), build (`dist/`) e dados/arquivos
auxiliares (imagens em `public/`, `.gitignore`, configurações de ferramentas).

```bash
npx cloc@2.6.0 apps/web/src apps/api/src apps/api/test --exclude-dir=node_modules,dist
```

| Linguagem | Arquivos | Em branco | Comentários | Código |
|---|---:|---:|---:|---:|
| JSX | 29 | 80 | 2 | 742 |
| CSS | 16 | 77 | 5 | 495 |
| TypeScript | 6 | 14 | 0 | 75 |
| JavaScript | 1 | 1 | 0 | 6 |
| **Total** | **52** | **172** | **7** | **1.318** |

Separando produção de testes:

| Partição | Arquivos | Em branco | Comentários | Código |
|---|---:|---:|---:|---:|
| Produção (sem testes) | 43 | 130 | 7 | 1.107 |
| Testes (`*.test.jsx`, `*.spec.ts`, `*.e2e-spec.ts`, `src/test/setup.js`) | 9 | 42 | 0 | 211 |

## Servidores MCP

Os servidores MCP configurados para o OpenCode ficam em `opencode.json`, na raiz do repositório. Esse arquivo é ignorado pelo Git (pode conter credenciais), então cada pessoa mantém a sua própria cópia.

| Servidor | Tipo | Endpoint | Autenticação |
|---|---|---|---|
| `github` | remoto | `https://api.githubcopilot.com/mcp/` | Token na variável de ambiente `GH` |
| `figma` | remoto | `https://mcp.figma.com/mcp` | OAuth |
