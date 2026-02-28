import { createServerClientInstance } from '@/utils/supabase'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createServerClientInstance()

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 border-t-[3px] border-t-emerald-500">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0F172A] rounded flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-lg leading-none">B</span>
            </div>
            <span className="text-xl font-bold text-[#0F172A] tracking-tight">Bitlazy</span>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/profile" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">
                  Dashboard
                </Link>
                <form action={logout}>
                  <button className="text-sm font-bold text-[#0F172A] hover:text-emerald-600 transition-colors">
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="bg-[#0F172A] hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-7xl font-black text-[#0F172A] tracking-tight leading-[1.1] mb-8">
            Collaborative Intelligence <br />
            <span className="text-emerald-600">Built for Teams</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            A clean, secure, and blazing fast collaborative platform.
            Design thinking and real-time reasoning synchronized.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/profile" className="w-full sm:w-auto bg-[#0F172A] hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95">
                Enter Workspace
              </Link>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto bg-[#0F172A] hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95">
                  Start Building Free
                </Link>
                <Link href="/login" className="w-full sm:w-auto bg-white border border-slate-200 hover:border-emerald-300 px-10 py-4 rounded-xl font-bold text-slate-600 transition-all hover:shadow-lg active:scale-95">
                  Live Demo
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Real-time Reasoning', desc: 'Sync your thoughts across the team with sub-millisecond latency.', icon: '⚡' },
            { title: 'Structured Data', desc: 'Auto-categorize claims, evidence, and synthesis in every session.', icon: '📊' },
            { title: 'Secure by Design', desc: 'Enterprise-grade security powered by Supabase and Row Level Security.', icon: '🔒' },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
          <span>© 2026 Bitlazy</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          <span>Deep Intelligence</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="#" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Privacy</Link>
          <Link href="#" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Terms</Link>
          <Link href="#" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">Twitter</Link>
        </div>
      </footer>
    </div>
  )
}
