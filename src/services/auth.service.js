const prisma = require('../config/db')
const bcrypt = require('bcrypt')

const AppError = require('../utils/AppError')

const register = async(name, email, password) => {
    // Step 1: Check if email already exists
    const existingUser = await prisma.user.findUnique({where:{email}})

    // Step 2: If exists, throw AppError (409)
    if(existingUser){
        throw new AppError('Email already registered', 409)
    }
    
    // Step 3: Hash password (saltRounds = 10)
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Step 4: Create user in DB
    const user = await prisma.user.create({
        data:{
            name,
            email,
            password: hashedPassword
        }
    })
    
    // Step 5: Remove password and return user
    const{password: _, ...userWithoutPassword} = user

    // return result
    return userWithoutPassword
}

module.exports = {register}