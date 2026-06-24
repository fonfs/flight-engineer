# Agent Instructions & Guidelines

For AI assistants modifying the Classic Flight Engineer codebase:

## 1. Domain Guidelines
- **Branded Types**: Always enforce types from `packages/unit-system`. Never use raw `number` for weight, pressure, speed, or distance parameters.
- **Math Logic**: Keep `packages/performance-engine` completely free of external dependencies or APIs.
- **Performance Data**: If adding new aircraft datasets, update `packages/aircraft-data`.

## 2. Code Quality
- Enforce strict typing.
- Run `pnpm run lint` and `pnpm run typecheck` after every logical block modification to verify boundary safety.
- Write unit tests in Vitest inside the corresponding `*.test.ts` files adjacent to calculation modules.
