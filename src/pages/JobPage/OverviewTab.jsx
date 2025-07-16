export default function OverviewTab({ job }) {
    if (!job) return null
    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Job Summary</h2>
            <p>
                Created:{' '}
                {job.createdAt
                    ? new Date(job.createdAt.seconds * 1000).toLocaleDateString()
                    : 'N/A'}
            </p>
            <p>Status: {job.status || 'Not set'}</p>
            <p className="mt-2 text-sm text-gray-500 italic">
                (You can add tasks, milestones, or material estimates here later.)
            </p>
        </div>
    )
}