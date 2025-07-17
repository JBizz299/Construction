export default function ReceiptItem({
    receipt,
    onRename,
    onDelete,
    onArchive,
    onPreview,
    isRenaming,
    newFileName,
    setNewFileName,
    renameError,
    saveRename,
    cancelRename,
}) {
    // Validation to ensure receipt has required properties
    if (!receipt || !receipt.id) {
        console.error('Invalid receipt passed to ReceiptItem:', receipt)
        return (
            <li className="border p-3 rounded border-red-200 bg-red-50">
                <div className="text-red-600 text-sm">Invalid receipt data</div>
            </li>
        )
    }

    return (
        <li className="border p-3 rounded flex justify-between items-center">
            <div className="flex flex-col max-w-[60%]">
                {isRenaming ? (
                    <>
                        <div className="flex items-center mb-1">
                            <input
                                type="text"
                                value={newFileName || ''}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="border px-2 py-1 rounded rounded-r-none flex-grow"
                                autoFocus
                                placeholder="Enter filename"
                            />
                            <span className="border border-l-0 border-gray-300 px-2 py-1 rounded-r bg-gray-100 select-none">
                                {(() => {
                                    const fileName = receipt.fileName || ''
                                    const dotIndex = fileName.lastIndexOf('.')
                                    return dotIndex === -1 ? '' : fileName.slice(dotIndex)
                                })()}
                            </span>
                        </div>
                        {renameError && (
                            <p className="text-red-500 text-xs mb-1">{renameError}</p>
                        )}
                        <div>
                            <button
                                onClick={saveRename}
                                className="text-green-600 underline mr-3 text-sm hover:text-green-700"
                                disabled={!newFileName?.trim()}
                            >
                                Save
                            </button>
                            <button
                                onClick={cancelRename}
                                className="text-gray-600 underline text-sm hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => onPreview(receipt)}
                        className="text-blue-600 underline truncate max-w-full text-left hover:text-blue-700"
                        title="Click to preview"
                    >
                        {receipt.fileName || 'Unnamed file'}
                    </button>
                )}
                <span className="text-sm text-gray-500 truncate max-w-full">
                    {receipt.uploadedAt?.seconds
                        ? new Date(receipt.uploadedAt.seconds * 1000).toLocaleDateString()
                        : 'Date unavailable'}
                </span>
                <span className="text-xs text-gray-400">
                    {receipt.amount ? `Amount: $${receipt.amount}` : ''}
                    {receipt.vendor ? ` | Vendor: ${receipt.vendor}` : ''}
                </span>
                {receipt.archived && (
                    <span className="text-xs text-yellow-600 font-medium">Archived</span>
                )}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onRename(receipt)} // Pass full receipt object
                    className="text-yellow-600 underline text-sm hover:text-yellow-700"
                    disabled={isRenaming}
                >
                    Rename
                </button>
                <button
                    onClick={() => onArchive(receipt)} // Pass full receipt object
                    className="text-gray-600 underline text-sm hover:text-gray-700"
                    disabled={isRenaming}
                >
                    {receipt.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                    onClick={() => onDelete(receipt)} // Pass full receipt object
                    className="text-red-600 underline text-sm hover:text-red-700"
                    disabled={isRenaming}
                >
                    Delete
                </button>
            </div>
        </li>
    )
}