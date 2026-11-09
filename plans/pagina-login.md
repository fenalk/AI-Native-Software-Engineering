# Plano — Página de Login (Code Connect)

## Objetivo

Implementar a página de login do app `apps/web` seguindo o layout de referência, com
componentes organizados em **atomic design** e estrutura preparada para reaproveitamento
na futura página de cadastro.

## Escopo

- Layout dark com card central, banner à esquerda e formulário à direita.
- Uso dos assets:
  - `public/banner-login.png` (banner principal)
  - `public/Github.png` e `public/Google.png` (login social)
- Formulário de login com email/usuário, senha, "Lembrar-me" e "Esqueci a senha".
- Botão de login, divisor "ou entre com outras contas", login social e link para cadastro.
- Layout responsivo.
- Sem integração real com API nesta etapa.

## Estrutura (atomic design)

```
apps/web/src/
├── components/
│   ├── atoms/
│   │   ├── BrandMark/      # marca do Code Connect (SVG)
│   │   ├── Button/         # botão com variante primary e ícone à direita
│   │   ├── Checkbox/       # checkbox customizado e acessível
│   │   ├── Link/           # variantes subtle e accent
│   │   └── TextInput/      # input base
│   ├── molecules/
│   │   ├── AuthBanner/     # banner reutilizável (src/alt via props)
│   │   ├── AuthHeader/     # título + descrição
│   │   ├── BrandWatermark/ # marcas d'água decorativas do fundo
│   │   ├── Divider/        # divisor com texto central
│   │   ├── FormField/      # label + TextInput
│   │   └── SocialButton/   # ícone + rótulo do provedor
│   ├── organisms/
│   │   ├── LoginForm/      # formulário completo de login
│   │   └── SocialLoginGroup/ # grupo de provedores (lista configurável)
│   └── templates/
│       └── AuthTemplate/   # shell da página: fundo + card + banner + slot
├── pages/
│   └── LoginPage/          # composição da página e handler de submit
└── styles/
    └── global.css          # tokens de cor, tipografia e reset
```

## Decisões de implementação

- **Template reutilizável**: `AuthTemplate` recebe `banner` e `children` por props; o
  cadastro usará o mesmo shell trocando a imagem e o formulário.
- **Configuração do banner centralizada** em `LoginPage.jsx`:
  `const LOGIN_BANNER = '/banner-login.png'`.
- **Formulário desacoplado da API**: `LoginForm` controla apenas o estado local e expõe
  `onSubmit({ identifier, password, remember })`; a integração fica na página.
- **Providers sociais configuráveis**: `SocialLoginGroup` recebe uma lista de provedores,
  permitindo reuso no cadastro.
- **Design tokens** em `styles/global.css`: cores, raios, sombra e tipografia (Poppins).
- **Acessibilidade**: labels associados aos inputs, foco visível, SVGs decorativos com
  `aria-hidden`, link e checkbox navegáveis por teclado. Lighthouse a11y = 100.
- **Responsividade**: abaixo de `990px` o card passa para coluna única e o banner é
  ocultado; abaixo de `520px` os paddings são reduzidos.
- **Assets em `public/`**: referenciados por caminho absoluto (`/banner-login.png` etc.).

## Etapas

- [x] Instalar dependências do workspace (`pnpm install`).
- [x] Criar tokens globais e reset (`styles/global.css`).
- [x] Criar átomos (`BrandMark`, `Button`, `Checkbox`, `Link`, `TextInput`).
- [x] Criar moléculas (`AuthBanner`, `AuthHeader`, `BrandWatermark`, `Divider`, `FormField`, `SocialButton`).
- [x] Criar organismos (`LoginForm`, `SocialLoginGroup`).
- [x] Criar o template base (`AuthTemplate`).
- [x] Criar a página (`LoginPage`) e conectar o banner `banner-login.png`.
- [x] Atualizar `index.html` (idioma, título, fonte Poppins, favicon e meta tags).
- [x] Remover arquivos do scaffold do Vite que não são mais usados.
- [x] Documentar a estrutura em `apps/web/README.md`.
- [x] Validar com lint, build e Lighthouse.
- [x] Verificar o layout desktop e mobile no navegador.

## Validações executadas

```bash
pnpm --filter web lint    # ok
pnpm --filter web build   # ok
```

- Lighthouse: acessibilidade 100 e boas práticas 100.
- Banner e ícones carregando corretamente (HTTP 200).
- Submit do formulário disparando o handler com os valores preenchidos.

## Próximos passos (fora do escopo atual)

1. Criar a `RegisterPage` reaproveitando `AuthTemplate`, com novo banner e `RegisterForm`
   contendo os campos específicos de cadastro.
2. Adicionar navegação entre login e cadastro (router ou links reais).
3. Integrar o submit com a API (`apps/api`), incluindo estados de loading e erro.
4. Implementar fluxo de "Esqueci a senha" e login social.
5. Definir mensagens de validação/erro no formulário.

## Observações

- O rótulo do provedor Google está como **"Gmail"**, seguindo o mockup; pode ser alterado
  em `SocialLoginGroup.jsx`.
- Os links de cadastro, recuperação de senha e login social ainda usam placeholders
  (`#cadastro`, `#recuperar-senha`, `#login-*`).
- Nenhum commit foi criado; as alterações estão no working tree.
