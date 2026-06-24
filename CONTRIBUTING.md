# Contributing to Classic Flight Engineer

Thank you for contributing! Please adhere to the following workflow guidelines.

## Development Workflow
1. **Branching**: Branch off `main` using descriptive names (e.g. `feat/performance-calculators`).
2. **Purity Rules**: The package `packages/performance-engine` must remain completely pure and deterministic. Do not import database, window APIs, or network modules inside it.
3. **Type Safety**:
   - Strict TypeScript is active. Do not use `any` types.
   - Use branded types from `packages/unit-system` when representing values like weight, altitude, speed, or pressure.
4. **Validations**: All data coming from outside the monorepo boundary (API parameters, SimBrief payloads, form submissions) must be parsed and validated using Zod schemas inside `packages/validation` or `packages/simbrief-adapter`.

## Running Checks Locally
Ensure all validation checks pass before submitting a PR:
- Install packages: `pnpm install`
- Type verification: `pnpm run typecheck`
- Code linting: `pnpm run lint`
- Running Vitest tests: `pnpm run test`
- Verification build: `pnpm run build`
