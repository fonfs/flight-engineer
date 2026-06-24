# Performance Table Vector Format

For one-dimensional lookups (e.g. V-speeds or target speed schedules based solely on weight), a vector format is used.

## Vector Format Specification

A vector table matches a single independent axis to a one-dimensional array of results.

### Schema Definition

The vector schema verifies:
* `id`: Unique identifier for the vector performance table.
* `aircraft`: Aircraft model.
* `variant`: Specific variant (e.g. 747-200B).
* `engine`: Engine variant.
* `revision`: Revision tag of the performance chart.
* `source`: Data source reference.
* `interpolation`: Interpolation technique ('linear').
* `extrapolationAllowed`: Boolean flag to permit/prevent extrapolation.
* `axis`: Defines the single independent variable.
* `result`: Outputs mapping.
* `values`: 1D array corresponding exactly to `axis.values.length`.

### Example Vector Structure

```typescript
export const speedSchedulesTable = {
  id: "b742-jt9d-speed-schedules",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  revision: "1.0.0",
  source: "Boeing 747-200 Performance Manual Section 2 - Speeds",
  interpolation: "linear",
  extrapolationAllowed: false,

  axis: {
    name: "weight",
    unit: "kg",
    values: [200000, 250000, 300000, 350000]
  },

  result: {
    name: "vRefFlaps30",
    unit: "knots"
  },

  values: [125, 137, 149, 160]
} as const;
```
