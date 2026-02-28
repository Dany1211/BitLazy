const steps = [
    {
        title: "Structured Contributions",
        description: "Every input is mapped to a reasoning graph, making the context of every idea visible to all.",
    },
    {
        title: "AI Moderation",
        description: "Our facilitator ensures discussions stay on track by asking Socratic questions instead of giving answers.",
    },
    {
        title: "Quality Scoring",
        description: "Contributions are evaluated based on depth, reasoning, and their impact on the collective outcome.",
    },
    {
        title: "Intelligence Analytics",
        description: "Gain deep insights into how your group's intelligence evolved and converged over time.",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 border-t border-neutral-100">
            <div className="max-w-3xl mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl mb-4">
                    How Collective Intelligence Functions
                </h2>
                <p className="text-lg text-neutral-600">
                    A systematic approach to collaborative reasoning, facilitated by intelligent infrastructure.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {steps.map((step, index) => (
                    <div key={index} className="relative">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                                {index + 1}
                            </span>
                            <div className="h-px bg-neutral-200 flex-1 hidden lg:block" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">{step.title}</h3>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
