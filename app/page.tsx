import { createServerClientInstance } from '@/utils/supabase'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createServerClientInstance()
  const { data: { user } } = await supabase.auth.getUser()

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      label: 'Structured Chat',
      tag: 'Real-time',
      description: 'Every message has a type — claim, evidence, counterargument, or question. Structured thinking, not noise.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'AI Logic Grade',
      tag: 'Intelligent',
      description: 'Live scoring of each participant\'s reasoning quality. Weak arguments get caught. Strong ones surface.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: 'Auto Synthesis',
      tag: 'Generative',
      description: 'One click generates a full session brief — key claims, evidence, open questions, and unresolved debates.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      label: 'Shared Whiteboard',
      tag: 'Visual',
      description: 'A shared canvas with sticky notes, drawing tools, image uploads, zoom, pan, and background styles.',
    },
  ]

  const steps = [
    {
      n: '01',
      title: 'Create a session',
      body: 'Define a problem statement. Set it public or private. You\'re live in under 10 seconds.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      n: '02',
      title: 'Collaborate in real time',
      body: 'Your team posts claims, evidence, and rebuttals. The whiteboard and chat update live for everyone.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      n: '03',
      title: 'Get AI insights',
      body: 'Logic grades update as conversation unfolds. Generate a synthesis when you\'re ready to extract clarity.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0D0D0D]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        :root { --accent: #4F46E5; --accent-light: #EEF2FF; --accent-mid: #818CF8; }
        .accent { color: #4F46E5; }
        .accent-bg { background-color: #4F46E5; }
        ::selection { background: #EEF2FF; }
        .btn-dark { background: #0D0D0D; color: white; transition: all 0.18s ease; }
        .btn-dark:hover { background: #4F46E5; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(79,70,229,0.3); }
        .feature-card { transition: all 0.22s ease; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(79,70,229,0.08); border-color: #c7d2fe; }
        .step-card { transition: all 0.2s ease; }
        .step-card:hover { box-shadow: 0 12px 30px rgba(79,70,229,0.1); transform: translateY(-2px); }
        .gradient-text { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              <span className="text-white font-black text-sm leading-none">B</span>
            </div>
            <span className="text-[15px] font-black tracking-tight text-[#0D0D0D]">Bitlazy</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">Features</a>
            <a href="#how" className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">How it works</a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                <form action={logout}>
                  <button className="text-sm font-medium text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors">Logout</button>
                </form>
                <Link href="/profile" className="btn-dark px-4 py-2 rounded-lg text-sm font-semibold">Open App →</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">Log in</Link>
                <Link href="/register" className="btn-dark px-4 py-2 rounded-lg text-sm font-semibold">Sign up free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero — split layout */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-9" style={{ background: '#EEF2FF', borderColor: '#c7d2fe', color: '#4338CA' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                AI-powered collaborative reasoning
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-black tracking-[-0.04em] leading-[0.95] mb-6 text-[#0D0D0D]">
                Where great teams<br />
                <span className="gradient-text">think out loud.</span>
              </h1>

              <p className="text-[17px] text-gray-500 leading-relaxed mb-9 font-[450] max-w-md">
                Real-time sessions with structured reasoning, live AI grading,
                auto-generated synthesis, and a shared whiteboard.
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                {user ? (
                  <Link href="/profile" className="btn-dark inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold">
                    Enter Workspace
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="btn-dark inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold">
                      Get started free
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                    <Link href="/login" className="inline-flex items-center px-6 py-3 rounded-xl text-[15px] font-semibold border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all bg-white">
                      Sign in
                    </Link>
                  </>
                )}
              </div>

              {/* Stat row */}
              <div className="flex gap-8 pt-8 border-t border-gray-100">
                {[
                  { val: 'Live', sub: 'Sync' },
                  { val: 'AI', sub: 'Grading' },
                  { val: '4+', sub: 'Tools' },
                  { val: 'RLS', sub: 'Security' },
                ].map(s => (
                  <div key={s.sub}>
                    <p className="text-xl font-black text-[#0D0D0D]">{s.val}</p>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: discussion UI mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-[420px] bg-white border border-gray-100 rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden">
                {/* Mockup header */}
                <div className="bg-[#0D0D0D] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#4F46E5' }}></div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Product Strategy — Live</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    <div className="w-2 h-2 rounded-full" style={{ background: '#4F46E5' }}></div>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-5 space-y-4 bg-[#FAFAFA]">
                  {/* Claim message */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0 mt-0.5">A</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-[#0D0D0D]">Alex</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: '#EEF2FF', color: '#4F46E5' }}>Claim</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">The onboarding drop-off is primarily caused by the 3-step verification flow.</p>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-[10px] shrink-0 mt-0.5">S</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-[#0D0D0D]">Sara</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: '#ECFDF5', color: '#059669' }}>Evidence</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">Analytics shows 68% of users leave at step 2. Heatmaps confirm confusion around the email confirmation.</p>
                    </div>
                  </div>

                  {/* Counter */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-black text-[10px] shrink-0 mt-0.5">M</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-[#0D0D0D]">Mike</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: '#FFF1F2', color: '#E11D48' }}>Counter</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">Could also be UX copy — the CTA says 'Verify' but users don't know what they're verifying.</p>
                    </div>
                  </div>

                  {/* AI insight strip */}
                  <div className="rounded-xl border px-4 py-3 flex items-start gap-3" style={{ background: '#F5F3FF', borderColor: '#e0e7ff' }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#4F46E5' }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#4F46E5' }}>AI Logic Grade</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Sara presents strong evidence. Mike raises a valid alternative. Thread logic score: <strong className="text-indigo-600">82 / 100</strong></p>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-400">Add your claim, evidence or question...</div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#4F46E5' }}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tech stack strip */}
      <div className="border-y border-gray-100 bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-6 sm:gap-0 justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 shrink-0">Powered by</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-6 md:gap-10 items-center">
            {[
              { name: 'Supabase', color: '#3ECF8E' },
              { name: 'Next.js', color: '#000000' },
              { name: 'OpenAI', color: '#10A37F' },
              { name: 'Recharts', color: '#4F46E5' },
              { name: 'Tailwind', color: '#06B6D4' },
            ].map(b => (
              <div key={b.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: b.color, opacity: 0.6 }}></div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest select-none">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: '#4F46E5' }}>Core Features</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-[#0D0D0D] leading-tight">
                Everything your<br />team needs.
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xs font-[450] leading-relaxed sm:text-right">
              Intentionally lean. Every feature earns its place by driving better decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div key={i} className="feature-card bg-white border border-gray-100 rounded-2xl p-7">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: '#F8FAFF', color: '#6366F1', border: '1px solid #e0e7ff' }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-base font-black text-[#0D0D0D] mb-2.5">{f.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-[450]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — redesigned */}
      <section id="how" className="py-28 px-6 bg-[#0D0D0D]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: '#818CF8' }}>How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] text-white leading-tight">
              From zero to insight<br />in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="step-card bg-white/5 border border-white/10 rounded-2xl p-7 relative overflow-hidden group">
                {/* Step number watermark */}
                <div className="absolute top-5 right-6 text-6xl font-black leading-none select-none pointer-events-none" style={{ color: 'rgba(255,255,255,0.04)' }}>{s.n}</div>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: 'rgba(79,70,229,0.25)', color: '#818CF8' }}>
                  {s.icon}
                </div>

                {/* Step tag */}
                <span className="text-[10px] font-black uppercase tracking-widest mb-4 block" style={{ color: '#6366F1' }}>{s.n}</span>

                <h3 className="text-base font-black text-white mb-3">{s.title}</h3>
                <p className="text-sm leading-relaxed font-[440]" style={{ color: '#94a3b8' }}>{s.body}</p>

                {/* Connector line (only on first two cards) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-[52px] -right-3 w-6 h-px z-10" style={{ background: 'rgba(99,102,241,0.4)' }}></div>
                )}
              </div>
            ))}
          </div>

          {/* CTA inside dark section */}
          <div className="mt-14 flex flex-col sm:flex-row items-center gap-4">
            {user ? (
              <Link href="/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#0D0D0D] transition-all hover:opacity-90" style={{ background: '#818CF8' }}>
                Open workspace →
              </Link>
            ) : (
              <>
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#0D0D0D] transition-all hover:opacity-90" style={{ background: '#818CF8' }}>
                  Start for free →
                </Link>
                <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-3">Already have an account?</Link>
              </>
            )}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-[#0D0D0D] py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                  <span className="text-white font-black text-[11px]">B</span>
                </div>
                <span className="text-sm font-black text-white">Bitlazy</span>
              </div>
              <p className="text-xs text-gray-500 font-medium max-w-[200px] leading-relaxed">AI-powered collaborative reasoning for high-stakes teams.</p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <a href="#features" className="text-xs font-semibold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Features</a>
              <a href="#how" className="text-xs font-semibold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">How it works</a>
              <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Login</Link>
              <Link href="/register" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 uppercase tracking-widest transition-all">Sign up</Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-gray-600 font-medium">© 2026 Bitlazy. All rights reserved.</span>
            <span className="text-[11px] text-gray-600 font-medium">Built with <span style={{ color: '#4F46E5' }}>♥</span> for better decisions.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
