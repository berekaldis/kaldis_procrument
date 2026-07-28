import { cn } from "../../lib/utils";

// Simple ScrollArea — just a styled overflow container
export function ScrollArea({ className, children, ...props }) {
    return (
        <div
            className={cn("relative overflow-auto", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export default ScrollArea;
