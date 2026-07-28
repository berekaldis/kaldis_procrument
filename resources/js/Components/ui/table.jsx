import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
    return (
        <div className="w-full overflow-x-auto">
            <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
    );
}

export function TableHeader({ className, ...props }) {
    return <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
    return (
        <tr
            className={cn(
                "border-b border-border transition-colors hover:bg-accent/40 data-[state=selected]:bg-muted",
                className
            )}
            {...props}
        />
    );
}

export function TableHead({ className, ...props }) {
    return (
        <th
            className={cn(
                "h-10 px-2 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide",
                className
            )}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }) {
    return <td className={cn("p-2 align-middle", className)} {...props} />;
}

export default Table;
