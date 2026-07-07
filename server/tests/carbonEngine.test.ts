import { describe, it, expect } from 'vitest'
import {
  CO2_CONVERSION_FACTOR,
  grossCO2e,
  transportDeductions,
  netCO2e,
  massBalance,
  yieldIncreasePercent,
  dryWeight,
  carsOffRoadEquivalent,
  DIESEL_EMISSION_FACTOR_T_PER_KM,
} from '../src/services/carbonEngine'

describe('Gross Multiplier Function', () => {
  it('applies weight × carbon% × 3.67', () => {
    // 40t × 78% × 3.67 = 114.504
    expect(grossCO2e(40, 78)).toBeCloseTo(40 * 0.78 * CO2_CONVERSION_FACTOR, 3)
  })

  it('uses the fixed 3.67 scientific constant', () => {
    expect(CO2_CONVERSION_FACTOR).toBe(3.67)
    expect(grossCO2e(1, 100)).toBeCloseTo(3.67, 3)
  })

  it('returns 0 for invalid inputs', () => {
    expect(grossCO2e(-5, 50)).toBe(0)
    expect(grossCO2e(10, 101)).toBe(0)
    expect(grossCO2e(10, -1)).toBe(0)
  })
})

describe('Deduction Function', () => {
  it('multiplies mileage by the diesel emission factor', () => {
    expect(transportDeductions([{ mileageKm: 1000 }])).toBeCloseTo(
      1000 * DIESEL_EMISSION_FACTOR_T_PER_KM,
      6
    )
  })

  it('sums across shipments and ignores negative mileage', () => {
    const d = transportDeductions([{ mileageKm: 240 }, { mileageKm: 410 }, { mileageKm: -50 }])
    expect(d).toBeCloseTo(650 * DIESEL_EMISSION_FACTOR_T_PER_KM, 6)
  })
})

describe('Net CO2e', () => {
  it('subtracts deductions from gross', () => {
    expect(netCO2e(100, 0.585)).toBeCloseTo(99.415, 3)
  })
  it('never goes negative', () => {
    expect(netCO2e(0.1, 5)).toBe(0)
  })
})

describe('Mass Balance Tracker', () => {
  it('computes produced − shipped − applied = remaining', () => {
    const mb = massBalance(40, 28, 10)
    expect(mb.remaining).toBeCloseTo(2, 3)
  })
  it('exposes negative remaining as a leakage signal', () => {
    expect(massBalance(10, 8, 5).remaining).toBeCloseTo(-3, 3)
  })
})

describe('Agronomic Yield Calculator', () => {
  it('computes yield increase % vs control plots', () => {
    const project = [{ weightTonnes: 58, moisturePercent: 14 }]
    const control = [{ weightTonnes: 44, moisturePercent: 14 }]
    // Same moisture → increase = (58-44)/44 ≈ 31.8%
    expect(yieldIncreasePercent(project, control)).toBeCloseTo(31.8, 1)
  })

  it('normalises to dry weight before comparing', () => {
    expect(dryWeight(100, 20)).toBeCloseTo(80, 3)
    const project = [{ weightTonnes: 100, moisturePercent: 50 }] // 50 dry
    const control = [{ weightTonnes: 50, moisturePercent: 0 }] // 50 dry
    expect(yieldIncreasePercent(project, control)).toBeCloseTo(0, 1)
  })

  it('returns null when either side has no plots', () => {
    expect(yieldIncreasePercent([], [{ weightTonnes: 10, moisturePercent: 10 }])).toBeNull()
    expect(yieldIncreasePercent([{ weightTonnes: 10, moisturePercent: 10 }], [])).toBeNull()
  })
})

describe('Relatable comparison', () => {
  it('converts stored tonnes to cars-off-road equivalent', () => {
    expect(carsOffRoadEquivalent(46)).toBe(10)
  })
})
