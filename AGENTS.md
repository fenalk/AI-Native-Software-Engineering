# AGENTS.md

## Estrutura do repositório

- Workspace pnpm (`pnpm-workspace.yaml` → `apps/*`), um único repositório git na raiz. Sandbox do curso de AI-Native Software Engineering da Alura, com autenticação, feed de posts, curtidas e comentários.
- `apps/web` — React 19 + Vite 8, **JavaScript puro** (sem TypeScript).
- `apps/api` — NestJS 12, TypeScript em modo **ESM**, testes com Vitest.
- `Setup/` — material de estudo do curso (conceitos de modelos de IA), não é código da aplicação. Não importe nem "corrija".
- O web fala com a API por `axios` (`apps/web/src/services`); em desenvolvimento o proxy do Vite encaminha `/api` para `http://localhost:3000`, sem CORS. Em produção, `/api` precisa ser roteado para a API ou `VITE_API_URL` deve apontar para ela.

## Comandos

Execute a partir da raiz do repositório. `pnpm web <cmd>` e `pnpm api <cmd>` repassam qualquer comando para o app indicado.

| Objetivo | Comando |
|---|---|
| Os dois servidores de desenvolvimento | `pnpm dev` |
| Só web (5173) / só API (3000) | `pnpm dev:web` / `pnpm dev:api` |
| Um teste unitário da API | `pnpm api test src/app.controller.spec.ts` |
| Um teste de componente/página web | `pnpm web test src/components/atoms/Checkbox/Checkbox.test.jsx` |
| Testes unitários em modo watch | `pnpm api test:watch` |
| Testes e2e da API | `pnpm api test:e2e` |
| Recriar o feed de demonstração (destrutivo) | `pnpm api db:seed` |
| Lint de tudo / build de tudo | `pnpm lint` / `pnpm build` |

- `pnpm test` roda o `vitest run` de cada app (web `src/**/*.test.{js,jsx}`, API `**/*.spec.ts`); os e2e da API (`test/**/*.e2e-spec.ts`) precisam de `pnpm api test:e2e` e do container de pé.
- A porta da API respeita `PORT` (padrão 3000).

## Banco de dados

- PostgreSQL sobe pelo `docker-compose.yml` na raiz (`docker compose up -d --wait`), com volume nomeado `ai-native_postgres-data` e porta **5433** no host (o 5432 costuma estar ocupado por um PostgreSQL local). `POSTGRES_PORT` troca a porta.
- A API usa **Drizzle ORM** via `@nestjs/drizzle`: schema em `apps/api/src/db/schema.ts`, migrations versionadas em `apps/api/drizzle/` e queries em repositórios injetáveis (ex.: `UsersRepository`).
- `DATABASE_URL`, `TEST_DATABASE_URL`, `NODE_ENV` e `JWT_SECRET` ficam em `apps/api/.env` (veja `.env.example`). O `ConfigModule` valida o ambiente no boot (`validateEnvironment`): fora de `NODE_ENV=development|test`, a API não sobe sem `JWT_SECRET` (≥ 32 caracteres, diferente do fallback público). Depois de mudar o schema, rode `pnpm api db:generate` e versione o SQL; `pnpm api db:migrate` aplica as migrations.
- `pnpm api test` não usa banco (os unitários mockam os repositórios). `pnpm api test:e2e` exige o container de pé, usa o banco `ainative_test` e aplica as migrations automaticamente. As suítes compartilham o banco e truncam tabelas, por isso `vitest.config.e2e.ts` roda com `fileParallelism: false`; os testes limpam com `TRUNCATE TABLE users, tags CASCADE`.

### Feed de posts

- Tabelas: `posts`, `tags`, `post_tags`, `post_likes` e `comments`; `users` ganhou `username` e `avatar_url` (nullable). O handle público é `username ?? slug(name)`.
- `posts.search_document` é uma coluna `tsvector` gerada em português e indexada com GIN. A busca usa `websearch_to_tsquery('portuguese', ...)`; as tags filtram por AND.
- Queries ficam em `PostsRepository`; o mapeamento para DTOs e as regras de curtida/comentário ficam em `PostsService`.
- Leitura (`GET /posts`, `GET /posts/:id`, `GET /posts/:id/comments`, `GET /tags`) é pública, mas usa `@Public()` + `OptionalJwtAuthGuard` para devolver `likedByMe` quando há Bearer válido. Escrita exige o guard global.
- `pnpm api db:seed` recria o feed de demonstração (`ada@codeconnect.dev` / `senha-segura`). É destrutivo: apaga posts e tags antes de inserir, por isso `assertSeedAllowed` recusa `NODE_ENV=production` e hosts fora de `localhost` sem `SEED_ALLOW_REMOTE=true`. As thumbnails ficam em `apps/web/public/seed/`.
- `thumbnailUrl` só aceita URL `http(s)` absoluta ou caminho relativo à raiz (`/seed/...`); `javascript:`, `data:` e `//host` dão `400`.

