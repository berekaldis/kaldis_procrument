import { cn } from "../../lib/utils";

// Simple native-select wrapper styled like shadcn's Select
export function Select({ value, onValueChange, disabled, className, children }) {
    // Only SelectContent's children (SelectItem -> <option>) are valid <select> children;
    // SelectValue is a visual-API-compat no-op. SelectTrigger's className (sizing hints
    // like "w-44") is honored on the wrapper, but its own children are not rendered —
    // the native <select> below is the real control.
    const childArr = Array.isArray(children) ? children : [children];
    const trigger = childArr.find((c) => c && c.type === SelectTrigger);
    const options = childArr.find((c) => c && c.type === SelectContent)?.props.children ?? null;
    return (
        <div className={cn("relative", trigger?.props.className, className)}>
            <select
                value={value ?? ""}
                disabled={disabled}
                onChange={(e) => onValueChange?.(e.target.value)}
                className={cn(
                    "flex h-9 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-8 py-1 text-sm shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                )}
            >
                {options}
            </select>
            <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
        </div>
    );
}

export function SelectTrigger({ className, children, ...props }) {
    // For visual API compatibility — not rendered; see Select above.
    return <div className={cn("w-full", className)} {...props}>{children}</div>;
}

export function SelectValue({ placeholder, className }) {
    // Visually a no-op — the Select above renders natively
    return null;
}

export function SelectContent({ children }) {
    // Children are <option> elements (SelectItem renders <option>)
    return <>{children}</>;
}

export function SelectItem({ value, children }) {
    return <option value={value}>{children}</option>;
}

export default Select;
