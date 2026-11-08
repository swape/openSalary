import { expect, test } from '@playwright/test'

test('homepage introduces the openSalary calculator', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('openSalary')
  await expect(
    page.getByRole('heading', { level: 1, name: 'openSalary' })
  ).toBeVisible()
  await expect(
    page.getByText('En åpen lønnskalkulator for Norge.')
  ).toBeVisible()
})
