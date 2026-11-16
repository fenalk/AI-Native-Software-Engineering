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
- [ ] `pnpm web test`, `pnpm web lint`, `pnpm api lint` — e confirmar que o lint **realmente falha** (achado P1 #6).
- [ ] `git diff a8ea2b5..HEAD --stat` vazio no commit inicial da branch.
- [ ] Sanitizar caminhos absolutos no plano/relatórios (regra de segurança de commit do `AGENTS.md`).

## 2. Achados preliminares

Formato: **Severidade — arquivo/linha — o que está errado — como corrigir**. Cada item vira
uma issue ou um commit.

### P0

1. **Crítica** — `apps/api/src/posts/posts.schemas.ts:32` — `thumbnailUrl` aceita qualquer
   string (inclusive `javascript:` e `data:`) e é persistido; o web usa o valor em
   `<img src>` (`PostCard.jsx:20,31`). Também abre SSRF em consumidores e quebra CSP futura.
   — Validar com `z.url({ protocol: /^https?$/ })` **ou** `z.string().startsWith('/')`
   (root-relative), unificar a regra no schema e testar `javascript:`/`data:` como `400`.
2. **Alta** — `apps/api/src/auth/jwt.config.ts:5` — `JWT_SECRET ?? 'dev-only-insecure-secret'`
   é silencioso; sem a env em produção o app sobe e assina/valida tokens com segredo público.
   — Falhar no boot fora de `NODE_ENV=development|test` (Zod no `ConfigModule`) e não
   empacotar o fallback no build de produção.
3. **Alta** — `apps/api/src/main.ts:1-9` — sem `enableCors`, sem `helmet` e sem limite de body
   explícito; `POST /posts` aceita `content` de 20 000 caracteres com requests ilimitados.
   — Adicionar `helmet()`, `express.json({ limit: '100kb' })` e `ThrottlerModule`
   (`@nestjs/throttler`) em `POST /sessions`, `POST /users` e `POST /posts/:id/comments`.
4. **Alta** — `apps/api/src/common/problem-details.filter.ts:78-110` — `describe()` devolve a
   `message` de qualquer `HttpException`; hoje a mensagem é fixa, mas a classe permite vazar
   detalhe interno (driver `pg`, `cause`) quando alguém passar a mensagem do erro. — Restringir
   a `message` aos tipos de exceção conhecidos, cobrir com teste e nunca expor `cause`/stack.
5. **Alta** — `apps/api/src/auth/auth.service.ts:22-33` — sem throttler e sem *constant time*
   no caminho em que o e-mail não existe (não há `scrypt` quando `credentials` é `null`) →
   timing oracle e brute force em `/sessions`. — Rodar `scrypt` contra hash dummy quando o
   usuário não existe e limitar a rota (ex.: 5/min por IP).

### P1

6. **Alta** — `apps/api/package.json:18` e `apps/web/package.json:9` — `lint` é `oxlint …`
   sem `--deny-warnings`: o oxlint sai com `0` mesmo encontrando problema, então o "lint de
   tudo" no CI é sinal verde falso. — Adicionar `--deny-warnings` e rodar o lint no CI.
7. **Alta** — `apps/api/src/posts/posts.controller.ts:154-163` — `GET /:id/comments/:commentId`
   existe no controller mas diverge do contrato: sem `ApiBearerAuth`/`Location`, e `commentId`
   usa `postIdSchema`. — Criar `commentIdSchema`, documentar no Swagger e testar e2e o par
   `postId` divergente → `404`.
8. **Média** — `apps/api/src/posts/posts.repository.ts:51-53` — duas subqueries correlacionadas
   por linha e `findPage` em duas queries (count + página) não transacionais; `popular` ordena
   por subquery sem índice → full scan conforme POSTS cresce. — Materializar contadores com
   `leftJoin` + `group by` ou `lateral`, indexar `post_likes(post_id)` e ler em
   `REPEATABLE READ` se a contagem precisar ser consistente.
9. **Média** — `apps/api/src/posts/posts.repository.ts:213-247` — `upsertTags` faz
   `onConflictDoNothing` seguido de re-leitura sem `orderBy` estável; é uma corrida possível
   (post salvo sem tag). — `orderBy(tags.slug)` explícito e teste concorrente em e2e.
10. **Média** — `apps/web/src/pages/FeedPage/FeedPage.jsx:159-204` e
    `apps/web/src/pages/PostPage/PostPage.jsx:53-100` — `handleLike` é quase duplicado (rollback
    otimista + logout em `401`), e as flags `loading`/`error` se sobrepõem: trocar filtro depois
    de um erro mostra lista vazia sem feedback. — Extrair `usePostLike` e centralizar os estados
    `idle/loading/error/empty` em uma máquina de estados.
11. **Média** — `apps/web/src/App.jsx:20,32` — `POST_PATH` aceita qualquer segmento, então
    `/posts/%2F` renderiza `PostPage` e dispara `GET /posts/%2F`. — Validar UUID no matcher e
    curto-circuitar para `404`/login.
12. **Média** — `apps/api/test/*` — a matriz e2e não cobre autorização cruzada (comentário de
    outro post, `parentId` alheio) nem like/unlike concorrentes. — Adicionar os casos de
    autorização e idempotência paralela.
13. **Baixa** — `apps/web/src/components/atoms/PostThumbnail/PostThumbnail.jsx:21-27` — `<img>`
    sem `width`/`height`, e `loading="lazy"` também na variante `detail` (imagem acima da
    dobra), contradizendo `plans/performance-web.md`. — Prop `priority`, dimensões explícitas e
    `aspect-ratio`.
14. **Baixa** — `apps/web/public/seed/*.png` — arquivos `.png` que são JPEG (feed-02..06) e
    `feed-01.png` com 409 KB para um thumbnail de 240 px. — Renomear para `.jpg`/`.webp`,
    converter e reduzir ao tamanho de exibição (2×).
15. **Baixa** — `apps/api/src/db/seed.ts:23,262-300` — `DEMO_PASSWORD = 'senha-segura'` em
    código e seed destrutivo: se `DATABASE_URL` não apontar para o banco de dev, apaga dados
    reais. — Guard de `NODE_ENV` (nunca em produção) e confirmação explícita antes do truncate.
16. **Baixa** — `.env` na raiz e `apps/api/.env` com as credenciais padrão do compose —
    verificar que nenhum `.env` está versionado (`git ls-files | grep -i env`) e que
    `DATABASE_URL` não aparece em logs.
17. **Baixa (CI)** — `.github/workflows/claude-code-review.yml:44` — `--allowedTools` libera
    só `gh pr comment/diff/view`; sem `Read`/`Grep`/`Glob` o agente pode falhar ao ler
    `apps/api/AGENTS.md`. Falta `concurrency` (todo push em PR aberto paga review) e filtro
    por `paths`. — Permitir as tools de leitura, adicionar
    `concurrency: { group: claude-review-${{ github.ref }}, cancel-in-progress: true }` e
    `paths`.

### P2

18. **Baixa** — `apps/web/src/App.jsx:24-63` — a navegação usa `href` + `window.location`, e
    `AccountPage` fica fora do `SessionProvider`; conferir hard reload em `/conta` e `/posts/:id`
    e documentar o comportamento.
19. **Baixa** — `apps/api/src/posts/posts.service.ts:162-169` — `PostAuthorDto` expõe o `id`
    interno do usuário; é aceitável hoje, mas expor o `UserRow` cru abre espaço para
    mass assignment futuro. — Manter os campos explícitos e adicionar teste de contrato do DTO.

> **Veredito provisório:** o código **não** está aprovado sem pendências. Há 5 P0 (2 com
> exploração direta, 3 de validação de borda/CI) e 3 itens de contrato quebrado.

## 3. Entregáveis da branch

- `plans/code-review-seguranca.md` (este plano) — commit `docs(review): add security audit plan`.
- PR de auditoria aberto, com o comentário real do Claude Code Review (não simulado).
- Um commit por achado corrigido, com teste de regressão (`*.spec.ts` / `*.test.jsx`).
- Checklist permanente no `AGENTS.md`.
- Log de sessão sanitizado em `prompts/sessoes/`.

## 4. Commits sugeridos

- `docs(review): add security audit plan`
- `chore(review): add security audit baseline`
- `fix(api): reject non-http thumbnail urls`
- `fix(api): require jwt secret outside development`
- `fix(api): add helmet, body limit and request throttling`
- `fix(api): document the comment resource and validate its id`
- `fix(web): share the optimistic like handler between feed and post`
- `ci: fail lint on warnings and scope the review workflow`
- `docs(review): record audit outcome`

## 5. Validação

`pnpm.exe` está bloqueado nesta máquina; usar os workarounds do `AGENTS.md`:

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
2. Subir a API com `NODE_ENV=production` e sem `JWT_SECRET` → boot falha com erro claro.
3. `POST /sessions` acima do limite → `429` com `Retry-After`.
4. Fluxo completo (feed → detalhe → curtir → comentar → publicar) sem regressão.
5. O PR de auditoria recebe um comentário do workflow e o lint falha quando há warning.

## 6. Critérios de aceite

- [ ] Nenhum P0/P1 aberto sem justificativa escrita.
- [ ] `pnpm api test`, `pnpm api test:e2e`, `pnpm web test` verdes após as correções.
- [ ] `pnpm lint` falha quando há warning (prova de que o gate funciona).
- [ ] `git status` limpo, sem `.env`/`.pem`/`.key` no diff e sem caminho absoluto.
- [ ] O workflow de review responde em um PR de teste **e** em um PR real.

## 7. Fora de escopo

1. **Pentest dinâmico / DAST, deploy real e headers de produção**: dependem de HTTPS e de
   ambiente publicado, mesma decisão de `plans/performance-web.md`.
2. **Refresh tokens e revogação de JWT**: decisão de arquitetura, não regressão; registrar como
   ADR futura.
3. **RBAC/roles**: o modelo atual só conhece o autor (não há role); qualquer regra além de
   "só o autor edita" exige produto.

## 8. Riscos

| Risco | Mitigação |
|---|---|
| Corrigir o P0 #1 muda o contrato de `thumbnailUrl` | Anunciar como `BREAKING CHANGE`, aceitar `/seed/...` no seed e testar `400` para `javascript:` |
| `pnpm.exe` bloqueado impede validação local | Rodar via `node node_modules/…` e validar o CI no GitHub |
| O workflow sem permissão de leitura falha sem alarme | Smoke test no próprio PR de auditoria antes de confiar nele |

## Observações

- Nenhum arquivo da aplicação foi alterado por este plano; ele é somente documental.
- Os achados foram levantados por leitura estática em `a8ea2b5`; a confirmação de cada um
  ocorre na triage da branch, com reprodução e teste antes da correção.
