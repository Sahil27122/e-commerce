const express = require('express');
const router = express.Router()

const authController = require('../controllers/auth.controller')

const validate = require('../middlewares/validate')
const {registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema} = require('../validators/auth.validator')

const {protect} = require('../middlewares/auth.middleware')

const {
    loginIpLimiter,
    loginEmailLimiter,
    otpIpLimiter,
    otpEmailLimiter,
    verifyIpLimiter,
    verifyEmailLimiter,
} = require('../middlewares/rateLimit')

router.post('/register', validate(registerSchema), authController.register)

router.post('/send-otp', validate(sendOtpSchema), otpIpLimiter, otpEmailLimiter, authController.sendOtp)

router.post('/verify-otp', validate(verifyOtpSchema), verifyIpLimiter, verifyEmailLimiter, authController.verifyOtp)

router.post('/login', validate(loginSchema), loginIpLimiter, loginEmailLimiter, authController.login);

router.get('/me', protect, authController.me)

router.post('/refresh-token', authController.refresh)

router.post('/logout', protect, authController.logout)

module.exports = router