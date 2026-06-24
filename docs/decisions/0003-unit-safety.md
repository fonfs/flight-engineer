# ADR 0003: Type-Safe Unit Management

## Status
Approved

## Context
Aviation calculations are notorious for unit mismatches (e.g. Gimli Glider incident, Mars Climate Orbiter). In B747-200, fuel indicators can show kilograms (KGS) or pounds (LBS). Altitude is entered in feet (FT), and temperature is measured in Celsius or Kelvin depending on ISA formulas.
Standardizing primitive types (like simple `number`) for values is error-prone because a compiler cannot tell if a variable represents `lbs` or `kgs`.

## Decision
We will enforce unit safety using TypeScript branded types or custom wrapper objects in `packages/unit-system`.

Example branding in TypeScript:
```typescript
export type Pounds = number & { readonly __brand: unique symbol };
export type Kilograms = number & { readonly __brand: unique symbol };

export function toPounds(kg: Kilograms): Pounds {
    return (kg * 2.20462) as Pounds;
}
```

Any performance function that requires weight must strictly accept `Pounds` or `Kilograms` rather than a generic `number`.

## Consequences
- Compile-time prevention of unit-mixing bugs.
- Clear code interfaces that act as documentation.
- Negligible performance overhead.
