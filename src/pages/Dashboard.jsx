import JobBoard from '../components/JobBoard' 

export default function Dashboard() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Contractor Coordination</h1>
      <JobBoard />
    </div>
  );
}