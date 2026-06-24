export const speedSchedulesTable = {
  id: "b742-jt9d-speed-schedules",
  version: "1.0.0",
  revision: "v1.0.0-initial",
  source: "Boeing 747-200 Performance Manual Section 2 - Speeds",
  sourceDate: "1984-06-01",
  aircraft: "Boeing 747-200",
  variant: "747-200B",
  engine: "JT9D",
  units: {
    weight: "kg",
    vRefFlaps30: "knots"
  },
  interpolation: "linear",
  extrapolationAllowed: false,

  axis: {
    name: "weight",
    unit: "kg",
    values: [200000, 250000, 300000, 350000]
  },

  result: {
    name: "vRefFlaps30",
    unit: "knots"
  },

  values: [125, 137, 149, 160]
} as const;
