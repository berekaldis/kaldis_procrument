import { useEffect, useState, useCallback } from "react";
import { History, Filter, FileSpreadsheet } from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select.jsx";
import { Pagination } from "./ui/pagination.jsx";
import { DateRangeFilter } from "./ui/date-range-filter.jsx";
import { EmptyState } from "./ui/empty-state.jsx";
import { apiPaged, api } from "../lib/procurement";
import { downloadCsv } from "../lib/csv";
import { timeAgo, fmtDate } from "./bits";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

const ENTITY_COLORS = {
    Supplier: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    ProformaRequest: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    Proforma: "bg-gold-100 text-gold-700 border-gold-200 dark:bg-gold-900/50 dark:text-gold-300 dark:border-gold-800",
    Organization: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

const ACTION_COLORS = {
    create: "text-emerald-600 dark:text-emerald-400",
    update: "text-sky-600 dark:text-sky-400",
    delete: "text-rose-600 dark:text-rose-400",
    verify: "text-amber-600 dark:text-amber-400",
    send: "text-sky-600 dark:text-sky-400",
    status_change: "text-gold-600 dark:text-gold-400",
    received_via_telegram: "text-cyan-600 dark:text-cyan-400",
    received_via_simulated: "text-gold-600 dark:text-gold-400",
    telegram_link: "text-cyan-600 dark:text-cyan-400",
    seed: "text-slate-500 dark:text-slate-400",
};

export function AuditView() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [entityFilter, setEntityFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [entities, setEntities] = useState([]);
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), perPage: "25" });
            if (q) params.set("q", q);
            if (entityFilter !== "all") params.set("entity", entityFilter);
            if (dateFrom) params.set("from", dateFrom);
            if (dateTo) params.set("to", dateTo);
            const { data, meta: m } = await apiPaged(`/api/audit-logs?${params.toString()}`);
            setLogs(data);
            setMeta(m);
        } catch (e) {
            toast({ title: "Failed to load", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [page, q, entityFilter, dateFrom, dateTo, toast]);

    useEffect(() => {
        const t = setTimeout(load, 200);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [q, entityFilter, dateFrom, dateTo]);

    useEffect(() => {
        api("/api/audit-logs?limit=500")
            .then((all) => setEntities(Array.from(new Set(all.map((l) => l.entity)))))
            .catch(() => {});
    }, []);

    const exportCsv = async () => {
        try {
            const params = new URLSearchParams({ limit: "5000" });
            if (q) params.set("q", q);
            if (entityFilter !== "all") params.set("entity", entityFilter);
            if (dateFrom) params.set("from", dateFrom);
            if (dateTo) params.set("to", dateTo);
            const all = await api(`/api/audit-logs?${params.toString()}`);
            downloadCsv(
                `audit-log-${Date.now()}.csv`,
                [
                    ["Timestamp", "Actor", "Entity", "Action", "Details"],
                    ...all.map((l) => [l.timestamp, l.actor, l.entity, l.action, l.details || ""]),
                ],
            );
        } catch (e) {
            toast({ title: "Export failed", description: e.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Input
                    placeholder="Search audit log…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="sm:max-w-xs"
                />
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All entities</SelectItem>
                        {entities.map((e) => (
                            <SelectItem key={e} value={e}>
                                {e}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
                <Button variant="outline" size="sm" onClick={exportCsv} className="shrink-0">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Export CSV
                </Button>
                <div className="text-xs text-muted-foreground sm:ml-auto flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    {meta?.total ?? logs.length} entries
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <Spinner className="h-5 w-5 inline mr-2" />
                            Loading audit log…
                        </div>
                    ) : logs.length === 0 ? (
                        <EmptyState icon={History} description="No audit entries match your filters." />
                    ) : (
                        <div className="divide-y divide-border">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-accent/20">
                                    <div className="grid place-items-center h-8 w-8 rounded-full bg-muted text-xs font-medium shrink-0">
                                        {log.actor.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{log.actor}</span>
                                            <span className={cn("text-xs font-medium", ACTION_COLORS[log.action] || "text-muted-foreground")}>
                                                {log.action.replace(/_/g, " ")}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={cn("text-[10px] py-0", ENTITY_COLORS[log.entity] || "")}
                                            >
                                                {log.entity}
                                            </Badge>
                                        </div>
                                        {log.details && (
                                            <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>
                                        )}
                                        <div className="text-xs text-muted-foreground/60 mt-0.5">
                                            {fmtDate(log.timestamp)} · {timeAgo(log.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
            <Pagination meta={meta} onPageChange={setPage} />
        </div>
    );
}

export default AuditView;
