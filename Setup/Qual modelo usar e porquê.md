# Conceitos fundamentais de modelos de IA

Para escolher e utilizar modelos de linguagem de grande porte (LLMs), como GPT, Claude, Gemini e DeepSeek, é útil compreender quatro dimensões:

- **Janela de contexto:** quanto conteúdo o modelo pode considerar em uma solicitação.
- **Custo de tokens:** quanto custa processar as informações de entrada e gerar a resposta.
- **Latência:** quanto tempo a aplicação leva para começar e concluir uma resposta.
- **Qualidade de saída:** o quanto a resposta atende ao objetivo com correção, clareza e confiabilidade.

Esses conceitos ajudam a comparar modelos e a tomar decisões de arquitetura. Nenhum deles, isoladamente, determina qual modelo é melhor: a escolha depende da tarefa, do orçamento e da experiência desejada.

## 1. Janela de contexto (Context Window)

A janela de contexto é o limite de tokens que um modelo pode considerar durante uma solicitação. Ela pode incluir instruções, mensagens anteriores, documentos, trechos de código, resultados de ferramentas e a resposta gerada. A composição exata desse limite varia de acordo com o modelo e a plataforma.

Um **token** não equivale necessariamente a uma palavra ou caractere. A tokenização depende do idioma e do texto: uma palavra pode corresponder a um ou mais tokens, e código, pontuação e espaços também consomem tokens.

Imagine que você está desenvolvendo um sistema e fornece à IA:

- Requisitos e instruções do projeto.
- Documentação e exemplos.
- Arquivos ou trechos do código-fonte.
- Histórico da conversa.
- Resultados de comandos ou ferramentas.

Todo esse material precisa caber no contexto disponível, junto com a resposta que o modelo ainda vai produzir. Por isso, o espaço usado pela entrada pode reduzir o espaço restante para a saída. Algumas plataformas também têm limites de saída separados.

### Para que serve?

- Estimar quanto conteúdo pode ser enviado em uma interação.
- Trabalhar com documentação ou bases de código extensas.
- Preservar informações relevantes ao longo de uma tarefa.
- Entender por que pode ser necessário resumir, selecionar ou recuperar informações sob demanda.

### Exemplo

Um modelo com uma janela de 128 mil tokens pode, em princípio, considerar mais conteúdo simultaneamente do que outro com 8 mil tokens. Os números são apenas ilustrativos: limites e convenções devem ser confirmados na documentação do modelo e da API utilizados.

**Importante:** uma janela maior não garante que o modelo compreenda ou utilize perfeitamente cada detalhe. Informações irrelevantes podem competir pela atenção, e o modelo ainda pode deixar passar fatos importantes em textos longos.

### Boas práticas

- Envie o contexto necessário, não todos os dados disponíveis.
- Priorize requisitos, restrições e exemplos diretamente relacionados à tarefa.
- Divida trabalhos extensos em etapas ou use busca e recuperação de trechos relevantes.
- Confira se documentos grandes foram incluídos integralmente ou resumidos pela ferramenta utilizada.

## 2. Custo de tokens (Token Cost)

O custo de tokens é o valor cobrado pelo uso de um modelo, sobretudo em APIs comerciais. Em geral, a cobrança é calculada com base no volume processado, mas os preços e as regras variam entre provedores, modelos e modalidades de uso.

As categorias mais comuns são:

- **Tokens de entrada (input):** instruções, perguntas, histórico, documentos e outros dados enviados ao modelo.
- **Tokens de saída (output):** texto, código ou outros conteúdos gerados pelo modelo.
- **Tokens em cache:** quando disponíveis, representam conteúdo de entrada reutilizado e podem ter uma tarifa diferente.
- **Tokens de raciocínio:** alguns modelos ou APIs contabilizam separadamente tokens associados ao raciocínio interno; essa regra não é universal.

### Como estimar o custo

Quando os preços são informados por milhão de tokens, uma estimativa simplificada é:

> **Custo = (tokens de entrada ÷ 1.000.000 × preço de entrada) + (tokens de saída ÷ 1.000.000 × preço de saída)**

