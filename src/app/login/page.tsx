'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || 'Login failed.');
      setLoading(false);
      return;
    }

    // After successful login, check the user's role
    if (data.user) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        setErrorMsg(profileError.message);
        setLoading(false);
      } else if (profiles.role === 'admin') {
        router.push('/admin/dashboard');
        router.refresh();
      } else if (profiles) {
        setErrorMsg('You are not authorized to access this page.');
        setLoading(false);
        // router.push('/not-authorized'); // Optional: redirect to a 'not authorized' page
      } else {
        setErrorMsg('Profile not found.');
        setLoading(false);
      }
    } else {
      setErrorMsg('Login failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 overflow-hidden">
      <div className="md:w-1/2 flex flex-col items-center justify-center text-center p-10">
        <Image
          src="/monument-logo.png"
          alt="Monument Logo"
          width={300}
          height={300}
          className="mb-4"
        />
        <h1 className="text-5xl font-bold text-monument-green dark:text-green-400">MONUMENT</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300">Notre Dame of Midsayap College Score Tracking System</p>
      </div>

      <div className="md:w-1/2 max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 backdrop-blur-sm p-8 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-monument-green dark:text-green-400">Admin Portal</h2>
            <p className="text-gray-600 dark:text-gray-300">Sign in to manage the system</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input mt-1 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 md:top-8 flex items-center h-6 text-monument-green dark:text-green-400"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg dark:bg-red-900/50 dark:text-red-300 dark:border-red-400">
                <p>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-3 text-white"
            >
              {loading ? (
                <div className="spinner-sm mx-auto"></div>
              ) : (
                '🚀 Sign In'
              )}
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don&apos;t have an account?{' '}
              <a href="/register" className="font-medium text-monument-green dark:text-green-400 hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}