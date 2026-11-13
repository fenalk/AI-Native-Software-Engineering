# Plano — Performance do `apps/web` (Lighthouse 13.5.0)

## Objetivo

Corrigir os problemas reais apontados pelo relatório Lighthouse de
`http://localhost:5173/` (login do Code Connect) e separar o que é defeito de
aplicação do que é apenas artefato do servidor de desenvolvimento do Vite.

## Contexto da medição

Relatório gerado em 2026-11-13T14:23:01Z, Lighthouse 13.5.0, `formFactor: desktop`,
`throttlingMethod: simulate`, emulação de tela mobile desligada.

| Categoria | Nota |
| --- | --- |
| Performance | 0,67 |
| Acessibilidade | 1,00 |
| Boas práticas | 1,00 |
| SEO | 1,00 |

Métricas:

| Métrica | Valor |
| --- | --- |
| FCP | 2.155 ms |
| LCP | 3.888 ms |
| Speed Index | 2.270 ms |
| TBT | 0,5 ms |
| CLS | 0,00015 |
| TTI | 3.888 ms |
| Peso total | 4.209.061 B (4.110 KiB) |

Decomposição do LCP (imagem do banner): TTFB 15,6 ms + **delay de descoberta
568 ms** + download 15 ms + **render 317 ms**.

## Diagnóstico: dev vs. real

A maior parte do "peso" medido é o Vite em modo `dev`:

| Achado | Veredito |
| --- | --- |
| `react-dom_client.js` 3.132.968 B + "unminified-javascript" 2.828 KiB | bundle **development**; some no build |
| `@vite/client` (223 KB) e `@react-refresh` (119 KB) | existem só em dev |
| `unused-javascript` 578 KiB, `duplicated-javascript`, `total-byte-weight` 4,1 MiB | idem |
| 95 ms de main thread de `ddkjiahejlhfcafbddmgiahcphecmpfh` | **extensão uBlock** do navegador local |
| A11y/BP/SEO = 100, TBT ~0, CLS ~0 | app já saudável |

Conclusão: a nota 0,67 **não** representa o app publicado. Restam, porém, cinco
defeitos que sobrevivem ao build.

## Defeitos reais

### 1. LCP não descobrível nem priorizado (P0)

`lcp-discovery-insight` = 0, com `priorityHinted: false` e
`requestDiscoverable: false`.

- O LCP é `public/banner-login.png`: 327.173 B, PNG cru.
- Dimensões naturais 407×636; exibido ~407×675 (o `figure` usa
  `aspect-[407/675]` + `object-cover`, então a imagem é recortada e o enquadramento
  não corresponde ao arquivo).
- `image-delivery-insight` estima **282 KiB** de desperdício
  (286 KB por formato, 18 KB por enquadramento).
- Em `AuthBanner.jsx` o `<img>` não tem `width`/`height` nem `fetchPriority`, e o
  Vite não emite `<link rel="preload">` porque o HTML é só `<div id="root">`.

### 2. Google Fonts bloqueia o render (P0)

`render-blocking-insight`: `fonts.googleapis.com/css2?...` custa 318 ms e o
ganho estimado no FCP é 340 ms. A cadeia mais longa da página (738 ms) é
`index.html → CSS do Google Fonts → Poppins.woff2` — duas origens e dois RTTs
antes de pintar o primeiro texto.

### 3. Imagens sem dimensões explícitas (P1)

`unsized-images` = 0,5: `Github.png` (33×32) e `Google.png` (28×28) em
`SocialButton.jsx` não declaram `width`/`height`. O único layout shift
encontrado (0,00015) aponta explicitamente "Media element lacking an explicit
size" no ícone do GitHub.

### 4. `banner-register.png` (P1)

946.202 B, 814×1350 (asset 2×). Não carrega no login, mas é a maior imagem do
repositório e tem exatamente o mesmo problema de formato.

### 5. Headers de segurança (informativo)

`csp-xss`, `has-hsts`, `origin-isolation`, `clickjacking-mitigation` e
`trusted-types-xss` aparecem com severidade "High", mas todos com peso 0 e nota
1. É o esperado em `http://localhost`: só faz sentido tratar num plano de deploy
com HTTPS.

## Etapas

### Passo 0 — Rebaseline contra o build de produção

Antes de mexer em código, medir o que realmente precisa de conserto.

```powershell
cd apps/web; node node_modules/vite/bin/vite.js build
cd apps/web; node node_modules/vite/bin/vite.js preview
```

- Lighthouse em janela anônima, extensões desabilitadas, 3 execuções, mesma
  configuração (`formFactor: desktop`).
- Esperado: "unminified-javascript", `@vite/client`, `@react-refresh` e a
  extensão desaparecem. O que sobrar é a lista real.

