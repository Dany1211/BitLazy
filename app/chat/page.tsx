import AnimatedBackground from "@/components/AnimatedBackground";

export default function ChatPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <AnimatedBackground />

            <div className="w-full max-w-3xl h-[80vh] bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col border border-white/20">

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div className="flex flex-col gap-2">
                        <div className="bg-white/20 p-3 rounded-2xl rounded-bl-none w-fit text-white backdrop-blur-md border border-white/10">
                            Hello 👋
                        </div>
                        <span className="text-[10px] text-white/50 ml-1">Just now</span>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        <div className="bg-indigo-500/40 p-3 rounded-2xl rounded-br-none w-fit text-white backdrop-blur-md border border-white/10">
                            How can I help you today?
                        </div>
                        <span className="text-[10px] text-white/50 mr-1">Just now</span>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 p-4 rounded-xl bg-white/10 backdrop-blur-md outline-none text-white placeholder-white/40 border border-white/10 focus:border-white/30 transition-all"
                    />
                    <button className="px-6 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-medium shadow-lg hover:shadow-indigo-500/20 transition-all">
                        Send
                    </button>
                </div>

            </div>
        </div>
    );
}
