import { cn } from "../../lib/utils";
import { useEffect } from "react";

// Sheet — slide-in drawer from the right.
export function Sheet({ open, onOpenChange, children }) {
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
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-procurement-fade-in"
                onClick={() => onOpenChange?.(false)}
            />
            {children}
        </div>
    );
}

export function SheetContent({ className, children, ...props }) {
    return (
        <div
            className={cn(
                "absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border/70 shadow-2xl shadow-slate-950/10 overflow-y-auto animate-procurement-slide-in-right",
                className
            )}
            {...props}
        >
            <div className="p-6">{children}</div>
        </div>
    );
}

export function SheetHeader({ className, ...props }) {
    return <div className={cn("flex flex-col space-y-2 mb-4", className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
    );
}

export function SheetDescription({ className, ...props }) {
    return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export default Sheet;
