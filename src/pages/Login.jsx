import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true); // toggle between login/signup



  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
      else setError('Failed to sign in. Please try again.');
    }
  };

  const handleSignup = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email is already registered.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError('Failed to create account. Try again.');
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut(auth);
      navigate('/login');
    } catch {
      setError('Failed to sign out. Try again.');
    }
  };

  if (user) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="mb-4">You're already logged in.</p>
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isLogin ? 'Login' : 'Create Account'}</h1>
      <input
        type="email"
        placeholder="Email"
        className="border p-2 w-full mb-2"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full mb-4"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button
        onClick={isLogin ? handleLogin : handleSignup}
        className={`${
          isLogin ? 'bg-blue-600' : 'bg-green-600'
        } text-white px-4 py-2 rounded w-full`}
      >
        {isLogin ? 'Login' : 'Sign Up'}
      </button>
      <p className="mt-4 text-center text-sm text-gray-700">
        {isLogin ? (
          <>
            Don't have an account?{' '}
            <button
              onClick={() => {
                setError(null);
                setIsLogin(false);
              }}
              className="text-blue-600 underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => {
                setError(null);
                setIsLogin(true);
              }}
              className="text-blue-600 underline"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
