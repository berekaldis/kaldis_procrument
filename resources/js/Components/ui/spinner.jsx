import { cn } from "../../lib/utils";

// Two-tone rotating ring spinner — brand espresso + gold accent, replaces
// the plain lucide Loader2 icon everywhere loading/saving state is shown.
export function Spinner({ className }) {
    return (
        <span className={cn("relative inline-block shrink-0", className)} role="status" aria-label="Loading">
            <span className="absolute inset-0 rounded-full border-2 border-brand-200/50 dark:border-brand-800/50" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-600 border-r-gold-500 dark:border-t-gold-400 dark:border-r-brand-400 animate-spin" />
        </span>
    );
}

export default Spinner;