## Windows: pnpm.exe está bloqueado nesta máquina

O Device Guard / Controle de Aplicativo bloqueia o `pnpm.exe`, então toda chamada de `pnpm` falha com *"política de Controle de Aplicativo bloqueou este arquivo"* (exit 4551). A cópia do pnpm em `%LOCALAPPDATA%\pnpm\.tools` também é bloqueada.

Alternativas que funcionam (verificadas). Execute cada uma dentro do diretório do próprio app — tanto o Vite quanto o Nest resolvem a configuração a partir do diretório atual:

```powershell
cd apps/web; node node_modules/vite/bin/vite.js
cd apps/api; node node_modules/@nestjs/cli/bin/nest.js start --watch
```

Para rodar scripts de pacote, use uma build em JS do pnpm: `npm pack pnpm@10.18.3`, extraia e depois `node <dir>/package/bin/pnpm.cjs <script>`. Scripts da raiz que chamam `pnpm` internamente (`dev:api`, `dev:web`, `test`, `lint`) ainda falham com essa alternativa — chame o comando interno em vez disso, por exemplo `node <dir>/package/bin/pnpm.cjs --filter api start:dev`. Relate o bloqueio em vez de editar scripts ou reinstalar o pnpm, a menos que seja pedido.

## Convenções da API (`apps/api`)

- ESM: imports relativos devem terminar em `.js` (ex.: `./app.module.js`) mesmo em arquivos `.ts`; não use `__dirname` (use `import.meta.dirname`).
- Vitest, não Jest: os globals ficam habilitados e `vi.fn()` substitui os mocks do jest. `vitest.config.ts` cobre `*.spec.ts` (colocados junto ao código-fonte); `vitest.config.e2e.ts` cobre `test/*.e2e-spec.ts` via supertest.
- `nest build` gera em `dist/` com `deleteOutDir` e exclui os specs; `start:prod` = `node dist/main`.
- Leia `apps/api/AGENTS.md` **antes de adicionar bibliotecas**. O Nest 12 é mais novo que a maior parte dos dados de treinamento (índice da documentação: `https://docs.nestjs.com/llms.txt`), prefira pacotes de primeira linha, e a validação usa Standard Schema (`StandardSchemaValidationPipe`) em vez de class-validator.
- O hardening HTTP fica em `configureApp` (`src/app.setup.ts`): `helmet()` e limite de body de 100kb. Use-o em `main.ts` **e** nas suítes e2e que testam headers/limites. O rate limit é global (`ThrottlerGuard` antes do `JwtAuthGuard`, 120 req/min por IP); rotas de autenticação usam `@AuthRateLimit()` e criação de conteúdo `@WriteRateLimit()` (`src/common/rate-limit.ts`). Cada e2e cria um app novo, então o contador em memória não vaza entre testes.
- O `ProblemDetailsFilter` só repassa a mensagem de exceções 4xx; todo 5xx responde com o `detail` genérico. Nunca coloque mensagem de driver, `cause` ou stack numa `HttpException`.
- A telemetria do NestJS Observe não está ligada (o `ObserveModule` está ausente), então não há traces/logs de produção disponíveis.

### Contrato REST

Todo endpoint novo deve seguir REST, não RPC:

- URLs orientadas a recurso, com substantivos no plural (`/users`, `/users/:id`); sem verbos nos caminhos (`/getUsers`, `/users/create`). No máximo um sub-recurso aninhado (`/users/:id/orders`).
- Mapeie o CRUD para métodos e status codes: `GET` 200 (404 quando não existir), `POST` 201 + cabeçalho `Location`, `PUT` substituição total 200/204, `PATCH` atualização parcial 200/204, `DELETE` 204. Nunca retorne 200 com corpo de erro.
- Valide na borda (DTOs + Standard Schema) e use um formato único de erro para todas as respostas fora de 2xx (ex.: RFC 9457 `application/problem+json`).
- Os DTOs são o contrato público: nunca exponha entidades de persistência diretamente.
- Paginação, filtragem e ordenação vão por query params (`?page=&limit=&sort=`), não no corpo nem em segmentos do caminho.
- Mantenha os handlers sem estado; `GET`, `PUT` e `DELETE` devem ser idempotentes.

## Convenções do web (`apps/web`)

- Apenas JavaScript + JSX; o Vite usa `@vitejs/plugin-react` (Oxc). Não introduza TypeScript sem que seja pedido.
- O **Atomic Design** fica em `src/components/{atoms,molecules,organisms,templates}` mais `src/pages`. As dependências apontam em uma única direção — atoms → molecules → organisms → templates → pages; nunca importe na direção contrária.
  - atoms: apresentacionais e agnósticos de domínio (sem busca de dados); molecules compõem atoms; organisms são donos do comportamento de domínio; templates definem layout/slots; pages ligam os dados e compõem templates.
