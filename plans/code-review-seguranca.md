# Plano — Code Review e Análise de Segurança

## Objetivo

Criar a branch `review/security-audit` para estabelecer o processo de code review e
auditoria de segurança do sandbox e **entregar as correções** do que for encontrado.

A branch não é um relatório solto: ela é o snapshot auditado, no qual cada achado vira um
commit verificável e uma regra permanente (AGENTS.md e CI) para não regredir.

O workflow de review já existe (`.github/workflows/claude-code-review.yml`, commit
`a8ea2b5`), mas ninguém o está usando: a análise precisa rodar de verdade sobre um diff,
contra o contrato do projeto.

## Contexto da alteração

| Item | Valor |
|---|---|
| Linguagem | TypeScript ESM (API, NestJS 12) + JavaScript/JSX puro (web, React 19 + Vite 8) |
| Stack | Drizzle ORM + PostgreSQL 17, JWT (passport-jwt), `scrypt`, Zod via Standard Schema |
| Base | commit `a8ea2b5` (`ci: add claude code review workflow`), que já contém feed, auth e integração web |
| Testes | Vitest (unit + e2e com `ainative_test`), oxlint (sem `--deny-warnings`) |
| Restrição local | `pnpm.exe` bloqueado (Device Guard) — usar os workarounds do `AGENTS.md` |

### Objetivo da alteração

1. Rodar o workflow de review em um PR de auditoria (branch **chore**, não feature).
2. Produzir achados priorizados: severidade, arquivo/linha, o que está errado e como corrigir.
3. Corrigir na mesma branch o que for P0/P1, com teste de regressão.
4. Fechar com regras que bloqueiem o CI quando o achado reaparecer.

## O que deve ser analisado

- **Bugs e logs** — erros engolidos, handlers async fora do `try`, logs vazando PII/stack,
  formato do `ProblemDetailsFilter`, status e códigos de erro.
- **Segurança** — authn/authz, validação de entrada e de saída, SSRF, XSS, enumeração de
  usuários, rate limiting, headers/CORS, segredos e `.env`, inputs de prompt (MCP) e cadeia
  de CI.
- **Performance** — N+1, `select *` com payload grande, índices, subqueries na paginação,
  render/`useEffect` no web, assets.
- **Manutenibilidade** — direção de imports do Atomic Design, duplicação de DTO/schema,
  coerção de erro, testes frágeis, licenças.
- **Edge cases** — comentários aninhados, `page` além do total, `search` vazio ou malicioso,
  IDs malformados, `Content-Type` inesperado.

## 1. Fluxo da branch

| Passo | Comando / saída |
|---|---|
| Criar a branch | `git switch -c review/security-audit a8ea2b5` |
| PR de auditoria | `chore(review): add security audit baseline` dispara `claude-code-review.yml` |
| Triage | este documento, com a tabela de achados em `plans/code-review-seguranca.md` (§2) e status por item (`open` / `fixed` / `accepted`) |
| Correções | um commit por achado (`fix(api): …` / `fix(web): …`), só api **ou** só web |
| Fechamento | `docs(review): record audit outcome` + regras de CI |

### Preflight obrigatório

