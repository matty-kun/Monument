'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import BouncingBallsLoader from '@/components/BouncingBallsLoader';

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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle(); // Use maybeSingle() to safely handle cases where a profile might not exist

      if (profileError) {
        setErrorMsg(profileError.message);
        setLoading(false);
      } else if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
        router.push('/admin/dashboard');
        router.refresh();
      } else if (profile) {
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
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-[#F5F5F7] dark:bg-black transition-colors p-4 overflow-hidden">
      <div className="md:w-1/2 flex flex-col items-center justify-center text-center p-10">
        <Image
          src="/monument-logo.png"
          alt="Monument Logo"
          width={300}
          height={300}
          className="mb-4 drop-shadow-md"
        />
        <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">MONUMENT</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Competition Score Tracking System</p>
      </div>

      <div className="md:w-1/2 max-w-md w-full">
        <div className="bg-white dark:bg-[#1c1c1e] p-8 shadow-sm rounded-[32px] border border-gray-200 dark:border-white/10 transition-colors">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Admin Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Sign in to manage the system</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-black border border-transparent dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-monument-green transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-black border border-transparent dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-monument-green transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl dark:bg-red-900/20 dark:text-red-400 dark:border-red-500">
                <p className="font-medium text-sm">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-lg font-bold py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}