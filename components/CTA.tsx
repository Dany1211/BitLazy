import { ArrowRight } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-24">
            <div className="rounded-3xl bg-neutral-900 px-6 py-20 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                        Shift From Individual Answers to Collective Intelligence.
                    </h2>
                    <p className="text-lg text-neutral-400 mb-10 leading-relaxed">
                        Join the platform where human reasoning meets AI facilitation. Start your first structured collaborative session today.
                    </p>
                    <button className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-neutral-900 hover:bg-neutral-100 transition-all shadow-lg group">
                        Launch a Collaborative Session
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            </div>
        </section>
    );
}
