const {PrismaClient} = require('@prisma/client')

// instance
const prisma = new PrismaClient()

module.exports = prisma

// New version connecting prisma

// import {PrismaClient } from '@prisma/client'
// import {prismaPg} from '@prisma/adapter-pg'

// import 'dotenv/config'

// const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
// const prisma = new PrismaClient({adapter})
// export default prisma;