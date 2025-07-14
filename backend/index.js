const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Tesseract = require('tesseract.js');
const path = require('path');

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const imagePath = path.resolve(req.file.path);

    // Run OCR on the uploaded image
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');

    // Simple parsing example (you can improve this)
    // Extract date (very basic)
    const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    const date = dateMatch ? dateMatch[1] : null;

    // Extract total amount (basic regex for $XX.XX)
    const totalMatch = text.match(/\$\s?(\d+(\.\d{2})?)/);
    const total = totalMatch ? totalMatch[1] : null;

    // Vendor guess: take first line (before first \n)
    const vendor = text.split('\n')[0].trim();

    // Return parsed info
    res.json({ vendor, date, total, rawText: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));