> `pnpm.exe` é bloqueado nesta máquina (Device Guard); por isso os comandos
> acima chamam o Vite via `node`.

### Passo 1 — Dimensões explícitas + prioridade do LCP

- `src/components/molecules/AuthBanner/AuthBanner.jsx`:
  - `width={407} height={636}` no `<img>` principal;
  - `fetchPriority="high"` (React 19 mapeia para `fetchpriority`);
  - manter `size-full object-cover` para não alterar layout.
- `src/components/molecules/SocialButton/SocialButton.jsx`:
  - `width`/`height` intrínsecos: `33×32` (GitHub) e `28×28` (Google);
  - manter `w-auto` e as classes de altura para preservar o layout.
- Sobre `requestDiscoverable: false`: exige `<link rel="preload" as="image">` no
  `<head>`. Como o roteamento é por `window.location.pathname` num único
  `index.html`, há duas opções:
  - **A (mínima):** apenas `fetchPriority` — resolve o aviso de prioridade, não
    o de descoberta.
  - **B (completa):** `<script>` inline no `<head>` que injeta o preload do
    banner da rota, espelhando o mapa de títulos já existente em `main.jsx`.
    Duplica o conhecimento de rotas, mas é o único caminho sem SSR/prerender.
    Recomendado só se o insight precisar ficar verde.

### Passo 2 — Reconverter as imagens

- `banner-login`: exportar em **407×675** (não 407×636) para o `object-cover`
  parar de recortar, em WebP. Estimativa: 327 KB → ~40–70 KB.
- `banner-register`: **814×1350** (2×) em WebP; 946 KB deve cair para a casa das
  centenas de KB.
- Decidir entre `<picture>` com fallback PNG ou apenas WebP (Baseline: só WebP
  basta neste sandbox).
- Não é necessário `srcset` 2× no banner de login — ele já está ~1× do tamanho
  exibido.
- Ícones sociais (581 B e 906 B) não compensam otimização; podem ficar como
  estão ou virar SVG inline.

### Passo 3 — Tirar o Google Fonts do caminho crítico

Escolher uma das opções:

- **A — self-host (recomendada).** Baixar os subsets latin de Poppins
  400/500/600/700 (~8 KB cada) para `apps/web/public/fonts/`, declarar
  `@font-face` com `font-display: swap` em `src/styles/global.css` (mantendo
  `--font-sans: 'Poppins', …`) e `<link rel="preload" as="font"
  type="font/woff2" crossorigin>` apenas nos pesos usados acima da dobra.
  Remove a cadeia de 738 ms e a dependência de terceiros. Custo: ~32 KB de
  binários no git.
- **B — não-bloqueante (rápida).** Manter o link do Google com
  `media="print" onload="this.media='all'"` + `<noscript>` de fallback. Ganha
  os 318–340 ms de FCP, mas mantém duas origens na cadeia.
- **C — sem webfont.** Cair para a stack `system-ui`. Zero requisições, mas
  muda o design; só se for aceitável.

Se houver pesos não utilizados, cortar (400/600 provavelmente bastam).

### Passo 4 — Reverificar

- `vite build` + `vite preview`, Lighthouse anônimo, 3×.
- `pnpm web test` e `pnpm web lint` (os testes de `AuthBanner` e
  `SocialButton` podem assertar markup; se assertarem, ajustar para o novo
  atributo).

## Critérios de aceite

- LCP < 2,0 s, FCP < 1,2 s, Speed Index < 2,0 s no build de produção.
- Performance ≥ 0,95; a11y/BP/SEO continuam em 1,00.
- Insights `image-delivery`, `lcp-discovery`, `render-blocking` e
  `unsized-images` sem pendências.
- Nenhuma regressão visual no card de login (desktop e mobile).

## Fora de escopo

1. **Headers de segurança** (CSP, HSTS, COOP, X-Frame-Options, Trusted Types):
   dependem de HTTPS e de headers reais no deploy.
2. **Pré-render/SSG**: resolveria de vez a descoberta do LCP e o custo de
   hidratação, mas é decisão de arquitetura.
3. **Sanitizar o JSON do relatório antes de commitar**: ele contém caminhos
   absolutos da máquina (`C:/Users/...` em `network-requests` e no treemap),
   o que viola os critérios de segurança de commit do `AGENTS.md`.
4. **`theme-color` no `index.html`** está `#050a09`, enquanto o token `canvas`
   é `#00090e`. Não foi apontado pelo Lighthouse, mas é inconsistente com a
   paleta.

## Observações

- Nenhum arquivo do app foi alterado; este plano é somente documental.
- O relatório analisado foi gerado com o servidor de desenvolvimento no ar e
  com extensões habilitadas — daí a inflação de script e o `third-parties`
  apontando a extensão.
