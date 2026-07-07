# Classic Flight Engineer

A professional-grade system designed to assist virtual pilots in operating classic aircraft in flight simulators. The target architecture supports multiple aircraft types, variants, and engine configurations, beginning with the **Boeing 747-200**.

## Project Architecture

```
src/
  app/                  # Next.js App Router & API routes
  components/           # Shared React UI components & Contexts

packages/
  aviation-domain/      # Normalized, strictly typed domain schemas and entities
  performance-engine/   # Pure, deterministic performance calculations
  aircraft-data/        # Static aviation tables, polynomials, and parameters
  simbrief-adapter/     # Parser adapting SimBrief responses to our domain model
  unit-system/          # Type-safe unit conversions (branded types)
  validation/           # Zod schema definitions for inputs/APIs/env variables
  ui/                   # Shared React/Tailwind visual component library
```

## Getting Started

### Prerequisites
- Node.js LTS (>= 18.0.0)
- npm (>= 10.0.0) or pnpm (>= 9.0.0)

### Installation
1. Clone the repository.
2. Initialize environment parameters:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Execution Scripts
- **Start Dev Server**: `npm run dev`
- **Build Project**: `npm run build`
- **Typecheck**: `npm run typecheck`
- **Run Unit Tests**: `npm run test`
