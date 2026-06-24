"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightStatusHeader = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const FlightStatusHeader = ({ context }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: "p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-bold", children: [context.callsign, " // FLIGHT ", context.flightNumber] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-400", children: [context.origin, " \u2192 ", context.destination, " (", context.aircraftVariant, ")"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-500", children: "TOW" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-lg text-emerald-400", children: [context.takeoffWeight, " lbs"] })] })] }) }));
};
exports.FlightStatusHeader = FlightStatusHeader;
//# sourceMappingURL=index.js.map