# openSalary

Calculator for open salary in norway using stats from SSB.

Using only data for IT professionals in Norway.

Using data from Statistics Norway (SSB).

## Testing

- Run `npm run test:unit` for Vitest unit tests in `src/**/*.test.ts`. The suite is allowed to be empty while calculator logic is being developed.
- Run `npm run test:e2e:install` once to install Chromium, then `npm run test:e2e` for Playwright browser tests.
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
  

