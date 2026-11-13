# Plano — Backend: usuários, JWT e Swagger

## Objetivo

Implementar os três primeiros endpoints da API (`apps/api`):

1. Cadastro de usuário com nome, e-mail e senha.
2. Login com emissão de JWT.
3. Consulta dos dados do usuário logado, protegida por um auth guard.

Nesta etapa os dados ficam **apenas em memória** (um array), sem ORM ou banco de dados. A API
também deve expor a documentação Swagger com os inputs e outputs de cada endpoint.

## Decisões

- Autenticação seguindo a receita de Passport/JWT da documentação do Nest:
  `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`, com `JwtStrategy` e
  `JwtAuthGuard extends AuthGuard('jwt')`.
- Rotas orientadas a recurso, conforme o contrato REST do repositório:
  `POST /users`, `POST /sessions` e `GET /users/me`.
- Validação com `zod` + `StandardSchemaValidationPipe`.
- Swagger com `@nestjs/swagger`.
- Senhas com hash `scrypt` do `node:crypto` (sem dependência nativa).
- Erros no formato RFC 9457 (`application/problem+json`).

## 1. Dependências

Adicionar em `apps/api`:

| Pacote | Para quê |
| --- | --- |
| `@nestjs/swagger` | Swagger/OpenAPI |
| `@nestjs/jwt` | Assinar e verificar JWT |
| `@nestjs/passport` + `passport` + `passport-jwt` | `JwtStrategy` e `AuthGuard('jwt')` |
| `zod` | Validação com `StandardSchemaValidationPipe` e geração dos schemas no Swagger |
| `@types/passport-jwt` (dev) | Tipos do Passport JWT |
| `@types/passport` (dev, se necessário) | Tipos do Passport |

O Swagger do Nest 12 converte schemas Zod nativamente a partir do Zod 4.2. A versão atual é
4.6, então não é necessário `zod-openapi`.

Como o `pnpm.exe` está bloqueado nesta máquina, a instalação segue o workaround do
`AGENTS.md`: baixar uma build em JS do pnpm com `npm pack` e executar
`node <dir>/package/bin/pnpm.cjs --filter api add ...`.

## 2. Estrutura de arquivos

```text
apps/api/src/
├── app.module.ts                  # registra pipes/filtros/guard globais
├── app.controller.ts              # GET / marcado como @Public()
├── main.ts                        # Swagger + listen
├── swagger.ts                     # DocumentBuilder e setup do Swagger
├── users/
│   ├── user.ts                    # tipos User e UserRecord
│   ├── users.module.ts
│   ├── users.service.ts           # array em memória
│   ├── users.controller.ts        # POST /users e GET /users/me
│   ├── password-hasher.service.ts # scrypt do node:crypto
│   ├── users.schemas.ts           # createUserSchema (Zod)
│   ├── user-response.dto.ts       # modelo de saída para o Swagger
│   └── users.service.spec.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts         # POST /sessions
│   ├── auth.service.ts            # valida credenciais e assina o JWT
│   ├── auth.schemas.ts            # signInSchema (Zod)
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── public.decorator.ts        # @Public()
│   ├── current-user.decorator.ts  # @CurrentUser()
│   ├── access-token-response.dto.ts
│   └── auth.service.spec.ts
└── common/
    ├── problem-details.dto.ts
    ├── api-problem-response.decorator.ts
    └── problem-details.filter.ts
```

## 3. Contrato HTTP

### `POST /users` — cadastro

Público.

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "senha-segura"
}
```

Response `201 Created` + header `Location: /users/<uuid>`:

```json
{
  "id": "9f0c...",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "createdAt": "2026-11-13T12:00:00.000Z"
}
```

Erros: `400` validação, `409` e-mail já cadastrado.

### `POST /sessions` — login

Público.

Request:

```json
{
  "email": "ada@example.com",
  "password": "senha-segura"
}
```

Response `200 OK`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

Erros: `400` validação, `401` credenciais inválidas.

Login não cria um recurso persistido (o JWT é stateless), por isso devolve `200`, e não
`201 + Location`. Se preferir `201`, é só ajustar.

### `GET /users/me` — usuário logado

Protegido por `JwtAuthGuard`.

Request:

```http
Authorization: Bearer <accessToken>
```

Response `200 OK`:

```json
{
  "id": "9f0c...",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "createdAt": "2026-11-13T12:00:00.000Z"
}
```

Erros: `401` sem token, token inválido ou expirado.

## 4. Implementação

### 4.1 Usuários em memória

- `UsersService` mantém um `UserRecord[]` privado, com `id` gerado por `randomUUID()`.
- O e-mail é normalizado (`trim` + `toLowerCase`) antes de comparar ou salvar.
- E-mail duplicado lança `ConflictException`; a checagem é repetida depois do `await` do
  hash para evitar corrida entre cadastros simultâneos.
- A senha nunca é devolvida: `UserRecord` guarda `passwordHash`, e o serviço expõe apenas
  `User` (sem hash).
- Sem ORM e sem banco: os dados somem ao reiniciar a API, como pedido.

### 4.2 Senha

`PasswordHasherService` usando `scrypt` do `node:crypto` (sem dependência nativa):

- salt aleatório de 16 bytes;
- hash de 64 bytes;
- formato armazenado: `scrypt$<saltHex>$<hashHex>`;
- verificação com `timingSafeEqual`.

### 4.3 JWT e guard

- `AuthService.validateUser(email, password)` busca as credenciais e verifica o hash.
- `AuthService.login(user)` assina o payload `{ sub: user.id, email: user.email }` com
  `expiresIn: '1h'`.
- `JwtStrategy` extrai o Bearer token, valida assinatura/expiração e recarrega o usuário
  por `sub`; se não existir mais, retorna `401`.
- `JwtAuthGuard extends AuthGuard('jwt')`, com suporte a `@Public()` via `Reflector`.
- O guard será registrado globalmente com `APP_GUARD` no `AppModule`, que é o padrão
  documentado para proteger a API por padrão. Por isso:
  - `POST /users` e `POST /sessions` recebem `@Public()`;
  - `GET /users/me` fica protegido sem decorator;
  - o `GET /` existente também recebe `@Public()` para não quebrar o e2e atual.
- `@CurrentUser()` injeta o usuário validado no controller.

Segredo: `process.env.JWT_SECRET`, com fallback explícito de desenvolvimento. Nenhum segredo
real será versionado; em produção, a variável precisa ser definida.

### 4.4 Validação

Schemas Zod:

```ts
createUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  password: z.string().min(8).max(128),
});

signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
```

`StandardSchemaValidationPipe` será registrado como `APP_PIPE` no `AppModule`, não só no
`main.ts`. Assim os testes e2e que montam o `AppModule` também validam as requisições.

### 4.5 Swagger

Em `src/swagger.ts`:

- `DocumentBuilder` com título, descrição, versão e `addBearerAuth()`;
- `SwaggerModule.setup('docs', app, documentFactory)`;
- JSON em `/docs-json`.

Documentação:

- inputs: schemas Zod ligados a `@Body({ schema })`, com descrições via `.describe()`;
- outputs: classes com `@ApiProperty()` e exemplos (`UserResponseDto`,
  `AccessTokenResponseDto`);
- `@ApiTags('users')` e `@ApiTags('sessions')`;
- `@ApiBearerAuth()` em `GET /users/me`;
- `@ApiResponse` para `400`, `401`, `409` e para o header `Location` do cadastro.

### 4.6 Formato de erro

Para cumprir o `AGENTS.md` (“um formato único de erro fora de 2xx”), adicionar um
`ProblemDetailsFilter` global no formato RFC 9457 (`application/problem+json`):

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already registered",
  "instance": "/users"
}
```

Erros de validação incluem também `errors: [{ path, message }]`. O filtro será registrado
com `APP_FILTER` e o `ProblemDetailsDto` aparecerá no Swagger.

Se preferir manter o formato padrão do Nest nesta primeira etapa, esse item pode sair do
escopo.

## 5. Testes

Unitários:

- `users.service.spec.ts`: cria usuário, normaliza e-mail, impede duplicado, não expõe
  `passwordHash`, busca por id.
- `auth.service.spec.ts`: login válido gera token; senha errada/e-mail inexistente gera
  `UnauthorizedException`.
- `jwt.strategy.spec.ts`: retorna o usuário do `sub` ou rejeita usuário inexistente.

E2E (`test/auth.e2e-spec.ts`):

1. `POST /users` → `201`, `Location` e corpo sem senha.
2. E-mail duplicado → `409` em `application/problem+json`.
3. Payload inválido → `400`.
4. `POST /sessions` com credenciais válidas → `200` + `accessToken`.
5. Credenciais inválidas → `401`.
6. `GET /users/me` sem token → `401`.
7. `GET /users/me` com Bearer → `200` e dados do usuário.
8. Token inválido → `401`.

E2E do Swagger:

- montar a app, chamar `setupSwagger`, buscar `/docs-json` e verificar que existem os paths
  `/users`, `/sessions` e `/users/me`, os schemas de request/response e o security scheme
  `bearer`.

## 6. Como validar depois da implementação

```powershell
cd apps/api
node node_modules/@nestjs/cli/bin/nest.js start --watch
```

```powershell
cd apps/api
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run --config ./vitest.config.e2e.ts
node node_modules/@nestjs/cli/bin/nest.js build
```

Swagger: `http://localhost:3000/docs` e `http://localhost:3000/docs-json`.

## 7. Observações

- Usuários e tokens deixam de existir ao reiniciar a API; é o comportamento esperado para o
  armazenamento em memória.
- O filtro de problem details é o único item além dos três endpoints; ele vem da convenção
  do repositório. Pode ser removido se o formato padrão do Nest for preferido.
- Não há CORS nem proxy do Vite configurados; a integração com o web continua fora do
  escopo.
- Commit sugerido: `feat(api): add in-memory users, JWT authentication and swagger`.
