# Plano — Feed de posts, detalhe e publicação

## Referências de design

| Tela | Node do Figma | Tamanho |
|---|---|---|
| Feed | `155:3099` | 1920 × 1795 |
| Detalhes do post | `155:3194` | 1920 × 1834 |

O MCP do Figma atingiu o limite do plano Starter durante o levantamento. As telas
**Feed** e **Detalhes** desktop foram lidas com screenshot; **Publicar**, **Perfil**,
**Sobre nós** e os frames 360/768 não puderam ser inspecionados. O layout responsivo é
inferido a partir dos tokens e das duas telas lidas.

## Objetivo

Implementar o feed de posts do Code Connect com:

- leitura pública do feed e do detalhe de um post;
- busca full-text e filtro por tags processados no backend;
- curtidas e comentários para usuários autenticados;
- criação de posts para usuários autenticados;
- seed com posts mockados, incluindo posts sem thumbnail;
- placeholder para thumbnail ausente ou quebrada;
- layout compartilhado entre feed, detalhe e publicação, com menu lateral que alterna
  **Login** / **Sair** conforme a sessão.

## Diagnóstico do estado atual

- `apps/api` já tem NestJS 12 (ESM), Drizzle + PostgreSQL, autenticação JWT global
  (`JwtAuthGuard` + `@Public()`) e erros RFC 9457.
- `apps/api/src/db/schema.ts` só possui `users`.
- `apps/web` é React 19 + JavaScript puro, sem router, com Atomic Design, Tailwind v4,
  `apiClient` axios, `session-storage` e `problem-details`.
- A navegação atual é feita por um mapa de rotas em `App.jsx`; login e cadastro
  redirecionam para `/conta`.
- O menu lateral do Figma ainda não existe no código.

## 1. Backend (`apps/api`)

### 1.1 Modelo de dados (Drizzle)

Adicionar ao `src/db/schema.ts`:

```ts
// users (colunas novas, nullable)
username: text('username').unique(),
avatarUrl: text('avatar_url'),

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    content: text('content').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    searchDocument: tsvector('search_document').generatedAlwaysAs(
      sql`to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))`,
    ),
  },
  (table) => [
    index('posts_search_idx').using('gin', table.searchDocument),
    index('posts_created_at_idx').on(table.createdAt),
  ],
);

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index('post_tags_tag_idx').on(table.tagId, table.postId),
  ],
);

export const postLikes = pgTable(
  'post_likes',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index('post_likes_user_idx').on(table.userId),
  ],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'cascade',
    }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('comments_post_idx').on(table.postId, table.createdAt)],
);
```

Decisões:

- `username` e `avatar_url` ficam **nullable** para não alterar o contrato de cadastro.
  Usuários reais recebem `@handle` derivado de `username ?? slug(name)` no mapper;
  usuários do seed recebem handles explícitos (`@julio`, `@marcia` etc.).
- `thumbnail_url` aceita URL absoluta ou caminho root-relative (`/seed/...`).
- `search_document` é uma coluna gerada, com índice GIN. Se o `drizzle-kit` não gerar a
  coluna/índice corretamente, o SQL da migration é ajustado manualmente. Nunca editar
  uma migration já aplicada.
- A migration é gerada com `db:generate` e versionada em `apps/api/drizzle/`.

### 1.2 Busca full-text e filtros

`GET /posts` recebe:

| Param | Tipo | Regra |
|---|---|---|
| `search` | string (opcional) | `websearch_to_tsquery('portuguese', $1)` contra `search_document` |
| `tags` | string (opcional) | slugs separados por vírgula; o post precisa ter **todas** (AND) |
| `sort` | `recent` \| `popular` | `recent` = `created_at desc`; `popular` = curtidas desc |
| `page` | int ≥ 1 | padrão `1` |
| `limit` | int 1–50 | padrão `12` |

- Contagem e listagem usam os mesmos filtros (`total` para o “Carregar mais”).
- Curtidas e comentários entram como subqueries correlacionadas (`likesCount`,
  `commentsCount`); `likedByMe` só é calculado quando há usuário autenticado.
- Tags da página são buscadas em uma segunda query com `inArray(postIds)` e agrupadas
  no serviço, evitando N+1.
- `GET /tags` devolve `{ slug, name, postCount }` ordenado por `name`.

### 1.3 Endpoints REST

