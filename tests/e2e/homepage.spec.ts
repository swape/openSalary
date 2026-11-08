import { expect, test, type Page } from '@playwright/test'
import type { Chart, ScatterDataPoint } from 'chart.js'
import { snapshot } from '../../src/config/salary'
import { formatNok } from '../../src/helpers/stringsAndNumbers'

async function chartState(page: Page) {
  return page.locator('salary-calculator').evaluate((element) => {
    const chart = (
      element as HTMLElement & {
        chart?: Chart<'line', ScatterDataPoint[]>
      }
    ).chart
    if (!chart) throw new Error('Chart.js instance is missing')
    return {
      min: chart.scales.x.min,
      max: chart.scales.x.max,
      width: chart.width,
      height: chart.height,
      colors: chart.data.datasets.map((dataset) => dataset.borderColor),
      datasets: chart.data.datasets.map((dataset, index) => ({
        data: dataset.data,
        visible: chart.isDatasetVisible(index),
        renderedPoints: chart.getDatasetMeta(index).data.length,
      })),
    }
  })
}

test('homepage introduces the openSalary calculator', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('openSalary')
  await expect(
    page.getByRole('heading', { level: 1, name: 'openSalary' })
  ).toBeVisible()
  await expect(
    page.getByText('En åpen lønnskalkulator for Norge.')
  ).toBeVisible()
  const chartColors = await chartState(page)
  const cssColors = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement)
    return [
      '--color-chart-history',
      '--color-chart-trend',
      '--color-chart-scenario',
      '--color-chart-real',
    ].map((name) => styles.getPropertyValue(name).trim())
  })
  expect(chartColors.colors).toEqual(cssColors)
  await expect(page.locator('[data-annual]')).toHaveText(
    formatNok(snapshot.salary.monthlyMedians['2512']['A+B+D+E'] * 12 + 50000)
  )
  await page.getByText('Egne poengtillegg', { exact: true }).click()
  await expect(
    page.getByLabel('Poeng per erfaringsår', { exact: true })
  ).toHaveValue('5')
  await expect(
    page.getByLabel('Tillegg for valgt utdanning (poeng)')
  ).toHaveValue('50')
  await expect(
    page.getByLabel('Tillegg per valgt kompetanse (poeng)')
  ).toHaveValue('3')
})

test('calculates profile premiums and renders the matching growth scenario', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByText('Egne poengtillegg', { exact: true }).click()
  await page.getByLabel('Relevant erfaring (år)').fill('5')
  await page.getByLabel('Poeng per erfaringsår', { exact: true }).fill('10')
  await page.getByLabel('Tillegg for valgt utdanning (poeng)').fill('20')
  await page.getByLabel('Tillegg per valgt kompetanse (poeng)').fill('5')
  await page.getByLabel('Skysertifisering', { exact: true }).check()
  await page.getByLabel('IT-sikkerhet', { exact: true }).check()
  await page.getByLabel('Årlig KPI i scenarioet (%)').fill('3')
  await page.getByLabel('Antall fremtidige år').fill('2')
  const expectedAnnualNok =
    snapshot.salary.monthlyMedians['2512']['A+B+D+E'] * 12 + 80000
  await expect(page.locator('[data-annual]')).toHaveText(
    formatNok(expectedAnnualNok)
  )
  await expect(page.locator('[data-projection] tr')).toHaveCount(3)
  await expect(page.locator('[data-projection] tr').last()).toContainText(
    String(snapshot.salary.year + 2)
  )
  await expect(
    page.locator('[data-projection] tr').last().locator('td').nth(0)
  ).toHaveText(formatNok((expectedAnnualNok + 20000) * 1.03 ** 2))
  await expect(
    page.locator('[data-projection] tr').last().locator('td').nth(1)
  ).toHaveText(formatNok(expectedAnnualNok + 20000))
  const chart = await chartState(page)
  expect(chart.datasets[2].data.at(-1)?.y).toBeCloseTo(
    (expectedAnnualNok + 20000) * 1.03 ** 2
  )
  expect(chart.datasets[2].renderedPoints).toBe(3)
  await expect(page.locator('[data-error]')).toBeHidden()
  expect(errors).toEqual([])
})

