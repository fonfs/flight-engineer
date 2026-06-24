export type Pounds = number & {
    readonly __brand: unique symbol;
};
export type Kilograms = number & {
    readonly __brand: unique symbol;
};
export type Feet = number & {
    readonly __brand: unique symbol;
};
export type Celsius = number & {
    readonly __brand: unique symbol;
};
export type Hectopascals = number & {
    readonly __brand: unique symbol;
};
export type Knots = number & {
    readonly __brand: unique symbol;
};
export type Degrees = number & {
    readonly __brand: unique symbol;
};
export declare const asPounds: (value: number) => Pounds;
export declare const asKilograms: (value: number) => Kilograms;
export declare const asFeet: (value: number) => Feet;
export declare const asCelsius: (value: number) => Celsius;
export declare const asHectopascals: (value: number) => Hectopascals;
export declare const asKnots: (value: number) => Knots;
export declare const asDegrees: (value: number) => Degrees;
export declare function kgToLbs(kg: Kilograms): Pounds;
export declare function lbsToKg(lbs: Pounds): Kilograms;
export declare function celsiusToKelvin(c: Celsius): number;
//# sourceMappingURL=index.d.ts.map