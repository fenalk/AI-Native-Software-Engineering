# Plano — Backend: persistência dos usuários em PostgreSQL com Drizzle

## Objetivo

Substituir o array `UserRecord[]` em memória do `UsersService` (`apps/api`) por persistência em
PostgreSQL, mantendo o contrato HTTP atual (`POST /users`, `POST /sessions`, `GET /users/me`) e
o formato de erro RFC 9457. O banco de desenvolvimento sobe por um `docker-compose.yml` na raiz
do repositório, com volume nomeado para que os dados sobrevivam a reinícios dos containers.

## Decisão de ORM: Drizzle

Adotar `@nestjs/drizzle` + `drizzle-orm` + `pg` (node-postgres).

1. **Integração de primeira linha no Nest 12** (`DrizzleModule`, `@InjectDrizzle`), conforme a
   pasta `apps/api/AGENTS.md` orienta (preferir pacotes oficiais antes de terceiros).
2. **Schema em TypeScript puro**, sem entidades, decorators ou `reflect-metadata`. Casa com o
   projeto ESM + `isolatedModules` + Zod/Standard Schema e não adiciona geração de código ao
   build.
3. **SQL previsível e migrations versionadas em `.sql`** (`drizzle-kit generate` → arquivos
   commitados), auditáveis e coerentes com a disciplina de contrato REST do repositório.
4. **Tipos inferidos do schema** (`$inferSelect`/`$inferInsert`), sem modelo duplicado.
5. **Testável sem perder os testes rápidos**: as queries ficam num `UsersRepository`; o
   `UsersService` continua coberto por testes unitários com mock em memória, e o banco real é
   exercitado nos e2e.

Trade-off assumido: usamos a linha estável `drizzle-orm@0.45.4` (não o `1.0.0-rc` citado na
documentação do Nest). Para uma tabela sem relations a API é idêntica; o upgrade para v1 fica
trivial quando sair do RC.

### Alternativas consideradas

| ORM | Por que não |
| --- | --- |
| **TypeORM** (`@nestjs/typeorm`) | Primeira linha e o mais "padrão Nest", mas exige entidades/decorators e mais mágica em runtime; fricção com ESM; migrations menos explícitas; manutenção lenta. Boa escolha se o time já usa. |
| **Prisma** | Excelente DX de modelagem, porém **sem pacote Nest oficial**, exige `prisma generate` + engine binário no deploy e um schema separado do TypeScript. Peso desproporcional para uma tabela. |
| **Sequelize** (`@nestjs/sequelize`) | Maduro, mas API legada baseada em strings, tipos TS mais fracos e ecossistema menos ativo. |
| **Kysely** | SQL builder tipado muito bom, mas sem integração oficial Nest e sem geração de schema/migrations na mesma ferramenta. |
| **Mongoose** | Só MongoDB — não atende ao requisito de PostgreSQL. |

## Diagnóstico do estado atual

- `UsersService` guarda tudo em `private readonly records: UserRecord[]`; `User`/`toUser` já
  isolam o hash, então só o armazenamento muda.
- Três métodos são **síncronos** e são consumidos por `AuthService` (`findCredentials`),
  `JwtStrategy` (`findById`) e `UsersController` (`getById`/`getCredentials`). Com banco eles
  passam a assíncronos, propagando `await` para esses pontos e para os specs.
- A corrida de cadastro hoje é tratada com dupla checagem em memória. No banco, a solução
  correta é um **índice único em `email`**: a segunda inserção falha de forma atômica.
- Os e2e (`test/*.e2e-spec.ts`) sobem o `AppModule` inteiro, então passam a exigir PostgreSQL
  e `DATABASE_URL` definida.

## 1. Dependências

Adicionar em `apps/api`:

| Pacote | Para quê |
| --- | --- |
| `@nestjs/drizzle` | `DrizzleModule` e `@InjectDrizzle()` (integração oficial) |
| `drizzle-orm` | Schema, query builder e tipos |
| `pg` | Driver PostgreSQL (node-postgres) |
| `@nestjs/config` | Ler `DATABASE_URL` via `ConfigService`/`ConfigModule` |
| `drizzle-kit` (dev) | Gerar e aplicar migrations |
| `@types/pg` (dev) | Tipos do driver |

Versões previstas: `@nestjs/drizzle@^0.0.2`, `drizzle-orm@^0.45.4`, `drizzle-kit@^0.31.11`,
`pg@^8.23.1`, `@nestjs/config@^12.1.1`.

