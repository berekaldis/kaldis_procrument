import { useEffect, useState } from "react";
import { User, Lock } from "lucide-react";
import { Spinner } from "./ui/spinner.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "./ui/dialog.jsx";
import { api } from "../lib/procurement";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../hooks/use-language";

export function ProfileDialog({ open, onOpenChange, user, onUpdated }) {
    const { toast } = useToast();
    const { t } = useLanguage();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (open && user) {
            setName(user.name || "");
            setPhone(user.phone || "");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    }, [open, user]);

    const saveProfile = async () => {
        if (!name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        setSavingProfile(true);
        try {
            const res = await api("/api/profile", {
                method: "PATCH",
                body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
            });
            toast({ title: "Profile updated" });
            onUpdated?.(res.user);
        } catch (e) {
            toast({ title: "Failed to update profile", description: e.message, variant: "destructive" });
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast({ title: "Fill in both password fields", variant: "destructive" });
            return;
        }
        if (newPassword.length < 8) {
            toast({ title: "New password must be at least 8 characters", variant: "destructive" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Passwords don't match", variant: "destructive" });
            return;
        }
        setSavingPassword(true);
        try {
            await api("/api/profile/password", {
                method: "POST",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            toast({ title: "Password changed" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (e) {
            toast({ title: "Failed to change password", description: e.message, variant: "destructive" });
        } finally {
            setSavingPassword(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-brand-600" />
                        {t("profile.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {user.email} · {t(`role.${user.role}`, user.role)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-3">
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">{t("common.name")}</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-xs font-medium mb-1.5 block">{t("common.phone")}</Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251…" />
                        </div>
                        <Button size="sm" onClick={saveProfile} disabled={savingProfile} className="w-fit">
                            {savingProfile && <Spinner className="h-4 w-4 mr-1" />}
                            {t("profile.saveProfile")}
                        </Button>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            {t("profile.changePassword")}
                        </Label>
                        <Input
                            type="password"
                            placeholder={t("profile.currentPassword")}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder={t("profile.newPassword")}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder={t("profile.confirmPassword")}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button size="sm" variant="outline" onClick={savePassword} disabled={savingPassword} className="w-fit">
                            {savingPassword && <Spinner className="h-4 w-4 mr-1" />}
                            {t("profile.changePassword")}
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("common.close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ProfileDialog;
