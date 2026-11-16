# Plano — Web: integração com a API via axios

## Objetivo

Ligar o app `apps/web` à API já existente em `apps/api`, que hoje expõe Swagger e
autenticação JWT:

- `POST /sessions` — login, devolve `{ accessToken, tokenType, expiresIn }`;
- `POST /users` — cadastro, `201` + header `Location`;
- `GET /users/me` — usuário logado, protegido por Bearer.

O web hoje só faz `console.info` nos formulários de login e cadastro. Nesta etapa ele
passa a cadastrar, autenticar, guardar a sessão e consultar `/users/me`. Toda a mudança
fica em `apps/web` e na documentação; **a API não é alterada**.

## Decisões

| Tema | Decisão |
| --- | --- |
| Transporte | `axios`, consumindo URLs relativas `/api` |
| Conexão web → API | Proxy do Vite (`/api` → `http://localhost:3000`), sem CORS |
| Campo de login | Renomear "Email ou usuário" para "Email", pois `POST /sessions` só aceita `email` |
| Pós-login | Nova página `/conta`, que consulta `GET /users/me` e permite sair |
| "Lembrar-me" | Marcado → `localStorage`; desmarcado → `sessionStorage` |

## 1. Dependência, proxy e ambiente

Instalar `axios` em `apps/web`. Como o `pnpm.exe` está bloqueado nesta máquina, seguir o
workaround do `AGENTS.md`: baixar uma build em JS do pnpm com `npm pack` e executar
`node <dir>/package/bin/pnpm.cjs --filter web add axios`. O `pnpm-lock.yaml` é atualizado
junto.

Em `apps/web/vite.config.js`, adicionar:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

Assim `/api/sessions` chega ao Nest como `/sessions`, sem prefixo novo na API e sem CORS.
Repetir o bloco em `preview.proxy` para `vite preview` e para o Playwright.

Criar `apps/web/.env.example` (não é ignorado pelo `.gitignore`) com:

```dotenv
# Em produção, aponte para a API ou mantenha /api e roteie no host.
VITE_API_URL=/api
```

## 2. Estrutura de arquivos

```text
apps/web/src/
├── services/                    # nova camada de acesso à API
│   ├── api-client.js            # instância axios + interceptor de token
│   ├── auth-service.js          # signIn, signUp, getCurrentUser
│   ├── session-storage.js       # token em localStorage/sessionStorage
│   ├── problem-details.js       # leitura de erros RFC 9457
│   ├── api-client.test.js
│   ├── auth-service.test.js
│   ├── session-storage.test.js
│   └── problem-details.test.js
├── pages/
│   ├── LoginPage/               # integração real com POST /sessions
│   ├── RegisterPage/            # POST /users + login automático
│   └── AccountPage/             # nova: /conta, GET /users/me e logout
├── components/
│   ├── atoms/TextInput/         # aria-invalid e aria-describedby
│   └── molecules/FormField/     # mensagem de erro por campo
└── styles/global.css            # token --color-danger
```

## 3. Camada de dados (`src/services`)

### `api-client.js`

```js
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
```

- Interceptor de request lê o token salvo e injeta `Authorization: Bearer <token>`.
- Sem redirect global no interceptor; cada fluxo decide o que fazer com o erro.

### `session-storage.js`

- Chave `code-connect.access-token`.
- `saveAccessToken(token, { persist })`: grava em `localStorage` quando `persist` for
  verdadeiro; caso contrário, em `sessionStorage`.
- `readAccessToken()`: procura nos dois storages e remove a duplicata se existir.
- `clearAccessToken()`: remove dos dois.
- O token é opaco para o web; expiração é tratada pelo `401` da API.

### `auth-service.js`

- `signIn({ email, password })` → `POST /sessions` → `{ accessToken, tokenType, expiresIn }`.
- `signUp({ name, email, password })` → `POST /users` → `{ id, name, email, createdAt }`.
- `getCurrentUser()` → `GET /users/me`.

### `problem-details.js`

- `toProblemDetails(error)` lê `error.response.data` no formato RFC 9457 (`title`,
  `detail`, `status`, `errors[]`) e devolve um objeto normalizado.
- Fallbacks em PT-BR para falha de rede, timeout e `5xx` sem corpo reconhecível.
- `toFieldErrors(problem)` converte `errors[]` em `{ name, email, password }`, descartando
  caminhos desconhecidos.

## 4. Formulários

- `LoginForm`: estado `identifier` → `email`, rótulo "Email" e `type="email"`. Novos props
  `submitting`, `error` e `fieldErrors`; botão desabilitado com texto "Entrando...".
- `RegisterForm`: mesmos props de erro/loading; botão "Cadastrando...".
- `FormField`/`TextInput`: aceitar `error`/`invalid` e renderizar
  `<p id="<id>-error" class="text-sm text-danger">`; o input recebe `aria-invalid` e
  `aria-describedby` para preservar o WCAG 2.2 AA.
