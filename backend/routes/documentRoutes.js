const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadDocument, listDocuments } = require('../controllers/documentController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB - documents can be longer than a resume
});

router.use(protect);

router.post('/', upload.single('document'), uploadDocument);
router.get('/', listDocuments);

module.exports = router;
