# openSalary

An open salary scenario calculator for IT professionals in Norway. It combines
published Statistics Norway (SSB) salary references with transparent, editable
point premiums, and shows results in gross NOK and G (grunnbeløpet).

**SSB supplies the salary references, not the personal premiums.** Career,
experience, education and skill points are scenario assumptions, not documented
market effects or a promise of salary growth.

## Getting started

Use Node.js 22.23.4 or newer and npm 9.6.5 or newer, as required by the installed
Astro version.

```sh
npm ci
npm run dev
```

Open the local URL printed by Astro. For a production build and local preview:

```sh
npm run build
npm run preview
```

The app is built as a static site in `dist/`; it needs no application server,
database, API keys, or runtime SSB connection. JavaScript is required for
interactive calculations, tabs and charts. Initial default results and tables
are rendered into the HTML.

Astro downloads configured Google fonts at development/build time and serves
them locally. Dependency installation, uncached font downloads and explicit
SSB refreshes require network access; salary calculations do not.

## Calculator

The Norwegian-language interface has “Kalkulator” and “Metodikk” tabs.
The full-width profile section supports Frontend, Backend, DevOps and Fullstack;
five career levels; private/state/municipal sectors; experience; education;
and skills. Results include a point breakdown, salary history, and future
charts and tables in gross NOK/year, NOK/month and G. Tax and take-home pay
are not calculated.

The default profile is Backend, Junior, private sector, Bachelor, zero years
of experience and no selected skills. The default horizon is ten future years.
Numeric changes and profile selections recalculate automatically; “Beregn lønn”
also submits the current profile. Invalid entries show an error and hide stale
results until corrected. Experience accepts whole years from 0 to 60; each
editable premium accepts 0-1,000 points in steps of 0.1.

Profile values stay in the current page; there is no persistence, account,
profile export or profile submission to a server. Reloading starts from the
configured defaults.

The responsive graph uses bundled Chart.js and `chartjs-plugin-zoom`, without
CDN requests. It has four series: observed SSB history, extrapolated SSB trend,
the personal nominal scenario and the personal real-salary scenario.
Checkbox filters show/hide series; “Vis år” selects all years, history or future.
The icon buttons zoom in, zoom out and reset, with Norwegian accessible names
and tooltips. Ctrl + mouse wheel or touch pinch zooms horizontally;
Ctrl + drag pans horizontally. Reset restores the selected period.
Changing the salary profile resets zoom but preserves filters. Filters affect
only the graph, not calculations or the data tables below it.

### Data and methodology

