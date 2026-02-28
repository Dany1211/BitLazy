import Link from "next/link";

export default function Footer() {
    return (
        <footer className="py-16 border-t border-neutral-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div className="col-span-2 lg:col-span-1">
                    <Link href="/" className="text-lg font-bold tracking-tight text-neutral-900 block mb-6">
                        Collective Intelligence
                    </Link>
                    <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
                        A research-grade platform for structured collaborative learning and collective reasoning.
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-6">Platform</h4>
                    <ul className="space-y-4">
                        <li><Link href="#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Features</Link></li>
                        <li><Link href="#how-it-works" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">How It Works</Link></li>
                        <li><button className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-left">Intelligence Analytics</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-6">Company</h4>
                    <ul className="space-y-4">
                        <li><button className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-left">About</button></li>
                        <li><button className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-left">Research</button></li>
                        <li><button className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-left">Contact</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-6">Legal</h4>
                    <ul className="space-y-4">
                        <li><button className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-left">Privacy Policy</button></li>
                        <li><button className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-left">Terms of Service</button></li>
                    </ul>
                </div>
            </div>

            <div className="pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[12px] text-neutral-400">
                    © {new Date().getFullYear()} Collective Intelligence Platform. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    <button className="text-[12px] text-neutral-400 hover:text-neutral-900">Twitter</button>
                    <button className="text-[12px] text-neutral-400 hover:text-neutral-900">LinkedIn</button>
                    <button className="text-[12px] text-neutral-400 hover:text-neutral-900">GitHub</button>
                </div>
            </div>
        </footer>
    );
}
