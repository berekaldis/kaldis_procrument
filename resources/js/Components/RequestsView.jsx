import { useEffect, useState, useCallback, useRef } from "react";
import {
    FileText,
    Plus,
    Search,
    ChevronDown,
    X,
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
    LayoutGrid,
    List,
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
    const [viewMode, setViewMode] = useState("grid");
    const [user, setUser] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        api("/api/auth/me")
            .then((d) => setUser(d.user))
            .catch(() => {});
    }, []);

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
                
                {/* View Switcher: Grid vs List */}
                <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                            viewMode === "grid" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Grid View"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Grid
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                            viewMode === "list" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="List View"
                    >
                        <List className="h-3.5 w-3.5" />
                        List
                    </button>
                </div>

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
            ) : viewMode === "grid" ? (
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
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded font-medium border",
                                            r.paymentType === "credit"
                                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                        )}>
                                            {r.paymentType === "credit" ? `Credit (${r.creditPeriod || 30}d)` : "Cash"}
                                        </span>
                                        <RequestStatusBadge status={r.status} />
                                    </div>
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
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/60 border-b border-border">
                                <tr className="text-left font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-center">Items</th>
                                    <th className="px-4 py-3 text-center">Suppliers</th>
                                    <th className="px-4 py-3 text-center">Proformas</th>
                                    <th className="px-4 py-3">Deadline</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {requests.map((r) => (
                                    <tr
                                        key={r.id}
                                        onClick={() => openDetail(r)}
                                        className="hover:bg-accent/40 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono font-medium text-brand-700 dark:text-gold-400">
                                            {r.referenceNo}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {r.title}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded font-medium border",
                                                r.paymentType === "credit"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                            )}>
                                                {r.paymentType === "credit" ? `Credit (${r.creditPeriod || 30}d)` : "Cash"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <RequestStatusBadge status={r.status} />
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">{r.itemCount}</td>
                                        <td className="px-4 py-3 text-center font-medium">{r.supplierCount}</td>
                                        <td className="px-4 py-3 text-center font-medium">{r.proformaCount}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(r.deadline).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openDetail(r)}>
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
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

            {/* Detail dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 sm:p-7 overflow-hidden">
                    {detail ? (
                        <>
                            <DialogHeader className="shrink-0 space-y-2 pb-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded text-xs font-bold tracking-wide">
                                            {detail.referenceNo}
                                        </span>
                                        <RequestStatusBadge status={detail.status} />
                                    </div>
                                    <div className="flex items-center gap-1 kaldi-no-print">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground" onClick={printRequest}>
                                            <Printer className="h-3.5 w-3.5 mr-1" />
                                            Print
                                        </Button>
                                        {userCan(user, "requests.create") && (
                                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground" onClick={cloneRequest} disabled={cloning}>
                                                {cloning ? <Spinner className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                                Duplicate
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    {detail.title}
                                </DialogTitle>
                            </DialogHeader>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1 kaldi-print-area text-xs">
                                <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-xl font-bold tracking-tight text-slate-900">KALDI'S COFFEE PROCUREMENT</h1>
                                            <p className="text-xs text-slate-600">Official Proforma Request (RFQ) Document</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-base font-bold text-slate-900">{detail.referenceNo}</div>
                                            <div className="text-xs text-slate-500">Status: {detail.status?.toUpperCase()}</div>
                                            <div className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{detail.title}</div>
                                </div>

                                {/* 4-cell compact metadata summary strip */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/60">
                                    <div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Requested By</div>
                                        <div className="text-xs font-semibold text-foreground mt-0.5 truncate">{detail.requestedBy || "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Payment Term</div>
                                        <div className="text-xs font-semibold text-foreground mt-0.5">
                                            {detail.paymentType === "credit" ? `Credit (${detail.creditPeriod || 30}d)` : "Cash"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Deadline</div>
                                        <div className={cn(
                                            "text-xs font-semibold flex items-center gap-1 mt-0.5",
                                            isOverdue(detail.deadline) && "text-rose-600 font-bold"
                                        )}>
                                            <Calendar className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{fmtDate(detail.deadline)}</span>
                                            {isOverdue(detail.deadline) && <span className="text-[10px]">(overdue)</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Quotations</div>
                                        <div className="text-xs font-semibold text-foreground mt-0.5">
                                            {detail.proformas?.length || 0} / {detail.suppliers?.length || 0} received
                                        </div>
                                    </div>
                                </div>

                                {detail.description && (
                                    <div className="rounded-md bg-muted/20 border-l-2 border-primary/70 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                                        {detail.description}
                                    </div>
                                )}

                                {/* Requested Items Table */}
                                <div className="rounded-lg border border-border/70 overflow-hidden">
                                    <div className="bg-muted/40 px-3.5 py-2 border-b border-border/60 flex items-center justify-between font-semibold">
                                        <span className="flex items-center gap-1.5 text-foreground text-xs">
                                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                            Requested Items ({detail.items.length})
                                        </span>
                                    </div>
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/15 text-muted-foreground border-b border-border/40 text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 py-1.5 text-left font-medium w-8">#</th>
                                                <th className="px-3 py-1.5 text-left font-medium">Item Name</th>
                                                <th className="px-3 py-1.5 text-right font-medium w-24">Quantity</th>
                                                <th className="px-3 py-1.5 text-left font-medium w-20">Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {detail.items.map((it, i) => (
                                                <tr key={it.id || i} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">{i + 1}</td>
                                                    <td className="px-3 py-2 font-medium text-foreground">
                                                        <div>{it.itemName}</div>
                                                        {it.description && <div className="text-[11px] text-muted-foreground font-normal">{it.description}</div>}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold font-mono">{it.quantity}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">{it.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Invited Suppliers */}
                                <div className="rounded-lg border border-border/70 overflow-hidden">
                                    <div className="bg-muted/40 px-3.5 py-2 border-b border-border/60 flex items-center justify-between font-semibold">
                                        <span className="flex items-center gap-1.5 text-foreground text-xs">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            Invited Suppliers ({detail.suppliers.length})
                                        </span>
                                        <span className="text-[11px] font-normal text-muted-foreground">
                                            {detail.proformas?.length || 0} response(s)
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border/40">
                                        {detail.suppliers.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                No suppliers invited yet.
                                            </div>
                                        ) : (
                                            detail.suppliers.map((rs) => {
                                                const matched = detail.proformas?.find((p) => p.supplier?.id === rs.supplier?.id);
                                                return (
                                                    <div key={rs.id} className="px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className="grid place-items-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                                                                {rs.supplier?.legalName?.charAt(0) || "S"}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-foreground truncate text-xs">
                                                                    {rs.supplier?.legalName || "Unknown Supplier"}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                    <VerificationBadge status={rs.supplier?.verificationStatus} />
                                                                    {rs.supplier?.telegramLinked || rs.supplier?.telegramChatId ? (
                                                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 font-medium text-[10px]">
                                                                            Telegram
                                                                        </span>
                                                                    ) : (
                                                                        <span>Manual</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <SupplierResponseStatus status={rs.status} />
                                                            {matched && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                                                                    onClick={() => {
                                                                        setDetailOpen(false);
                                                                        onNavigate("proformas");
                                                                    }}
                                                                >
                                                                    View Quote →
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Proformas Received (if any) */}
                                {detail.proformas && detail.proformas.length > 0 && (
                                    <div className="rounded-lg border border-border/70 overflow-hidden">
                                        <div className="bg-muted/40 px-3.5 py-2 border-b border-border/60 flex items-center justify-between font-semibold">
                                            <span className="flex items-center gap-1.5 text-foreground text-xs">
                                                <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
                                                Received Proforma Documents ({detail.proformas.length})
                                            </span>
                                        </div>
                                        <div className="divide-y divide-border/40">
                                            {detail.proformas.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-muted/20 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        setDetailOpen(false);
                                                        onNavigate("proformas");
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <FileText className="h-4 w-4 text-primary shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-foreground truncate text-xs">
                                                                {p.supplier?.legalName}
                                                                <span className="font-mono text-muted-foreground text-[11px] ml-1.5">
                                                                    ({p.referenceNo || p.fileName || "Quote Document"})
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {timeAgo(p.receivedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <ReceivedViaBadge via={p.receivedVia} />
                                                        <ProformaStatusBadge status={p.status} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <DialogFooter className="mt-2 pt-3 border-t border-border flex items-center justify-between gap-2 shrink-0 kaldi-no-print">
                                <div>
                                    {(userCan(user, "requests.delete") || userCan(user, "requests.manage")) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                            onClick={async () => {
                                                if (window.confirm(`Are you sure you want to delete request ${detail.referenceNo}?`)) {
                                                    try {
                                                        await api(`/api/proforma-requests/${detail.id}`, { method: "DELETE" });
                                                        toast({ title: "Request deleted", description: detail.referenceNo });
                                                        setDetailOpen(false);
                                                        await load();
                                                    } catch (e) {
                                                        toast({ title: "Delete failed", description: e.message, variant: "destructive" });
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                            Delete Request
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {detail.status === "draft" && userCan(user, "requests.send") && (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={sendToSuppliers}
                                            disabled={sending || detail.suppliers.length === 0}
                                        >
                                            {sending ? (
                                                <Spinner className="h-3.5 w-3.5 mr-1.5" />
                                            ) : (
                                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                            )}
                                            Send via Telegram ({detail.suppliers.length})
                                        </Button>
                                    )}
                                    {["sent", "partially_received", "received"].includes(detail.status) && (
                                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={closeRequest}>
                                            Close Request
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDetailOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            <Spinner className="h-6 w-6 inline mr-2" />
                            Loading request details…
                        </div>
                    )}
                </DialogContent>
            </Dialog>
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

function getDefaultDeadline() {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CreateRequestDialog({
    open,
    onOpenChange,
    suppliers = [],
    onCreated,
}) {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState(getDefaultDeadline);
    const [paymentType, setPaymentType] = useState("cash");
    const [creditPeriod, setCreditPeriod] = useState(30);
    const [items, setItems] = useState([
        { itemName: "", description: "", quantity: 1, unit: "pcs" },
    ]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all"); // "all" or "verified"
    const [supplierSearch, setSupplierSearch] = useState("");
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [localSuppliers, setLocalSuppliers] = useState(suppliers || []);
    const supplierDropdownRef = useRef(null);

    useEffect(() => {
        if (suppliers?.length) {
            setLocalSuppliers(suppliers);
        }
    }, [suppliers]);

    useEffect(() => {
        if (!supplierDropdownOpen) return;
        const handleOutsideClick = (e) => {
            if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target)) {
                setSupplierDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [supplierDropdownOpen]);

    useEffect(() => {
        if (open) {
            api("/api/categories").then((d) => setCategories(d.categories || [])).catch(() => {});
            if (!suppliers || suppliers.length === 0) {
                api("/api/suppliers")
                    .then((d) => setLocalSuppliers(Array.isArray(d) ? d : (d.data || [])))
                    .catch(() => {});
            }
        }
    }, [open, suppliers]);

    const reset = () => {
        setTitle("");
        setDescription("");
        setDeadline(getDefaultDeadline());
        setPaymentType("cash");
        setCreditPeriod(30);
        setItems([{ itemName: "", description: "", quantity: 1, unit: "pcs" }]);
        setSelectedSuppliers([]);
        setCategoryFilter("all");
        setStatusFilter("all");
        setSupplierSearch("");
        setSupplierDropdownOpen(false);
    };

    const activeSuppliers = (localSuppliers || []).filter((s) => s.active !== false);

    const filteredSuppliers = activeSuppliers.filter((s) => {
        if (statusFilter === "verified" && s.verificationStatus !== "verified") {
            return false;
        }
        if (categoryFilter !== "all") {
            const tags = (s.categoryTags || "").split(",").map((t) => t.trim().toLowerCase());
            if (!tags.includes(categoryFilter.toLowerCase())) {
                return false;
            }
        }
        if (!supplierSearch.trim()) return true;
        const q = supplierSearch.toLowerCase();
        return (
            (s.legalName || "").toLowerCase().includes(q) ||
            (s.contactName || "").toLowerCase().includes(q) ||
            (s.tin || "").toLowerCase().includes(q) ||
            (s.categoryTags || "").toLowerCase().includes(q)
        );
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

    const selectAllFiltered = () => {
        const filteredIds = filteredSuppliers.map((s) => s.id);
        if (filteredIds.length === 0) return;
        const allSelected = filteredIds.every((id) => selectedSuppliers.includes(id));
        if (allSelected) {
            setSelectedSuppliers(selectedSuppliers.filter((id) => !filteredIds.includes(id)));
        } else {
            setSelectedSuppliers(Array.from(new Set([...selectedSuppliers, ...filteredIds])));
        }
    };

    const save = async () => {
        if (!title.trim()) {
            toast({ title: "Title is required", variant: "destructive" });
            return;
        }
        const validItems = items.filter((it) => it.itemName?.trim());
        if (validItems.length === 0) {
            toast({ title: "Add at least one item", variant: "destructive" });
            return;
        }
        if (selectedSuppliers.length === 0) {
            toast({ title: "Select at least one supplier to invite", variant: "destructive" });
            return;
        }
        if (selectedSuppliers.length < 3) {
            toast({
                title: "3 quotes recommended",
                description: "Governance policy recommends minimum 3 suppliers per RFQ. Creating draft anyway.",
            });
        }

        setSaving(true);
        try {
            const res = await api("/api/proforma-requests", {
                method: "POST",
                body: JSON.stringify({
                    title: (title || "").trim(),
                    description: (description || "").trim(),
                    deadline,
                    paymentType,
                    creditPeriod: paymentType === "credit" ? creditPeriod : null,
                    items: validItems.map((it) => ({
                        itemName: (it.itemName || "").trim(),
                        description: (it.description || "").trim(),
                        quantity: Number(it.quantity) || 1,
                        unit: (it.unit || "pcs").trim(),
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

    const validItemCount = items.filter((it) => it.itemName?.trim()).length;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) reset();
            }}
        >
            <DialogContent className="max-w-4xl w-[92vw] max-h-[90vh] flex flex-col p-6 sm:p-8 overflow-hidden">
                <DialogHeader className="shrink-0 border-b pb-4">
                    <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                        <FileText className="h-6 w-6 text-primary" />
                        Create Proforma Request (RFQ)
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Define RFQ details, requested line items, and select suppliers to invite via Telegram.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-1">
                    {/* RFQ General Info */}
                    <div className="grid sm:grid-cols-2 gap-3.5">
                        <div className="sm:col-span-2">
                            <Label className="text-xs font-semibold mb-1 block">
                                RFQ Title <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Arabica Washed Coffee Beans — Q3 2026 Procurement"
                                className="h-10 text-sm font-medium"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold mb-1 block">
                                Response Deadline <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="h-9.5 text-xs"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold mb-1 block">
                                Payment Terms <span className="text-rose-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2 h-9.5">
                                <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentType("cash")}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                            paymentType === "cash"
                                                ? "bg-background text-foreground shadow-xs font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        💵 Cash
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentType("credit");
                                            if (!creditPeriod) setCreditPeriod(30);
                                        }}
                                        className={cn(
                                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                            paymentType === "credit"
                                                ? "bg-background text-foreground shadow-xs font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        💳 Credit
                                    </button>
                                </div>
                                {paymentType === "credit" && (
                                    <div className="flex items-center gap-1">
                                        {[30, 60, 90].map((days) => (
                                            <button
                                                key={days}
                                                type="button"
                                                onClick={() => setCreditPeriod(days)}
                                                className={cn(
                                                    "px-2 py-0.5 text-xs rounded border transition-colors",
                                                    creditPeriod === days
                                                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                                                        : "bg-card text-foreground hover:bg-accent border-border"
                                                )}
                                            >
                                                {days}d
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <Label className="text-xs font-medium mb-1 block text-muted-foreground">
                                Special Instructions / Specifications (Optional)
                            </Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Delivery location, special quality grades, packaging requirements…"
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    {/* Line Items Section */}
                    <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Package className="h-4 w-4 text-primary" />
                                Requested Line Items ({items.length})
                            </Label>
                            <Button size="sm" variant="outline" onClick={addItem} className="h-7 text-xs font-medium">
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {items.map((it, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
                                    <div className="grid place-items-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[3fr_1.2fr_1.2fr] gap-2">
                                        <Input
                                            placeholder="Item / Product Name *"
                                            value={it.itemName}
                                            onChange={(e) => updateItem(i, "itemName", e.target.value)}
                                            className="font-medium h-9 text-xs"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addItem();
                                                }
                                            }}
                                        />
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="Quantity"
                                            value={it.quantity}
                                            onChange={(e) => updateItem(i, "quantity", e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            placeholder="Unit (kg, pcs, L)"
                                            value={it.unit}
                                            onChange={(e) => updateItem(i, "unit", e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    {items.length > 1 && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 shrink-0 rounded-md"
                                            onClick={() => removeItem(i)}
                                            title="Remove line item"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Target Suppliers Section (Multi-Select Dropdown) */}
                    <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-primary" />
                                Select Suppliers to Invite <span className="text-rose-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                {selectedSuppliers.length >= 3 ? (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> 3+ Quotes Policy Met
                                    </span>
                                ) : (
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                        {selectedSuppliers.length}/3 Quotes recommended
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Multi-Select Dropdown Combobox */}
                        <div ref={supplierDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setSupplierDropdownOpen(!supplierDropdownOpen)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border bg-background text-sm transition-all text-left",
                                    supplierDropdownOpen ? "ring-2 ring-primary border-primary" : "hover:border-border/80"
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    {selectedSuppliers.length === 0 ? (
                                        <span className="text-muted-foreground text-xs sm:text-sm">Click to choose suppliers to invite…</span>
                                    ) : (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-semibold text-foreground text-xs sm:text-sm">
                                                {selectedSuppliers.length} supplier{selectedSuppliers.length > 1 ? "s" : ""} selected
                                            </span>
                                            <Badge variant="secondary" className="text-[11px] font-normal">
                                                {selectedSuppliers.filter((id) => (localSuppliers || []).find((s) => s.id === id)?.telegramChatId).length} via Telegram
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {selectedSuppliers.length > 0 && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); setSelectedSuppliers([]); }}
                                            className="text-xs text-muted-foreground hover:text-rose-600 px-1.5 py-0.5 rounded cursor-pointer"
                                        >
                                            Clear all
                                        </span>
                                    )}
                                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", supplierDropdownOpen && "rotate-180")} />
                                </div>
                            </button>

                            {/* Dropdown Content - Rendered inline so it never clips! */}
                            {supplierDropdownOpen && (
                                <div className="mt-2 border border-border rounded-xl bg-card shadow-sm overflow-hidden animate-procurement-scale-in">
                                    {/* Search & Actions Header */}
                                    <div className="p-3 border-b bg-muted/20 space-y-2.5">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                            <Input
                                                placeholder="Search suppliers by legal name, category, or TIN…"
                                                value={supplierSearch}
                                                onChange={(e) => setSupplierSearch(e.target.value)}
                                                className="pl-8.5 h-8.5 text-xs"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                            {/* Status Filter + Category Filter Chips */}
                                            <div className="flex flex-wrap items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setStatusFilter(statusFilter === "all" ? "verified" : "all")}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                                                        statusFilter === "verified"
                                                            ? "bg-emerald-600 text-white border-emerald-600"
                                                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                                                    )}
                                                >
                                                    {statusFilter === "verified" ? "✓ Verified Only" : "All Statuses"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCategoryFilter("all")}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                                                        categoryFilter === "all"
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                                                    )}
                                                >
                                                    All Categories
                                                </button>
                                                {categories.slice(0, 6).map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => setCategoryFilter(c.name)}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                                                            categoryFilter === c.name
                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                : "bg-background text-muted-foreground border-border hover:bg-accent"
                                                        )}
                                                    >
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={selectAllFiltered}
                                                className="h-6 text-[11px] px-2 text-primary font-medium"
                                            >
                                                {filteredSuppliers.length > 0 && filteredSuppliers.every((s) => selectedSuppliers.includes(s.id))
                                                    ? "Deselect All"
                                                    : `Select All (${filteredSuppliers.length})`}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Suppliers Options List - 2 Columns on wide screen */}
                                    <div className="max-h-56 overflow-y-auto p-2">
                                        {filteredSuppliers.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-muted-foreground">
                                                No suppliers found matching your search or filters.
                                            </div>
                                        ) : (
                                            <div className="grid sm:grid-cols-2 gap-1.5">
                                                {filteredSuppliers.map((s) => {
                                                    const checked = selectedSuppliers.includes(s.id);
                                                    return (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => toggleSupplier(s.id)}
                                                            className={cn(
                                                                "flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors",
                                                                checked
                                                                    ? "bg-primary/10 border-primary/40 font-medium"
                                                                    : "bg-background border-border hover:bg-accent/50"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={() => toggleSupplier(s.id)}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-foreground text-xs truncate">
                                                                    {s.legalName}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 truncate">
                                                                    {s.verificationStatus === "verified" ? (
                                                                        <span className="text-emerald-600 font-medium">✓ Verified</span>
                                                                    ) : (
                                                                        <span className="text-amber-600">Unverified</span>
                                                                    )}
                                                                    {s.telegramChatId ? (
                                                                        <span className="text-sky-600 font-medium">· Telegram</span>
                                                                    ) : (
                                                                        <span>· Manual</span>
                                                                    )}
                                                                    {s.categoryTags && <span>· {s.categoryTags}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-2 border-t bg-muted/20 flex justify-end">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setSupplierDropdownOpen(false)}
                                            className="h-7 text-xs px-3"
                                        >
                                            Done ({selectedSuppliers.length} selected)
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Supplier Pills */}
                        {selectedSuppliers.length > 0 && !supplierDropdownOpen && (
                            <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 border rounded-lg max-h-24 overflow-y-auto">
                                {selectedSuppliers.map((id) => {
                                    const s = (localSuppliers || []).find((sup) => sup.id === id);
                                    if (!s) return null;
                                    return (
                                        <Badge
                                            key={id}
                                            variant="secondary"
                                            className="px-2 py-0.5 text-[11px] flex items-center gap-1 font-medium"
                                        >
                                            <Building2 className="h-3 w-3 opacity-60" />
                                            <span>{s.legalName}</span>
                                            {s.telegramChatId ? (
                                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" title="Connected to Telegram" />
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => toggleSupplier(id)}
                                                className="hover:text-rose-600 rounded-full transition-colors ml-0.5"
                                                title="Remove supplier"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="pt-3 border-t shrink-0 flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs">
                        Cancel
                    </Button>
                    <Button
                        onClick={save}
                        disabled={saving}
                        className="h-9 px-5 text-xs font-semibold"
                    >
                        {saving && <Spinner className="h-3.5 w-3.5 mr-2" />}
                        Create Proforma Request ({selectedSuppliers.length} Suppliers)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default RequestsView;
