import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Shield,
    Languages,
    FileText,
    Building2,
    History,
    ArrowRight,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { cn } from "../lib/utils";
import { api } from "../lib/procurement";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../hooks/use-language";

const REMEMBER_KEY = "kaldi-remembered-email";

const FEATURES = [
    { key: "login.brand.feature1", icon: FileText },
    { key: "login.brand.feature2", icon: Building2 },
    { key: "login.brand.feature3", icon: History },
];

function KaldiLogo({ className }) {
    return (
        <img
            src="/images/kaldis-logo.jpg"
            alt="Kaldi's Coffee"
            className={cn("rounded-full object-cover shrink-0 ring-1 ring-black/5", className)}
        />
    );
}

const STEAM_WISPS = [
    { x: 78, delay: "0s" },
    { x: 92, delay: "0.6s" },
    { x: 106, delay: "1.2s" },
    { x: 120, delay: "0.3s" },
    { x: 134, delay: "0.9s" },
];

function SteamingCup({ className }) {
    return (
        <svg viewBox="0 0 212 220" className={className} aria-hidden="true">
            {/* Rising steam */}
            {STEAM_WISPS.map((w, i) => (
                <path
                    key={i}
                    d={`M ${w.x} 78 C ${w.x - 8} 62, ${w.x + 8} 46, ${w.x} 30`}
                    fill="none"
                    stroke="#F0DFC0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-procurement-steam"
                    style={{ animationDelay: w.delay }}
                />
            ))}

            {/* Saucer */}
            <ellipse cx="106" cy="192" rx="88" ry="16" fill="#FAF3E7" />
            <ellipse cx="106" cy="192" rx="88" ry="16" fill="none" stroke="#C7A374" strokeWidth="1.5" opacity="0.5" />

            {/* Cup handle */}
            <path
                d="M 172 108 C 200 108, 200 152, 172 152"
                fill="none"
                stroke="#FAF3E7"
                strokeWidth="10"
                strokeLinecap="round"
            />
            <path
                d="M 172 108 C 200 108, 200 152, 172 152"
                fill="none"
                stroke="#C7A374"
                strokeWidth="1.5"
                opacity="0.5"
            />

            {/* Cup body */}
            <path
                d="M 30 82 L 182 82 L 168 172 C 166 180, 150 186, 106 186 C 62 186, 46 180, 44 172 Z"
                fill="#FAF3E7"
            />
            <path
                d="M 30 82 L 182 82 L 168 172 C 166 180, 150 186, 106 186 C 62 186, 46 180, 44 172 Z"
                fill="none"
                stroke="#8C6239"
                strokeWidth="2"
                opacity="0.35"
            />

            {/* Coffee surface */}
            <ellipse cx="106" cy="83" rx="76" ry="10" fill="#3A2618" />
            <ellipse cx="106" cy="81" rx="76" ry="9" fill="#4A311F" />

            {/* Logo medallion on the cup front */}
            <clipPath id="cupLogoClip">
                <circle cx="106" cy="132" r="38" />
            </clipPath>
            <circle cx="106" cy="132" r="40" fill="#FAF3E7" />
            <image
                href="/images/kaldis-logo-circle.png"
                x="68"
                y="94"
                width="76"
                height="76"
                clipPath="url(#cupLogoClip)"
                preserveAspectRatio="xMidYMid slice"
            />
            <circle cx="106" cy="132" r="38" fill="none" stroke="#5C3D26" strokeWidth="1.5" opacity="0.4" />
        </svg>
    );
}