Considere um exemplo fictício:

| Tipo | Preço por 1 milhão de tokens |
|---|---:|
| Entrada | US$ 1,00 |
| Saída | US$ 4,00 |

Para 100 mil tokens de entrada e 20 mil tokens de saída:

- Entrada: 100.000 ÷ 1.000.000 × US$ 1,00 = **US$ 0,10**.
- Saída: 20.000 ÷ 1.000.000 × US$ 4,00 = **US$ 0,08**.
- **Total estimado: US$ 0,18.**

Os valores são apenas ilustrativos e não representam a tabela de preços de um provedor específico. A fatura real pode incluir regras adicionais, como cache, ferramentas, modalidades de processamento, impostos ou arredondamentos.

### Para que serve?

- Controlar os gastos com APIs de IA.
- Comparar o custo-benefício entre modelos.
- Prever o orçamento de uma aplicação conforme o volume de uso.
- Identificar o impacto de históricos longos ou respostas extensas.

### Boas práticas

- Consulte os preços e a forma de contabilização na documentação oficial do provedor.
- Meça o consumo com dados reais, pois prompts semelhantes podem gerar quantidades diferentes de tokens.
- Remova contexto repetido ou irrelevante e limite o tamanho das respostas quando apropriado.
- Considere o custo por tarefa concluída, não apenas o preço por token: um modelo mais caro pode exigir menos tentativas ou correções.

## 3. Latência (Latency)

Latência é o tempo decorrido entre o envio de uma solicitação e a resposta do sistema. Ela é influenciada pelo modelo, pelo tamanho da entrada e da saída, pela infraestrutura, pela rede, pela fila de processamento e por ferramentas externas que participem da operação.

Duas medidas ajudam a descrever a experiência:

- **Time to First Token (TTFT):** tempo até o primeiro trecho da resposta ser recebido.
- **Tempo total de resposta:** tempo até a geração da resposta terminar.

Em uma aplicação com streaming, o usuário pode começar a ler enquanto o restante ainda está sendo gerado. Assim, um TTFT baixo pode tornar a experiência mais ágil mesmo quando o tempo total continua alto.

### Exemplo

Se uma aplicação recebe o primeiro trecho da resposta após 2 segundos e termina a geração após 8 segundos, o TTFT é aproximadamente 2 segundos e o tempo total é aproximadamente 8 segundos. Uma medição completa também deve considerar o tempo de rede e de eventuais ferramentas.

| Modelo | Tempo total ilustrativo |
|---|---:|
| Modelo A | 2 segundos |
| Modelo B | 8 segundos |
| Modelo C | 15 segundos |

Nesse exemplo, o Modelo A conclui mais rapidamente. Isso não significa, por si só, que ele produza a melhor resposta.

### Para que serve?

- Avaliar a velocidade percebida pelo usuário.
- Escolher modelos para experiências interativas ou aplicações em tempo real.
- Identificar gargalos em chamadas ao modelo, à rede ou a ferramentas.
- Acompanhar a consistência do serviço em diferentes condições de carga.

### Boas práticas

- Meça separadamente TTFT e tempo total.
- Compare modelos usando solicitações e condições equivalentes.
- Avalie percentis, como p50 e p95, além da média: alguns pedidos podem demorar muito mais do que outros.
- Considere streaming, cache ou respostas mais curtas quando essas opções forem adequadas à aplicação.

## 4. Qualidade de saída (Output Quality)

A qualidade de saída descreve o quanto o resultado é útil e adequado à tarefa. Uma resposta fluente pode parecer convincente sem estar correta; por isso, qualidade não deve ser avaliada apenas pela aparência do texto.

Uma saída de qualidade deve ser:

- **Correta:** compatível com os fatos, os dados e as regras relevantes.
- **Relevante:** concentrada no que foi solicitado.
- **Coerente:** consistente ao longo da resposta.
- **Completa:** atende aos requisitos e às restrições importantes.
- **Clara:** fácil de entender e usar.
- **Segura:** evita ações ou orientações que criem riscos desnecessários.

Em desenvolvimento de software, também vale verificar se a solução:

