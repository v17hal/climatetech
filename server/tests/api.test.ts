import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../src/index'
import { prisma } from '../src/lib/prisma'

/** Tokens per role, obtained through the real login endpoint. */
const tokens: Record<string, string> = {}
let farmerDbId = ''
let farmerPublicId = ''

async function makeUser(role: string, email: string) {
  await prisma.user.create({
    data: { name: `${role} user`, email, password: bcrypt.hashSync('pass1234', 10), role },
  })
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'pass1234' })
  expect(res.status).toBe(200)
  tokens[role] = res.body.access
}

const auth = (role: string) => ({ Authorization: `Bearer ${tokens[role]}` })

afterAll(async () => {
  await prisma.$disconnect()
})

beforeAll(async () => {
  await makeUser('admin', 'admin@test.io')
  await makeUser('field_officer', 'officer@test.io')
  await makeUser('lab_technician', 'lab@test.io')
  await makeUser('vvb_auditor', 'auditor@test.io')

  /* Farmer registered through the real registration endpoint */
  const reg = await request(app).post('/api/v1/auth/register').send({
    name: 'Test Farmer',
    email: 'farmer@test.io',
    password: 'pass1234',
    phone: '+27 82 000 0000',
    nationalId: 'ZA0000000001',
    farmName: 'Test Farm',
    farmSize: 10,
    province: 'Limpopo',
    district: 'Capricorn',
    cropTypes: ['Maize'],
    farmingPractices: ['Biochar application'],
  })
  expect(reg.status).toBe(201)
  expect(reg.body.user.farmerId).toMatch(/^CSA-\d{4}-\d{5}$/)
  tokens.farmer = reg.body.access
  farmerPublicId = reg.body.user.farmerId

  const farmer = await prisma.farmer.findUnique({ where: { farmerId: farmerPublicId } })
  farmerDbId = farmer!.id
  /* Register a plot boundary so the geospatial verifier has something to check */
  await prisma.farmer.update({
    where: { id: farmerDbId },
    data: {
      boundary: JSON.stringify([
        [-24.0, 29.0],
        [-24.0, 30.0],
        [-23.0, 30.0],
        [-23.0, 29.0],
      ]),
      status: 'active',
    },
  })
})

describe('Auth & RBAC', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/biochar')
    expect(res.status).toBe(401)
  })

  it('farmer cannot create production logs', async () => {
    const res = await request(app).post('/api/v1/biochar').set(auth('farmer')).send({})
    expect(res.status).toBe(403)
  })

  it('VVB auditor can read but never write (read-only enforced globally)', async () => {
    const read = await request(app).get('/api/v1/biochar').set(auth('vvb_auditor'))
    expect(read.status).toBe(200)
    const write = await request(app).post('/api/v1/biochar').set(auth('vvb_auditor')).send({
      productionDate: '2026-06-01', feedstockType: 'rice_husk',
      pyrolysisTemp: 500, rawWeightTonnes: 10, region: 'Limpopo',
    })
    expect(write.status).toBe(403)
    expect(write.body.error).toContain('read-only')
  })

  it('VVB auditor can read the audit trail', async () => {
    const res = await request(app).get('/api/v1/audit').set(auth('vvb_auditor'))
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThan(0) // persisted to DB
  })

  it('field officer cannot edit historical batches', async () => {
    const res = await request(app).patch('/api/v1/biochar/some-id').set(auth('field_officer')).send({ rawWeightTonnes: 99 })
    expect(res.status).toBe(403)
  })
})

describe('Gate 1: Pyrolysis threshold on production log', () => {
  it('rejects a batch below 350°C', async () => {
    const res = await request(app).post('/api/v1/biochar').set(auth('field_officer')).send({
      productionDate: '2026-06-01', feedstockType: 'rice_husk',
      pyrolysisTemp: 300, rawWeightTonnes: 10, region: 'Limpopo',
    })
    expect(res.status).toBe(422)
    expect(res.body.gate).toBe('pyrolysis_threshold')
    expect(res.body.error).toContain('350°C')
  })

  it('accepts a compliant batch and assigns a BC-YYYY-NNN number', async () => {
    const res = await request(app).post('/api/v1/biochar').set(auth('field_officer')).send({
      productionDate: '2026-06-01', feedstockType: 'rice_husk',
      pyrolysisTemp: 520, rawWeightTonnes: 20, region: 'Limpopo',
    })
    expect(res.status).toBe(201)
    expect(res.body.batchNumber).toMatch(/^BC-\d{4}-\d{3}$/)
  })
})

