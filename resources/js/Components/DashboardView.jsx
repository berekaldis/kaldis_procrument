import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Building2,
    FileText,
    Inbox,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Send,
    Link2,
    TrendingUp,
    ArrowRight,
    Activity,
} from "lucide-react";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Skeleton } from "./ui/skeleton.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import { api } from "../lib/procurement";
import { useLanguage } from "../hooks/use-language";
import { useCountUp } from "../hooks/use-count-up";
import {
    RequestStatusBadge,
    ProformaStatusBadge,
    VerificationBadge,
    ReceivedViaBadge,
    timeAgo,
    fmtDateShort,
} from "./bits";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    CartesianGrid,
} from "recharts";

const STATUS_COLORS = {
    draft: "#A89584",
    sent: "#C08A2E",
    partially_received: "#D9A23F",
    received: "#3F8F5F",
    closed: "#8A7566",
    cancelled: "#C0362E",
    unverified: "#A89584",
    documents_received: "#D9A23F",
    verified: "#3F8F5F",
};

const CHART_GRID = "#E5D6C0";
const CHART_TICK = "#9C8570";

const statCardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function AnimatedStatValue({ value }) {
    const animated = useCountUp(value);
    return <>{animated}</>;
}

function greetingKey(hour) {
    if (hour < 12) return "dashboard.greeting.morning";
    if (hour < 17) return "dashboard.greeting.afternoon";
    return "dashboard.greeting.evening";
}

function GreetingBanner({ currentUser, t }) {
    const firstName = currentUser?.name?.split(" ")[0] || currentUser?.name;
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {t(greetingKey(new Date().getHours()))}{firstName ? `, ${firstName}` : ""}!
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.greeting.welcome")}</p>
        </motion.div>
    );
}