export function LoginView({ onSuccess }) {
    const [email, setEmail] = useState(() => {
        if (typeof localStorage === "undefined") return "";
        return localStorage.getItem(REMEMBER_KEY) || "";
    });
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(() => {
        if (typeof localStorage === "undefined") return false;
        return !!localStorage.getItem(REMEMBER_KEY);
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { toast } = useToast();
    const { lang, toggleLang, t } = useLanguage();
    const emailRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError(null);
        setLoading(true);
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const data = await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: normalizedEmail, password }),
            });
            if (!data.ok || !data.user) {
                throw new Error(data.error || "Login failed");
            }
            if (typeof localStorage !== "undefined") {
                if (remember) localStorage.setItem(REMEMBER_KEY, normalizedEmail);
                else localStorage.removeItem(REMEMBER_KEY);
            }
            toast({
                title: "Welcome back!",
                description: `Signed in as ${data.user.name}`,
            });
            onSuccess(data.user);
        } catch (err) {
            setError(err?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Brand panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950">
                <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl animate-procurement-float-slow" aria-hidden="true" />
                <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-gold-400/15 blur-3xl animate-procurement-float" style={{ animationDelay: "1.2s" }} aria-hidden="true" />
                <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-brand-300/10 blur-3xl animate-procurement-float-slow" style={{ animationDelay: "2.4s" }} aria-hidden="true" />

                {[
                    { top: "16%", left: "14%", size: 16, delay: "0s", dur: "float" },
                    { top: "68%", left: "20%", size: 12, delay: "0.6s", dur: "float-slow" },
                    { top: "22%", left: "78%", size: 14, delay: "1.1s", dur: "float-slow" },
                    { top: "78%", left: "72%", size: 10, delay: "0.3s", dur: "float" },
                    { top: "48%", left: "8%", size: 10, delay: "1.8s", dur: "float" },
                ].map((b, i) => (
                    <span
                        key={i}
                        className={cn("absolute rounded-full bg-gold-300/25", `animate-procurement-${b.dur}`)}
                        style={{ top: b.top, left: b.left, width: b.size, height: b.size * 1.4, animationDelay: b.delay }}
                        aria-hidden="true"
                    />
                ))}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -bottom-6 -right-6 w-64 xl:w-72 drop-shadow-2xl"
                >
                    <SteamingCup className="w-full h-auto" />
                </motion.div>

                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-brand-50 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <KaldiLogo className="h-11 w-11 shadow-lg shadow-brand-950/40" />
                        <div>
                            <div className="font-display text-lg font-semibold tracking-tight text-white">
                                Kaldi&apos;s Coffee
                            </div>
                            <div className="text-xs text-brand-200/80">{t("app.tagline")}</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="max-w-md"
                    >
                        <h1 className="font-display text-3xl xl:text-4xl font-semibold leading-tight text-white text-balance">
                            {t("login.brand.heading")}
                        </h1>
                        <p className="mt-3 text-sm text-brand-200/85 leading-relaxed">
                            {t("login.brand.subheading")}
                        </p>

                        <ul className="mt-8 space-y-4">
                            {FEATURES.map(({ key, icon: Icon }, i) => (
                                <motion.li
                                    key={key}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                                    className="flex items-center gap-3 text-sm text-brand-100"
                                >
                                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-white/10 ring-1 ring-white/10 shrink-0">
                                        <Icon className="h-4 w-4 text-gold-300" />
                                    </span>
                                    {t(key)}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex items-center gap-1.5 text-xs text-brand-300/70"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        {t("login.protected")}
                    </motion.div>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
                <button
                    onClick={toggleLang}
                    className="absolute top-4 right-4 px-2.5 h-9 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors inline-flex items-center gap-1"
                >
                    <Languages className="h-4 w-4" />
                    {lang === "am" ? "EN" : "አማ"}
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm"
                >
                    <div className="flex flex-col items-center gap-3 mb-6 lg:hidden">
                        <KaldiLogo className="h-16 w-16 shadow-sm" />
                        <div className="text-center">
                            <div className="font-display text-lg font-semibold tracking-tight">Kaldi&apos;s Coffee</div>
                            <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
                        </div>
                    </div>

                    <div className="mb-6 hidden lg:block">
                        <h2 className="font-display text-2xl font-semibold tracking-tight">{t("login.title")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t("login.subtitle")}</p>
                    </div>

                    <div className="text-center lg:hidden mb-6">
                        <h2 className="font-display text-xl font-semibold tracking-tight">{t("login.title")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t("login.subtitle")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                role="alert"
                                className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300"
                            >
                                <span className="grid place-items-center h-5 w-5 shrink-0 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300 text-xs font-semibold mt-0.5">
                                    !
                                </span>
                                <span className="leading-snug">{error}</span>
                            </motion.div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="email">{t("login.email")}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="email"
                                    ref={emailRef}
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@kaldicoffee.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 h-11"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">{t("login.password")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-10 h-11"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                                <Checkbox
                                    id="remember"
                                    checked={remember}
                                    onCheckedChange={setRemember}
                                    disabled={loading}
                                />
                                {t("login.rememberMe")}
                            </label>
                            <button
                                type="button"
                                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-gold-400 dark:hover:text-gold-300 transition-colors"
                                onClick={() =>
                                    toast({
                                        title: "Password reset",
                                        description: "Contact your administrator to reset your password.",
                                    })
                                }
                            >
                                {t("login.forgotPassword")}
                            </button>
                        </div>

                        <Button
                            id="login-submit"
                            type="submit"
                            className="w-full h-11 group"
                            disabled={loading || !email || !password}
                        >
                            {loading ? (
                                <>
                                    <Spinner className="h-4 w-4" />
                                    {t("login.signingIn")}
                                </>
                            ) : (
                                <>
                                    {t("login.signIn")}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="flex items-center justify-center gap-1.5 pt-6 text-[11px] text-muted-foreground/80 lg:hidden">
                        <Shield className="h-3 w-3" />
                        {t("login.protected")}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default LoginView;
