---
name: ui-design
description: 'Use when designing or implementing UI/UX, visual systems, responsive screens, forms, data displays, or accessibility for the openSalary salary calculator.'
---

# UI Design

## Product Context

openSalary is a public-facing Norwegian salary calculator for IT professionals. Its estimates should be understandable, transparent, and grounded in clearly identified SSB data and documented assumptions. Design the working calculator as the primary experience, not a marketing landing page.

## Design Workflow

1. Identify the user's task, the inputs they need, and the result or decision the interface should support.
2. Inspect existing pages and styles first; extend their visual language instead of introducing a disconnected design system.
3. Organize controls around the calculator's domain: role, public or private sector, relevant experience, education, and applicable additional skills or certifications.
4. Use appropriate controls with persistent labels, clear units, useful defaults, and inline validation. Do not rely on placeholder text alone.
5. Present salary estimates with explicit currency and period, such as NOK per year or per month. Distinguish inputs, assumptions, estimates, and sourced statistics.
6. Make calculation methodology and SSB source context available where users can understand and verify them, without interrupting the main task.
7. If showing growth over time, label axes and time period, provide an accessible textual summary, and do not imply precision beyond the underlying data.
8. Include empty, invalid, and error states, and preserve entered values when correcting validation errors.
9. Check keyboard operation, screen-reader labels, contrast, focus visibility, responsive behavior, and reduced-motion preferences.
10. Keep the interface focused and scannable. Avoid decorative UI that competes with the inputs, result, or explanation.
11. Keep the colors consistent with the established visual language, ensuring sufficient contrast and accessibility for all users.
12. Use spacing, alignment, and grouping to create a clear visual hierarchy and guide the user's attention to the most important elements.
13. Ensure interactive elements have sufficient hit areas and provide clear feedback on hover, focus, and active states.

## Validation

- Verify the key calculation workflow from inputs through the displayed estimate.
- Check the interface at both mobile and desktop widths and ensure long Norwegian labels and values do not overlap or clip.
- Run `npm run check`, `npm run format:check`, and `npm run build` after implementation.
