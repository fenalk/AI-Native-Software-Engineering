# AI-Native-Software-Engineering


## Workspace

Monorepo gerenciado com [pnpm workspaces](https://pnpm.io/workspaces).

```
.
├── apps/
│   ├── web/   # React + Vite
│   └── api/   # NestJS
├── docker/    # scripts de inicialização do PostgreSQL
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

### Pré-requisitos

- Node.js >= 20
- pnpm >= 10
- Docker com Compose (para o PostgreSQL de desenvolvimento)

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
- PostgreSQL (Docker): `localhost:5433`

### Banco de dados (PostgreSQL)

A API persiste os usuários em PostgreSQL com [Drizzle ORM](https://orm.drizzle.team). O banco de
desenvolvimento sobe pelo `docker-compose.yml` da raiz, com o volume nomeado
`ai-native_postgres-data`: os dados sobrevivem a `docker compose down` (só `docker compose down -v`
apaga).

```bash
docker compose up -d --wait
cp apps/api/.env.example apps/api/.env   # ajuste se necessário
pnpm api db:migrate
```

O `.env.example` traz `NODE_ENV=development`, que permite subir a API com o segredo JWT público
de desenvolvimento. Com qualquer outro `NODE_ENV` (ou sem ele, como em produção) a API **não
sobe** sem um `JWT_SECRET` de pelo menos 32 caracteres.

O container publica a porta **5433** no host, porque o 5432 costuma estar ocupado por um
PostgreSQL instalado localmente. Use `POSTGRES_PORT` para trocar.

O script `docker/postgres/init` cria o banco `ainative_test` usado pelos testes e2e na primeira
inicialização do volume. Se o volume já existir, crie manualmente:

```bash
docker compose exec postgres createdb -U ainative ainative_test
```

| Comando | Descrição |
|---|---|
| `pnpm api db:generate` | Gera uma migration SQL a partir de `apps/api/src/db/schema.ts` |
| `pnpm api db:migrate` | Aplica as migrations pendentes |
| `pnpm api db:seed` | Recria o feed de demonstração (apaga posts e tags existentes) |
| `pnpm api db:studio` | Abre o Drizzle Studio |

Versione sempre os arquivos gerados em `apps/api/drizzle/` junto com a mudança de schema.
`pnpm api test` roda sem banco; `pnpm api test:e2e` exige o container de pé, e as migrations do
banco de teste são aplicadas automaticamente antes da suíte.

### Feed de posts

O feed público fica em `/feed` (e `/` redireciona para ele). Cada post abre em `/posts/:id`;
usuários logados publicam em `/publicar`, curtem e comentam. Visitantes leem o feed e o detalhe,
mas são levados ao login ao tentar interagir.

A API expõe:

| Rota | Descrição |
|---|---|
| `GET /posts?search=&tags=&sort=&page=&limit=` | Busca full-text (PostgreSQL, português), filtro por tags (AND) e ordenação `recent`/`popular` |
| `GET /posts/:id` | Detalhe com o código do post |
| `POST /posts` | Publica um post (`201` + `Location`) |
| `POST`/`DELETE /posts/:id/likes` | Curte/descurte de forma idempotente |
| `GET`/`POST /posts/:id/comments` | Lista e cria comentários (com um nível de respostas) |
| `GET /tags` | Tags usadas, com contagem de posts |

O seed cria usuários, tags, posts, curtidas e comentários de demonstração. Também inclui um
post sem thumbnail e outro com URL quebrada para exercitar o placeholder do card.

```bash
docker compose up -d --wait
pnpm api db:migrate
pnpm api db:seed
```

Credenciais de demonstração: `ada@codeconnect.dev` / `senha-segura` (os demais usuários do seed
usam a mesma senha). O comando **apaga todos os posts e tags** antes de inserir os dados de
demonstração; por isso recusa `NODE_ENV=production` e bancos fora de `localhost` (a menos que
`SEED_ALLOW_REMOTE=true` confirme).

## Estatísticas do código

Contagem de linhas do código-fonte com [cloc](https://github.com/AlDanial/cloc) 1.86.
Entram apenas os arquivos de código dos apps: `apps/web/src`, `apps/web/index.html`,
`apps/web/vite.config.js`, `apps/api/src`, `apps/api/test` e os `vitest.config*.ts`.
Ficam de fora dependências (`node_modules`), lockfiles, builds (`dist`), dados
(assets e `Setup/`) e toda a documentação (`*.md`).

| Linguagem | Arquivos | Em branco | Comentários | Código |
|---|---:|---:|---:|---:|
| JSX | 29 | 80 | 2 | 742 |
| CSS | 16 | 77 | 5 | 495 |
| TypeScript | 8 | 16 | 2 | 93 |
| HTML | 1 | 0 | 0 | 24 |
| JavaScript | 2 | 2 | 1 | 17 |
| **Total** | **56** | **175** | **10** | **1371** |

Por app: web com 1278 linhas de código (48 arquivos) e API com 93 (8 arquivos).

Para reproduzir:

```bash
npx cloc@2.6.0 apps/web/src apps/web/index.html apps/web/vite.config.js \
     apps/api/src apps/api/test apps/api/vitest.config.ts apps/api/vitest.config.e2e.ts
```

## Servidores MCP

Os servidores MCP configurados para o OpenCode ficam em `opencode.json`, na raiz do repositório. Esse arquivo é ignorado pelo Git (pode conter credenciais), então cada pessoa mantém a sua própria cópia.

| Servidor | Tipo | Endpoint | Autenticação |
|---|---|---|---|
| `github` | remoto | `https://api.githubcopilot.com/mcp/` | Token na variável de ambiente `GH` |
| `figma` | remoto | `https://mcp.figma.com/mcp` | OAuth |
