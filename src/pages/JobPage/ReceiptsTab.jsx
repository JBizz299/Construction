import ReceiptItem from '../../components/ReceiptItem';

export default function ReceiptsTab({
    receipts,
    receiptsLoading,
    filterTerm,
    setFilterTerm,
    showUploadForm,
    setShowUploadForm,
    receiptFile,
    setReceiptFile,
    uploading,
    uploadError,
    handleReceiptUpload,
    renamingId,
    newFileName,
    setNewFileName,
    renameError,
    saveRename,
    cancelRename,
    onRenameClick,
    onDeleteClick,
    onArchiveClick,
    previewReceipt,
    setPreviewReceipt,
    renderPreviewModal,
    showArchived,
    setShowArchived,
}) {
    // Filter receipts based on search term and archive status
    const filteredReceipts = receipts
        .filter((r) => {
            if (!r || !r.fileName) return false
            return r.fileName.toLowerCase().includes(filterTerm.toLowerCase())
        })
        .filter((r) => showArchived ? r.archived : !r.archived)

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-semibold">Receipts</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        placeholder="Search receipts by name..."
                        className="border px-2 py-1 rounded max-w-xs"
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                    />
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="text-xs underline text-gray-600 hover:text-gray-800 whitespace-nowrap"
                    >
                        {showArchived ? 'Show Active' : 'Show Archived'}
                    </button>
                    <button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        disabled={uploading}
                    >
                        {showUploadForm ? 'Cancel Upload' : '+ Add Receipt'}
                    </button>
                </div>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <form onSubmit={handleReceiptUpload} className="mb-6 p-4 border rounded bg-gray-50">
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Select Receipt File</label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={uploading}
                            required
                        />
                    </div>
                    {uploadError && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-red-600 text-sm">{uploadError}</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={uploading || !receiptFile}
                        >
                            {uploading ? 'Uploading...' : 'Upload Receipt'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowUploadForm(false)
                                setReceiptFile(null)
                                setUploadError(null)
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Receipts List */}
            {receiptsLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Loading receipts...</span>
                </div>
            ) : filteredReceipts.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 italic">
                        {showArchived
                            ? 'No archived receipts found.'
                            : filterTerm
                                ? 'No receipts match your search.'
                                : 'No receipts uploaded yet.'}
                    </p>
                    {!showArchived && !filterTerm && (
                        <p className="text-sm text-gray-400 mt-2">
                            Click "+ Add Receipt" to upload your first receipt.
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    <div className="mb-2 text-sm text-gray-600">
                        Showing {filteredReceipts.length} {showArchived ? 'archived' : 'active'} receipt{filteredReceipts.length !== 1 ? 's' : ''}
                    </div>
                    <ul className="space-y-3 max-h-80 overflow-y-auto">
                        {filteredReceipts.map((receipt) => (
                            <ReceiptItem
                                key={receipt.id}
                                receipt={receipt}
                                onRename={onRenameClick}
                                onDelete={onDeleteClick}
                                onArchive={onArchiveClick}
                                onPreview={setPreviewReceipt}
                                isRenaming={renamingId === receipt.id}
                                newFileName={newFileName}
                                setNewFileName={setNewFileName}
                                renameError={renameError}
                                saveRename={saveRename}
                                cancelRename={cancelRename}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {/* Preview Modal */}
            {renderPreviewModal()}
        </div>
    )
}