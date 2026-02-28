'use client'

import { useState } from 'react'

export default function ShareSessionModal({
    inviteCode,
    visibility
}: {
    inviteCode: string,
    visibility: 'public' | 'private'
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-indigo-200/50 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Invite Team
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Invite Collaborators</h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${visibility === 'private' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {visibility === 'private' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 capitalize text-sm">{visibility} Session</h4>
                                    <p className="text-xs text-slate-500">
                                        {visibility === 'private' ? 'Share this exact code to invite collaborators.' : 'Anyone with this code can join the room.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Invite Code</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 truncate font-mono bg-slate-50/50 select-all">
                                        {inviteCode}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-slate-900/20'}`}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            )
            }
        </>
    )
}