| Método | Rota | Auth | Retorno |
|---|---|---|---|
| `GET` | `/posts` | opcional | `200` `{ items, page, limit, total }` |
| `GET` | `/posts/:id` | opcional | `200` detalhe; `404` se não existir |
| `POST` | `/posts` | Bearer | `201` + `Location: /posts/:id` |
| `POST` | `/posts/:id/likes` | Bearer | `204` idempotente |
| `DELETE` | `/posts/:id/likes` | Bearer | `204` idempotente |
| `GET` | `/posts/:id/comments` | opcional | `200` lista com `parentId` |
| `POST` | `/posts/:id/comments` | Bearer | `201` + `Location`, aceita `parentId` |
| `GET` | `/tags` | pública | `200` lista de tags |

Contratos:

- **Post (resumo):** `id`, `title`, `description`, `thumbnailUrl`, `tags[]`,
  `author { id, name, username, avatarUrl }`, `likesCount`, `commentsCount`,
  `likedByMe`, `createdAt`.
- **Post (detalhe):** o resumo + `content`.
- **Comentário:** `id`, `body`, `parentId`, `author`, `createdAt`.
- **Criar post:** `{ title, description, content, thumbnailUrl?, tags: string[] }`
  (nomes de tags; o backend faz slugify e upsert em transação).
- **Criar comentário:** `{ body, parentId? }`; a resposta só pode apontar para um
  comentário de topo do mesmo post. Respostas a respostas são normalizadas para o pai.
- Validação com Zod/Standard Schema; erros seguem `ProblemDetailsFilter`.
- DTOs em `src/posts/*.dto.ts`; nenhuma linha de banco é exposta.

### 1.4 Autenticação opcional

As rotas de leitura são públicas, mas precisam saber quem é o usuário para devolver
`likedByMe`:

- `OptionalJwtAuthGuard extends AuthGuard('jwt')` com `handleRequest` devolvendo
  `user ?? null` (token ausente, inválido ou expirado vira visitante).
- `@OptionalCurrentUser()` devolve `request.user ?? null`.
- As rotas usam `@Public()` (para o guard global) + `@UseGuards(OptionalJwtAuthGuard)`.
- Rotas de escrita continuam protegidas pelo guard global e respondem `401`.

### 1.5 Seed de posts mockados

Arquivo `src/db/seed.ts`, executado por um context Nest:

```ts
const app = await NestFactory.createApplicationContext(AppModule);
const db = app.get<Database>(getDrizzleToken());
await seed(db);
await app.close();
```

Script em `apps/api/package.json`:

```json
"db:seed": "nest start --entryFile db/seed"
```

(Se o CLI não se comportar bem com `--entryFile`, avaliar `tsx` como devDependency.)

Conteúdo do seed:

- ~5 usuários de demonstração com senha `senha-segura`; handles e avatares explícitos.
- ~7 tags: React, Front-end, Acessibilidade, CSS, TypeScript, Node, Design.
- ~8 posts com título, descrição, código, tags, curtidas e comentários com resposta.
- Dois posts sem thumbnail: um com `thumbnailUrl: null` e outro com URL inválida para
  exercitar também o `onError`.
- Thumbnails baixadas do Figma para `apps/web/public/seed/` e referenciadas como
  `/seed/...` (as URLs do MCP expiram em 7 dias).
- **Idempotência destrutiva:** apaga posts e tags antes de inserir; usuários são
  upsertados por e-mail. Documentar o aviso de que posts existentes são apagados.

### 1.6 Testes da API

Unitários (sem banco):

- `PostsService` com repositório fake: criar post/tags, curtir/descurtir, comentar,
  respostas, `404` e `likedByMe`.

E2E (banco de teste):

- feed público, detalhe e `404`;
- busca textual e filtro por tags (AND);
- `401` para criar post, curtir e comentar sem token;
- criação de post `201` + `Location`;
- curtida idempotente e `likedByMe` com token;
- comentário e resposta com `Location`;
- ajustar `test/auth.e2e-spec.ts` para `TRUNCATE TABLE users CASCADE` (as novas FKs
  impedem o truncate simples);
- atualizar `swagger.e2e-spec.ts` e o texto do `swagger.ts`, que ainda diz que os dados
  vivem em memória.

## 2. Frontend (`apps/web`)

### 2.1 Rotas, sessão e navegação

