# web

Aplicação React + Vite do Code Connect.

## Estrutura

Os componentes seguem **atomic design**:

```
src/
├── components/
│   ├── atoms/        # ArrowForwardIcon, BrandMark, Button, Checkbox, Link, LoginIcon, TextInput
│   ├── molecules/    # AuthBanner, AuthFooter, AuthHeader, BrandWatermark, Divider, FormField, SocialButton
│   ├── organisms/    # LoginForm, RegisterForm, SocialLoginGroup
│   └── templates/    # AuthTemplate
├── pages/
│   ├── LoginPage/
│   └── RegisterPage/
├── styles/
│   └── global.css    # tokens de cor, tipografia e reset
└── test/
    └── setup.js      # jest-dom + cleanup do Testing Library
```

### Rotas

A navegação é resolvida em `App.jsx` a partir do `pathname` (sem router):

| Caminho     | Página        |
| ----------- | ------------- |
| `/`         | `LoginPage`   |
| `/login`    | `LoginPage`   |
| `/cadastro` | `RegisterPage` |

O `main.jsx` ajusta o `document.title` conforme a rota.

### Reuso entre login e cadastro

- `AuthTemplate` recebe o banner e o conteúdo por props — cada página passa sua imagem.
- `AuthBanner` desenha a arte e sobrepõe o logotipo do Code Connect
  (`public/logo-code-connect.svg`); `logo={false}` esconde o logotipo.
- `AuthHeader`, `AuthFooter`, `Divider`, `FormField`, `Button`, `Checkbox`,
  `Link` e `SocialLoginGroup` são compartilhados pelos dois formulários.
- `LoginForm` e `RegisterForm` recebem `onSubmit` e concentram apenas o estado
  do formulário, deixando a integração com a API para a página.

### Assets em `public/`

- `banner-login.png` — arte da página de login.
- `banner-register.png` — arte do cadastro (recorte exato do Figma).
- `logo-code-connect.svg` — logotipo sobreposto ao banner.
- `Github.png` e `Google.png` — provedores de login social.

## Scripts

```bash
pnpm dev         # servidor de desenvolvimento
pnpm build       # build de produção
pnpm lint        # oxlint
pnpm test        # vitest (jsdom + Testing Library)
pnpm test:watch  # testes em modo watch
pnpm preview     # pré-visualiza o build
```
