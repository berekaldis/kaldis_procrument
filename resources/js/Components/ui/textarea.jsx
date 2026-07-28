import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                "flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export default Textarea;
