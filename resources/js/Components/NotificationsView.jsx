import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, Inbox, X, Calendar, ExternalLink } from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx";
import { Badge } from "./ui/badge.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import { api } from "../lib/procurement";
import { NotificationIcon, timeAgo, fmtDate } from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

export function NotificationsView({ onChange }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedNotif, setSelectedNotif] = useState(null);
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
            onChange?.();
            toast({ title: "All marked as read" });
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    const markOne = async (id) => {
        try {
            await api(`/api/notifications/${id}`, { method: "PATCH" });
            await load();
            onChange?.();
        } catch {}
    };

    const handleItemClick = (n) => {
        setSelectedNotif(n);
        if (!n.read) {
            markOne(n.id);
        }
    };

    const dismiss = async (id, e) => {
        e?.stopPropagation();
        try {
            await api(`/api/notifications/${id}`, { method: "DELETE" });
            if (selectedNotif?.id === id) setSelectedNotif(null);
            await load();
            onChange?.();
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

            <Card className="divide-y divide-border overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Spinner className="h-5 w-5 inline mr-2" />
                        Loading notifications…
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
                            onClick={() => handleItemClick(n)}
                            className={cn(
                                "flex gap-3 p-4 hover:bg-accent/40 cursor-pointer transition-colors",
                                !n.read && "bg-accent/25 font-medium"
                            )}
                        >
                            <NotificationIcon type={n.type} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-foreground">{n.title}</span>
                                    {!n.read && (
                                        <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0">New</Badge>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                                <div className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-2">
                                    <span>{fmtDate(n.createdAt)}</span>
                                    <span>•</span>
                                    <span>{timeAgo(n.createdAt)}</span>
                                    {n.link && <span className="text-brand-600 dark:text-gold-400 font-mono">· {n.link}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {!n.read && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => markOne(n.id)}
                                    >
                                        Mark read
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => dismiss(n.id, e)}
                                    title="Dismiss notification"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </Card>

            {/* Notification Detail Dialog Modal */}
            {selectedNotif && (
                <Dialog open={!!selectedNotif} onOpenChange={(v) => !v && setSelectedNotif(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <div className="flex items-center gap-2.5">
                                <NotificationIcon type={selectedNotif.type} />
                                <div>
                                    <DialogTitle className="text-lg font-bold">
                                        {selectedNotif.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs mt-0.5">
                                        Received {fmtDate(selectedNotif.createdAt)} ({timeAgo(selectedNotif.createdAt)})
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="p-4 rounded-xl bg-muted/40 border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {selectedNotif.message}
                            </div>

                            {selectedNotif.link && (
                                <div className="flex items-center justify-between p-3 rounded-lg border bg-brand-50/50 dark:bg-brand-950/40 text-xs">
                                    <span className="text-muted-foreground">Reference Link:</span>
                                    <span className="font-mono font-medium text-brand-700 dark:text-gold-300">
                                        {selectedNotif.link}
                                    </span>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex justify-between items-center sm:justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:text-rose-700 text-xs"
                                onClick={(e) => dismiss(selectedNotif.id, e)}
                            >
                                Dismiss Notification
                            </Button>
                            <Button
                                onClick={() => setSelectedNotif(null)}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-medium"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

export default NotificationsView;
