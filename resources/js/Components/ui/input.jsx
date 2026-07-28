import { cn } from "../../lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef(function Input({ className, ...props }, ref) {
    return (
        <input
            ref={ref}
            className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
});

export default Input;
