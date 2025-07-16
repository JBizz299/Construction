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
    return (
        <li className="border p-3 rounded flex justify-between items-center">
            <div className="flex flex-col max-w-[60%]">
                {isRenaming ? (
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
                                    const dotIndex = receipt.fileName.lastIndexOf('.')
                                    return dotIndex === -1 ? '' : receipt.fileName.slice(dotIndex)
                                })()}
                            </span>
                        </div>
                        {renameError && (
                            <p className="text-red-500 text-xs mb-1">{renameError}</p>
                        )}
                        <div>
                            <button
                                onClick={() => saveRename(receipt)}
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
                        onClick={() => onPreview(receipt)}
                        className="text-blue-600 underline truncate max-w-full"
                        title="Click to preview"
                    >
                        {receipt.fileName}
                    </a>
                )}
                <span className="text-sm text-gray-500 truncate max-w-full">
                    {receipt.uploadedAt?.seconds
                        ? new Date(receipt.uploadedAt.seconds * 1000).toLocaleDateString()
                        : ''}
                </span>
                <span className="text-xs text-gray-400">
                    {receipt.amount ? `Amount: $${receipt.amount}` : ''}
                    {receipt.vendor ? ` | Vendor: ${receipt.vendor}` : ''}
                </span>
                {receipt.archived && (
                    <span className="text-xs text-yellow-600">Archived</span>
                )}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onRename(receipt)}
                    className="text-yellow-600 underline text-sm"
                >
                    Rename
                </button>
                <button
                    onClick={() => onArchive(receipt)}
                    className="text-gray-600 underline text-sm"
                >
                    {receipt.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                    onClick={() => onDelete(receipt)}
                    className="text-red-600 underline text-sm"
                >
                    Delete
                </button>
            </div>
        </li>
    )
}