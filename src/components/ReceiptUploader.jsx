import { useState } from 'react';
import { sampleJobsReceipts } from '../data/sampleJobsReceipts';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const storage = getStorage();
const db = getFirestore();

function ReceiptUploader() {
  const [selectedJob, setSelectedJob] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const { currentUser } = useAuth();

  const handleJobSelect = (e) => {
    setSelectedJob(e.target.value);
  };

  const handleImageUpload = (e) => {
    const uploaded = e.target.files[0];
    setFile(uploaded);
    setPreviewUrl(URL.createObjectURL(uploaded));
  };

  const handleSubmit = async () => {
    setUploadError(null);
    if (!file || !selectedJob) {
      alert('Please select a job and upload a receipt.');
      return;
    }
    if (!currentUser) {
      setUploadError('You must be logged in to upload.');
      return;
    }

    try {
      setUploading(true);
      // Upload to Firebase Storage
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `jobs/${selectedJob}/receipts/${currentUser.uid}_${Date.now()}_${cleanFileName}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      await addDoc(collection(db, 'jobs', selectedJob, 'receipts'), {
        fileName: file.name,
        fileUrl,
        uploadedAt: serverTimestamp(),
        uploadedBy: currentUser.uid,
        archived: false,
        type: file.type,
        size: file.size,
      });

      setFile(null);
      setPreviewUrl(null);
      alert('Receipt uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Submit'}
      </button>

      {uploadError && (
        <div className="mt-4 text-red-500">{uploadError}</div>
      )}
    </div>
  );
}

export default ReceiptUploader;