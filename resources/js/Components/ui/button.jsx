import { cn } from "../../lib/utils";

const VARIANTS = {
    default: "bg-primary text-primary-foreground shadow-sm hover:bg-brand-700",
    outline: "border border-input bg-card shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-brand-200",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-slate-200",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-rose-700",
    link: "text-primary underline-offset-4 hover:underline",
};

const SIZES = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-6 text-base",
    icon: "h-9 w-9 p-0",
};

export function Button({
    variant = "default",
    size = "default",
    className,
    children,
    ...props
}) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:scale-[0.98]",
                VARIANTS[variant] || VARIANTS.default,
                SIZES[size] || SIZES.default,
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;
