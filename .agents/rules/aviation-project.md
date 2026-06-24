# Aviation Project Guidelines & Safety Rules

This project calculates critical parameters for flight simulation. To ensure math and unit integrity, all agents must strictly adhere to the following rules:

1. **No Performance Data Fabrication**:
   - Never invent performance tables, coefficients, or limits.
   - If official tables are unavailable, use stubs clearly marked as `DEMONSTRATION DATA - NOT FOR OPERATIONAL USE`.

2. **Strict Unit Isolation**:
   - Do not perform mathematical operations combining raw `number` primitives representing different units.
   - Force unit conversions using explicit type casting from `@classic-flight-engineer/unit-system`.
   - Always render unit suffixes next to values in the UI (e.g. `lbs`, `kg`, `ft`, `hPa`, `kts`).

3. **No Test Deletions**:
   - Never delete test suites to force a pipeline build to pass.
   - Fix code errors or adjust expected values only when mathematical formulas are audited.

4. **Document Calculation Formulas**:
   - Document any physics or aviation equations inside the code comments and corresponding architecture documentation (`docs/calculations/`).

5. **Decoupled Architecture**:
   - Keep the math engine (`packages/performance-engine`) completely pure and isolated. Do not import UI state, storage models, database clients, or network hooks inside it.

6. **Validate Outputs and Inputs**:
   - Enforce Zod schemas inside `packages/validation` to protect bounds and sanitize external inputs.
   - Block out-of-bounds inputs and return structured error objects instead of clamping silently or throwing generic exceptions.
