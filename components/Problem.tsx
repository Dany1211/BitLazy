import { Brain, MessageSquare, ShieldAlert } from "lucide-react";

const problems = [
    {
        title: "Rewards over Reasoning",
        description: "Modern education systems prioritize the final answer, discouraging the messy, essential process of collaborative inquiry.",
        icon: Brain,
    },
    {
        title: "Fragmented Discussions",
        description: "Digital collaboration often lacks the architectural structure needed to turn individual insights into collective knowledge.",
        icon: MessageSquare,
    },
    {
        title: "Passive AI Usage",
        description: "Conventional AI tools promote shallow 'copy-paste' thinking rather than challenging users to expand their reasoning.",
        icon: ShieldAlert,
    },
];

export default function Problem() {
    return (
        <section id="about" className="py-20 border-t border-neutral-100">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                    The Intelligence Bottleneck
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                    We are building the infrastructure for a more thoughtful, structured, and intelligent way to collaborate.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {problems.map((item, index) => (
                    <div
                        key={index}
                        className="group p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                        <p className="text-neutral-600 leading-relaxed text-sm">
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
