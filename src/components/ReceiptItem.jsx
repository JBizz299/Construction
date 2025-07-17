
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
    // Helper function to get file extension
    const getFileExtension = (fileName) => {
        if (!fileName || !fileName.includes('.')) return ''
        return fileName.substring(fileName.lastIndexOf('.'))
    }

    // Helper function to get file name without extension
    const getFileNameWithoutExtension = (fileName) => {
        if (!fileName || !fileName.includes('.')) return fileName || ''
        return fileName.substring(0, fileName.lastIndexOf('.'))
    }

    const fileExtension = getFileExtension(receipt.fileName)

    return (
        <li className={`border p-3 rounded flex justify-between items-center ${receipt.archived ? 'bg-gray-50 opacity-75' : ''
            }`}>
            <div className="flex flex-col max-w-[60%]">
                {isRenaming ? (
                    <>
                        <div className="flex items-center mb-1">
                            <input
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="border px-2 py-1 rounded rounded-r-none flex-grow text-sm"
                                placeholder="Enter new name"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        saveRename()
                                    } else if (e.key === 'Escape') {
                                        cancelRename()
                                    }
                                }}
                            />
                            <span className="border border-l-0 border-gray-300 px-2 py-1 rounded-r bg-gray-100 text-gray-600 text-sm select-none">
                                {fileExtension}
                            </span>
                        </div>
                        {renameError && (
                            <p className="text-red-500 text-xs mb-1">{renameError}</p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={saveRename}
                                className="text-green-600 hover:text-green-700 underline text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={cancelRename}
                                className="text-gray-600 hover:text-gray-700 underline text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <a
                                href="#!"
                                onClick={(e) => {
                                    e.preventDefault()
                                    onPreview(receipt)
                                }}
                                className="text-blue-600 hover:text-blue-700 underline truncate max-w-full text-sm"
                                title="Click to preview"
                            >
                                {receipt.fileName}
                            </a>
                            {receipt.archived && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                    Archived
                                </span>
                            )}
                        </div>
                        <span className="text-sm text-gray-500 truncate max-w-full">
                            {receipt.uploadedAt?.seconds
                                ? new Date(receipt.uploadedAt.seconds * 1000).toLocaleDateString()
                                : receipt.uploadedAt
                                    ? new Date(receipt.uploadedAt).toLocaleDateString()
                                    : 'Unknown date'}
                        </span>
                        <div className="text-xs text-gray-400 space-y-1">
                            {receipt.size && (
                                <div>Size: {(receipt.size / 1024).toFixed(1)} KB</div>
                            )}
                            {receipt.uploadedBy && (
                                <div>Uploaded by: {receipt.uploadedBy}</div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="flex space-x-2 flex-shrink-0">
                <button
                    onClick={() => onRename(receipt)}
                    className="text-yellow-600 hover:text-yellow-700 underline text-sm"
                    disabled={isRenaming}
                    title="Rename receipt"
                >
                    Rename
                </button>
                <button
                    onClick={() => onArchive(receipt)}
                    className={`${receipt.archived
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-600 hover:text-gray-700'
                        } underline text-sm`}
                    disabled={isRenaming}
                    title={receipt.archived ? 'Unarchive receipt' : 'Archive receipt'}
                >
                    {receipt.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                    onClick={() => onDelete(receipt)}
                    className="text-red-600 hover:text-red-700 underline text-sm"
                    disabled={isRenaming}
                    title="Delete receipt permanently"
                >
                    Delete
                </button>
            </div>
        </li>
    )
}