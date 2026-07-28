import { useEffect, useState, useCallback } from "react";
import { Send, MessageCircle, ExternalLink, FileSpreadsheet } from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Button } from "./ui/button.jsx";
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
    const [expanded, setExpanded] = useState(null);
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = filter !== "all" ? `?status=${filter}` : "";
            const data = await api(`/api/telegram-outbox${params}`);
            setItems(data);
        } catch (e) {
            toast({ title: "Failed to load", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [filter, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const exportCsv = () => {
        downloadCsv(
            `telegram-outbox-${Date.now()}.csv`,
            [
                ["Supplier", "Chat ID", "Status", "Message", "Error", "Sent At", "Created At"],
                ...items.map((i) => [i.supplierName || "", i.chatId || "", i.status, i.message, i.error || "", i.sentAt || "", i.createdAt]),
            ],
        );
    };

    const stats = {
        sent: items.filter((i) => i.status === "sent").length,
        simulated: items.filter((i) => i.status === "simulated").length,
        failed: items.filter((i) => i.status === "failed").length,
        pending: items.filter((i) => i.status === "pending").length,
    };

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Sent", value: stats.sent, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Simulated", value: stats.simulated, color: "text-gold-600", bg: "bg-gold-50" },
                    { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Failed", value: stats.failed, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((s) => (
                    <Card key={s.label} className="p-4">
                        <div className={cn("text-2xl font-semibold", s.color)}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </Card>
                ))}
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-1 bg-muted rounded-md p-1 w-fit">
                    {["all", "sent", "simulated", "pending", "failed"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded capitalize transition-colors",
                                filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Export CSV
                </Button>
            </div>

            {/* List */}
            <Card className="divide-y divide-border">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Spinner className="h-5 w-5 inline mr-2" />
                        Loading…
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={Send}
                        description="No messages in the outbox yet. Send a proforma request to suppliers to populate this."
                    />
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 hover:bg-accent/20 cursor-pointer"
                            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="grid place-items-center h-9 w-9 rounded-md bg-cyan-50 text-cyan-600 shrink-0">
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm">
                                            {item.supplierName || "Unknown supplier"}
                                        </span>
                                        <OutboxStatusBadge status={item.status} />
                                        {item.chatId && (
                                            <Badge variant="outline" className="text-[10px] py-0">
                                                chat: {item.chatId}
                                            </Badge>
                                        )}
                                    </div>
                                    <p
                                        className={cn(
                                            "text-sm text-muted-foreground mt-1 whitespace-pre-wrap",
                                            expanded !== item.id && "line-clamp-2"
                                        )}
                                    >
                                        {item.message}
                                    </p>
                                    {item.error && (
                                        <p className="text-xs text-rose-600 mt-1">⚠ {item.error}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground/60 mt-1">
                                        {fmtDate(item.createdAt)} · {timeAgo(item.createdAt)}
                                        {item.sentAt && ` · sent ${timeAgo(item.sentAt)}`}
                                    </div>

                                    {expanded === item.id && item.payload && (
                                        <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                                            {(() => {
                                                try {
                                                    return JSON.stringify(JSON.parse(item.payload), null, 2);
                                                } catch {
                                                    return item.payload;
                                                }
                                            })()}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </Card>

            <div className="text-xs text-muted-foreground bg-muted/30 border rounded-md p-3 flex items-start gap-2">
                <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                    The outbox records every message the system attempted to send to suppliers via Telegram.
                    When the bot is not configured, messages are logged but not delivered — configure a bot
                    token in Settings to enable real delivery.
                </span>
            </div>
        </div>
    );
}

export default OutboxView;
