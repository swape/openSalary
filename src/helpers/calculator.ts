import { salaryConfig, snapshot } from '../config/salary'
import type { SalaryInput, SalaryResult } from '../types/salary'

function requireRange(
  value: number,
  label: string,
  min: number,
  max: number,
  integer = false
) {
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    throw new Error(
      `${label} må være ${integer ? 'et heltall' : 'et tall'} mellom ${min} og ${max}.`
    )
  }
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const role = salaryConfig.roles.find((option) => option.id === input.role)
  const careerLevel = salaryConfig.careerLevels.find(
    (option) => option.id === input.careerLevel
  )
  const sector = salaryConfig.sectors.find(
    (option) => option.id === input.sector
  )
  const education = salaryConfig.education.find(
    (option) => option.id === input.education
  )
  if (!role || !careerLevel || !sector || !education) {
    throw new Error('Velg gyldig rolle, karrierenivå, sektor og utdanning.')
  }
  if (
    !Array.isArray(input.skills) ||
    new Set(input.skills).size !== input.skills.length ||
    input.skills.some(
      (skill) => !salaryConfig.skills.some((option) => option.id === skill)
    )
  ) {
    throw new Error('Kompetanser må være gyldige og kan bare velges én gang.')
  }
  requireRange(
    input.experienceYears,
    'Erfaring',
    0,
    salaryConfig.maxExperienceYears,
    true
  )
  requireRange(
    input.projectionYears,
    'Prognoseår',
    1,
    salaryConfig.maxProjectionYears,
    true
  )
  requireRange(
    input.inflationPercent,
    'Årlig KPI',
    salaryConfig.inflationRange.min,
    salaryConfig.inflationRange.max
  )
  for (const [label, points] of [
    ['Karrierepoeng', input.careerPointsPerLevel],
    ['Erfaringspoeng', input.experiencePointsPerYear],
    ['Utdanningspoeng', input.educationPremiumPoints],
    ['Kompetansepoeng', input.skillPremiumPoints],
  ] as const) {
    requireRange(points, label, 0, salaryConfig.maxPremiumPoints)
  }

  const usesPublicBenchmark = input.sector !== 'private'
  const occupationCode = usesPublicBenchmark
    ? salaryConfig.publicOccupationCode
    : role.occupationCode
  const medians = snapshot.salary.monthlyMedians[occupationCode]
  const monthlyMedian = medians[sector.code]
  if (
    monthlyMedian === null ||
    !Number.isFinite(monthlyMedian) ||
    monthlyMedian <= 0
  ) {
    throw new Error(
      'SSB mangler publisert lønn for dette valget. Ingen beregning er tilgjengelig.'
    )
  }
  const baseAnnualNok = medians.ALLE * salaryConfig.monthsPerYear
  const sectorAnnualNok =
    (monthlyMedian - medians.ALLE) * salaryConfig.monthsPerYear
  const experiencePoints = input.experienceYears * input.experiencePointsPerYear
  const educationPoints =
    input.education === 'none'
      ? 0
      : education.points + input.educationPremiumPoints
  const skillPoints = input.skills.reduce((total, skill) => {
    const option = salaryConfig.skills.find((item) => item.id === skill)
    if (!option) {
      throw new Error('Ugyldig kompetanse.')
    }
    return total + option.points + input.skillPremiumPoints
  }, 0)
  const components: SalaryResult['components'] = [
    {
      label: 'Yrkesreferanse · alle sektorer',
      points: baseAnnualNok / salaryConfig.pointValueNok,
      annualNok: baseAnnualNok,
      evidence: 'ssb',
    },
    {
      label: 'Sektorforskjell',
      points: sectorAnnualNok / salaryConfig.pointValueNok,
      annualNok: sectorAnnualNok,
      evidence: 'ssb',
    },
    ...[
      {
        label: `Karrierenivå · ${careerLevel.label}`,
        points: careerLevel.steps * input.careerPointsPerLevel,
      },
      { label: 'Erfaring', points: experiencePoints },
      { label: 'Utdanning', points: educationPoints },
      { label: 'Kompetanser', points: skillPoints },
    ].map((component) => ({
      ...component,
      annualNok: component.points * salaryConfig.pointValueNok,
      evidence: 'scenario' as const,
    })),
  ]
  const annualNok = components.reduce(
    (total, component) => total + component.annualNok,
    0
  )
  const history = snapshot.salary.history.map((entry, index) => {
    const median = entry.monthlyMedians[occupationCode][sector.code]
    if (
      entry.year !== snapshot.salary.year - 9 + index ||
      median === null ||
      !Number.isFinite(median) ||
      median <= 0
    ) {
      throw new Error('SSB mangler en komplett tiårsserie for dette valget.')
    }
    return { year: entry.year, annualNok: median * salaryConfig.monthsPerYear }
  })
  const firstHistoricalYear = history[0]
  const lastHistoricalYear = history[history.length - 1]
  if (
    history.length !== 10 ||
    lastHistoricalYear.annualNok !== monthlyMedian * salaryConfig.monthsPerYear
  ) {
    throw new Error(
      'SSBs lønnshistorikk stemmer ikke med siste lønnsreferanse.'
    )
  }
  const historicalGrowthFactor =
    (lastHistoricalYear.annualNok / firstHistoricalYear.annualNok) **
    (1 / (lastHistoricalYear.year - firstHistoricalYear.year))
  const projection = Array.from(
    { length: input.projectionYears + 1 },
    (_, offset) => {
      const experienceYears = Math.min(
        input.experienceYears + offset,
        salaryConfig.maxExperienceYears
      )
      const extraExperienceNok =
        (experienceYears - input.experienceYears) *
        input.experiencePointsPerYear *
        salaryConfig.pointValueNok
      const realAnnualNok = annualNok + extraExperienceNok
      const projectedAnnualNok =
        realAnnualNok * (1 + input.inflationPercent / 100) ** offset
      return {
        year: snapshot.salary.year + offset,
        experienceYears,
        annualNok: projectedAnnualNok,
        realAnnualNok,
        grunnbelop: projectedAnnualNok / salaryConfig.grunnbelop.annualNok,
        historicalTrendAnnualNok:
          lastHistoricalYear.annualNok * historicalGrowthFactor ** offset,
      }
    }
  )
  return {
    year: snapshot.salary.year,
    occupationCode,
    occupationLabel: salaryConfig.occupations[occupationCode],
    usesPublicBenchmark,
    annualNok,
    monthlyNok: annualNok / salaryConfig.monthsPerYear,
    grunnbelop: annualNok / salaryConfig.grunnbelop.annualNok,
    components,
    history,
    historicalGrowthPercent: (historicalGrowthFactor - 1) * 100,
    projection,
  }
}
