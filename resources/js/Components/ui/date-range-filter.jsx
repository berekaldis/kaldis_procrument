import { CalendarRange, X } from "lucide-react";
import { Button } from "./button.jsx";

export function DateRangeFilter({ from, to, onFromChange, onToChange }) {
    return (
        <div className="flex items-center gap-1.5">
            <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className="h-9 px-2 rounded-lg border border-input bg-card text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="h-9 px-2 rounded-lg border border-input bg-card text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {(from || to) && (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { onFromChange(""); onToChange(""); }}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}

export default DateRangeFilter;
