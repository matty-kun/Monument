'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/admin/dashboard');
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-yellow-50 p-4 overflow-hidden">
      <div className="md:w-1/2 flex flex-col items-center justify-center text-center p-10">
        <Image
          src="/monument-logo.png"
          alt="SIDLAK Logo"
          width={150}
          height={150}
          className="mb-4"
        />
        <h1 className="text-5xl font-bold text-ndmc-green">SIDLAK 2025</h1>
        <p className="text-gray-600 mt-2">Notre Dame of Midsayap College Intramurals</p>
      </div>

      <div className="md:w-1/2 max-w-md w-full">
        <div className="card bg-white/80 backdrop-blur-sm p-8 shadow-2xl rounded-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-ndmc-green">Admin Portal</h2>
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
        </div>
      </div>
    </div>
  );
}
