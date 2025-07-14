const Tesseract = require('tesseract.js');
const fs = require('fs');

async function parseImage(filePath) {
  const { data: { text } } = await Tesseract.recognize(filePath, 'eng');

  // Basic line-by-line matching — extend later with smarter parsing
  const vendor = text.match(/(vendor|store|sold by)[\s:]*([A-Za-z0-9\s]+)/i)?.[2] || 'Unknown';
  const date = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)?.[0] || null;
  const total = parseFloat(text.match(/total[\s:]*\$?([\d,]+\.\d{2})/i)?.[1]?.replace(',', '') || 0);

  return [{
    vendor,
    date,
    total,
    jobId: null,
    source: 'image',
    raw: text
  }];
}

module.exports = parseImage;