O `pnpm.exe` está bloqueado nesta máquina; a instalação segue o workaround do `AGENTS.md`
(`npm pack pnpm@10.18.3` e `node <dir>/package/bin/pnpm.cjs --filter api add ...`).

## 2. PostgreSQL em Docker (raiz)

`docker-compose.yml`:

- `name: ai-native` para fixar o prefixo do volume.
- Serviço `postgres` com `postgres:17-alpine` — o path de `PGDATA` do 18 mudou; o 17 mantém o
  caminho clássico usado em exemplos e cursos.
- `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` com defaults de desenvolvimento
  (`ainative`/`ainative`/`ainative`), sobrescrevíveis pelo `.env` da raiz.
- Porta `5433:5432` (`POSTGRES_PORT` opcional). O 5432 fica para um PostgreSQL instalado
  localmente, que impediria a conexão com o container.
- Volume nomeado `postgres-data` em `/var/lib/postgresql/data`, para persistir entre
  `docker compose up/down`. Só `docker compose down -v` apaga.
- Healthcheck `pg_isready` (permite `docker compose up -d --wait`).
- `docker/postgres/init/01-create-test-database.sql` criando `ainative_test`, usado pelos e2e.
  Esse script roda **apenas na primeira inicialização** de um volume vazio; se o volume já
  existir, criar manualmente com
  `docker compose exec postgres createdb -U ainative ainative_test`.

## 3. Configuração da API

- `apps/api/.env.example` (versionado) e `apps/api/.env` (ignorado pelo `.gitignore` raiz):

  ```dotenv
  DATABASE_URL=postgres://ainative:ainative@localhost:5433/ainative
  TEST_DATABASE_URL=postgres://ainative:ainative@localhost:5433/ainative_test
  ```

- `app.module.ts`:

  ```ts
  ConfigModule.forRoot({ isGlobal: true }),
  DrizzleModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      drizzle,
      connection: config.getOrThrow<string>('DATABASE_URL'),
    }),
  }),
  ```

  `forRootAsync` evita o problema de ler `process.env` no momento em que o módulo é importado,
  e o pool é fechado automaticamente em `app.close()`.

- `apps/api/drizzle.config.ts` (`dialect: 'postgresql'`, schema em `./src/db/schema.ts`,
  saída em `./drizzle`, URL de `DATABASE_URL`). O `drizzle-kit` carrega o `.env` do diretório
  onde é executado.
- Scripts em `apps/api/package.json`: `db:generate`, `db:migrate`, `db:studio`.

## 4. Estrutura de arquivos

```text
docker-compose.yml                          # novo (raiz)
docker/postgres/init/
└── 01-create-test-database.sql             # cria ainative_test

apps/api/
├── .env.example                            # novo
├── drizzle.config.ts                       # novo
├── drizzle/                                # migrations SQL geradas (commitadas)
│   ├── 0000_<slug>.sql
│   └── meta/
├── src/
│   ├── db/
│   │   ├── schema.ts                       # tabela users + tipos inferidos
│   │   └── database.ts                     # type Database
│   ├── users/
│   │   ├── user.ts                         # UserRecord = linha do banco
│   │   ├── users.repository.ts             # novo: queries
│   │   ├── users.service.ts                # passa a usar o repositório
│   │   ├── users.service.spec.ts           # mock do repositório
│   │   └── ...
│   ├── auth/
│   │   ├── auth.service.ts                 # await em findCredentials
│   │   ├── jwt.strategy.ts                 # validate async
│   │   ├── auth.service.spec.ts
│   │   └── jwt.strategy.spec.ts
│   └── app.module.ts                       # ConfigModule + DrizzleModule
└── test/
    ├── e2e.setup.ts                        # globalSetup: migrations no banco de teste
    └── *.e2e-spec.ts                       # TRUNCATE users antes de cada teste
```

## 5. Schema

```ts
// src/db/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
```

- `gen_random_uuid()` embutido no PostgreSQL 13+, sem extensão.
- `email` normalizado na aplicação (`trim` + `toLowerCase`) antes de gravar; a constraint
  `UNIQUE` garante a unicidade e serve de índice para o login.
- `timestamptz` volta como `Date` no driver, preservando o contrato atual do DTO.

## 6. Repositório e serviço

`src/users/users.repository.ts`:

- `findById(id)` → `UserRow | null`;
- `findByEmail(email)` → `UserRow | null`;
- `insert(record)` → `insert(...).values(record).onConflictDoNothing().returning()`, devolvendo
  `null` quando o e-mail já existe (sem acoplar a código de erro `23505` do `pg`).

