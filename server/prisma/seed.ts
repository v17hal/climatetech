import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const UPLOADS = path.resolve(__dirname, '../uploads')
const PHOTO_DIR = path.join(UPLOADS, 'photos')
const CERT_DIR = path.join(UPLOADS, 'certificates')

function makePlaceholderPhoto(name: string, label: string, colour: string): string {
  fs.mkdirSync(PHOTO_DIR, { recursive: true })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
  <rect width="640" height="420" fill="${colour}"/>
  <rect x="16" y="16" width="608" height="388" fill="none" stroke="#ffffff55" stroke-width="2" rx="12"/>
  <text x="320" y="200" font-family="Arial" font-size="26" fill="#fff" text-anchor="middle" font-weight="bold">${label}</text>
  <text x="320" y="235" font-family="Arial" font-size="14" fill="#ffffffaa" text-anchor="middle">CarbonSmart dMRV field evidence (demo)</text>
</svg>`
  fs.writeFileSync(path.join(PHOTO_DIR, name), svg)
  return `/uploads/photos/${name}`
}

function makePlaceholderPdf(name: string, title: string): string {
  fs.mkdirSync(CERT_DIR, { recursive: true })
  const text = `${title} — CarbonSmart demo lab certificate`
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${text.length + 60}>>stream
BT /F1 14 Tf 60 720 Td (${text}) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`
  fs.writeFileSync(path.join(CERT_DIR, name), pdf)
  return `/uploads/certificates/${name}`
}

/** Square boundary ring (~side km) around a centre point. */
function boundaryAround(lat: number, lng: number, sideKm = 2): [number, number][] {
  const d = sideKm / 111 / 2
  return [
    [lat - d, lng - d],
    [lat - d, lng + d],
    [lat + d, lng + d],
    [lat + d, lng - d],
  ]
}