- The checked-in snapshot in `src/config/ssb-snapshot.json` was retrieved on
  2026-11-08 from [SSB table 11418](https://www.ssb.no/statbank/table/11418).
  It uses 2025 median monthly salary, both sexes, full-time employees
  (`MaaleMetode=01`, `Kjonn=0`, `AvtaltVanlig=5`, `ContentsCode=Manedslonn`).
  Monthly salary includes bonuses and irregular allowances, excluding overtime.
  Multiplication by 12 is an annualized reference, not observed annual income.
- Frontend maps to occupation 2513, Backend/Fullstack to 2512, and DevOps to
  2522. These are approximate mappings, not SSB statistics for those exact roles.
  Private includes publicly owned enterprises. Detailed public-sector cells
  are unpublished (`null`), so public selections explicitly use the broader
  occupation 25 (ICT professionals), separately for state and municipal sectors.
  Public results are not role-specific; sector medians are never averaged.
- One point is NOK 1,000/year. Base points are the all-sector occupational
  median x 12 / 1,000; sector points are the selected-sector difference x 12 /
  1,000. Fractional and negative sector points preserve the published values.
  Their sum exactly reconstructs the selected-sector reference.
- The graph includes the last ten published SSB years (2016-2025), using
  the same occupation, sector, median, gender, and working-time selection.
  Historical NOK/year is monthly median x 12, without personal premiums.
  A separate estimated SSB trend extends the last reference using the compounded
  annual growth rate `(last / first)^(1/9) - 1`: ten observations span nine
  growth intervals. It includes nominal wage growth, so no extra CPI or
  experience points are added. It is not an official SSB forecast or a
  longitudinal study of individual workers; workforce composition can change.
  Public history uses the same broader occupation 25 proxy. The existing
  personal CPI-and-points scenario remains separate.
- Career levels are Junior (0 points), Mid-range (150), Senior (300),
  Lead (450), and Principal (600). Junior is the default baseline; each level
  above it adds 150 points by default. “Poeng per karrierenivå” under
  “Egne poengtillegg” adjusts this step for all levels, including fractional
  values or zero. These are scenario assumptions, not SSB-derived premiums.
- **Career, experience, education and skill premiums are uncalibrated scenario
  assumptions.** Defaults are 5 points per experience year, 50 points for the
  selected education, and 3 points per selected skill. The selected SSB table
  does not establish independent premiums for
  these categories. Users can set scenario points per experience year, for the
  selected education, and per selected skill under “Egne poengtillegg”.
  No higher education receives no education premium. Degree/skill-specific
  defaults can be maintained in configuration but must not be presented as
  SSB-derived without supporting evidence.
- With zero premiums, the result is a group reference, not a personalized
  estimate. The median is not an entry-level salary: it already includes people
  with different experience and education. Additive premiums may double count
  those effects. Differences between sector medians are descriptive, not
  causal. Industry beyond sector is not modeled.
- The base year is the salary snapshot year (currently 2025), **not today's
  salary**. Future year offset `n` uses
  `(base-year salary + additional experience points x 1,000) x (1 + CPI/100)^n`.
  Experience increases by one each year up to 60 years; career level, education and skills
  stay fixed. New experience points are valued in base-year NOK, so the entire
  salary is inflation-adjusted. Real salary removes this CPI adjustment.
- Default scenario CPI is the last annual change (2025: 3.1%) from
  [SSB table 03014](https://www.ssb.no/statbank/table/03014), total consumption.
  Repeating it for future years is an editable assumption, not an official
  forecast or an automatic real-world salary entitlement. The scenario permits
  0-20% annual CPI and 1-30 future years.
- G uses [NAV's rate](https://www.nav.no/grunnbelopet), NOK 136,549 effective
  2026-05-01, verified 2026-11-08. Every G result uses this fixed rate, including
  the 2025 reference and projections. It is a conversion unit, not a projection
  of future G or a salary increase rule.

### Configuration and updates

| Location | Responsibility |
| --- | --- |
| `src/config/salary.ts` | Options, limits, role mappings, point value, defaults and NAV's G rate |
| `src/config/ssb-snapshot.json` | Checked-in SSB salary history, latest reference and CPI |
| `src/helpers/calculator.ts` | Validated point breakdown, historical growth and projections |
| `src/helpers/stringsAndNumbers.ts` | Norwegian number and currency formatting |
| `src/types/` | Salary model and typed control-change events |
| `src/pages/index.astro` | Calculator page and browser-side calculation/chart orchestration |
| `src/components/` | Native form-control wrappers, tabs, methodology and salary tables |
| `src/layout/NormalLayout.astro`, `src/styles/` | Shared layout, typography, color tokens and chart styling |
| `astro.config.mjs` | Static-site configuration and locally served fonts, including Material Symbols |
| `scripts/update-ssb.mjs` | Explicit, validated SSB snapshot refresh |

Run `npm run data:update` to fetch the latest annual salary and CPI snapshot.
The updater validates response columns, required cells, numeric values,
missing-value markers and ten consecutive salary years before writing.
It writes to a temporary file and renames it over the snapshot only after
validation; request or validation errors leave the existing snapshot unchanged.
SSB's `:` and `.` missing-value markers are stored as `null`; required private
and broad public references must be published for every year. Review the
diff, verify the NAV rate manually, update dated documentation if years/rates
change, and run `npm run check`, `npm test`, and `npm run build` before publishing.
Some history tests intentionally pin the verified 2016-2025 values and year
bounds; review those expectations when accepting a newer snapshot.
The app uses this snapshot offline and does not silently fetch or substitute
unavailable salary values.

## Testing

```sh
npm run check
npm run test:unit
npm run test:e2e:install
npm run test:e2e
npm run build
```

`check` runs Astro/TypeScript diagnostics. Vitest tests cover calculations,
premium validation, public-sector references, historical growth and projections.
Playwright tests cover browser interactions, chart filtering/zoom/pan,
invalid-input recovery and layout. Browser coverage is currently Chromium only;
touch-pinch behavior is not covered by the existing suite.

Playwright starts and stops its own test server on `127.0.0.1:4321`, with
`reuseExistingServer: false`. If that port is occupied, it refuses to start:
use a free port in a separate test configuration or stop only your own server.
It does not reuse or stop unrelated servers.

`npm test` runs both test suites. `npm run test:e2e:ui` opens Playwright's
interactive UI. `npm run format:check` checks the configured source-file
formats; `npm run format` rewrites them. These formatting scripts do not include
Markdown.

## License

MIT; see [LICENSE](LICENSE).

