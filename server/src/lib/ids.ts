import { prisma } from './prisma'

/** Sequential batch numbers: BC-YYYY-NNN (e.g. BC-2026-089). */
export async function nextBatchNumber(date = new Date()): Promise<string> {
  const year = date.getFullYear()
  const count = await prisma.biocharBatch.count({
    where: { batchNumber: { startsWith: `BC-${year}-` } },
  })
  return `BC-${year}-${String(count + 1).padStart(3, '0')}`
}

/** Sequential sample codes: SS-YYYY-NNNN. */
export async function nextSampleCode(date = new Date()): Promise<string> {
  const year = date.getFullYear()
  const count = await prisma.soilSample.count({
    where: { sampleCode: { startsWith: `SS-${year}-` } },
  })
  return `SS-${year}-${String(count + 1).padStart(4, '0')}`
}

/** Unique farmer IDs: CSA-YYYY-NNNNN. */
export async function nextFarmerId(date = new Date()): Promise<string> {
  const year = date.getFullYear()
  const count = await prisma.farmer.count({
    where: { farmerId: { startsWith: `CSA-${year}-` } },
  })
  return `CSA-${year}-${String(count + 1).padStart(5, '0')}`
}
