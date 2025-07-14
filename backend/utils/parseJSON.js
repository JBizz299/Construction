const fs = require('fs');

function parseJSON(filePath) {
  const file = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(file);

  const cleaned = Array.isArray(data) ? data.map(row => ({
    vendor: row.vendor || 'Unknown',
    date: row.date || null,
    total: parseFloat(row.total) || 0,
    jobId: row.jobId || null,
    source: 'json',
    raw: row
  })) : [];

  return cleaned;
}

module.exports = parseJSON;