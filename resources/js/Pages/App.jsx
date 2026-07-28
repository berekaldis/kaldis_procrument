import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, Building2, FileText, Inbox, Bell, History, Send,
    Settings, Menu, X, LogOut, ChevronDown, ShieldCheck, Users, Sun, Moon, Languages, UserCircle,
    PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "../lib/utils";
import { api, SECTION_PERMISSIONS, userCan } from "../lib/procurement";
import { useTheme } from "../hooks/use-theme";
import { useLanguage } from "../hooks/use-language";
import { useSidebar } from "../hooks/use-sidebar";

// LoginView renders first for every logged-out visitor — keep it in the main
// bundle. Every other section is lazy-loaded per-route so the initial JS
// payload only includes the view the user actually lands on.
import { LoginView } from "../Components/LoginView";
import { GlobalSearch } from "../Components/GlobalSearch";
import { ProfileDialog } from "../Components/ProfileDialog";
import { Toaster } from "../Components/Toaster";
import { Spinner } from "../Components/ui/spinner.jsx";

const DashboardView = lazy(() => import("../Components/DashboardView").then((m) => ({ default: m.DashboardView })));
const SuppliersView = lazy(() => import("../Components/SuppliersView").then((m) => ({ default: m.SuppliersView })));
const RequestsView = lazy(() => import("../Components/RequestsView").then((m) => ({ default: m.RequestsView })));
const ProformasView = lazy(() => import("../Components/ProformasView").then((m) => ({ default: m.ProformasView })));
const NotificationsView = lazy(() => import("../Components/NotificationsView").then((m) => ({ default: m.NotificationsView })));
const AuditView = lazy(() => import("../Components/AuditView").then((m) => ({ default: m.AuditView })));
const OutboxView = lazy(() => import("../Components/OutboxView").then((m) => ({ default: m.OutboxView })));
const SettingsView = lazy(() => import("../Components/SettingsView").then((m) => ({ default: m.SettingsView })));
const UsersView = lazy(() => import("../Components/UsersView").then((m) => ({ default: m.UsersView })));

function ViewFallback() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="grid place-items-center py-24 text-muted-foreground"
        >
            <Spinner className="h-6 w-6" />
        </motion.div>
    );
}

const NAV = [
    { id: "dashboard", label: "nav.dashboard", icon: LayoutDashboard, group: "nav.group.overview", perm: "dashboard.view" },
    { id: "suppliers", label: "nav.suppliers", icon: Building2, group: "nav.group.procurement", perm: "suppliers.view" },
    { id: "requests", label: "nav.requests", icon: FileText, group: "nav.group.procurement", perm: "requests.view" },
    { id: "proformas", label: "nav.proformas", icon: Inbox, group: "nav.group.procurement", perm: "proformas.view" },
    { id: "notifications", label: "nav.notifications", icon: Bell, group: "nav.group.system", perm: "notifications.view" },
    { id: "outbox", label: "nav.outbox", icon: Send, group: "nav.group.system", perm: "outbox.view" },
    { id: "audit", label: "nav.audit", icon: History, group: "nav.group.system", perm: "audit.view" },
    { id: "users", label: "nav.users", icon: Users, group: "nav.group.system", perm: "users.manage" },
    { id: "settings", label: "nav.settings", icon: Settings, group: "nav.group.system", perm: "settings.view" },
];

const SECTION_TITLE_KEYS = {
    dashboard: "section.dashboard",
    suppliers: "section.suppliers",
    requests: "section.requests",
    proformas: "section.proformas",
    notifications: "section.notifications",
    audit: "section.audit",
    outbox: "section.outbox",
    users: "section.users",
    settings: "section.settings",
};