- Funciona nos cenários esperados e trata casos de erro.
- Atende aos requisitos e se integra ao código existente.
- É legível, testável e manutenível.
- Evita vulnerabilidades e exposição indevida de dados.
- Inclui testes ou evidências adequadas quando necessário.

### Exemplo

Dois modelos recebem a solicitação de implementar autenticação:

- **Modelo A** responde rapidamente, mas não valida dados e armazena credenciais de forma insegura.
- **Modelo B** leva um pouco mais de tempo, contempla validações e tratamento de erros e recomenda práticas de armazenamento seguro.

Para esse objetivo, a resposta do Modelo B é de maior qualidade, desde que também funcione e atenda aos requisitos do projeto.

### Como avaliar

- Defina critérios observáveis antes de comparar os modelos.
- Teste com tarefas representativas do uso real.
- Verifique fatos, código e referências importantes; não trate a resposta como automaticamente correta.
- Use testes automatizados, revisão humana ou conjuntos de avaliação quando aplicável.
- Considere a variabilidade: uma única resposta não representa necessariamente o desempenho consistente do modelo.

## 5. Comparação geral

| Conceito | O que mede? | Principal preocupação |
|---|---|---|
| Janela de contexto | Volume de tokens que pode ser considerado em uma interação | Capacidade e seleção de informações |
| Custo de tokens | Valor do processamento de entrada e saída | Orçamento e eficiência |
| Latência | Tempo para começar e concluir a resposta | Velocidade e experiência do usuário |
| Qualidade de saída | Adequação e confiabilidade do resultado | Utilidade e correção |

## 6. Como esses fatores se relacionam?

Imagine que você está usando OpenCode e um modelo DeepSeek para trabalhar em um projeto. A escolha depende do que você precisa realizar. Um modelo adequado deve oferecer:

- Contexto suficiente para os arquivos e requisitos relevantes.
- Custo compatível com o orçamento e o volume de uso.
- Latência aceitável para o fluxo de trabalho.
- Qualidade suficiente para produzir resultados confiáveis na tarefa.

Esses fatores podem entrar em conflito:

- Um modelo mais barato pode exigir mais tentativas ou revisão em tarefas complexas.
- Um modelo com maior capacidade pode levar mais tempo para responder.
- Uma janela de contexto maior não garante melhor compreensão.
- Enviar contexto desnecessário pode elevar o custo e dificultar a identificação do que é importante.
- Uma resposta mais curta pode reduzir custo e latência, mas deixar de atender a requisitos relevantes.

### Uma forma prática de escolher

1. **Defina a tarefa:** por exemplo, explicar um conceito, revisar código ou gerar uma implementação.
2. **Estabeleça critérios:** correção, testes, tempo máximo, custo por tarefa e limites de contexto.
3. **Compare modelos com os mesmos exemplos:** mantenha prompts e condições tão equivalentes quanto possível.
4. **Verifique os resultados:** avalie qualidade e segurança, além de preço e velocidade.
5. **Monitore em uso real:** acompanhe custos, latência e qualidade ao longo do tempo, pois o padrão de uso pode mudar.

**Regra importante:** não escolha um modelo apenas pelo tamanho da janela de contexto ou pelo preço. Avalie seu desempenho nas tarefas reais que você pretende executar.

Esses conceitos são especialmente úteis ao trabalhar com agentes de programação, APIs de LLMs, OpenCode, GitHub Copilot e outras ferramentas de desenvolvimento apoiado por IA.

## 7. Conclusão

| Conceito | Pergunta que responde |
|---|---|
| Janela de contexto | Quanto conteúdo o modelo pode considerar nesta interação? |
| Custo de tokens | Quanto custa processar a entrada e gerar a resposta? |
| Latência | Quanto tempo leva para começar e terminar a resposta? |
| Qualidade de saída | O resultado é correto, útil e adequado à tarefa? |

**Em resumo:** contexto, custo, latência e qualidade ajudam a avaliar a capacidade, a economia, a velocidade e a confiabilidade de um modelo de IA. A melhor escolha é aquela que equilibra esses fatores para o caso de uso concreto.
