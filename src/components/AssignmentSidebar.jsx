import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AssignmentSidebar({
    date,
    subcontractor,
    currentAssignment,
    jobs = [], // Default to empty array
    onSave,
    onClose
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(currentAssignment || '');

    useEffect(() => {
        setSearchTerm('');
        setSelectedJob(currentAssignment || '');
    }, [date, subcontractor]);

    const filteredJobs = jobs.filter((j) =>
        j.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = () => {
        onSave(selectedJob);
    };

    const handleClear = () => {
        onSave('');
    };

    // Add debugging
    console.log('AssignmentSidebar props:', { date, subcontractor, currentAssignment, jobs });

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="w-full max-w-sm bg-white bg-opacity-95 backdrop-blur-sm h-full shadow-lg p-6 flex flex-col border-l border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {subcontractor?.name || 'Unknown Contractor'}
                        </h2>
                        <p className="text-sm text-gray-500">{date || 'No date'}</p>
                    </div>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500 hover:text-black" />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search jobs or tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border px-3 py-2 rounded mb-4 text-sm"
                />

                <div className="flex-1 overflow-y-auto mb-4">
                    {filteredJobs.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No jobs found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {filteredJobs.map((job) => (
                                <li key={job}>
                                    <button
                                        className={`w-full text-left px-3 py-2 rounded ${selectedJob === job
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        onClick={() => setSelectedJob(job)}
                                    >
                                        {job}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-auto flex justify-between space-x-2">
                    <button
                        onClick={handleClear}
                        className="bg-gray-200 text-sm px-3 py-2 rounded hover:bg-gray-300"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Save Assignment
                    </button>
                </div>
            </div>
        </div>
    );
}