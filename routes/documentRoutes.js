const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const DocumentController = require('../controllers/documentController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({ storage });

// Upload new document
router.post('/', auth, upload.single('file'), (req, res) => DocumentController.upload(req, res));

// Preview document file
router.get('/preview/:filename', (req, res) => DocumentController.preview(req, res));

// Delete document
router.delete('/:id', auth, (req, res) => DocumentController.remove(req, res));

module.exports = router;
