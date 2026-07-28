import { useEffect, useRef, useState } from "react";

// Animates a numeric value from its previous value to `target` with an
// ease-out curve. Non-numeric targets (e.g. pre-formatted "42%" / "5h" / "—"
// strings) pass through unchanged on the first render.
export function useCountUp(target, duration = 700) {
    const isNumber = typeof target === "number" && !Number.isNaN(target);
    const [value, setValue] = useState(isNumber ? 0 : target);
    const prevTarget = useRef(isNumber ? 0 : target);

    useEffect(() => {
        if (!isNumber) {
            setValue(target);
            return;
        }

        const from = prevTarget.current;
        const to = target;
        prevTarget.current = target;

        if (from === to) {
            setValue(to);
            return;
        }

        const start = performance.now();
        let raf;
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(from + (to - from) * eased));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration, isNumber]);

    return value;
}
