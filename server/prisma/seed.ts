import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding CarbonSmart database...')

  /* Users */
  const adminPw = await bcrypt.hash('admin123', 10)
  const officerPw = await bcrypt.hash('officer123', 10)
  const farmerPw = await bcrypt.hash('farmer123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@carbonsmart.co.za' },
    update: {},
    create: { name: 'Sipho Dlamini', email: 'admin@carbonsmart.co.za', password: adminPw, role: 'admin' },
  })

  const officer = await prisma.user.upsert({
    where: { email: 'officer@carbonsmart.co.za' },
    update: {},
    create: { name: 'Amara Osei', email: 'officer@carbonsmart.co.za', password: officerPw, role: 'agri_officer' },
  })

  const farmerUser = await prisma.user.upsert({
    where: { email: 'farmer@carbonsmart.co.za' },
    update: {},
    create: { name: 'John Mwangi', email: 'farmer@carbonsmart.co.za', password: farmerPw, role: 'farmer' },
  })

  /* Demo farmer record */
  await prisma.farmer.upsert({
    where: { farmerId: 'CSA-2024-00001' },
    update: {},
    create: {
      farmerId: 'CSA-2024-00001',
      userId: farmerUser.id,
      phone: '+27 82 456 7890',
      nationalId: '8001015001087',
      farmName: 'Mwangi Green Farm',
      farmSize: 45,
      farmSizeUnit: 'ha',
      province: 'Limpopo',
      district: 'Capricorn',
      cropTypes: JSON.stringify(['Maize', 'Sorghum']),
      farmingPractices: JSON.stringify(['Crop Rotation', 'Composting']),
      lsmScore: 72,
      lsmCategory: 'LSM4',
      status: 'active',
      latitude: -23.9045,
      longitude: 29.4689,
    },
  })

  /* Sample carbon readings */
  const farmer = await prisma.farmer.findUnique({ where: { farmerId: 'CSA-2024-00001' } })
  if (farmer) {
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      await prisma.carbonRecord.create({
        data: {
          farmerId: farmer.id,
          date,
          carbonLevel: parseFloat((3.2 + i * 0.35 + Math.random() * 0.4).toFixed(2)),
          soilPH: parseFloat((6.2 + Math.random() * 0.6).toFixed(1)),
          organicMatter: parseFloat((2.1 + i * 0.1 + Math.random() * 0.2).toFixed(2)),
          moisture: parseFloat((28 + Math.random() * 12).toFixed(1)),
          inputMethod: i % 2 === 0 ? 'sensor' : 'manual',
        },
      })
    }
  }

  console.log(`✅ Seeded: admin (${admin.email}), officer (${officer.email}), farmer (${farmerUser.email})`)
  console.log('✅ Demo farmer: CSA-2024-00001 with 6 carbon readings')
}

main().catch(console.error).finally(() => prisma.$disconnect())
