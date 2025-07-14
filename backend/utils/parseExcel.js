const xlsx = require('xlsx');

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);

  const cleaned = jsonData.map(row => ({
    vendor: row.Vendor || 'Unknown',
    date: row.Date || null,
    total: parseFloat(row.Total) || 0,
    jobId: row.JobID || null,
    source: 'excel',
    raw: row
  }));

  return cleaned;
}

module.exports = parseExcel;