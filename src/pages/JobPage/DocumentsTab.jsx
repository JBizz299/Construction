import DocumentItem from '../../components/DocumentItem';

export default function DocumentsTab({
    documents = [],
    documentsLoading,
    showUploadForm,
    setShowUploadForm,
    documentFile,
    setDocumentFile,
    uploading,
    uploadError,
    handleDocumentUpload,
    onArchiveClick,
    onDeleteClick,
    onPreviewClick,
    showArchived,
    setShowArchived,
}) {
    const filteredDocuments = documents.filter((d) =>
        showArchived ? d.archived : !d.archived
    )

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Documents</h2>
                <button
                    onClick={() => setShowUploadForm((v) => !v)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    disabled={uploading}
                >
                    {showUploadForm ? 'Cancel Upload' : '+ Add Document'}
                </button>
                <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="ml-2 text-xs underline text-gray-600"
                >
                    {showArchived ? 'Show Active' : 'Show Archived'}
                </button>
            </div>

            {showUploadForm && (
                <form onSubmit={handleDocumentUpload} className="mb-6">
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        onChange={(e) => setDocumentFile(e.target.files[0])}
                        className="mb-2"
                        disabled={uploading}
                    />
                    {uploadError && <p className="text-red-500 mb-2">{uploadError}</p>}
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </form>
            )}

            {documentsLoading ? (
                <p>Loading documents...</p>
            ) : filteredDocuments.length === 0 ? (
                <p className="text-gray-500 italic">No documents found.</p>
            ) : (
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredDocuments.map((d) => (
                        <DocumentItem
                            key={d.id}
                            document={d}
                            onArchive={onArchiveClick}
                            onDelete={onDeleteClick}
                            onPreview={onPreviewClick}
                        />
                    ))}
                </ul>
            )}
        </div>
    )
}