- Alerta do formulário com `role="alert"`.
- `src/styles/global.css`: novo token semântico `--color-danger` (ex.: `#ff8b8b`, ~7,5:1
  sobre `surface`) para o texto de erro. Nenhum hexadecimal avulso nas classes.
- O callback de submit passa a incluir `remember`: `{ email, password, remember }` e
  `{ name, email, password, remember }`.

## 5. Páginas e rotas

### `LoginPage`

1. `signIn({ email, password })`;
2. `saveAccessToken(accessToken, { persist: remember })`;
3. `navigate('/conta')`.

Erros: `401` → "Email ou senha inválidos."; `errors[]` → erro por campo; demais casos →
fallback de `problem-details`. A página controla `submitting`.

### `RegisterPage`

1. `signUp({ name, email, password })`;
2. `signIn` com as mesmas credenciais (login automático);
3. salva o token e vai para `/conta`.

Erro `409` → "Este email já está cadastrado."; validação → erro por campo.

### `AccountPage` (nova, `/conta`)

- Sem token → redireciona para `/login`.
- Com token → `getCurrentUser()` e renderiza "Minha conta", nome, email e botão "Sair".
- "Sair" limpa a sessão e volta ao login.
- `401` limpa a sessão e redireciona.
- Estados de carregamento e erro acessíveis, usando apenas atoms e tokens existentes.

### `App.jsx` e `main.jsx`

- `App.jsx`: rota `/conta` → `AccountPage`; caminhos desconhecidos continuam caindo no
  login.
- `main.jsx`: título `Code Connect | Minha conta` para `/conta`.
- Páginas aceitam `navigate = (to) => window.location.assign(to)` (mesmo padrão do prop
  `path` do `App`) para testar redirecionamento sem depender de `window.location`.

## 6. Testes (Vitest + Testing Library)

- `session-storage.test.js`: persiste em `localStorage`/`sessionStorage`, lê e limpa.
- `problem-details.test.js`: corpo problem+json, falha de rede e mapeamento de `errors[]`.
- `auth-service.test.js`: mock de `api-client.js` validando URL, payload e retorno dos três
  serviços.
- `api-client.test.js`: adapter stub confirma o header `Authorization` quando há token e a
  ausência quando não há.
- `LoginPage.test.jsx` / `RegisterPage.test.jsx`: sucesso (payload exato, token salvo,
  `navigate` chamado), `401`/`409` exibindo alerta, erro por campo e botão desabilitado
  durante o envio — com `vi.mock` do service.
- `AccountPage.test.jsx`: renderiza o usuário, logout limpa a sessão, `401` limpa e
  redireciona; versão a11y com `expectNoA11yViolations`.
- Atualizar `LoginForm.test.jsx`, `RegisterForm.test.jsx` (campo email, props de
  erro/loading) e `App.test.jsx` (`/conta`, com service mockado).
- Testes Playwright continuam sem depender da API: login e cadastro não chamam nada ao
  montar.

## 7. Documentação

- `AGENTS.md` na raiz: remover "não há integração"/"sem CORS ou proxy", registrar o proxy
  `/api`, a pasta `services/`, a rota `/conta`, o token `danger` e a regra de sessão
  (`localStorage` vs `sessionStorage`).
- `apps/web/README.md`: estrutura `services/`, rotas e variável de ambiente.

## 8. Como validar depois da implementação

Terminal 1 (API):

```powershell
cd apps/api
node node_modules/@nestjs/cli/bin/nest.js start --watch
```

Terminal 2 (web):

```powershell
cd apps/web
node node_modules/vite/bin/vite.js
```

Fluxo manual:

1. Cadastrar em `/cadastro` → deve cair em `/conta` com nome e email.
2. Recarregar mantém a sessão com "Lembrar-me" marcado; desmarcado, some ao fechar a aba.
3. "Sair" volta ao login.
4. Login com senha errada mostra "Email ou senha inválidos.".
5. O Swagger em `http://localhost:3000/docs` continua acessível.

Testes, lint e build do web (via build JS do pnpm):

```powershell
node <dir>/package/bin/pnpm.cjs --filter web test
node <dir>/package/bin/pnpm.cjs --filter web lint
node <dir>/package/bin/pnpm.cjs --filter web build
```

## 9. Observações

- Token em `localStorage` é acessível a XSS; aceitável no sandbox, mas cookie `httpOnly`
  seria o correto em produção.
- Dados da API vivem em memória: reiniciar a API invalida a sessão; `/conta` trata o `401`
  limpando o token.
- O build de produção depende de rotear `/api` para a API ou de definir `VITE_API_URL`.
- Mensagens de validação da API estão em inglês; a tradução completa fica fora deste
  escopo — a UI usa fallback em PT-BR por status.
- Commits sugeridos, um por mudança lógica:
  1. `build(web): add axios and proxy requests to the api`
  2. `feat(web): add api client, problem details and session storage`
  3. `feat(web): integrate login and registration with the api`
  4. `docs: document the web and api integration`
