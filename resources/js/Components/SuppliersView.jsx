import { useEffect, useState, useCallback } from "react";
import {
    Building2,
    Plus,
    Search,
    ChevronDown,
    Pencil,
    Trash2,
    Phone,
    Mail,
    CheckCircle2,
    FileCheck,
    XCircle,
    Link2,
    Building,
    Hash,
    CreditCard,
    StickyNote,
    FileSpreadsheet,
    Tag,
    X,
    Paperclip,
    Download,
    CheckSquare,
    Square,
    ShieldCheck,
    Ban,
    PlayCircle,
    Upload,
} from "lucide-react";
import { SupplierImportModal } from "./SupplierImportModal.jsx";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Textarea } from "./ui/textarea.jsx";
import { Badge } from "./ui/badge.jsx";
import { Skeleton } from "./ui/skeleton.jsx";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog.jsx";
import { Pagination } from "./ui/pagination.jsx";
import { api, apiPaged, userCan } from "../lib/procurement";
import { downloadCsv } from "../lib/csv";
import { VerificationBadge } from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

const EMPTY_FORM = {
    legalName: "",
    tradeName: "",
    tradeLicenseNo: "",
    tin: "",
    vatNo: "",
    categoryTags: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    paymentTerms: "",
    bankDetails: "",
    notes: "",
    verificationStatus: "unverified",
};

