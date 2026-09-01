const asyncHandler = require('../utils/asyncHandler')

const addressService = require('../services/address.service')
 
const createAddress = asyncHandler(async (req, res) => {
    const { userId } = req.user
    const address = await addressService.createAddress(userId, req.body)
 
    res.status(201).json({
        success: true,
        data: address
    })
})
 
const getAddresses = asyncHandler(async (req, res) => {
    const { userId } = req.user
    const addresses = await addressService.getAddresses(userId)
 
    res.status(200).json({
        success: true,
        data: addresses
    })
})
 
const updateAddress = asyncHandler(async (req, res) => {
    const { userId } = req.user
    const address = await addressService.updateAddress(userId, req.params.id, req.body)
 
    res.status(200).json({
        success: true,
        data: address
    })
})
 
const setDefaultAddress = asyncHandler(async (req, res) => {
    const { userId } = req.user
    const address = await addressService.setDefaultAddress(userId, req.params.id)
 
    res.status(200).json({
        success: true,
        data: address
    })
})
 
const deleteAddress = asyncHandler(async (req, res) => {
    const { userId } = req.user
    await addressService.deleteAddress(userId, req.params.id)
 
    res.status(200).json({
        success: true
    })
})
 
module.exports = {
    createAddress,
    getAddresses,
    updateAddress,
    setDefaultAddress,
    deleteAddress
}