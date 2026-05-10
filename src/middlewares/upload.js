const multer = require('multer')

// store in memory, not disk
const storage = multer.memoryStorage()

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        if(file.mimetype.startsWith('image/')){
            cb(null, true)
        } else {
            cb(new Error('only images allowed', false))
        }
    }

})

module.exports = upload