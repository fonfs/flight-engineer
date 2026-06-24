"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asDegrees = exports.asKnots = exports.asHectopascals = exports.asCelsius = exports.asFeet = exports.asKilograms = exports.asPounds = void 0;
exports.kgToLbs = kgToLbs;
exports.lbsToKg = lbsToKg;
exports.celsiusToKelvin = celsiusToKelvin;
// Safe constructors
const asPounds = (value) => value;
exports.asPounds = asPounds;
const asKilograms = (value) => value;
exports.asKilograms = asKilograms;
const asFeet = (value) => value;
exports.asFeet = asFeet;
const asCelsius = (value) => value;
exports.asCelsius = asCelsius;
const asHectopascals = (value) => value;
exports.asHectopascals = asHectopascals;
const asKnots = (value) => value;
exports.asKnots = asKnots;
const asDegrees = (value) => value;
exports.asDegrees = asDegrees;
// Converters
function kgToLbs(kg) {
    return (0, exports.asPounds)(kg * 2.20462);
}
function lbsToKg(lbs) {
    return (0, exports.asKilograms)(lbs / 2.20462);
}
function celsiusToKelvin(c) {
    return c + 273.15;
}
//# sourceMappingURL=index.js.map