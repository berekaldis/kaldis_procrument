import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { t as translate } from "../lib/i18n";

const STORAGE_KEY = "kaldi-lang";

const LanguageContext = createContext(null);

function getInitialLang() {
    if (typeof localStorage === "undefined") return "en";
    return localStorage.getItem(STORAGE_KEY) === "am" ? "am" : "en";
}

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(getInitialLang);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const toggleLang = useCallback(() => {
        setLang((l) => (l === "am" ? "en" : "am"));
    }, []);

    const t = useCallback((key, fallback) => translate(key, lang, fallback), [lang]);

    const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, toggleLang, t]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return ctx;
}

export default useLanguage;
