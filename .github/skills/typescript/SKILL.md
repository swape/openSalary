---
name: typescript
description: 'Use when writing or reviewing TypeScript, defining types, handling external data, or changing TypeScript configuration in this Astro project.'
---

# TypeScript

## Project Conventions

- Keep the strict settings inherited from `astro/tsconfigs/strict` in `tsconfig.json`.
- Prefer inferred types for straightforward local values and explicit types for public APIs, shared data, and non-obvious function contracts.
- Avoid `any`. Use `unknown` at untrusted boundaries, then narrow or validate before use.
- Model salary values, years of experience, education, and job categories explicitly. Make units and time periods clear in names and interfaces.
- Treat SSB responses and other external data as untrusted input. Validate shape, missing values, and numeric ranges before calculations.
- Keep calculation logic deterministic and separate from UI formatting. Do not mix NOK/month with NOK/year or nominal values with inflation-adjusted values implicitly.
- Prefer small types and functions that follow existing project patterns; do not add a schema or utility dependency without a concrete need.
- Do not use one-liners.
- Avoid deeply nested ternary expressions; prefer clear conditional logic with explicit branches.
- Use early returns to simplify complex function logic and reduce nesting.
- Prefer descriptive variable and function names that convey intent and domain meaning.
- Avoid abbreviations and single-letter names except for well-known conventions or loop indices.
- Prefer consistent naming conventions for types, interfaces, and enums to improve readability and maintainability.
- Avoid mixing different naming styles within the same module or project.
- Use a src/types/ directory for shared type definitions.
- Use web-components for reusable UI and interactive elements and astro components for non interactive or layout purposes. Use global css and shared typescript helpers for cross-cutting concerns.

## Workflow

1. Inspect the types and call sites near the change before introducing or changing a shared type.
2. Keep types aligned with the actual domain rules and documented calculation assumptions.
3. Run `npm run check` after TypeScript or Astro type changes.
4. Run `npm run build` when changing application code or configuration.
