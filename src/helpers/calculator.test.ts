import { describe, expect, it } from 'vitest'
import { salaryConfig, snapshot } from '../config/salary'
import { calculateSalary } from './calculator'
import type { SalaryInput } from '../types/salary'

const defaults: SalaryInput = {
  ...salaryConfig.defaults,
  skills: [],
  experiencePointsPerYear: 0,
  educationPremiumPoints: 0,
  skillPremiumPoints: 0,
  careerPointsPerLevel: 0,
}

describe('salary calculator', () => {
  it('rejects a gap in SSB history rather than estimating from an incomplete series', () => {
    const entry = snapshot.salary.history[0]
    const year = entry.year
    try {
      entry.year = year - 1
      expect(() => calculateSalary(defaults)).toThrow('komplett tiårsserie')
    } finally {
      entry.year = year
    }
  })

  it.each([0, NaN])('rejects invalid historical salary %s', (invalid) => {
    const medians = snapshot.salary.history[0].monthlyMedians['2512']
    const median = medians['A+B+D+E']
    try {
      medians['A+B+D+E'] = invalid
      expect(() => calculateSalary(defaults)).toThrow('komplett tiårsserie')
    } finally {
      medians['A+B+D+E'] = median
    }
  })

  it.each([
    ['frontend', 'private', 44050, 63660],
    ['backend', 'private', 52880, 78080],
    ['fullstack', 'private', 52880, 78080],
    ['devops', 'private', 49200, 66610],
    ['frontend', 'state', 48580, 68380],
    ['backend', 'municipal', 45020, 61220],
  ] as const)(
    'uses ten SSB years and nine growth intervals for %s/%s',
    (role, sector, firstMonthly, lastMonthly) => {
      const result = calculateSalary({
        ...defaults,
        role,
        sector,
        projectionYears: 2,
        inflationPercent: 20,
      })
      const growthFactor = (lastMonthly / firstMonthly) ** (1 / 9)
      expect(result.history).toHaveLength(10)
      expect(result.history.map((year) => year.year)).toEqual(
        Array.from({ length: 10 }, (_, index) => 2016 + index)
      )
      expect(result.history[0].annualNok).toBe(firstMonthly * 12)
      expect(result.history[9].annualNok).toBe(lastMonthly * 12)
      expect(result.historicalGrowthPercent).toBeCloseTo(
        (growthFactor - 1) * 100
      )
      expect(result.projection[0].historicalTrendAnnualNok).toBe(
        lastMonthly * 12
      )
      expect(result.projection[2].historicalTrendAnnualNok).toBeCloseTo(
        lastMonthly * 12 * growthFactor ** 2
      )
    }
  )

  it('keeps historical salaries and the reference trend independent of personal premiums and CPI', () => {
    const reference = calculateSalary(defaults)
    const adjusted = calculateSalary({
      ...defaults,
      careerLevel: 'principal',
      careerPointsPerLevel: 150,
      experienceYears: 20,
      experiencePointsPerYear: 10,
      inflationPercent: 10,
    })
    expect(adjusted.history).toEqual(reference.history)
    expect(
      adjusted.projection.map((year) => year.historicalTrendAnnualNok)
    ).toEqual(reference.projection.map((year) => year.historicalTrendAnnualNok))
    expect(adjusted.projection[1].annualNok).not.toBe(
      reference.projection[1].annualNok
    )
  })

  it.each([
    ['junior', 0],
    ['mid-range', 150000],
    ['senior', 300000],
    ['lead', 450000],
    ['principal', 600000],
  ] as const)(
    'adds the default career premium for %s',
    (careerLevel, premium) => {
      const result = calculateSalary({
        ...defaults,
        careerLevel,
        careerPointsPerLevel: salaryConfig.defaults.careerPointsPerLevel,
        inflationPercent: 0,
      })
      const baseline = calculateSalary(defaults).annualNok
      expect(result.annualNok).toBe(baseline + premium)
      expect(result.components[2]).toMatchObject({
        points: premium / 1000,
        annualNok: premium,
        evidence: 'scenario',
      })
      expect(result.projection[1].realAnnualNok).toBe(result.annualNok)
    }
  )

  it('applies adjusted fractional career points and allows disabling them', () => {
    const baseline = calculateSalary(defaults).annualNok
    expect(
      calculateSalary({
        ...defaults,
        careerLevel: 'senior',
        careerPointsPerLevel: 75.5,
      }).annualNok
    ).toBe(baseline + 151000)
    expect(
      calculateSalary({
        ...defaults,
        careerLevel: 'principal',
      }).annualNok
    ).toBe(baseline)
  })
  it('applies configured default premiums to the profile and future experience', () => {
    const result = calculateSalary({
      ...salaryConfig.defaults,
      experienceYears: 2,
      skills: ['cloud'],
    })
    const reference = calculateSalary(defaults).annualNok
    expect(result.annualNok).toBe(reference + 63000)
    expect(result.projection[1].realAnnualNok).toBe(reference + 68000)
  })
  it.each(salaryConfig.roles)(
    'reconstructs the private median for $label without double counting',
    (role) => {
      const result = calculateSalary({ ...defaults, role: role.id })
      const expected =
        snapshot.salary.monthlyMedians[role.occupationCode]['A+B+D+E'] * 12
      expect(result.annualNok).toBe(expected)
      expect(result.monthlyNok).toBe(expected / 12)
      expect(
        result.components.reduce(
          (total, component) => total + component.points,
          0
        ) * 1000
      ).toBeCloseTo(expected)
      expect(result.grunnbelop).toBeCloseTo(
        expected / salaryConfig.grunnbelop.annualNok
      )
      expect(result.usesPublicBenchmark).toBe(false)
    }
  )

  it.each(['state', 'municipal'] as const)(
    'explicitly uses the wider IT group for %s',
    (sector) => {
      const result = calculateSalary({ ...defaults, sector, role: 'frontend' })
      const code = salaryConfig.sectors.find(
        (option) => option.id === sector
      )!.code
      expect(result.occupationCode).toBe('25')
      expect(result.usesPublicBenchmark).toBe(true)
      expect(result.annualNok).toBe(
        snapshot.salary.monthlyMedians['25'][code] * 12
      )
      expect(result.components[1].points).toBeLessThan(0)
    }
  )

  it('leaves uncalibrated premiums at zero regardless of profile', () => {
    const baseline = calculateSalary(defaults)
    const changed = calculateSalary({
      ...defaults,
      experienceYears: 20,
      education: 'phd',
      skills: ['cloud', 'security'],
    })
    expect(changed.annualNok).toBe(baseline.annualNok)
  })

  it('applies user-defined premiums once and compounds CPI over the entire real salary', () => {
    const result = calculateSalary({
      ...defaults,
      experienceYears: 5,
      experiencePointsPerYear: 10,
      educationPremiumPoints: 20,
      skillPremiumPoints: 5,
      skills: ['cloud', 'security'],
      inflationPercent: 3,
      projectionYears: 2,
    })
    const baseline = calculateSalary(defaults).annualNok
    expect(result.annualNok).toBe(baseline + 80000)
    expect(result.projection).toHaveLength(3)
    expect(result.projection[0].annualNok).toBe(result.annualNok)
    expect(result.projection[2].realAnnualNok).toBe(result.annualNok + 20000)
    expect(result.projection[2].annualNok).toBeCloseTo(
      (result.annualNok + 20000) * 1.03 ** 2
    )
    expect(result.projection[2].year).toBe(snapshot.salary.year + 2)
  })

  it('ignores the education premium when no higher education is selected', () => {
    const result = calculateSalary({
      ...defaults,
      education: 'none',
      educationPremiumPoints: 100,
    })
    expect(result.annualNok).toBe(calculateSalary(defaults).annualNok)
  })

  it('caps future experience and supports zero CPI without fabricating G growth', () => {
    const result = calculateSalary({
      ...defaults,
      experienceYears: 59,
      experiencePointsPerYear: 1.5,
      inflationPercent: 0,
      projectionYears: 3,
    })
    expect(result.projection[1].annualNok).toBe(result.annualNok + 1500)
    expect(result.projection[3].annualNok).toBe(result.projection[1].annualNok)
    expect(result.projection[3].experienceYears).toBe(60)
    expect(result.projection[3].grunnbelop).toBeCloseTo(
      result.projection[3].annualNok / salaryConfig.grunnbelop.annualNok
    )
  })

  it.each([
    { experienceYears: -1 },
    { experienceYears: 1.5 },
    { experienceYears: 61 },
    { projectionYears: 0 },
    { projectionYears: 31 },
    { projectionYears: Infinity },
    { inflationPercent: NaN },
    { inflationPercent: -1 },
    { inflationPercent: 21 },
    { educationPremiumPoints: -1 },
    { skillPremiumPoints: 1001 },
    { experiencePointsPerYear: Infinity },
    { careerLevel: 'unknown' },
    { careerPointsPerLevel: -1 },
    { careerPointsPerLevel: 1001 },
    { careerPointsPerLevel: NaN },
    { skills: ['cloud', 'cloud'] },
  ])('rejects invalid input %j instead of producing an estimate', (invalid) => {
    expect(() =>
      calculateSalary({ ...defaults, ...invalid } as SalaryInput)
    ).toThrow()
  })
})