function initials(name) {
    return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function KaldiLogo({ className }) {
    return (
        <img
            src="/images/kaldis-logo.jpg"
            alt="Kaldi's Coffee"
            className={cn("rounded-full object-cover shrink-0 ring-1 ring-black/5", className)}
        />
    );
}

export default function App({ auth: initialAuth }) {
    const [user, setUser] = useState(initialAuth?.user || null);
    const [authChecked, setAuthChecked] = useState(!!initialAuth);
    const [section, setSection] = useState("dashboard");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [bootstrapped, setBootstrapped] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLang, t } = useLanguage();
    const { collapsed, toggleCollapsed } = useSidebar();

    useEffect(() => {
        (async () => {
            try {
                const data = await api("/api/auth/me");
                setUser(data.user);
            } catch { setUser(null); }
            finally { setAuthChecked(true); }
        })();
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await api("/api/notifications");
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {}
    }, []);

    useEffect(() => {
        if (!user) return;
        (async () => {
            setBootstrapped(true);
            await loadNotifications();
        })();
    }, [user, loadNotifications]);

    useEffect(() => {
        if (!bootstrapped) return;
        const t = setInterval(loadNotifications, 15000);
        return () => clearInterval(t);
    }, [bootstrapped, loadNotifications]);

    const goTo = (s) => { setSection(s); setMobileNavOpen(false); };
    const handleLogin = (u) => { setUser(u); setSection("dashboard"); setBootstrapped(false); };
    const handleLogout = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); } catch {}
        setUser(null); setShowUserMenu(false); setBootstrapped(false);
        setNotifications([]); setUnreadCount(0);
    };

    const visibleNav = useMemo(() => NAV.filter((item) => userCan(user, item.perm)), [user]);

    useEffect(() => {
        if (!user) return;
        if (!userCan(user, SECTION_PERMISSIONS[section])) {
            const first = visibleNav[0]?.id ?? "dashboard";
            setSection(first);
        }
    }, [user, section, visibleNav]);

    const grouped = useMemo(() => {
        return visibleNav.reduce((acc, item) => {
            const g = item.group || "Main";
            if (!acc[g]) acc[g] = [];
            acc[g].push(item);
            return acc;
        }, {});
    }, [visibleNav]);

    const markAllRead = async () => {
        try { await api("/api/notifications", { method: "PATCH" }); await loadNotifications(); } catch {}
    };
    const markOneRead = async (id) => {
        try { await api(`/api/notifications/${id}`, { method: "PATCH" }); await loadNotifications(); } catch {}
    };

    if (!authChecked) {
        return (
            <div className="min-h-screen grid place-items-center bg-background relative overflow-hidden">
                {/* Floating gradient blobs */}
                <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-brand-300/25 dark:bg-brand-700/20 blur-3xl animate-procurement-float-slow" aria-hidden="true" />
                <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-gold-300/25 dark:bg-gold-700/15 blur-3xl animate-procurement-float" style={{ animationDelay: "1.2s" }} aria-hidden="true" />
                <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-brand-200/20 dark:bg-brand-800/15 blur-3xl animate-procurement-float-slow" style={{ animationDelay: "2.4s" }} aria-hidden="true" />

                {/* Floating coffee beans */}
                {[
                    { top: "18%", left: "12%", size: 16, delay: "0s", dur: "float" },
                    { top: "70%", left: "18%", size: 12, delay: "0.6s", dur: "float-slow" },
                    { top: "24%", left: "82%", size: 14, delay: "1.1s", dur: "float-slow" },
                    { top: "75%", left: "80%", size: 10, delay: "0.3s", dur: "float" },
                    { top: "50%", left: "6%", size: 10, delay: "1.8s", dur: "float" },
                ].map((b, i) => (
                    <span
                        key={i}
                        className={cn("absolute rounded-full bg-brand-800/20 dark:bg-gold-400/20", `animate-procurement-${b.dur}`)}
                        style={{ top: b.top, left: b.left, width: b.size, height: b.size * 1.4, animationDelay: b.delay }}
                        aria-hidden="true"
                    />
                ))}

                <div className="relative flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="relative grid place-items-center h-20 w-20">
                        <span className="absolute inset-0 rounded-full bg-brand-400/40 dark:bg-gold-400/30 animate-procurement-glow-ring" />
                        <span className="absolute inset-0 rounded-full bg-brand-400/40 dark:bg-gold-400/30 animate-procurement-glow-ring" style={{ animationDelay: "1.1s" }} />
                        <KaldiLogo className="relative h-14 w-14 shadow-lg shadow-brand-500/30 animate-procurement-bob" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        <p className="text-sm">{t("app.loading")}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return <LoginView onSuccess={handleLogin} />;

    const titleKey = SECTION_TITLE_KEYS[section];
    const currentTitle = { title: t(`${titleKey}.title`), sub: t(`${titleKey}.sub`) };
    const roleLabel = t(`role.${user.role}`, user.role);

    return (
        <div className="min-h-screen flex bg-background">
            <aside className={cn(
                "fixed lg:sticky top-0 z-40 h-screen shrink-0 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 w-72",
                collapsed ? "lg:w-20" : "lg:w-72",
                mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className={cn("flex items-center gap-3 px-5 h-16 border-b border-sidebar-border", collapsed && "lg:px-0 lg:justify-center")}>
                    <KaldiLogo className="h-9 w-9 shadow-lg shadow-brand-950/40" />
                    <div className={cn("min-w-0", collapsed && "lg:hidden")}>
                        <div className="font-display font-semibold text-sm leading-tight truncate text-sidebar-foreground">Kaldi&apos;s Coffee</div>
                        <div className="text-[11px] text-sidebar-foreground/50">{t("app.tagline")}</div>
                    </div>
                    <button onClick={() => setMobileNavOpen(false)} className={cn("ml-auto lg:hidden text-sidebar-foreground p-1", collapsed && "lg:hidden")}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <button
                    onClick={toggleCollapsed}
                    className="hidden lg:flex items-center justify-center h-7 w-7 rounded-full bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-accent-foreground border border-sidebar-border absolute -right-3 top-14 z-10 shadow-md transition-colors"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                </button>
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5 procurement-nav-scroll">
                    {Object.entries(grouped).map(([group, items]) => (
                        <div key={group}>
                            <div className={cn("px-3 mb-2 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/35", collapsed && "lg:hidden")}>{t(group)}</div>
                            <div className="space-y-0.5">
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const active = section === item.id;
                                    const showDot = item.id === "notifications" && unreadCount > 0;
                                    return (
                                        <button key={item.id} onClick={() => goTo(item.id)}
                                            title={collapsed ? t(item.label) : undefined}
                                            className={cn(
                                                "relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                                                collapsed && "lg:justify-center lg:px-0",
                                                active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            )}>
                                            {active && (
                                                <motion.span
                                                    layoutId="nav-active-pill"
                                                    className="absolute inset-0 rounded-lg bg-sidebar-primary shadow-sm shadow-brand-950/30"
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                />
                                            )}
                                            <span className="relative shrink-0">
                                                <Icon className="h-4 w-4" />
                                                {showDot && (
                                                    <span className={cn("hidden absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500", collapsed && "lg:block")} />
                                                )}
                                            </span>
                                            <span className={cn("relative flex-1 truncate", collapsed && "lg:hidden")}>{t(item.label)}</span>
                                            {showDot && (
                                                <span className={cn("relative grid place-items-center min-w-5 h-5 px-1.5 text-[10px] font-semibold rounded-full bg-rose-500 text-white", collapsed && "lg:hidden")}>
                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="border-t border-sidebar-border px-3 py-3">
                    <div className="relative">
                        <button onClick={() => setShowUserMenu(v => !v)} className={cn("w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left", collapsed && "lg:justify-center lg:px-0")}>
                            <div className="grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-gold-500 text-white text-xs font-medium shrink-0">{initials(user.name)}</div>
                            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                                <div className="text-sm font-medium truncate text-sidebar-foreground">{user.name}</div>
                                <div className="text-[11px] text-sidebar-foreground/50 truncate">{roleLabel}</div>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/40 shrink-0", collapsed && "lg:hidden")} />
                        </button>
                        {showUserMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                                <div className={cn("absolute bottom-full mb-2 bg-popover border border-border rounded-xl shadow-xl shadow-slate-950/10 z-40 overflow-hidden animate-procurement-scale-in", collapsed ? "lg:left-0 lg:w-64" : "left-0 right-0")}>
                                    <div className="px-4 py-3 border-b border-border">
                                        <div className="text-sm font-medium truncate text-foreground">{user.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-medium">
                                            <ShieldCheck className="h-3 w-3" />{roleLabel}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setProfileOpen(true); setShowUserMenu(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors"
                                    >
                                        <UserCircle className="h-4 w-4" />{t("app.myProfile")}
                                    </button>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors text-rose-600">
                                        <LogOut className="h-4 w-4" />{t("app.signOut")}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {mobileNavOpen && <div className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur flex items-center gap-3 px-4 lg:px-6">
                    <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-2 text-foreground"><Menu className="h-5 w-5" /></button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base lg:text-lg font-semibold leading-tight truncate text-foreground">{currentTitle.title}</h1>
                        <p className="text-xs text-muted-foreground truncate hidden sm:block">{currentTitle.sub}</p>
                    </div>
                    <GlobalSearch onNavigate={goTo} />
                    <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-xs font-medium dark:bg-accent dark:text-accent-foreground dark:border-border">
                        <ShieldCheck className="h-3.5 w-3.5" />{roleLabel}
                    </div>
                    <button
                        onClick={toggleLang}
                        className="px-2.5 h-9 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors inline-flex items-center gap-1"
                        title={lang === "am" ? "Switch to English" : "የአማርኛ ቋንቋ ይቀይሩ"}
                    >
                        <Languages className="h-4 w-4" />
                        {lang === "am" ? "EN" : "አማ"}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowNotifPanel(v => !v)} className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 grid place-items-center min-w-4 h-4 px-1 text-[9px] font-semibold rounded-full bg-rose-500 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                        </button>
                        {showNotifPanel && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowNotifPanel(false)} />
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover border border-border rounded-xl shadow-xl shadow-slate-950/10 z-40 overflow-hidden animate-procurement-scale-in">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                        <div className="font-semibold text-sm text-foreground">{t("app.notifications")}</div>
                                        <button onClick={markAllRead} disabled={unreadCount === 0} className="text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50">{t("app.markAllRead")}</button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("app.noNotifications")}</div>
                                        ) : notifications.slice(0, 20).map((n) => (
                                            <button key={n.id} onClick={() => { markOneRead(n.id); if (n.link) { goTo(n.link); setShowNotifPanel(false); } }}
                                                className={cn("w-full flex gap-3 px-4 py-3 border-b border-border last:border-b-0 text-left hover:bg-accent/60 transition-colors", !n.read && "bg-accent/30")}>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium leading-tight text-foreground">{n.title}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</div>
                                                    <div className="text-[10px] text-muted-foreground/70 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                                                </div>
                                                {!n.read && <span className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>
                <main className="flex-1 p-4 lg:p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={section}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                            <Suspense fallback={<ViewFallback />}>
                                {section === "dashboard" && <DashboardView onNavigate={goTo} currentUser={user} />}
                                {section === "suppliers" && <SuppliersView />}
                                {section === "requests" && <RequestsView onNavigate={goTo} />}
                                {section === "proformas" && <ProformasView />}
                                {section === "notifications" && <NotificationsView onChange={loadNotifications} />}
                                {section === "audit" && <AuditView />}
                                {section === "outbox" && <OutboxView />}
                                {section === "users" && <UsersView currentUser={user} />}
                                {section === "settings" && <SettingsView />}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </main>
                <footer className="mt-auto border-t border-border px-4 lg:px-6 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div className="leading-relaxed">
                        <div>{t("app.footer.copyright")}</div>
                        <div className="text-muted-foreground/70">{t("app.footer.developedBy")}</div>
                    </div>
                    <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t("app.signedInAs")} {user.name}</span></div>
                </footer>
            </div>
            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} onUpdated={(u) => setUser({ ...user, ...u })} />
            <Toaster />
        </div>
    );
}
