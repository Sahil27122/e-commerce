const {PrismaClient} = require('@prisma/client')

// create the instance here
const prisma = new PrismaClient()

// export it
module.exports = prisma