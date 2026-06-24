# Aircraft Data Package Format Specification

All aircraft performance packages are declared as structured JSON documents or static registries inside `@classic-flight-engineer/aircraft-data`.

## Schema Specification

A typical dataset comprises:

```json
{
  "packageId": "UUID string",
  "manufacturer": "Boeing",
  "family": "747",
  "variante": "747-200B",
  "engineModel": "JT9D",
  "revisao": "1.0.0",
  "dataRevisao": "YYYY-MM-DD",
  "unidadesOriginais": {
    "weight": "lbs",
    "altitude": "ft",
    "temperature": "C"
  },
  "limites": {
    "maxTakeoffWeight": 830000
  },
  "metodoInterpolacao": "linear",
  "permitirExtrapolacao": false,
  "referenciaFonte": "Boeing 747-200 FCOM Section 3",
  "checksum": "checksum string",
  "tabelas": {
    "takeoff_epr": {
      "name": "Takeoff Thrust EPR Table",
      "xKey": "Temperature",
      "zKey": "EPR",
      "xGrid": [0, 10, 20, 30, 40],
      "zValues": [2.10, 2.05, 1.98, 1.90, 1.80]
    }
  }
}
```

### Table Representation
- **1D Grid Table**: Declares `xGrid` array and a flat list of `zValues` matching the grid length.
- **2D Grid Table**: Declares `xGrid` (columns) and `yGrid` (rows) arrays. `zValues` is represented as a nested array of shape `[yLength][xLength]`.
