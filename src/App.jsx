import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import JobPage from './pages/JobPage';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

function App() {
  const { loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
     
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/jobs/:jobId" element={<JobPage />} />
      </Routes>
    </Layout>
  );
}

export default App;