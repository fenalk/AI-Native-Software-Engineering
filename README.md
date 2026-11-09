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
