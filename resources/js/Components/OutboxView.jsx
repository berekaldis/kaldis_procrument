import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Send,
    MessageCircle,
    ExternalLink,
    FileSpreadsheet,
    Search,
    RefreshCw,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Clock,
    XCircle,
    Bot,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import { api } from "../lib/procurement";
import { downloadCsv } from "../lib/csv";
import { OutboxStatusBadge, timeAgo, fmtDate } from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

export function OutboxView() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedIds, setExpandedIds] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = filter !== "all" ? `?status=${filter}` : "";
            const data = await api(`/api/telegram-outbox${params}`);
            setItems(data);
        } catch (e) {
            toast({ title: "Failed to load outbox", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [filter, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleExpand = (id) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const copyText = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast({ title: "Copied message text to clipboard" });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(
            (i) =>
                (i.supplierName || "").toLowerCase().includes(q) ||
                (i.message || "").toLowerCase().includes(q) ||
                (i.chatId || "").toLowerCase().includes(q) ||
                (i.status || "").toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const exportCsv = () => {
        downloadCsv(
            `telegram-outbox-${Date.now()}.csv`,
            [
                ["Supplier", "Chat ID", "Status", "Message", "Error", "Sent At", "Created At"],
                ...filteredItems.map((i) => [
                    i.supplierName || "",
                    i.chatId || "",
                    i.status,
                    i.message,
                    i.error || "",
                    i.sentAt || "",
                    i.createdAt,
                ]),
            ]
        );
    };

    const stats = useMemo(() => {
        return {
            sent: items.filter((i) => i.status === "sent").length,
            simulated: items.filter((i) => i.status === "simulated").length,
            pending: items.filter((i) => i.status === "pending").length,
            failed: items.filter((i) => i.status === "failed").length,
        };
    }, [items]);

    return (
        <div className="space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Sent via Telegram", value: stats.sent, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
                    { label: "Simulated Delivery", value: stats.simulated, color: "text-gold-600 dark:text-gold-400", bg: "bg-gold-50 dark:bg-gold-950/40 border-gold-200 dark:border-gold-800", icon: Bot },
                    { label: "Pending Queue", value: stats.pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", icon: Clock },
                    { label: "Delivery Failures", value: stats.failed, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800", icon: XCircle },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <Card key={s.label} className={cn("p-4 border transition-shadow", s.bg)}>
                            <div className="flex items-center justify-between">
                                <span className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</span>
                                <Icon className={cn("h-5 w-5 opacity-70", s.color)} />
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
                        </Card>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search outbox by supplier name, message text, or chat ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                        {["all", "sent", "simulated", "pending", "failed"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors",
                                    filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <Button variant="outline" size="sm" onClick={load} title="Refresh outbox">
                        <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Outbox Cards List */}
            <Card className="overflow-hidden border divide-y divide-border">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Spinner className="h-5 w-5 inline mr-2 text-brand-600" />
                        Loading Telegram outbox messages…
                    </div>
                ) : filteredItems.length === 0 ? (
                    <EmptyState
                        icon={Send}
                        title={searchQuery ? "No matching outbox messages" : "Outbox is empty"}
                        description={
                            searchQuery
                                ? `No messages matched "${searchQuery}". Try a different search term.`
                                : "Outbound Telegram notifications sent to suppliers will be logged here."
                        }
                    />
                ) : (
                    filteredItems.map((item) => {
                        const isExpanded = expandedIds.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                className="p-4 hover:bg-accent/30 transition-colors space-y-2"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="grid place-items-center h-10 w-10 rounded-full bg-cyan-100/70 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-semibold text-sm shrink-0">
                                            {(item.supplierName || "S")[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-foreground truncate">
                                                    {item.supplierName || "Direct / Unlinked Supplier"}
                                                </span>
                                                <OutboxStatusBadge status={item.status} />
                                                {item.chatId && (
                                                    <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground">
                                                        chat: {item.chatId}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                                                <span>Created {fmtDate(item.createdAt)}</span>
                                                <span>•</span>
                                                <span>{timeAgo(item.createdAt)}</span>
                                                {item.sentAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400">sent {timeAgo(item.sentAt)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => copyText(item.id, item.message)}
                                            title="Copy message content"
                                        >
                                            {copiedId === item.id ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => toggleExpand(item.id)}
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <span className="hidden sm:inline mr-1">Hide Details</span>
                                                    <ChevronUp className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    <span className="hidden sm:inline mr-1">Technical Payload</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Message preview */}
                                <div className="ml-13 pl-0.5">
                                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs sm:text-sm font-sans leading-relaxed text-foreground whitespace-pre-wrap">
                                        {item.message}
                                    </div>

                                    {item.error && (
                                        <div className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-md border border-rose-200 dark:border-rose-800">
                                            ⚠ Delivery Error: {item.error}
                                        </div>
                                    )}

                                    {/* Collapsible raw JSON payload */}
                                    {isExpanded && item.payload && (
                                        <div className="mt-3 space-y-1">
                                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                Technical Telegram Payload (JSON)
                                            </div>
                                            <pre className="p-3 bg-slate-900 text-slate-100 dark:bg-slate-950 rounded-lg text-[11px] font-mono overflow-x-auto border">
                                                {(() => {
                                                    try {
                                                        return JSON.stringify(JSON.parse(item.payload), null, 2);
                                                    } catch {
                                                        return item.payload;
                                                    }
                                                })()}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </Card>

            <div className="text-xs text-muted-foreground bg-muted/30 border rounded-lg p-3.5 flex items-start gap-2.5">
                <ExternalLink className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
                <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">Telegram Delivery Status:</span>
                    <p className="leading-normal">
                        Outbox tracks every outgoing proforma request and notification. When Telegram bot credentials are tokenized in Settings, messages are dispatched live to suppliers via Telegram API. If bot credentials are missing, system records delivery in <b>Simulated</b> mode for testing.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default OutboxView;
