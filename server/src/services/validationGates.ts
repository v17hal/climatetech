/**
 * Validation and Safety Gates ("The Security Guard").
 * Enforces carbon-registry rules before data is saved. Pure functions —
 * routes call these and act on the verdicts; nothing can bypass them.
 */

export const MIN_PYROLYSIS_TEMP_C = 350
export const MAX_HC_RATIO = 0.7
export const SEASONALITY_TOLERANCE_DAYS = 30

export interface GateResult {
  ok: boolean
  /** 'reject' — block the save. 'flag' — save but mark for audit. */
  action: 'accept' | 'reject' | 'flag'
  message?: string
}

/**
 * Gate 1: Pyrolysis Threshold Check (Verra & Puro.earth rule).
 * IF pyrolysis_temperature < 350°C → reject the submission outright.
 */
export function gatePyrolysisTemp(pyrolysisTemp: number): GateResult {
  if (pyrolysisTemp < MIN_PYROLYSIS_TEMP_C) {
    return {
      ok: false,
      action: 'reject',
      message:
        'Error: Feedstock requires a minimum of 350°C to achieve permanent carbon crystallisation under standard methodologies.',
    }
  }
  return { ok: true, action: 'accept' }
}

/**
 * Gate 2: Seasonality & Crop Validation (Gold Standard rule).
 * IF harvest date falls outside the regional window by more than 30 days,
 * OR crop type does not match the registered regional baseline →
 * accept the record but flag it "Out-of-Season Audit Required".
 */
export function gateSeasonality(
  harvestDate: Date,
  cropType: string,
  regionalPlans: { cropType: string; windowStart: Date; windowEnd: Date }[]
): GateResult {
  const warning =
    'Warning: Harvest date or crop type deviates from regional agricultural baseline data. Gold Standard VVB notification logged.'

  if (regionalPlans.length === 0) {
    return { ok: false, action: 'flag', message: warning }
  }

  const cropPlans = regionalPlans.filter(
    (p) => p.cropType.toLowerCase() === cropType.toLowerCase()
  )
  if (cropPlans.length === 0) {
    return { ok: false, action: 'flag', message: warning }
  }

  const toleranceMs = SEASONALITY_TOLERANCE_DAYS * 24 * 60 * 60 * 1000
  const inWindow = cropPlans.some(
    (p) =>
      harvestDate.getTime() >= p.windowStart.getTime() - toleranceMs &&
      harvestDate.getTime() <= p.windowEnd.getTime() + toleranceMs
  )
  if (!inWindow) {
    return { ok: false, action: 'flag', message: warning }
  }
  return { ok: true, action: 'accept' }
}

/**
 * Gate 3: Laboratory Quality Gate (EBC / IBI core safety rule).
 * IF h_c_org_ratio >= 0.70 OR heavy_metals_pass === false →
 * save the entry but set dcoc_status = "rejected" and issuance_eligible = false.
 */
export function gateLabQuality(hcRatio: number, heavyMetalsPass: boolean): GateResult {
  if (hcRatio >= MAX_HC_RATIO || heavyMetalsPass === false) {
    return {
      ok: false,
      action: 'flag',
      message:
        'CRITICAL: Batch permanently locked. Hydrogen-to-Organic Carbon ratio or heavy metal concentration fails international soil safety thresholds.',
    }
  }
  return { ok: true, action: 'accept' }
}

/**
 * Required Evidence Locks — a dCoC status can only advance when the
 * mandatory evidence for that stage is attached.
 */
export function evidenceLockForStatus(
  target: 'sampled' | 'lab_received' | 'results_entered',
  evidence: { hasPhoto: boolean; hasWaybill: boolean; hasLabPdf: boolean }
): GateResult {
  if (target === 'sampled' && !evidence.hasPhoto) {
    return {
      ok: false,
      action: 'reject',
      message: 'Evidence lock: a geotagged field photo must be attached before a sample can be logged.',
    }
  }
  if (target === 'lab_received' && !evidence.hasWaybill) {
    return {
      ok: false,
      action: 'reject',
      message: 'Evidence lock: a waybill / tracking number is required before a sample can advance to "Received by Lab".',
    }
  }
  if (target === 'results_entered' && !evidence.hasLabPdf) {
    return {
      ok: false,
      action: 'reject',
      message: 'Evidence lock: a lab certificate PDF must be attached before results can be entered.',
    }
  }
  return { ok: true, action: 'accept' }
}

/**
 * Automated Geospatial Trust Verifier — ray-casting point-in-polygon.
 * Checks whether a field photo's GPS point falls inside the farmer's
 * registered plot boundary. Polygon is a ring of [lat, lng] pairs.
 */
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  if (polygon.length < 3) return false
  const [px, py] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function verifyFieldEvidence(
  photoCoordinate: [number, number],
  farmerBoundary: [number, number][] | null
): { isVerified: boolean; verificationStatus: string; alert?: string } {
  if (!farmerBoundary || farmerBoundary.length < 3) {
    return { isVerified: false, verificationStatus: 'pending' }
  }
  if (pointInPolygon(photoCoordinate, farmerBoundary)) {
    return { isVerified: true, verificationStatus: 'verified' }
  }
  return {
    isVerified: false,
    verificationStatus: 'flagged_boundary_mismatch',
    alert: 'AUDIT ALERT: Sample photo location does not match plot boundaries.',
  }
}

/** GPS coordinates must be recorded to 5 decimal places for audit evidence. */
export function roundGps(value: number): number {
  return Math.round(value * 100000) / 100000
}
