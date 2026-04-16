const asyncHandler = require('../utils/asyncHandler') 
// No try/catch anywhere - asyncHandler wraps every controller function - automatically forwards any error to next()

const authService = require('../services/auth.service')

// const register = async (req, res) => {
//     try {
//         // 1. get name, email, password from req.body - take input
//         const { name, email, password } = req.body;

//         // 2. call authService.register() with that data - hand to service
//         const result = await authService.register(name, email, password)

//         // 3. return res.json with success message
           // res.json({ success: true, data: result})
//     }catch(err){
//         next(err) // passes error to global handler
//     }
// }

const register = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json({success: true, data: result});
})

module.exports = { register }