export function DashboardView({ onNavigate, currentUser }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await api("/api/dashboard");
                if (mounted) setData(d);
            } catch (e) {
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        const t = setInterval(async () => {
            try {
                const d = await api("/api/dashboard");
                if (mounted) setData(d);
            } catch {}
        }, 20000);
        return () => {
            mounted = false;
            clearInterval(t);
        };
    }, []);

    if (loading || !data) {
        return (
            <div className="space-y-6">
                <GreetingBanner currentUser={currentUser} t={t} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="p-5 h-28">
                            <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                            <Skeleton className="h-6 w-16 mb-1.5" />
                            <Skeleton className="h-3 w-24" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: t("dashboard.totalSuppliers"),
            value: data.totalSuppliers,
            sub: `${data.verifiedSuppliers} verified`,
            icon: Building2,
            color: "text-brand-600 dark:text-brand-300",
            bg: "bg-brand-50 dark:bg-brand-900/40",
            section: "suppliers",
        },
        {
            label: t("dashboard.proformaRequests"),
            value: data.totalRequests,
            sub: `${data.openRequests} open`,
            icon: FileText,
            color: "text-sky-600 dark:text-sky-300",
            bg: "bg-sky-50 dark:bg-sky-950",
            section: "requests",
        },
        {
            label: t("dashboard.proformasReceived"),
            value: data.totalProformas,
            sub: `${data.pendingProformas} awaiting review`,
            icon: Inbox,
            color: "text-gold-600 dark:text-gold-300",
            bg: "bg-gold-50 dark:bg-gold-900/40",
            section: "proformas",
        },
        {
            label: t("dashboard.overdueRequests"),
            value: data.overdueRequests,
            sub: data.overdueRequests > 0 ? "needs attention" : "all on track",
            icon: AlertTriangle,
            color: data.overdueRequests > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400",
            bg: data.overdueRequests > 0 ? "bg-rose-50 dark:bg-rose-950" : "bg-slate-100 dark:bg-slate-800",
            section: "requests",
        },
        {
            label: t("dashboard.telegramLinked"),
            value: data.telegramLinkedSuppliers,
            sub: "suppliers connected",
            icon: Link2,
            color: "text-cyan-600 dark:text-cyan-300",
            bg: "bg-cyan-50 dark:bg-cyan-950",
            section: "suppliers",
        },
        {
            label: t("dashboard.messagesSent"),
            value: data.outboxCount,
            sub: "via Telegram",
            icon: Send,
            color: "text-teal-600 dark:text-teal-300",
            bg: "bg-teal-50 dark:bg-teal-950",
            section: "outbox",
        },
        {
            label: t("dashboard.avgTurnaround"),
            value: data.avgTurnaroundHours !== null ? `${data.avgTurnaroundHours}h` : "—",
            sub: "request → proforma",
            icon: Clock,
            color: "text-amber-600 dark:text-amber-300",
            bg: "bg-amber-50 dark:bg-amber-950",
            section: "audit",
        },
        {
            label: t("dashboard.verifiedRate"),
            value:
                data.totalSuppliers > 0
                    ? `${Math.round((data.verifiedSuppliers / data.totalSuppliers) * 100)}%`
                    : "—",
            sub: "of all suppliers",
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-300",
            bg: "bg-emerald-50 dark:bg-emerald-950",
            section: "suppliers",
        },
    ];

    const reqChart = data.charts.requestsByStatus.map((s) => ({
        name: s.status.replace("_", " "),
        count: s.count,
        fill: STATUS_COLORS[s.status] || "#94a3b8",
    }));
    const verChart = data.charts.suppliersByVerification.map((s) => ({
        name: s.status.replace("_", " "),
        value: s.count,
        fill: STATUS_COLORS[s.status] || "#94a3b8",
    }));

    return (
        <div className="space-y-6">
            <GreetingBanner currentUser={currentUser} t={t} />

            {/* Stat cards */}
            <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} variants={statCardVariants}>
                            <Card
                                className="p-5 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-200/70 transition-all duration-200 cursor-pointer group"
                                onClick={() => onNavigate(s.section)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`grid place-items-center h-10 w-10 rounded-lg ${s.bg}`}>
                                        <Icon className={`h-5 w-5 ${s.color}`} />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                                    <AnimatedStatValue value={s.value} />
                                </div>
                                <div className="text-sm font-medium text-foreground/80">{s.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Upcoming deadlines */}
            {data.upcomingDeadlines?.length > 0 && (
                <Card className="p-5 border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="font-medium text-sm text-foreground">{t("dashboard.deadlinesTitle")}</h3>
                    </div>
                    <div className="space-y-2">
                        {data.upcomingDeadlines.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-card hover:bg-accent/40 cursor-pointer transition-colors"
                                onClick={() => onNavigate("requests")}
                            >
                                <div className={`grid place-items-center h-9 w-9 rounded-md shrink-0 ${r.overdue ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300" : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"}`}>
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-medium text-brand-700 dark:text-gold-300">{r.referenceNo}</span>
                                        {r.overdue && (
                                            <span className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-300">Overdue</span>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium truncate mt-0.5 text-foreground">{r.title}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {r.proformaCount}/{r.supplierCount} responded · due {new Date(r.deadline).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Charts row */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-medium text-sm text-foreground">{t("dashboard.requestsByStatus")}</h3>
                            <p className="text-xs text-muted-foreground">Current distribution across the pipeline</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="h-64">
                        {reqChart.length === 0 ? (
                            <EmptyChart />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reqChart} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: CHART_TICK }}
                                        interval={0}
                                        angle={-15}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: CHART_TICK }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-popover)",
                                            color: "var(--color-popover-foreground)",
                                            fontSize: 12,
                                            boxShadow: "0 4px 16px rgba(36,22,16,0.12)",
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="mb-4">
                        <h3 className="font-medium text-sm text-foreground">{t("dashboard.supplierVerification")}</h3>
                        <p className="text-xs text-muted-foreground">Onboarding progress</p>
                    </div>
                    <div className="h-64">
                        {verChart.length === 0 ? (
                            <EmptyChart />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={verChart}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                    >
                                        {verChart.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-popover)",
                                            color: "var(--color-popover-foreground)",
                                            fontSize: 12,
                                            boxShadow: "0 4px 16px rgba(36,22,16,0.12)",
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: 11 }}
                                        iconType="circle"
                                        formatter={(v) => <span className="capitalize">{v}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent activity */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm text-foreground">{t("dashboard.recentRequests")}</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onNavigate("requests")}
                        >
                            {t("dashboard.viewAll")}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {data.recentRequests.length === 0 ? (
                            <EmptyState icon={FileText} description="No requests yet" className="py-8" />
                        ) : (
                            data.recentRequests.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border/70 hover:bg-accent/40 hover:border-brand-200/70 cursor-pointer transition-colors"
                                    onClick={() => onNavigate("requests")}
                                >
                                    <div className="grid place-items-center h-9 w-9 rounded-md bg-sky-50 text-sky-600 shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-medium text-sky-700">
                                                {r.referenceNo}
                                            </span>
                                            <RequestStatusBadge status={r.status} />
                                        </div>
                                        <div className="text-sm font-medium truncate mt-0.5 text-foreground">{r.title}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {r.supplierCount} suppliers · {r.proformaCount} proformas · {timeAgo(r.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm text-foreground">{t("dashboard.recentProformas")}</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onNavigate("proformas")}
                        >
                            {t("dashboard.viewAll")}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {data.recentProformas.length === 0 ? (
                            <EmptyState icon={Inbox} description="No proformas received yet" className="py-8" />
                        ) : (
                            data.recentProformas.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border/70 hover:bg-accent/40 hover:border-brand-200/70 cursor-pointer transition-colors"
                                    onClick={() => onNavigate("proformas")}
                                >
                                    <div className="grid place-items-center h-9 w-9 rounded-md bg-gold-50 text-gold-600 shrink-0">
                                        <Inbox className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium truncate text-foreground">{p.supplierName}</span>
                                            <ReceivedViaBadge via={p.receivedVia} />
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                            For {p.requestRef} · {p.requestTitle}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                                            {timeAgo(p.receivedAt)}
                                        </div>
                                    </div>
                                    <ProformaStatusBadge status={p.status} />
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent audit */}
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm text-foreground">{t("dashboard.recentActivity")}</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onNavigate("audit")}
                    >
                        {t("dashboard.viewAll")}
                    </Button>
                </div>
                <div className="space-y-2">
                    {data.recentAudit.length === 0 ? (
                        <EmptyState icon={Activity} description="No activity yet" className="py-8" />
                    ) : (
                        data.recentAudit.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3 py-2 border-b border-border/70 last:border-b-0 text-sm"
                            >
                                <div className="grid place-items-center h-6 w-6 rounded-full bg-muted text-[10px] font-medium shrink-0 mt-0.5 text-foreground">
                                    {log.actor.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="font-medium text-foreground">{log.actor}</span>{" "}
                                    <span className="text-muted-foreground">{log.details}</span>
                                    <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                                        {log.entity} · {log.action} · {timeAgo(log.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="h-full grid place-items-center text-sm text-muted-foreground">
            No data to display yet
        </div>
    );
}

export default DashboardView;
