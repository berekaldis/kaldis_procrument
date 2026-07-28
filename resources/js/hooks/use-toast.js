// Minimal toast hook — simple console + state-based toasts for the Laravel port
import { useState, useCallback, useEffect } from "react";

const listeners = new Set();
let counter = 0;

export function toast({ title, description, variant = "default" }) {
    const id = ++counter;
    const t = { id, title, description, variant };
    listeners.forEach((fn) => fn(t));
    // Auto-dismiss after 4s
    setTimeout(() => {
        listeners.forEach((fn) => fn({ ...t, dismiss: true }));
    }, 4000);
    console.log(`[toast] ${title}${description ? ": " + description : ""}`);
}

export function useToast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (t) => {
            if (t.dismiss) {
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
            } else {
                setToasts((prev) => [...prev, t]);
            }
        };
        listeners.add(handler);
        return () => listeners.delete(handler);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
    }, []);

    return { toasts, toast, dismiss };
}