- **Tailwind CSS v4** é o sistema de estilização (`@tailwindcss/vite`, tema em `src/styles/global.css`). Estilize com classes utilitárias no JSX; sem CSS-in-JS, arquivos CSS por componente ou props `style` avulsas. O CSS global serve apenas para importar o Tailwind, declarar o tema e o reset base. Cores e tamanhos seguem as guidelines abaixo.
- Todo componente deve vir com um teste cobrindo seu uso essencial (renderiza com as props principais + interação principal), colocado como `Component.test.jsx`. Verifique comportamento, não snapshots de marcação.
- Os testes usam Vitest + `@testing-library/react` (jsdom); `src/test/setup.js` polyfilla `localStorage`/`sessionStorage` porque o Node 26 expõe globais experimentais que sombreiam o jsdom.
- A integração HTTP fica em `src/services`: `api-client` (axios e Bearer token), `auth-service` (`/sessions`, `/users`, `/users/me`), `posts-service` (`/posts`, `/posts/:id/likes`, `/posts/:id/comments`, `/tags`), `session-storage` (chave `code-connect.access-token`) e `problem-details` (erros RFC 9457). As páginas chamam os serviços; os organisms só recebem `onSubmit`, `error`, `fieldErrors` e `submitting`.
- A sessão vai para `localStorage` quando "Lembrar-me" está marcado e para `sessionStorage` caso contrário. `SessionProvider`/`useSession` carregam `GET /users/me` uma vez e alimentam o menu lateral. Login e cadastro redirecionam para `/feed`; `/conta` continua sendo a página de perfil.
- As páginas do app usam `AppTemplate` (menu lateral + conteúdo). `/` e `/feed` abrem o feed, `/posts/:id` o detalhe, `/publicar` o formulário e `/sobre` a página estática. O menu alterna **Login** / **Sair** conforme a sessão.
- Ícones usam a fonte **Material Icons** e o bloco de código usa `font-mono` (Roboto Mono), carregadas no `index.html`. O placeholder de thumbnail é o `PostThumbnail` (cobre `null` e `onError`).
- Apenas oxlint (`react/rules-of-hooks` é erro), rodando com `--deny-warnings`: qualquer warning falha o `pnpm lint` e o CI.
- Curtir/descurtir passa pelo hook `usePostLike` (otimista, rollback, `401` → login, ignora clique duplo pendente); não duplique esse fluxo nas páginas.

### Cores

A paleta do projeto é a única fonte de cores do web e fica no `@theme` de `src/styles/global.css`:

| Token | Valor | Uso |
| --- | --- | --- |
| `canvas` | `#00090e` | fundo da página |
| `surface` | `#171d1f` | card |
| `surface-soft` | `#242826` | superfície secundária |
| `ink` | `#e1e1e1` | texto principal |
| `ink-soft` | `#bcbcbc` | texto dos cards e do campo de busca |
| `muted` | `#888888` | texto secundário |
| `accent` | `#81fe88` | ação primária |
| `accent-hover` | `#a1ffa6` | hover da ação primária |
| `accent-ink` | `#132e35` | texto sobre o `accent` |
| `accent-soft` | `rgb(129 254 136 / 30%)` | seleção de texto |
| `field` | `#888888` | fundo dos inputs |
| `field-hover` | `#9a9d9a` | hover dos inputs |
| `field-ink` | `#171d1f` | texto e placeholder dos inputs |
| `banner` | `#08120e` | fundo do banner |
| `edge` | `#000000` | borda do card |
| `focus` | `#ffffff` | outline de foco |
| `danger` | `#ff8b8b` | texto e borda de erro |

- Use os utilitários derivados do tema (`bg-canvas`, `bg-surface`, `text-ink`, `text-accent`, `border-edge`, `outline-focus` etc.).
- Nunca escreva hexadecimal ou `rgb()`/`rgba()` diretamente nas classes (`bg-[#171d1f]`, `text-[#ffffff]`) nem em CSS de componente.
- Se precisar de uma cor nova, adicione um token semântico `--color-*` ao `@theme` e use o utilitário correspondente; não crie uma paleta paralela.
- Sombras também são tokens: `--shadow-card`, `--shadow-accent` e `--shadow-editor` geram `shadow-card`, `shadow-accent` e `shadow-editor`. Evite `shadow-[...]` com cor literal.

### Tamanhos de fonte

Use somente a escala padrão do Tailwind (root de 16 px) e escolha o token mais próximo do valor de design. Não crie `--text-*` no tema nem use tamanhos arbitrários como `text-[15px]`.

