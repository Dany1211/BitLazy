import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default async function ProfilePage() {
  const supabase = await createServerClientInstance()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: userMessages } = await supabase
    .from('messages')
    .select('session_id')
    .eq('user_id', user.id)

  const userSessionIds = userMessages
    ? Array.from(new Set(userMessages.map((m) => m.session_id)))
    : []

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .in('id', userSessionIds.length > 0 ? userSessionIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })

  const userInitial =
    profile?.name?.charAt(0) ||
    user.email?.charAt(0) ||
    '?'

  const memberSince = new Date(
    profile?.created_at || user.created_at
  ).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  })

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-indigo-100">
      {/* Subtle Top Accent */}
      <div className="h-1.5 w-full bg-indigo-600/10" />

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left Column - Minimal Identity */}
          <aside className="lg:col-span-4 space-y-10">
            <div className="space-y-6">
              <div className="h-24 w-24 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white uppercase tracking-tighter">
                    {userInitial}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {profile?.name || 'Explorer'}
                </h1>
                <p className="text-base font-medium text-slate-400">
                  {user.email}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                    {profile?.role || 'Contributor'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Joined</span>
                <span className="font-semibold text-slate-900">{memberSince}</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Protocol ID</span>
                <code className="block text-xs bg-slate-50 text-slate-400 p-3 rounded border border-slate-100 break-all font-mono leading-relaxed">
                  {user.id}
                </code>
              </div>

              {/* Enhanced Sign Out Button */}
              <form action={logout} className="pt-6">
                <button className="w-full text-sm font-black uppercase tracking-[0.15em] text-red-500 hover:text-red-700 hover:bg-red-50 py-3 px-4 rounded-xl border border-transparent hover:border-red-100 transition-all text-left flex items-center justify-between group">
                  <span>Sign Out</span>
                  <span className="transform transition-transform group-hover:translate-x-1">→</span>
                </button>
              </form>
            </div>
          </aside>

          {/* Right Column - Clean List */}
          <section className="lg:col-span-8 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-100 pb-6">
              <h2 className="text-base font-bold uppercase tracking-[0.2em] text-slate-400">
                Session History
              </h2>
              <span className="text-xs font-bold text-slate-300">
                {sessions?.length || 0} Total Entries
              </span>
            </div>

            {sessions && sessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between py-8 hover:px-6 rounded-2xl hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                  >
                    <div className="space-y-2 max-w-md">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {session.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1 leading-relaxed">
                        {session.problem_statement}
                      </p>
                    </div>

                    <div className="flex items-center gap-8 mt-6 sm:mt-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${
                          session.visibility === 'private' ? 'bg-rose-400' : 'bg-indigo-400'
                        }`} />
                        <span className="text-xs font-bold uppercase tracking-tighter text-slate-400">
                          {session.visibility}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-300">
                  No records found
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}