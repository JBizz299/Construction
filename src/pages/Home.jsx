import { useState, useEffect } from "react";
import { useJobs } from "../context/JobContext";
import { Link } from "react-router-dom";
import JobCard from "../components/JobCard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function Home({ isDarkMode }) {
  const { jobs, loading, updateJobOrder, deleteJob } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderedJobs, setOrderedJobs] = useState([]);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    // Sort jobs by their order property, fallback to creation date
    const sortedJobs = [...jobs].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    setOrderedJobs(prevOrdered => {
      const newJobs = sortedJobs.filter(job => !prevOrdered.find(j => j.id === job.id));
      return [...prevOrdered.filter(job => sortedJobs.find(j => j.id === job.id)), ...newJobs];
    });
  }, [jobs, loading]);

  const filteredJobs = orderedJobs.filter((job) =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = async (result) => {
    if (!result.destination || isReordering) return;

    const newOrderedJobs = Array.from(orderedJobs);
    const [removed] = newOrderedJobs.splice(result.source.index, 1);
    newOrderedJobs.splice(result.destination.index, 0, removed);
    
    setIsReordering(true);
    setOrderedJobs(newOrderedJobs);

    try {
      // Save the new order to Firebase
      await updateJobOrder(newOrderedJobs.map(job => job.id));
    } catch (error) {
      console.error('Failed to save job order:', error);
      // Revert to previous order if save fails
      setOrderedJobs(orderedJobs);
    } finally {
      setIsReordering(false);
    }
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
      // You'll need to add an 'archived' field to jobs and update the query in JobContext
      console.log('Archive functionality not yet implemented for job:', job.id);
      alert('Archive functionality coming soon!');
    } catch (error) {
      console.error('Failed to archive job:', error);
      alert('Failed to archive job. Please try again.');
    }
  };

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
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
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
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Job</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] animate-pulse">
                <div className={`h-40 rounded-2xl mb-3 ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`} />
                <div className={`h-4 w-3/4 rounded ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`} />
                <div className={`h-4 w-1/2 rounded mt-2 ${isDarkMode ? "bg-gray-800/80" : "bg-gray-200"}`} />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className={`text-center py-16 px-4 rounded-2xl border ${
            isDarkMode ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-100"
          }`}>
            <svg
              className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className={`text-xl font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>No jobs found</p>
            <p className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {searchQuery ? "Try adjusting your search" : "Get started by creating a new job"}
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable 
              droppableId="jobs"
              direction="horizontal"
              isDropDisabled={false}
              isCombineEnabled={false}
              type="job-card"
            >
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {filteredJobs.map((job, index) => (
                    <Draggable 
                      key={String(job.id)}
                      draggableId={String(job.id)}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`transition-all cursor-grab active:cursor-grabbing ${
                            snapshot.isDragging ? "scale-105 rotate-2 shadow-xl z-50" : ""
                          }`}
                          style={provided.draggableProps.style}
                        >
                          <JobCard 
                            job={job} 
                            isDarkMode={isDarkMode} 
                            onDelete={handleDeleteJob}
                            onArchive={handleArchiveJob}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
