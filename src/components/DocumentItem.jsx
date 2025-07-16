export default function DocumentItem({
    document,
    onArchive,
    onDelete,
    onPreview,
}) {
    return (
        <li className="border p-3 rounded flex justify-between items-center">
            <div className="flex flex-col max-w-[60%]">
                <a
                    href="#!"
                    onClick={() => onPreview(document)}
                    className="text-blue-600 underline truncate max-w-full"
                    title="Click to preview"
                >
                    {document.fileName}
                </a>
                <span className="text-sm text-gray-500 truncate max-w-full">
                    {document.uploadedAt?.seconds
                        ? new Date(document.uploadedAt.seconds * 1000).toLocaleDateString()
                        : ''}
                </span>
                <span className="text-xs text-gray-400">
                    {document.type ? `Type: ${document.type}` : ''}
                </span>
                {document.archived && (
                    <span className="text-xs text-yellow-600">Archived</span>
                )}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onArchive(document)}
                    className="text-gray-600 underline text-sm"
                >
                    {document.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                    onClick={() => onDelete(document)}
                    className="text-red-600 underline text-sm"
                >
                    Delete
                </button>
            </div>
        </li>
    )
}