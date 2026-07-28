import { useEffect, useState, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings as SettingsIcon,
    CheckCircle2,
    Link2,
    Send,
    Bot,
    RefreshCw,
    ExternalLink,
    Info,
    Webhook,
    AlertTriangle,
    Trash2,
    KeyRound,
    Shuffle,
    ShieldCheck,
    Languages,
    Building2,
    Image as ImageIcon,
    Tag,
    Plus,
    Pencil,
    X,
} from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Badge } from "./ui/badge.jsx";
import { Switch } from "./ui/switch.jsx";
import { api, userCan } from "../lib/procurement";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../hooks/use-language";
import { cn } from "../lib/utils";

export function SettingsView() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [user, setUser] = useState(null);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [registering, setRegistering] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [tab, setTab] = useState("general");
    const { toast } = useToast();
    const { t } = useLanguage();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const s = await api("/api/telegram-status");
            setStatus(s);
            setWebhookUrl((prev) => prev || s.suggestedWebhookBaseUrl || "");
        } catch (e) {
            toast({ title: "Failed to load status", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        api("/api/auth/me").then((d) => setUser(d.user)).catch(() => {});
    }, []);

    const refresh = async () => {
        setChecking(true);
        await load();
        setChecking(false);
        toast({ title: "Status refreshed" });
    };

    const registerWebhook = async () => {
        if (!webhookUrl.trim()) {
            toast({ title: "Enter a public base URL", variant: "destructive" });
            return;
        }
        setRegistering(true);
        try {
            const res = await api("/api/telegram-status/webhook", {
                method: "POST",
                body: JSON.stringify({ url: webhookUrl.trim() }),
            });
            toast({ title: "Webhook registered", description: res.webhookUrl });
            await load();
        } catch (e) {
            toast({ title: "Failed to register webhook", description: e.message, variant: "destructive" });
        } finally {
            setRegistering(false);
        }
    };

    const removeWebhook = async () => {
        setRemoving(true);
        try {
            await api("/api/telegram-status/webhook", { method: "DELETE" });
            toast({ title: "Webhook removed", description: "Bot has fallen back to demo mode for inbound updates." });
            await load();
        } catch (e) {
            toast({ title: "Failed to remove webhook", description: e.message, variant: "destructive" });
        } finally {
            setRemoving(false);
        }
    };

    const configured = status?.configured;
    const webhook = status?.webhook;
    const canManage = userCan(user, "settings.manage");

    return (
        <div className="space-y-4 max-w-3xl">
            {/* Tab switcher */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
                <button
                    onClick={() => setTab("general")}
                    className={cn(
                        "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        tab === "general" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {tab === "general" && (
                        <motion.span layoutId="settings-tab-pill" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    )}
                    <SettingsIcon className="relative h-3.5 w-3.5" />
                    <span className="relative">General</span>
                </button>
                <button
                    onClick={() => setTab("telegram")}
                    className={cn(
                        "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        tab === "telegram" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {tab === "telegram" && (
                        <motion.span layoutId="settings-tab-pill" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    )}
                    <Bot className="relative h-3.5 w-3.5" />
                    <span className="relative">Telegram</span>
                    {!loading && (
                        <span className={cn("relative h-1.5 w-1.5 rounded-full", configured ? "bg-emerald-500" : "bg-amber-500")} />
                    )}
                </button>
                {canManage && (
                    <button
                        onClick={() => setTab("permissions")}
                        className={cn(
                            "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            tab === "permissions" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab === "permissions" && (
                            <motion.span layoutId="settings-tab-pill" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                        )}
                        <ShieldCheck className="relative h-3.5 w-3.5" />
                        <span className="relative">{t("settings.permissions")}</span>
                    </button>
                )}
                {canManage && (
                    <button
                        onClick={() => setTab("categories")}
                        className={cn(
                            "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            tab === "categories" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab === "categories" && (
                            <motion.span layoutId="settings-tab-pill" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                        )}
                        <Tag className="relative h-3.5 w-3.5" />
                        <span className="relative">Categories</span>
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
            <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-4"
            >

            {tab === "general" && (
                <>
                    <OrganizationCard canManage={canManage} />

                    <LanguageCard />

                    {/* Support */}
                    <Card className="p-5">
                        <h4 className="font-medium text-sm mb-2">Need help?</h4>
                        <p className="text-xs text-muted-foreground">
                            This is <b>Phase 1 MVP</b> of Kaldi&apos;s Coffee procurement platform. For issues, contact
                            the product owner. The system is multi-tenant-ready and tracks every action in an
                            append-only audit log for governance.
                        </p>
                    </Card>
                </>
            )}

            {tab === "telegram" && (
                <>
                    {canManage && <TelegramConfigCard onSaved={load} />}

                    {/* Bot status */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div
                                className={cn(
                                    "grid place-items-center h-12 w-12 rounded-lg shrink-0",
                                    configured ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
                                )}
                            >
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold">{t("settings.telegramBot")}</h3>
                                    {configured ? (
                                        <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t("settings.connected")}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                            <Info className="h-3 w-3" />
                                            {t("settings.notConnected")}
                                        </Badge>
                                    )}
                                </div>
                                {loading ? (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        <Spinner className="h-4 w-4 inline mr-1" />
                                        Checking status…
                                    </div>
                                ) : configured ? (
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div>
                                            Bot username:{" "}
                                            <span className="font-mono font-medium">
                                                {status.botInfo?.username ? `@${status.botInfo.username}` : "—"}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            Name: {status.botInfo?.firstName || "—"} · ID: {status.botInfo?.id ?? "—"}
                                        </div>
                                        <div className="text-muted-foreground">
                                            Linked suppliers: {status.linkedSuppliers}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        Bot token not configured. Outbound messages are logged (visible in Telegram Outbox)
                                        but not delivered, and you can manually log supplier responses from the Proformas
                                        section. Add a bot token in Telegram Configuration above to connect.
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" size="sm" onClick={refresh} disabled={checking}>
                                <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} />
                            </Button>
                        </div>
                    </Card>

                    {/* Webhook management */}
                    {configured && (
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Webhook className="h-4 w-4 text-brand-600" />
                                <h3 className="font-semibold">{t("settings.webhook")}</h3>
                                {webhook?.url ? (
                                    <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Registered
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="gap-1 bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                        Not registered
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                                Telegram delivers supplier replies (linking, quotations, attachments) to this URL in
                                real time. Requires a public HTTPS address — Telegram cannot reach localhost.
                            </p>

                            {!status.webhookSecretConfigured && (
                                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 mb-3">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>
                                        No webhook secret configured yet. Set one in the{" "}
                                        <b>Telegram Configuration</b> card above before registering.
                                    </span>
                                </div>
                            )}

                            {webhook?.url && (
                                <div className="text-sm space-y-1 mb-3 rounded-md bg-muted/30 border p-3">
                                    <div className="font-mono text-xs break-all">{webhook.url}</div>
                                    <div className="text-xs text-muted-foreground">Pending updates: {webhook.pendingUpdateCount}</div>
                                    {webhook.lastErrorMessage && (
                                        <div className="text-xs text-rose-600 dark:text-rose-300">
                                            Last error: {webhook.lastErrorMessage}
                                            {webhook.lastErrorDate && ` (${new Date(webhook.lastErrorDate).toLocaleString()})`}
                                        </div>
                                    )}
                                </div>
                            )}

                            {canManage ? (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs font-medium mb-1.5 block">Public base URL</Label>
                                        <Input
                                            value={webhookUrl}
                                            onChange={(e) => setWebhookUrl(e.target.value)}
                                            placeholder="https://your-domain.com"
                                            disabled={!status.webhookSecretConfigured}
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <Button onClick={registerWebhook} disabled={registering || !status.webhookSecretConfigured}>
                                            {registering && <Spinner className="h-4 w-4 mr-1" />}
                                            {webhook?.url ? "Update" : "Register"}
                                        </Button>
                                        {webhook?.url && (
                                            <Button variant="outline" onClick={removeWebhook} disabled={removing}>
                                                {removing ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Only administrators can manage the webhook.</p>
                            )}

                            <p className="text-[11px] text-muted-foreground mt-3">
                                Prefer the CLI? <code className="bg-muted px-1 py-0.5 rounded">php artisan telegram:webhook:set &lt;url&gt;</code>,{" "}
                                <code className="bg-muted px-1 py-0.5 rounded">telegram:webhook:info</code>, or{" "}
                                <code className="bg-muted px-1 py-0.5 rounded">telegram:webhook:remove</code>.
                            </p>
                        </Card>
                    )}

                    {!configured && (
                        <Card className="p-5 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm text-amber-900 dark:text-amber-300">Telegram bot not connected</h4>
                                    <p className="text-xs text-amber-800/80 dark:text-amber-300/70 mt-1">
                                        Suppliers won't receive proforma requests until a bot token is configured above. In
                                        the meantime, use <b>Log Manual Response</b> in the Proformas section to record
                                        quotes received by phone or email.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Setup guide */}
                    <Card className="p-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <SettingsIcon className="h-4 w-4 text-brand-600" />
                            How to connect a real Telegram bot
                        </h3>
                        <ol className="space-y-3 text-sm">
                            <Step n={1}>
                                Open <a className="text-brand-600 underline inline-flex items-center gap-0.5" href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"> @BotFather <ExternalLink className="h-3 w-3" /></a>{" "}
                                in Telegram and send <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/newbot</code>.
                            </Step>
                            <Step n={2}>
                                Follow the prompts to name your bot (e.g. "Kaldi's Coffee Procurement Bot") and choose a
                                username ending in <code className="bg-muted px-1.5 py-0.5 rounded text-xs">bot</code>.
                            </Step>
                            <Step n={3}>
                                Copy the API token BotFather returns. It looks like{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">123456789:ABCdefGHI…</code>
                            </Step>
                            <Step n={4}>
                                Paste the token (and generate a webhook secret) in the <b>Telegram Configuration</b> card
                                above — no <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code> editing needed.
                            </Step>
                            <Step n={5}>
                                Register the webhook above (or via{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">php artisan telegram:webhook:set</code>)
                                with your public HTTPS URL — a deployed domain, or an{" "}
                                <a className="text-brand-600 underline" href="https://ngrok.com" target="_blank" rel="noopener noreferrer">ngrok</a>{" "}
                                tunnel while developing locally.
                            </Step>
                            <Step n={6}>
                                Tell suppliers to open your bot in Telegram, send <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/start</code>, and
                                reply with their company TIN to link their chat. Once linked, they&apos;ll receive proforma
                                requests and can reply with files, photos, or text — each one lands here automatically.
                            </Step>
                        </ol>
                    </Card>

                    {/* Architecture summary */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Send className="h-4 w-4 text-sky-600" />
                                <h4 className="font-medium text-sm">Outbound (Web → Supplier)</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                When a purchaser sends a proforma request, the Laravel API calls Telegram{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded">sendMessage</code> for each linked
                                supplier. Messages are logged in the <code className="bg-muted px-1.5 py-0.5 rounded">telegram_outbox</code> table with status sent/failed/simulated.
                            </p>
                        </Card>
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Link2 className="h-4 w-4 text-cyan-600" />
                                <h4 className="font-medium text-sm">Inbound (Supplier → Web)</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Telegram pushes updates to our{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded">/api/telegram/webhook/&#123;secret&#125;</code>{" "}
                                endpoint in real time — no polling. It links suppliers by TIN, downloads attached files,
                                creates <code className="bg-muted px-1.5 py-0.5 rounded">Proforma</code> records, and writes
                                notifications + audit logs immediately.
                            </p>
                        </Card>
                    </div>
                </>
            )}

            {tab === "permissions" && canManage && <PermissionsCard />}

            {tab === "categories" && canManage && <CategoriesCard />}

            </motion.div>
            </AnimatePresence>
        </div>
    );
}

function OrganizationCard({ canManage }) {
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [tin, setTin] = useState("");
    const [address, setAddress] = useState("");
    const [currency, setCurrency] = useState("ETB");
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const o = await api("/api/organization");
            setOrg(o);
            setName(o.name || "");
            setTin(o.tin || "");
            setAddress(o.address || "");
            setCurrency(o.currency || "ETB");
        } catch (e) {
            toast({ title: "Failed to load organization", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        setSaving(true);
        try {
            const o = await api("/api/organization", {
                method: "PATCH",
                body: JSON.stringify({ name, tin, address, currency }),
            });
            setOrg(o);
            toast({ title: "Organization profile saved" });
        } catch (e) {
            toast({ title: "Failed to save", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const uploadLogo = async (file) => {
        if (!file) return;
        setUploadingLogo(true);
        try {
            const form = new FormData();
            form.append("logo", file);
            const res = await fetch("/api/organization/logo", {
                method: "POST",
                body: form,
                credentials: "same-origin",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || j.message || `Request failed (${res.status})`);
            }
            setOrg(await res.json());
            toast({ title: "Logo updated" });
        } catch (e) {
            toast({ title: "Upload failed", description: e.message, variant: "destructive" });
        } finally {
            setUploadingLogo(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold">Organization Profile</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Company details used on record — Kaldi&apos;s Coffee&apos;s brand identity in the app itself stays fixed.
            </p>

            {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4 inline mr-1" />
                    Loading…
                </div>
            ) : (
                <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                        <div className="grid place-items-center h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                            {org?.logoPath ? (
                                <img src={`/${org.logoPath}`} alt="Organization logo" className="h-full w-full object-cover" />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                        </div>
                        {canManage && (
                            <label className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer inline-flex items-center gap-1">
                                {uploadingLogo ? <Spinner className="h-3.5 w-3.5" /> : null}
                                Change logo
                                <input
                                    type="file"
                                    className="hidden"
                                    disabled={uploadingLogo}
                                    onChange={(e) => { uploadLogo(e.target.files?.[0]); e.target.value = ""; }}
                                    accept=".jpg,.jpeg,.png,.webp,.svg"
                                />
                            </label>
                        )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">Company Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} />
                        </div>
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">TIN</Label>
                            <Input value={tin} onChange={(e) => setTin(e.target.value)} disabled={!canManage} />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Address</Label>
                        <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canManage} />
                    </div>
                    <div className="sm:w-40">
                        <Label className="text-xs font-medium mb-1.5 block">Currency</Label>
                        <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!canManage} />
                    </div>
                    {canManage && (
                        <Button onClick={save} disabled={saving} className="w-fit">
                            {saving && <Spinner className="h-4 w-4 mr-1" />}
                            Save Organization Profile
                        </Button>
                    )}
                </div>
            )}
        </Card>
    );
}

function LanguageCard() {
    const { lang, toggleLang, t } = useLanguage();
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="grid place-items-center h-10 w-10 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 shrink-0">
                        <Languages className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{t("settings.language")}</h3>
                        <p className="text-xs text-muted-foreground">
                            {lang === "am" ? "በአሁኑ ጊዜ በአማርኛ" : "Currently displaying in English"}
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={toggleLang}>
                    {lang === "am" ? "Switch to English" : "ወደ አማርኛ ቀይር"}
                </Button>
            </div>
        </Card>
    );
}

function TelegramConfigCard({ onSaved }) {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [botToken, setBotToken] = useState("");
    const [botUsername, setBotUsername] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { toast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const c = await api("/api/settings/telegram");
            setConfig(c);
            setBotUsername(c.botUsername || "");
            setWebhookSecret(c.webhookSecret || "");
        } catch (e) {
            toast({ title: "Failed to load Telegram configuration", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const generateSecret = async () => {
        setGenerating(true);
        try {
            const res = await api("/api/settings/telegram/generate-secret", { method: "POST" });
            setWebhookSecret(res.secret);
        } catch (e) {
            toast({ title: "Failed to generate secret", description: e.message, variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            const body = { botUsername: botUsername.trim() || null, webhookSecret: webhookSecret.trim() || null };
            if (botToken.trim()) body.botToken = botToken.trim();
            await api("/api/settings/telegram", { method: "PATCH", body: JSON.stringify(body) });
            toast({ title: "Telegram configuration saved" });
            setBotToken("");
            await load();
            await onSaved?.();
        } catch (e) {
            toast({ title: "Failed to save", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <KeyRound className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold">Telegram Configuration</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Configure the bot entirely from here — no server access or <code className="bg-muted px-1 py-0.5 rounded">.env</code> editing required.
            </p>

            {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4 inline mr-1" />
                    Loading…
                </div>
            ) : (
                <div className="grid gap-4">
                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Bot Token (from @BotFather)</Label>
                        <Input
                            type="password"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            placeholder={config?.botTokenSet ? "•••••••••••••••••••• (configured — leave blank to keep)" : "123456789:ABCdefGHI…"}
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Bot Username</Label>
                        <Input
                            value={botUsername}
                            onChange={(e) => setBotUsername(e.target.value)}
                            placeholder="kaldis_procurement_bot"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-medium mb-1.5 block">Webhook Secret</Label>
                        <div className="flex gap-2">
                            <Input
                                value={webhookSecret}
                                onChange={(e) => setWebhookSecret(e.target.value)}
                                placeholder="Random string used to authenticate webhook calls"
                                className="font-mono text-xs"
                            />
                            <Button type="button" variant="outline" onClick={generateSecret} disabled={generating}>
                                {generating ? <Spinner className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <Button onClick={save} disabled={saving} className="w-fit">
                        {saving && <Spinner className="h-4 w-4 mr-1" />}
                        Save Configuration
                    </Button>
                </div>
            )}
        </Card>
    );
}

function PermissionsCard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState(null);
    const { toast } = useToast();
    const { t } = useLanguage();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const d = await api("/api/permissions");
            setData(d);
        } catch (e) {
            toast({ title: "Failed to load permissions", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const toggle = async (role, permission, enabled) => {
        const key = `${role}:${permission}`;
        setPending(key);
        // Optimistic update
        setData((d) => ({ ...d, matrix: { ...d.matrix, [role]: { ...d.matrix[role], [permission]: enabled } } }));
        try {
            await api("/api/permissions", { method: "PATCH", body: JSON.stringify({ role, permission, enabled }) });
        } catch (e) {
            toast({ title: "Failed to update permission", description: e.message, variant: "destructive" });
            // Revert
            setData((d) => ({ ...d, matrix: { ...d.matrix, [role]: { ...d.matrix[role], [permission]: !enabled } } }));
        } finally {
            setPending(null);
        }
    };

    if (loading || !data) {
        return (
            <Card className="p-6">
                <div className="py-6 text-center text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4 inline mr-1" />
                    Loading permissions…
                </div>
            </Card>
        );
    }

    const groups = data.permissions.reduce((acc, p) => {
        (acc[p.group] ||= []).push(p);
        return acc;
    }, {});

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold">{t("settings.permissions")}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Toggle exactly what each role can do. Administrators always have full access and aren&apos;t shown here —
                changes take effect immediately for every user with that role.
            </p>

            <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm min-w-[520px]">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 font-medium text-xs text-muted-foreground uppercase tracking-wide">Permission</th>
                            {data.roles.map((r) => (
                                <th key={r.value} className="text-center py-2 font-medium text-xs w-24">
                                    {t(`role.${r.value}`, r.label)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groups).map(([group, perms]) => (
                            <Fragment key={group}>
                                <tr className="bg-muted/30">
                                    <td colSpan={data.roles.length + 1} className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        {group}
                                    </td>
                                </tr>
                                {perms.map((p) => (
                                    <tr key={p.value} className="border-b border-border/60 last:border-b-0">
                                        <td className="py-2 pr-2">{p.label}</td>
                                        {data.roles.map((r) => (
                                            <td key={r.value} className="text-center py-2">
                                                <Switch
                                                    checked={!!data.matrix[r.value]?.[p.value]}
                                                    disabled={pending === `${r.value}:${p.value}`}
                                                    onCheckedChange={(v) => toggle(r.value, p.value, v)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function CategoriesCard() {
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
        load();
    }, [load]);

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
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <Tag className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold">Categories</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Used to tag suppliers and filter them when creating proforma requests. Changes here apply
                everywhere categories are used across the app.
            </p>

            <div className="flex gap-2 mb-4">
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

            <div className="max-h-96 overflow-y-auto space-y-1 -mx-1 px-1">
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
        </Card>
    );
}

function Step({ n, children }) {
    return (
        <li className="flex gap-3">
            <span className="grid place-items-center h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-medium shrink-0">
                {n}
            </span>
            <div className="pt-0.5">{children}</div>
        </li>
    );
}

export default SettingsView;
