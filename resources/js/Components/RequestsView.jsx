import { useEffect, useState, useCallback } from "react";
import {
    FileText,
    Plus,
    Search,
    Trash2,
    Send,
    ArrowLeft,
    Package,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Sparkles,
    Calendar,
    Inbox,
    FileSpreadsheet,
    Tag,
    Copy,
    Printer,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Textarea } from "./ui/textarea.jsx";
import { Badge } from "./ui/badge.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "./ui/dialog.jsx";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select.jsx";
import { ScrollArea } from "./ui/scroll-area.jsx";
import { Pagination } from "./ui/pagination.jsx";
import { DateRangeFilter } from "./ui/date-range-filter.jsx";
import { api, apiPaged, userCan } from "../lib/procurement";
import { downloadCsv } from "../lib/csv";
import {
    RequestStatusBadge,
    ProformaStatusBadge,
    VerificationBadge,
    ReceivedViaBadge,
    timeAgo,
    fmtDate,
    isOverdue,
} from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

export function RequestsView({ onNavigate }) {
    const [requests, setRequests] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [cloning, setCloning] = useState(false);
    const [user, setUser] = useState(null);
    const { toast } = useToast();

    const buildParams = useCallback(() => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
        return params;
    }, [q, statusFilter, dateFrom, dateTo]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = buildParams();
            params.set("page", String(page));
            params.set("perPage", "12");
            const { data, meta: m } = await apiPaged(`/api/proforma-requests?${params.toString()}`);
            setRequests(data);
            setMeta(m);
        } catch (e) {
            toast({ title: "Failed to load", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [buildParams, page, toast]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [q, statusFilter, dateFrom, dateTo]);

    const exportCsv = async () => {
        try {
            const params = buildParams();
            const all = await api(`/api/proforma-requests?${params.toString()}`);
            downloadCsv(
                `proforma-requests-${Date.now()}.csv`,
                [
                    ["Reference", "Title", "Status", "Deadline", "Suppliers", "Proformas", "Created"],
                    ...all.map((r) => [r.referenceNo, r.title, r.status, r.deadline, r.supplierCount, r.proformaCount, r.createdAt]),
                ],
            );
        } catch (e) {
            toast({ title: "Export failed", description: e.message, variant: "destructive" });
        }
    };

    useEffect(() => {
        api("/api/suppliers").then(setSuppliers).catch(() => {});
    }, []);

    useEffect(() => {
        api("/api/auth/me")
            .then((d) => setUser(d.user))
            .catch(() => {});
    }, []);

    const openDetail = async (r) => {
        setDetailOpen(true);
        setDetail(null);
        try {
            const d = await api(`/api/proforma-requests/${r.id}`);
            setDetail(d);
        } catch (e) {
            toast({ title: "Failed to load detail", description: e.message, variant: "destructive" });
            setDetailOpen(false);
        }
    };

    const sendToSuppliers = async () => {
        if (!detail) return;
        setSending(true);
        try {
            const res = await api(`/api/proforma-requests/${detail.id}/send`, { method: "POST" });
            toast({
                title: "Request sent to suppliers",
                description: `${detail.referenceNo} → ${res.suppliers.length} supplier(s) notified.`,
            });
            const d = await api(`/api/proforma-requests/${detail.id}`);
            setDetail(d);
            await load();
        } catch (e) {
            toast({ title: "Send failed", description: e.message, variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const closeRequest = async () => {
        if (!detail) return;
        try {
            await api(`/api/proforma-requests/${detail.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "closed" }),
            });
            toast({ title: "Request closed", description: detail.referenceNo });
            const d = await api(`/api/proforma-requests/${detail.id}`);
            setDetail(d);
            await load();
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    const cloneRequest = async () => {
        if (!detail) return;
        setCloning(true);
        try {
            const res = await api(`/api/proforma-requests/${detail.id}/clone`, { method: "POST" });
            toast({ title: "Request duplicated", description: `Created ${res.referenceNo} as a draft.` });
            setDetailOpen(false);
            await load();
        } catch (e) {
            toast({ title: "Failed to duplicate", description: e.message, variant: "destructive" });
        } finally {
            setCloning(false);
        }
    };

    const printRequest = () => window.print();

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by reference, title…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="partially_received">Partially received</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
                <Button variant="outline" onClick={exportCsv} className="shrink-0">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Export CSV
                </Button>
                {userCan(user, "requests.create") && (
                    <Button
                        onClick={() => setFormOpen(true)}
                        className="shrink-0"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        New Request
                    </Button>
                )}
            </div>

            {/* Grid of request cards */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-44 animate-pulse bg-muted/40" />
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={FileText}
                        title="No proforma requests yet"
                        description="Create your first request to notify suppliers via Telegram."
                        action={
                            userCan(user, "requests.create") && (
                                <Button onClick={() => setFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Request
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {requests.map((r) => {
                        const respondedCount = r.respondedSupplierIds.length;
                        const overdue = isOverdue(r.deadline) && ["sent", "partially_received"].includes(r.status);
                        return (
                            <Card
                                key={r.id}
                                className="p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                                onClick={() => openDetail(r)}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="font-mono text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded">
                                        {r.referenceNo}
                                    </div>
                                    <RequestStatusBadge status={r.status} />
                                </div>
                                <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1">{r.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                    {r.description || "No description"}
                                </p>
                                <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t text-center">
                                    <div>
                                        <div className="text-sm font-medium">{r.itemCount}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase">Items</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{r.supplierCount}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase">Suppliers</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{r.proformaCount}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase">Proformas</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 text-xs">
                                    <span className="text-muted-foreground">{timeAgo(r.createdAt)}</span>
                                    {overdue ? (
                                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                                            <AlertTriangle className="h-3 w-3" />
                                            Overdue
                                        </span>
                                    ) : r.proformaCount > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {respondedCount}/{r.supplierCount} responded
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(r.deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
            <Pagination meta={meta} onPageChange={setPage} />

            {/* Create dialog */}
            <CreateRequestDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                suppliers={suppliers}
                onCreated={async () => {
                    setFormOpen(false);
                    await load();
                }}
            />

            {/* Detail sheet */}
            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    {detail ? (
                        <>
                            <SheetHeader className="kaldi-no-print">
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 -ml-2 text-xs text-muted-foreground"
                                        onClick={() => setDetailOpen(false)}
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Back
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={printRequest}>
                                            <Printer className="h-3.5 w-3.5 mr-1" />
                                            Print
                                        </Button>
                                        {userCan(user, "requests.create") && (
                                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cloneRequest} disabled={cloning}>
                                                {cloning ? <Spinner className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                                Duplicate
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <SheetTitle className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-sm">
                                        {detail.referenceNo}
                                    </span>
                                    <RequestStatusBadge status={detail.status} />
                                </SheetTitle>
                                <SheetDescription className="text-base font-medium text-foreground">
                                    {detail.title}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-5 kaldi-print-area">
                                <div className="hidden print:block mb-4">
                                    <div className="font-mono text-lg font-semibold">{detail.referenceNo}</div>
                                    <div className="text-base">{detail.title}</div>
                                </div>
                                {detail.description && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                            Description
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{detail.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="p-3">
                                        <div className="text-xs text-muted-foreground">Requested by</div>
                                        <div className="text-sm font-medium">{detail.requestedBy}</div>
                                    </Card>
                                    <Card className="p-3">
                                        <div className="text-xs text-muted-foreground">Deadline</div>
                                        <div className={cn(
                                            "text-sm font-medium flex items-center gap-1",
                                            isOverdue(detail.deadline) && "text-rose-600"
                                        )}>
                                            <Calendar className="h-3.5 w-3.5" />
                                            {fmtDate(detail.deadline)}
                                            {isOverdue(detail.deadline) && " (overdue)"}
                                        </div>
                                    </Card>
                                </div>

                                {/* Items */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="font-medium text-sm">Requested Items ({detail.items.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {detail.items.map((it, i) => (
                                            <Card key={it.id} className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="grid place-items-center h-7 w-7 rounded-full bg-brand-50 text-brand-700 text-xs font-medium shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-sm">{it.itemName}</div>
                                                        {it.description && (
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                {it.description}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            <span className="font-medium text-foreground">{it.quantity}</span> {it.unit}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Suppliers */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="font-medium text-sm">
                                            Invited Suppliers ({detail.suppliers.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {detail.suppliers.map((rs) => (
                                            <Card key={rs.id} className="p-3 flex items-center gap-3">
                                                <div className="grid place-items-center h-8 w-8 rounded-full bg-muted text-xs font-medium shrink-0">
                                                    {rs.supplier.legalName.charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-sm truncate">{rs.supplier.legalName}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <VerificationBadge status={rs.supplier.verificationStatus} />
                                                        {rs.supplier.telegramChatId && (
                                                            <Badge variant="outline" className="text-[10px] py-0 bg-cyan-50 text-cyan-700 border-cyan-200">
                                                                Telegram
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <SupplierResponseStatus status={rs.status} />
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Proformas received */}
                                {detail.proformas.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Inbox className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="font-medium text-sm">
                                                Proformas Received ({detail.proformas.length})
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {detail.proformas.map((p) => (
                                                <Card
                                                    key={p.id}
                                                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/40"
                                                    onClick={() => {
                                                        setDetailOpen(false);
                                                        onNavigate("proformas");
                                                    }}
                                                >
                                                    <div className="grid place-items-center h-8 w-8 rounded-md bg-gold-50 text-gold-700 shrink-0">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-sm truncate">{p.supplier.legalName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {p.fileName || "Text message"} · {timeAgo(p.receivedAt)}
                                                        </div>
                                                    </div>
                                                    <ReceivedViaBadge via={p.receivedVia} />
                                                    <ProformaStatusBadge status={p.status} />
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-3 border-t space-y-2 kaldi-no-print">
                                    {detail.status === "draft" && userCan(user, "requests.send") && (
                                        <Button onClick={sendToSuppliers} disabled={sending} className="w-full">
                                            {sending ? (
                                                <Spinner className="h-4 w-4 mr-1" />
                                            ) : (
                                                <Send className="h-4 w-4 mr-1" />
                                            )}
                                            Approve & Send to {detail.suppliers.length} Suppliers via Telegram
                                        </Button>
                                    )}
                                    {detail.status === "draft" && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            Approving this proforma request will notify all selected suppliers through the Telegram bot and move the
                                            request to "Sent" status.
                                        </p>
                                    )}
                                    {["sent", "partially_received", "received"].includes(detail.status) && (
                                        <Button onClick={closeRequest} variant="outline" className="w-full">
                                            Close Request
                                        </Button>
                                    )}
                                    {detail.status === "draft" && detail.suppliers.length === 0 && (
                                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 text-center">
                                            Add at least one supplier before sending.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full grid place-items-center">
                            <Spinner className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function SupplierResponseStatus({ status }) {
    const map = {
        pending: { label: "Pending", cls: "bg-slate-100 text-slate-600", icon: Clock },
        notified: { label: "Notified", cls: "bg-sky-100 text-sky-700", icon: Send },
        received: { label: "Responded", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
        declined: { label: "Declined", cls: "bg-rose-100 text-rose-700", icon: XCircle },
    };
    const m = map[status] || map.pending;
    const Icon = m.icon;
    return (
        <Badge variant="outline" className={cn("gap-1", m.cls)}>
            <Icon className="h-3 w-3" />
            {m.label}
        </Badge>
    );
}

function CreateRequestDialog({
    open,
    onOpenChange,
    suppliers,
    onCreated,
}) {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState(() => {
        const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 16);
    });
    const [items, setItems] = useState([
        { itemName: "", description: "", quantity: 1, unit: "pcs" },
    ]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
        if (open) {
            api("/api/categories").then((d) => setCategories(d.categories || [])).catch(() => {});
        }
    }, [open]);

    const reset = () => {
        setTitle("");
        setDescription("");
        setDeadline(() => {
            const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            return d.toISOString().slice(0, 16);
        });
        setItems([{ itemName: "", description: "", quantity: 1, unit: "pcs" }]);
        setSelectedSuppliers([]);
        setCategoryFilter("all");
    };

    const verifiedSuppliers = suppliers
        .filter((s) => s.verificationStatus === "verified")
        .filter((s) => {
            if (categoryFilter === "all") return true;
            const tags = (s.categoryTags || "").split(",").map((t) => t.trim().toLowerCase());
            return tags.includes(categoryFilter.toLowerCase());
        });

    const addItem = () =>
        setItems([...items, { itemName: "", description: "", quantity: 1, unit: "pcs" }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, value) =>
        setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

    const toggleSupplier = (id) =>
        setSelectedSuppliers((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const selectAllVerified = () => {
        if (selectedSuppliers.length === verifiedSuppliers.length) {
            setSelectedSuppliers([]);
        } else {
            setSelectedSuppliers(verifiedSuppliers.map((s) => s.id));
        }
    };

    const save = async () => {
        if (!title.trim()) {
            toast({ title: "Title is required", variant: "destructive" });
            return;
        }
        const validItems = items.filter((it) => it.itemName.trim());
        if (validItems.length === 0) {
            toast({ title: "Add at least one item", variant: "destructive" });
            return;
        }
        if (selectedSuppliers.length === 0) {
            toast({ title: "Select at least one supplier", variant: "destructive" });
            return;
        }
        if (selectedSuppliers.length < 3) {
            toast({
                title: "3 quotes recommended",
                description: "Governance policy recommends minimum 3 suppliers per RFQ. You can continue anyway.",
            });
        }

        setSaving(true);
        try {
            const res = await api("/api/proforma-requests", {
                method: "POST",
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    deadline,
                    items: validItems.map((it) => ({
                        itemName: it.itemName.trim(),
                        description: it.description.trim(),
                        quantity: Number(it.quantity),
                        unit: it.unit.trim(),
                    })),
                    supplierIds: selectedSuppliers,
                }),
            });
            toast({
                title: "Request created",
                description: `${res.referenceNo} — saved as draft. Open it to send to suppliers.`,
            });
            reset();
            onCreated();
        } catch (e) {
            toast({ title: "Failed to create", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) reset();
            }}
        >
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-brand-600" />
                        New Proforma Request
                    </DialogTitle>
                    <DialogDescription>
                        Create a request and select suppliers to notify via Telegram. The request is saved as a
                        draft — you can review it before sending.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    {/* Basics */}
                    <div className="grid gap-4">
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">Title *</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Coffee beans supply — Q3 2026"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">Description / Notes</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Additional context for suppliers…"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">Response Deadline *</Label>
                            <Input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5" />
                                Requested Items *
                            </Label>
                            <Button size="sm" variant="outline" onClick={addItem} className="h-7">
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add item
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {items.map((it, i) => (
                                <Card key={i} className="p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="grid place-items-center h-6 w-6 rounded-full bg-brand-50 text-brand-700 text-xs font-medium shrink-0 mt-1">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                                            <Input
                                                placeholder="Item name *"
                                                value={it.itemName}
                                                onChange={(e) => updateItem(i, "itemName", e.target.value)}
                                            />
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="Qty"
                                                value={it.quantity}
                                                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Unit (kg, pcs, L)"
                                                value={it.unit}
                                                onChange={(e) => updateItem(i, "unit", e.target.value)}
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => removeItem(i)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        className="mt-2"
                                        placeholder="Spec / description (optional)"
                                        value={it.description}
                                        onChange={(e) => updateItem(i, "description", e.target.value)}
                                    />
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Suppliers */}
                    <div>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <Label className="text-xs font-medium flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                Select Suppliers * ({selectedSuppliers.length} selected)
                            </Label>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={selectAllVerified}
                                className="h-7 text-xs"
                            >
                                {selectedSuppliers.length === verifiedSuppliers.length && verifiedSuppliers.length > 0
                                    ? "Deselect all"
                                    : "Select all verified"}
                            </Button>
                        </div>
                        {categories.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="h-8 text-xs w-full sm:w-56">
                                        <SelectValue placeholder="Filter by category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All categories</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.name}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mb-2">
                            <Sparkles className="h-3 w-3 inline mr-1" />
                            Only verified suppliers are shown (governance policy)
                            {categoryFilter !== "all" && <> tagged <b>{categoryFilter}</b></>}. {verifiedSuppliers.length} available.
                        </p>
                        <ScrollArea className="h-56 rounded-md border">
                            <div className="p-2 space-y-1">
                                {verifiedSuppliers.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No verified suppliers yet. Verify suppliers first.
                                    </div>
                                ) : (
                                    verifiedSuppliers.map((s) => {
                                        const checked = selectedSuppliers.includes(s.id);
                                        return (
                                            <label
                                                key={s.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                                    checked ? "bg-brand-50" : "hover:bg-accent/50"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() => toggleSupplier(s.id)}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium truncate">{s.legalName}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {s.contactName || "—"} · {s.tin || "no TIN"}
                                                    </div>
                                                </div>
                                                {s.telegramChatId ? (
                                                    <Badge variant="outline" className="text-[10px] py-0 bg-cyan-50 text-cyan-700 border-cyan-200">
                                                        Telegram
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                                                        No Telegram
                                                    </Badge>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                        {selectedSuppliers.length > 0 && selectedSuppliers.length < 3 && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Governance recommends at least 3 suppliers per RFQ.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={saving}>
                        {saving && <Spinner className="h-4 w-4 mr-1" />}
                        Create Draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default RequestsView;
