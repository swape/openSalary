# openSalary

Calculator for open salary in norway using stats from SSB.

Using only data for IT professionals in Norway.

Using data from Statistics Norway (SSB).

## Calculator

Run `npm run dev` to open the Astro app. The calculator supports Frontend,
Backend, DevOps and Fullstack, career levels, private/state/municipal sectors, experience,
education, skills, a point breakdown, and future salary charts and tables.
Results are gross NOK/year, NOK/month and G. Profile data stays in the browser;
it is not stored or sent to SSB.

The responsive graph uses bundled Chart.js and `chartjs-plugin-zoom`, without
CDN requests. Checkbox filters show/hide the four series; “Vis år” filters
history/future. Zoom with the buttons, Ctrl + mouse wheel, or touch pinch;
Ctrl + drag pans horizontally. “Tilbakestill zoom” restores the selected period.
Changing the salary profile resets zoom but preserves filters. Filters affect
only the graph, not calculations or the accessible data tables.

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

Options, limits, role mappings, point value, default premiums, and NAV's G rate
are in `src/config/salary.ts`. Calculation and formatting are separate helpers;
shared domain types are in `src/types/salary.ts`.

Run `npm run data:update` to fetch the latest annual salary and CPI snapshot.
The updater validates dimensions, required cells, numeric values and missing
data and ten consecutive salary years before writing; errors leave the existing snapshot unchanged.
SSB's `:` and `.` missing-value markers are stored as `null`; required private
and broad public references must be published for every year. Review the
diff, verify the NAV rate manually, update dated documentation if years/rates
change, and run `npm run check`, `npm test`, and `npm run build` before publishing.
The app uses this snapshot offline and does not silently fetch or substitute
unavailable salary values.

## Testing

- Run `npm run test:unit` for Vitest unit tests in `src/**/*.test.ts`.
- Run `npm run test:e2e:install` once to install Chromium, then `npm run test:e2e` for Playwright browser tests.
- Playwright owns and stops its test server on port 4321; stop an existing dev
  server on that port before running end-to-end tests. It does not reuse or stop
  unrelated servers.
- Run `npm test` to run both test suites, or `npm run test:e2e:ui` to use Playwright's interactive UI.

## plan 

- using point system for calculating open salary based on various categories such as experience, education, and industry
- each category will be assigned a certain number of points based on its contribution to the overall salary
- each point is same as ( point * 1000 kr ) added to total salary
- data from Statistics Norway (SSB) is used to determine the points for each category based on real salary statistics and comparisons
- rules:
  - Salary should increase each year with (konsumprisindeks)
  - Salary should be increase based on all the relevant categories and their respective points
- all calculations should be transparent and based on publicly available data from SSB
- all points and calculations should be clearly documented and easy to verify
- all assumptions and methodologies should be clearly stated and justified
- the calculator should be easy to use and understand for the general public
- The calculator should also estimate future salary growth based on the defined rules and categories
- Graphical representation of salary growth should be provided for better understanding
- The calculator should allow users to input their own data and see the corresponding salary estimation
- It should have dropdown with Frontend, Backend, DevOps, and Fullstack options for IT professionals.
- It should have private or public sector options for IT professionals.
- It should allow users to input their relevant years of experience.
- It should allow users to input their education level. (e.g., Bachelor's, Master's, PhD)
- It should have checkboxes for additional skills or certifications relevant to IT professionals.
- It should put all the options and calculator constants in a configuration file for easy maintenance and updates
- Calculate in NOK (Norwegian Krone) and in G (grunnbeløp)
  

