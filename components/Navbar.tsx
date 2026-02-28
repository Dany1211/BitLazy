"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/70 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold tracking-tight text-neutral-900">
                        Collective Intelligence
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                        How It Works
                    </Link>
                    <Link href="#about" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                        About
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                        Login
                    </button>
                    <button className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-all shadow-sm">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
