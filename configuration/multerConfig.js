const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'group_photos', // Folder in Cloudinary where files will be stored
        allowed_formats: ['jpg', 'png', 'svg'],
        public_id: (req, file) => file.originalname.split('.')[0], // Use the original file name
    },
});

const upload = multer({ storage });

module.exports = upload;