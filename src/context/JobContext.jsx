import { createContext, useContext, useState, useEffect } from 'react'

const JobContext = createContext()

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    const storedJobs = JSON.parse(localStorage.getItem('jobs')) || []
    setJobs(storedJobs)
  }, [])

  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs))
  }, [jobs])

  const addJob = (job) => {
    setJobs((prev) => [...prev, job])
  }

  return (
    <JobContext.Provider value={{ jobs, addJob }}>
      {children}
    </JobContext.Provider>
  )
}

export const useJobs = () => useContext(JobContext)