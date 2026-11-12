import axe from 'axe-core'

/**
 * O WCAG é cumulativo: para atender ao nível AA é preciso atender também aos
 * critérios do nível A. As tags abaixo cobrem o WCAG 2.0, 2.1 e 2.2 nos dois
 * níveis, que é o alvo de conformidade do projeto.
 * https://www.w3.org/WAI/WCAG22/quickref/
 */
export const WCAG_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
]

export function formatA11yViolations(violations) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => {
          const summary = (node.failureSummary ?? '').replace(/\n/g, '\n        ')
          return `    • ${node.target.join(' ')}\n        ${summary}`
        })
        .join('\n')

      return [
        `  [${violation.id}] ${violation.help}`,
        `    impacto: ${violation.impact} | ${violation.helpUrl}`,
        nodes,
      ].join('\n')
    })
    .join('\n\n')
}

/**
 * Roda o axe apenas com as regras mapeadas para o WCAG 2.2 AA.
 *
 * O contraste de cor (1.4.3) fica desligado porque o jsdom não calcula
 * layout/cores; ele é verificado nos testes de navegador (e2e/a11y.spec.js).
 */
export async function analyzeA11y(container = document.body, options = {}) {
  const { rules, ...rest } = options

  return axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_AA_TAGS },
    ...rest,
    rules: {
      // O jsdom não calcula layout/cores, então o contraste (1.4.3) nunca é
      // avaliado aqui. Ele é coberto pelos testes de navegador (e2e/a11y.spec.js).
      'color-contrast': { enabled: false },
      ...rules,
    },
  })
}

export async function findA11yViolations(container = document.body, options = {}) {
  const { violations } = await analyzeA11y(container, options)

  return violations
}

export async function expectNoA11yViolations(container = document.body, options = {}) {
  const violations = await findA11yViolations(container, options)

  if (violations.length > 0) {
    throw new Error(
      `Encontradas ${violations.length} violação(ões) de acessibilidade WCAG 2.2 AA:\n\n${formatA11yViolations(violations)}`,
    )
  }
}
