export const landingPerformanceTable = {
  id: "b742-jt9d-landing-distance",
  version: "1.0.0",
  revision: "v1.0.0-initial",
  source: "Boeing 747-200 Performance Manual Section 7 - Landing",
  sourceDate: "1984-06-01",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  units: {
    weight: "kg",
    altitude: "ft",
    landingDistance: "meters"
  },
  interpolation: "bilinear",
  extrapolationAllowed: false,

  axes: {
    rows: {
      name: "weight",
      unit: "kg",
      values: [180000, 220000, 260000]
    },
    columns: {
      name: "altitude",
      unit: "ft",
      values: [0, 2000, 4000]
    }
  },

  result: {
    name: "landingDistance",
    unit: "meters"
  },

  values: [
    [1600, 1680, 1760],
    [1750, 1840, 1930],
    [1920, 2010, 2110]
  ]
} as const;
