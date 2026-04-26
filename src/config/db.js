const {PrismaClient} = require('@prisma/client')

// create the instance here
const prisma = new PrismaClient()

// export it
module.exports = prisma


// New version

// import {PrismaClient } from '@prisma/client'
// import {prismaPg} from '@prisma/adapter-pg'

// import 'dotenv/config'

// const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
// const prisma = new PrismaClient({adapter})
// export default prisma;