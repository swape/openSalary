import type { salaryConfig } from '../config/salary'

export type RoleId = (typeof salaryConfig.roles)[number]['id']
export type CareerLevelId = (typeof salaryConfig.careerLevels)[number]['id']
export type SectorId = (typeof salaryConfig.sectors)[number]['id']
export type EducationId = (typeof salaryConfig.education)[number]['id']
export type SkillId = (typeof salaryConfig.skills)[number]['id']

export interface SalaryInput {
  role: RoleId
  careerLevel: CareerLevelId
  careerPointsPerLevel: number
  sector: SectorId
  education: EducationId
  experienceYears: number
  skills: SkillId[]
  experiencePointsPerYear: number
  educationPremiumPoints: number
  skillPremiumPoints: number
  inflationPercent: number
  projectionYears: number
}

export interface SalaryComponent {
  label: string
  points: number
  annualNok: number
  evidence: 'ssb' | 'scenario'
}

export interface ProjectionYear {
  year: number
  experienceYears: number
  annualNok: number
  realAnnualNok: number
  grunnbelop: number
  historicalTrendAnnualNok: number
}

export interface HistoricalSalary {
  year: number
  annualNok: number
}

export interface SalaryResult {
  year: number
  occupationCode: string
  occupationLabel: string
  usesPublicBenchmark: boolean
  annualNok: number
  monthlyNok: number
  grunnbelop: number
  components: SalaryComponent[]
  history: HistoricalSalary[]
  historicalGrowthPercent: number
  projection: ProjectionYear[]
}
