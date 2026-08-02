import { useCallback, useEffect, useMemo, useState } from "react";
import {
    UserPlus,
    Pencil,
    UserX,
    Shield,
    Mail,
    Phone,
    Clock,
    Search,
    Check,
    Users,
    Crown,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select.jsx";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "./ui/table.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog.jsx";
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
import { Switch } from "./ui/switch.jsx";
import { Badge } from "./ui/badge.jsx";
import { Card, CardContent } from "./ui/card.jsx";
import {
    api,
    ROLE_LABELS,
    ROLE_DESCRIPTIONS,
} from "../lib/procurement";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../hooks/use-language";
import { cn } from "../lib/utils";

const ROLES = ["admin", "purchaser", "finance", "requester"];

const ROLE_BADGE_CLS = {
    admin: "bg-rose-100 text-rose-700 border-rose-200",
    purchaser: "bg-brand-100 text-brand-700 border-brand-200",
    finance: "bg-amber-100 text-amber-700 border-amber-200",
    requester: "bg-gold-100 text-gold-700 border-gold-200",
};

const ROLE_ACCENT = {
    admin: { border: "border-rose-200/70", chip: "bg-rose-50 text-rose-600", dot: "bg-rose-500" },
    purchaser: { border: "border-brand-200/70", chip: "bg-brand-50 text-brand-600", dot: "bg-brand-500" },
    finance: { border: "border-amber-200/70", chip: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
    requester: { border: "border-gold-200/70", chip: "bg-gold-50 text-gold-600", dot: "bg-gold-500" },
};

const ROLE_ICON = {
    admin: Crown,
    purchaser: Shield,
    finance: Check,
    requester: Users,
};

function getInitials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(iso) {
    if (!iso) return "Never";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Never";
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "just now";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;
    const year = Math.floor(month / 12);
    return `${year} year${year === 1 ? "" : "s"} ago`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
    name: "",
    email: "",
    phone: "",
    role: "purchaser",
    password: "",
    active: true,
};

export function UsersView({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { toast } = useToast();
    const { t } = useLanguage();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api("/api/users");
            setUsers(data);
        } catch (e) {
            toast({
                title: "Failed to load users",
                description: e.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const roleCounts = useMemo(() => {
        const m = { admin: 0, purchaser: 0, finance: 0, requester: 0 };
        for (const u of users) m[u.role] = (m[u.role] || 0) + 1;
        return m;
    }, [users]);

    const activeCount = useMemo(() => users.filter((u) => u.active).length, [users]);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return users;
        return users.filter((u) =>
            [u.name, u.email, u.phone ?? "", u.role].some((f) => f.toLowerCase().includes(t))
        );
    }, [users, q]);

    const isSelf = (u) => String(u.id) === String(currentUser.id);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM });
        setFormOpen(true);
    };

    const openEdit = (u) => {
        setEditing(u);
        setForm({
            name: u.name,
            email: u.email,
            phone: u.phone ?? "",
            role: u.role,
            password: "",
            active: u.active,
        });
        setFormOpen(true);
    };

    const save = async () => {
        if (!form.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) {
            toast({ title: "A valid email is required", variant: "destructive" });
            return;
        }
        if (!form.role) {
            toast({ title: "Role is required", variant: "destructive" });
            return;
        }
        if (!editing && !form.password) {
            toast({
                title: "Password is required",
                description: "Set an initial password for the new user.",
                variant: "destructive",
            });
            return;
        }
        if (form.password && form.password.length < 6) {
            toast({
                title: "Password too short",
                description: "Use at least 6 characters.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            if (editing) {
                const body = {
                    name: form.name.trim(),
                    phone: form.phone.trim() || null,
                    role: form.role,
                    active: form.active,
                };
                if (form.password) body.password = form.password;
                // Self-edit protection: don't send role/active for self (server enforces too)
                if (isSelf(editing)) {
                    delete body.role;
                    delete body.active;
                }
                await api(`/api/users/${editing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(body),
                });
                toast({ title: "User updated", description: form.name });
            } else {
                const body = {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim() || null,
                    role: form.role,
                    password: form.password,
                    active: form.active,
                };
                await api("/api/users", { method: "POST", body: JSON.stringify(body) });
                toast({
                    title: "User created",
                    description: `${form.name} can now sign in`,
                });
            }
            setFormOpen(false);
            await load();
        } catch (e) {
            toast({
                title: editing ? "Update failed" : "Create failed",
                description: e.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const confirmDeactivate = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
            toast({
                title: "User deactivated",
                description: `${deleteTarget.name} can no longer sign in`,
            });
            setDeleteTarget(null);
            await load();
        } catch (e) {
            toast({
                title: "Deactivation failed",
                description: e.message,
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Users className="h-5 w-5 text-brand-600" />
                        Team Members
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">{users.length}</span> total ·{" "}
                        <span className="font-medium text-emerald-700">{activeCount}</span> active
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                    <UserPlus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Role legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ROLES.map((r) => {
                    const accent = ROLE_ACCENT[r];
                    const Icon = ROLE_ICON[r];
                    return (
                        <Card key={r} className={cn("py-4 gap-3", accent.border)}>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div
                                        className={cn(
                                            "inline-flex items-center justify-center h-8 w-8 rounded-md",
                                            accent.chip
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-2xl font-semibold tabular-nums">{roleCounts[r]}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
                                        <span className="text-sm font-medium">{t(`role.${r}`, ROLE_LABELS[r])}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {t(`role.${r}.desc`, ROLE_DESCRIPTIONS[r])}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, phone, role…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <Card className="p-0 gap-0 overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="pl-4">User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i} className="border-border">
                                        <TableCell colSpan={6} className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                                    <div className="h-2.5 w-48 bg-muted rounded animate-pulse" />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow className="border-border">
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        {q
                                            ? "No users match your search."
                                            : 'No users yet. Click "Add User" to create one.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((u) => {
                                    const self = isSelf(u);
                                    return (
                                        <TableRow
                                            key={u.id}
                                            className={cn("border-border", self && "bg-brand-50/50")}
                                        >
                                            <TableCell className="pl-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium shrink-0">
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-medium truncate">{u.name}</span>
                                                            {self && (
                                                                <Badge className="bg-brand-100 text-brand-700 border-brand-200 hover:bg-brand-100">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{u.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("font-medium", ROLE_BADGE_CLS[u.role])}
                                                >
                                                    {t(`role.${u.role}`, ROLE_LABELS[u.role])}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {u.phone ? (
                                                    <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {u.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground/60">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {u.active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-slate-100 text-slate-600 border-slate-200"
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1" />
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatRelativeTime(u.lastLoginAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEdit(u)}
                                                        className="h-8 text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Edit</span>
                                                    </Button>
                                                    {self ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled
                                                            className="h-8 text-muted-foreground"
                                                            title="You cannot deactivate your own account"
                                                        >
                                                            <UserX className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Deactivate</span>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteTarget(u)}
                                                            className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                        >
                                                            <UserX className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Deactivate</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={(o) => !saving && setFormOpen(o)}>
                <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit user" : "Add a new user"}</DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Update profile, role and access. Email cannot be changed."
                                : "Create an account for a teammate. They will sign in with their email and password."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="u-name">
                                Full name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="u-name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Selam Bekele"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="u-email">
                                Email <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="u-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="selam@kaldisbunna.et"
                                disabled={!!editing}
                                className={editing ? "bg-muted/50 text-muted-foreground" : ""}
                            />
                            {editing && (
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed after creation.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="u-phone">
                                Phone{" "}
                                <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="u-phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="+251 9..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="u-role">
                                Role <span className="text-rose-500">*</span>
                            </Label>
                            <Select
                                value={form.role}
                                onValueChange={(v) => setForm({ ...form, role: v })}
                                disabled={!!editing && isSelf(editing)}
                            >
                                <SelectTrigger id="u-role" className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {t(`role.${r}`, ROLE_LABELS[r])}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.role && (
                                <p className="text-xs text-muted-foreground">{t(`role.${form.role}.desc`, ROLE_DESCRIPTIONS[form.role])}</p>
                            )}
                            {editing && isSelf(editing) && (
                                <p className="text-xs text-amber-600">You cannot change your own role.</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="u-pw">
                                {editing ? (
                                    <>
                                        Reset password{" "}
                                        <span className="text-muted-foreground font-normal">
                                            (leave blank to keep current)
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Password <span className="text-rose-500">*</span>
                                    </>
                                )}
                            </Label>
                            <Input
                                id="u-pw"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder={editing ? "••••••••" : "Minimum 6 characters"}
                                autoComplete="new-password"
                            />
                            {editing && (
                                <p className="text-xs text-muted-foreground">
                                    Enter a new password here to reset it for this user.
                                </p>
                            )}
                        </div>

                        {editing && (
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                                <div className="space-y-0.5 pr-3">
                                    <Label htmlFor="u-active" className="cursor-pointer">
                                        Active account
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Inactive users cannot sign in, but their history is preserved.
                                    </p>
                                </div>
                                <Switch
                                    id="u-active"
                                    checked={form.active}
                                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                                    disabled={isSelf(editing)}
                                />
                            </div>
                        )}
                        {editing && isSelf(editing) && (
                            <p className="text-xs text-amber-600 -mt-2">
                                You cannot deactivate your own account.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={save}
                            disabled={saving}
                            className="bg-brand-600 text-white hover:bg-brand-700"
                        >
                            {saving && <Spinner className="h-4 w-4" />}
                            {editing ? "Save changes" : "Create user"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate confirmation */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !deleting && !o && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span>
                                Are you sure you want to deactivate{" "}
                                <strong className="text-foreground">{deleteTarget?.name}</strong>? They will no
                                longer be able to sign in. Their account history and audit trail are preserved.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeactivate}
                            disabled={deleting}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                            {deleting && <Spinner className="h-4 w-4" />}
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default UsersView;
