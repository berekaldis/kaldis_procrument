import { useState, useRef } from "react";
import {
    FileSpreadsheet,
    Upload,
    CheckCircle2,
    AlertCircle,
    X,
    Building2,
    Tag,
    Trash2,
    ShieldAlert,
    CheckSquare,
    Square,
    Filter,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { Badge } from "./ui/badge.jsx";
import { Card } from "./ui/card.jsx";
import { Label } from "./ui/label.jsx";
import { Spinner } from "./ui/spinner.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { api } from "../lib/procurement";
import { useToast } from "../hooks/use-toast";
import { parseSupplierExcel } from "../lib/excelSupplierParser";

export function SupplierImportModal({ open, onOpenChange, onSuccess }) {
    const [file, setFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [parsedSuppliers, setParsedSuppliers] = useState([]);
    const [duplicateMode, setDuplicateMode] = useState("skip"); // "skip", "update", "create_always"
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    const resetState = () => {
        setFile(null);
        setParsing(false);
        setParsedSuppliers([]);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleOpenChange = (val) => {
        if (!val) resetState();
        onOpenChange(val);
    };

    const handleFileSelected = async (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        setFile(selected);
        setParsing(true);
        setImportResult(null);

        try {
            const buffer = await selected.arrayBuffer();
            const results = parseSupplierExcel(buffer);
            
            if (results.length === 0) {
                toast({
                    title: "No supplier rows found",
                    description: "Please check the spreadsheet format.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Spreadsheet parsed",
                    description: `Found ${results.length} supplier record(s). Items column removed.`,
                });
            }
            
            setParsedSuppliers(results);
        } catch (err) {
            toast({
                title: "Failed to parse file",
                description: err.message || "Invalid file format.",
                variant: "destructive",
            });
            setParsedSuppliers([]);
        } finally {
            setParsing(false);
        }
    };

    const toggleSelectRow = (id) => {
        setParsedSuppliers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
        );
    };

    const toggleSelectAll = () => {
        const allSelected = parsedSuppliers.every((s) => s.selected);
        setParsedSuppliers((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
    };

    const selectedCount = parsedSuppliers.filter((s) => s.selected).length;

    // Unique category summary tags
    const categorySummary = Array.from(
        new Set(parsedSuppliers.map((s) => s.categoryTags).filter(Boolean))
    );

    const handleImport = async () => {
        const toImport = parsedSuppliers.filter((s) => s.selected);
        if (toImport.length === 0) {
            toast({ title: "No suppliers selected for import", variant: "destructive" });
            return;
        }

        setImporting(true);
        try {
            const payload = {
                duplicateMode,
                suppliers: toImport.map((s) => ({
                    legalName: s.legalName,
                    tradeName: s.tradeName,
                    tin: s.tin,
                    contactName: s.contactName,
                    contactPhone: s.contactPhone,
                    bankDetails: s.bankDetails,
                    notes: s.notes,
                    categoryTags: s.categoryTags,
                })),
            };

            const res = await api("/api/suppliers/import", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setImportResult(res);
            toast({
                title: "Import Complete!",
                description: `Successfully imported ${res.imported_count || 0} supplier(s).`,
            });
            
            if (onSuccess) onSuccess();
        } catch (err) {
            toast({
                title: "Import failed",
                description: err.message || "An error occurred during import.",
                variant: "destructive",
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Import Suppliers from Excel
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Upload your Excel file (.xlsx, .xls, .csv). Section categories, contact info, and TIN numbers are auto-mapped. The Items column is removed.
                    </DialogDescription>
                </DialogHeader>

                {importResult ? (
                    /* Success Result View */
                    <div className="py-6 space-y-4 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold">Import Complete</h3>
                        <p className="text-sm text-muted-foreground">
                            Supplier records have been successfully processed and saved.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
                            <Card className="p-3 text-center border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {importResult.imported_count || 0}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">New Added</div>
                            </Card>
                            <Card className="p-3 text-center border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {importResult.updated_count || 0}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">Updated</div>
                            </Card>
                            <Card className="p-3 text-center border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {importResult.skipped_count || 0}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">Skipped</div>
                            </Card>
                            <Card className="p-3 text-center border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {importResult.new_categories_count || 0}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">New Categories</div>
                            </Card>
                        </div>

                        <div className="pt-4">
                            <Button onClick={() => handleOpenChange(false)} className="bg-brand-600 hover:bg-brand-700">
                                Close & Refresh Table
                            </Button>
                        </div>
                    </div>
                ) : parsedSuppliers.length === 0 ? (
                    /* File Upload Screen */
                    <div className="py-8 space-y-4 flex flex-col items-center justify-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-lg border-2 border-dashed border-border hover:border-brand-500 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-muted/20 hover:bg-muted/50 transition-all text-center"
                        >
                            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <Upload className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Click to upload or drag & drop Excel file
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Supports .xlsx, .xls, and .csv files
                                </p>
                            </div>
                            <Badge variant="outline" className="mt-2 text-[11px] gap-1 bg-muted/60">
                                <Filter className="h-3 w-3 text-brand-600" />
                                Auto Section Headers & Items Column Removal
                            </Badge>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelected}
                            className="hidden"
                        />

                        {parsing && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner className="h-4 w-4" />
                                Parsing spreadsheet structure…
                            </div>
                        )}
                    </div>
                ) : (
                    /* Preview & Configuration Table View */
                    <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-2">
                        {/* Summary & Controls Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 bg-muted/40 p-3 rounded-lg border">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                    {selectedCount} of {parsedSuppliers.length} suppliers selected
                                </span>
                                <Badge variant="secondary" className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    ✓ Items Column Removed
                                </Badge>
                                {categorySummary.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Categories:</span>
                                        {categorySummary.slice(0, 3).map((c, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px] py-0">
                                                {c}
                                            </Badge>
                                        ))}
                                        {categorySummary.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground">
                                                +{categorySummary.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Label className="text-xs shrink-0 font-medium">Duplicate Action:</Label>
                                <Select value={duplicateMode} onValueChange={setDuplicateMode}>
                                    <SelectTrigger className="h-8 text-xs w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="skip">Skip duplicates</SelectItem>
                                        <SelectItem value="update">Update existing</SelectItem>
                                        <SelectItem value="create_always">Import all (no skip)</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button variant="ghost" size="sm" onClick={resetState} className="h-8 text-xs text-rose-600">
                                    Change File
                                </Button>
                            </div>
                        </div>

                        {/* Suppliers Preview Table */}
                        <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/70 sticky top-0 z-10 border-b">
                                    <tr className="text-left font-medium text-muted-foreground uppercase tracking-wider">
                                        <th className="p-2.5 w-8">
                                            <button type="button" onClick={toggleSelectAll} className="flex items-center">
                                                {parsedSuppliers.every((s) => s.selected) ? (
                                                    <CheckSquare className="h-4 w-4 text-brand-600" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="p-2.5 font-semibold">#</th>
                                        <th className="p-2.5 font-semibold">Supplier Name</th>
                                        <th className="p-2.5 font-semibold">Category</th>
                                        <th className="p-2.5 font-semibold">Contact Person</th>
                                        <th className="p-2.5 font-semibold">Phone / Telegram</th>
                                        <th className="p-2.5 font-semibold">Bank Details</th>
                                        <th className="p-2.5 font-semibold">TIN</th>
                                        <th className="p-2.5 font-semibold">Address / Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {parsedSuppliers.map((s) => (
                                        <tr
                                            key={s.id}
                                            className={
                                                s.selected
                                                    ? "hover:bg-accent/40"
                                                    : "opacity-50 bg-muted/20"
                                            }
                                        >
                                            <td className="p-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSelectRow(s.id)}
                                                    className="flex items-center"
                                                >
                                                    {s.selected ? (
                                                        <CheckSquare className="h-4 w-4 text-brand-600" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-2.5 font-mono text-muted-foreground">{s.rowIndex}</td>
                                            <td className="p-2.5 font-medium text-foreground">{s.legalName}</td>
                                            <td className="p-2.5">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {s.categoryTags || "General"}
                                                </Badge>
                                            </td>
                                            <td className="p-2.5">{s.contactName || "—"}</td>
                                            <td className="p-2.5 font-mono">{s.contactPhone || "—"}</td>
                                            <td className="p-2.5">{s.bankDetails || "—"}</td>
                                            <td className="p-2.5 font-mono">{s.tin || "—"}</td>
                                            <td className="p-2.5 text-muted-foreground truncate max-w-[150px]">
                                                {s.notes || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!importResult && parsedSuppliers.length > 0 && (
                    <DialogFooter className="pt-3 border-t shrink-0 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Total {parsedSuppliers.length} rows loaded from file
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={importing || selectedCount === 0}
                                className="bg-brand-600 hover:bg-brand-700 font-medium"
                            >
                                {importing && <Spinner className="h-4 w-4 mr-2" />}
                                Import {selectedCount} Supplier(s)
                            </Button>
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
