import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * O WCAG é cumulativo: para atender ao nível AA é preciso atender também aos
 * critérios do nível A. As tags abaixo cobrem o WCAG 2.0, 2.1 e 2.2 nos dois
 * níveis, que é o alvo de conformidade do projeto.
 * https://www.w3.org/WAI/WCAG22/quickref/
 */
const WCAG_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
]

const ROUTES = [
  { path: '/login', name: 'login', title: 'Login' },
  { path: '/cadastro', name: 'cadastro', title: 'Cadastro' },
]

for (const route of ROUTES) {
  test(`${route.name} page meets WCAG 2.2 AA`, async ({ page }) => {
    await page.goto(route.path)

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_AA_TAGS)
      .analyze()

    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node) => node.target),
    }))

    expect(violations).toEqual([])
  })

  // 2.4.2 Page Titled (A): o título precisa descrever a página atual.
  test(`${route.name} page has a descriptive title`, async ({ page }) => {
    await page.goto(route.path)

    await expect(page).toHaveTitle(new RegExp(route.title))
  })

  // 1.4.10 Reflow (AA): conteúdo deve caber em 320 CSS px sem rolagem horizontal.
  test(`${route.name} page reflows at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(route.path)

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })
}