| Rota | Tela |
|---|---|
| `/` | Feed (visitante pode acessar) |
| `/feed` | Feed |
| `/posts/:id` | Detalhe |
| `/publicar` | Publicar |
| `/login` | Login |
| `/cadastro` | Cadastro |
| `/conta` | Minha conta |
| `/sobre` | Sobre nós (estática mínima) |

- `App.jsx` ganha um matcher simples para `/posts/:id`; o fallback de rota desconhecida
  continua no login.
- Login e cadastro passam a redirecionar para `/feed` (hoje vão para `/conta`).
- `src/session/SessionProvider.jsx` + `useSession()`:
  - lê o token no `session-storage`;
  - busca `GET /users/me` quando há token;
  - `401` limpa a sessão;
  - expõe `{ user, isAuthenticated, signOut }`.
- Apenas as rotas novas ficam dentro do provider, para não alterar os testes atuais da
  `AccountPage`.
- `main.jsx` ganha os títulos das novas páginas.

### 2.2 Layout compartilhado

`templates/AppTemplate`:

- fundo `bg-canvas`;
- container `max-w-[1200px]`, sidebar `177px` + conteúdo, `gap` ~28px;
- padding vertical de 56px no desktop;
- no mobile a sidebar vira barra horizontal com `flex-wrap` (sem rolagem horizontal
  em 320px).

`organisms/SideMenu`:

- logo existente `public/logo-code-connect.svg`;
- CTA “Publicar” (outline);
- itens Feed, Perfil e Sobre nós;
- rodapé com o estado da sessão:
  - visitante → **Login** (`/login`);
  - logado → **Sair** (limpa o token e volta para `/feed`).
- “Perfil” aponta para `/conta`; “Sobre nós” para `/sobre`.
- Item ativo: Feed em `/feed` e `/posts/:id`.

### 2.3 Componentes (Atomic Design)

| Camada | Novos |
|---|---|
| atoms | `Icon` (Material Icons, igual ao Figma), `Avatar`, `Tag`, `PostThumbnail`, `TextArea` |
| molecules | `SearchField`, `FilterBar`, `PostActions`, `MenuLink` |
| organisms | `SideMenu`, `PostCard`, `PostGrid`, `CommentThread`, `PostComposer` |
| templates | `AppTemplate` |
| pages | `FeedPage`, `PostPage`, `PublishPage`, `AboutPage` |

Reaproveitar:

- `Button`, `Link`, `FormField`, `TextInput`, `BrandMark`;
- `api-client`, `problem-details`, `session-storage`;
- `Logo` existente.

Tokens que faltam no `@theme`:

- `--color-ink-soft: #bcbcbc` (texto dos cards e placeholder da busca);
- `--font-mono: 'Roboto Mono', ...` (bloco de código);
- `--shadow-editor: 0 16px 24px rgb(0 0 0 / 24%)`.

Sem hex/rgb solto nas classes. Ajustar o `index.html` para carregar as fontes
Material Icons e Roboto Mono.

### 2.4 Feed

- Busca com debounce (300ms) chamando `GET /posts?search=...`.
- Chips de tags toggláveis (AND) e “Limpar tudo”.
- Abas **Recentes** e **Mais curtidos**.
- Grid de 2 colunas (1 no mobile), cards de 486px:
  - thumbnail 240px;
  - título 18 semibold, descrição 15;
  - tags;
  - curtir/compartilhar/comentar e autor à direita.
- “Carregar mais” quando `total > items.length`.
- Estados de carregando, erro e vazio.
- Visitante clicando em curtir → `/login`.
- Logado curte com atualização otimista e rollback em erro.

### 2.5 Detalhe do post

- Usa o mesmo `AppTemplate`.
- Reutiliza `PostCard` na variante `detail` (thumbnail 320px, título 22px).
- Bloco “Código:” com `content` em Roboto Mono e `overflow-x-auto`.
- Comentários com fundo `bg-field` e texto `text-field-ink`, como no Figma.
- Threads de 1 nível, com “Responder” inline.
- Formulário de comentário só para logado; visitante vê CTA “Entre para comentar”.
- Ações de curtir/comentar iguais às do feed.

### 2.6 Publicar

Formulário com:

- título;
- descrição;
- código;
- URL do thumbnail (opcional);
- tags separadas por vírgula.

