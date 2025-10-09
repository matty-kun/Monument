'use client';
import monumentLogo from '@/assets/monument-logo.png';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || 'Login failed.');
    } else {
      router.push('/admin/dashboard');
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-yellow-50 p-4 overflow-hidden">
      <div className="md:w-1/2 flex flex-col items-center justify-center text-center p-10">
        <Image
          src={monumentLogo}
          alt="Monument Logo"
          width={300}
          height={300}
          className="mb-4"
        />
  <h1 className="text-5xl font-bold text-monument-green">MONUMENT</h1>
        <p className="text-gray-600 mt-2">Notre Dame of Midsayap College Score Tracking System</p>
      </div>

      <div className="md:w-1/2 max-w-md w-full">
        <div className="card bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-monument-green">Admin Portal</h2>
            <p className="text-gray-600">Sign in to manage the system</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
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
                className="block text-sm font-medium text-gray-700"
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
                className="absolute right-3 top-8 md:top-8 flex items-center h-6 text-monument-green"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                <p>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-3"
            >
              {loading ? (
                <div className="spinner-sm mx-auto"></div>
              ) : (
                '🚀 Sign In'
              )}
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/register" className="font-medium text-monument-green hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
