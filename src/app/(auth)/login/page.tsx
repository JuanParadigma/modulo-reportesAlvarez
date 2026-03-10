'use client'
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage (){
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e:React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = e.currentTarget;
        const username = (form.elements.namedItem('username') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        const result = await signIn('credentials', {
            username,
            password,
            redirect: false,
        })

        console.log(result)

        if (result?.error) {
            setError('Usuario o contraseña incorrectos');
            setLoading(false)
            return
        }

        router.push('/dashboard')
        router.refresh();
    }

    return (

        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

            {/* Card */}
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">SIGE Reportes</h1>
                    <p className="text-slate-400 mt-1 text-sm">Ingresá con tu usuario del sistema</p>
                </div>

                {/* Form card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Username */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                                Usuario
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                autoFocus
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                           text-white placeholder-slate-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                                placeholder="Tu usuario del SIGE"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                           text-white placeholder-slate-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50
                         text-white font-semibold rounded-xl px-4 py-3 text-sm
                         transition-all duration-200 flex items-center justify-center gap-2
                         disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z" />
                                    </svg>
                                    Ingresando...
                                </>
                            ) : (
                                'Ingresar'
                            )}
                        </button>

                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    Paradigma del Sur · Sistema interno
                </p>
            </div>
        </div>
    );
}