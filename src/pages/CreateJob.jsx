import { useState } from "react";
import { useJobs } from "../context/JobContext";
import { useNavigate } from "react-router-dom";

export default function CreateJob({ isDarkMode }) {
  const navigate = useNavigate();
  const { addJob } = useJobs();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobData, setJobData] = useState({
    name: "",
    description: "",
    budget: "",
    timeline: "",
    status: "pending"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const jobId = await addJob(jobData);
      navigate(`/job/${jobId}`);
    } catch (err) {
      setError("Failed to create job. Please try again.");
      console.error("Create job error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        Create New Job
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
            Job Name *
          </label>
          <input
            type="text"
            required
            value={jobData.name}
            onChange={(e) => setJobData({ ...jobData, name: e.target.value })}
            className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none
              transition-all duration-200 focus:ring-2 focus:ring-blue-500/20
              ${isDarkMode
                ? "bg-gray-700/50 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
              }`}
          />
        </div>

        <div>
          <label className={`block mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
            Description
          </label>
          <textarea
            value={jobData.description}
            onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
            rows="3"
            className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none
              transition-all duration-200 focus:ring-2 focus:ring-blue-500/20
              ${isDarkMode
                ? "bg-gray-700/50 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
              }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              Budget
            </label>
            <input
              type="number"
              value={jobData.budget}
              onChange={(e) => setJobData({ ...jobData, budget: e.target.value })}
              placeholder="Enter amount"
              className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none
                transition-all duration-200 focus:ring-2 focus:ring-blue-500/20
                ${isDarkMode
                  ? "bg-gray-700/50 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
                }`}
            />
          </div>

          <div>
            <label className={`block mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              Timeline (days)
            </label>
            <input
              type="number"
              value={jobData.timeline}
              onChange={(e) => setJobData({ ...jobData, timeline: e.target.value })}
              placeholder="Enter days"
              className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none
                transition-all duration-200 focus:ring-2 focus:ring-blue-500/20
                ${isDarkMode
                  ? "bg-gray-700/50 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
                }`}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`px-4 py-2 rounded-xl text-sm transition-all
              ${isDarkMode
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all text-sm
              shadow-sm hover:shadow-md active:scale-95 transform
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
              ${isDarkMode
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
          >
            {loading ? "Creating..." : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
