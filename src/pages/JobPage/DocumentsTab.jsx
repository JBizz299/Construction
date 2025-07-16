export default function DocumentsTab() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <p className="text-gray-700">
                No documents uploaded yet. Upload your project documents here.
            </p>
            <div className="mt-4">
                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    className="border p-2 rounded w-full"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
                    Upload Document
                </button>
            </div>
        </div>
    )
}