test('selects career levels and adjusts their salary and projection premium', async ({
  page,
}) => {
  await page.goto('/')
  const baseline =
    snapshot.salary.monthlyMedians['2512']['A+B+D+E'] * 12 + 50000
  const level = page.getByRole('combobox', {
    name: 'Karrierenivå',
    exact: true,
  })
  await expect(level).toHaveValue('junior')
  await expect(level.locator('option')).toHaveText([
    'Junior',
    'Mid-range',
    'Senior',
    'Lead',
    'Principal',
  ])
  await level.selectOption('senior')
  await expect(page.locator('[data-annual]')).toHaveText(
    formatNok(baseline + 300000)
  )
  await page.getByText('Egne poengtillegg', { exact: true }).click()
  const points = page.getByLabel('Poeng per karrierenivå', { exact: true })
  await expect(points).toHaveValue('150')
  await points.fill('75.5')
  await expect(page.locator('[data-annual]')).toHaveText(
    formatNok(baseline + 151000)
  )
  await expect(
    page.locator('[data-projection] tr').nth(1).locator('td').nth(1)
  ).toHaveText(formatNok(baseline + 156000))
  await level.selectOption('principal')
  await expect(page.locator('[data-annual]')).toHaveText(
    formatNok(baseline + 302000)
  )
  await points.fill('-1')
  await expect(page.locator('[data-error]')).toBeVisible()
  await expect(page.locator('[data-results]')).toBeHidden()
  await points.fill('0')
  await expect(page.locator('[data-annual]')).toHaveText(formatNok(baseline))
})

test('shows the public benchmark and clears stale results for invalid inputs', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('combobox', { name: 'Sektor', exact: true })
    .selectOption('state')
  await expect(page.locator('[data-benchmark]')).toContainText(
    'Bred offentlig IT-referanse'
  )
  await expect(page.locator('[data-annual]')).toHaveText(
    formatNok(snapshot.salary.monthlyMedians['25']['6100'] * 12 + 50000)
  )
  await page.getByLabel('Relevant erfaring (år)').fill('-1')
  await expect(page.locator('[data-error]')).toBeVisible()
  await expect(page.locator('[data-results]')).toBeHidden()
  await expect(page.locator('[data-growth]')).toBeHidden()
  await page.getByLabel('Relevant erfaring (år)').fill('')
  await expect(page.locator('[data-error]')).toContainText(
    'Fyll ut alle tallfeltene'
  )
  await page.getByLabel('Relevant erfaring (år)').fill('1')
  await expect(page.locator('[data-results]')).toBeVisible()
  await expect(page.locator('[data-error]')).toBeHidden()
})

test('shows SSB history and extends the selected reference at its historical growth rate', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('[data-history] tr')).toHaveCount(10)
  await expect(page.locator('[data-history-summary]')).toContainText(
    '2016-2025'
  )
  const role = page.getByRole('combobox', { name: 'Rolle', exact: true })
  const sector = page.getByRole('combobox', { name: 'Sektor', exact: true })
  for (const [roleId, sectorId, occupation, sectorCode] of [
    ['frontend', 'private', '2513', 'A+B+D+E'],
    ['devops', 'private', '2522', 'A+B+D+E'],
    ['backend', 'state', '25', '6100'],
  ] as const) {
    await role.selectOption(roleId)
    await sector.selectOption(sectorId)
    const first =
      snapshot.salary.history[0].monthlyMedians[occupation][sectorCode]!
    const last = snapshot.salary.monthlyMedians[occupation][sectorCode]!
    await expect(page.locator('[data-history] tr').first()).toContainText(
      formatNok(first * 12)
    )
    await expect(page.locator('[data-history] tr').last()).toContainText(
      formatNok(last * 12)
    )
    await expect(page.locator('[data-history-summary]')).toContainText(
      `(${occupation})`
    )
    await expect(
      page.locator('[data-projection] tr').nth(1).locator('td').nth(3)
    ).toHaveText(formatNok(last * 12 * (last / first) ** (1 / 9)))
    const chart = await chartState(page)
    expect(chart.datasets[0].renderedPoints).toBe(10)
    expect(chart.datasets[1].data[0]).toEqual(chart.datasets[0].data[9])
    expect(chart.datasets[1].data[1].x).toBeGreaterThan(
      Number(chart.datasets[1].data[0].x)
    )
  }
  await expect(page.locator('[data-history-summary]')).toContainText(
    'Bred offentlig IT-referanse'
  )
})

