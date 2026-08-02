import { createContext, useContext, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const SheetContext = createContext(null);

// Sheet — slide-in drawer from the right.
export function Sheet({ open, onOpenChange, children }) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;
    return (
        <SheetContext.Provider value={{ onOpenChange }}>
            <div className="fixed inset-0 z-50">
                {/* Backdrop does NOT close sheet on click per user requirement — only X button closes */}
                <div
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-procurement-fade-in"
                    aria-hidden="true"
                />
                {children}
            </div>
        </SheetContext.Provider>
    );
}

export function SheetContent({ className, children, showClose = true, ...props }) {
    const ctx = useContext(SheetContext);
    const handleClose = () => ctx?.onOpenChange?.(false);

    return (
        <div
            className={cn(
                "absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border/70 shadow-2xl shadow-slate-950/10 overflow-y-auto animate-procurement-slide-in-right",
                className
            )}
            {...props}
        >
            {showClose && ctx?.onOpenChange && (
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-20"
                    aria-label="Close"
                    title="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}

export function SheetHeader({ className, ...props }) {
    return <div className={cn("flex flex-col space-y-2 mb-4 pr-6", className)} {...props} />;
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
