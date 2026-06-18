const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req,file,cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are required'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // This is about 5MB.
    },
});

module.exports = upload;