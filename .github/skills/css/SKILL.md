---
name: css
description: 'Use when writing or reviewing CSS, responsive layouts, visual states, animations, or styling Astro components in this project.'
---

# CSS

## Project Conventions

- Prefer native CSS and the existing Astro styling patterns; add a styling dependency only when a specific need justifies it.
- Keep styles close to their component when they are component-specific. Put genuinely shared tokens and rules in shared styles rather than duplicating them.
- Use CSS custom properties for reusable colors, spacing, and sizing when they help maintain consistency.
- Build layouts that work with content-driven sizing and explicit responsive constraints. Check narrow screens as well as desktop widths.
- Preserve visible keyboard focus, sufficient contrast, readable line lengths, and comfortable touch targets.
- Respect `prefers-reduced-motion`; use motion only when it clarifies a state change or interaction.
- Avoid styling that communicates meaning through color alone, brittle selector chains, and global rules that unexpectedly affect unrelated components.
- Format CSS with the repository's Prettier configuration.
- Don't use `!important` except as a last resort to override third-party styles or unavoidable specificity conflicts.
- Don't use any old conventions like BEM or inline styles; prefer the modern CSS patterns established in this project.

## Workflow

1. Inspect the component and nearby styles to identify the narrowest appropriate styling scope.
2. Implement the layout and states, including focus, hover, disabled, and validation states where relevant.
3. Check responsive behavior and text wrapping at narrow and wide viewport sizes.
4. Run `npm run format:check`; also run `npm run check` and `npm run build` if Astro markup or application behavior changed.
