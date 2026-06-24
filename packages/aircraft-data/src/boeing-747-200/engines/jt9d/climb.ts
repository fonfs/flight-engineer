export const climbPerformanceTable = {
  id: "b742-jt9d-climb-time",
  version: "1.0.0",
  revision: "v1.0.0-initial",
  source: "Boeing 747-200 Performance Manual Section 4 - Climb",
  sourceDate: "1984-06-01",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  units: {
    weight: "kg",
    altitude: "ft",
    climbTime: "minutes"
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
