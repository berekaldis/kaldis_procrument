import { useEffect } from "react";
import { cn } from "../../lib/utils";

// Simple AlertDialog — modal styled like shadcn's AlertDialog but built on plain divs
export function AlertDialog({ open, onOpenChange, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onOpenChange?.(false);
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onOpenChange]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-procurement-fade-in"
                onClick={() => onOpenChange?.(false)}
            />
            {children}
        </div>
    );
}

export function AlertDialogContent({ className, children, ...props }) {
    return (
        <div
            className={cn(
                "relative z-10 w-full max-w-md rounded-xl border border-border/70 bg-card p-6 shadow-2xl shadow-slate-950/10 animate-procurement-scale-in",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function AlertDialogHeader({ className, ...props }) {
    return <div className={cn("flex flex-col space-y-2 mb-4", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
    return (
        <div
            className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
            {...props}
        />
    );
}

export function AlertDialogTitle({ className, ...props }) {
    return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

export function AlertDialogDescription({ className, children, ...props }) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)} {...props}>
            {children}
        </p>
    );
}

export function AlertDialogAction({ className, ...props }) {
    return (
        <button
            className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-brand-700",
                "disabled:pointer-events-none disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export function AlertDialogCancel({ className, ...props }) {
    return (
        <button
            className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "disabled:pointer-events-none disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export default AlertDialog;
