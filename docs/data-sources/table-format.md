# Performance Table Matrix Format

Performance calculations on the Boeing 747-200 rely on multidimensional grids representing performance characteristics.

## Matricial Table Specification

Each table is structured as a TypeScript module exporting a readonly object. Below is the Zod schema and example representation of a performance matrix table.

### Schema Definition

The table schema verifies:
* `id`: Unique identifier for the performance chart.
* `aircraft`: Aircraft model.
* `variant`: Specific variant (e.g. 747-200B).
* `engine`: Engine model (e.g. JT9D).
* `revision`: Revision tag of the performance chart.
* `source`: Data source reference.
* `interpolation`: Interpolation technique used ('linear' or 'bilinear').
* `extrapolationAllowed`: Boolean flag to permit/prevent extrapolation.
* `axes`: Defines independent variables.
  * `rows`: Vertical axis details.
  * `columns`: Horizontal axis details.
* `result`: Outputs mapping.
* `values`: Matrix coordinates (`rows.values.length` x `columns.values.length`).

### Example Matrix Structure

```typescript
export const climbPerformanceTable = {
  id: "b742-jt9d-climb-time",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  revision: "1.0.0",
  source: "Boeing 747-200 Performance Manual Section 4 - Climb",
  interpolation: "bilinear",
  extrapolationAllowed: false,

  axes: {
    rows: {
      name: "weight",
      unit: "kg",
      values: [220000, 240000, 260000]
    },
    columns: {
      name: "altitude",
      unit: "ft",
      values: [10000, 20000, 30000]
    }
  },

  result: {
    name: "climbTime",
    unit: "minutes"
  },

  values: [
    [4.8, 10.9, 18.7],
    [5.1, 11.6, 19.8],
    [5.5, 12.4, 21.2]
  ]
} as const;
```
