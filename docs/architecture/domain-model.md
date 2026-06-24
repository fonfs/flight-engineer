# Core Domain Model Specification

This document details the definition, components, and schema constraints of the internal domain model representation: **`FlightContext`**.

## FlightContext Object Structure

The unified domain schema contains the following fields:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `flightNumber` | `string` | Scheduled flight code (e.g. "RG860") |
| `callsign` | `string` | ATC callsign (e.g. "VARIG 860") |
| `origin` | `string` | ICAO code of departure airport (e.g. "SBGL") |
| `destination` | `string` | ICAO code of arrival airport (e.g. "KJFK") |
| `alternate` | `string \| null` | Alternate landing airport (e.g. "KEWR") |
| `route` | `string` | Flight route airway string |
| `aircraftType` | `string` | ICAO aircraft type indicator (e.g. "B742") |
| `aircraftVariant` | `string` | Sub-variant identifier |
| `engineVariant` | `string` | Specific engine variant model (e.g. "JT9D-7A") |
| `registration` | `string` | Aircraft tail registration number (e.g. "PP-VNA") |
| `zeroFuelWeight` | `Pounds` | Aircraft weight without usable fuel |
| `takeoffWeight` | `Pounds` | Total aircraft weight at brake release |
| `landingWeight` | `Pounds` | Estimated landing weight |
| `payload` | `Pounds` | Total weight of passengers, cargo, and mail |
| `blockFuel` | `Pounds` | Total fuel onboard before taxi |
| `taxiFuel` | `Pounds` | Estimated fuel burned during taxi operations |
| `tripFuel` | `Pounds` | Fuel required to climb, cruise, and descend |
| `reserveFuel` | `Pounds` | Minimum contingency/reserve fuel reserves |
| `plannedCruiseAltitude`| `Feet` | Altitude selected for cruise portion (FL) |
| `stepClimbs` | `array` | List of target climb milestones (Altitude + Waypoint) |
| `departureElevation` | `Feet` | Elevation of departure airport above MSL |
| `destinationElevation` | `Feet` | Elevation of arrival airport above MSL |
| `departureTemperature` | `Celsius` | OAT at departure runway |
| `departurePressure` | `Hectopascals`| Altimeter setting (QNH) |
| `windData` | `array` | Waypoint cruise wind direction and speed parameters |
| `estimatedTimes` | `object` | Phase duration estimates (taxi, climb, cruise, total) |

## Strict Typing & Safety Rules

1. **Branded Units**: Fields like weights (`zeroFuelWeight`, `takeoffWeight`) are typed as `Pounds` and altitudes (`plannedCruiseAltitude`, `departureElevation`) as `Feet`. This ensures standard mathematical operations are not performed on raw untyped primitives.
2. **Nullable alternate**: In simulation flights, alternates might be omitted. It is explicitly represented as `string | null` instead of omitting the field.
3. **No any types**: Arrays like `stepClimbs` and `windData` have strict schemas:
   - `stepClimbs`: `Array<{ altitude: Feet, waypoint: string }>`
   - `windData`: `Array<{ waypoint: string, bearing: Degrees, velocity: Knots }>`
