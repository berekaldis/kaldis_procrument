import { cn } from "../../lib/utils";
import { useEffect } from "react";

export function Dialog({ open, onOpenChange, children }) {
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
            <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-procurement-fade-in"
                onClick={() => onOpenChange?.(false)}
            />
            {children}
        </div>
    );
}

export function DialogContent({ className, children, ...props }) {
    return (
        <div
            className={cn(
                "relative z-10 w-full max-w-lg my-8 rounded-xl border border-border/70 bg-card p-6 shadow-2xl shadow-slate-950/10 animate-procurement-scale-in",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
    return (
        <div
            className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 pt-4 border-t border-border/70", className)}
            {...props}
        />
    );
}

export function DialogTitle({ className, ...props }) {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
    );
}

export function DialogDescription({ className, ...props }) {
    return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export default Dialog;
