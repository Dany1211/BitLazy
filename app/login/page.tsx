import { login, signup } from '@/app/actions/auth'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedSearchParams = await searchParams
    const message = resolvedSearchParams.message

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
            <form
                className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
            >
                <h1 className="text-2xl font-semibold text-center mb-6">Welcome</h1>
                {message && (
                    <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
                        {message}
                    </p>
                )}
                <label className="text-md" htmlFor="name">
                    Name (For Signup)
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    name="name"
                    placeholder="Your full name"
                />
                <label className="text-md" htmlFor="email">
                    Email
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    name="email"
                    placeholder="you@example.com"
                    required
                />
                <label className="text-md" htmlFor="password">
                    Password
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />
                <button
                    formAction={login}
                    className="bg-green-700 rounded-md px-4 py-2 text-white font-medium mb-2"
                >
                    Sign In
                </button>
                <button
                    formAction={signup}
                    className="border border-foreground/20 rounded-md px-4 py-2 text-foreground font-medium mb-2"
                >
                    Sign Up
                </button>
            </form>
        </div>
    )
}
