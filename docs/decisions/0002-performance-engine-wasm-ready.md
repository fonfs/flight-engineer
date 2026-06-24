# ADR 0002: Math Engine Isolation for WASM/Rust Migration

## Status
Approved

## Context
Although version 1 is to be built completely in TypeScript/Node.js, we want to allow migrating the core performance calculations to Rust compiled to WebAssembly (WASM) in the future to:
1. Increase computation speed for complex profiles.
2. Share libraries with desktop simulator plugins (e.g. C++ or Rust-based flight simulator connectors).
3. Secure performance formulas inside WASM binaries.

## Decision
The `performance-engine` package must be strictly isolated.
- It will consist **only** of pure, deterministic functions (given the same input, they always yield the same output).
- It must have zero access to Node.js/browser APIs (no `window`, `document`, `process`, `fs`, `fetch`, etc.).
- External performance data (charts and coefficients) must be passed as functional parameters or loaded from static data registry modules.
- No global state or mutable context.

## Consequences
- The entire package can be rewritten in Rust and compiled to WASM later.
- The web app will import the WASM package and call the exact same signatures.
- Simplifies unit testing enormously since Vitest can run calculations synchronously with zero mocks.
