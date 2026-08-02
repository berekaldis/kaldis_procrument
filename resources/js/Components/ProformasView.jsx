import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Inbox,
    Search,
    FileText,
    Download,
    Eye,
    CheckCircle2,
    XCircle,
    Columns3,
    FileImage,
    File,
    Plus,
    X,
    Trophy,
    Printer,
    FileSpreadsheet,
    PhoneCall,
    Paperclip,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Textarea } from "./ui/textarea.jsx";
import { Label } from "./ui/label.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet.jsx";
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
import { Pagination } from "./ui/pagination.jsx";
import { DateRangeFilter } from "./ui/date-range-filter.jsx";
import { api, apiPaged, userCan } from "../lib/procurement";
import {
    ProformaStatusBadge,
    ReceivedViaBadge,
    timeAgo,
    fmtDate,
} from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

function fmtMoney(n) {
    return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProformasView() {
    const [proformas, setProformas] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [detail, setDetail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailFull, setDetailFull] = useState(null);
    const [notes, setNotes] = useState("");
    const [itemsDraft, setItemsDraft] = useState([]);
    const [savingItems, setSavingItems] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [compareIds, setCompareIds] = useState([]);
    const [compareOpen, setCompareOpen] = useState(false);
    const [user, setUser] = useState(null);
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (dateFrom) params.set("from", dateFrom);
            if (dateTo) params.set("to", dateTo);
            params.set("page", String(page));
            params.set("perPage", "12");
            const { data, meta: m } = await apiPaged(`/api/proformas?${params.toString()}`);
            setProformas(data);
            setMeta(m);
        } catch (e) {
            toast({ title: "Failed to load", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [q, statusFilter, dateFrom, dateTo, page, toast]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [q, statusFilter, dateFrom, dateTo]);

    useEffect(() => {
        api("/api/suppliers").then(setSuppliers).catch(() => {});
    }, []);

    useEffect(() => {
        api("/api/auth/me")
            .then((d) => setUser(d.user))
            .catch(() => {});
    }, []);

    const openDetail = async (p) => {
        setDetailOpen(true);
        setDetail(p);
        setDetailFull(null);
        setNotes("");
        setItemsDraft([]);
        try {
            const full = await api(`/api/proformas/${p.id}`);
            setDetailFull(full);
            setNotes(full.notes || "");
            setItemsDraft(full.items && full.items.length ? full.items : []);
        } catch {}
    };

    const setStatus = async (status) => {
        if (!detail) return;
        try {
            await api(`/api/proformas/${detail.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status, notes }),
            });
            toast({
                title: "Proforma updated",
                description: `${detail.supplier.legalName} → ${status}`,
            });
            await load();
            const full = await api(`/api/proformas/${detail.id}`);
            setDetailFull(full);
            setDetail({ ...detail, status });
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    const saveNotes = async () => {
        if (!detail) return;
        try {
            await api(`/api/proformas/${detail.id}`, {
                method: "PATCH",
                body: JSON.stringify({ notes }),
            });
            toast({ title: "Notes saved" });
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    const savePricing = async () => {
        if (!detail) return;
        const cleaned = itemsDraft
            .filter((r) => r.itemName?.trim())
            .map((r) => ({
                itemName: r.itemName.trim(),
                quantity: Number(r.quantity) || 0,
                unit: r.unit || "pcs",
                unitPrice: Number(r.unitPrice) || 0,
            }));
        setSavingItems(true);
        try {
            const updated = await api(`/api/proformas/${detail.id}`, {
                method: "PATCH",
                body: JSON.stringify({ items: cleaned }),
            });
            setDetailFull(updated);
            setItemsDraft(updated.items || []);
            toast({ title: "Pricing saved", description: `Total: ${fmtMoney(updated.totalAmount)} ${updated.currency || "ETB"}` });
            await load();
        } catch (e) {
            toast({ title: "Failed to save pricing", description: e.message, variant: "destructive" });
        } finally {
            setSavingItems(false);
        }
    };

    const toggleCompare = (id) => {
        setCompareIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 4) {
                toast({ title: "Max 4 proformas to compare", variant: "destructive" });
                return prev;
            }
            return [...prev, id];
        });
    };

    const compareProformas = compareIds
        .map((id) => proformas.find((p) => p.id === id))
        .filter(Boolean);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by supplier, request…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
                {compareIds.length > 0 && (
                    <Button variant="outline" onClick={() => setCompareOpen(true)} className="shrink-0">
                        <Columns3 className="h-4 w-4 mr-1" />
                        Compare ({compareIds.length})
                    </Button>
                )}
                {userCan(user, "proformas.review") && (
                    <Button variant="outline" onClick={() => setManualOpen(true)} className="shrink-0">
                        <PhoneCall className="h-4 w-4 mr-1" />
                        Log Manual Response
                    </Button>
                )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted/40 border rounded-md px-3 py-2 flex items-center gap-2">
                <Columns3 className="h-3.5 w-3.5 shrink-0" />
                <span>
                    Select up to 4 proformas and click <b>Compare</b> for a structured price comparison. Enter unit
                    prices per item in a proforma's detail panel to power the comparison table.
                </span>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-40 animate-pulse bg-muted/40" />
                    ))}
                </div>
            ) : proformas.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Inbox}
                        title="No proformas yet"
                        description="Proformas submitted by suppliers via Telegram will appear here."
                        action={
                            userCan(user, "proformas.review") && (
                                <Button variant="outline" onClick={() => setManualOpen(true)}>
                                    <PhoneCall className="h-4 w-4 mr-1" />
                                    Log Manual Response
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {proformas.map((p) => {
                        const inCompare = compareIds.includes(p.id);
                        return (
                            <Card
                                key={p.id}
                                className={cn(
                                    "p-5 hover:shadow-md transition-shadow flex flex-col relative",
                                    inCompare && "ring-2 ring-brand-500"
                                )}
                            >
                                <button
                                    className={cn(
                                        "absolute top-3 right-3 grid place-items-center h-6 w-6 rounded border transition-colors",
                                        inCompare
                                            ? "bg-brand-600 text-white border-brand-600"
                                            : "bg-card text-muted-foreground border-border hover:border-brand-300 hover:text-brand-600"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCompare(p.id);
                                    }}
                                    title="Add to comparison"
                                >
                                    <Columns3 className="h-3 w-3" />
                                </button>
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => openDetail(p)}
                                >
                                    <div className="flex items-center gap-2 mb-2 pr-8">
                                        <ReceivedViaBadge via={p.receivedVia} />
                                        <ProformaStatusBadge status={p.status} />
                                    </div>
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="grid place-items-center h-10 w-10 rounded-md bg-gold-50 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 shrink-0">
                                            <FileIcon type={p.fileType} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm truncate">{p.supplier.legalName}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {p.request.referenceNo} · {p.request.title}
                                            </div>
                                        </div>
                                    </div>
                                    {p.totalAmount != null ? (
                                        <div className="text-sm font-semibold text-brand-700 dark:text-gold-300 tabular-nums">
                                            {fmtMoney(p.totalAmount)} {p.currency || "ETB"}
                                        </div>
                                    ) : p.message ? (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2 whitespace-pre-wrap">
                                            {p.message}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                                    <span className="text-muted-foreground">{timeAgo(p.receivedAt)}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => openDetail(p)}
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        View
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
            <Pagination meta={meta} onPageChange={setPage} />

            {/* Detail dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
                    {detail ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <FileText className="h-5 w-5 text-brand-600 dark:text-gold-400" />
                                    <span>Proforma Quotation — {detail.supplier?.legalName}</span>
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 flex-wrap text-xs mt-1">
                                    <ReceivedViaBadge via={detail.receivedVia} />
                                    <ProformaStatusBadge status={detail.status} />
                                    <span className="text-xs text-muted-foreground">• Received {timeAgo(detail.receivedAt)}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 my-2">
                                <Card className="p-4 bg-muted/30 border-muted">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">
                                        Associated Request
                                    </div>
                                    <div className="font-mono text-sm font-bold text-brand-700 dark:text-gold-300">
                                        {detail.request?.referenceNo}
                                    </div>
                                    <div className="text-sm font-medium">{detail.request?.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Deadline: {fmtDate(detail.request?.deadline)}
                                    </div>
                                </Card>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Card className="p-3.5">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Supplier Details</div>
                                        <div className="text-sm font-semibold text-foreground">{detail.supplier?.legalName}</div>
                                        {detail.supplier?.tradeName && (
                                            <div className="text-xs text-muted-foreground">{detail.supplier?.tradeName}</div>
                                        )}
                                        {detail.supplier?.phone && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <PhoneCall className="h-3 w-3" /> {detail.supplier?.phone}
                                            </div>
                                        )}
                                    </Card>
                                    <Card className="p-3.5">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Quotation Metadata</div>
                                        <div className="text-sm font-semibold text-foreground">
                                            Total: {detail.totalAmount != null ? `${fmtMoney(detail.totalAmount)} ${detail.currency || "ETB"}` : "Unpriced Document"}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            Received: {fmtDate(detail.receivedAt)}
                                        </div>
                                    </Card>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                            Priced Line Items
                                        </div>
                                        {userCan(user, "proformas.review") && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={savePricing} disabled={savingItems}>
                                                {savingItems && <Spinner className="h-3 w-3 mr-1" />}
                                                Save Pricing
                                            </Button>
                                        )}
                                    </div>
                                    <ItemRows
                                        rows={itemsDraft}
                                        setRows={setItemsDraft}
                                        requestItems={detailFull?.request?.items || []}
                                        disabled={!userCan(user, "proformas.review")}
                                        currency={detailFull?.currency || "ETB"}
                                    />
                                </div>

                                {detail.filePath ? (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                                            Attachment Document
                                        </div>
                                        <Card className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="grid place-items-center h-11 w-11 rounded-lg bg-gold-50 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 shrink-0">
                                                    <FileIcon type={detail.fileType} large />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium truncate">{detail.fileName}</div>
                                                    <div className="text-xs text-muted-foreground">{detail.fileType}</div>
                                                </div>
                                                <a href={`/${detail.filePath}`} target="_blank" rel="noopener noreferrer">
                                                    <Button size="sm" variant="outline">
                                                        <Download className="h-3.5 w-3.5 mr-1" />
                                                        Download
                                                    </Button>
                                                </a>
                                            </div>
                                            {detail.fileType?.startsWith("image/") && (
                                                <div className="mt-3 rounded-xl overflow-hidden border bg-muted/20">
                                                    <img
                                                        src={`/${detail.filePath}`}
                                                        alt={detail.fileName || "proforma"}
                                                        className="w-full h-auto max-h-[450px] object-contain mx-auto"
                                                    />
                                                </div>
                                            )}
                                            {detail.fileType === "application/pdf" && (
                                                <div className="mt-3 rounded-xl overflow-hidden border h-96 bg-muted/20">
                                                    <iframe
                                                        src={`/${detail.filePath}`}
                                                        className="w-full h-full"
                                                        title="Proforma PDF"
                                                    />
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                                            Supplier Message
                                        </div>
                                        <Card className="p-4">
                                            <p className="text-sm whitespace-pre-wrap">{detail.message || "(no message text)"}</p>
                                        </Card>
                                    </div>
                                )}

                                {detail.filePath && detail.message && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-semibold">
                                            Caption / Message
                                        </div>
                                        <Card className="p-3 bg-muted/30">
                                            <p className="text-sm whitespace-pre-wrap">{detail.message}</p>
                                        </Card>
                                    </div>
                                )}

                                <div>
                                    <Label className="text-xs font-medium mb-1.5 block">Internal Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Add review notes…"
                                    />
                                    <Button size="sm" variant="outline" className="mt-2" onClick={saveNotes}>
                                        Save Notes
                                    </Button>
                                </div>

                                {userCan(user, "proformas.review") && (
                                    <div className="pt-3 border-t">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                                            Update Status
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button
                                                variant={detail.status === "reviewed" ? "default" : "outline"}
                                                onClick={() => setStatus("reviewed")}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Reviewed
                                            </Button>
                                            <Button
                                                variant={detail.status === "accepted" ? "default" : "outline"}
                                                onClick={() => setStatus("accepted")}
                                                className={detail.status === "accepted" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Accept
                                            </Button>
                                            <Button
                                                variant={detail.status === "rejected" ? "default" : "outline"}
                                                onClick={() => setStatus("rejected")}
                                                className={cn(detail.status === "rejected" && "bg-rose-600 text-white hover:bg-rose-700")}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            <Spinner className="h-6 w-6 inline mr-2" />
                            Loading details…
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manual entry dialog */}
            <ManualEntryDialog
                open={manualOpen}
                onOpenChange={setManualOpen}
                suppliers={suppliers}
                onDone={() => {
                    setManualOpen(false);
                    load();
                }}
            />

            {/* Compare dialog */}
            <CompareDialog
                open={compareOpen}
                onOpenChange={setCompareOpen}
                proformas={compareProformas}
                onClear={() => setCompareIds([])}
                onReload={load}
                onView={(p) => {
                    setCompareOpen(false);
                    openDetail(p);
                }}
            />
        </div>
    );
}

function ItemRows({ rows, setRows, requestItems, disabled, currency = "ETB" }) {
    const addFromRequest = () => {
        const existingNames = new Set(rows.map((r) => r.itemName));
        const toAdd = (requestItems || [])
            .filter((ri) => !existingNames.has(ri.itemName))
            .map((ri) => ({ itemName: ri.itemName, quantity: Number(ri.quantity) || 1, unit: ri.unit || "pcs", unitPrice: 0 }));
        if (toAdd.length === 0) return;
        setRows([...rows, ...toAdd]);
    };
    const addBlank = () => setRows([...rows, { itemName: "", quantity: 1, unit: "pcs", unitPrice: 0 }]);
    const updateRow = (i, patch) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
    const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0);

    if (disabled && rows.length === 0) {
        return <div className="text-xs text-muted-foreground italic">No structured pricing entered for this proforma.</div>;
    }

    return (
        <div className="space-y-2">
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-xs min-w-[420px]">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-2 py-1.5 font-medium">Item</th>
                            <th className="text-right px-2 py-1.5 font-medium w-14">Qty</th>
                            <th className="text-left px-2 py-1.5 font-medium w-16">Unit</th>
                            <th className="text-right px-2 py-1.5 font-medium w-24">Unit Price</th>
                            <th className="text-right px-2 py-1.5 font-medium w-24">Line Total</th>
                            {!disabled && <th className="w-7" />}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={disabled ? 5 : 6} className="px-2 py-3 text-center text-muted-foreground">
                                    No items yet.
                                </td>
                            </tr>
                        )}
                        {rows.map((r, i) => (
                            <tr key={i} className="border-t border-border">
                                <td className="px-2 py-1">
                                    {disabled ? (
                                        r.itemName
                                    ) : (
                                        <input
                                            value={r.itemName}
                                            onChange={(e) => updateRow(i, { itemName: e.target.value })}
                                            className="w-full bg-transparent outline-none"
                                            placeholder="Item name"
                                        />
                                    )}
                                </td>
                                <td className="px-2 py-1 text-right">
                                    {disabled ? (
                                        r.quantity
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            value={r.quantity}
                                            onChange={(e) => updateRow(i, { quantity: e.target.value })}
                                            className="w-full bg-transparent outline-none text-right"
                                        />
                                    )}
                                </td>
                                <td className="px-2 py-1">
                                    {disabled ? (
                                        r.unit
                                    ) : (
                                        <input
                                            value={r.unit || ""}
                                            onChange={(e) => updateRow(i, { unit: e.target.value })}
                                            className="w-full bg-transparent outline-none"
                                        />
                                    )}
                                </td>
                                <td className="px-2 py-1 text-right">
                                    {disabled ? (
                                        fmtMoney(r.unitPrice)
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={r.unitPrice}
                                            onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                                            className="w-full bg-transparent outline-none text-right"
                                        />
                                    )}
                                </td>
                                <td className="px-2 py-1 text-right tabular-nums">
                                    {fmtMoney((Number(r.quantity) || 0) * (Number(r.unitPrice) || 0))}
                                </td>
                                {!disabled && (
                                    <td className="px-1 text-center">
                                        <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-border bg-muted/30 font-medium">
                                <td colSpan={4} className="px-2 py-1.5 text-right">
                                    Total ({currency})
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums">{fmtMoney(total)}</td>
                                {!disabled && <td />}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
            {!disabled && (
                <div className="flex gap-2 flex-wrap">
                    {requestItems?.length > 0 && (
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addFromRequest}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add request items
                        </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addBlank}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add row
                    </Button>
                </div>
            )}
        </div>
    );
}

function FileIcon({ type, large }) {
    const s = large ? "h-6 w-6" : "h-4 w-4";
    if (type?.startsWith("image/")) return <FileImage className={s} />;
    if (type === "application/pdf") return <FileText className={s} />;
    return <File className={s} />;
}

function CompareDialog({ open, onOpenChange, proformas, onClear, onView, onReload }) {
    const [viewMode, setViewMode] = useState("unit"); // 'unit' | 'total'
    const [editingTotalId, setEditingTotalId] = useState(null);
    const [tempTotalVal, setTempTotalVal] = useState("");
    const [savingTotal, setSavingTotal] = useState(false);
    const { toast } = useToast();

    const saveTotal = async (proformaId) => {
        const num = parseFloat(tempTotalVal);
        if (isNaN(num) || num < 0) return;
        setSavingTotal(true);
        try {
            await api(`/api/proformas/${proformaId}`, {
                method: "PATCH",
                body: JSON.stringify({ total_amount: num }),
            });
            toast({ title: "Total amount saved" });
            setEditingTotalId(null);
            if (typeof onReload === "function") {
                onReload();
            }
        } catch (e) {
            toast({ title: "Failed to save total", description: e.message, variant: "destructive" });
        } finally {
            setSavingTotal(false);
        }
    };

    const itemNames = useMemo(() => {
        const seen = [];
        const set = new Set();
        for (const p of proformas) {
            for (const item of p.items || []) {
                if (item.itemName && !set.has(item.itemName)) {
                    set.add(item.itemName);
                    seen.push(item.itemName);
                }
            }
            for (const item of p.request?.items || []) {
                if (item.itemName && !set.has(item.itemName)) {
                    set.add(item.itemName);
                    seen.push(item.itemName);
                }
            }
        }
        return seen;
    }, [proformas]);

    const itemDetails = useMemo(() => {
        const map = {};
        for (const name of itemNames) {
            let sample = null;
            for (const p of proformas) {
                const found = (p.items || []).find((i) => i.itemName === name) ||
                    (p.request?.items || []).find((i) => i.itemName === name);
                if (found) {
                    sample = found;
                    break;
                }
            }
            map[name] = {
                quantity: sample?.quantity || 1,
                unit: sample?.unit || "pcs",
            };
        }
        return map;
    }, [itemNames, proformas]);

    const bestPricePerItem = useMemo(() => {
        const map = {};
        for (const name of itemNames) {
            let min = null;
            for (const p of proformas) {
                const item = (p.items || []).find((i) => i.itemName === name);
                if (item && item.unitPrice != null && (min === null || Number(item.unitPrice) < min)) {
                    min = Number(item.unitPrice);
                }
            }
            map[name] = min;
        }
        return map;
    }, [itemNames, proformas]);

    const averagePricePerItem = useMemo(() => {
        const map = {};
        for (const name of itemNames) {
            let sum = 0;
            let count = 0;
            for (const p of proformas) {
                const item = (p.items || []).find((i) => i.itemName === name);
                if (item && item.unitPrice != null) {
                    sum += Number(item.unitPrice);
                    count++;
                }
            }
            map[name] = count > 0 ? sum / count : 0;
        }
        return map;
    }, [itemNames, proformas]);

    const pricedProformas = useMemo(
        () => proformas.filter((p) => p.totalAmount != null && Number(p.totalAmount) > 0),
        [proformas]
    );

    const winner = useMemo(() => {
        if (!pricedProformas.length) return null;
        let best = pricedProformas[0];
        for (const p of pricedProformas) {
            if (Number(p.totalAmount) < Number(best.totalAmount)) {
                best = p;
            }
        }
        const avg =
            pricedProformas.reduce((s, p) => s + Number(p.totalAmount), 0) /
            pricedProformas.length;
        const savings = avg - Number(best.totalAmount);
        const savingsPercent = avg > 0 ? ((savings / avg) * 100).toFixed(1) : 0;

        return {
            proforma: best,
            savings: savings > 0 ? savings : 0,
            savingsPercent: savingsPercent > 0 ? savingsPercent : 0,
            otherCount: pricedProformas.length - 1,
        };
    }, [pricedProformas]);

    const exportCsv = () => {
        const header = ["Item", "Qty", "Unit", ...proformas.map((p) => p.supplier.legalName)];
        const lines = [header];
        for (const name of itemNames) {
            const details = itemDetails[name] || {};
            const row = [name, details.quantity || 1, details.unit || "pcs"];
            for (const p of proformas) {
                const item = (p.items || []).find((i) => i.itemName === name);
                if (item) {
                    const price = Number(item.unitPrice) || 0;
                    row.push(viewMode === "unit" ? price : price * (details.quantity || 1));
                } else {
                    row.push(p.filePath ? "Document Quote" : "");
                }
            }
            lines.push(row);
        }
        lines.push(["Total Cost", "", "", ...proformas.map((p) => (p.totalAmount != null ? p.totalAmount : ""))]);
        const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `proforma-comparison-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl w-[95vw] max-h-[92vh] overflow-y-auto">
                <DialogHeader className="kaldi-no-print">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Columns3 className="h-5 w-5 text-brand-600 dark:text-gold-400" />
                        Proforma Side-by-Side Comparison
                    </DialogTitle>
                    <DialogDescription>
                        Comparing {proformas.length} proforma quotation{proformas.length === 1 ? "" : "s"} across line items, totals, and supplier terms.
                    </DialogDescription>
                </DialogHeader>

                {proformas.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        Select up to 4 proformas using the compare icon on each card to view side-by-side pricing.
                    </div>
                ) : (
                    <div className="kaldi-print-area space-y-6">
                        {/* Winner Recommendation Highlight Banner */}
                        {winner && (
                            <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/80 p-4 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:from-emerald-950/40 dark:to-emerald-900/20 shadow-sm kaldi-no-print">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="grid place-items-center h-10 w-10 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 shrink-0 shadow-md">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                                    Lowest Quoted Winner
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-semibold dark:bg-emerald-900 dark:text-emerald-200">
                                                    Best Value
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                                {winner.proforma.supplier.legalName}
                                            </h3>
                                            {winner.savings > 0 && winner.otherCount > 0 && (
                                                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                                    💡 Total Quoted Cost: <b>{fmtMoney(winner.proforma.totalAmount)} {winner.proforma.currency || "ETB"}</b> (Saves approx. {fmtMoney(winner.savings)} {winner.proforma.currency || "ETB"} / {winner.savingsPercent}% vs average).
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 self-start sm:self-center"
                                        onClick={() => onView(winner.proforma)}
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        Review Winner Proforma
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* View Mode Controls */}
                        {itemNames.length > 0 && (
                            <div className="flex items-center justify-between gap-3 flex-wrap kaldi-no-print border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">Matrix Display Mode:</span>
                                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("unit")}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                                viewMode === "unit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Unit Prices
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("total")}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                                viewMode === "total" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Line Totals (Qty x Unit)
                                        </button>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    💡 Green highlights represent the best price per item.
                                </span>
                            </div>
                        )}

                        {/* Matrix Table */}
                        {itemNames.length > 0 ? (
                            <div className="border rounded-xl overflow-x-auto bg-card shadow-sm">
                                <table className="w-full text-xs sm:text-sm min-w-[650px] border-collapse">
                                    <thead>
                                        <tr className="bg-muted/60 border-b border-border">
                                            <th className="text-left px-3 py-3 font-semibold text-foreground w-1/3">
                                                Requested Line Item
                                            </th>
                                            {proformas.map((p) => {
                                                const isWinner = winner?.proforma?.id === p.id;
                                                return (
                                                    <th
                                                        key={p.id}
                                                        className={cn(
                                                            "text-right px-3 py-3 font-semibold whitespace-nowrap border-l border-border/50",
                                                            isWinner && "bg-emerald-50/50 dark:bg-emerald-950/30"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-foreground truncate max-w-[160px]">
                                                                {p.supplier.legalName}
                                                            </span>
                                                            <span className="text-[11px] font-normal text-muted-foreground">
                                                                {p.request.referenceNo}
                                                            </span>
                                                            {p.filePath && (
                                                                <a
                                                                    href={`/${p.filePath}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[10px] text-brand-600 hover:underline mt-0.5 font-normal"
                                                                    title={p.fileName || "View Quotation File"}
                                                                >
                                                                    <Paperclip className="h-3 w-3" />
                                                                    <span className="truncate max-w-[110px]">{p.fileName || "Attached Quote"}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {itemNames.map((name) => {
                                            const details = itemDetails[name] || {};
                                            const avg = averagePricePerItem[name] || 0;

                                            return (
                                                <tr key={name} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2.5">
                                                        <div className="font-medium text-foreground">{name}</div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Qty: {details.quantity} {details.unit}
                                                        </div>
                                                    </td>
                                                    {proformas.map((p) => {
                                                        const item = (p.items || []).find((i) => i.itemName === name);
                                                        const unitPrice = item ? Number(item.unitPrice) : null;
                                                        const lineTotal = unitPrice != null ? unitPrice * (details.quantity || 1) : null;
                                                        const isBest = unitPrice != null && unitPrice === bestPricePerItem[name];
                                                        const displayVal = viewMode === "unit" ? unitPrice : lineTotal;

                                                        const diffVsAvg =
                                                            unitPrice != null && avg > 0
                                                                ? (((unitPrice - avg) / avg) * 100).toFixed(0)
                                                                : null;

                                                        return (
                                                            <td
                                                                key={p.id}
                                                                className={cn(
                                                                    "px-3 py-2.5 text-right tabular-nums border-l border-border/40",
                                                                    isBest &&
                                                                        "bg-emerald-50/90 text-emerald-950 font-semibold dark:bg-emerald-950/70 dark:text-emerald-200"
                                                                )}
                                                            >
                                                                {displayVal != null ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <div className="flex items-center gap-1 font-mono">
                                                                            {isBest && (
                                                                                <Trophy className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                            )}
                                                                            <span>{fmtMoney(displayVal)}</span>
                                                                        </div>
                                                                        {diffVsAvg != null && (
                                                                            <span
                                                                                className={cn(
                                                                                    "text-[10px]",
                                                                                    Number(diffVsAvg) < 0
                                                                                        ? "text-emerald-600 font-medium dark:text-emerald-400"
                                                                                        : Number(diffVsAvg) > 0
                                                                                        ? "text-rose-500"
                                                                                        : "text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {Number(diffVsAvg) <= 0 ? `${diffVsAvg}%` : `+${diffVsAvg}%`} vs avg
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : p.filePath ? (
                                                                    <div className="flex flex-col items-end text-muted-foreground">
                                                                        <span className="text-[10px] italic">Document Quote</span>
                                                                        <a
                                                                            href={`/${p.filePath}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[10px] text-brand-600 hover:underline inline-flex items-center gap-0.5"
                                                                        >
                                                                            <Download className="h-3 w-3" /> View File
                                                                        </a>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground/40">—</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-border bg-muted/50 font-bold">
                                            <td className="px-3 py-3 text-foreground">
                                                Total Quoted Cost
                                            </td>
                                            {proformas.map((p) => {
                                                const isWinner = winner?.proforma?.id === p.id;
                                                const pricedCount = (p.items || []).filter((i) => i.unitPrice != null).length;

                                                return (
                                                    <td
                                                        key={p.id}
                                                        className={cn(
                                                            "px-3 py-3 text-right tabular-nums border-l border-border/50",
                                                            isWinner && "bg-emerald-100/70 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1 font-mono text-sm font-bold text-brand-700 dark:text-gold-300">
                                                                {isWinner && <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                                                                {p.totalAmount != null ? (
                                                                    `${fmtMoney(p.totalAmount)} ${p.currency || "ETB"}`
                                                                ) : editingTotalId === p.id ? (
                                                                    <div className="flex items-center gap-1 kaldi-no-print">
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Total ETB"
                                                                            className="h-7 w-24 text-xs font-normal"
                                                                            value={tempTotalVal}
                                                                            onChange={(e) => setTempTotalVal(e.target.value)}
                                                                        />
                                                                        <Button size="sm" className="h-7 px-2 text-xs" disabled={savingTotal} onClick={() => saveTotal(p.id)}>
                                                                            {savingTotal ? <Spinner className="h-3 w-3" /> : "Save"}
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 text-xs text-brand-600 hover:text-brand-700 dark:text-gold-400 border-dashed kaldi-no-print"
                                                                        onClick={() => {
                                                                            setEditingTotalId(p.id);
                                                                            setTempTotalVal(p.totalAmount || "");
                                                                        }}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Track Total
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-normal text-muted-foreground">
                                                                {p.items?.length ? `${pricedCount}/${itemNames.length} items priced` : p.filePath ? "📄 Document Quote" : "No items priced"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground border rounded-xl p-5 bg-muted/20 text-center">
                                💡 Select proformas with line items or attached PDF/photo quotations to compare them side-by-side.
                            </div>
                        )}

                        {/* Supplier Summary Cards */}
                        <div
                            className="grid gap-4 kaldi-no-print"
                            style={{ gridTemplateColumns: `repeat(${Math.min(proformas.length, 4)}, minmax(0, 1fr))` }}
                        >
                            {proformas.map((p) => {
                                const isWinner = winner?.proforma?.id === p.id;
                                return (
                                    <Card
                                        key={p.id}
                                        className={cn(
                                            "p-4 flex flex-col transition-all",
                                            isWinner && "ring-2 ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <ReceivedViaBadge via={p.receivedVia} />
                                            <ProformaStatusBadge status={p.status} />
                                        </div>
                                        <div className="font-semibold text-sm mb-0.5 truncate">{p.supplier.legalName}</div>
                                        <div className="text-xs text-muted-foreground mb-3 truncate">{p.request.referenceNo}</div>

                                        <div className="space-y-1.5 text-xs text-muted-foreground flex-1">
                                            <div>
                                                <span className="font-medium text-foreground">Received:</span> {fmtDate(p.receivedAt)}
                                            </div>
                                            {p.supplier.paymentTerms && (
                                                <div className="truncate">
                                                    <span className="font-medium text-foreground">Terms:</span> {p.supplier.paymentTerms}
                                                </div>
                                            )}
                                            {p.fileName && (
                                                <div className="flex items-center gap-1 truncate text-foreground">
                                                    <File className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                                                    <span className="truncate">{p.fileName}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-3 border-t flex gap-1.5">
                                            {p.filePath && (
                                                <a href={`/${p.filePath}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                    <Button size="sm" variant="outline" className="w-full text-xs">
                                                        <Download className="h-3.5 w-3.5" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onView(p)}>
                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                View
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                <DialogFooter className="kaldi-no-print">
                    <Button variant="outline" onClick={onClear}>
                        Clear selection
                    </Button>
                    {proformas.length > 0 && (
                        <>
                            <Button variant="outline" onClick={exportCsv}>
                                <FileSpreadsheet className="h-4 w-4 mr-1" />
                                Export CSV
                            </Button>
                            <Button variant="outline" onClick={() => window.print()}>
                                <Printer className="h-4 w-4 mr-1" />
                                Print / Save PDF
                            </Button>
                        </>
                    )}
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ManualEntryDialog({ open, onOpenChange, suppliers, onDone }) {
    const { toast } = useToast();
    const [supplierId, setSupplierId] = useState("");
    const [availableRequests, setAvailableRequests] = useState([]);
    const [requestId, setRequestId] = useState("");
    const [requestItems, setRequestItems] = useState([]);
    const [message, setMessage] = useState("");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            setSupplierId(""); setRequestId(""); setMessage(""); setNotes(""); setFile(null); setItems([]);
        }
    }, [open]);

    useEffect(() => {
        if (!supplierId) {
            setAvailableRequests([]);
            setRequestId("");
            return;
        }
        api(`/api/proforma-requests?status=sent`).then((reqs) => {
            const open = reqs.filter((r) => !r.respondedSupplierIds.includes(supplierId));
            setAvailableRequests(open);
            setRequestId(open[0]?.id || "");
        }).catch(() => {});
    }, [supplierId]);

    useEffect(() => {
        if (!requestId) {
            setRequestItems([]);
            return;
        }
        api(`/api/proforma-requests/${requestId}`).then((r) => setRequestItems(r.items || [])).catch(() => setRequestItems([]));
    }, [requestId]);

    const submit = async () => {
        if (!supplierId || !requestId) {
            toast({ title: "Select a supplier and request", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const form = new FormData();
            form.append("supplierId", supplierId);
            form.append("requestId", requestId);
            if (message.trim()) form.append("message", message.trim());
            if (notes.trim()) form.append("notes", notes.trim());
            if (file) form.append("file", file);
            items
                .filter((r) => r.itemName?.trim())
                .forEach((r, i) => {
                    form.append(`items[${i}][itemName]`, r.itemName);
                    form.append(`items[${i}][quantity]`, String(Number(r.quantity) || 0));
                    form.append(`items[${i}][unit]`, r.unit || "pcs");
                    form.append(`items[${i}][unitPrice]`, String(Number(r.unitPrice) || 0));
                });

            const res = await fetch("/api/proformas/manual", {
                method: "POST",
                body: form,
                credentials: "same-origin",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || j.message || `Request failed (${res.status})`);
            }

            toast({ title: "Response logged", description: "Recorded as a manual proforma." });
            onDone();
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PhoneCall className="h-5 w-5 text-brand-600" />
                        Log Manual Response
                    </DialogTitle>
                    <DialogDescription>
                        Record a proforma a supplier sent outside Telegram — by phone, email, or in person.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">Supplier *</Label>
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a supplier…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.legalName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">Request *</Label>
                            <Select value={requestId} onValueChange={setRequestId} disabled={!supplierId || availableRequests.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={supplierId ? "Choose a request…" : "Select supplier first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRequests.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.referenceNo} — {r.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Line Items</Label>
                        <ItemRows rows={items} setRows={setItems} requestItems={requestItems} disabled={false} />
                    </div>

                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Message / Quote Summary</Label>
                        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="What the supplier quoted…" />
                    </div>

                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Attachment (optional)</Label>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors">
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate text-muted-foreground">{file ? file.name : "Attach a PDF, image, or document…"}</span>
                                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" />
                            </label>
                            {file && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Internal Notes</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How this was received, who took the call…" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={saving || !supplierId || !requestId}>
                        {saving && <Spinner className="h-4 w-4 mr-1" />}
                        Log Response
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ProformasView;