async function main() {
  console.log('🌱 Seeding CarbonSmart demo data…')

  /* Wipe in dependency order */
  await prisma.auditEntry.deleteMany()
  await prisma.labResult.deleteMany()
  await prisma.soilSample.deleteMany()
  await prisma.fieldPhoto.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.harvestRecord.deleteMany()
  await prisma.applicationRecord.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.biocharBatch.deleteMany()
  await prisma.seasonalityPlan.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.carbonRecord.deleteMany()
  await prisma.baselineTest.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.irrigationLog.deleteMany()
  await prisma.pestReport.deleteMany()
  await prisma.financialRecord.deleteMany()
  await prisma.farmer.deleteMany()
  await prisma.user.deleteMany()

  const pw = (p: string) => bcrypt.hashSync(p, 10)

  /* ── Staff users (one per role) ─────────────────────────────── */
  await prisma.user.create({
    data: { name: 'Sipho Dlamini', email: 'admin@carbonsmart.co.za', password: pw('admin123'), role: 'admin' },
  })
  const officer = await prisma.user.create({
    data: { name: 'Amara Osei', email: 'officer@carbonsmart.co.za', password: pw('officer123'), role: 'field_officer' },
  })
  const labTech = await prisma.user.create({
    data: { name: 'Naledi Khumalo', email: 'lab@carbonsmart.co.za', password: pw('lab123'), role: 'lab_technician' },
  })
  await prisma.user.create({
    data: { name: 'Erik Johansson', email: 'auditor@carbonsmart.co.za', password: pw('auditor123'), role: 'vvb_auditor' },
  })

  /* ── Farmers ────────────────────────────────────────────────── */
  const farmerDefs = [
    { name: 'John Mwangi', email: 'farmer@carbonsmart.co.za', password: 'farmer123', farmerId: 'CSA-2024-00001', phone: '+27 82 123 4501', nationalId: 'ZA8001015001', farmName: 'Mwangi Family Farm', farmSize: 12.5, province: 'Limpopo', district: 'Capricorn', crops: ['Maize', 'Beans'], practices: ['No-till', 'Biochar application'], lat: -23.9045, lng: 29.4689, lsm: 62, lsmCat: 'LSM4' },
    { name: 'Thandi Nkosi', email: 'thandi@farm.co.za', password: 'farmer123', farmerId: 'CSA-2024-00002', phone: '+27 82 123 4502', nationalId: 'ZA8501015002', farmName: 'Nkosi Sugar Estate', farmSize: 45, province: 'KwaZulu-Natal', district: 'uMgungundlovu', crops: ['Sugarcane'], practices: ['Cover cropping', 'Biochar application'], lat: -29.6006, lng: 30.3794, lsm: 78, lsmCat: 'LSM4' },
    { name: 'Pieter van der Merwe', email: 'pieter@farm.co.za', password: 'farmer123', farmerId: 'CSA-2024-00003', phone: '+27 82 123 4503', nationalId: 'ZA7501015003', farmName: 'Vrede Wheat Co-op', farmSize: 210, province: 'Free State', district: 'Fezile Dabi', crops: ['Wheat', 'Sunflower'], practices: ['Precision agriculture'], lat: -27.9236, lng: 26.7312, lsm: 88, lsmCat: 'LSM5' },
    { name: 'Grace Banda', email: 'grace@farm.co.za', password: 'farmer123', farmerId: 'CSA-2025-00004', phone: '+27 82 123 4504', nationalId: 'ZA9001015004', farmName: 'Banda Rice Paddies', farmSize: 8, province: 'Mpumalanga', district: 'Ehlanzeni', crops: ['Rice', 'Vegetables'], practices: ['Biochar application', 'Drip irrigation'], lat: -25.4658, lng: 30.9853, lsm: 41, lsmCat: 'LSM3' },
    { name: 'Kagiso Mokoena', email: 'kagiso@farm.co.za', password: 'farmer123', farmerId: 'CSA-2025-00005', phone: '+27 82 123 4505', nationalId: 'ZA9501015005', farmName: 'Mokoena Smallholding', farmSize: 3.2, province: 'Limpopo', district: 'Vhembe', crops: ['Maize'], practices: ['Organic'], lat: -22.9876, lng: 30.4587, lsm: 22, lsmCat: 'LSM2' },
  ]

  const farmers: Record<string, { id: string; userId: string }> = {}
  for (const f of farmerDefs) {
    const user = await prisma.user.create({
      data: {
        name: f.name, email: f.email, password: pw(f.password), role: 'farmer',
        farmer: {
          create: {
            farmerId: f.farmerId, phone: f.phone, nationalId: f.nationalId,
            farmName: f.farmName, farmSize: f.farmSize, province: f.province, district: f.district,
            cropTypes: JSON.stringify(f.crops), farmingPractices: JSON.stringify(f.practices),
            latitude: f.lat, longitude: f.lng,
            boundary: JSON.stringify(boundaryAround(f.lat, f.lng)),
            lsmScore: f.lsm, lsmCategory: f.lsmCat, status: 'active',
          },
        },
      },
      include: { farmer: true },
    })
    farmers[f.farmerId] = { id: user.farmer!.id, userId: user.id }
  }
  const john = farmers['CSA-2024-00001']
  const grace = farmers['CSA-2025-00004']

  /* ── Field-officer delegation (Field #2) ────────────────────────
     Amara (officer) is delegated 3 of the 5 farms — she only sees these.
     Nkosi & Pieter are left unassigned to demonstrate scoping. */
  for (const fid of ['CSA-2024-00001', 'CSA-2025-00004', 'CSA-2025-00005']) {
    await prisma.farmer.update({
      where: { id: farmers[fid].id },
      data: { assignedOfficerId: officer.id },
    })
  }

  /* ── Baseline tests (Field #1) — soil state BEFORE biochar ─────── */
  await prisma.baselineTest.createMany({
    data: [
      { farmerId: john.id, testDate: new Date('2025-10-05'), soilPH: 5.4, organicMatter: 2.8, moisture: 18, soilCarbon: 1.9, temperature: 22.5, labName: 'SGS', testedBy: 'Amara Osei', notes: 'Pre-biochar baseline, Maize field A' },
      { farmerId: grace.id, testDate: new Date('2025-11-20'), soilPH: 5.1, organicMatter: 3.1, moisture: 24, soilCarbon: 2.2, temperature: 24.0, labName: 'SGS', testedBy: 'Amara Osei', notes: 'Pre-biochar baseline, rice paddies' },
      { farmerId: farmers['CSA-2025-00005'].id, testDate: new Date('2025-10-18'), soilPH: 5.6, organicMatter: 2.4, moisture: 15, soilCarbon: 1.6, temperature: 23.2, labName: 'SGS', testedBy: 'Amara Osei', notes: 'Pre-biochar baseline, smallholding' },
    ],
  })

  /* ── Seasonality planner (2026) ─────────────────────────────── */
  const plans = [
    { region: 'Limpopo', cropType: 'Maize', planned: '2025-11-15', actual: '2025-11-22', ws: '2026-04-01', we: '2026-06-30' },
    { region: 'KwaZulu-Natal', cropType: 'Sugarcane', planned: '2025-09-01', actual: '2025-09-05', ws: '2026-05-01', we: '2026-08-31' },
    { region: 'Free State', cropType: 'Wheat', planned: '2026-05-15', actual: null, ws: '2026-10-15', we: '2026-12-15' },
    { region: 'Mpumalanga', cropType: 'Rice', planned: '2025-12-01', actual: '2025-12-10', ws: '2026-04-15', we: '2026-06-15' },
  ]
  for (const p of plans) {
    await prisma.seasonalityPlan.create({
      data: {
        region: p.region, cropType: p.cropType, year: 2026,
        plannedPlantingDate: new Date(p.planned),
        actualPlantingDate: p.actual ? new Date(p.actual) : null,
        windowStart: new Date(p.ws), windowEnd: new Date(p.we),
      },
    })
  }

  /* ── Biochar batches ────────────────────────────────────────── */
  const batchGood = await prisma.biocharBatch.create({
    data: {
      batchNumber: 'BC-2026-001', productionDate: new Date('2026-02-10'),
      feedstockType: 'rice_husk', pyrolysisTemp: 520, rawWeightTonnes: 40, region: 'Mpumalanga',
      cOrgPercent: 78, hcRatio: 0.42, heavyMetalsPass: true,
      dcocStatus: 'results_entered', issuanceEligible: true, createdById: officer.id,
    },
  })
  const batchGood2 = await prisma.biocharBatch.create({
    data: {
      batchNumber: 'BC-2026-002', productionDate: new Date('2026-03-05'),
      feedstockType: 'wood_waste', pyrolysisTemp: 465, rawWeightTonnes: 25, region: 'Limpopo',
      cOrgPercent: 71, hcRatio: 0.51, heavyMetalsPass: true,
      dcocStatus: 'results_entered', issuanceEligible: true, createdById: officer.id,
    },
  })
  const batchRejected = await prisma.biocharBatch.create({
    data: {
      batchNumber: 'BC-2026-003', productionDate: new Date('2026-04-18'),
      feedstockType: 'maize_stover', pyrolysisTemp: 380, rawWeightTonnes: 15, region: 'Limpopo',
      cOrgPercent: 55, hcRatio: 0.82, heavyMetalsPass: true,
      dcocStatus: 'rejected', issuanceEligible: false, createdById: officer.id,
    },
  })
  const batchPending = await prisma.biocharBatch.create({
    data: {
      batchNumber: 'BC-2026-004', productionDate: new Date('2026-06-20'),
      feedstockType: 'sugarcane_bagasse', pyrolysisTemp: 610, rawWeightTonnes: 30, region: 'KwaZulu-Natal',
      dcocStatus: 'produced', issuanceEligible: false, createdById: officer.id,
    },
  })

  /* ── Shipments + applications (mass balance) ────────────────── */
  await prisma.shipment.createMany({
    data: [
      { batchId: batchGood.id, date: new Date('2026-03-01'), weightTonnes: 18, destination: 'Ehlanzeni depot', waybillNumber: 'WB-88231', mileageKm: 240 },
      { batchId: batchGood.id, date: new Date('2026-03-20'), weightTonnes: 10, destination: 'Capricorn depot', waybillNumber: 'WB-88410', mileageKm: 410 },
      { batchId: batchGood2.id, date: new Date('2026-04-02'), weightTonnes: 12, destination: 'Vhembe depot', waybillNumber: 'WB-90112', mileageKm: 185 },
    ],
  })
  await prisma.applicationRecord.createMany({
    data: [
      { batchId: batchGood.id, farmerId: grace.id, date: new Date('2026-03-08'), weightTonnes: 10, notes: 'Rice paddies, north block' },
      { batchId: batchGood.id, farmerId: john.id, date: new Date('2026-03-25'), weightTonnes: 6, notes: 'Maize field A' },
      { batchId: batchGood2.id, farmerId: john.id, date: new Date('2026-04-10'), weightTonnes: 8, notes: 'Maize field B' },
      { batchId: batchGood2.id, farmerId: farmers['CSA-2025-00005'].id, date: new Date('2026-04-15'), weightTonnes: 3, notes: 'Smallholding plot' },
    ],
  })

  /* ── Field photos (camera log) ──────────────────────────────── */
  const photoDefs = [
    { name: 'seed-photo-1.svg', label: 'Baseline soil — Mwangi Farm', colour: '#8B6F47', farmer: john, lat: -23.90312, lng: 29.46754, type: 'before', dev: 'CSA-CAM-011', ts: '2026-01-12T08:31:00Z', verified: true },
    { name: 'seed-photo-2.svg', label: 'Biochar-enriched soil — Mwangi Farm', colour: '#3B2F22', farmer: john, lat: -23.90405, lng: 29.46901, type: 'after', dev: 'CSA-CAM-011', ts: '2026-05-14T09:02:00Z', verified: true },
    { name: 'seed-photo-3.svg', label: 'Soil sample SS-2026-0001', colour: '#40BBB9', farmer: grace, lat: -25.46390, lng: 30.98411, type: 'sample', dev: 'CSA-CAM-014', ts: '2026-03-10T06:47:00Z', verified: true },
    { name: 'seed-photo-4.svg', label: 'Soil sample SS-2026-0002', colour: '#336599', farmer: john, lat: -23.90577, lng: 29.47013, type: 'sample', dev: 'CSA-CAM-011', ts: '2026-04-12T07:15:00Z', verified: true },
    { name: 'seed-photo-5.svg', label: 'Sample photo — boundary mismatch', colour: '#B0413E', farmer: grace, lat: -25.60112, lng: 31.10233, type: 'sample', dev: 'CSA-CAM-014', ts: '2026-05-02T10:20:00Z', verified: false },
    { name: 'seed-photo-6.svg', label: 'Crop growth — Nkosi Estate', colour: '#98CF59', farmer: farmers['CSA-2024-00002'], lat: -29.59920, lng: 30.37855, type: 'field', dev: 'CSA-CAM-012', ts: '2026-06-01T08:00:00Z', verified: true },
  ]
  const photos: string[] = []
  for (const p of photoDefs) {
    const filePath = makePlaceholderPhoto(p.name, p.label, p.colour)
    const photo = await prisma.fieldPhoto.create({
      data: {
        filePath, utcTimestamp: new Date(p.ts), latitude: p.lat, longitude: p.lng,
        deviceId: p.dev, photoType: p.type, caption: p.label,
        farmerId: p.farmer.id, uploadedById: officer.id,
        isVerified: p.verified,
        verificationStatus: p.verified ? 'verified' : 'flagged_boundary_mismatch',
      },
    })
    photos.push(photo.id)
  }
  await prisma.alert.create({
    data: {
      type: 'compliance', severity: 'high', title: 'Boundary mismatch flagged',
      message: 'AUDIT ALERT: Sample photo location does not match plot boundaries.',
      farmerId: grace.id,
    },
  })

  /* ── Soil samples + lab results (dCoC chain) ────────────────── */
  const cert1 = makePlaceholderPdf('seed-cert-1.pdf', 'SS-2026-0001')
  const cert2 = makePlaceholderPdf('seed-cert-2.pdf', 'SS-2026-0002')
  const cert3 = makePlaceholderPdf('seed-cert-3.pdf', 'SS-2026-0003')

  // Green — full chain complete (Grace / batch 1)
  const s1 = await prisma.soilSample.create({
    data: {
      sampleCode: 'SS-2026-0001', batchId: batchGood.id, farmerId: grace.id,
      photoId: photos[2], status: 'results_entered', waybillNumber: 'TRK-55210',
      assignedLabTechId: labTech.id,
      sampledByName: 'Amara Osei', sampledAt: new Date('2026-03-10'),
      collectedByName: 'Amara Osei', collectedAt: new Date('2026-03-11'),
      deliveredByName: 'DHL Courier (SGS run)', deliveredAt: new Date('2026-03-13'),
      labReceivedAt: new Date('2026-03-14'),
      packagingType: 'Sealed sterile sample bag + insulated cool box',
      packagingTempC: 4.5,
    },
  })
  await prisma.labResult.create({
    data: {
      sampleId: s1.id, cOrgPercent: 78, hcRatio: 0.42, heavyMetalsPass: true,
      soilPH: 5.9, electricalConductivity: 1.4, bulkDensity: 1.28, specificSurfaceArea: 310,
      waterHoldingCapacity: 38, certificatePath: cert1, enteredById: labTech.id,
      enteredAt: new Date('2026-03-18'),
    },
  })

  // Green — second reading for John (shows trend improvement)
  const s2 = await prisma.soilSample.create({
    data: {
      sampleCode: 'SS-2026-0002', batchId: batchGood2.id, farmerId: john.id,
      photoId: photos[3], status: 'results_entered', waybillNumber: 'TRK-55411',
      assignedLabTechId: labTech.id,
      sampledByName: 'Amara Osei', sampledAt: new Date('2026-04-12'),
      collectedByName: 'Amara Osei', collectedAt: new Date('2026-04-13'),
      deliveredByName: 'DHL Courier (SGS run)', deliveredAt: new Date('2026-04-15'),
      labReceivedAt: new Date('2026-04-16'),
      packagingType: 'Sealed sterile sample bag + insulated cool box',
      packagingTempC: 5.0,
    },
  })
  await prisma.labResult.create({
    data: {
      sampleId: s2.id, cOrgPercent: 71, hcRatio: 0.51, heavyMetalsPass: true,
      soilPH: 6.2, electricalConductivity: 1.7, bulkDensity: 1.19, specificSurfaceArea: 350,
      waterHoldingCapacity: 46, certificatePath: cert2, enteredById: labTech.id,
      enteredAt: new Date('2026-04-20'),
    },
  })

  // Rejected — Gate 3 failure (batch 3)
  const s3 = await prisma.soilSample.create({
    data: {
      sampleCode: 'SS-2026-0003', batchId: batchRejected.id, farmerId: john.id,
      photoId: photos[1], status: 'rejected', waybillNumber: 'TRK-56002',
      assignedLabTechId: labTech.id,
      sampledByName: 'Amara Osei', sampledAt: new Date('2026-04-25'),
      collectedByName: 'Amara Osei', collectedAt: new Date('2026-04-27'),
      deliveredByName: 'DHL Courier (SGS run)', deliveredAt: new Date('2026-04-30'),
      labReceivedAt: new Date('2026-05-01'),
      packagingType: 'Sealed sterile sample bag + insulated cool box',
      packagingTempC: 6.2,
    },
  })
  await prisma.labResult.create({
    data: {
      sampleId: s3.id, cOrgPercent: 55, hcRatio: 0.82, heavyMetalsPass: true,
      soilPH: 6.0, electricalConductivity: 1.2, bulkDensity: 1.31, specificSurfaceArea: 190,
      waterHoldingCapacity: 33, certificatePath: cert3, enteredById: labTech.id,
      enteredAt: new Date('2026-05-04'),
    },
  })

  // Orange — received by lab, awaiting results
  await prisma.soilSample.create({
    data: {
      sampleCode: 'SS-2026-0004', batchId: batchPending.id, farmerId: farmers['CSA-2024-00002'].id,
      photoId: photos[5], status: 'lab_received', waybillNumber: 'TRK-56377',
      assignedLabTechId: labTech.id,
      sampledByName: 'Amara Osei', sampledAt: new Date('2026-06-24'),
      collectedByName: 'Amara Osei', collectedAt: new Date('2026-06-25'),
      deliveredByName: 'Regional courier', deliveredAt: new Date('2026-06-27'),
      labReceivedAt: new Date('2026-06-28'),
      packagingType: 'Sealed sterile sample bag + insulated cool box',
      packagingTempC: 5.5,
    },
  })
  // Yellow — sampled in field only
  await prisma.soilSample.create({
    data: {
      sampleCode: 'SS-2026-0005', farmerId: john.id,
      photoId: photos[0], status: 'sampled',
      sampledByName: 'Amara Osei', sampledAt: new Date('2026-07-01'),
      packagingType: 'Sealed sterile sample bag',
      packagingTempC: 8.0,
    },
  })

  /* ── Harvests (project vs control) ──────────────────────────── */
  await prisma.harvestRecord.createMany({
    data: [
      { farmerId: john.id, region: 'Limpopo', cropType: 'Maize', harvestDate: new Date('2026-05-20'), weightTonnes: 58, moisturePercent: 14, plotType: 'project' },
      { farmerId: farmers['CSA-2025-00005'].id, region: 'Limpopo', cropType: 'Maize', harvestDate: new Date('2026-05-28'), weightTonnes: 54, moisturePercent: 15, plotType: 'project' },
      { region: 'Limpopo', cropType: 'Maize', harvestDate: new Date('2026-05-22'), weightTonnes: 44, moisturePercent: 14, plotType: 'control' },
      { farmerId: grace.id, region: 'Mpumalanga', cropType: 'Rice', harvestDate: new Date('2026-05-30'), weightTonnes: 21, moisturePercent: 18, plotType: 'project' },
      { region: 'Mpumalanga', cropType: 'Rice', harvestDate: new Date('2026-05-25'), weightTonnes: 17, moisturePercent: 18, plotType: 'control' },
      { farmerId: farmers['CSA-2024-00002'].id, region: 'KwaZulu-Natal', cropType: 'Sugarcane', harvestDate: new Date('2026-10-05'), weightTonnes: 310, moisturePercent: 70, plotType: 'project', flagged: true, flagReason: 'Out-of-Season Audit Required' },
      { region: 'KwaZulu-Natal', cropType: 'Sugarcane', harvestDate: new Date('2026-06-15'), weightTonnes: 265, moisturePercent: 70, plotType: 'control' },
    ],
  })

  /* ── Payouts (Carbon Bank ledger) ───────────────────────────── */
  await prisma.payout.createMany({
    data: [
      { farmerId: john.id, date: new Date('2026-04-30'), amount: 4850, type: 'payment', description: 'Q1 2026 carbon credit revenue share — BC-2026-001' },
      { farmerId: john.id, date: new Date('2026-06-15'), amount: 1200, type: 'discount', description: 'Fertiliser input discount — sustainability tier' },
      { farmerId: grace.id, date: new Date('2026-04-30'), amount: 6300, type: 'payment', description: 'Q1 2026 carbon credit revenue share — BC-2026-001' },
      { farmerId: farmers['CSA-2025-00005'].id, date: new Date('2026-05-31'), amount: 980, type: 'payment', description: 'Q2 2026 carbon credit revenue share — BC-2026-002' },
    ],
  })

  /* ── Carbon records (soil monitoring time series) ───────────── */
  for (const [i, f] of Object.values(farmers).entries()) {
    for (let m = 0; m < 8; m++) {
      await prisma.carbonRecord.create({
        data: {
          farmerId: f.id,
          date: new Date(2025, 10 + m, 15),
          carbonLevel: 2.1 + i * 0.3 + m * 0.12,
          soilPH: 5.8 + (m % 3) * 0.2,
          organicMatter: 3.2 + m * 0.15,
          moisture: 22 + (m % 4) * 2,
          temperature: 21 + (m % 5) * 1.4 + i * 0.3,
          inputMethod: m % 3 === 0 ? 'sensor' : 'manual',
        },
      })
    }
  }

  /* ── Inventory, irrigation, pests, financials ───────────────── */
  await prisma.inventoryItem.createMany({
    data: [
      { farmerId: john.id, name: 'Maize seed (SC701) — used', category: 'seed', quantity: 240, unit: 'kg', reorderLevel: 100 },
      { farmerId: john.id, name: 'Maize (harvested)', category: 'crop', quantity: 58, unit: 'tonnes', reorderLevel: 0 },
      { farmerId: grace.id, name: 'Rice seedlings — used', category: 'seed', quantity: 500, unit: 'trays', reorderLevel: 150 },
      { farmerId: grace.id, name: 'Rice (harvested)', category: 'crop', quantity: 21, unit: 'tonnes', reorderLevel: 0 },
      { farmerId: farmers['CSA-2025-00005'].id, name: 'Broiler chickens', category: 'livestock', quantity: 320, unit: 'birds', reorderLevel: 0 },
    ],
  })
  await prisma.irrigationLog.createMany({
    data: [
      { farmerId: john.id, date: new Date('2026-06-20'), waterUsed: 12500, unit: 'litres', method: 'Drip' },
      { farmerId: john.id, date: new Date('2026-06-27'), waterUsed: 11800, unit: 'litres', method: 'Drip' },
      { farmerId: grace.id, date: new Date('2026-06-25'), waterUsed: 30500, unit: 'litres', method: 'Flood' },
    ],
  })
  await prisma.pestReport.createMany({
    data: [
      { farmerId: john.id, pestName: 'Fall armyworm', severity: 'high', affectedArea: 2.4, remedy: 'Apply Bt-based biopesticide; monitor pheromone traps', resolved: false },
      { farmerId: grace.id, pestName: 'Rice blast', severity: 'medium', affectedArea: 0.8, remedy: 'Silicon amendment + resistant cultivar next season', resolved: true },
    ],
  })
  await prisma.financialRecord.createMany({
    data: [
      { farmerId: john.id, type: 'income', amount: 86000, description: 'Maize harvest sale', date: new Date('2026-06-05') },
      { farmerId: john.id, type: 'expense', amount: 21500, description: 'Seed + fertiliser inputs', date: new Date('2025-11-20') },
      { farmerId: john.id, type: 'income', amount: 4850, description: 'Carbon credit payout', date: new Date('2026-04-30') },
      { farmerId: grace.id, type: 'income', amount: 31000, description: 'Rice harvest sale', date: new Date('2026-06-12') },
    ],
  })

  await prisma.alert.createMany({
    data: [
      { type: 'pest', severity: 'high', title: 'Fall armyworm outbreak', message: 'Outbreak reported in Capricorn district — inspect maize plots.', farmerId: john.id },
      { type: 'compliance', severity: 'critical', title: 'Batch permanently locked', message: 'CRITICAL: Batch permanently locked. Hydrogen-to-Organic Carbon ratio or heavy metal concentration fails international soil safety thresholds.', farmerId: john.id },
      { type: 'weather', severity: 'medium', title: 'Heavy rainfall expected', message: 'Ehlanzeni: 60mm+ forecast this week — delay biochar application.', farmerId: grace.id },
    ],
  })

  console.log('✅ Seed complete:')
  console.log('   admin@carbonsmart.co.za / admin123        (CSSA Admin)')
  console.log('   officer@carbonsmart.co.za / officer123    (Field Officer)')
  console.log('   lab@carbonsmart.co.za / lab123            (Lab Technician)')
  console.log('   auditor@carbonsmart.co.za / auditor123    (VVB Auditor)')
  console.log('   farmer@carbonsmart.co.za / farmer123      (Farmer)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