| Token | px | Uso no projeto |
| --- | --- | --- |
| `text-xs` | 12 | labels dos provedores sociais (12,5 px no Figma) |
| `text-sm` | 14 | inputs, checkbox, links sutis e divisor (15 px no Figma) |
| `text-base` | 16 | texto base do `body` |
| `text-lg` | 18 | labels, botões e links de destaque |
| `text-xl` | 20 | descrição dos cabeçalhos (22 px no Figma) |
| `text-3xl` | 30 | títulos das páginas (31 px no Figma) |

- Quando o valor estiver entre dois tokens (ex.: 15 px e 22 px), use o token menor para preservar a hierarquia compacta.
- Quando o layout pedir `line-height` 1.5, combine o tamanho com `leading-normal`.
- Medidas de layout (alturas, `padding`, raios, `aspect-ratio` e breakpoints) podem usar utilitários do Tailwind ou valores arbitrários quando não houver token próximo; a regra de "só tokens" vale para cor e tamanho de fonte.

## Convenções do Git

- Um único repositório na raiz; nunca rode `git init` dentro de `apps/*`.
- Use **Conventional Commits** nos dois apps: `<type>(<scope>): <subject>`, ex.: `feat(web): add button atom`, `fix(api): return 404 when user is missing`.
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - O escopo é `web` ou `api`; omita-o para mudanças no repositório como um todo. O assunto vai no imperativo, em minúsculas, em inglês (acompanha o histórico existente), sem ponto final.
  - Use o corpo para explicar o *porquê* quando não for óbvio; mudanças que quebram compatibilidade vão no rodapé `BREAKING CHANGE:`.
- Uma mudança lógica por commit; não misture mudanças de web e api.
- Não existem hooks de commit — siga a convenção manualmente. O CI (`.github/workflows/ci.yml`) roda lint (`--deny-warnings`), testes unitários, e2e da API e build em todo PR; o `claude-code-review.yml` revisa PRs que tocam código, contratos ou regras.

### Checklist de segurança (code review)

Origem: auditoria em `plans/code-review-seguranca.md`. Cada item tem teste que falha se ele regredir.

- [ ] Entrada de usuário que vira URL (`src`, `href`) é validada no schema: só `http(s)` ou caminho relativo à raiz.
- [ ] Nenhum segredo com fallback silencioso: variáveis obrigatórias entram em `validateEnvironment` e falham no boot.
- [ ] Rotas de autenticação e de criação de conteúdo têm rate limit explícito; respostas `429` saem em `problem+json` com `Retry-After`.
- [ ] Caminhos de autenticação gastam o mesmo trabalho com e sem usuário (sem oráculo de tempo/enumeração).
- [ ] Respostas 5xx nunca carregam mensagem de driver, `cause` ou stack.
- [ ] Todo `:param` de ID usa um schema próprio (`postIdSchema`, `commentIdSchema`) e o par pai/filho divergente responde `404`.
- [ ] Scripts destrutivos (seed, truncates) recusam produção e bancos remotos sem confirmação explícita.
- [ ] Rotas do web validam o formato do ID antes de chamar a API.
- [ ] `pnpm lint` sai com código ≠ 0 diante de qualquer warning; nada de `--deny-warnings` removido para "passar o CI".
- [ ] Nenhum `.env`, `.pem`, `.key` ou caminho absoluto no diff (`git ls-files | grep -iE '\.env$|\.pem$|\.key$'` vazio).

### Critérios de segurança de commit

Verifique cada commit com base nestes critérios antes de enviar:

1. Nunca publicar caminhos absolutos do computador (ex.: `/home/<user>/...`, `C:\Users\<user>\...`).
2. Substituir caminhos pessoais por caminhos relativos ou placeholders (`apps/web/src`, `<repo-root>`).
3. Nunca versionar arquivos `.env`, `.pem`, `.key` ou credenciais.
4. Utilizar `.gitignore` para excluir arquivos sensíveis.
5. Verificar o histórico do Git, pois apagar um arquivo do repositório não o remove necessariamente do histórico.
6. Manter repositórios privados quando houver informações internas.

## Logs de sessão

- O diálogo completo de cada sessão é registrado em `prompts/sessoes/AAAA-MM-DD-HHMM-<tool>.md` (ex.: `2026-11-09-1228-opencode.md`).
- Formato: cabeçalho com ferramenta, modelo e fuso horário — nunca nomes de máquina, usuários, diretórios pessoais ou caminhos absolutos — depois cada prompt do usuário seguido da resposta do assistente, em ordem. Mantenha o texto do usuário literal, exceto caminhos absolutos, que devem ser ocultados.
- Um anexo longo pode ser referenciado pelo caminho em vez de duplicado.
- Sanitize caminhos vindos de prompts, comandos e saídas: use caminhos relativos ao repositório ou placeholders como `<repo-root>` e `<tmp>`.
