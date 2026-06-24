# System Data Flow and Lifecycle

This document describes how flight data, user parameters, and calculation results flow through the **Classic Flight Engineer** system.

## Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Pilot as Flight Simulation Pilot
    participant UI as apps/web (Next.js UI)
    participant SimBrief as packages/simbrief-adapter
    participant Val as packages/validation
    participant Units as packages/unit-system
    participant Engine as packages/performance-engine
    participant DB as PostgreSQL (Drizzle)

    Pilot->>UI: Input SimBrief Username / Fetch Plan
    UI->>SimBrief: Fetch Raw Data from SimBrief API
    SimBrief->>Val: Validate raw response structure (Zod)
    Val-->>SimBrief: Raw data valid
    SimBrief->>SimBrief: Map to Domain FlightPlan format
    SimBrief-->>UI: Return normalized FlightPlan

    Pilot->>UI: Adjust Flight Params (Temp, Wind, Overrides)
    UI->>Val: Validate inputs (e.g. Weight > 0, Temp in realistic range)
    Val-->>UI: Inputs validated

    UI->>Units: Normalize user units to standard engine units (e.g. Imperial/Metric conversion)
    Units-->>UI: Normalized standard values

    UI->>Engine: Run calculations (e.g., V-speeds, Climb Plan, Fuel schedule)
    Note over Engine: Pure execution using static constants from aircraft-data
    Engine-->>UI: Pure calculation results

    UI->>Units: Convert outputs to pilot's preferred unit configuration
    Units-->>UI: UI-ready formatted metrics

    UI->>DB: Save plan & calculated checkpoints
    UI->>Pilot: Render Flight Engineer Dashboard (V-speed cards, step climb targets)
```

## Data Lifecycle States

To maintain code cleanliness, objects passing through calculations transition through clear states:

1. **Raw External State**: Unstructured JSON received from SimBrief. Must be validated immediately by `simbrief-adapter` before being touched.
2. **Normalized Domain State**: Represented by strict TypeScript interfaces in `aviation-domain`. All values are typed and mapped (e.g., standardizing flight plan coordinates to a unified GPS interface).
3. **Internal Standard Unit State**: Internal calculations (e.g., in `performance-engine`) execute in standard units to avoid conversion noise.
   - Temperature: Kelvin/Celsius depending on ISA formula requirement.
   - Weight: Pounds (lbs) for B747 calculations, or standard SI units.
   - Distance: Nautical Miles (NM).
   - Altitude: Feet (ft) / Flight Level (FL).
4. **User-Preferred Presentation State**: Converted at the UI boundary. If a pilot prefers KG and hPa, the display handles this layer of conversion, keeping calculations safe.
