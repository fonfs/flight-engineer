# Interpolation Mathematics

This document details the mathematical algorithms and code structures used in `@classic-flight-engineer/performance-engine` for data retrieval.

## 1D Linear Interpolation

Given two points $(x_0, z_0)$ and $(x_1, z_1)$, the value $z$ at an intermediate point $x$ is computed using the standard linear formula:

$$z = z_0 + \frac{x - x_0}{x_1 - x_0} (z_1 - z_0)$$

In code:
```typescript
export function interpolate1D(x0: number, x1: number, z0: number, z1: number, x: number): number {
  if (x0 === x1) return z0;
  return z0 + ((x - x0) / (x1 - x0)) * (z1 - z0);
}
```

## 2D Bilinear Interpolation

For two-dimensional grids (e.g. mapping fuel burn across combinations of Weight and Cruise Altitude), the engine performs bilinear interpolation.

1. **Locate Grid Coordinates**: Determine $(x_0, x_1)$ enclosing weight $x$, and $(y_0, y_1)$ enclosing altitude $y$.
2. **Perform X-axis Interpolation**:
   - $r_1 = \text{interpolate1D}(x_0, x_1, z_{00}, z_{01}, x)$ (along the lower $y$ boundary)
   - $r_2 = \text{interpolate1D}(x_0, x_1, z_{10}, z_{11}, x)$ (along the upper $y$ boundary)
3. **Perform Y-axis Interpolation**:
   - $z = \text{interpolate1D}(y_0, y_1, r_1, r_2, y)$

## Boundary Error Context

When an input parameter is outside the declared grid boundaries, extrapolation is blocked by default and returning a structured error type rather than `NaN` or `Infinity`:

```typescript
export interface OutOfBoundsError {
  status: 'error';
  reason: 'out_of_bounds';
  variableName: string;
  value: number;
  minAllowed: number;
  maxAllowed: number;
  unit: string;
  tableName: string;
  packageRevision: string;
}
```
This forces calling layers to handle the envelope violation gracefully.
