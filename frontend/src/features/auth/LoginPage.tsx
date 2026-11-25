import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Ambulance, Eye, EyeOff, Radio, ShieldCheck } from "lucide-react";
import { ApiError, login, MOCK_MODE } from "../../lib/api";
import { saveSession } from "../../lib/auth";
import { playSound, unlockAudio } from "../../lib/sound";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../../mocks/fixtures";

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
            playSound("error");
            return;
        }

        if (!password.trim()) {
            setError("Please enter your password.");
            playSound("error");
            return;
        }

        void unlockAudio();
        playSound("tick");
        setLoading(true);

        try {
            const session = await login(username, password);
            saveSession(session);
            playSound("success");

            const destinations: Record<string, string> = {
                AMBULANCE_DRIVER: "/driver",
                POLICE_DISPATCHER: "/police",
                HOSPITAL_STAFF: "/hospital",
                ADMIN: "/admin",
            };

            navigate(destinations[session.user.role] ?? "/", { replace: true });
        } catch (reason) {
            setError(
                reason instanceof ApiError
                    ? reason.message
                    : "Unable to connect to the backend. Please try again.",
            );
            playSound("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-ambient login-ambient-emerald" />
            <div className="login-ambient login-ambient-teal" />
            <div className="login-ambient login-ambient-amber" />

            <div className="login-layout">
                <section className="login-intro">
                    <div className="login-brand-mark">
                        <Ambulance size={27} strokeWidth={1.7} />
                    </div>
                    <div className="login-kicker">
                        <span className="live-pulse" />
                        EMERGENCY RESPONSE NETWORK
                    </div>
                    <h1>SERTOS</h1>
                    <p className="login-tagline">
                        One coordinated response.
                        <br />
                        Every second accounted for.
                    </p>
                    <div className="login-telemetry glass-surface">
                        <div>
                            <span className="telemetry-label">NETWORK STATUS</span>
                            <strong><Radio size={14} /> {MOCK_MODE ? "DEMO SIMULATION" : "SECURE ACCESS"}</strong>
                        </div>
                        <span className={`telemetry-pulse ${MOCK_MODE ? "telemetry-pulse-demo" : ""}`} />
                    </div>
                </section>

                <section className="login-card glass-surface">
                    <div className="login-card-header">
                        <div>
                            <p className="login-overline">COMMAND ACCESS</p>
                            <h2>Sign in</h2>
                            <p className="login-subtitle">Use your authorized SERTOS account.</p>
                        </div>
                        <div className="login-secure-icon" aria-hidden="true">
                            <ShieldCheck size={23} />
                        </div>
                    </div>

                    {MOCK_MODE && (
                        <div className="demo-credentials">
                            <div className="demo-credentials-title">
                                <span className="live-pulse" />
                                DEMO MODE ENABLED
                            </div>
                            <p>Select a role to fill the demo sign-in fields.</p>
                            <div className="demo-role-grid">
                                {DEMO_ACCOUNTS.map((account) => (
                                    <button
                                        key={account.username}
                                        type="button"
                                        className="demo-role-button"
                                        onClick={() => {
                                            setEmail(account.username);
                                            setPassword(DEMO_PASSWORD);
                                            setError("");
                                            playSound("tick");
                                        }}
                                    >
                                        <span>{account.label}</span>
                                        <small>{account.username}</small>
                                    </button>
                                ))}
                            </div>
                            <p className="demo-password-hint">
                                Demo password: <code>{DEMO_PASSWORD}</code>
                            </p>
                        </div>
                    )}

                    {!MOCK_MODE && (
                        <div className="live-api-notice">
                            LIVE API MODE <span>·</span> Credentials are checked by the configured backend.
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form">
                        <div>
                            <label htmlFor="username">Username or email</label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter your username or email"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password">Password</label>
                            <div className="login-password-field">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter your password"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-visibility-button"
                                    onClick={() => {
                                        setShowPassword((visible) => !visible);
                                        playSound("tick");
                                    }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div role="alert" className="login-error">
                                <strong>{error.includes("HTTP 502") || error.includes("HTTP 503") ? "API SERVICE UNAVAILABLE" : "SIGN-IN FAILED"}</strong>
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="login-spinner" />
                                    AUTHENTICATING…
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    ENTER COMMAND
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-card-footer">
                        <span>ROLE-BASED ACCESS CONTROL</span>
                        <span>{MOCK_MODE ? "LOCAL DEMO DATA" : "BACKEND CONNECTED ON SIGN-IN"}</span>
                    </div>
                </section>
            </div>
            <p className="login-footer">SERTOS · SMART EMERGENCY RESPONSE THROUGH OPTIMAL SELECTION</p>
        </main>
    );
}
