# Conceitos fundamentais de modelos de IA

Quatro conceitos são fundamentais para entender como funcionam os modelos de Inteligência Artificial (LLMs), como GPT, Claude, Gemini e DeepSeek:

- Janela de contexto (Context Window)
- Custo de tokens (Token Cost)
- Latência (Latency)
- Qualidade de saída (Output Quality)

Eles representam, respectivamente, quanto a IA consegue processar, quanto custa utilizá-la, quanto tempo demora para responder e quão boa é a resposta.

---

## 1. Janela de contexto (Context Window)

É a quantidade máxima de tokens que um modelo consegue considerar em uma única interação.

Imagine que você está desenvolvendo um sistema e envia para a IA:

- Requisitos do projeto.
- Documentação.
- Código-fonte.
- Histórico de conversas.
- Instruções de implementação.

Todas essas informações ocupam espaço na janela de contexto.

### Para que serve?

- Determinar quanto conteúdo você pode fornecer à IA.
- Trabalhar com projetos maiores.
- Analisar arquivos extensos.
- Manter informações relevantes durante uma tarefa.

### Exemplo

Um modelo com janela de contexto de 128 mil tokens consegue trabalhar com muito mais informações simultaneamente do que um modelo com 8 mil tokens.

**Importante:** uma janela de contexto maior não garante que o modelo compreenderá perfeitamente todas as informações fornecidas.

---

## 2. Custo de tokens (Token Cost)

É o valor cobrado pelo uso de um modelo de IA, geralmente calculado pela quantidade de tokens processados.

Existem dois tipos principais:

- **Tokens de entrada (Input):** informações que você envia para a IA, como prompts, arquivos e histórico.
- **Tokens de saída (Output):** conteúdo que a IA produz, como respostas, explicações e código.

Alguns provedores também cobram separadamente tokens de cache e raciocínio, dependendo do modelo e da API.

### Para que serve?

- Controlar gastos com APIs de IA.
- Comparar o custo-benefício entre modelos.
- Planejar o orçamento de aplicações que utilizam IA.
- Evitar desperdício de tokens em prompts desnecessariamente grandes.

### Exemplo fictício

Imagine que determinado modelo cobre:

| Tipo | Preço por 1 milhão de tokens |
|---|---:|
| Entrada | US$ 1,00 |
| Saída | US$ 4,00 |

Se você utilizar 100 mil tokens de entrada e 20 mil de saída:

- Entrada: US$ 0,10.
- Saída: US$ 0,08.
- **Total: US$ 0,18.**

Ou seja, gerar respostas pode custar mais do que enviar informações, dependendo do modelo.

---

## 3. Latência (Latency)

É o tempo que a IA leva para responder a uma solicitação.

Por exemplo, você envia:

> Crie uma função em Python que valide um CPF.

Se a IA demora 2 segundos para começar a responder, existe uma latência inicial de aproximadamente 2 segundos.

É importante conhecer duas medidas:

- **Time to First Token (TTFT):** tempo até a IA começar a gerar a resposta.
- **Tempo total de resposta:** tempo necessário para terminar de gerar toda a resposta.

### Para que serve?

- Avaliar a velocidade de resposta.
- Melhorar a experiência dos usuários.
- Escolher modelos para aplicações em tempo real.
- Identificar gargalos em sistemas que utilizam IA.

### Exemplo

| Modelo | Tempo de resposta |
|---|---:|
| Modelo A | 2 segundos |
| Modelo B | 8 segundos |
| Modelo C | 15 segundos |

Nesse exemplo, o modelo A apresenta menor latência.

Entretanto, ser mais rápido não significa necessariamente produzir respostas melhores.

---

## 4. Qualidade de saída (Output Quality)

É o nível de qualidade do conteúdo produzido pela IA.

Uma saída de qualidade deve ser:

- **Correta:** apresentar informações verdadeiras.
- **Relevante:** responder ao que foi solicitado.
- **Coerente:** manter consistência lógica.
- **Completa:** atender aos requisitos necessários.
- **Clara:** ser compreensível.
- **Segura:** evitar soluções com riscos desnecessários.

No desenvolvimento de software, também podemos avaliar:

- Código funcional.
- Organização e legibilidade.
- Ausência de erros.
- Segurança.
- Manutenibilidade.
- Atendimento aos requisitos.

### Para que serve?

Permite avaliar se o modelo realmente entrega resultados úteis, e não apenas respostas rápidas ou aparentemente convincentes.

### Exemplo

Dois modelos recebem o mesmo pedido para implementar autenticação:

- **Modelo A:** entrega código rapidamente, mas deixa vulnerabilidades.
- **Modelo B:** demora um pouco mais, mas implementa validações, tratamento de erros e boas práticas de segurança.

Nesse cenário, o modelo B apresenta melhor qualidade de saída.

---

## 5. Comparação geral

| Conceito | O que mede? | Principal preocupação |
|---|---|---|
| Janela de contexto | Quantidade de tokens disponíveis | Capacidade |
| Custo de tokens | Valor do processamento | Economia |
| Latência | Tempo de resposta | Velocidade |
| Qualidade de saída | Qualidade do resultado | Eficiência e confiabilidade |

---

## 6. Como esses fatores se relacionam?

Imagine que você está desenvolvendo uma aplicação utilizando OpenCode e DeepSeek.

Você precisa escolher um modelo para trabalhar no projeto.

O cenário ideal seria encontrar um modelo que tenha:

- Janela de contexto suficientemente grande para seu projeto.
- Custo acessível para seu orçamento.
- Baixa latência para não prejudicar o fluxo de trabalho.
- Alta qualidade de saída para produzir resultados confiáveis.

Mas existe um detalhe: esses fatores podem entrar em conflito.

Por exemplo:

- Um modelo mais barato pode ter qualidade inferior em tarefas complexas.
- Um modelo mais inteligente pode ter latência maior.
- Uma janela de contexto maior não garante respostas melhores.
- Enviar contexto desnecessário pode aumentar os custos sem melhorar a resposta.

### Regra importante

Não escolha um modelo apenas pelo tamanho da janela de contexto ou pelo preço. Avalie o desempenho dele nas tarefas reais que você pretende executar.

Esses quatro conceitos são especialmente úteis quando você trabalha com agentes de programação, APIs de LLMs, OpenCode, GitHub Copilot e ferramentas de desenvolvimento apoiado por IA.

---

## 7. Conclusão

| Conceito | Pergunta que responde |
|---|---|
| Janela de contexto | Quanto a IA consegue considerar? |
| Custo de tokens | Quanto custa utilizar a IA? |
| Latência | Quanto tempo a IA demora? |
| Qualidade de saída | Quão bom é o resultado? |

**Em resumo:** esses quatro fatores ajudam a avaliar a capacidade, o custo, a velocidade e a eficiência de um modelo de Inteligência Artificial.
