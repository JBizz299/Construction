import { useState } from 'react';
import { sampleJobsReceipts } from '../data/sampleJobsReceipts';

function ReceiptUploader() {
  const [selectedJob, setSelectedJob] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);

  const handleJobSelect = (e) => {
    setSelectedJob(e.target.value);
  };

  const handleImageUpload = (e) => {
    const uploaded = e.target.files[0];
    setFile(uploaded);
    setPreviewUrl(URL.createObjectURL(uploaded));
  };

  const handleSubmit = async () => {
    if (!file || !selectedJob) {
      alert('Please select a job and upload a receipt.');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('jobId', selectedJob);

    try {
      const res = await fetch('http://localhost:4000/api/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      setOcrResult(data);  // store result to show below
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload Receipt</h2>

      <select
        onChange={handleJobSelect}
        value={selectedJob}
        className="border rounded p-2 mb-4 w-full"
      >
        <option value="">Select a job</option>
        {sampleJobsReceipts.map((job) => (
          <option key={job.id} value={job.id}>
            {job.name}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mb-4"
      />

      {previewUrl && (
        <img src={previewUrl} alt="Receipt preview" className="w-full mb-4" />
      )}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>

      {ocrResult && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Extracted Receipt Data</h3>
          <p><strong>Vendor:</strong> {ocrResult.vendor || 'N/A'}</p>
          <p><strong>Date:</strong> {ocrResult.date || 'N/A'}</p>
          <p><strong>Total:</strong> ${ocrResult.total || 'N/A'}</p>
        </div>
      )}
    </div>
  );
}

export default ReceiptUploader;