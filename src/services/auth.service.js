const prisma = require('../config/db')
const bcrypt = require('bcrypt')

const crypto = require('crypto')

const AppError = require('../utils/AppError')

const {generateAccessToken, generateRefreshToken} = require('../utils/tokenUtils')
const { id } = require('zod/locales')

const register = async(name, email, password) => {
    
    const existingUser = await prisma.user.findUnique({where:{email}})

    if(existingUser){
        throw new AppError('Email already registered', 409)
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = await prisma.user.create({
        data:{
            name,
            email,
            password: hashedPassword
        }
    })
   
    const{password: _, ...userWithoutPassword} = user

    return userWithoutPassword
}

const login = async(email, password) => {
    
    const user = await prisma.user.findUnique({where: {email}})

    if(!user){
        throw new AppError('Invalid credentials', 401)
    }

    const isMatch = await bcrypt.compare(password, user.password)
    
    if(!isMatch){
        throw new AppError('Invalid credentials', 401)
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    const hashedToken = crypto
    .createHash('sha256')
    .update(newRefreshToken)
    .digest('hex')
    

    // expiresAt = 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const refreshToken = await prisma.refreshToken.create({
        data:{
            token : hashedToken, // hsahed version
            userId : user.id,
            expiresAt: expiresAt
        }
    })

    return {accessToken, refreshToken: newRefreshToken}
}

const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            id:true,
            name: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true
        }
    })

    if(!user) throw new AppError('User not found', 404)

    return user
}


const refreshAccessToken = async (rawToken) => {
    
    const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')

    const tokenRecord = await prisma.refreshToken.findUnique({ where: {token: hashedToken}})

    if(!tokenRecord){
        throw new AppError('Invalid refrsh token', 401)
    }

    if(tokenRecord.expiresAt < new Date()){
        throw new AppError('Refresh token expired', 401)
    }

    // need the user's role - fetch user from DB or include in findUnique
    const user = await prisma.user.findUnique({where: {id: tokenRecord.userId}})
    
    const accessToken = generateAccessToken(user.id, user.role);
    
    await prisma.refreshToken.delete({where: {id : tokenRecord.id}})

    const newRefreshToken = generateRefreshToken(user.id);

    const hashedRefresh = crypto
    .createHash('sha256')
    .update(newRefreshToken)
    .digest('hex')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const refreshToken = await prisma.refreshToken.create({
        data: {
            token : hashedRefresh,
            userId : user.id,
            expiresAt : expiresAt
        }
    })

    return {accessToken, refreshToken: newRefreshToken}
}

const logout = async (rawToken) => {
    
    const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')

    const tokenRecord = await prisma.refreshToken.findUnique({where: {token: hashedToken}})

    if(!tokenRecord){
        throw new AppError('Invalid token', 401)
    }

    await prisma.refreshToken.delete({where: {id: tokenRecord.id}})

    
}

module.exports = {register, login, getMe, refreshAccessToken, logout}