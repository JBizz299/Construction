function JobCell({ value, onChange, jobs }) {
  return (
    <td className="p-1 border-r text-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm p-1 border rounded"
      >
        <option value="">--</option>
        {jobs.map(job => (
          <option key={job} value={job}>{job}</option>
        ))}
      </select>
    </td>
  )
}

export default JobCell