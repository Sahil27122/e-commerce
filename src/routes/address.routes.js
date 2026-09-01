const express = require('express')
const router = express.Router()
 
const { protect } = require('../middlewares/auth.middleware')

const validate = require('../middlewares/validate')

const { createAddressSchema, updateAddressSchema } = require('../validators/address.validator')

const addressController = require('../controllers/address.controller')
 
router.post('/', protect, validate(createAddressSchema), addressController.createAddress)

router.get('/', protect, addressController.getAddresses)

router.patch('/:id/default', protect, addressController.setDefaultAddress)

router.put('/:id', protect, validate(updateAddressSchema), addressController.updateAddress)

router.delete('/:id', protect, addressController.deleteAddress)
 
module.exports = router