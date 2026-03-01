'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SessionTabs({ sessionId }: { sessionId: string }) {
    const pathname = usePathname()

    const tabs = [
        { name: 'Mission Board', href: `/session/${sessionId}`, active: pathname === `/session/${sessionId}` },
        { name: 'Analytics', href: `/session/${sessionId}/analytics`, active: pathname === `/session/${sessionId}/analytics` },
    ]

    return (
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            {tabs.map((tab) => (
                <Link
                    key={tab.name}
                    href={tab.href}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab.active
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    {tab.name}
                </Link>
            ))}
        </div>
    )
}
