export const cruisePerformanceTable = {
  id: "b742-jt9d-cruise-fuelflow",
  version: "1.0.0",
  revision: "v1.0.0-initial",
  source: "Boeing 747-200 Performance Manual Section 5 - Cruise",
  sourceDate: "1984-06-01",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  units: {
    weight: "kg",
    altitude: "ft",
    fuelFlow: "kg/hour"
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
      values: [31000, 33000, 35000]
    }
  },

  result: {
    name: "fuelFlow",
    unit: "kg/hour"
  },

  values: [
    [10200, 9900, 9600],
    [11100, 10800, 10500],
    [12000, 11700, 11400]
  ]
} as const;
