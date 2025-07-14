const express = require('express');
const multer = require('multer');
const path = require('path');

const parseCSV = require('../utils/parseCSV');
const parseExcel = require('../utils/parseExcel');
const parseJSON = require('../utils/parseJSON');
const parseImage = require('../utils/parseImage');

const router = express.Router();

// Set up multer to save uploaded files to /uploads
const upload = multer({ dest: 'uploads/' });

router.post('/upload-file', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const type = file.mimetype;

  try {
    let parsed;

    if (type.startsWith('image/')) {
      parsed = await parseImage(file.path);
    } else if (ext === '.csv') {
      parsed = await parseCSV(file.path);
    } else if (ext === '.xlsx') {
      parsed = await parseExcel(file.path);
    } else if (ext === '.json') {
      parsed = await parseJSON(file.path);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    res.json({ data: parsed });
  } catch (err) {
    console.error('File processing failed:', err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

module.exports = router;