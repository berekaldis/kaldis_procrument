import { Badge } from "./ui/badge.jsx";
import { cn } from "../lib/utils";
import { useLanguage } from "../hooks/use-language";
import {
    CheckCircle2,
    Clock,
    FileText,
    Send,
    XCircle,
    AlertTriangle,
    Hourglass,
    Inbox,
    Eye,
    CheckCheck,
    Bell,
} from "lucide-react";

const requestStatusMap = {
    draft: { key: "status.draft", label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", icon: FileText },
    sent: { key: "status.sent", label: "Sent", cls: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800", icon: Send },
    partially_received: { key: "status.partially_received", label: "Partial", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800", icon: Hourglass },
    received: { key: "status.received", label: "Received", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", icon: Inbox },
    closed: { key: "status.closed", label: "Closed", cls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", icon: CheckCheck },
    cancelled: { key: "status.cancelled", label: "Cancelled", cls: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800", icon: XCircle },
};

const proformaStatusMap = {
    received: { key: "status.received", label: "Received", cls: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800", icon: Inbox },
    reviewed: { key: "status.reviewed", label: "Reviewed", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800", icon: Eye },
    accepted: { key: "status.accepted", label: "Accepted", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", icon: CheckCircle2 },
    rejected: { key: "status.rejected", label: "Rejected", cls: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800", icon: XCircle },
};

const verificationMap = {
    unverified: { key: "status.unverified", label: "Unverified", cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", icon: AlertTriangle },
    documents_received: { key: "status.documents_received", label: "Docs Received", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800", icon: Clock },
    verified: { key: "status.verified", label: "Verified", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", icon: CheckCircle2 },
};

export function RequestStatusBadge({ status }) {
    const { t } = useLanguage();
    const m = requestStatusMap[status] || { label: status, cls: "", icon: FileText };
    const Icon = m.icon;
    return (
        <Badge variant="outline" className={cn("gap-1 font-medium", m.cls)}>
            <Icon className="h-3 w-3" />
            {m.key ? t(m.key, m.label) : m.label}
        </Badge>
    );
}

export function ProformaStatusBadge({ status }) {
    const { t } = useLanguage();
    const m = proformaStatusMap[status] || { label: status, cls: "", icon: Inbox };
    const Icon = m.icon;
    return (
        <Badge variant="outline" className={cn("gap-1 font-medium", m.cls)}>
            <Icon className="h-3 w-3" />
            {m.key ? t(m.key, m.label) : m.label}
        </Badge>
    );
}

export function VerificationBadge({ status }) {
    const { t } = useLanguage();
    const m = verificationMap[status] || { label: status, cls: "", icon: AlertTriangle };
    const Icon = m.icon;
    return (
        <Badge variant="outline" className={cn("gap-1 font-medium", m.cls)}>
            <Icon className="h-3 w-3" />
            {m.key ? t(m.key, m.label) : m.label}
        </Badge>
    );
}

export function ReceivedViaBadge({ via }) {
    const { t } = useLanguage();
    const map = {
        telegram: { key: "status.telegram", label: "Telegram", cls: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800" },
        manual: { key: "status.manual", label: "Manual", cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
        simulated: { key: "status.simulated", label: "Simulated", cls: "bg-gold-100 text-gold-700 border-gold-200 dark:bg-gold-900/50 dark:text-gold-300 dark:border-gold-800" },
    };
    const m = map[via] || { label: via, cls: "" };
    return (
        <Badge variant="outline" className={cn("font-medium", m.cls)}>
            {m.key ? t(m.key, m.label) : m.label}
        </Badge>
    );
}

export function OutboxStatusBadge({ status }) {
    const { t } = useLanguage();
    const map = {
        sent: { key: "status.sent", label: "Sent", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
        simulated: { key: "status.simulated", label: "Simulated", cls: "bg-gold-100 text-gold-700 border-gold-200 dark:bg-gold-900/50 dark:text-gold-300 dark:border-gold-800" },
        pending: { key: "status.pending", label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
        failed: { key: "status.failed", label: "Failed", cls: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800" },
    };
    const m = map[status] || { label: status, cls: "" };
    return (
        <Badge variant="outline" className={cn("font-medium", m.cls)}>
            {m.key ? t(m.key, m.label) : m.label}
        </Badge>
    );
}

export function NotificationIcon({ type }) {
    const cls = "h-4 w-4 shrink-0";
    switch (type) {
        case "success":
            return <CheckCircle2 className={cn(cls, "text-emerald-600")} />;
        case "warning":
            return <AlertTriangle className={cn(cls, "text-amber-600")} />;
        case "error":
            return <XCircle className={cn(cls, "text-rose-600")} />;
        default:
            return <Bell className={cn(cls, "text-sky-600")} />;
    }
}

// ── Date helpers ────────────────────────────────────────────────────────────
// Replacements for date-fns formatDistanceToNow / format (no extra dep).

function pad(n) { return n < 10 ? "0" + n : "" + n; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDate(d) {
    if (d instanceof Date) return d;
    return new Date(d);
}

export function timeAgo(d) {
    try {
        const date = toDate(d);
        const diffMs = Date.now() - date.getTime();
        if (isNaN(diffMs)) return "";
        const sec = Math.round(diffMs / 1000);
        if (sec < 5) return "just now";
        if (sec < 60) return `${sec} seconds ago`;
        const min = Math.round(sec / 60);
        if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
        const hr = Math.round(min / 60);
        if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
        const day = Math.round(hr / 24);
        if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
        const month = Math.round(day / 30);
        if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;
        const year = Math.round(month / 12);
        return `${year} year${year === 1 ? "" : "s"} ago`;
    } catch {
        return "";
    }
}

export function fmtDate(d) {
    try {
        const date = toDate(d);
        if (isNaN(date.getTime())) return "";
        return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
        return "";
    }
}

export function fmtDateShort(d) {
    try {
        const date = toDate(d);
        if (isNaN(date.getTime())) return "";
        return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch {
        return "";
    }
}

export function isOverdue(deadline) {
    try {
        return new Date(deadline).getTime() < Date.now();
    } catch {
        return false;
    }
}
