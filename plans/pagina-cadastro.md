# Plano — Página de Cadastro (Code Connect)

## Objetivo

Implementar a página de cadastro do app `apps/web` a partir do frame **Cadastro**
(desktop 1920 × 1300, com versões tablet e mobile) do arquivo
`CodeConnect - Acervo - Faça uma cópia - Community`, reaproveitando ao máximo os
componentes criados para a página de login e corrigindo as diferenças encontradas
entre o implementado e o layout de referência.

## Escopo

- Nova rota `/cadastro` com card central, banner à esquerda e formulário à direita.
- Campos Nome, Email e Senha, checkbox "Lembrar-me", botão "Cadastrar", divisor,
  login social e link para o login.
- Sem integração real com a API nesta etapa.
- Ajustes finos na página de login para alinhá-la ao Figma (tipografia, cores,
  espaçamentos e dimensões compartilhadas).

## Estrutura (atomic design)

```
apps/web/src/
├── components/
│   ├── atoms/
│   │   ├── ArrowForwardIcon/   # seta do botão (extraída do LoginForm)
│   │   ├── LoginIcon/          # ícone do link "Faça seu login!"
│   │   ├── Button/
│   │   ├── Checkbox/
│   │   ├── Link/
│   │   ├── TextInput/
│   │   └── BrandMark/
│   ├── molecules/
│   │   ├── AuthFooter/         # "Já tem conta? / Ainda não tem conta?" + link com ícone
│   │   ├── AuthBanner/         # arte + logotipo sobreposto
│   │   ├── AuthHeader/
│   │   ├── BrandWatermark/
│   │   ├── Divider/
│   │   ├── FormField/
│   │   └── SocialButton/
│   ├── organisms/
│   │   ├── LoginForm/
│   │   ├── RegisterForm/       # formulário de cadastro
│   │   └── SocialLoginGroup/
│   └── templates/
│       └── AuthTemplate/
├── pages/
│   ├── LoginPage/
│   └── RegisterPage/
└── styles/
    └── global.css
```

## Reuso

- `AuthTemplate` já era o shell compartilhado; recebeu apenas as dimensões do
  Figma (colunas de 407 px e 346 px, `padding` 56/78) e o banner passou a ter a
  proporção 407 × 675.
- `AuthHeader`, `Divider`, `FormField`, `Button`, `Checkbox`, `Link` e
  `SocialLoginGroup` foram reutilizados pelos dois formulários.
- Os ícones do botão (seta) e do link (login) viviam dentro do `LoginForm`; foram
  extraídos para `ArrowForwardIcon` e `LoginIcon` para não duplicar SVG.
- O rodapé "Já tem conta? / Ainda não tem conta?" virou a molécula `AuthFooter`,
  compartilhada pelo login e pelo cadastro.
- `AuthBanner` passou a desenhar o logotipo (`public/logo-code-connect.svg`) como
  no Figma, em vez de depender do logotipo embutido na imagem.

## Diferenças corrigidas (Figma × implementado)

| Item | Antes | Figma |
| --- | --- | --- |
| Paleta | verde `#5ee05f`, fundo `#050a09` | verde `#81fe88`, fundo `#00090e`, card `#171d1f`, texto `#e1e1e1`, cinza `#888888` |
| Card | `padding` 48/56, raio 24, colunas 430/340 + 56 de gap | `padding` 56/78, raio 32, colunas 407/346 + 64 de gap |
| Banner | imagem 407 × 636 (borda preta embutida) | imagem 407 × 675 com raio 26 e logotipo sobreposto |
| Título / descrição | 32 px / 15 px, descrição em cinza | 31 px / 22 px, ambos `#e1e1e1`, gap de 24 |
| Labels | 13 px, `#dfe4e1` | 18 px, `#e1e1e1` |
| Inputs | 44 px de altura, texto 14 px | 41 px (`padding` 8/16), texto 15 px |
| Checkbox | 16 px, preenchido em verde | 24 px, borda 2 px `#888888`, check verde vazado |
| Botão | 48 px, texto 15 px | 51 px (`padding` 12/16), texto 18 px |
| Divisor | gap 12, cinza sutil 12 px | gap 16, linha e texto `#e1e1e1` 15 px |
| Links sociais | gap 36, label 12 px | gap 24, label 12,5 px, GitHub 32 px e Gmail 28 px |
| Links | "Crie seu cadastro!" em 13 px | 18 px, sem sublinhado no hover |
| Espaçamentos verticais | 30/14/26/22/30 | 32/8/32/8/24 |