`src/users/users.service.ts`:

- Construtor passa a receber `UsersRepository` (queries) + `PasswordHasherService`.
- `create`: normaliza o e-mail, calcula o hash, monta o registro com `randomUUID()` e
  `createdAt = new Date()` e insere. `null` → `ConflictException('Email already registered')`.
- `assertEmailIsFree` sai de cena: a constraint `UNIQUE` substitui a dupla checagem e elimina a
  corrida entre cadastros simultâneos.
- `findById`, `getById`, `findCredentials` e `getCredentials` passam a retornar `Promise`,
  mantendo assinaturas lógicas e mensagens de erro.
- `toUser`/`User` continuam iguais: o contrato HTTP não muda.

Impactos diretos:

- `AuthService.validateUser`: `await this.usersService.findCredentials(email)`.
- `JwtStrategy.validate`: vira `async` e faz `await this.usersService.findById(sub)`
  (Passport aceita validação assíncrona).
- `UsersController.getMe` já retorna uma Promise; nenhuma mudança de assinatura.

## 7. Testes

Unitários (sem banco, continuam rápidos e herméticos):

- `users.service.spec.ts`: injeta um `UsersRepository` fake via `{ provide: UsersRepository,
  useValue: ... }` (mapa em memória com insert atômico), adiciona os `await` e mantém o teste
  de corrida — a garantia real agora vem da constraint, o fake reproduz o `null`.
- `auth.service.spec.ts`: mesmo provider fake no `Test.createTestingModule`.
- `jwt.strategy.spec.ts`: `await expect(...).resolves` / `.rejects` no `validate` assíncrono.

E2E (exigem `docker compose up -d`):

- `vitest.config.e2e.ts` define `test.env.DATABASE_URL` = `TEST_DATABASE_URL`
  (`.../ainative_test`), sobrescrevendo o `.env` de desenvolvimento.
- `test/e2e.setup.ts` como `globalSetup`: aplica `migrate(db, { migrationsFolder: './drizzle' })`
  no banco de teste antes da suíte, então `pnpm api test:e2e` é autocontido.
- Em `beforeEach`, `TRUNCATE TABLE users` (via `getDrizzleToken()` do app ou uma conexão
  própria no helper) para isolar os cenários.
- Os casos existentes (`test/auth.e2e-spec.ts`, `test/app.e2e-spec.ts`,
  `test/swagger.e2e-spec.ts`) seguem iguais; mudam apenas os pré-requisitos de ambiente.

## 8. Documentação

- `README.md`: subir o Postgres (`docker compose up -d --wait`), copiar `.env.example`, rodar
  `db:migrate` e os comandos de teste.
- `AGENTS.md` (raiz e/ou `apps/api`): convenções de banco — schema sempre em
  `src/db/schema.ts`, migrations geradas e versionadas (nunca editar uma já aplicada), banco de
  teste separado e e2e dependente do compose.

## 9. Como validar depois da implementação

```powershell
docker compose up -d --wait
```

```powershell
# a partir de apps/api, pelo workaround do pnpm
node <dir>/package/bin/pnpm.cjs db:generate
node <dir>/package/bin/pnpm.cjs db:migrate
node <dir>/package/bin/pnpm.cjs test
node <dir>/package/bin/pnpm.cjs test:e2e
node <dir>/package/bin/pnpm.cjs lint
node node_modules/@nestjs/cli/bin/nest.js build
```

Verificações funcionais:

1. Criar usuário, reiniciar a API e confirmar que `POST /sessions` + `GET /users/me` continuam
   funcionando (dados persistidos).
2. `docker compose restart` mantém os dados; `docker compose down -v` limpa.
3. E-mail duplicado continua retornando `409` em `application/problem+json`.

## 10. Observações

- Métodos que viram `Promise` são pegos pelo TypeScript, mas revisar chamadas é obrigatório
  (ex.: `JwtStrategy` e `AuthService`).
- O hash é calculado antes do insert, então um e-mail duplicado paga o custo do `scrypt`. O
  caminho alternativo (checar antes) reintroduz a corrida; a constraint é a fonte da verdade.
- O init SQL do banco de teste só roda com volume novo; documentar o `createdb` manual.
- Sem CORS/proxy: a integração com o web continua fora do escopo.
- Commits sugeridos (um por mudança lógica):
  - `build: add postgres compose with persistent volume`
  - `feat(api): persist users in postgres with drizzle`
  - `test(api): run database-backed tests against a test database`
  - `docs: document database setup and migrations`