describe('Mass balance guard', () => {
  it('blocks shipping more than the batch holds', async () => {
    const list = await request(app).get('/api/v1/biochar').set(auth('admin'))
    const batch = list.body[0]
    const res = await request(app).post(`/api/v1/biochar/${batch.id}/shipments`).set(auth('field_officer')).send({
      date: '2026-06-05', weightTonnes: 9999, destination: 'Depot', waybillNumber: 'WB-1', mileageKm: 100,
    })
    expect(res.status).toBe(422)
    expect(res.body.gate).toBe('mass_balance')
  })
})

describe('dCoC chain with evidence locks + Gate 3', () => {
  let photoId = ''
  let sampleId = ''
  let batchId = ''

  it('uploads a geotagged field photo (verified in-boundary)', async () => {
    const res = await request(app)
      .post('/api/v1/evidence/photos')
      .set(auth('field_officer'))
      .field('utcTimestamp', '2026-06-10T08:00:00Z')
      .field('latitude', '-23.5')
      .field('longitude', '29.5')
      .field('deviceId', 'CAM-TEST-1')
      .field('farmerId', farmerDbId)
      .field('photoType', 'sample')
      .attach('photo', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), {
        filename: 'sample.png',
        contentType: 'image/png',
      })
    expect(res.status).toBe(201)
    expect(res.body.verificationStatus).toBe('verified')
    expect(res.body.latitude).toBeCloseTo(-23.5, 5)
    photoId = res.body.id
  })

  it('flags an out-of-boundary photo and raises an audit alert', async () => {
    const res = await request(app)
      .post('/api/v1/evidence/photos')
      .set(auth('field_officer'))
      .field('utcTimestamp', '2026-06-10T09:00:00Z')
      .field('latitude', '-30.9')
      .field('longitude', '22.1')
      .field('deviceId', 'CAM-TEST-1')
      .field('farmerId', farmerDbId)
      .attach('photo', Buffer.from([0x89, 0x50]), { filename: 'x.png', contentType: 'image/png' })
    expect(res.status).toBe(201)
    expect(res.body.verificationStatus).toBe('flagged_boundary_mismatch')
    const alerts = await request(app).get('/api/v1/alerts').set(auth('admin'))
    expect(JSON.stringify(alerts.body)).toContain('AUDIT ALERT')
  })

  it('refuses to log a sample without a photo (evidence lock)', async () => {
    const res = await request(app).post('/api/v1/samples').set(auth('field_officer')).send({ photoId: 'nonexistent' })
    expect(res.status).toBe(422)
    expect(res.body.gate).toBe('evidence_lock')
  })

  it('logs a sample (Yellow) with photo evidence', async () => {
    const batches = await request(app).get('/api/v1/biochar').set(auth('admin'))
    batchId = batches.body[0].id
    const res = await request(app).post('/api/v1/samples').set(auth('field_officer')).send({
      photoId, batchId, farmerId: farmerDbId,
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('sampled')
    expect(res.body.sampleCode).toMatch(/^SS-\d{4}-\d{4}$/)
    sampleId = res.body.id
  })

  it('blocks results entry before lab receipt', async () => {
    const res = await request(app).post(`/api/v1/samples/${sampleId}/results`).set(auth('lab_technician')).send({
      cOrgPercent: 70, hcRatio: 0.5, heavyMetalsPass: true, certificatePath: '/uploads/certificates/x.pdf',
    })
    expect(res.status).toBe(422)
  })

  it('advances to Orange with a waybill', async () => {
    const res = await request(app).patch(`/api/v1/samples/${sampleId}/receive`).set(auth('lab_technician')).send({
      waybillNumber: 'TRK-9001',
    })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('lab_received')
  })

  it('field officer cannot enter lab results (write-only chemistry is lab-owned)', async () => {
    const res = await request(app).post(`/api/v1/samples/${sampleId}/results`).set(auth('field_officer')).send({
      cOrgPercent: 70, hcRatio: 0.5, heavyMetalsPass: true, certificatePath: '/uploads/certificates/x.pdf',
    })
    expect(res.status).toBe(403)
  })

  it('Gate 3: failing H:C ratio saves the entry but rejects the sample and locks the batch', async () => {
    const res = await request(app).post(`/api/v1/samples/${sampleId}/results`).set(auth('lab_technician')).send({
      cOrgPercent: 55, hcRatio: 0.82, heavyMetalsPass: true, certificatePath: '/uploads/certificates/x.pdf',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('rejected')
    expect(res.body.gateMessage).toContain('permanently locked')

    const batch = await request(app).get(`/api/v1/biochar/${batchId}`).set(auth('admin'))
    expect(batch.body.issuanceEligible).toBe(false)
    expect(batch.body.dcocStatus).toBe('rejected')
  })

  it('lab results are immutable once entered', async () => {
    const res = await request(app).post(`/api/v1/samples/${sampleId}/results`).set(auth('lab_technician')).send({
      cOrgPercent: 80, hcRatio: 0.3, heavyMetalsPass: true, certificatePath: '/uploads/certificates/y.pdf',
    })
    expect(res.status).toBe(409)
  })
})

describe('Gate 2: Seasonality on harvest entry', () => {
  beforeAll(async () => {
    await request(app).post('/api/v1/seasonality').set(auth('admin')).send({
      region: 'Limpopo', cropType: 'Maize', year: 2026,
      plannedPlantingDate: '2025-11-15',
      windowStart: '2026-04-01', windowEnd: '2026-06-30',
    })
  })

  it('accepts an in-season harvest unflagged', async () => {
    const res = await request(app).post('/api/v1/harvests').set(auth('field_officer')).send({
      farmerId: farmerDbId, region: 'Limpopo', cropType: 'Maize',
      harvestDate: '2026-05-20', weightTonnes: 58, moisturePercent: 14, plotType: 'project',
    })
    expect(res.status).toBe(201)
    expect(res.body.harvest.flagged).toBe(false)
  })

  it('flags (still saves) an out-of-season harvest with a VVB notification', async () => {
    const res = await request(app).post('/api/v1/harvests').set(auth('field_officer')).send({
      farmerId: farmerDbId, region: 'Limpopo', cropType: 'Maize',
      harvestDate: '2026-10-15', weightTonnes: 40, moisturePercent: 14, plotType: 'project',
    })
    expect(res.status).toBe(201)
    expect(res.body.harvest.flagged).toBe(true)
    expect(res.body.gateMessage).toContain('Gold Standard VVB notification logged')
  })

  it('computes yield increase % against control plots', async () => {
    await request(app).post('/api/v1/harvests').set(auth('field_officer')).send({
      region: 'Limpopo', cropType: 'Maize',
      harvestDate: '2026-05-22', weightTonnes: 44, moisturePercent: 14, plotType: 'control',
    })
    const res = await request(app).get('/api/v1/harvests/yield-summary').set(auth('admin'))
    expect(res.status).toBe(200)
    const limpopo = res.body.find((r: { region: string }) => r.region === 'Limpopo')
    expect(limpopo.yieldIncreasePercent).not.toBeNull()
  })
})

describe('Sustainable Farm Passport (public)', () => {
  it('serves a public verification page without auth and without financials', async () => {
    const res = await request(app).get(`/api/v1/passport/${farmerPublicId}`)
    expect(res.status).toBe(200)
    expect(res.body.farmName).toBe('Test Farm')
    expect(res.body.dmrv.methodologies).toContain('Verra')
    expect(JSON.stringify(res.body)).not.toContain('totalEarned')
  })

  it('404s for unknown farmer IDs', async () => {
    const res = await request(app).get('/api/v1/passport/CSA-0000-99999')
    expect(res.status).toBe(404)
  })
})

describe('Farmer impact dashboard access control', () => {
  it('a farmer cannot view another farm dashboard', async () => {
    /* auditor's own user has no farmer profile; use a second farmer */
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Second Farmer', email: 'farmer2@test.io', password: 'pass1234',
      phone: '+27 82 000 0002', nationalId: 'ZA0000000002', farmName: 'Second Farm',
      farmSize: 5, province: 'Gauteng', district: 'Tshwane',
    })
    const res = await request(app)
      .get(`/api/v1/impact/${farmerDbId}`)
      .set({ Authorization: `Bearer ${reg.body.access}` })
    expect(res.status).toBe(403)
  })

  it('staff can view any farm dashboard incl. carbon bank + evidence', async () => {
    const res = await request(app).get(`/api/v1/impact/${farmerDbId}`).set(auth('admin'))
    expect(res.status).toBe(200)
    expect(res.body.carbonBank).toBeDefined()
    expect(res.body.evidence.photos.length).toBeGreaterThan(0)
  })
})
