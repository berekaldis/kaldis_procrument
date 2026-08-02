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
    CheckCircle2,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog.jsx";
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

    // Forgot Password Modal State
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState(null);
    const [forgotError, setForgotError] = useState(null);

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

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;
        setForgotLoading(true);
        setForgotError(null);
        setForgotMessage(null);
        try {
            const res = await api("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email: forgotEmail.trim() }),
            });
            setForgotMessage(res.message || "Password reset request recorded successfully.");
        } catch (err) {
            setForgotError(err?.message || "Failed to submit request. Please verify email address.");
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
            {/* Ambient Background Blur Elements */}
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />

            {/* Brand panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-950 to-slate-950">
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
                    className="absolute bottom-4 right-6 w-20 xl:w-24 drop-shadow-md opacity-60 pointer-events-none"
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
                        <KaldiLogo className="h-12 w-12 shadow-xl ring-2 ring-gold-400/30" />
                        <div>
                            <div className="font-display text-xl font-bold tracking-tight text-white">
                                Kaldi&apos;s Coffee
                            </div>
                            <div className="text-xs text-brand-200/90 font-medium">{t("app.tagline")}</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="max-w-md"
                    >
                        <h1 className="font-display text-3xl xl:text-4xl font-extrabold leading-tight text-white text-balance">
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
                                    className="flex items-center gap-3 text-sm text-brand-100 font-medium"
                                >
                                    <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/15 shrink-0 backdrop-blur-md">
                                        <Icon className="h-4.5 w-4.5 text-gold-300" />
                                    </span>
                                    {t(key)}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                </div>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
                <button
                    onClick={toggleLang}
                    className="absolute top-6 right-6 px-3 h-9 rounded-full text-xs font-semibold text-muted-foreground bg-muted/50 hover:bg-accent hover:text-accent-foreground border border-border/60 transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                    <Languages className="h-4 w-4 text-brand-600 dark:text-gold-400" />
                    {lang === "am" ? "English 🇬🇧" : "አማርኛ 🇪🇹"}
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    {/* Glassmorphic Login Card */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl p-8 sm:p-10 space-y-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <KaldiLogo className="h-16 w-16 shadow-lg ring-2 ring-brand-500/20" />
                            <div>
                                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{t("login.title")}</h2>
                                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("login.subtitle")}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    role="alert"
                                    className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-3 text-xs sm:text-sm text-rose-700 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-300 shadow-sm"
                                >
                                    <span className="grid place-items-center h-5 w-5 shrink-0 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300 text-xs font-bold mt-0.5">
                                        !
                                    </span>
                                    <span className="leading-snug">{error}</span>
                                </motion.div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground">{t("login.email")}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="email"
                                        ref={emailRef}
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@kaldisbunna.et"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 rounded-xl border-border/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-semibold text-foreground">{t("login.password")}</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11 rounded-xl border-border/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
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
                                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-gold-400 dark:hover:text-gold-300 transition-colors"
                                    onClick={() => {
                                        setForgotEmail(email || "");
                                        setForgotMessage(null);
                                        setForgotError(null);
                                        setForgotOpen(true);
                                    }}
                                >
                                    {t("login.forgotPassword")}
                                </button>
                            </div>

                            <Button
                                id="login-submit"
                                type="submit"
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 hover:from-brand-800 hover:to-brand-950 dark:from-gold-500 dark:to-gold-600 dark:text-slate-950 font-bold text-white shadow-lg shadow-brand-900/20 group transition-all"
                                disabled={loading || !email || !password}
                            >
                                {loading ? (
                                    <>
                                        <Spinner className="h-4 w-4 mr-2" />
                                        {t("login.signingIn")}
                                    </>
                                ) : (
                                    <>
                                        {t("login.signIn")}
                                        <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>

            {/* Forgot Password Modal */}
            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Lock className="h-5 w-5 text-brand-600 dark:text-gold-400" />
                            Forgot Password?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Enter your company email address (@kaldisbunna.et) to send a password reset request to your System Administrator.
                        </DialogDescription>
                    </DialogHeader>

                    {forgotMessage ? (
                        <div className="space-y-4 py-2">
                            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs leading-relaxed">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-emerald-900 dark:text-emerald-200 mb-0.5">Request Submitted</div>
                                    {forgotMessage}
                                </div>
                            </div>
                            <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1 border">
                                <div className="font-semibold text-foreground">Need Immediate Help?</div>
                                <div>Contact Administrator: <b>admin@kaldisbunna.et</b></div>
                                <div>Phone: <b>+251 911 223 344</b></div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotSubmit} className="space-y-4 py-2">
                            {forgotError && (
                                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs">
                                    {forgotError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="forgot-email" className="text-xs font-medium">Company Email Address *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        id="forgot-email"
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="you@kaldisbunna.et"
                                        className="pl-9 h-10 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                                    Close
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={forgotLoading || !forgotEmail}
                                    className="bg-brand-600 hover:bg-brand-700 dark:bg-gold-500 dark:hover:bg-gold-600 dark:text-slate-950 font-medium text-xs"
                                >
                                    {forgotLoading && <Spinner className="h-3.5 w-3.5 mr-1.5" />}
                                    Submit Reset Request
                                </Button>
                            </DialogFooter>
                        </form>
                    )}

                    {forgotMessage && (
                        <DialogFooter className="pt-2 border-t">
                            <Button variant="default" onClick={() => setForgotOpen(false)} className="w-full">
                                Back to Login
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default LoginView;
