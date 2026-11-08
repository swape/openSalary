import snapshot from './ssb-snapshot.json' with { type: 'json' }

export const salaryConfig = {
  pointValueNok: 1000,
  monthsPerYear: 12,
  maxExperienceYears: 60,
  maxProjectionYears: 30,
  maxPremiumPoints: 1000,
  inflationRange: { min: 0, max: 20 },
  publicOccupationCode: '25',
  roles: [
    { id: 'frontend', label: 'Frontend', occupationCode: '2513' },
    { id: 'backend', label: 'Backend', occupationCode: '2512' },
    { id: 'devops', label: 'DevOps', occupationCode: '2522' },
    { id: 'fullstack', label: 'Fullstack', occupationCode: '2512' },
  ],
  sectors: [
    {
      id: 'private',
      label: 'Privat sektor og offentlig eide foretak',
      code: 'A+B+D+E',
    },
    { id: 'state', label: 'Offentlig sektor · stat', code: '6100' },
    { id: 'municipal', label: 'Offentlig sektor · kommune', code: '6500' },
  ],
  careerLevels: [
    { id: 'junior', label: 'Junior', steps: 0 },
    { id: 'mid-range', label: 'Mid-range', steps: 1 },
    { id: 'senior', label: 'Senior', steps: 2 },
    { id: 'lead', label: 'Lead', steps: 3 },
    { id: 'principal', label: 'Principal', steps: 4 },
  ],
  education: [
    { id: 'none', label: 'Ingen høyere utdanning', points: 0 },
    { id: 'bachelor', label: 'Bachelor', points: 0 },
    { id: 'master', label: 'Master', points: 0 },
    { id: 'phd', label: 'PhD', points: 0 },
  ],
  skills: [
    { id: 'cloud', label: 'Skysertifisering', points: 0 },
    { id: 'kubernetes', label: 'Kubernetes', points: 0 },
    { id: 'security', label: 'IT-sikkerhet', points: 0 },
    { id: 'architecture', label: 'Systemarkitektur', points: 0 },
  ],
  defaults: {
    role: 'backend',
    careerLevel: 'junior',
    careerPointsPerLevel: 150,
    sector: 'private',
    education: 'bachelor',
    experienceYears: 0,
    experiencePointsPerYear: 5,
    educationPremiumPoints: 50,
    skillPremiumPoints: 3,
    projectionYears: 10,
    inflationPercent: snapshot.cpi.annualChangePercent,
  },
  occupations: {
    '2512': 'Programvareutviklere',
    '2513': 'Nett- og multimediautviklere',
    '2522': 'Systemadministratorer',
    '25': 'IKT-rådgivere',
  },
  grunnbelop: {
    annualNok: 136549,
    effectiveDate: '2026-05-01',
    source: 'https://www.nav.no/grunnbelopet',
    retrievedAt: '2026-11-08',
  },
  sources: {
    salary: `https://www.ssb.no/statbank/table/${snapshot.salary.table}`,
    cpi: `https://www.ssb.no/statbank/table/${snapshot.cpi.table}`,
  },
} as const

export { snapshot }