- [ ] Reproduzir localmente: `docker compose up -d --wait`, `pnpm api db:migrate`, `pnpm api db:seed`.
- [ ] `pnpm api test` e `pnpm api test:e2e` verdes na base; senão a auditoria fica contaminada.
- [ ] `pnpm web test`, `pnpm web lint`, `pnpm api lint` — e confirmar que o lint **realmente falha** (achado #9).
- [ ] O único commit da branch antes das correções é `docs(review): add security audit plan`
      (`git diff a8ea2b5..HEAD --stat` mostra só `plans/`).
- [ ] Secret `CLAUDE_CODE_OAUTH_TOKEN` configurado no repositório; sem ele o workflow falha em silêncio.
- [ ] Varrer o **histórico**, não só o working tree (regra 5 do `AGENTS.md`):
      `git log --all --oneline -- '*.env' '*.pem' '*.key'` vazio e `gitleaks detect` (ou equivalente) sem achados.
- [ ] `pnpm audit --prod` nos dois apps e revisão de licenças das dependências diretas.
- [ ] Sanitizar caminhos absolutos no plano/relatórios (regra de segurança de commit do `AGENTS.md`).

## 2. Achados

Formato: **Severidade — arquivo/linha — o que está errado — como corrigir**. Cada item vira
uma issue ou um commit. Os itens foram conferidos contra o código em `a8ea2b5`; a coluna
"Revisão" registra o que mudou em relação ao levantamento preliminar.

### P0

1. **Alta** — `apps/api/src/auth/jwt.config.ts:5` + `auth.module.ts:14` + `jwt.strategy.ts:19` —
   `JWT_SECRET ?? 'dev-only-insecure-secret'` é avaliado **no import do módulo**, antes de
   `ConfigModule.forRoot()` carregar o `.env` (os imports ESM são resolvidos antes do decorator
   do `AppModule`). Resultado: mesmo com `JWT_SECRET` no `apps/api/.env`, a API assina com o
   segredo público, a menos que a variável venha do ambiente do processo. `.env.example` também
   não lista `JWT_SECRET`. — Trocar para `JwtModule.registerAsync` + `ConfigService.getOrThrow`
   (e `secretOrKey` da strategy pelo mesmo provider), validar o env com Zod no `ConfigModule`
   (`validate`), falhar no boot fora de `development|test`, adicionar `JWT_SECRET` ao
   `.env.example`. Teste: token assinado com `'dev-only-insecure-secret'` → `401` quando o
   `.env` define outro segredo.
2. **Alta** — `apps/api/src/auth/auth.service.ts:22-33` + `auth.schemas.ts:5` — sem rate limit,
   sem `scrypt` quando o e-mail não existe (timing oracle) e `password` do login **sem `max`**
   (o cadastro limita a 128): cada request pode forçar `scrypt` sobre ~100 KB. — Rodar `scrypt`
   contra hash dummy quando o usuário não existe, `.max(128)` no `signInSchema` e limitar a rota
   (ex.: 5/min por IP).
3. **Alta** — `apps/api/src/main.ts:1-9` — sem rate limiting, sem `helmet` e com
   `X-Powered-By: Express` e Swagger (`/docs`, `/docs-json`) expostos em qualquer ambiente. —
   `ThrottlerModule` (`@nestjs/throttler`, primeira linha) em `POST /sessions`, `POST /users` e
   `POST /posts/:id/comments`; `app.disable('x-powered-by')`; Swagger só fora de produção;
   avaliar `helmet` (pacote de terceiros: ler `apps/api/AGENTS.md` antes). **Revisão:** o
   body-parser do Express já aplica `100kb` por padrão — tornar o limite explícito é bom, mas
   não é vulnerabilidade. Não chamar `enableCors`: sem CORS a API só aceita a mesma origem (via
   proxy), que é o padrão mais seguro.
4. **Média** — `apps/api/src/posts/posts.schemas.ts:32` — `thumbnailUrl` aceita qualquer string
   e é renderizado em `<img src>` (`PostCard.jsx:20,31`, `PostThumbnail.jsx:22`). **Revisão:**
   `javascript:` em `<img src>` não executa em navegadores atuais, então não é XSS hoje; o risco
   real é URL externa arbitrária (rastreamento de IP/Referer de quem lê o feed, mixed content) e
   XSS futuro se o valor for para um `href`. Nenhum código do servidor busca a URL, então não há
   SSRF hoje. — `z.url({ protocol: /^https$/ })` **ou** `z.string().startsWith('/')`
   (root-relative), teste `javascript:`/`data:`/`http:` → `400`. Continua P0 por ser contrato
   (mudar depois quebra dados persistidos).
5. **Média** — `apps/api/src/common/problem-details.filter.ts:45-47` — `this.logger.error(exception)`
   loga a exceção inteira em todo `500`. Um `DrizzleQueryError` inclui o SQL e os **parâmetros**
   (`email`, `password_hash`, `body`), então logs viram vazamento de PII/credencial. — Logar
   `name`, `message` sem parâmetros e um id de correlação; teste com erro de query simulado.
6. **Média** — `apps/api/src/common/problem-details.filter.ts:78-110` — `describe()` devolve a
   `message` de qualquer `HttpException`. **Revisão:** hoje todas as mensagens são fixas;
   preventivo (era "Alta"). — Restringir aos tipos conhecidos, nunca expor `cause`/stack, teste.

### P1

7. **Alta (CI)** — `.github/workflows/` — o **único** workflow é o `claude-code-review.yml`: não
   há job de teste, lint ou build. As "regras de CI" do fechamento não têm onde rodar. — Criar
   `ci.yml` com `services: postgres:17`, `pnpm api test`, `pnpm api test:e2e`, `pnpm web test`,
   `pnpm lint`, `pnpm build`, como check obrigatório da branch `main`.
8. **Média (CI)** — `.github/workflows/claude-code-review.yml:19,24,44` — actions referenciadas
   por tag (`@v4`, `@v1`), não por SHA; falta `concurrency` (todo push paga review) e filtro por
   `paths`; o diff do PR é entrada não confiável para o agente (prompt injection). — Pinar por
   SHA, `concurrency: { group: claude-review-${{ github.ref }}, cancel-in-progress: true }`,
   `paths`, e manter o `--allowedTools` restrito a leitura + `gh pr comment`. **Revisão:**
   confirmar no smoke test se `Read`/`Grep`/`Glob` já vêm habilitados por padrão na action antes
   de adicioná-los.
9. **Alta** — `apps/api/package.json:18` e `apps/web/package.json:9` — `lint` sem
   `--deny-warnings`: o oxlint sai com `0` mesmo com warnings. — `--deny-warnings` + job do #7.
10. **Média** — `apps/api/src/users/users.service.ts:47-49` — `POST /users` responde
    `409 Email already registered`: enumeração de usuários, e sem rate limit. — Aceitar
    explicitamente (UX de cadastro) com throttler do #3 **ou** resposta neutra; registrar a decisão.
11. **Média** — `apps/api/src/posts/posts.schemas.ts:22` — `page` sem máximo: `?page=10000000`
    gera `OFFSET` enorme sobre subqueries correlacionadas (custo linear por request anônimo). —
    `max` em `page` (ou `offset ≤ N`) e e2e de `page` além do total → `items: []`, `200`.
12. **Média** — `apps/api/src/posts/posts.repository.ts:51-53,98-110` — duas subqueries
    correlacionadas por linha, `count` separado e `popular` ordenado por subquery → custo cresce
    com `posts`. **Revisão:** a PK `(post_id, user_id)` de `post_likes` já indexa `post_id`; não
    criar índice novo. — Agregar com `leftJoin` + `group by`/`lateral` ou contador
    desnormalizado; medir com `EXPLAIN ANALYZE` antes e depois.
13. **Média** — `apps/web/src/pages/FeedPage/FeedPage.jsx:159` e
    `apps/web/src/pages/PostPage/PostPage.jsx:53` — `handleLike` duplicado (rollback otimista +
    logout em `401`) e `loading`/`error` sobrepostos. — Extrair `usePostLike` e estados
    `idle/loading/error/empty`.
14. **Média** — `apps/web/src/App.jsx:20,32` + `services/posts-service.js:31-62` — `POST_PATH`
    aceita qualquer segmento e o `postId` é interpolado sem `encodeURIComponent`; `/posts/..`
    vira `GET /api/posts/..` → `GET /` na API. — Validar UUID no matcher e codificar o segmento.
15. **Média** — `apps/api/test/*` — e2e não cobre: `GET /posts/:id/comments/:commentId`
    (inclusive `postId` divergente → `404`), `parentId` de outro post → `400`, like/unlike
    concorrentes, `page` além do total, `Content-Type` inesperado (`text/plain` → `400/415`).
16. **Baixa** — `apps/web/src/session/session-storage.js` — o access token (com `email` no
    payload) fica em `localStorage`/`sessionStorage`; qualquer XSS o rouba. Sem CSP no
    `index.html`. — Registrar como risco aceito, remover `email` do payload se não for usado e
    planejar CSP (ver fora de escopo).

### P2

17. **Baixa** — `apps/api/src/posts/posts.controller.ts:154-163` — `commentId` usa
    `postIdSchema`. **Revisão:** é o mesmo `z.uuid()` e o endpoint é `GET` público, então
    `ApiBearerAuth`/`Location` não se aplicam (era "Alta"). — Renomear para `uuidSchema` ou criar
    `commentIdSchema`; cobertura e2e no #15.
18. **Baixa** — `apps/api/src/posts/posts.repository.ts:233-246` — `upsertTags`. **Revisão:**
    em `READ COMMITTED`, `ON CONFLICT DO NOTHING` espera a transação concorrente e o `SELECT`
    seguinte já enxerga a linha commitada, então "post salvo sem tag" não deve ocorrer. —
    Provável falso positivo; provar com e2e concorrente e fechar como `accepted`.
19. **Baixa** — `apps/web/src/components/atoms/PostThumbnail/PostThumbnail.jsx:21-27` — sem
    `width`/`height` e `loading="lazy"` também no `detail`. — Prop `priority` e dimensões.
20. **Baixa** — `apps/web/public/seed/feed-02..06.png` são JPEG; `feed-01.png` é PNG 1380×920
    para thumbnail de 240 px. — Renomear/converter para `.webp`/`.jpg` em 2×.
21. **Baixa** — `apps/api/src/db/seed.ts:23,255-275` — senha demo em código, `delete` de todos os
    posts/tags e **upsert que sobrescreve `password_hash`** de contas com os e-mails do seed. —
    Guard de `NODE_ENV` e confirmação explícita.
22. **Baixa** — `.env` — **Verificado:** só `apps/*/.env.example` estão versionados e `.env` está
    no `.gitignore`. Falta só a varredura de histórico do preflight.
23. **Baixa** — `apps/web/src/App.jsx:43-45` — `AccountPage` fora do `SessionProvider`;
    navegação por `window.location`. — Documentar o comportamento de hard reload.
24. **Baixa** — `apps/api/src/posts/posts.service.ts:162-169` — `PostAuthorDto` expõe o `id` do
    usuário; aceitável, manter campos explícitos e teste de contrato do DTO.
25. **Baixa** — `apps/api/src/auth/jwt.strategy.ts:16-20` — sem `algorithms: ['HS256']`,
    `issuer`/`audience`. — Fixar algoritmo e `iss`/`aud` no sign e no verify.

> **Veredito provisório:** o código **não** está aprovado sem pendências. Há 6 P0 — o #1
> (segredo do JWT ignorado do `.env`) é o único com exploração direta hoje: quem conhece o
> fallback forja tokens de qualquer usuário — e 10 P1, dos quais 3 são de CI (não existe gate
> automatizado de teste/lint).

## 3. Entregáveis da branch

- `plans/code-review-seguranca.md` (este plano) — commit `docs(review): add security audit plan`.
- PR de auditoria aberto, com o comentário real do Claude Code Review (não simulado).
- Um commit por achado corrigido, com teste de regressão (`*.spec.ts` / `*.test.jsx`).
- Checklist permanente no `AGENTS.md`.
- Log de sessão sanitizado em `prompts/sessoes/`.

## 4. Commits sugeridos

- `docs(review): add security audit plan`
- `chore(review): add security audit baseline`
- `fix(api): load jwt secret from config and require it outside development`
- `fix(api): hash against a dummy credential and cap sign-in password length`
- `fix(api): add request throttling and hide swagger in production`
- `fix(api): reject non-https thumbnail urls` (com `BREAKING CHANGE:`)
- `fix(api): stop logging query parameters on internal errors`
- `fix(api): bound feed pagination`
- `test(api): cover comment lookup, cross-post replies and concurrent likes`
- `fix(web): validate post ids in the router and encode path segments`
- `fix(web): share the optimistic like handler between feed and post`
- `ci: add test, lint and build workflow`
- `ci: fail lint on warnings and pin the review workflow
- `docs(review): record audit outcome`

## 5. Validação

No Windows com Device Guard, `pnpm.exe` está bloqueado; usar os workarounds do `AGENTS.md`
(em Linux/macOS e no CI, os comandos `pnpm` normais funcionam):

```powershell
docker compose up -d --wait

cd apps/api
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run --config ./vitest.config.e2e.ts
node node_modules/oxlint/bin/oxlint --type-aware --deny-warnings src/ test/
node node_modules/@nestjs/cli/bin/nest.js build

cd ../../apps/web
node node_modules/vitest/vitest.mjs run
node node_modules/oxlint/bin/oxlint --deny-warnings
node node_modules/vite/bin/vite.js build
```

Verificação funcional:

1. `POST /posts` com `thumbnailUrl: "javascript:alert(1)"` → `400 problem+json`.
2. Subir a API com `NODE_ENV=production` e sem `JWT_SECRET` → boot falha com erro claro; com
   `JWT_SECRET` só no `apps/api/.env`, um token assinado com `dev-only-insecure-secret` → `401`.
3. `POST /sessions` acima do limite → `429` com `Retry-After`.
4. Fluxo completo (feed → detalhe → curtir → comentar → publicar) sem regressão.
5. O PR de auditoria recebe um comentário do workflow e o lint falha quando há warning.
6. Forçar um erro de banco → o log do `500` não contém `password_hash`, e-mail nem SQL com parâmetros.
7. `GET /posts?page=999999` responde rápido com `items: []`, ou `400` se acima do máximo.

## 6. Critérios de aceite

- [ ] Nenhum P0/P1 aberto sem justificativa escrita.
- [ ] `pnpm api test`, `pnpm api test:e2e`, `pnpm web test` verdes após as correções.
- [ ] `pnpm lint` falha quando há warning (prova de que o gate funciona).
- [ ] `git status` limpo, sem `.env`/`.pem`/`.key` no diff e sem caminho absoluto.
- [ ] O workflow de review responde em um PR de teste **e** em um PR real.
- [ ] `ci.yml` roda como check obrigatório e fica vermelho com um teste quebrado de propósito.
- [ ] Histórico do git sem segredos (`gitleaks`) e `pnpm audit --prod` sem `high`/`critical`.

## 7. Fora de escopo

1. **Pentest dinâmico / DAST, deploy real e headers de produção**: dependem de HTTPS e de
   ambiente publicado, mesma decisão de `plans/performance-web.md`.
2. **Refresh tokens e revogação de JWT**: decisão de arquitetura, não regressão; registrar como
   ADR futura.
3. **CSP e cookies `HttpOnly` para o token**: dependem do host de produção; o risco fica
   registrado no #16.
4. **RBAC/roles**: o modelo atual só conhece o autor (não há role); qualquer regra além de
   "só o autor edita" exige produto.

## 8. Riscos

| Risco | Mitigação |
|---|---|
| Corrigir o P0 #4 muda o contrato de `thumbnailUrl` | Anunciar como `BREAKING CHANGE`, aceitar `/seed/...` no seed e testar `400` para `javascript:` |
| `pnpm.exe` bloqueado impede validação local | Rodar via `node node_modules/…` e validar o CI no GitHub |
| O workflow sem permissão de leitura falha sem alarme | Smoke test no próprio PR de auditoria antes de confiar nele |
| Trocar o segredo do JWT invalida tokens já emitidos | Esperado (TTL de 1 h); avisar no PR |
| Throttler em memória não vale com várias instâncias | Aceitável no sandbox; registrar que produção precisa de storage compartilhado |

### Observações

- Os achados foram levantados por leitura estática em `a8ea2b5` e conferidos arquivo a arquivo
  na revisão do plano; a confirmação final de cada um ocorreu na triage, com reprodução e teste
  antes da correção (ver §9).
- O plano e o registro de execução são o único conteúdo documental; o código das correções está
  nos commits listados em §9.

## 9. Registro de execução (branch `review/security-audit`)

Cada correção tem commit próprio e teste de regressão. Status: `fixed` (corrigido com teste),
`accepted` (risco aceito e documentado) ou `open`.

| # | Status | Commit / evidência |
|---|---|---|
| 1 JWT do `.env` ignorado | `fixed` | `fix(api): load the jwt secret…` — reproduzido antes: token verificado pelo fallback público = `true`; depois = `false`. `environment.spec.ts`, `jwt.strategy.spec.ts`, e2e com `JWT_SECRET` |
| 2 Login sem throttle/timing | `fixed` | `auth.service.ts` (hash dummy real via `scrypt`) + `@AuthRateLimit()`; teste `hashes the password even when the email is unknown` |
| 3 Sem rate limit/helmet/Swagger | `fixed` | `ThrottlerGuard` global, `configureApp` com `helmet()`, Swagger fora de produção; `hardening.e2e-spec.ts` (429 + `Retry-After`, 413, headers) |
| 4 `thumbnailUrl` livre | `fixed` | `imageUrlSchema`; unit `posts.schemas.spec.ts` + e2e `400` para `javascript:`/`data:`/`http:`/`//host` |
| 5 Log do 500 com parâmetros | `fixed` | `describeForLog` + `problem-details.filter.spec.ts` |
| 6 `describe()` repassa mensagem | `fixed` | 5xx usa `detail` genérico; teste do filtro |
| 7 Sem CI | `fixed` | `.github/workflows/ci.yml` (lint, unit, e2e com Postgres, build) |
| 8 Workflow de review | `fixed` (pinar por SHA pendente) | `concurrency`, `paths`, tools de leitura e aviso de input não confiável. Pinar actions por SHA fica para um PR separado (Renovate/manual) |
| 9 Lint não falha com warning | `fixed` | `--deny-warnings` nos dois apps; `pnpm lint` verde |
| 10 `409` no cadastro | `accepted` | Decisão de UX: e-mail duplicado precisa ser dito no cadastro. Mitigado pelo `@AuthRateLimit()` |
| 11 `page` sem máximo | `fixed` | `MAX_PAGE = 1000`; e2e de `page` acima do máximo e além do total |
| 12 Subqueries na paginação | `fixed` | `findPage` pagina em `recent` e ordena `popular` em memória (EXPLAIN 5115 → 302) |
| 13 Like duplicado/estados | `fixed` | hook `usePostLike` + `VIEW` em `FeedPage`; `usePostLike.test.jsx` |
| 14 Rota com id inválido | `fixed` | matcher UUID em `App.jsx` e `postPath()` no serviço; testes de `/posts/..` e `%2F` |
| 15 Cobertura e2e faltante | `fixed` | `contract edges` em `posts.e2e-spec.ts` |
| 16 Token em `localStorage` | `accepted` | Fora de escopo (CSP e cookies dependem do host); CSP desligada no helmet de propósito |
| 17 `commentId` com `postIdSchema` | `fixed` | `commentIdSchema` + e2e do par divergente → `404` |
| 18 `upsertTags` sem ordem | `fixed` | `orderBy(tags.slug)`; concorrência coberta por e2e |
| 19 Thumbnail sem dimensões/`lazy` no detalhe | `open` | Explicitly deferred: precisa de `width`/`height` por variante; `plans/performance-web.md` cobre o LCP |
| 20 Seed PNGs que são JPEG | `open` | Mudança de assets; fica com o plano de performance |
| 21 Seed destrutivo/reseta senha | `fixed` | `assertSeedAllowed` + `onConflictDoNothing`; `seed-guard.spec.ts` |
| 22 `.env` versionado | `fixed` (verificado) | `git ls-files` só lista `.env.example`; histórico sem `.env`/`.pem`/`.key` |
| 23 `/conta` fora do provider | `accepted` | A página lê o usuário de `GET /users/me` por conta própria; hard reload coberto por `App.test.jsx` |
| 24 `PostAuthorDto.id` | `accepted` | Campo explícito, sem mass assignment; teste de contrato no e2e |
| 25 Estratégia sem `algorithms`/`iss`/`aud` | `fixed` | `algorithm: HS256`, `issuer`, `audience` no sign e no verify; teste `pins the expected claims and algorithm` |

### Preflight executado

- `pnpm audit --prod`: **No known vulnerabilities found**.
- `git ls-files | grep -iE '\.env$|\.pem$|\.key$'`: só `.env.example`.
- `git log --all -- '*.env' '*.pem' '*.key'`: vazio.
- Nenhum caminho absoluto no diff `origin/main...HEAD`.
- Suítes após as correções: API 55 unit + 39 e2e, web 115.

### Pendências conhecidas

1. **Workflow de review não roda**: o job falha com `Claude Code is not installed on this
   repository`. É preciso instalar o app em `github.com/apps/claude` no repositório (ou trocar
   por `ANTHROPIC_API_KEY`). Não é resolvido por código.
2. **`popular` é aproximado** quando o feed passa de uma página (ver #12).
3. **Actions pinadas por tag** em `ci.yml` e `claude-code-review.yml`; pinar por SHA é o próximo
   passo de supply chain.
4. **#19 e #20** ficam com `plans/performance-web.md`.
5. **Branches antigas**: `claude-code-review.yml` só roda em `pull_request`, então um push
   direto nesta branch não dispara o review. A branch precisa de um PR aberto para ele rodar.
6. **Flaky corrigido**: o teste de cadastro (`RegisterPage`) estourava o timeout padrão de 5s
   sob carga; ganhou `userEvent` sem delay e timeout explícito de 15s.
