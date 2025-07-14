const fs = require('fs');
const Papa = require('papaparse');

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.readFileSync(filePath, 'utf8');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map(row => ({
          vendor: row.Vendor || 'Unknown',
          date: row.Date || null,
          total: parseFloat(row.Total) || 0,
          jobId: row.JobID || null,
          source: 'csv',
          raw: row
        }));
        resolve(cleaned);
      },
      error: reject
    });
  });
}

module.exports = parseCSV;