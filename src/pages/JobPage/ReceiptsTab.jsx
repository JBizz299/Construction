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
    previewReceipt,
    setPreviewReceipt,
    renderPreviewModal,
}) {
    const filteredReceipts = receipts.filter((r) =>
        r.fileName.toLowerCase().includes(filterTerm.toLowerCase())
    )

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Receipts</h2>
                <input
                    type="text"
                    placeholder="Search receipts by name..."
                    className="border px-2 py-1 rounded mr-4 max-w-xs"
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                />
                <button
                    onClick={() => setShowUploadForm((v) => !v)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    disabled={uploading}
                >
                    {showUploadForm ? 'Cancel Upload' : '+ Add Receipt'}
                </button>
            </div>

            {showUploadForm && (
                <form onSubmit={handleReceiptUpload} className="mb-6">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                        className="mb-2"
                        disabled={uploading}
                    />
                    {uploadError && <p className="text-red-500 mb-2">{uploadError}</p>}
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Receipt'}
                    </button>
                </form>
            )}

            {receiptsLoading ? (
                <p>Loading receipts...</p>
            ) : filteredReceipts.length === 0 ? (
                <p className="text-gray-500 italic">No receipts match your search.</p>
            ) : (
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredReceipts.map((r) => (
                        <li
                            key={r.id}
                            className="border p-3 rounded flex justify-between items-center"
                        >
                            <div className="flex flex-col max-w-[60%]">
                                {renamingId === r.id ? (
                                    <>
                                        <div className="flex items-center mb-1">
                                            <input
                                                type="text"
                                                value={newFileName}
                                                onChange={(e) => setNewFileName(e.target.value)}
                                                className="border px-2 py-1 rounded rounded-r-none flex-grow"
                                                autoFocus
                                            />
                                            <span className="border border-l-0 border-gray-300 px-2 py-1 rounded-r bg-gray-100 select-none">
                                                {(() => {
                                                    const dotIndex = r.fileName.lastIndexOf('.')
                                                    return dotIndex === -1 ? '' : r.fileName.slice(dotIndex)
                                                })()}
                                            </span>
                                        </div>
                                        {renameError && (
                                            <p className="text-red-500 text-xs mb-1">{renameError}</p>
                                        )}
                                        <div>
                                            <button
                                                onClick={() => saveRename(r)}
                                                className="text-green-600 underline mr-3 text-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelRename}
                                                className="text-gray-600 underline text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <a
                                        href="#!"
                                        onClick={() => setPreviewReceipt(r)}
                                        className="text-blue-600 underline truncate max-w-full"
                                        title="Click to preview"
                                    >
                                        {r.fileName}
                                    </a>
                                )}

                                <span className="text-sm text-gray-500 truncate max-w-full">
                                    {r.uploadedAt?.seconds
                                        ? new Date(r.uploadedAt.seconds * 1000).toLocaleDateString()
                                        : ''}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => onRenameClick(r)}
                                    className="text-yellow-600 underline text-sm"
                                >
                                    Rename
                                </button>
                                <button
                                    onClick={() => onDeleteClick(r)}
                                    className="text-red-600 underline text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {renderPreviewModal()}
        </div>
    )
}