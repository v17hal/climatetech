import { describe, it, expect } from 'vitest'
import {
  gatePyrolysisTemp,
  gateSeasonality,
  gateLabQuality,
  evidenceLockForStatus,
  pointInPolygon,
  verifyFieldEvidence,
  roundGps,
} from '../src/services/validationGates'

describe('Gate 1: Pyrolysis Threshold (Verra & Puro.earth)', () => {
  it('rejects below 350°C with the registry error message', () => {
    const r = gatePyrolysisTemp(349.9)
    expect(r.action).toBe('reject')
    expect(r.message).toContain('350°C')
  })
  it('accepts at exactly 350°C and above', () => {
    expect(gatePyrolysisTemp(350).action).toBe('accept')
    expect(gatePyrolysisTemp(610).action).toBe('accept')
  })
})

describe('Gate 2: Seasonality & Crop Validation (Gold Standard)', () => {
  const plans = [
    {
      cropType: 'Maize',
      windowStart: new Date('2026-04-01'),
      windowEnd: new Date('2026-06-30'),
    },
  ]

  it('accepts a harvest inside the regional window', () => {
    expect(gateSeasonality(new Date('2026-05-20'), 'Maize', plans).action).toBe('accept')
  })

  it('accepts within the ±30 day tolerance', () => {
    expect(gateSeasonality(new Date('2026-07-25'), 'Maize', plans).action).toBe('accept')
  })

  it('flags (not rejects) a harvest more than 30 days outside the window', () => {
    const r = gateSeasonality(new Date('2026-10-05'), 'Maize', plans)
    expect(r.action).toBe('flag')
    expect(r.message).toContain('Gold Standard VVB notification logged')
  })

  it('flags a crop that does not match the regional baseline', () => {
    expect(gateSeasonality(new Date('2026-05-20'), 'Tobacco', plans).action).toBe('flag')
  })

  it('flags when no regional baseline exists at all', () => {
    expect(gateSeasonality(new Date('2026-05-20'), 'Maize', []).action).toBe('flag')
  })
})

describe('Gate 3: Laboratory Quality Gate (EBC / IBI)', () => {
  it('fails when H:C ratio >= 0.70', () => {
    const r = gateLabQuality(0.7, true)
    expect(r.ok).toBe(false)
    expect(r.message).toContain('permanently locked')
  })
  it('fails when heavy metals test fails', () => {
    expect(gateLabQuality(0.4, false).ok).toBe(false)
  })
  it('passes below 0.70 with clean heavy metals', () => {
    expect(gateLabQuality(0.69, true).ok).toBe(true)
  })
})

describe('Required Evidence Locks', () => {
  const none = { hasPhoto: false, hasWaybill: false, hasLabPdf: false }
  it('blocks sampling without a photo', () => {
    expect(evidenceLockForStatus('sampled', none).action).toBe('reject')
  })
  it('blocks lab receipt without a waybill', () => {
    expect(evidenceLockForStatus('lab_received', { ...none, hasPhoto: true }).action).toBe('reject')
  })
  it('blocks results without a lab PDF', () => {
    expect(
      evidenceLockForStatus('results_entered', { hasPhoto: true, hasWaybill: true, hasLabPdf: false }).action
    ).toBe('reject')
  })
  it('allows advancement when evidence is attached', () => {
    expect(
      evidenceLockForStatus('results_entered', { hasPhoto: true, hasWaybill: true, hasLabPdf: true }).ok
    ).toBe(true)
  })
})

describe('Automated Geospatial Trust Verifier', () => {
  const square: [number, number][] = [
    [-24.0, 29.0],
    [-24.0, 30.0],
    [-23.0, 30.0],
    [-23.0, 29.0],
  ]

  it('detects a point inside the boundary', () => {
    expect(pointInPolygon([-23.5, 29.5], square)).toBe(true)
  })
  it('detects a point outside the boundary', () => {
    expect(pointInPolygon([-25.0, 29.5], square)).toBe(false)
  })

  it('verifies in-boundary photos', () => {
    const v = verifyFieldEvidence([-23.5, 29.5], square)
    expect(v.isVerified).toBe(true)
    expect(v.verificationStatus).toBe('verified')
  })

  it('flags out-of-boundary photos and raises an audit alert', () => {
    const v = verifyFieldEvidence([-25.0, 29.5], square)
    expect(v.isVerified).toBe(false)
    expect(v.verificationStatus).toBe('flagged_boundary_mismatch')
    expect(v.alert).toContain('AUDIT ALERT')
  })

  it('stays pending when no boundary is registered', () => {
    expect(verifyFieldEvidence([-23.5, 29.5], null).verificationStatus).toBe('pending')
  })

  it('rounds GPS to 5 decimal places', () => {
    expect(roundGps(-23.123456789)).toBe(-23.12346)
  })
})