## Decisões de implementação

- **Navegação sem dependência nova**: `App.jsx` resolve a rota pelo `pathname`
  (`/`, `/login`, `/cadastro`); o link do login aponta para `/cadastro` e o do
  cadastro para `/login`.
- **Recorte exato do banner**: `public/banner-register.png` foi gerado a partir
  da imagem original do Figma com o mesmo recorte do frame (407 × 675 em 2×), em
  vez de replicar o `imageTransform` no CSS.
- **Logotipo separado da imagem**: o `AuthBanner` usa `aspect-ratio` e posiciona
  o SVG do logotipo no rodapé da arte, como no Figma.
- **Responsividade**: abaixo de 990 px o card vira coluna única (banner em
  proporção 407 × 312, como nas telas tablet/mobile) e abaixo de 520 px os
  paddings reduzem e o rodapé empilha em duas linhas.
- **Testes**: o web passou a ter Vitest + Testing Library (jsdom),
  com `pnpm test` incluído no script da raiz.

## Etapas

- [x] Ler o frame Cadastro (desktop, tablet e mobile) e comparar com o código atual.
- [x] Atualizar tokens de cor, raio e fundo em `styles/global.css`.
- [x] Ajustar átomos (`Button`, `Checkbox`, `Link`, `TextInput`) ao Figma.
- [x] Extrair `ArrowForwardIcon` e `LoginIcon` para átomos.
- [x] Criar a molécula `AuthFooter` e reutilizá-la no `LoginForm`.
- [x] Atualizar `AuthBanner`, `Divider`, `AuthHeader`, `FormField` e `SocialButton`.
- [x] Ajustar o `AuthTemplate` às dimensões do card.
- [x] Criar `RegisterForm` e `RegisterPage`.
- [x] Adicionar a rota `/cadastro` em `App.jsx` e o título por rota.
- [x] Baixar/gerar os assets (`banner-register.png` e `logo-code-connect.svg`).
- [x] Ajustar a página de login aos mesmos tokens e espaçamentos.
- [x] Configurar Vitest + Testing Library e escrever os testes dos componentes.
- [x] Validar com lint, testes e build; conferir implantação em 1920, 768 e 360 px.

## Validações executadas

```bash
pnpm --filter web lint    # ok
pnpm test                 # api 1 teste, web 13 testes
pnpm lint                 # ok (api e web)
pnpm --filter web build   # ok
```

- Comparação de medidas no navegador (1920 × 1300): card 975 × 796, colunas
  407 e 346, banner 407 × 675, inputs 346 × 41, botão 346 × 51 — dentro de ~2 px
  do frame do Figma.
- Tablet (768 × 1356) e mobile (360 × 1295): layout empilhado com banner
  recortado, igual às telas de referência.

## Próximos passos (fora do escopo atual)

1. Integrar o submit com a API (`apps/api`), incluindo estados de loading e erro.
2. Validar os campos (e-mail, força de senha) e exibir mensagens de erro.
3. Substituir a resolução manual de rota por um router (ex.: React Router).
4. Implementar o fluxo de login social e "Esqueci a senha".

## Observações

- O rótulo do provedor Google continua como **"Gmail"**, seguindo o mockup.
- Os links sociais usam placeholders (`#social-github`, `#social-google`) e o
  handler de submit apenas registra os dados no console.
