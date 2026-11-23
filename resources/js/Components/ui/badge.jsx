import { cn } from "../../lib/utils";

const VARIANTS = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border-border",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
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
