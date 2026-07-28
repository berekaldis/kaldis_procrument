import { cn } from "../../lib/utils";

export function Checkbox({ checked, onCheckedChange, disabled, className, id, ...props }) {
    return (
        <input
            type="checkbox"
            id={id}
            checked={!!checked}
            disabled={disabled}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className={cn(
                "h-4 w-4 rounded border border-input text-primary cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "accent-brand-600",
                className
            )}
            {...props}
        />
    );
}

export default Checkbox;
