import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
    return (
        <section className="py-20 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
                        Measure How Intelligence Emerges From Collaboration.
                    </h1>
                    <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-xl">
                        A structured collaborative learning platform where AI facilitates reasoning instead of giving answers.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <button className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-4 text-base font-semibold text-white hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl group">
                            Start a Session
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-8 py-4 text-base font-semibold text-neutral-900 hover:bg-neutral-50 transition-all shadow-sm">
                            <Play className="mr-2 h-4 w-4 fill-current" />
                            View Demo
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                            </div>
                            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Reasoning Graph</div>
                        </div>

                        {/* Mock Graph UI */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                                    <div className="h-4 bg-neutral-100 rounded w-1/2" />
                                </div>
                            </div>

                            <div className="pl-12 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-neutral-300" />
                                <div className="h-px bg-neutral-200 flex-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                                    <div className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Hypothesis A</div>
                                    <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
                                    <div className="h-3 bg-neutral-200 rounded w-2/3" />
                                </div>
                                <div className="p-4 rounded-xl border border-neutral-900/10 bg-neutral-900/5">
                                    <div className="text-[10px] font-bold text-neutral-900/40 uppercase mb-2">Hypothesis B</div>
                                    <div className="h-3 bg-neutral-900/10 rounded w-full mb-2" />
                                    <div className="h-3 bg-neutral-900/10 rounded w-1/2" />
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="px-4 py-2 rounded-full border border-neutral-200 bg-white text-[10px] font-bold text-neutral-500 shadow-sm uppercase tracking-wider">
                                    Convergence Analysis in Progress...
                                </div>
                            </div>
                        </div>

                        {/* Subtle Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-neutral-500/5 pointer-events-none" />
                    </div>

                    {/* Floating Element */}
                    <div className="absolute -bottom-6 -right-6 p-4 rounded-xl border border-neutral-200 bg-white shadow-xl hidden md:block animate-bounce-subtle">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-neutral-900">Intelligence Delta</div>
                                <div className="text-[10px] text-neutral-500">+24.8% Reasoning Efficiency</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
