# AGENTS.md

## Estrutura do repositório

- Workspace pnpm (`pnpm-workspace.yaml` → `apps/*`), um único repositório git na raiz. Sandbox do curso de AI-Native Software Engineering da Alura; nenhum domínio de negócio implementado ainda.
- `apps/web` — React 19 + Vite 8, **JavaScript puro** (sem TypeScript).
- `apps/api` — NestJS 12, TypeScript em modo **ESM**, testes com Vitest.
- `Setup/` — material de estudo do curso (conceitos de modelos de IA), não é código da aplicação. Não importe nem "corrija".
- Ainda **não há integração**: o web não chama a API, e a API não tem CORS nem proxy do Vite configurados.

## Comandos

Execute a partir da raiz do repositório. `pnpm web <cmd>` e `pnpm api <cmd>` repassam qualquer comando para o app indicado.

| Objetivo | Comando |
|---|---|
| Os dois servidores de desenvolvimento | `pnpm dev` |
| Só web (5173) / só API (3000) | `pnpm dev:web` / `pnpm dev:api` |
| Um teste unitário da API | `pnpm api test src/app.controller.spec.ts` |
| Um teste de componente web (após configuração) | `pnpm web test src/components/atoms/Button.test.jsx` |
| Testes unitários em modo watch | `pnpm api test:watch` |
| Testes e2e da API | `pnpm api test:e2e` |
| Lint de tudo / build de tudo | `pnpm lint` / `pnpm build` |

- O `pnpm test` da raiz roda `vitest run` e considera apenas `**/*.spec.ts`; os e2e (`test/**/*.e2e-spec.ts`) precisam de `pnpm api test:e2e`.
- A porta da API respeita `PORT` (padrão 3000).

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
- **Tailwind CSS** é o sistema de estilização (ainda não instalado — adicione com o plugin do Vite quando começar a primeira tarefa de UI). Estilize com classes utilitárias no JSX; sem CSS-in-JS, arquivos CSS por componente ou props `style` avulsas. CSS global serve apenas para reset/tokens.
- Todo componente deve vir com um teste cobrindo seu uso essencial (renderiza com as props principais + interação principal), colocado como `Component.test.jsx`. Verifique comportamento, não snapshots de marcação.
- Ainda não existe runner de testes no web: quando o primeiro componente for criado, adicione Vitest + `@testing-library/react` (jsdom) e um script `test` para que o `pnpm test` da raiz também cubra o web.
- Apenas oxlint (`react/rules-of-hooks` é erro).

## Convenções do Git

- Um único repositório na raiz; nunca rode `git init` dentro de `apps/*`.
- Use **Conventional Commits** nos dois apps: `<type>(<scope>): <subject>`, ex.: `feat(web): add button atom`, `fix(api): return 404 when user is missing`.
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - O escopo é `web` ou `api`; omita-o para mudanças no repositório como um todo. O assunto vai no imperativo, em minúsculas, em inglês (acompanha o histórico existente), sem ponto final.
  - Use o corpo para explicar o *porquê* quando não for óbvio; mudanças que quebram compatibilidade vão no rodapé `BREAKING CHANGE:`.
- Uma mudança lógica por commit; não misture mudanças de web e api.
- Ainda não existem hooks de commit nem verificação de lint — siga a convenção manualmente.

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
