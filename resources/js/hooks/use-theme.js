import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kaldi-theme";

function getInitialTheme() {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }, []);

    return { theme, toggleTheme };
}

export default useTheme;
