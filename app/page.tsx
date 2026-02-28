import { createServerClientInstance } from '@/utils/supabase'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createServerClientInstance()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pt-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto w-full">

        {/* Navigation Bar */}
        <nav className="flex items-center justify-between py-4 border-b border-slate-200 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">B</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Bitlazy</span>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  {user.email}
                </Link>
                <form action={logout}>
                  <button className="text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors shadow-sm">
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Welcome to Bitlazy
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            {user
              ? "You are successfully authenticated and ready to go. You can start exploring your dashboard below."
              : "A clean, secure, and blazing fast authentication template built with Next.js and Supabase."}
          </p>

          {!user ? (
            <div className="flex justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 text-base font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
              >
                Log In
              </Link>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Link
                href="/profile"
                className="px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
