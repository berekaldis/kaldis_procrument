import { useEffect, useRef, useState } from "react";
import { Search, Building2, FileText, Inbox, X } from "lucide-react";
import { api } from "../lib/procurement";
import { cn } from "../lib/utils";

export function GlobalSearch({ onNavigate }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [results, setResults] = useState({ suppliers: [], requests: [], proformas: [] });
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (q.trim().length < 2) {
            setResults({ suppliers: [], requests: [], proformas: [] });
            return;
        }
        setLoading(true);
        const t = setTimeout(() => {
            api(`/api/search?q=${encodeURIComponent(q.trim())}`)
                .then(setResults)
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        const onClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const total = results.suppliers.length + results.requests.length + results.proformas.length;

    const go = (section) => {
        onNavigate(section);
        setOpen(false);
        setQ("");
    };

    return (
        <div ref={containerRef} className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Search…"
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-card text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {q && (
                <button
                    onClick={() => { setQ(""); setResults({ suppliers: [], requests: [], proformas: [] }); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}

            {open && q.trim().length >= 2 && (
                <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-procurement-scale-in max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</div>
                    ) : total === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">No matches for "{q}"</div>
                    ) : (
                        <>
                            {results.suppliers.length > 0 && (
                                <SearchGroup label="Suppliers" icon={Building2}>
                                    {results.suppliers.map((s) => (
                                        <SearchRow key={`s-${s.id}`} onClick={() => go("suppliers")}>
                                            {s.legalName}
                                            {s.tradeName && <span className="text-muted-foreground"> · {s.tradeName}</span>}
                                        </SearchRow>
                                    ))}
                                </SearchGroup>
                            )}
                            {results.requests.length > 0 && (
                                <SearchGroup label="Proforma Requests" icon={FileText}>
                                    {results.requests.map((r) => (
                                        <SearchRow key={`r-${r.id}`} onClick={() => go("requests")}>
                                            <span className="font-mono text-xs text-brand-700 dark:text-gold-300">{r.referenceNo}</span> — {r.title}
                                        </SearchRow>
                                    ))}
                                </SearchGroup>
                            )}
                            {results.proformas.length > 0 && (
                                <SearchGroup label="Proformas" icon={Inbox}>
                                    {results.proformas.map((p) => (
                                        <SearchRow key={`p-${p.id}`} onClick={() => go("proformas")}>
                                            {p.supplierName || "Unknown supplier"}
                                            {p.referenceNo && <span className="text-muted-foreground"> · {p.referenceNo}</span>}
                                        </SearchRow>
                                    ))}
                                </SearchGroup>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function SearchGroup({ label, icon: Icon, children }) {
    return (
        <div className="border-b border-border last:border-b-0">
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <div className="pb-1.5">{children}</div>
        </div>
    );
}

function SearchRow({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-accent/60 transition-colors truncate block"
            )}
        >
            {children}
        </button>
    );
}

export default GlobalSearch;
