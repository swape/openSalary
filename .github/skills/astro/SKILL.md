---
name: astro
description: 'Use when creating or changing Astro pages, layouts, components, routing, rendering, or client-side interactivity in this Astro 7 project.'
---

# Astro

## Project Conventions

- Use Astro components and the existing Astro configuration. Do not add a UI framework unless the requested interaction clearly needs one.
- Keep page content and presentation in `.astro` files where practical; extract components when reuse or a clear responsibility makes that useful.
- Put server-side data loading and component setup in the frontmatter fence. Keep browser-only behavior in client-side scripts or an explicitly hydrated island.
- Prefer static rendering for content that does not need a browser runtime. Add the smallest necessary hydration boundary for interactive calculator controls.
- Use semantic HTML, descriptive page metadata, and accessible labels and feedback in every route.
- Use `&nbsp;` for intentional non-breaking spaces in Astro markup; avoid JSX expression-based whitespace.
- Keep data acquisition, salary calculations, and display formatting separate enough to test and explain independently.
- Follow the repository's strict TypeScript settings and Prettier configuration, including `prettier-plugin-astro`.

## Workflow

1. Check nearby routes, components, and styles before adding a new abstraction or framework.
2. Implement the page or component using the simplest rendering mode that satisfies the interaction.
3. Run `npm run check` and `npm run build` after changing Astro files, routes, or configuration.
