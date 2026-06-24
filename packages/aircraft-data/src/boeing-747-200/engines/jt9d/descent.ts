export const descentPerformanceTable = {
  id: "b742-jt9d-descent-time",
  version: "1.0.0",
  revision: "v1.0.0-initial",
  source: "Boeing 747-200 Performance Manual Section 6 - Descent",
  sourceDate: "1984-06-01",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  units: {
    weight: "kg",
    altitude: "ft",
    descentTime: "minutes"
  },
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
      values: [20000, 30000, 40000]
    }
  },

  result: {
    name: "descentTime",
    unit: "minutes"
  },

  values: [
    [10.2, 15.5, 21.0],
    [10.4, 15.8, 21.4],
    [10.6, 16.1, 21.8]
  ]
} as const;
