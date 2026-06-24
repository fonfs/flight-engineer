# System Architecture Overview: Classic Flight Engineer

Classic Flight Engineer is a professional-grade flight helper application designed for flight simulation enthusiasts who operate complex classic aircraft, starting with the **Boeing 747-200**.

Classic aircraft operations demand continuous calculations from the flight crew (especially the Flight Engineer), including fuel burn schedules, atmospheric corrections, EPR/N1 targets, and V-speeds. This application automates and coordinates these calculations while presenting a clean, modern user interface.

## System Objectives
1. **Precision & Correctness**: Classic aircraft have specific performance models. The system must use official, verified performance tables and formulas (no guessing or approximations).
2. **Expandability**: The codebase must support multiple aircraft types, variants, and engine configurations (e.g., Pratt & Whitney JT9D, General Electric CF6, Rolls-Royce RB211) without requiring modifications to the main web app shell or core business contracts.
3. **Decoupled Math Engine**: The calculation engine must consist solely of pure functions, allowing it to be compiled/migrated to Rust/WASM in a future iteration without changing the client-side UI or API boundaries.
4. **Resiliency**: Input parameters (atmospheric pressure, weights, temperatures) must be heavily validated to prevent division-by-zero, out-of-range, or unrealistic parameters.

## Technology Stack
- **Monorepo Manager**: `pnpm` workspaces for package isolation.
- **Language**: TypeScript with strict mode.
- **Frontend Framework**: Next.js (App Router), React, Tailwind CSS, React Hook Form.
- **Database / ORM**: PostgreSQL with Drizzle ORM.
- **Schema Validation**: Zod.
- **Testing**: Vitest (Unit testing) and Playwright (E2E testing).
- **Environment Management**: Docker Compose for local PostgreSQL containerization.

## Extensibility Strategy
To allow supporting other aircraft (e.g., Boeing 727, Concorde, L-1011 TriStar) without re-architecting:
- **Abstract Aircraft Interfaces**: All calculations rely on generic domain definitions (e.g., `AircraftModel`, `EngineVariant`, `PerformanceTable`).
- **Data-Driven Performance**: Aircraft performance coefficients, V-speed curves, and fuel consumption charts are stored as static JSON objects or registry entities within `packages/aircraft-data`.
- **Strategy Pattern**: The `performance-engine` uses registry injectors or strategy classes/functions loaded dynamically based on the selected aircraft profile.
