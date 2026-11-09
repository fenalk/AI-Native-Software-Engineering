# web

Aplicação React + Vite do Code Connect.

## Estrutura

Os componentes seguem **atomic design**:

```
src/
├── components/
│   ├── atoms/        # Button, Checkbox, Link, TextInput, BrandMark
│   ├── molecules/    # AuthBanner, AuthHeader, BrandWatermark, Divider, FormField, SocialButton
│   ├── organisms/    # LoginForm, SocialLoginGroup
│   └── templates/    # AuthTemplate
├── pages/
│   └── LoginPage/
└── styles/
    └── global.css    # tokens de cor, tipografia e reset
```

### Reuso para o cadastro

- `AuthTemplate` recebe o banner e o conteúdo por props — a página de cadastro usa o
  mesmo template trocando apenas a imagem e o formulário.
- `SocialLoginGroup` aceita uma lista de provedores, então pode ser reaproveitado
  sem alterações.
- `Divider`, `AuthHeader`, `FormField`, `Button`, `Checkbox` e `Link` são genéricos
  e servem tanto para login quanto para cadastro.
- `LoginForm` recebe `onSubmit` e concentra apenas o estado do formulário, deixando
  a integração com a API para a página.

## Scripts

```bash
pnpm dev       # servidor de desenvolvimento
pnpm build     # build de produção
pnpm lint      # oxlint
pnpm preview   # pré-visualiza o build
```
