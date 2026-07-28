import { cn } from "../../lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
            {Icon && (
                <div className="grid place-items-center h-12 w-12 rounded-full bg-slate-100 text-slate-400 mb-3">
                    <Icon className="h-6 w-6" />
                </div>
            )}
            {title && <h3 className="font-semibold text-sm text-foreground">{title}</h3>}
            {description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export default EmptyState;
