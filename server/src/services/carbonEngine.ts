/**
 * The Calculation Engine ("The Carbon Mathematician").
 * Pure functions — no I/O — so every formula is unit-testable and
 * cannot be altered per-request (admins cannot bypass or tweak these).
 */

/** Fixed scientific constant: C → CO₂ molecular weight ratio (44/12). */
export const CO2_CONVERSION_FACTOR = 3.67

/** Diesel truck emission factor: tonnes CO₂e per km (≈0.9 kg/km heavy freight). */
export const DIESEL_EMISSION_FACTOR_T_PER_KM = 0.0009

/** Average passenger car emissions per year (tCO₂e) — for relatable comparisons. */
export const CAR_EMISSIONS_T_PER_YEAR = 4.6

/**
 * Gross Multiplier Function: biochar weight × lab carbon % × 3.67
 * = total raw CO₂ captured (tonnes).
 */
export function grossCO2e(weightTonnes: number, cOrgPercent: number): number {
  if (weightTonnes < 0 || cOrgPercent < 0 || cOrgPercent > 100) return 0
  return round3(weightTonnes * (cOrgPercent / 100) * CO2_CONVERSION_FACTOR)
}

/**
 * Deduction Function: operational penalties — delivery truck mileage ×
 * diesel emission factor, summed across shipments.
 */
export function transportDeductions(shipments: { mileageKm: number }[]): number {
  return round3(
    shipments.reduce((sum, s) => sum + Math.max(0, s.mileageKm) * DIESEL_EMISSION_FACTOR_T_PER_KM, 0)
  )
}

/** Net creditable CO₂e for a batch (never negative). */
export function netCO2e(gross: number, deductions: number): number {
  return round3(Math.max(0, gross - deductions))
}

/**
 * Mass Balance Tracker: Total Produced − Total Shipped − Total Applied
 * = Remaining Inventory. Proves "leakage" isn't happening.
 */
export function massBalance(
  producedTonnes: number,
  shippedTonnes: number,
  appliedTonnes: number
): { produced: number; shipped: number; applied: number; remaining: number } {
  return {
    produced: round3(producedTonnes),
    shipped: round3(shippedTonnes),
    applied: round3(appliedTonnes),
    remaining: round3(producedTonnes - shippedTonnes - appliedTonnes),
  }
}

/**
 * Agronomic Yield Calculator: project harvest weights vs control (baseline)
 * plots → regional yield increase % (Gold Standard "Co-benefits" metric).
 * Weights are normalised to dry tonnes using moisture content so wet and
 * dry deliveries compare fairly.
 */
export function yieldIncreasePercent(
  projectPlots: { weightTonnes: number; moisturePercent: number }[],
  controlPlots: { weightTonnes: number; moisturePercent: number }[]
): number | null {
  const avg = (plots: { weightTonnes: number; moisturePercent: number }[]) => {
    if (plots.length === 0) return null
    const total = plots.reduce((s, p) => s + dryWeight(p.weightTonnes, p.moisturePercent), 0)
    return total / plots.length
  }
  const project = avg(projectPlots)
  const control = avg(controlPlots)
  if (project === null || control === null || control === 0) return null
  return round1(((project - control) / control) * 100)
}

/** Harvest weight normalised to dry matter. */
export function dryWeight(weightTonnes: number, moisturePercent: number): number {
  return weightTonnes * (1 - clamp(moisturePercent, 0, 100) / 100)
}

/** Relatable comparison: "equivalent to taking N cars off the road for a year". */
export function carsOffRoadEquivalent(tonnesCO2e: number): number {
  return Math.round(tonnesCO2e / CAR_EMISSIONS_T_PER_YEAR)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
function round3(v: number): number {
  return Math.round(v * 1000) / 1000
}
function round1(v: number): number {
  return Math.round(v * 10) / 10
}
