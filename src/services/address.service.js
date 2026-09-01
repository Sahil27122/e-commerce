const prisma = require('../config/prisma')
const AppError = require('../utils/AppError')
 
const createAddress = async (userId, data) => {
    const count = await prisma.address.count({ where: { userId } })
    const isDefault = data.isDefault === true || count === 0
 
    const address = await prisma.$transaction(async (tx) => {
        if (isDefault) {
            await tx.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            })
        }
 
        return tx.address.create({
            data: {
                userId,
                fullName: data.fullName,
                phone: data.phone,
                line1: data.line1,
                line2: data.line2,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                isDefault
            }
        })
    })
 
    return address
}
 
const getAddresses = async (userId) => {
    return prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })
}
 
const updateAddress = async (userId, id, data) => {
    const existing = await prisma.address.findFirst({
        where: { id, userId }
    })
 
    if (!existing) {
        throw new AppError('Address not found', 404)
    }
 
    const address = await prisma.$transaction(async (tx) => {
        if (data.isDefault === true) {
            await tx.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            })
        }

        const updated = await tx.address.update({
            where: { id },
            data
        })

        if (data.isDefault === false && existing.isDefault) {
            const next = await tx.address.findFirst({
                where: { userId, id: { not: id } },
                orderBy: { createdAt: 'desc' }
            })

            if (next) {
                await tx.address.update({
                    where: { id: next.id },
                    data: { isDefault: true }
                })
            }
        }

        return updated
    })
 
    return address
}
 
const setDefaultAddress = async (userId, id) => {
    const existing = await prisma.address.findFirst({
        where: { id, userId }
    })
 
    if (!existing) {
        throw new AppError('Address not found', 404)
    }
 
    const address = await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false }
        })
 
        return tx.address.update({
            where: { id },
            data: { isDefault: true }
        })
    })
 
    return address
}
 
const deleteAddress = async (userId, id) => {
    const existing = await prisma.address.findFirst({
        where: { id, userId }
    })

    if (!existing) {
        throw new AppError('Address not found', 404)
    }

    await prisma.$transaction(async (tx) => {
        await tx.address.delete({ where: { id } })

        if (existing.isDefault) {
            const next = await tx.address.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            })

            if (next) {
                await tx.address.update({
                    where: { id: next.id },
                    data: { isDefault: true }
                })
            }
        }
    })
}
 
module.exports = {
    createAddress,
    getAddresses,
    updateAddress,
    setDefaultAddress,
    deleteAddress
}