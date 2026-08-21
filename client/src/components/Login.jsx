import React, { useState } from 'react';
import { LogIn, Sparkles, UserCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const demoUsers = [
    { name: 'Kirtan', email: 'kirtan@demo.com' },
    { name: 'Alex', email: 'alex@demo.com' }
  ];

  const handleLogin = async (e, demoUser = null) => {
    if (e) e.preventDefault();
    const loginEmail = demoUser ? demoUser.email : email;
    const loginName = demoUser ? demoUser.name : (isRegistering ? name : '');

    if (!loginEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail, name: loginName })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const userData = await response.json();
      onLogin(userData);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the authentication server. Verify the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-neutral-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="bg-neutral-900 p-2 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">DocFlow</span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-neutral-900">
          {isRegistering ? 'Create your account' : 'Sign in to DocFlow'}
        </h2>
        <p className="mt-1 text-center text-sm text-neutral-500">
          {isRegistering ? 'Enter details to sign up instantly' : 'Use your email or a demo user account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-neutral-200/80 py-8 px-6 shadow-sm rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => handleLogin(e)}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-neutral-850 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-sm transition-colors bg-[#fbfbfb]"
              />
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Kirtan Joshi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-neutral-850 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-sm transition-colors bg-[#fbfbfb]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-850 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? 'Processing...' : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{isRegistering ? 'Sign Up' : 'Continue with Email'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline cursor-pointer"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-neutral-200/80"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider text-[10px]">Or sandbox demo users</span>
            </div>
          </div>

          {/* Quick Select Demo Users */}
          <div className="space-y-2">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                onClick={(e) => handleLogin(e, user)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer transition-all text-left disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-white border border-neutral-200 p-1.5 rounded text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-colors">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-850 block">{user.name}</span>
                    <span className="text-[10px] text-neutral-500">{user.email}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-neutral-400 group-hover:text-neutral-800 transition-colors">Quick Enter →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