test('filters chart series and years, zooms and resets without changing salary', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('[data-salary-chart]')).toBeVisible()
  const initial = await chartState(page)
  const salary = await page.locator('[data-annual]').textContent()
  const trend = page.getByLabel('Estimert SSB-trend (blå stiplet)', {
    exact: true,
  })
  await trend.uncheck()
  expect((await chartState(page)).datasets[1].visible).toBe(false)
  await page.getByRole('button', { name: 'Zoom inn', exact: true }).click()
  const zoomed = await chartState(page)
  expect(zoomed.max - zoomed.min).toBeLessThan(initial.max - initial.min)
  await page.getByRole('button', { name: 'Zoom ut', exact: true }).click()
  const zoomedOut = await chartState(page)
  expect(zoomedOut.max - zoomedOut.min).toBeGreaterThan(zoomed.max - zoomed.min)
  await page
    .getByRole('button', { name: 'Tilbakestill zoom', exact: true })
    .click()
  expect((await chartState(page)).min).toBe(initial.min)
  expect((await chartState(page)).max).toBe(initial.max)

  await page.locator('[data-salary-chart]').scrollIntoViewIfNeeded()
  const canvas = await page.locator('[data-salary-chart]').boundingBox()
  if (!canvas) throw new Error('Chart canvas is missing')
  await page.mouse.move(
    canvas.x + canvas.width / 2,
    canvas.y + canvas.height / 2
  )
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -200)
  await page.keyboard.up('Control')
  await expect
    .poll(async () => {
      const state = await chartState(page)
      return state.max - state.min
    })
    .toBeLessThan(initial.max - initial.min)
  const beforePan = await chartState(page)
  await page.keyboard.down('Control')
  await page.mouse.down()
  await page.mouse.move(
    canvas.x + canvas.width / 2 + 50,
    canvas.y + canvas.height / 2,
    { steps: 5 }
  )
  await page.mouse.up()
  await page.keyboard.up('Control')
  await expect
    .poll(async () => (await chartState(page)).min)
    .toBeLessThan(beforePan.min)

  await page
    .getByRole('combobox', { name: 'Vis år', exact: true })
    .selectOption('history')
  const history = await chartState(page)
  expect(history.min).toBe(2016)
  expect(history.max).toBe(2025)
  expect(history.datasets[1].visible).toBe(false)
  await page.getByRole('button', { name: 'Zoom inn', exact: true }).click()
  await page
    .getByRole('button', { name: 'Tilbakestill zoom', exact: true })
    .click()
  expect((await chartState(page)).min).toBe(2016)
  expect((await chartState(page)).max).toBe(2025)
  await page
    .getByRole('combobox', { name: 'Vis år', exact: true })
    .selectOption('future')
  expect((await chartState(page)).min).toBe(2025)
  expect((await chartState(page)).max).toBe(2035)
  await expect(page.locator('[data-annual]')).toHaveText(salary!)
  await expect(page.locator('[data-history] tr')).toHaveCount(10)
  await page.getByRole('button', { name: 'Zoom inn', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Rolle', exact: true })
    .selectOption('frontend')
  const refreshed = await chartState(page)
  expect(refreshed.min).toBe(2025)
  expect(refreshed.max).toBe(2035)
  expect(refreshed.datasets[1].visible).toBe(false)
  await trend.check()
  expect((await chartState(page)).datasets[1].visible).toBe(true)
  const filters = page.locator('[data-series]')
  for (const filter of await filters.all()) await filter.uncheck()
  expect(
    (await chartState(page)).datasets.every((dataset) => !dataset.visible)
  ).toBe(true)
  await trend.check()
  expect((await chartState(page)).datasets[1].visible).toBe(true)
  expect(errors).toEqual([])
})

test('shows the profile at full width above results on desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const layout = await page.locator('.calculator-layout').boundingBox()
  const profile = await page
    .locator('[aria-labelledby="profile-title"]')
    .boundingBox()
  const results = await page.locator('[data-results]').boundingBox()
  expect(layout).not.toBeNull()
  expect(profile).not.toBeNull()
  expect(results).not.toBeNull()
  expect(profile!.width).toBeCloseTo(layout!.width)
  expect(results!.y).toBeGreaterThanOrEqual(profile!.y + profile!.height)
})

test('fits a narrow viewport and remains keyboard-accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const controlHeights = await page
    .locator('select, input[type="number"]')
    .evaluateAll((controls) =>
      controls
        .filter((control) => control.getClientRects().length > 0)
        .map((control) => control.getBoundingClientRect().height)
    )
  expect(controlHeights.length).toBeGreaterThan(4)
  expect(new Set(controlHeights).size).toBe(1)
  const selectStyle = await page
    .locator('select')
    .first()
    .evaluate((select) => {
      const style = getComputedStyle(select)
      return {
        appearance: style.appearance,
        backgroundImage: style.backgroundImage,
      }
    })
  expect(selectStyle.appearance).toBe('none')
  expect(selectStyle.backgroundImage).toContain('data:image/svg+xml')
  await page.getByRole('combobox', { name: 'Rolle', exact: true }).focus()
  await expect(
    page.getByRole('combobox', { name: 'Rolle', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('combobox', { name: 'Karrierenivå', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('combobox', { name: 'Sektor', exact: true })
  ).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await expect(page.locator('[data-annual]')).toBeVisible()
  await expect
    .poll(async () => (await chartState(page)).width)
    .toBeGreaterThan(200)
  const canvas = await page.locator('[data-salary-chart]').boundingBox()
  expect(canvas!.width).toBeLessThanOrEqual(375)
})
