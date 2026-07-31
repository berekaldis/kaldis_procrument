// Shared types + API helpers for the procurement app (Laravel/Inertia port)

export type Section =
    | "dashboard"
    | "suppliers"
    | "requests"
    | "proformas"
    | "notifications"
    | "audit"
    | "outbox"
    | "settings"
    | "users";

export type Role = "admin" | "purchaser" | "finance" | "requester";

export type Permission =
    | "dashboard.view"
    | "suppliers.view"
    | "suppliers.manage"
    | "suppliers.verify"
    | "requests.view"
    | "requests.create"
    | "requests.send"
    | "requests.manage"
    | "proformas.view"
    | "proformas.review"
    | "notifications.view"
    | "audit.view"
    | "outbox.view"
    | "settings.view"
    | "settings.manage"
    | "users.manage";

export const ALL_PERMISSIONS: Permission[] = [
    "dashboard.view", "suppliers.view", "suppliers.manage", "suppliers.verify",
    "requests.view", "requests.create", "requests.send", "requests.manage",
    "proformas.view", "proformas.review",
    "notifications.view", "audit.view", "outbox.view", "settings.view", "settings.manage", "users.manage",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: ALL_PERMISSIONS,
    purchaser: ["dashboard.view","suppliers.view","suppliers.manage","requests.view","requests.create","requests.send","requests.manage","proformas.view","proformas.review","notifications.view","audit.view"],
    finance: ["dashboard.view","proformas.view","proformas.review","notifications.view","audit.view"],
    requester: ["dashboard.view","suppliers.view","requests.view","requests.create","notifications.view"],
};

export const ROLE_LABELS: Record<Role, string> = {
    admin: "Administrator",
    purchaser: "Purchase Manager",
    finance: "Finance Officer",
    requester: "Proforma Requester",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
    admin: "Full system access — manages users, suppliers, settings & all procurement data",
    purchaser: "Approves requested proformas to send to selected suppliers via Telegram, manages suppliers & reviews proformas",
    finance: "Reviews, accepts or rejects submitted proformas & monitors procurement activity",
    requester: "Creates proforma requests for Purchase Manager approval & views the supplier directory",
};

export function can(role: string, perm: Permission): boolean {
    const perms = ROLE_PERMISSIONS[role as Role];
    return perms?.includes(perm) ?? false;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    organizationId: number;
    permissions: Permission[];
}

export function userCan(user: AuthUser | null, perm: Permission): boolean {
    if (!user) return false;
    return user.permissions.includes(perm);
}

export const SECTION_PERMISSIONS: Record<Section, Permission> = {
    dashboard: "dashboard.view",
    suppliers: "suppliers.view",
    requests: "requests.view",
    proformas: "proformas.view",
    notifications: "notifications.view",
    audit: "audit.view",
    outbox: "outbox.view",
    settings: "settings.view",
    users: "users.manage",
};

export interface Supplier {
    id: number;
    legalName: string;
    tradeName?: string | null;
    tin?: string | null;
    vatNo?: string | null;
    tradeLicenseNo?: string | null;
    categoryTags?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    telegramChatId?: string | null;
    telegramUsername?: string | null;
    paymentTerms?: string | null;
    bankDetails?: string | null;
    notes?: string | null;
    verificationStatus: "unverified" | "documents_received" | "verified";
    active: boolean;
    createdAt: string;
    proformaCount?: number;
    requestCount?: number;
}

export interface ProformaRequestItem {
    id: number;
    itemName: string;
    description?: string | null;
    quantity: number;
    unit: string;
}

export interface ProformaRequestListItem {
    id: number;
    referenceNo: string;
    title: string;
    description?: string | null;
    requestedBy: string;
    deadline: string;
    status: string;
    createdAt: string;
    supplierCount: number;
    proformaCount: number;
    itemCount: number;
    respondedSupplierIds: number[];
}

export interface ProformaRequestDetail extends ProformaRequestListItem {
    items: ProformaRequestItem[];
    suppliers: { id: number; status: string; notifiedAt?: string | null; supplier: Supplier }[];
    proformas: ProformaListItem[];
}

export interface ProformaLineItem {
    itemName: string;
    quantity: number;
    unit?: string | null;
    unitPrice: number;
    lineTotal?: number;
}

export interface ProformaListItem {
    id: number;
    referenceNo?: string | null;
    message?: string | null;
    filePath?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    receivedVia: string;
    status: string;
    notes?: string | null;
    items?: ProformaLineItem[] | null;
    totalAmount?: number | null;
    currency?: string | null;
    receivedAt: string;
    supplier: { id: number; legalName: string; tradeName?: string | null; telegramChatId?: string | null };
    request: { referenceNo: string; title: string; deadline: string };
}

export interface Notification {
    id: number;
    role?: string | null;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string | null;
    createdAt: string;
}

export interface AuditLog {
    id: number;
    actor: string;
    entity: string;
    entityId: string;
    action: string;
    details?: string | null;
    timestamp: string;
}

export interface TelegramOutboxItem {
    id: number;
    supplierId?: number | null;
    supplierName?: string | null;
    chatId?: string | null;
    message: string;
    status: string;
    error?: string | null;
    payload?: string | null;
    sentAt?: string | null;
    createdAt: string;
}

export interface DashboardData {
    totalSuppliers: number;
    verifiedSuppliers: number;
    totalRequests: number;
    openRequests: number;
    overdueRequests: number;
    totalProformas: number;
    pendingProformas: number;
    telegramLinkedSuppliers: number;
    outboxCount: number;
    avgTurnaroundHours: number | null;
    recentRequests: any[];
    recentProformas: any[];
    recentAudit: AuditLog[];
    upcomingDeadlines: {
        id: number;
        referenceNo: string;
        title: string;
        deadline: string;
        overdue: boolean;
        supplierCount: number;
        proformaCount: number;
    }[];
    charts: {
        requestsByStatus: { status: string; count: number }[];
        proformasByStatus: { status: string; count: number }[];
        suppliersByVerification: { status: string; count: number }[];
    };
}

// Fetch helper — sends cookies (session) with every request
export async function api<T = any>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...opts,
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(opts?.headers || {}) },
        credentials: "same-origin",
        cache: "no-store",
    });
    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const j = await res.json();
            if (j.error) msg = j.error;
            if (j.message) msg = j.message;
        } catch {}
        throw new Error(msg);
    }
    return res.json();
}

export interface PageMeta {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
}

/**
 * Like api(), but also reads the X-Total-Count/X-Page/X-Last-Page/X-Per-Page
 * pagination headers set by paginated list endpoints (only present when the
 * request includes a `page` query param).
 */
export async function apiPaged<T = any>(url: string, opts?: RequestInit): Promise<{ data: T; meta: PageMeta | null }> {
    const res = await fetch(url, {
        ...opts,
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(opts?.headers || {}) },
        credentials: "same-origin",
        cache: "no-store",
    });
    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const j = await res.json();
            if (j.error) msg = j.error;
            if (j.message) msg = j.message;
        } catch {}
        throw new Error(msg);
    }
    const total = res.headers.get("X-Total-Count");
    const meta: PageMeta | null = total !== null ? {
        total: Number(total),
        currentPage: Number(res.headers.get("X-Page") || 1),
        lastPage: Number(res.headers.get("X-Last-Page") || 1),
        perPage: Number(res.headers.get("X-Per-Page") || 20),
    } : null;
    return { data: await res.json(), meta };
}
