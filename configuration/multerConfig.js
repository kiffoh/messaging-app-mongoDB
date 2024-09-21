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
const groupPhotos = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'group_photos', // Folder in Cloudinary where files will be stored
        allowed_formats: ['jpg', 'png', 'svg'],
        public_id: (req, file) => file.originalname.split('.')[0], // Use the original file name
    },
});

// Set up Multer to use Cloudinary storage
const userPhotos = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'profile_photos', // Folder in Cloudinary where files will be stored
        allowed_formats: ['jpg', 'png', 'svg'],
        public_id: (req, file) => file.originalname.split('.')[0], // Use the original file name
    },
});

const uploadGroupPhoto = multer({ storage: groupPhotos });
const uploadUserPhoto = multer({ storage: userPhotos });

module.exports = {
    uploadGroupPhoto,
    uploadUserPhoto
}
