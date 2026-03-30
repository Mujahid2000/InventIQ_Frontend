# Modular Frontend Architecture

This project should follow feature-first modular boundaries to improve reusability and reduce page-level complexity.

## Folder Strategy

Use this structure as the target:

- app/
  - Route composition only (layout, page wiring, guards)
- src/components/
  - Shared UI building blocks used by multiple features
  - modals/ for reusable modal components
- src/features/
  - One folder per domain: auth, products, categories, orders, restock, logs, dashboard
  - Each feature owns:
    - components/
    - hooks/
    - types/
    - utils/
- src/store/
  - api/ split by feature endpoint files
  - slices/ for local state domains
- src/lib/
  - Cross-cutting helpers (storage, error parsing, formatters)

## Reusability Rules

1. Keep app pages thin.
   - Pages should compose feature components and trigger hooks, not host large UI blocks.

2. Extract repeated UI into src/components.
   - Examples: confirmation modal, form modal shell, empty states, table pagination footer.

3. Keep feature types close to feature code.
   - Avoid large global type files unless types are truly cross-feature.

4. Use barrel exports at feature boundaries.
   - Example: features/orders/index.ts exports orders UI + hooks.

5. Keep endpoint files domain-scoped.
   - store/api/orders.api.ts, products.api.ts, categories.api.ts, etc.

## Current Implementation Status

Completed in this refactor:
- Store API calls split by category under src/store/api/.
- All page-level modals extracted into src/components/modals/.
- Shared modal wrapper added: src/components/modals/shared/ModalShell.tsx.

## Next Modularization Steps

1. Move domain-specific page logic into src/features/* hooks and utilities.
2. Extract shared table actions and pagination controls into src/components.
3. Add per-feature index.ts files for clean imports.
4. Add lightweight unit tests for extracted modal components.
