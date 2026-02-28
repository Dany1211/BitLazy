import {
    Network,
    Cpu,
    BarChart3,
    LayoutDashboard,
    Scale,
    FileSearch
} from "lucide-react";

const features = [
    {
        title: "Structured Reasoning Graph",
        description: "Visualize the interconnectedness of claims, evidence, and rebuttals in real-time.",
        icon: Network,
    },
    {
        title: "AI Socratic Facilitator",
        description: "An AI moderator that identifies logical fallacies and prompts for deeper evidence.",
        icon: Cpu,
    },
    {
        title: "Explainable Scoring",
        description: "Transparent metrics evaluating the intellectual contribution of every group member.",
        icon: Scale,
    },
    {
        title: "Live Intelligence Dashboard",
        description: "Monitor the convergence and quality of your group's reasoning as it happens.",
        icon: LayoutDashboard,
    },
    {
        title: "Bias-Aware Evaluation",
        description: "Heuristics designed to detect and mitigate echo chambers and confirmation bias.",
        icon: BarChart3,
    },
    {
        title: "Knowledge Construction Reports",
        description: "Detailed summaries of how the final consensus was reached, including all dead ends.",
        icon: FileSearch,
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 border-t border-neutral-100">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl mb-4">
                    Built for High-Stakes Collaboration
                </h2>
                <p className="text-lg text-neutral-600">
                    Powerful tools designed to elevate the baseline of human collaborative reasoning.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="p-8 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md transition-all duration-300"
                    >
                        <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-900 mb-6 font-semibold border border-neutral-100 uppercase text-[10px] tracking-wider">
                            <feature.icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-3">{feature.title}</h3>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