Erros de validação/API via `problem-details`; `POST /posts` e redireciona para
`/posts/:id`. Visitante é mandado ao login.

> A tela **Publicar** do Figma não pôde ser lida por causa do limite do MCP. O formulário
> segue os tokens e o padrão dos formulários existentes; ajustes finos podem ser feitos
> quando o design estiver acessível.

### 2.7 Placeholder de thumbnail

`PostThumbnail` cobre:

- `thumbnailUrl` ausente (`null`/vazio);
- erro de carregamento (`onError`).

Fallback: bloco `bg-surface-soft` com `BrandMark` em baixa opacidade, texto “Sem prévia”
e `aria-label`. O container externo usa `bg-field` com padding 24px, como no design.

### 2.8 Testes do web

- `PostThumbnail` (com imagem, sem imagem e `onError`);
- `PostCard` (dados, tags, ações, autor, visitante vs logado);
- `SideMenu` (Login vs Sair e logout);
- `FeedPage` (busca, tags, estado vazio);
- `PostPage` (comentário logado vs CTA visitante);
- `PublishPage`;
- `posts-service` e `tags-service` com axios mockado;
- `App.test.jsx` para as novas rotas e fallback;
- testes de acessibilidade jsdom para `FeedPage` e `PostPage`. O Playwright só sobe o
  Vite, então `/feed` não entra na lista de rotas do `a11y.spec.js` sem mock de API.

## 3. Assets e fidelidade visual

- Baixar thumbnails e avatar do Figma para `apps/web/public/seed/`.
- Ícones exatamente como no design (Material Icons): `search`, `feed`,
  `account_circle`, `info`, `logout`, `chat`, `share`, `code`.
- O design mostra as tags do card com fundo igual ao card (invisíveis). Corrigir para
  `bg-field text-field-ink`, como os chips do filtro.
- O ícone de curtir precisa ser decidido: coração (semântica de curtir) ou manter o
  glifo `code` do Figma.

## 4. Documentação e commits

- README: seed, usuários demo, endpoints e busca.
- `AGENTS.md`: tabelas novas, seed, auth opcional e convenções de layout/sessão.
- Log da sessão em `prompts/sessoes/AAAA-MM-DD-HHMM-opencode.md`, sanitizado.
- Commits sugeridos:
  - `feat(api): add posts, tags, comments and likes schema`
  - `feat(api): expose feed with full-text search and post interactions`
  - `feat(api): seed mocked posts with thumbnails`
  - `feat(web): add app layout and session-aware side menu`
  - `feat(web): add feed page with search and tag filters`
  - `feat(web): add post detail, comments and likes`
  - `feat(web): add publish post page`
  - `docs: document the posts feed and seed`

## 5. Validação

O `pnpm.exe` está bloqueado nesta máquina; usar os workarounds do `AGENTS.md`:

```powershell
docker compose up -d --wait

cd apps/api
node node_modules/drizzle-kit/bin.cjs generate
node node_modules/drizzle-kit/bin.cjs migrate
node node_modules/@nestjs/cli/bin/nest.js start --entryFile db/seed
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run --config ./vitest.config.e2e.ts
node node_modules/@nestjs/cli/bin/nest.js build

cd ../../apps/web
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
```

Verificação funcional:

1. Visitante abre `/feed`, busca e filtra por tags.
2. Visitante clica em curtir/comentar → vai para `/login`.
3. Login com usuário do seed → volta para `/feed`; menu mostra **Sair**.
4. Curtir, descurtir, comentar, responder e publicar.
5. Post sem thumbnail e post com URL inválida exibem o placeholder.
6. Busca textual e filtro de tags retornam apenas posts compatíveis.
7. `/conta` continua funcionando e o menu alterna Login/Sair corretamente.

## 6. Decisões aplicadas

1. **Publicar:** página `/publicar` implementada com título, descrição, código, thumbnail opcional
   e tags; visitante é levado ao login.
2. **Handles/avatares:** `username` e `avatar_url` adicionados como colunas nullable em `users`.
   Usuários do seed têm handles explícitos; contas reais derivam `@handle` do nome.
3. **Curtida:** coração (`favorite`/`favorite_border`) no lugar do glifo `code` do Figma, e a
   segunda aba virou **Mais curtidos**.
4. **Comentários:** threads de um nível, com o backend normalizando respostas a respostas para o
   comentário pai.
