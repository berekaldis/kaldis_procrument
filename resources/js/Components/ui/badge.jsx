import { cn } from "../../lib/utils";

const VARIANTS = {
    default: "border-transparent bg-accent text-accent-foreground hover:bg-brand-100",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-slate-200",
    outline: "text-foreground border-border",
    destructive: "border-transparent bg-rose-100 text-rose-900 hover:bg-rose-200",
};

export function Badge({ variant = "default", className, ...props }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
                VARIANTS[variant] || VARIANTS.default,
                className
            )}
            {...props}
        />
    );
}

export default Badge;
