const prisma = require('../config/db')
const bcrypt = require('bcrypt')

const AppError = require('../utils/AppError')

const {generateAccessToken, generateRefreshToken} = require('../utils/tokenUtils')

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

const login = async(email, password) => {
    // Step 1: Find user by email
    const user = await prisma.user.findUnique({where: {email}})

    // if not found → throw AppError('Invalid credentials', 401)
    if(!user){
        throw new AppError('Invalid credentials', 401)
    }

    // Step 2: Compare password with bcrypt.compare()
    const isMatch = await bcrypt.compare(password, user.password)
    
    // if wrong → throw AppError('Invalid credentials', 401)
    if(!isMatch){
        throw new AppError('Invalid credentials', 401)
    }

    // Step 3: Generate access token and refresh token
    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    // expiresAt = 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Step 4: Store refresh token in DB with expiry
    // hint: prisma.refreshToken.create()
    const refreshToken = await prisma.refreshToken.create({
        data:{
            token : newRefreshToken,
            userId : user.id,
            expiresAt: expiresAt
        }
    })

    // Step 5: Return both tokens
    return {accessToken, refreshToken: newRefreshToken}
}

module.exports = {register, login}