export function SuppliersView() {
    const [suppliers, setSuppliers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [linkedFilter, setLinkedFilter] = useState("all");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [definedCategories, setDefinedCategories] = useState([]);
    const [catSearch, setCatSearch] = useState("");
    const [catDropdownOpen, setCatDropdownOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [user, setUser] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        api("/api/auth/me")
            .then((d) => setUser(d.user))
            .catch(() => {});
    }, []);

    const loadCategories = useCallback(async () => {
        try {
            const data = await api("/api/categories");
            setDefinedCategories(data.categories || []);
        } catch {}
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const buildParams = useCallback(() => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (statusFilter !== "all") params.set("verificationStatus", statusFilter);
        if (linkedFilter !== "all") params.set("telegramLinked", linkedFilter);
        return params;
    }, [q, statusFilter, linkedFilter]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = buildParams();
            params.set("page", String(page));
            params.set("perPage", "20");
            const { data, meta: m } = await apiPaged(`/api/suppliers?${params.toString()}`);
            setSuppliers(data);
            setMeta(m);
            setSelectedIds([]);
        } catch (e) {
            toast({ title: "Failed to load suppliers", description: e.message, variant: "destructive" });
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
    }, [q, statusFilter, linkedFilter]);

    const exportCsv = async () => {
        try {
            const params = buildParams();
            const all = await api(`/api/suppliers?${params.toString()}`);
            downloadCsv(
                `suppliers-${Date.now()}.csv`,
                [
                    ["Legal Name", "Trade Name", "TIN", "Categories", "Contact", "Phone", "Email", "Verification", "Telegram Linked"],
                    ...all.map((s) => [
                        s.legalName, s.tradeName || "", s.tin || "", s.categoryTags || "",
                        s.contactName || "", s.contactPhone || "", s.contactEmail || "",
                        s.verificationStatus, s.telegramChatId ? "Yes" : "No",
                    ]),
                ],
            );
        } catch (e) {
            toast({ title: "Export failed", description: e.message, variant: "destructive" });
        }
    };

    const toggleSelected = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        setSelectedIds((prev) => (prev.length === suppliers.length ? [] : suppliers.map((s) => s.id)));
    };

    const bulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        setBulkBusy(true);
        try {
            const res = await api("/api/suppliers/bulk-action", {
                method: "POST",
                body: JSON.stringify({ ids: selectedIds, action }),
            });
            toast({
                title: action === "delete"
                    ? `Deleted ${res.count} supplier(s)`
                    : `Updated ${res.count} supplier(s)`
            });
            setSelectedIds([]);
            setBulkDeleteOpen(false);
            await load();
        } catch (e) {
            toast({ title: "Bulk action failed", description: e.message, variant: "destructive" });
        } finally {
            setBulkBusy(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setForm({
            legalName: s.legalName,
            tradeName: s.tradeName || "",
            tradeLicenseNo: s.tradeLicenseNo || "",
            tin: s.tin || "",
            vatNo: s.vatNo || "",
            categoryTags: s.categoryTags || "",
            contactName: s.contactName || "",
            contactPhone: s.contactPhone || "",
            contactEmail: s.contactEmail || "",
            paymentTerms: s.paymentTerms || "",
            bankDetails: s.bankDetails || "",
            notes: s.notes || "",
            verificationStatus: s.verificationStatus,
        });
        setFormOpen(true);
    };

    const save = async () => {
        if (!form.legalName.trim()) {
            toast({ title: "Legal name is required", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await api(`/api/suppliers/${editing.id}`, {
                    method: "PUT",
                    body: JSON.stringify(form),
                });
                toast({ title: "Supplier updated", description: form.legalName });
            } else {
                await api("/api/suppliers", { method: "POST", body: JSON.stringify(form) });
                toast({ title: "Supplier created", description: form.legalName });
            }
            setFormOpen(false);
            await load();
        } catch (e) {
            toast({ title: "Save failed", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const setVerification = async (s, status) => {
        try {
            await api(`/api/suppliers/${s.id}/verify`, {
                method: "POST",
                body: JSON.stringify({ status }),
            });
            toast({
                title: "Verification updated",
                description: `${s.legalName} → ${status.replace("_", " ")}`,
            });
            await load();
            if (detail?.id === s.id) {
                setDetail({ ...s, verificationStatus: status });
            }
        } catch (e) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" });
            toast({ title: "Supplier deleted", description: deleteTarget.legalName });
            setDeleteTarget(null);
            await load();
        } catch (e) {
            toast({ title: "Delete failed", description: e.message, variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    const openDetail = async (s) => {
        setDetailOpen(true);
        setDetail(s);
        try {
            const full = await api(`/api/suppliers/${s.id}`);
            setDetail(full);
        } catch {}
    };

    const colCount = userCan(user, "suppliers.manage") ? 8 : 7;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, TIN, contact…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Verification" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="documents_received">Docs received</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={linkedFilter} onValueChange={setLinkedFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Telegram" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All suppliers</SelectItem>
                        <SelectItem value="true">Telegram linked</SelectItem>
                        <SelectItem value="false">Not linked</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportCsv} className="shrink-0">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Export CSV
                </Button>
                {userCan(user, "suppliers.import") && (
                    <Button variant="outline" onClick={() => setImportOpen(true)} className="shrink-0 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                        <Upload className="h-4 w-4 mr-1" />
                        Import Excel
                    </Button>
                )}
                {userCan(user, "suppliers.manage") && (
                    <Button variant="outline" onClick={() => setCategoriesOpen(true)} className="shrink-0">
                        <Tag className="h-4 w-4 mr-1" />
                        Categories
                    </Button>
                )}
                {userCan(user, "suppliers.manage") && (
                    <Button onClick={openCreate} className="shrink-0">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Supplier
                    </Button>
                )}
            </div>

            {/* Bulk action bar */}
            {userCan(user, "suppliers.manage") && selectedIds.length > 0 && (
                <Card className="p-3 flex flex-wrap items-center gap-2 bg-brand-50/60 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800">
                    <span className="text-sm font-medium mr-1">{selectedIds.length} selected</span>
                    {userCan(user, "suppliers.verify") && (
                        <>
                            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("verify")}>
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                Verify
                            </Button>
                            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("documents_received")}>
                                <FileCheck className="h-3.5 w-3.5 mr-1" />
                                Docs Received
                            </Button>
                            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("unverify")}>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Unverify
                            </Button>
                        </>
                    )}
                    <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("activate")}>
                        <PlayCircle className="h-3.5 w-3.5 mr-1" />
                        Activate
                    </Button>
                    <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkAction("deactivate")}>
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Deactivate
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:border-rose-900 font-medium"
                        disabled={bulkBusy}
                        onClick={() => setBulkDeleteOpen(true)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                        Delete Selected ({selectedIds.length})
                    </Button>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelectedIds([])}>
                        Clear
                    </Button>
                </Card>
            )}

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60 border-b border-border">
                            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                {userCan(user, "suppliers.manage") && (
                                    <th className="px-4 py-3 w-8">
                                        <button onClick={toggleSelectAll} className="flex items-center">
                                            {selectedIds.length === suppliers.length && suppliers.length > 0 ? (
                                                <CheckSquare className="h-4 w-4 text-brand-600" />
                                            ) : (
                                                <Square className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </th>
                                )}
                                <th className="px-4 py-3 font-medium">Supplier</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Contact</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">TIN</th>
                                <th className="px-4 py-3 font-medium">Verification</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">Telegram</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell text-center">Proformas</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border last:border-b-0">
                                        <td colSpan={colCount} className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-4 w-40" />
                                                <Skeleton className="h-4 w-20 hidden md:block" />
                                                <Skeleton className="h-4 w-24 hidden lg:block" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount}>
                                        <EmptyState
                                            icon={Building2}
                                            title="No suppliers found"
                                            description="Try adjusting your filters, or add a new supplier."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((s) => (
                                    <tr
                                        key={s.id}
                                        className={cn(
                                            "border-b border-border last:border-b-0 hover:bg-accent/40 cursor-pointer transition-colors",
                                            selectedIds.includes(s.id) && "bg-brand-50/50 dark:bg-brand-900/20"
                                        )}
                                        onClick={() => openDetail(s)}
                                    >
                                        {userCan(user, "suppliers.manage") && (
                                            <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelected(s.id); }}>
                                                {selectedIds.includes(s.id) ? (
                                                    <CheckSquare className="h-4 w-4 text-brand-600" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">{s.legalName}</div>
                                            {s.tradeName && (
                                                <div className="text-xs text-muted-foreground">{s.tradeName}</div>
                                            )}
                                            {s.categoryTags && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {s.categoryTags.split(",").slice(0, 2).map((t, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] py-0">
                                                            {t.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="text-xs">{s.contactName || "—"}</div>
                                            <div className="text-xs text-muted-foreground">{s.contactPhone || ""}</div>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs">
                                            {s.tin || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <VerificationBadge status={s.verificationStatus} />
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            {s.telegramChatId ? (
                                                <Badge variant="outline" className="gap-1 bg-cyan-50 text-cyan-700 border-cyan-200">
                                                    <Link2 className="h-3 w-3" />
                                                    Linked
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Not linked</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-center font-medium">
                                            {s.proformaCount}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                {userCan(user, "suppliers.manage") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEdit(s)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {userCan(user, "suppliers.manage") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-rose-600 hover:text-rose-700"
                                                        onClick={() => setDeleteTarget(s)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            <Pagination meta={meta} onPageChange={setPage} />

            <CategoriesDialog
                open={categoriesOpen}
                onOpenChange={setCategoriesOpen}
                onChange={loadCategories}
            />

            <SupplierImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                onSuccess={load}
            />

            {/* Create / Edit dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Building2 className="h-5 w-5 text-brand-600 dark:text-gold-400" />
                            {editing ? "Edit Supplier" : "Add New Supplier"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {editing
                                ? "Update supplier legal profile, categories, and contact information."
                                : "Register a new supplier to the procurement database."}
                        </DialogDescription>
                    </DialogHeader>

                    {(() => {
                        const selectedCategoryList = (form.categoryTags || "")
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);

                        const toggleCategoryTag = (catName) => {
                            let next;
                            if (selectedCategoryList.includes(catName)) {
                                next = selectedCategoryList.filter((c) => c !== catName);
                            } else {
                                next = [...selectedCategoryList, catName];
                            }
                            setForm({ ...form, categoryTags: next.join(", ") });
                        };

                        return (
                            <div className="space-y-4 py-2">
                                {/* Legal Company Name & Trade Name */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Field label="Legal Company Name *" required>
                                        <Input
                                            value={form.legalName}
                                            onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                                            placeholder="e.g. Biftu Coffee Exporters PLC"
                                        />
                                    </Field>
                                    <Field label="Trade Name / Brand">
                                        <Input
                                            value={form.tradeName}
                                            onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                                            placeholder="e.g. Biftu Coffee"
                                        />
                                    </Field>
                                </div>

                                {/* Trade License, TIN, VAT */}
                                <div className="grid sm:grid-cols-3 gap-3">
                                    <Field label="Trade License No.">
                                        <Input
                                            value={form.tradeLicenseNo}
                                            onChange={(e) => setForm({ ...form, tradeLicenseNo: e.target.value })}
                                            placeholder="License No."
                                        />
                                    </Field>
                                    <Field label="TIN Number">
                                        <Input
                                            value={form.tin}
                                            onChange={(e) => setForm({ ...form, tin: e.target.value })}
                                            placeholder="TIN Number"
                                        />
                                    </Field>
                                    <Field label="VAT Number">
                                        <Input
                                            value={form.vatNo}
                                            onChange={(e) => setForm({ ...form, vatNo: e.target.value })}
                                            placeholder="VAT Number"
                                        />
                                    </Field>
                                </div>

                                {/* Defined Category & Searchable Picker */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">
                                            Supplier Categories <span className="text-rose-500">*</span>
                                        </Label>
                                        {userCan(user, "suppliers.manage") && (
                                            <button
                                                type="button"
                                                className="text-xs text-brand-600 dark:text-gold-400 hover:underline flex items-center gap-1"
                                                onClick={() => setCategoriesOpen(true)}
                                            >
                                                <Plus className="h-3 w-3" /> Manage Categories
                                            </button>
                                        )}
                                    </div>

                                    {/* Selected Badges */}
                                    {selectedCategoryList.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pb-1">
                                            {selectedCategoryList.map((cat) => (
                                                <Badge
                                                    key={cat}
                                                    variant="secondary"
                                                    className="px-2 py-0.5 text-xs bg-brand-50 text-brand-700 dark:bg-gold-950 dark:text-gold-300 border border-brand-200 dark:border-gold-800 flex items-center gap-1"
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {cat}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCategoryTag(cat)}
                                                        className="hover:text-rose-600 rounded-full"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Searchable Dropdown */}
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                            <Input
                                                placeholder="Search & select category..."
                                                value={catSearch}
                                                onChange={(e) => {
                                                    setCatSearch(e.target.value);
                                                    setCatDropdownOpen(true);
                                                }}
                                                onFocus={() => setCatDropdownOpen(true)}
                                                className="pl-8 pr-8 h-9 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {catDropdownOpen && (
                                            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-card border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-border">
                                                {definedCategories.filter((c) =>
                                                    c.name.toLowerCase().includes(catSearch.toLowerCase())
                                                ).length === 0 ? (
                                                    <div className="p-2.5 text-xs text-muted-foreground text-center">
                                                        No matching category found.
                                                    </div>
                                                ) : (
                                                    definedCategories
                                                        .filter((c) =>
                                                            c.name.toLowerCase().includes(catSearch.toLowerCase())
                                                        )
                                                        .map((c) => {
                                                            const isSelected = selectedCategoryList.includes(c.name);
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    type="button"
                                                                    onClick={() => toggleCategoryTag(c.name)}
                                                                    className={cn(
                                                                        "w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors",
                                                                        isSelected
                                                                            ? "bg-brand-50 font-medium text-brand-800 dark:bg-gold-950 dark:text-gold-300"
                                                                            : "hover:bg-accent/50 text-foreground"
                                                                    )}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <Tag className="h-3 w-3 opacity-60" />
                                                                        {c.name}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 dark:text-gold-400" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Verification Status & Payment Terms */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Field label="Verification Status">
                                        <Select
                                            value={form.verificationStatus}
                                            onValueChange={(v) => setForm({ ...form, verificationStatus: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unverified">Unverified</SelectItem>
                                                <SelectItem value="documents_received">Documents Received</SelectItem>
                                                <SelectItem value="verified">Verified (Can receive RFQs)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Payment Terms">
                                        <Input
                                            value={form.paymentTerms}
                                            onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                                            placeholder="e.g. 30 days net"
                                        />
                                    </Field>
                                </div>

                                {/* Contact Person, Phone, Email */}
                                <div className="grid sm:grid-cols-3 gap-3 pt-1 border-t">
                                    <Field label="Contact Person">
                                        <Input
                                            value={form.contactName}
                                            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                                            placeholder="Full name"
                                        />
                                    </Field>
                                    <Field label="Contact Phone">
                                        <Input
                                            value={form.contactPhone}
                                            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                                            placeholder="+251 9..."
                                        />
                                    </Field>
                                    <Field label="Contact Email">
                                        <Input
                                            type="email"
                                            value={form.contactEmail}
                                            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                                            placeholder="email@supplier.com"
                                        />
                                    </Field>
                                </div>

                                {/* Bank Account & Notes */}
                                <div className="space-y-3 pt-1 border-t">
                                    <Field label="Bank Account Details">
                                        <Input
                                            value={form.bankDetails}
                                            onChange={(e) => setForm({ ...form, bankDetails: e.target.value })}
                                            placeholder="Bank name and account number..."
                                        />
                                    </Field>
                                    <Field label="Internal Notes">
                                        <Textarea
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            rows={2}
                                            placeholder="Special remarks..."
                                        />
                                    </Field>
                                </div>
                            </div>
                        );
                    })()}

                    <DialogFooter className="pt-3 border-t">
                        <Button variant="outline" onClick={() => setFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={save}
                            disabled={saving}
                            className="bg-brand-600 hover:bg-brand-700 dark:bg-gold-500 dark:hover:bg-gold-600 dark:text-slate-950 font-medium"
                        >
                            {saving && <Spinner className="h-4 w-4 mr-1.5" />}
                            {editing ? "Save Changes" : "Register Supplier"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
                    {detail && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <Building className="h-5 w-5 text-brand-600 dark:text-gold-400" />
                                    <span>{detail.legalName}</span>
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 flex-wrap text-xs mt-1">
                                    <VerificationBadge status={detail.verificationStatus} />
                                    {detail.tradeName && <span>• {detail.tradeName}</span>}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 my-2">
                                <Card className="p-4 bg-muted/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                            Verification Status
                                        </div>
                                    </div>
                                    {userCan(user, "suppliers.verify") ? (
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={detail.verificationStatus === "verified" ? "default" : "outline"}
                                                onClick={() => setVerification(detail, "verified")}
                                                className={detail.verificationStatus === "verified" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                Mark Verified
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={detail.verificationStatus === "documents_received" ? "default" : "outline"}
                                                onClick={() => setVerification(detail, "documents_received")}
                                            >
                                                <FileCheck className="h-3.5 w-3.5 mr-1" />
                                                Docs Received
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={detail.verificationStatus === "unverified" ? "default" : "outline"}
                                                onClick={() => setVerification(detail, "unverified")}
                                            >
                                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                                Unverified
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            You do not have permission to change verification status.
                                        </p>
                                    )}
                                </Card>

                                <div className="grid sm:grid-cols-2 gap-3">
                                    <InfoRow icon={Hash} label="TIN" value={detail.tin} />
                                    <InfoRow icon={Hash} label="VAT No." value={detail.vatNo} />
                                    <InfoRow icon={FileCheck} label="Trade License" value={detail.tradeLicenseNo} />
                                    <InfoRow icon={Phone} label="Contact Phone" value={detail.contactPhone} />
                                    <InfoRow icon={Mail} label="Contact Email" value={detail.contactEmail} />
                                    <InfoRow icon={Building} label="Contact Name" value={detail.contactName} />
                                    <InfoRow icon={CreditCard} label="Payment Terms" value={detail.paymentTerms} />
                                    <InfoRow icon={CreditCard} label="Bank Details" value={detail.bankDetails} />
                                    {detail.telegramChatId && (
                                        <InfoRow
                                            icon={Link2}
                                            label="Telegram"
                                            value={`Linked · @${detail.telegramUsername || detail.telegramChatId} · ${detail.language === "am" ? "አማርኛ" : "English"}`}
                                        />
                                    )}
                                </div>

                                {detail.notes && (
                                    <Card className="p-4 bg-muted/30">
                                        <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                                            <StickyNote className="h-3.5 w-3.5" />
                                            Notes
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                                    </Card>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="p-3.5 text-center">
                                        <div className="text-xl font-bold text-brand-700 dark:text-gold-400">{detail.proformaCount}</div>
                                        <div className="text-xs text-muted-foreground">Proformas submitted</div>
                                    </Card>
                                    <Card className="p-3.5 text-center">
                                        <div className="text-xl font-bold text-brand-700 dark:text-gold-400">{detail.requestCount}</div>
                                        <div className="text-xs text-muted-foreground">Requests invited to</div>
                                    </Card>
                                </div>

                                {detail.categoryTags && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                                            Categories
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {detail.categoryTags.split(",").map((t, i) => (
                                                <Badge key={i} variant="secondary">
                                                    {t.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <DocumentsSection
                                    supplier={detail}
                                    canManage={userCan(user, "suppliers.manage")}
                                    onChange={(docs) => setDetail({ ...detail, documents: docs })}
                                />
                            </div>

                            <DialogFooter className="mt-4 flex items-center justify-between gap-2">
                                {userCan(user, "suppliers.manage") && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setDetailOpen(false);
                                            openEdit(detail);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit Supplier
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <b>{deleteTarget?.legalName}</b> and all related records.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            {deleting && <Spinner className="h-4 w-4 mr-1" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete confirmation */}
            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-rose-600" /> Delete {selectedIds.length} Supplier(s)?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
                            <span>
                                Are you sure you want to permanently delete <strong className="text-foreground font-semibold">{selectedIds.length} selected supplier record(s)</strong>?
                            </span>
                            <span className="block text-xs text-rose-600 dark:text-rose-400 font-medium">
                                ⚠️ This action will permanently remove all selected suppliers and cannot be undone.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => bulkAction("delete")}
                            disabled={bulkBusy}
                            className="bg-rose-600 text-white hover:bg-rose-700 font-medium"
                        >
                            {bulkBusy && <Spinner className="h-4 w-4 mr-1" />}
                            Delete {selectedIds.length} Supplier(s)
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CategoriesDialog({ open, onOpenChange }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api("/api/categories");
            setCategories(data.categories || []);
        } catch (e) {
            toast({ title: "Failed to load categories", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const add = async () => {
        if (!newName.trim()) return;
        setAdding(true);
        try {
            await api("/api/categories", { method: "POST", body: JSON.stringify({ name: newName.trim() }) });
            setNewName("");
            await load();
        } catch (e) {
            toast({ title: "Failed to add category", description: e.message, variant: "destructive" });
        } finally {
            setAdding(false);
        }
    };

    const rename = async (id) => {
        if (!editingName.trim()) return;
        try {
            await api(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name: editingName.trim() }) });
            setEditingId(null);
            await load();
        } catch (e) {
            toast({ title: "Failed to rename category", description: e.message, variant: "destructive" });
        }
    };

    const remove = async (id) => {
        try {
            await api(`/api/categories/${id}`, { method: "DELETE" });
            await load();
        } catch (e) {
            toast({ title: "Failed to delete category", description: e.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} containerClassName="z-[70]">
            <DialogContent className="max-w-md z-[70]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-brand-600" />
                        Manage Categories
                    </DialogTitle>
                    <DialogDescription>
                        Categories used to tag suppliers and filter them when creating proforma requests.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2">
                    <Input
                        placeholder="New category name…"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && add()}
                    />
                    <Button onClick={add} disabled={adding || !newName.trim()}>
                        {adding ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1 -mx-1 px-1">
                    {loading ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <Spinner className="h-4 w-4 inline mr-1" />
                            Loading…
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">No categories yet.</div>
                    ) : (
                        categories.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50">
                                {editingId === c.id ? (
                                    <>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && rename(c.id)}
                                            className="h-8"
                                            autoFocus
                                        />
                                        <Button size="sm" className="h-8" onClick={() => rename(c.id)}>
                                            Save
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 text-sm">{c.name}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() => { setEditingId(c.id); setEditingName(c.name); }}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700"
                                            onClick={() => remove(c.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DocumentsSection({ supplier, canManage, onChange }) {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const documents = supplier.documents || [];

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`/api/suppliers/${supplier.id}/documents`, {
                method: "POST",
                body: form,
                credentials: "same-origin",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || j.message || `Request failed (${res.status})`);
            }
            const doc = await res.json();
            onChange([...documents, doc]);
            toast({ title: "Document uploaded", description: doc.fileName });
        } catch (e) {
            toast({ title: "Upload failed", description: e.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const remove = async (docId) => {
        try {
            await api(`/api/suppliers/${supplier.id}/documents/${docId}`, { method: "DELETE" });
            onChange(documents.filter((d) => d.id !== docId));
        } catch (e) {
            toast({ title: "Failed to delete document", description: e.message, variant: "destructive" });
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Documents</div>
                {canManage && (
                    <label className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer inline-flex items-center gap-1">
                        {uploading ? <Spinner className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                        Upload
                        <input
                            type="file"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                        />
                    </label>
                )}
            </div>
            {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No documents uploaded.</p>
            ) : (
                <div className="space-y-1.5">
                    {documents.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 p-2 rounded-md border bg-card text-sm">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate">{d.fileName}</span>
                            <a href={`/${d.filePath}`} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                            </a>
                            {canManage && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700" onClick={() => remove(d.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Field({ label, children, required }) {
    return (
        <div>
            <Label className="text-xs font-medium mb-1.5 block">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </Label>
            {children}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium break-words">{value || "—"}</div>
            </div>
        </div>
    );
}

export default SuppliersView;
