import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, Inbox, X } from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import { api } from "../lib/procurement";
import { NotificationIcon, timeAgo, fmtDate } from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

export function NotificationsView({ onChange }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const { toast } = useToast();

    const load = useCallback(async () => {
        try {
            const data = await api("/api/notifications");
            setItems(data.notifications);
        } catch (e) {
            toast({ title: "Failed to load", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const markAll = async () => {
        try {
            await api("/api/notifications", { method: "PATCH" });
            await load();
            onChange();
            toast({ title: "All marked as read" });
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    const markOne = async (id) => {
        try {
            await api(`/api/notifications/${id}`, { method: "PATCH" });
            await load();
            onChange();
        } catch {}
    };

    const dismiss = async (id) => {
        try {
            await api(`/api/notifications/${id}`, { method: "DELETE" });
            await load();
            onChange();
        } catch (e) {
            toast({ title: "Failed to dismiss", description: e.message, variant: "destructive" });
        }
    };

    const shown = filter === "unread" ? items.filter((n) => !n.read) : items;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-muted rounded-md p-1">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded transition-colors",
                            filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        )}
                    >
                        All ({items.length})
                    </button>
                    <button
                        onClick={() => setFilter("unread")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded transition-colors",
                            filter === "unread" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        )}
                    >
                        Unread ({items.filter((n) => !n.read).length})
                    </button>
                </div>
                <Button variant="outline" size="sm" onClick={markAll} disabled={items.every((n) => n.read)}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                </Button>
            </div>

            <Card className="divide-y divide-border">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Spinner className="h-5 w-5 inline mr-2" />
                        Loading…
                    </div>
                ) : shown.length === 0 ? (
                    <EmptyState
                        icon={Inbox}
                        description={filter === "unread" ? "No unread notifications" : "No notifications yet"}
                    />
                ) : (
                    shown.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                "flex gap-3 p-4 hover:bg-accent/30 transition-colors",
                                !n.read && "bg-accent/20"
                            )}
                        >
                            <NotificationIcon type={n.type} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{n.title}</span>
                                    {!n.read && (
                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                    {fmtDate(n.createdAt)} · {timeAgo(n.createdAt)}
                                    {n.link && <span className="ml-2">· {n.link}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {!n.read && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7"
                                        onClick={() => markOne(n.id)}
                                    >
                                        Mark read
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => dismiss(n.id)}
                                    title="Dismiss"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}

export default NotificationsView;
