import { createContext, useContext, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const DialogContext = createContext(null);

export function Dialog({ open, onOpenChange, children, containerClassName }) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;
    return (
        <DialogContext.Provider value={{ onOpenChange }}>
            <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto", containerClassName)}>
                {/* Backdrop does NOT close modal on click per user requirement — only X button closes */}
                <div
                    className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm animate-procurement-fade-in"
                    aria-hidden="true"
                />
                {children}
            </div>
        </DialogContext.Provider>
    );
}

export function DialogContent({ className, children, showClose = true, ...props }) {
    const ctx = useContext(DialogContext);
    const handleClose = () => ctx?.onOpenChange?.(false);

    return (
        <div
            className={cn(
                "relative z-10 w-full max-w-xl my-auto max-h-[88vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl shadow-slate-950/15 animate-procurement-scale-in",
                className
            )}
            {...props}
        >
            {showClose && ctx?.onOpenChange && (
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/80 dark:hover:text-rose-400 border border-border/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-20 shadow-sm"
                    aria-label="Close modal"
                    title="Close (Esc)"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            {children}
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn("flex flex-col space-y-1.5 mb-4 pr-6", className)} {...props} />;
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
