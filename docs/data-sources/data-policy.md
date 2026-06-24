# Aircraft Performance Data Policy

To ensure operational simulation accuracy and compliance with core safety guidelines, the following rules govern how aircraft data packages are managed:

## Core Directives

1. **No Invented Values**:
   - Every coefficient, limit, target EPR, and weight schedule must come from official or verified aviation references (e.g. Flight Manuals - AOM/FCOM, manufacturer charts).
   - No assumptions, approximations, or extrapolated lines may be inserted without historical verification.

2. **Source Attribution & Audits**:
   - Every table must link back to a primary reference document (e.g. "B747-200 FCOM Page 3-12").
   - Revision histories must tag dates and maintain stable checksums (`MD5`/`SHA256`) of the raw tables to prevent silent dataset corruption.

3. **Explicit Units Declaration**:
   - Every data table must declare its original input/output unit systems (e.g., fuel flow in `pph` or `kg/h`, altitude in `ft` or `meters`).
   - The UI or performance engine boundary converts these to internal standardized formats using `@classic-flight-engineer/unit-system`.

4. **Extrapolation Blocker**:
   - Extrapolation is prohibited by default. If the flight parameters exceed the tabulated envelope, the system must trigger an out-of-bounds error state to alert the pilot.

5. **Demonstration Data Marking**:
   - If mock or preliminary tables are created for testing purposes, they must be explicitly flagged with:
     `DEMONSTRATION DATA - NOT FOR OPERATIONAL USE`
