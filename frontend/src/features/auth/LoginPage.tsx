
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, login } from "../../lib/api";
import { saveSession } from "../../lib/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const username = email.trim();

        if (!username) {
            setError("Please enter your username or email address.");
            return;
        }

        if (!password.trim()) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const session = await login(username, password);
            saveSession(session);

            const destinations: Record<string, string> = {
                AMBULANCE_DRIVER: "/driver",
                POLICE_DISPATCHER: "/police",
                HOSPITAL_STAFF: "/hospital",
                ADMIN: "/admin",
            };

            navigate(destinations[session.user.role] ?? "/", { replace: true });
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : "Unable to connect to the backend. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#101D32] px-5 py-8">
            <div className="w-full max-w-md">

                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.8"
                            className="h-9 w-9"
                        >
                            <path d="M3 7h11v11H3zM14 11h4l3 4v3h-7z" />
                            <circle cx="7.5" cy="18" r="2" />
                            <circle cx="18" cy="18" r="2" />
                            <path d="M8.5 10v5M6 12.5h5" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold tracking-wider text-white">
                        SERTOS
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Emergency Response Management System
                    </p>
                </div>

                {/* Login Card */}
                <div className="rounded-3xl border border-white/10 bg-[#1D2D44] p-7 shadow-2xl sm:p-9">
                    <div className="mb-7">
                        <h2 className="text-2xl font-semibold text-white">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Sign in to your authorized account
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-slate-200"
                            >
                                Username or Email
                            </label>

                            <div className="flex items-center rounded-xl border border-slate-600 bg-[#142238] px-4 transition focus-within:border-emerald-400">
                                <input
                                    id="email"
                                    type="text"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="                                    Enter your username or email address"
                                    disabled={loading}
                                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-slate-200"
                            >
                                Password
                            </label>

                            <div className="flex items-center rounded-xl border border-slate-600 bg-[#142238] px-4 transition focus-within:border-emerald-400">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    disabled={loading}
                                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="ml-2 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                            >
                                {error}
                            </div>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Signing in...
                                </>
                            ) : (
                                "LOGIN"
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="mt-7 text-center text-xs text-slate-500">
                    <span className="text-emerald-400">●</span> Secure access for
                    authorized personnel only
                </p>

                <p className="mt-2 text-center text-xs text-slate-600">
                    SERTOS Emergency Response Platform
                </p>
            </div>
        </main>
    );
}
