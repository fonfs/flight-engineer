export const takeoffPerformanceTable = {
  id: "b742-jt9d-takeoff-epr",
  version: "1.0.0",
  revision: "v1.0.0-initial",
  source: "Boeing 747-200 Performance Manual Section 3 - Takeoff",
  sourceDate: "1984-06-01",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  units: {
    temperature: "C",
    altitude: "ft",
    takeoffEpr: "ratio"
  },
  interpolation: "bilinear",
  extrapolationAllowed: false,

  axes: {
    rows: {
      name: "temperature",
      unit: "C",
      values: [15, 25, 35]
    },
    columns: {
      name: "altitude",
      unit: "ft",
      values: [0, 2000, 4000]
    }
  },

  result: {
    name: "takeoffEpr",
    unit: "ratio"
  },

  values: [
    [2.04, 2.01, 1.98],
    [2.02, 1.99, 1.96],
    [1.99, 1.96, 1.93]
  ]
} as const;
