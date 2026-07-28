import { useToast } from "../hooks/use-toast";

export function Toaster() {
    const { toasts, dismiss } = useToast();
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`rounded-lg border shadow-lg p-4 pr-8 relative bg-white text-sm ${
                        t.variant === "destructive"
                            ? "border-rose-200 bg-rose-50 text-rose-900"
                            : "border-emerald-200 bg-white text-gray-900"
                    }`}
                >
                    {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
                    {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    <button
                        onClick={() => dismiss(t.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
