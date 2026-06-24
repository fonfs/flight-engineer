export type Pounds = number & { readonly __brand: unique symbol };
export type Kilograms = number & { readonly __brand: unique symbol };
export type Feet = number & { readonly __brand: unique symbol };
export type Celsius = number & { readonly __brand: unique symbol };
export type Hectopascals = number & { readonly __brand: unique symbol };
export type Knots = number & { readonly __brand: unique symbol };
export type Degrees = number & { readonly __brand: unique symbol };

// Safe constructors
export const asPounds = (value: number): Pounds => value as Pounds;
export const asKilograms = (value: number): Kilograms => value as Kilograms;
export const asFeet = (value: number): Feet => value as Feet;
export const asCelsius = (value: number): Celsius => value as Celsius;
export const asHectopascals = (value: number): Hectopascals => value as Hectopascals;
export const asKnots = (value: number): Knots => value as Knots;
export const asDegrees = (value: number): Degrees => value as Degrees;

// Converters
export function kgToLbs(kg: Kilograms): Pounds {
  return asPounds(kg * 2.20462);
}

export function lbsToKg(lbs: Pounds): Kilograms {
  return asKilograms(lbs / 2.20462);
}

export function celsiusToKelvin(c: Celsius): number {
  return c + 273.15;
}
