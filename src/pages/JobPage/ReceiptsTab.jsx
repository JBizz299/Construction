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
    const filteredReceipts = receipts
        .filter((r) =>
            r.fileName.toLowerCase().includes(filterTerm.toLowerCase())
        )
        .filter((r) => showArchived ? r.archived : !r.archived)

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
                <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="ml-2 text-xs underline text-gray-600"
                >
                    {showArchived ? 'Show Active' : 'Show Archived'}
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
                        <ReceiptItem
                            key={r.id}
                            receipt={r}
                            onRename={onRenameClick}
                            onDelete={onDeleteClick}
                            onArchive={onArchiveClick}
                            onPreview={setPreviewReceipt}
                            isRenaming={renamingId === r.id}
                            newFileName={newFileName}
                            setNewFileName={setNewFileName}
                            renameError={renameError}
                            saveRename={saveRename}
                            cancelRename={cancelRename}
                        />
                    ))}
                </ul>
            )}

            {renderPreviewModal()}
        </div>
    )
}