# ADR 0001: Monorepo Structure using pnpm Workspaces

## Status
Approved

## Context
The project needs to scale cleanly to support multiple packages (calculators, data stores, API connectors, UI components) and separate the math engine from the UI.
We also want high build efficiency, fast dependency installation, and clean developer workflows.

## Decision
We will structure the project as a monorepo using **pnpm workspaces**. 

- The root will manage configurations (ESLint, Prettier, TypeScript base config, workspace settings).
- Next.js application will live in `apps/web`.
- Domain libraries and components will reside under `packages/*`.

## Consequences
- Fast workspace linking and caching.
- Strict control over circular package dependencies.
- Sub-packages can easily declare their own test environments (e.g. `packages/performance-engine` uses Vitest for ultra-fast unit testing, while `apps/web` uses Playwright for E2E).
