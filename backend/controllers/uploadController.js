const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Only image files are allowed'));
    }
    callback(null, true);
  }
}).single('image');

const handleImageUpload = (req, res) => {
  uploadImage(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image' });
    }

    res.status(201).json({
      message: 'Image uploaded successfully',
      image_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    });
  });
};

module.exports = { handleImageUpload };
