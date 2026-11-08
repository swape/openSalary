import { readFile, rename, rm, writeFile } from 'node:fs/promises'

const snapshotUrl = new URL('../src/config/ssb-snapshot.json', import.meta.url)
const current = JSON.parse(await readFile(snapshotUrl, 'utf8'))
const api = 'https://data.ssb.no/api/v0/no/table/'

async function request(table, query) {
  const response = await fetch(`${api}${table}`, {
    method: query ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: query
      ? JSON.stringify({ query, response: { format: 'json' } })
      : undefined,
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    throw new Error(`SSB ${table}: HTTP ${response.status}`)
  }
  return response.json()
}

function selection(code, values) {
  return { code, selection: { filter: 'item', values } }
}

function latestYear(metadata) {
  const years = metadata.variables?.find(
    (variable) => variable.code === 'Tid'
  )?.values
  if (
    !Array.isArray(years) ||
    !years.length ||
    years.some((year) => !/^\d{4}$/.test(year))
  ) {
    throw new Error('SSB returnerte ikke gyldige årsverdier.')
  }
  return Math.max(...years.map(Number))
}

function requireColumns(data, expected) {
  if (
    !Array.isArray(data.columns) ||
    data.columns.map((column) => column.code).join(',') !==
      expected.join(',') ||
    !Array.isArray(data.data)
  ) {
    throw new Error(
      'SSB-responsens kolonner har endret seg. Kontroller datagrunnlaget.'
    )
  }
}

function positiveNumber(value) {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    !Number.isFinite(Number(value)) ||
    Number(value) <= 0
  ) {
    throw new Error(
      `SSB returnerte en ugyldig tallverdi: ${JSON.stringify(value)}`
    )
  }
  return Number(value)
}

const [salaryMetadata, cpiMetadata] = await Promise.all([
  request(current.salary.table),
  request(current.cpi.table),
])
const salaryYear = latestYear(salaryMetadata)
const salaryYears = Array.from(
  { length: 10 },
  (_, index) => salaryYear - 9 + index
)
const availableSalaryYears = salaryMetadata.variables.find(
  (variable) => variable.code === 'Tid'
).values
if (salaryYears.some((year) => !availableSalaryYears.includes(String(year)))) {
  throw new Error('SSB mangler år i den siste tiårsperioden.')
}
const cpiYear = latestYear(cpiMetadata)
const occupations = Object.keys(current.salary.monthlyMedians)
const sectors = ['ALLE', 'A+B+D+E', '6500', '6100']
const [salary, cpi] = await Promise.all([
  request(current.salary.table, [
    selection('MaaleMetode', [current.salary.measure]),
    selection('Yrke', occupations),
    selection('Sektor', sectors),
    selection('Kjonn', [current.salary.gender]),
    selection('AvtaltVanlig', [current.salary.workingTime]),
    selection('ContentsCode', [current.salary.content]),
    selection('Tid', salaryYears.map(String)),
  ]),
  request(current.cpi.table, [
    selection('Konsumgrp', [current.cpi.group]),
    selection('ContentsCode', ['Aarsendring']),
    selection('Tid', [String(cpiYear)]),
  ]),
])
requireColumns(salary, [
  'MaaleMetode',
  'Yrke',
  'Sektor',
  'Kjonn',
  'AvtaltVanlig',
  'Tid',
  current.salary.content,
])
requireColumns(cpi, ['Konsumgrp', 'Tid', 'Aarsendring'])
function readMedians(year) {
  const monthlyMedians = {}
  for (const occupation of occupations) {
    monthlyMedians[occupation] = {}
    for (const sector of sectors) {
      const expectedKey = [
        current.salary.measure,
        occupation,
        sector,
        current.salary.gender,
        current.salary.workingTime,
        String(year),
      ]
      const matches = salary.data.filter(
        (row) => JSON.stringify(row.key) === JSON.stringify(expectedKey)
      )
      if (matches.length !== 1 || matches[0].values?.length !== 1) {
        throw new Error(
          `SSB mangler en entydig celle: ${year}/${occupation}/${sector}.`
        )
      }
      const value = matches[0].values[0]
      monthlyMedians[occupation][sector] =
        value === ':' || value === '.' ? null : positiveNumber(value)
    }
    if (
      monthlyMedians[occupation].ALLE === null ||
      monthlyMedians[occupation]['A+B+D+E'] === null
    ) {
      throw new Error(`Påkrevd lønnsreferanse mangler for yrke ${occupation}.`)
    }
  }
  if (
    monthlyMedians['25']['6500'] === null ||
    monthlyMedians['25']['6100'] === null
  ) {
    throw new Error('Påkrevd offentlig IT-referanse mangler.')
  }
  return monthlyMedians
}
const history = salaryYears.map((year) => ({
  year,
  monthlyMedians: readMedians(year),
}))
const monthlyMedians = history[history.length - 1].monthlyMedians
const cpiRows = cpi.data.filter(
  (row) =>
    JSON.stringify(row.key) ===
    JSON.stringify([current.cpi.group, String(cpiYear)])
)
const rawChange = cpiRows[0]?.values?.[0]
if (
  cpiRows.length !== 1 ||
  typeof rawChange !== 'string' ||
  rawChange.trim() === '' ||
  !Number.isFinite(Number(rawChange))
) {
  throw new Error('SSB returnerte ikke en gyldig årlig KPI-endring.')
}
const annualChangePercent = Number(rawChange)
if (annualChangePercent < 0 || annualChangePercent > 20) {
  throw new Error(
    'KPI er utenfor kalkulatorens scenariointervall. Kontroller reglene før oppdatering.'
  )
}
const updated = {
  retrievedAt: new Date().toISOString().slice(0, 10),
  salary: { ...current.salary, year: salaryYear, monthlyMedians, history },
  cpi: { ...current.cpi, year: cpiYear, annualChangePercent },
}
const temporaryUrl = new URL(
  `../src/config/ssb-snapshot.${process.pid}.tmp`,
  import.meta.url
)
try {
  await writeFile(temporaryUrl, `${JSON.stringify(updated, null, 2)}\n`, {
    flag: 'wx',
  })
  await rename(temporaryUrl, snapshotUrl)
} finally {
  await rm(temporaryUrl, { force: true })
}
console.log(
  `SSB-data oppdatert: lønn ${salaryYear}, KPI ${cpiYear}. Kontroller diff, NAV-sats og kjør tester før publisering.`
)
