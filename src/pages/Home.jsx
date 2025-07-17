import { useState, useEffect } from "react";
import { useJobs } from "../context/JobContext";
import { Link } from "react-router-dom";
import JobCard from "../components/JobCard";

export default function Home({ isDarkMode }) {
  const { jobs, loading, updateJobOrder, deleteJob } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderedJobs, setOrderedJobs] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (loading) return;

    // Sort jobs by their order property, fallback to creation date
    const sortedJobs = [...jobs].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    setOrderedJobs(sortedJobs);
  }, [jobs, loading]);

  // Filter jobs based on search query
  const filteredJobs = orderedJobs.filter((job) =>
    job.name && job.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (e, job, index) => {
    setDraggedItem({ job, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', job.id);

    // Hide the default drag image
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
  };

  const handleDragEnd = async (e) => {
    if (draggedItem && dragOverIndex !== null && draggedItem.index !== dragOverIndex) {
      setIsReordering(true);

      try {
        // Create new order for filtered jobs
        const newFilteredJobs = [...filteredJobs];
        const [reorderedItem] = newFilteredJobs.splice(draggedItem.index, 1);
        newFilteredJobs.splice(dragOverIndex, 0, reorderedItem);

        // Update the full ordered jobs array to maintain consistency
        const newOrderedJobs = [...orderedJobs];
        const sourceJob = draggedItem.job;
        const originalSourceIndex = newOrderedJobs.findIndex(job => job.id === sourceJob.id);

        if (originalSourceIndex !== -1) {
          // Remove from original position
          const [movedJob] = newOrderedJobs.splice(originalSourceIndex, 1);

          // Find new position in the full array
          let newIndex;
          if (dragOverIndex === 0) {
            newIndex = 0;
          } else if (dragOverIndex >= newFilteredJobs.length - 1) {
            newIndex = newOrderedJobs.length;
          } else {
            const targetJob = newFilteredJobs[dragOverIndex];
            newIndex = newOrderedJobs.findIndex(job => job.id === targetJob.id);
            if (newIndex === -1) newIndex = newOrderedJobs.length;
          }

          // Insert at new position
          newOrderedJobs.splice(newIndex, 0, movedJob);

          // Update state optimistically
          setOrderedJobs(newOrderedJobs);

          // Save to Firebase
          await updateJobOrder(newOrderedJobs.map(job => job.id));
        }
      } catch (error) {
        console.error('Failed to save job order:', error);
        // Revert on error - refetch from jobs
        const revertedJobs = [...jobs].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        setOrderedJobs(revertedJobs);
        alert('Failed to save job order. Please try again.');
      } finally {
        setIsReordering(false);
      }
    }

    // Reset drag state
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Only update if different
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    // Actual reordering happens in handleDragEnd
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Delete "${job.name}"? This will permanently delete the job and all its data. This cannot be undone.`)) {
      return;
    }

    try {
      await deleteJob(job.id);
      // Job will be automatically removed from the list via the real-time listener
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleArchiveJob = async (job) => {
    if (!window.confirm(`Archive "${job.name}"? You can restore it later from archived jobs.`)) {
      return;
    }

    try {
      // TODO: Implement archive functionality
      console.log('Archive functionality not yet implemented for job:', job.id);
      alert('Archive functionality coming soon!');
    } catch (error) {
      console.error('Failed to archive job:', error);
      alert('Failed to archive job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="space-y-2">
          <h1 className={`text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Job Management
          </h1>
          <p className={`text-lg max-w-2xl ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage and track all your construction projects in one place
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm focus:outline-none
                shadow-sm hover:shadow transition-all duration-200 focus:ring-2 focus:ring-blue-500/20
                ${isDarkMode
                  ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
                }`}
            />
            <svg
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Link
            to="/create"
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 text-sm whitespace-nowrap
              shadow-sm hover:shadow-md active:scale-95 transform flex items-center gap-2
              ${isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Job
          </Link>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className={`text-xl font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {searchQuery ? 'No jobs found' : 'No jobs yet'}
            </p>
            <p className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {searchQuery ? "Try adjusting your search" : "Get started by creating a new job"}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Loading overlay */}
            {isReordering && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg z-50 flex items-center justify-center">
                <div className={`px-6 py-3 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}>
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm font-medium">Saving new order...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredJobs.map((job, index) => (
                <div
                  key={job.id}
                  draggable={!isReordering}
                  onDragStart={(e) => handleDragStart(e, job, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`
                    transition-all duration-300 select-none relative
                    ${!isReordering ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed pointer-events-none'}
                    ${dragOverIndex === index && draggedItem?.index !== index
                      ? 'transform translate-x-2'
                      : ''
                    }
                    ${draggedItem?.index === index ? 'opacity-50' : ''}
                    hover:scale-[1.02]
                  `}
                  style={{
                    transform: dragOverIndex === index && draggedItem?.index !== index
                      ? 'translateX(8px)'
                      : draggedItem?.index === index
                        ? 'scale(0.98)'
                        : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <JobCard
                    job={job}
                    isDarkMode={isDarkMode}
                    onDelete={handleDeleteJob}
                    onArchive={handleArchiveJob}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg shadow-lg">
            <div>Jobs: {jobs.length} | Filtered: {filteredJobs.length}</div>
            <div>Reordering: {isReordering.toString()}</div>
            {draggedItem && <div>Dragging: {draggedItem.job.name}</div>}
            {dragOverIndex !== null && <div>Over index: {dragOverIndex}</div>}
          </div>
        )}
      </div>
    </div>
  );
}